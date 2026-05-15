import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SeoService {
  constructor(private prisma: PrismaService) {}

  // ─── SEO Audit ────────────────────────────────────────────────

  async auditPost(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true, category: true },
    });
    if (!post) throw new Error('Post not found');

    const plainContent = post.content.replace(/<[^>]*>/g, '').trim();
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const titleLength = post.title.length;
    const h1Matches = post.content.match(/<h1[^>]*>/g);
    const h1Count = h1Matches ? h1Matches.length : 0;
    const hasImage = post.content.includes('<img') || !!post.featuredImage;
    const imageAlt = post.featuredImage ? 'has featured image' : '';

    // Keyword density (check if title words appear in content)
    const titleWords = post.title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const densityChecks = titleWords.map(w => ({
      word: w,
      count: (plainContent.toLowerCase().match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length,
    }));
    const avgDensity = densityChecks.length > 0
      ? densityChecks.reduce((s, c) => s + c.count, 0) / densityChecks.length
      : 0;

    // Run checks
    const checks: Record<string, { pass: boolean; message: string }> = {
      titleLength: {
        pass: titleLength >= 30 && titleLength <= 70,
        message: `Title is ${titleLength} chars (ideal: 30-70)`,
      },
      seoTitle: {
        pass: !!post.seoTitle,
        message: post.seoTitle ? 'Custom SEO title set' : 'Add custom SEO title',
      },
      seoDescription: {
        pass: !!(post.seoDescription && post.seoDescription.length >= 50 && post.seoDescription.length <= 160),
        message: post.seoDescription
          ? `Meta description is ${post.seoDescription.length} chars`
          : 'Add meta description (50-160 chars)',
      },
      excerpt: {
        pass: post.excerpt.length >= 50,
        message: post.excerpt ? `Excerpt is ${post.excerpt.length} chars` : 'Add excerpt (min 50 chars)',
      },
      contentLength: {
        pass: wordCount >= 300,
        message: `${wordCount} words (aim for 300+)`,
      },
      hasImage: {
        pass: hasImage,
        message: hasImage ? 'Featured image or inline image found' : 'Add at least one image',
      },
      hasH1: {
        pass: h1Count >= 1,
        message: h1Count >= 1 ? `Found ${h1Count} H1 tag(s)` : 'Missing H1 tag',
      },
      keywordDensity: {
        pass: avgDensity >= 2,
        message: `Keywords appear ~${avgDensity.toFixed(1)} times on average`,
      },
      hasTags: {
        pass: post.tags.length > 0,
        message: post.tags.length > 0 ? `${post.tags.length} tag(s) assigned` : 'No tags assigned',
      },
    };

    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(c => c.pass).length;
    const score = Math.round((passedChecks / totalChecks) * 100);

    const suggestions = Object.values(checks)
      .filter(c => !c.pass)
      .map(c => c.message);

    // Save audit record
    await this.prisma.seoAudit.create({
      data: {
        postId: post.id,
        pageUrl: `/posts/${post.slug}`,
        score,
        title: post.title,
        titleLength,
        description: post.seoDescription || '',
        descLength: post.seoDescription?.length || 0,
        wordCount,
        hasImage,
        imageAlt,
        hasCanonical: true,
        hasOgTags: true,
        hasTwitterCard: true,
        hasJsonLd: true,
        hasH1: h1Count > 0,
        h1Count,
        keywordDensity: avgDensity,
        readability: 0,
        suggestions: JSON.stringify(suggestions),
      },
    });

    return { score, checks, suggestions, wordCount };
  }

  async getPostAudits(postId: number) {
    return this.prisma.seoAudit.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  async getAllAudits(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.seoAudit.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.seoAudit.count(),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  // ─── Keywords ─────────────────────────────────────────────────

  async addKeyword(dto: { keyword: string; source?: string; volume?: number; difficulty?: number }) {
    return this.prisma.seoKeyword.create({
      data: {
        keyword: dto.keyword,
        source: dto.source || 'manual',
        volume: dto.volume || 0,
        difficulty: dto.difficulty || 0,
      },
    });
  }

  async listKeywords() {
    return this.prisma.seoKeyword.findMany({
      orderBy: { createdAt: 'desc' },
      include: { rankings: { orderBy: { checkedAt: 'desc' }, take: 5 } },
    });
  }

  async deleteKeyword(id: number) {
    await this.prisma.seoKeyword.delete({ where: { id } });
    return { message: 'Keyword deleted' };
  }

  async recordRanking(dto: { keywordId: number; position?: number; page?: string; source?: string }) {
    return this.prisma.seoKeywordRanking.create({
      data: {
        keywordId: dto.keywordId,
        position: dto.position || 0,
        page: dto.page || '',
        source: dto.source || 'manual',
      },
    });
  }

  async getKeywordRankings(keywordId: number) {
    return this.prisma.seoKeywordRanking.findMany({
      where: { keywordId },
      orderBy: { checkedAt: 'asc' },
    });
  }

  // ─── Clicks & Impressions ────────────────────────────────────

  async recordClick(dto: { postId?: number; pageUrl: string; source?: string; clicks?: number; impressions?: number; ctr?: number; avgPosition?: number }) {
    return this.prisma.seoClick.create({
      data: {
        postId: dto.postId || null,
        pageUrl: dto.pageUrl,
        source: dto.source || 'direct',
        clicks: dto.clicks || 0,
        impressions: dto.impressions || 0,
        ctr: dto.ctr || 0,
        avgPosition: dto.avgPosition || 0,
      },
    });
  }

  async getClickStats(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const clicks = await this.prisma.seoClick.findMany({
      where: { recordedAt: { gte: since } },
      orderBy: { recordedAt: 'asc' },
    });

    // Aggregate by source
    const bySource: Record<string, { clicks: number; impressions: number }> = {};
    for (const c of clicks) {
      if (!bySource[c.source]) bySource[c.source] = { clicks: 0, impressions: 0 };
      bySource[c.source].clicks += c.clicks;
      bySource[c.source].impressions += c.impressions;
    }

    // Aggregate by day
    const byDay: Record<string, { clicks: number; impressions: number }> = {};
    for (const c of clicks) {
      const day = c.recordedAt.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { clicks: 0, impressions: 0 };
      byDay[day].clicks += c.clicks;
      byDay[day].impressions += c.impressions;
    }

    return {
      total: {
        clicks: clicks.reduce((s, c) => s + c.clicks, 0),
        impressions: clicks.reduce((s, c) => s + c.impressions, 0),
      },
      bySource,
      byDay: Object.entries(byDay).map(([date, data]) => ({ date, ...data })),
    };
  }

  // ─── Index Status ─────────────────────────────────────────────

  async updateIndexStatus(dto: { pageUrl: string; googleIndexed?: boolean; baiduIndexed?: boolean; errors?: string }) {
    return this.prisma.seoIndexStatus.upsert({
      where: { pageUrl: dto.pageUrl },
      create: {
        pageUrl: dto.pageUrl,
        googleIndexed: dto.googleIndexed || false,
        baiduIndexed: dto.baiduIndexed || false,
        errors: dto.errors || '[]',
      },
      update: {
        googleIndexed: dto.googleIndexed,
        baiduIndexed: dto.baiduIndexed,
        errors: dto.errors,
        lastChecked: new Date(),
      },
    });
  }

  async getIndexStatus() {
    return this.prisma.seoIndexStatus.findMany({
      orderBy: { lastChecked: 'desc' },
    });
  }

  // ─── Dashboard ────────────────────────────────────────────────

  async getDashboard() {
    const [
      latestAudits,
      keywords,
      indexStatus,
      clickStats,
    ] = await Promise.all([
      this.prisma.seoAudit.findMany({ orderBy: { createdAt: 'desc' }, take: 5 }),
      this.prisma.seoKeyword.count(),
      this.prisma.seoIndexStatus.findMany(),
      this.getClickStats(30),
    ]);

    const avgScore = latestAudits.length > 0
      ? Math.round(latestAudits.reduce((s, a) => s + a.score, 0) / latestAudits.length)
      : 0;

    const googleIndexed = indexStatus.filter(i => i.googleIndexed).length;
    const baiduIndexed = indexStatus.filter(i => i.baiduIndexed).length;

    return {
      overview: {
        avgScore,
        keywordCount: keywords,
        googleIndexed,
        baiduIndexed,
        totalAudits: await this.prisma.seoAudit.count(),
        totalTracked: indexStatus.length,
      },
      recentAudits: latestAudits,
      clickStats: clickStats.byDay,
      clickSources: clickStats.bySource,
      totalClicks: clickStats.total.clicks,
      totalImpressions: clickStats.total.impressions,
    };
  }

  // ─── AI Suggestions ────────────────────────────────────────────

  async getAiSuggestions(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { tags: true, category: true },
    });
    if (!post) throw new Error('Post not found');

    const plainContent = post.content.replace(/<[^>]*>/g, '').trim();
    const wordCount = plainContent.split(/\s+/).filter(Boolean).length;
    const readability = this.calculateReadability(plainContent);

    const suggestions: string[] = [];

    if (!post.seoTitle || post.seoTitle.length > 60) {
      suggestions.push('Optimize SEO title to be under 60 characters and include primary keyword');
    }
    if (!post.seoDescription || post.seoDescription.length > 160) {
      suggestions.push('Write a compelling meta description (50-160 chars) with primary keyword');
    }
    if (wordCount < 300) {
      suggestions.push(`Content is only ${wordCount} words. Aim for at least 300 words for better ranking`);
    } else if (wordCount < 1000) {
      suggestions.push('Consider expanding content to 1000+ words for in-depth coverage');
    }
    if (readability > 12) {
      suggestions.push(`Readability score is ${readability.toFixed(1)} (grade level). Aim for grade 8-10 for broader audience`);
    }
    if (!post.featuredImage) {
      suggestions.push('Add a featured image with descriptive alt text');
    }
    if (post.tags.length < 2) {
      suggestions.push('Add more tags (at least 2-3) for better content categorization');
    }
    if (!post.excerpt || post.excerpt.length < 80) {
      suggestions.push('Write a compelling excerpt (80-160 chars) for search snippets');
    }

    // Check for internal links
    const hasInternalLinks = post.content.includes('href="/posts/') || post.content.includes("href='/posts/");
    if (!hasInternalLinks) {
      suggestions.push('Add internal links to other related blog posts');
    }

    // Check for external references
    const hasOutboundLinks = post.content.includes('href="http');
    if (!hasOutboundLinks) {
      suggestions.push('Add outbound links to authoritative sources to boost credibility');
    }

    // Heading structure check
    const h2Count = (post.content.match(/<h2[^>]*>/g) || []).length;
    const h3Count = (post.content.match(/<h3[^>]*>/g) || []).length;
    if (h2Count < 2) {
      suggestions.push('Add more H2 subheadings to improve content structure and readability');
    }

    return {
      score: Math.round(
        (suggestions.length > 0 ? 0 : 100) + // placeholder — real score in audit
        (wordCount >= 300 ? 20 : 0) +
        (post.seoTitle ? 15 : 0) +
        (post.seoDescription ? 15 : 0) +
        (post.featuredImage ? 10 : 0) +
        (post.tags.length >= 2 ? 10 : 0) +
        (post.excerpt && post.excerpt.length >= 80 ? 10 : 0) +
        (h2Count >= 2 ? 10 : 0) +
        (hasInternalLinks ? 10 : 0)
      ),
      suggestions,
      metrics: {
        wordCount,
        readability: readability.toFixed(1),
        h2Count,
        h3Count,
        tagCount: post.tags.length,
        hasFeaturedImage: !!post.featuredImage,
        hasSeoTitle: !!post.seoTitle,
        hasSeoDescription: !!post.seoDescription,
        hasInternalLinks,
        hasOutboundLinks,
      },
    };
  }

  private calculateReadability(text: string): number {
    if (!text || text.length < 50) return 0;
    const sentences = text.split(/[.!?]+/).filter(Boolean).length || 1;
    const words = text.split(/\s+/).filter(Boolean).length;
    const syllables = text.split(/\s+/).reduce((count, word) => {
      return count + word.replace(/[^aeiouyAEIOUY]/g, '').length || 1;
    }, 0);
    // Flesch-Kincaid grade level
    return 0.39 * (words / sentences) + 11.8 * (syllables / words) - 15.59;
  }
}
