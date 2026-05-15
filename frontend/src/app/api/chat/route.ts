import { NextRequest } from 'next/server';
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export const maxDuration = 30;

const SYSTEM_PROMPT = `你是一个博客网站的 AI 助手。你的任务是：

1. **搜索博客内容**：当用户询问关于博客文章的问题时，搜索相关文章并推荐。
2. **回答格式**：使用中文回复。推荐文章时，使用Markdown格式：
   - 文章标题作为超链接：[/posts/文章slug](链接)
   - 简要描述文章内容
3. **/feedback 命令**：如果用户输入 /feedback，引导用户填写反馈表单。
4. **保持友好**：回答简洁有用，帮助用户找到他们需要的内容。

你是关于前端开发、AI、Web3 和区块链技术博客的助手。`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    const lastMessage = messages[messages.length - 1]?.content || '';

    // Search blog posts via NestJS backend
    let searchResults: any[] = [];
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/chat/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: lastMessage, limit: 5 }),
      });
      if (res.ok) {
        searchResults = await res.json();
      }
    } catch (e) {
      // Search failed, continue without results
    }

    // Build context with search results
    let contextMessage = '';
    if (searchResults.length > 0) {
      contextMessage = `\n\n相关博客文章搜索结果：\n${searchResults
        .map(
          (p: any, i: number) =>
            `${i + 1}. "${p.title}" (slug: ${p.slug})\n   摘要: ${p.excerpt || '无摘要'}`,
        )
        .join('\n')}
\n请根据这些搜索结果推荐相关文章给用户。使用 /posts/文章slug 作为链接路径。`;
    }

    const deepseek = createOpenAI({
      baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      apiKey: process.env.DEEPSEEK_API_KEY || '',
    });

    const result = streamText({
      model: deepseek.chat(process.env.DEEPSEEK_MODEL || 'deepseek-chat'),
      system: SYSTEM_PROMPT + contextMessage,
      messages,
    });

    // Convert textStream (AsyncIterable) to ReadableStream for the response
    const textStream = result.textStream;
    const encoder = new TextEncoder();

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
        } catch (e) {
          // Stream ended
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to process chat request' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
}
