import { NextResponse } from 'next/server';
import { handleTriage } from '@/lib/server/triageHandler';
import { hasApiKey, modelVerdict } from '@/lib/server/openrouter';
import { triageLimiter } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Thin adapter. All behaviour lives in handleTriage so it stays unit tested;
 * this only wires the real model, key check and limiter.
 */
export async function POST(request: Request) {
  const response = await handleTriage(request, {
    hasKey: hasApiKey,
    model: modelVerdict,
    limiter: triageLimiter,
  });

  return new NextResponse(response.body, {
    status: response.status,
    headers: response.headers,
  });
}

export function GET() {
  return NextResponse.json({ error: 'method-not-allowed' }, { status: 405, headers: { Allow: 'POST' } });
}
