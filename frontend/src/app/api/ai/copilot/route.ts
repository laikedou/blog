import type { NextRequest } from 'next/server';

import { generateText } from 'ai';
import { NextResponse } from 'next/server';

import { DEFAULT_MODEL, getModel } from '@/lib/ai-providers';

export async function POST(req: NextRequest) {
  const {
    apiKey: key,
    model: modelParam,
    prompt,
    system,
  } = await req.json();

  const gatewayApiKey = key || process.env.AI_GATEWAY_API_KEY;
  const modelId = modelParam || DEFAULT_MODEL;

  try {
    const result = await generateText({
      abortSignal: req.signal,
      maxOutputTokens: 50,
      model: getModel(modelId, gatewayApiKey),
      prompt,
      system,
      temperature: 0.7,
    });

    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(null, { status: 408 });
    }

    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
