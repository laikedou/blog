import { Injectable } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { CloudflareAiService } from '../common/cloudflare-ai.service';
import { NotificationsGateway } from '../common/notifications.gateway';
import { CreateCrawlSourceDto, UpdateCrawlSourceDto } from './dto/crawl.dto';
import * as cheerio from 'cheerio';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class CrawlService {
  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
    private cloudflareAi: CloudflareAiService,
    private notifications: NotificationsGateway,
  ) {}

  private readonly MAX_URLS_PER_CRAWL = 200;
  private readonly MAX_PAGES_TO_CRAWL = 20;

  // ---- Sources CRUD ----

  async getSources() {
    return this.prisma.crawlSource.findMany({
      include: { _count: { select: { articles: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createSource(dto: CreateCrawlSourceDto) {
    return this.prisma.crawlSource.create({ data: dto });
  }

  async updateSource(id: number, dto: UpdateCrawlSourceDto) {
    return this.prisma.crawlSource.update({ where: { id }, data: dto });
  }

  async deleteSource(id: number) {
    return this.prisma.crawlSource.delete({ where: { id } });
  }

  // ---- Articles ----

  async getArticles(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.crawledArticle.findMany({
        skip,
        take: limit,
        include: { source: { select: { name: true, url: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.crawledArticle.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getArticle(id: number) {
    return this.prisma.crawledArticle.findUniqueOrThrow({
      where: { id },
      include: { source: { select: { name: true, url: true } } },
    });
  }

  async deleteArticle(id: number) {
    return this.prisma.crawledArticle.delete({ where: { id } });
  }

  // ---- Crawling ----

  async crawlSource(id: number) {
    const source = await this.prisma.crawlSource.findUniqueOrThrow({ where: { id } });

    await this.prisma.crawlSource.update({
      where: { id },
      data: { lastRunAt: new Date() },
    });

    this.notifications.notifyCrawlStarted({
      sourceId: id,
      sourceName: source.name,
      startedAt: new Date().toISOString(),
    });

    // 1. Fetch and analyze the listing page
    const html = await this.fetchPage(source.url);
    const cleanHtml = this.stripHtmlForAnalysis(html);
    const $ = cheerio.load(html);

    // 2. AI-powered listing analysis with cheerio fallback
    let pageInfo: { totalArticles: number; currentPage: number; totalPages: number; paginationPattern: string | null };
    try {
      pageInfo = await this.aiService.analyzeListingPage({ html: cleanHtml, url: source.url });
    } catch {
      pageInfo = await this.analyzeListingPageFallback($, source.url);
    }
    // Ensure at least 1 page
    if (!pageInfo.totalPages || pageInfo.totalPages < 1) pageInfo.totalPages = 1;

    // 3. Multi-page URL collection
    const articleUrls = await this.crawlListingPages(source, pageInfo, $);

    // 4. Process each article
    const results = { discovered: articleUrls.length, new: 0, skipped: 0, errors: 0, autoPublished: 0 };

    for (const url of articleUrls) {
      try {
        // Check source still exists — may have been deleted during the crawl
        const sourceStillExists = await this.prisma.crawlSource.findUnique({ where: { id }, select: { id: true } });
        if (!sourceStillExists) {
          console.error(`Source ${id} was deleted during crawl, aborting remaining articles`);
          break;
        }

        const article = await this.extractArticle(url);
        if (!article) {
          results.errors++;
          continue;
        }

        // AI rewrite before saving
        const rewritten = await this.aiService.rewriteArticle({
          title: article.title,
          content: article.content,
          excerpt: article.excerpt,
          sourceName: source.name,
        });
        article.title = rewritten.title;
        article.content = rewritten.content;
        article.excerpt = rewritten.excerpt;

        // Download image locally, then transform through Cloudflare AI
        if (article.imageUrl) {
          article.imageUrl = await this.downloadImage(article.imageUrl);
          if (article.imageUrl && !article.imageUrl.startsWith('/')) {
            article.imageUrl = await this.cloudflareAi.transformImage(
              article.imageUrl,
              'professional blog cover image, clean modern style, high quality',
              0.55,
            );
          }
        }

        // Transform images in content through Cloudflare img2img
        article.content = await this.cloudflareAi.transformImagesInContent(
          article.content,
          'professional illustration, clean style, high quality',
        );

        // Upsert: update existing or create new
        const existing = await this.prisma.crawledArticle.findUnique({
          where: { sourceUrl: url },
        });

        let savedArticle: any;
        if (existing) {
          savedArticle = await this.prisma.crawledArticle.update({
            where: { id: existing.id },
            data: {
              title: article.title,
              content: article.content,
              excerpt: article.excerpt || '',
              authorName: article.author || '',
              publishedDate: article.pubDate ? new Date(article.pubDate) : null,
              imageUrl: article.imageUrl || '',
              isProcessed: false,
            },
          });
          results.skipped++;
        } else {
          savedArticle = await this.prisma.crawledArticle.create({
            data: {
              sourceId: id,
              sourceUrl: url,
              title: article.title,
              content: article.content,
              excerpt: article.excerpt || '',
              authorName: article.author || '',
              publishedDate: article.pubDate ? new Date(article.pubDate) : null,
              imageUrl: article.imageUrl || '',
            },
          });
          results.new++;
        }

        this.notifications.notifyArticleCrawled({
          articleId: savedArticle.id,
          title: article.title,
          sourceName: source.name,
          sourceUrl: url,
          crawledAt: new Date().toISOString(),
          status: existing ? 'updated' : 'new',
        });

        // Auto-publish as draft if not already published
        if (!existing?.isPublished) {
          await this.autoPublishAsDraft(savedArticle, source);
          results.autoPublished++;
        }
      } catch (err) {
        console.error(`Failed to crawl ${url}:`, err.message);
        results.errors++;
      }
    }

    this.notifications.notifyCrawlComplete({
      sourceId: id,
      sourceName: source.name,
      results,
      completedAt: new Date().toISOString(),
    });

    return results;
  }

  // ---- AI Processing & Publishing ----

  private isChinese(text: string): boolean {
    const cjkRegex = /[一-鿿㐀-䶿豈-﫿]/g;
    const cjkChars = text.match(cjkRegex);
    if (!cjkChars) return false;
    const plain = text.replace(/<[^>]*>/g, '').trim();
    return cjkChars.length / (plain.length || 1) > 0.15;
  }

  private removeCopyright(text: string): string {
    const patterns = [
      /©[\s\S]{0,200}(?:all\s+rights\s+reserved|保留所有权利|版权所有|copyright|侵权必究)/i,
      /(?:all\s+rights\s+reserved|保留所有权利|版权所有|copyright|侵权必究)[\s\S]{0,200}©/i,
      /copyright\s+©\s*\d{4}[\s\S]{0,200}/i,
      /本文(?:版权|著作权|系).{0,100}(?:所有|必究|追究)/,
      /未经.{0,30}(?:许可|授权).{0,80}(?:转载|复制|禁止)/,
      /转载请.{0,80}(?:联系|注明|保留)/,
      /欢迎转载.{0,80}但请.{0,80}/,
      /^[\s\-_—―]*\d+\s*(words|分钟阅读).*$/im,
    ];
    let result = text;
    for (const p of patterns) {
      result = result.replace(p, '');
    }
    // Remove standalone copyright symbol lines
    result = result.replace(/^[ \t]*©[ \t]*\d{4}.*$/gm, '');
    result = result.replace(/^[ \t]*—\s*original\s+article\s*—\s*$/gim, '');
    return result.trim();
  }

  private async translateToChinese(text: string): Promise<string> {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    const baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    const model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

    if (!apiKey) return text;

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 4000,
          messages: [
            { role: 'system', content: 'You are a professional translator. Translate the entire article to Chinese (中文). Preserve all HTML structure exactly — do not change or remove HTML tags. Only translate text content inside tags. Return only the translated HTML, no explanations.' },
            { role: 'user', content: text },
          ],
        }),
      });
      if (!res.ok) return text;
      const data = await res.json();
      return data.choices?.[0]?.message?.content || text;
    } catch (err) {
      console.error('Translation failed:', err.message);
      return text;
    }
  }

  async publishArticle(id: number) {
    const article = await this.prisma.crawledArticle.findUniqueOrThrow({
      where: { id },
      include: { source: true },
    });

    let processedContent = this.removeCopyright(article.content);
    let processedTitle = this.removeCopyright(article.title);

    // Translate non-Chinese articles to Chinese
    if (!this.isChinese(processedContent)) {
      processedContent = await this.translateToChinese(processedContent);
      // Also translate title if content was non-Chinese
      if (!this.isChinese(processedTitle)) {
        const translatedTitle = await this.translateToChinese(processedTitle);
        if (translatedTitle && !translatedTitle.includes('Translate')) {
          processedTitle = translatedTitle.replace(/<[^>]*>/g, '').trim();
        }
      }
    }

    const enhanced = await this.aiService.enhanceContent({
      content: processedContent,
      mode: 'improve-grammar',
    });
    const polishedContent = enhanced.enhancedContent || processedContent;

    const seo = await this.aiService.generateSeo({
      title: article.title,
      content: polishedContent,
    });

    const tagsResult = await this.aiService.suggestTags({
      content: polishedContent,
      maxTags: 5,
    });

    const slug = (seo?.slug || processedTitle)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .substring(0, 80);

    // Generate AI cover image if article has no image
    let featuredImage = article.imageUrl || '';
    if (!featuredImage) {
      const coverPrompt = this.cloudflareAi.buildCoverPrompt(processedTitle, article.excerpt);
      const coverUrl = await this.cloudflareAi.generateCover(coverPrompt);
      if (coverUrl) featuredImage = coverUrl;
    }

    let categoryId: number | null = null;
    if (tagsResult?.category) {
      categoryId = await this.resolveCategory(tagsResult.category);
    }

    const tagNames = [...new Set(tagsResult?.tags?.slice(0, 5) || [])] as string[];
    const tagRecords = await this.resolveTags(tagNames);

    const post = await this.prisma.post.create({
      data: {
        title: seo?.seoTitle || processedTitle,
        slug: slug + '-' + Date.now(),
        content: polishedContent,
        excerpt: article.excerpt || seo?.seoDescription || '',
        featuredImage: featuredImage || '',
        status: 'draft',
        aiGenerated: true,
        aiPrompt: `Crawled from ${article.source.url}`,
        seoTitle: seo?.seoTitle || '',
        seoDescription: seo?.seoDescription || '',
        authorId: 1,
        categoryId,
        tags: {
          create: tagRecords.map(t => ({ tagId: t.id })),
        },
      },
    });

    await this.prisma.crawledArticle.update({
      where: { id },
      data: { isProcessed: true, isPublished: true, postId: post.id },
    });

    return { article: post, source: article.source.name, message: 'Article processed and saved as draft' };
  }

  // ---- Scheduling ----

  @Interval(60_000)
  async checkScheduledSources() {
    const sources = await this.prisma.crawlSource.findMany({
      where: { status: 'active' },
    });

    const now = Date.now();
    for (const source of sources) {
      const lastRun = source.lastRunAt?.getTime() || 0;
      const nextRun = lastRun + source.interval * 60_000;
      if (now >= nextRun) {
        console.log(`[Scheduler] Running crawl: ${source.name}`);
        this.crawlSource(source.id).catch(err =>
          console.error(`[Scheduler] Failed ${source.name}:`, err.message),
        );
      }
    }
  }

  // ---- Private: Listing Page Analysis & Multi-Page Crawl ----

  /**
   * Strip scripts, styles, nav, header, footer from HTML before AI analysis.
   */
  private stripHtmlForAnalysis(html: string): string {
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, iframe, noscript').remove();
    return $('body').html() || $('html').html() || html;
  }

  /**
   * Cheerio-based fallback for pagination detection when AI is unavailable.
   * Looks for rel="next", pagination links, and page number elements.
   */
  private async analyzeListingPageFallback(
    $: cheerio.CheerioAPI,
    baseUrl: string,
  ): Promise<{ totalArticles: number; currentPage: number; totalPages: number; paginationPattern: string | null }> {
    const articleCount = $('article').length || $('.post, .entry, [class*="post-"]').length || 0;
    let totalPages = 1;
    let paginationPattern: string | null = null;

    // Try to find pagination links
    const paginationSelectors = [
      'a[rel="next"]',
      'a[rel="last"]',
      '.pagination a',
      '.page-numbers',
      '.nav-links a',
      '.wp-pagenavi a',
      '[class*="pagination"] a',
      'a[aria-label*="Page"]',
      'a[aria-label*="page"]',
    ];

    const hrefs: string[] = [];
    for (const sel of paginationSelectors) {
      $(sel).each((_, el) => {
        const href = $(el).attr('href');
        if (href) hrefs.push(href);
      });
    }

    if (hrefs.length > 0) {
      // Find the page number pattern from hrefs
      for (const href of hrefs) {
        const pageMatch = href.match(/[?&]page[=/](\d+)|[/]page[/](\d+)|[/](\d+)[/]?$/);
        if (pageMatch) {
          const pageNum = parseInt(pageMatch[1] || pageMatch[2] || pageMatch[3], 10);
          if (pageNum > totalPages) totalPages = pageNum;
        }
      }

      // Build pagination pattern from the first href that has a page number
      if (totalPages > 1) {
        for (const href of hrefs) {
          const base = new URL(baseUrl);
          const resolved = new URL(href, base.origin + base.pathname.replace(/\/[^/]*$/, '/'));
          const pattern = resolved.href.replace(/page[/=]\d+/, 'page/{page}').replace(/[/]\d+[/]?$/, '/{page}/');
          if (pattern.includes('{page}')) {
            paginationPattern = pattern;
            break;
          }
        }
      }
    }

    return { totalArticles: articleCount, currentPage: 1, totalPages: Math.max(totalPages, 1), paginationPattern };
  }

  /**
   * Build a pagination URL from a pattern containing {page}.
   */
  private buildPaginationUrl(pattern: string, pageNum: number, baseUrl: string): string {
    const url = pattern.replace('{page}', String(pageNum));
    if (url.startsWith('/')) {
      try {
        return new URL(url, baseUrl).href;
      } catch {
        return url;
      }
    }
    return url;
  }

  /**
   * Crawl all listing pages to collect article URLs.
   * Uses AI pagination info or cheerio fallback.
   */
  private async crawlListingPages(
    source: { url: string },
    pageInfo: { totalPages: number; paginationPattern: string | null },
    $: cheerio.CheerioAPI,
  ): Promise<string[]> {
    const allUrls = new Set<string>();

    // Collect from first page
    const firstPageUrls = this.discoverArticleUrls($, source.url);
    for (const url of firstPageUrls) allUrls.add(url);

    // Crawl subsequent pages if paginated
    if (pageInfo.totalPages > 1 && pageInfo.paginationPattern) {
      const maxPages = Math.min(pageInfo.totalPages, this.MAX_PAGES_TO_CRAWL);
      for (let page = 2; page <= maxPages; page++) {
        if (allUrls.size >= this.MAX_URLS_PER_CRAWL) break;
        try {
          const pageUrl = this.buildPaginationUrl(pageInfo.paginationPattern, page, source.url);
          const pageHtml = await this.fetchPage(pageUrl);
          const page$ = cheerio.load(pageHtml);
          const pageUrls = this.discoverArticleUrls(page$, pageUrl);
          for (const url of pageUrls) {
            if (allUrls.size >= this.MAX_URLS_PER_CRAWL) break;
            allUrls.add(url);
          }
        } catch (err) {
          console.error(`Failed to crawl page ${page}:`, err.message);
        }
      }
    }

    return Array.from(allUrls).slice(0, this.MAX_URLS_PER_CRAWL);
  }

  // ---- Private: Category & Tag Resolution ----

  /**
   * Find or create a category by name, return its id.
   */
  private async resolveCategory(categoryName: string): Promise<number | null> {
    const existing = await this.prisma.category.findUnique({ where: { name: categoryName } });
    if (existing) return existing.id;

    let catSlug = categoryName
      .toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'category';
    let counter = 0;
    let candidate = catSlug;
    while (await this.prisma.category.findUnique({ where: { slug: candidate } })) {
      counter++;
      candidate = `${catSlug}-${counter}`;
    }
    const category = await this.prisma.category.create({ data: { name: categoryName, slug: candidate } });
    return category.id;
  }

  /**
   * Find or create tags by name, return array of { id }.
   */
  private async resolveTags(tagNames: string[]): Promise<{ id: number }[]> {
    const uniqueNames = [...new Set(tagNames.slice(0, 5))];
    const records: { id: number }[] = [];

    for (const name of uniqueNames) {
      const existing = await this.prisma.tag.findUnique({ where: { name } });
      if (existing) {
        records.push(existing);
        continue;
      }

      let slug = name.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '') || 'tag';
      let counter = 0;
      let candidate = slug;
      while (await this.prisma.tag.findUnique({ where: { slug: candidate } })) {
        counter++;
        candidate = `${slug}-${counter}`;
      }

      records.push(await this.prisma.tag.create({ data: { name, slug: candidate } }));
    }

    return records;
  }

  // ---- Private: Auto-Publish ----

  /**
   * Create a draft Post from a crawled article.
   * Assumes content is already AI-rewritten — skips translation and enhancement.
   */
  private async autoPublishAsDraft(article: any, source: { name: string; url: string }): Promise<void> {
    const seo = await this.aiService.generateSeo({
      title: article.title,
      content: article.content,
    });

    const tagsResult = await this.aiService.suggestTags({
      content: article.content,
      maxTags: 5,
    });

    const slug = (seo?.slug || article.title)
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .substring(0, 80);

    let featuredImage = article.imageUrl || '';
    if (!featuredImage) {
      const coverPrompt = this.cloudflareAi.buildCoverPrompt(article.title, article.excerpt);
      const coverUrl = await this.cloudflareAi.generateCover(coverPrompt);
      if (coverUrl) featuredImage = coverUrl;
    }

    const categoryId = tagsResult?.category ? await this.resolveCategory(tagsResult.category) : null;
    const tagRecords = tagsResult?.tags ? await this.resolveTags(tagsResult.tags) : [];

    const post = await this.prisma.post.create({
      data: {
        title: seo?.seoTitle || article.title,
        slug: slug + '-' + Date.now(),
        content: article.content,
        excerpt: article.excerpt || seo?.seoDescription || '',
        featuredImage: featuredImage || '',
        status: 'draft',
        aiGenerated: true,
        aiPrompt: `Crawled from ${source.url}`,
        seoTitle: seo?.seoTitle || '',
        seoDescription: seo?.seoDescription || '',
        authorId: 1,
        categoryId,
        tags: { create: tagRecords.map(t => ({ tagId: t.id })) },
      },
    });

    await this.prisma.crawledArticle.update({
      where: { id: article.id },
      data: { isProcessed: true, isPublished: true, postId: post.id },
    });
  }

  // ---- Private: HTTP & Parsing ----

  private async fetchPage(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BlogCrawler/1.0)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
    return res.text();
  }

  private discoverArticleUrls($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const links = new Set<string>();
    const base = new URL(baseUrl);

    const add = (href: string) => {
      const resolved = this.resolveUrl(href, base);
      if (resolved && this.looksLikeArticle(resolved.pathname)) links.add(resolved.href);
    };

    $('article a[href]').each((_, el) => add($(el).attr('href') || ''));
    $('.post-title a, .entry-title a, .blog-title a, h2 a, h3 a, [class*="post"] a[href], [class*="entry"] a[href]').each((_, el) => add($(el).attr('href') || ''));
    $('a[href*="/blog/"], a[href*="/article/"], a[href*="/news/"], a[href*="/story/"], a[href*="/posts/"]').each((_, el) => add($(el).attr('href') || ''));

    return Array.from(links).slice(0, 20);
  }

  private resolveUrl(href: string, base: URL): URL | null {
    try {
      const url = new URL(href, base.origin + base.pathname.replace(/\/[^/]*$/, '/'));
      if (url.origin !== base.origin) return null;
      url.hash = '';
      return url;
    } catch {
      return null;
    }
  }

  private looksLikeArticle(pathname: string): boolean {
    const skip = ['/wp-content', '/wp-includes', '/wp-admin', '/tag/', '/category/', '/author/', '/page/', '/feed', '/rss', '/atom', '/search', '/login', '/register', '/about', '/contact', '/css/', '/js/', '/img/', '/images/', '/assets/'];
    for (const s of skip) if (pathname.includes(s)) return false;
    const segments = pathname.split('/').filter(Boolean);
    return segments.length >= 2;
  }

  private async extractArticle(url: string): Promise<{
    title: string; content: string; excerpt: string;
    author: string; pubDate: string; imageUrl: string;
  } | null> {
    try {
      const html = await this.fetchPage(url);
      const $ = cheerio.load(html);
      $('script, style, nav, header, footer, iframe, .sidebar, .comments, .navigation, .menu').remove();

      let title = $('article h1').first().text().trim() || $('h1').first().text().trim() || $('title').text().trim();
      if (!title) return null;
      const sepIdx = title.search(/ \| | — | – | - | « /);
      if (sepIdx > 0) title = title.substring(0, sepIdx).trim();

      const articleEl = $('article').first();
      let content = articleEl.length ? (articleEl.html() || '') : '';
      if (!content || content.length < 100) {
        for (const sel of ['.entry-content', '.post-content', '.article-content', '.content', '#content', '.post-body', 'main', '[role="main"]']) {
          const el = $(sel).first();
          if (el.length) { content = el.html() || ''; if (content.length > 100) break; }
        }
      }
      if (!content) content = $('body').html() || '';

      const excerpt = $('meta[name="description"]').attr('content') || $('p').first().text().trim().substring(0, 200);
      const pubDate = $('time').attr('datetime') || $('[class*="date"], [class*="time"], [class*="published"]').first().attr('datetime') || $('meta[property="article:published_time"]').attr('content') || '';
      const author = $('[class*="author"]').first().text().trim() || $('meta[name="author"]').attr('content') || '';
      const imageUrl = $('meta[property="og:image"]').attr('content') || (articleEl.length ? articleEl.find('img').first().attr('src') || '' : $('img').first().attr('src') || '');

      return { title, content, excerpt, author, pubDate, imageUrl };
    } catch (err) {
      console.error(`Failed to extract ${url}:`, err.message);
      return null;
    }
  }

  private async downloadImage(imageUrl: string): Promise<string> {
    // Already a local path
    if (imageUrl.startsWith('/')) return imageUrl;
    try {
      const res = await fetch(imageUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogCrawler/1.0)' },
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) return imageUrl;

      const ext = this.guessExtension(res.headers.get('content-type') || '', imageUrl);
      const dir = path.join(process.cwd(), 'uploads', 'crawl');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const filename = `crawl-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const filePath = path.join(dir, filename);
      const buffer = Buffer.from(await res.arrayBuffer());
      fs.writeFileSync(filePath, buffer);

      return `/uploads/crawl/${filename}`;
    } catch (err) {
      console.error(`Failed to download image ${imageUrl}:`, err.message);
      return imageUrl;
    }
  }

  private guessExtension(contentType: string, url: string): string {
    const map: Record<string, string> = {
      'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif',
      'image/webp': '.webp', 'image/svg+xml': '.svg', 'image/avif': '.avif',
    };
    if (map[contentType]) return map[contentType];
    const ext = path.extname(new URL(url).pathname).split('?')[0].toLowerCase();
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.avif'].includes(ext)) return ext;
    return '.jpg';
  }
}
