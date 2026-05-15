import { Injectable } from '@nestjs/common';
import { GeneratePostDto, EnhanceContentDto, GenerateSeoDto, SuggestTagsDto, AiImagePromptDto } from './dto/ai.dto';

@Injectable()
export class AiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor() {
    this.apiKey = process.env.DEEPSEEK_API_KEY || '';
    this.baseUrl = process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';
    this.model = process.env.DEEPSEEK_MODEL || 'deepseek-chat';
  }

  private isConfigured(): boolean {
    return !!this.apiKey;
  }

  private async callDeepSeek(systemPrompt: string, userMessage: string, maxTokens = 2000): Promise<string> {
    if (!this.isConfigured()) {
      return this.fallbackResponse(systemPrompt, userMessage);
    }

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: maxTokens,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('DeepSeek API error:', response.status, errorText);
        return this.fallbackResponse(systemPrompt, userMessage);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || this.fallbackResponse(systemPrompt, userMessage);
    } catch (error) {
      console.error('DeepSeek call failed:', error.message);
      return this.fallbackResponse(systemPrompt, userMessage);
    }
  }

  private fallbackResponse(systemPrompt: string, userMessage: string): string {
    if (systemPrompt.includes('blog listing pages')) {
      return JSON.stringify({
        totalArticles: 0,
        currentPage: 1,
        totalPages: 1,
        paginationPattern: null,
      });
    }
    if (systemPrompt.includes('professional blog editor')) {
      return JSON.stringify({
        title: userMessage.includes('Title:')
          ? userMessage.split('Title:')[1]?.split('\n')[0]?.trim() || ''
          : '',
        content: '',
        excerpt: '',
      });
    }
    if (systemPrompt.includes('Generate a complete blog post')) {
      const topicMatch = userMessage.match(/Topic: (.+)/);
      const topic = topicMatch ? topicMatch[1] : 'your topic';
      return this.generateFallbackPost(topic);
    }
    if (systemPrompt.includes('SEO')) {
      return JSON.stringify({
        seoTitle: '',
        seoDescription: 'A blog post about ' + userMessage.substring(0, 80),
        slug: userMessage.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').substring(0, 80),
      });
    }
    if (systemPrompt.includes('tags') || systemPrompt.includes('categorization')) {
      return JSON.stringify({
        tags: ['blog', 'technology', 'lifestyle'],
        category: 'General',
      });
    }
    if (systemPrompt.includes('image prompt') || systemPrompt.includes('image search')) {
      return JSON.stringify({
        imagePrompt: 'A beautiful scenic view related to the blog content',
        keywords: ['scenic', 'nature', 'technology'],
      });
    }
    return JSON.stringify({ result: 'AI features require a DeepSeek API key. Set DEEPSEEK_API_KEY in .env' });
  }

  private generateFallbackPost(topic: string): string {
    return `<h2>Introduction</h2>
<p>This is a comprehensive blog post about ${topic}. In this article, we will explore the key aspects and important considerations surrounding this fascinating subject.</p>

<h2>Key Concepts</h2>
<p>When exploring ${topic}, several fundamental concepts come into play. First, we need to understand the historical context and how things have evolved over time. The landscape has changed dramatically in recent years, with new innovations and approaches emerging regularly.</p>

<h2>Main Discussion</h2>
<p>One of the most important aspects of ${topic} is how it affects our daily lives. From practical applications to theoretical frameworks, the impact is far-reaching and significant. Experts in the field have identified several key trends that are shaping the future of this domain.</p>

<h3>Current Developments</h3>
<p>Recent developments have brought new perspectives and opportunities. Researchers and practitioners continue to push the boundaries of what's possible, exploring innovative approaches and methodologies.</p>

<h3>Challenges and Opportunities</h3>
<p>Like any important subject, ${topic} comes with its own set of challenges. However, these challenges also present opportunities for growth, learning, and innovation.</p>

<h2>Conclusion</h2>
<p>In conclusion, ${topic} represents a fascinating and important area of study and practice. As we continue to learn and evolve, the insights gained from exploring this subject will undoubtedly prove valuable.</p>`;
  }

  async generatePost(dto: GeneratePostDto): Promise<any> {
    const systemPrompt = `You are a professional blog writer. Generate a complete blog post in HTML format.
Return ONLY a JSON object with these exact fields: title, slug, content (full HTML), excerpt (1-2 sentences).
Content must be well-structured with h2, h3, p, ul/li tags.
Style: ${dto.style || 'professional'}. Target: ~${dto.wordCount || 800} words. No markdown, only JSON.
CRITICAL: Generate the post in the SAME language as the topic. If the topic is Chinese, write in Chinese. Never translate.`;

    const userMessage = `Topic: ${dto.topic}${dto.keywords ? '\nKeywords: ' + dto.keywords.join(', ') : ''}`;

    const result = await this.callDeepSeek(systemPrompt, userMessage, 3000);
    try {
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        title: dto.topic,
        slug: dto.topic.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-'),
        content: result,
        excerpt: `A comprehensive article about ${dto.topic}.`,
      };
    }
  }

  async enhanceContent(dto: EnhanceContentDto): Promise<any> {
    const instructions: Record<string, string> = {
      'improve-grammar': 'Fix grammar, spelling, and improve readability. Preserve original meaning and HTML structure. CRITICAL: Preserve the original language — do not translate.',
      'summarize': 'Summarize to ~1/3 length while keeping key points. Preserve HTML structure. CRITICAL: Preserve the original language — do not translate.',
      'expand': 'Expand with more details, examples, and explanations. Preserve HTML structure. CRITICAL: Preserve the original language — do not translate.',
      'polish': 'Polish the writing style: improve sentence flow, word choice, and readability while preserving the original meaning and HTML structure. Make the language more natural and engaging. Maintain the original length. CRITICAL: Preserve the original language — if the text is Chinese, keep it Chinese; if English, keep it English. Never translate.',
      'rewrite': 'Rewrite the entire article to significantly improve quality, clarity, and engagement. Maintain the original meaning and factual accuracy. Improve sentence flow, readability, and word choice. Adapt the tone to be professional yet approachable. Preserve ALL HTML tags exactly. Keep the same approximate length. CRITICAL: Preserve the original language — if the text is Chinese, keep it Chinese; if English, keep it English. Never translate.',
    };
    const mode = dto.mode || 'improve-grammar';
    const systemPrompt = `You are a professional blog editor and writing assistant. ${instructions[mode] || instructions['improve-grammar']}
Return only the processed HTML content, no markdown, no code fences.`;

    const result = await this.callDeepSeek(systemPrompt, `Content to ${mode}:\n\n${dto.content}`, mode === 'rewrite' || mode === 'polish' ? 6000 : 4000);
    return { enhancedContent: result };
  }

  async generateSeo(dto: GenerateSeoDto): Promise<any> {
    const systemPrompt = `You are an SEO expert. Generate SEO metadata for a blog post.
Return ONLY valid JSON: { "seoTitle": "under 60 chars", "seoDescription": "under 160 chars", "slug": "url-friendly-string" }
CRITICAL: Match the language of the content. If the content is in Chinese, generate Chinese SEO metadata. Never translate.`;

    const content = (dto.content || '').replace(/<[^>]*>/g, '').substring(0, 1000);
    const result = await this.callDeepSeek(systemPrompt, `Title: ${dto.title}\n\nContent: ${content}`);
    try {
      return JSON.parse(result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      return {
        seoTitle: dto.title.substring(0, 60),
        seoDescription: `Read about ${dto.title} on our blog.`,
        slug: dto.title.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').substring(0, 80),
      };
    }
  }

  async suggestTags(dto: SuggestTagsDto): Promise<any> {
    const max = dto.maxTags || 5;
    const systemPrompt = `You are a content categorization expert. Suggest relevant tags and a category.
Return ONLY valid JSON: { "tags": ["tag1","tag2",...] (${max} tags), "category": "single category name" }`;

    const plain = dto.content.replace(/<[^>]*>/g, '').substring(0, 1500);
    const result = await this.callDeepSeek(systemPrompt, plain);
    try {
      return JSON.parse(result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      return { tags: ['blog', 'technology', 'general'], category: 'General' };
    }
  }

  async generateImagePrompt(dto: AiImagePromptDto): Promise<any> {
    const systemPrompt = `You generate image search queries for blog post featured images.
Return ONLY valid JSON: { "imagePrompt": "search query", "keywords": ["keyword1","keyword2"] }
CRITICAL: Match the language of the content. If the content is in Chinese, generate Chinese image prompts. Never translate.`;

    const result = await this.callDeepSeek(systemPrompt, dto.postContent.replace(/<[^>]*>/g, '').substring(0, 800));
    try {
      return JSON.parse(result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim());
    } catch {
      return { imagePrompt: 'Beautiful scenery related to blog content', keywords: ['nature', 'technology'] };
    }
  }

  async analyzeSeo(dto: { title: string; content?: string; seoTitle?: string; seoDescription?: string; targetEngine?: string }) {
    const systemPrompt = `你是专业的SEO优化专家，精通Google和百度搜索引擎优化。

你将对博客文章进行全面的SEO分析并返回JSON格式的结果。

分析维度：
1. 标题优化：检查标题长度(Google: 30-60字符, 百度: 15-30汉字)、关键词位置
2. 描述优化：检查meta description(Google: 50-160字符, 百度: 使用搜索摘要)
3. 关键词密度：检查核心关键词在内容中出现的频率(推荐2-5%)
4. 内容结构：检查H1/H2/H3层级、段落长度
5. 可读性：评估内容的阅读难度
6. ${dto.targetEngine === 'baidu' ? '百度特定：百度更重视网站速度、移动友好度、原创内容、站点权威度' : 'Google特定：E-E-A-T标准、结构化数据、核心网页指标、反向链接'}
7. 改进建议：给出具体的、可操作的改进建议

Return ONLY valid JSON with this structure:
{
  "score": 0-100,
  "titleAnalysis": { "length": N, "hasKeyword": true/false, "suggestion": "..." },
  "descriptionAnalysis": { "length": N, "suggestion": "..." },
  "keywordDensity": { "primaryKeyword": "...", "density": 0.0, "suggestion": "..." },
  "structureAnalysis": { "hasH1": true/false, "h2Count": N, "h3Count": N, "suggestion": "..." },
  "readability": { "score": 0.0, "level": "easy/medium/hard", "suggestion": "..." },
  "engineSpecific": { "issues": [...], "tips": [...] },
  "topSuggestions": ["suggestion1", "suggestion2", "suggestion3"],
  "keywordRecommendations": ["keyword1", "keyword2", "keyword3"]
}`;

    const plainContent = (dto.content || '').replace(/<[^>]*>/g, '').substring(0, 3000);
    const userMessage = `标题: ${dto.title}
SEO标题: ${dto.seoTitle || '未设置'}
SEO描述: ${dto.seoDescription || '未设置'}
目标引擎: ${dto.targetEngine || 'google'}
内容: ${plainContent}`;

    const result = await this.callDeepSeek(systemPrompt, userMessage, 3000);
    try {
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return {
        score: 50,
        titleAnalysis: { length: dto.title.length, hasKeyword: true, suggestion: 'Consider using a more engaging title format' },
        descriptionAnalysis: { length: (dto.seoDescription || '').length, suggestion: 'Write a compelling meta description' },
        keywordDensity: { primaryKeyword: dto.title.split(' ')[0] || '', density: 1.0, suggestion: 'Increase keyword usage in content' },
        structureAnalysis: { hasH1: true, h2Count: 2, h3Count: 1, suggestion: 'Add more subheadings' },
        readability: { score: 10, level: 'medium', suggestion: 'Good readability level' },
        engineSpecific: { issues: ['Consider adding more structured data'], tips: ['Use descriptive URLs'] },
        topSuggestions: ['Improve title tag', 'Add meta description', 'Increase content length'],
        keywordRecommendations: [dto.title.split(' ')[0] || '', 'blog', 'technology'],
      };
    }
  }

  async chat(messages: { role: string; content: string }[]): Promise<any> {
    if (!this.isConfigured()) {
      return { reply: 'AI assistant is not configured. Set DEEPSEEK_API_KEY in .env to enable AI features.' };
    }

    const systemPrompt = `You are a helpful writing assistant for a blog platform. Help users with:
- Brainstorming blog post ideas
- Improving their writing
- Answering questions about blogging best practices
- Providing feedback on content
Keep responses concise and practical.
CRITICAL: Always respond in the SAME language as the user's message. Never translate.`;

    try {
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 2000,
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages.map(m => ({ role: m.role, content: m.content })),
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return { reply: data.choices?.[0]?.message?.content || 'No response from AI.' };
    } catch (error) {
      return { reply: `AI chat error: ${error.message}. Please check your API key and try again.` };
    }
  }

  // ---- Crawl AI Analysis ----

  /**
   * Analyze a blog listing page to determine pagination structure and article count.
   * Uses DeepSeek AI. Falls back to conservative single-page result.
   */
  async analyzeListingPage(dto: { html: string; url: string }): Promise<{
    totalArticles: number;
    currentPage: number;
    totalPages: number;
    paginationPattern: string | null;
  }> {
    if (!this.isConfigured()) {
      return this.fallbackAnalyzeListingPage();
    }

    const systemPrompt = `You analyze blog listing pages. Given the HTML of a blog index/archive page, identify:
1. How many articles are listed on this page (totalArticles)
2. Which page number this is (currentPage)
3. How many total pages of articles exist (totalPages)
4. The pagination URL pattern — look for "next page" links, page number links, or URL query params like ?page=N

Return ONLY valid JSON: { "totalArticles": number, "currentPage": number, "totalPages": number, "paginationPattern": string }

The paginationPattern should use {page} as a placeholder for the page number, e.g.:
  - "https://blog.com/page/{page}/"
  - "https://blog.com/blog?page={page}"
  - null if the blog has only one page

Base URL: ${dto.url}`;

    const userMessage = dto.html.substring(0, 8000);
    const result = await this.callDeepSeek(systemPrompt, userMessage, 1500);

    try {
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        totalArticles: typeof parsed.totalArticles === 'number' ? parsed.totalArticles : 0,
        currentPage: typeof parsed.currentPage === 'number' ? parsed.currentPage : 1,
        totalPages: typeof parsed.totalPages === 'number' ? parsed.totalPages : 1,
        paginationPattern: typeof parsed.paginationPattern === 'string' ? parsed.paginationPattern : null,
      };
    } catch {
      return this.fallbackAnalyzeListingPage();
    }
  }

  /**
   * Rewrite article content for quality and engagement using AI.
   * Preserves all HTML structure. Falls back to returning input unchanged.
   */
  async rewriteArticle(dto: { title: string; content: string; excerpt: string; sourceName?: string }): Promise<{
    title: string;
    content: string;
    excerpt: string;
  }> {
    if (!this.isConfigured()) {
      return { title: dto.title, content: dto.content, excerpt: dto.excerpt };
    }

    const systemPrompt = `You are a professional blog editor. Rewrite the following article to improve its quality, clarity, and engagement.

Guidelines:
- Maintain the original meaning and factual accuracy
- Improve sentence flow and readability
- Adapt the tone to be professional yet approachable
- Preserve ALL HTML tags exactly — do not change or remove HTML structure
- Keep the same approximate length
- The rewritten title should be compelling and SEO-friendly
- Return ONLY valid JSON: { "title": "rewritten title", "content": "rewritten HTML content", "excerpt": "1-2 sentence summary" }

Source blog: ${dto.sourceName || 'Unknown'}
CRITICAL: Preserve the original language — do not translate. If the article is in Chinese, keep it Chinese; if English, keep it English.`;

    const userMessage = `Title: ${dto.title}\n\nExcerpt: ${dto.excerpt}\n\nContent:\n${dto.content.substring(0, 6000)}`;
    const result = await this.callDeepSeek(systemPrompt, userMessage, 4000);

    try {
      const cleaned = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const parsed = JSON.parse(cleaned);
      return {
        title: parsed.title || dto.title,
        content: parsed.content || dto.content,
        excerpt: parsed.excerpt || dto.excerpt,
      };
    } catch {
      return { title: dto.title, content: dto.content, excerpt: dto.excerpt };
    }
  }

  private fallbackAnalyzeListingPage() {
    return { totalArticles: 0, currentPage: 1, totalPages: 1, paginationPattern: null };
  }
}
