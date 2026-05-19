// Lightweight spam detection shared across post comments and visualization comments.

export function heuristicSpamCheck(content: string): { isSpam: boolean; reason: string } {
  const urlCount = (content.match(/https?:\/\//g) || []).length;
  const hasSpamKeywords = /\b(buy now|click here|free money|casino|viagra|earn money|guaranteed)\b/i.test(content);
  const tooManyCaps = content.length > 20 && (content.match(/[A-Z]/g) || []).length / content.length > 0.7;

  if (urlCount >= 3) return { isSpam: true, reason: 'Multiple URLs' };
  if (hasSpamKeywords) return { isSpam: true, reason: 'Spam keywords' };
  if (tooManyCaps) return { isSpam: true, reason: 'Excessive caps' };
  return { isSpam: false, reason: 'Clean' };
}

export async function aiSpamCheck(content: string): Promise<{ isSpam: boolean; reason: string }> {
  const aiKey = process.env.DEEPSEEK_API_KEY || process.env.GEMINI_API_KEY;
  if (!aiKey) return { isSpam: false, reason: 'No AI configured' };

  try {
    const isDeepSeek = !!process.env.DEEPSEEK_API_KEY;
    const url = isDeepSeek
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1') + '/chat/completions'
      : `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL || 'gemini-2.0-flash'}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const body = isDeepSeek
      ? JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
          messages: [
            { role: 'system', content: 'You are a spam classifier. Respond with JSON only: {"isSpam":bool,"reason":"string"}' },
            { role: 'user', content: `Classify this comment: "${content}"` },
          ],
          max_tokens: 50,
          temperature: 0,
        })
      : JSON.stringify({
          contents: [{ parts: [{ text: `Classify this comment as spam or not. Respond with JSON only: {"isSpam":bool,"reason":"string"}\n\nComment: "${content}"` }] }],
        });

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (isDeepSeek) headers['Authorization'] = `Bearer ${process.env.DEEPSEEK_API_KEY}`;

    const res = await fetch(url, { method: 'POST', headers, body, signal: AbortSignal.timeout(5000) });
    const text = await res.text();

    let jsonStr = text;
    if (isDeepSeek) {
      const data = JSON.parse(text);
      jsonStr = data.choices?.[0]?.message?.content || '';
    } else {
      const data = JSON.parse(text);
      jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    const match = jsonStr.match(/\{[\s\S]*\}/);
    if (match) {
      const result = JSON.parse(match[0]);
      return { isSpam: !!result.isSpam, reason: result.reason || 'AI classified' };
    }
  } catch { /* AI failed */ }

  return { isSpam: false, reason: 'No conclusion' };
}
