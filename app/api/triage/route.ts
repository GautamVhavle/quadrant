import { NextResponse } from 'next/server';
import { heuristicVerdict, parseTriageRequest } from '@/lib/triage';
import { hasApiKey, modelVerdict } from '@/lib/server/openrouter';
import { triageLimiter } from '@/lib/server/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function clientKey(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'anonymous';
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid-json' }, { status: 400 });
  }

  const parsed = parseTriageRequest(body);
  if (!parsed) {
    return NextResponse.json({ error: 'invalid-request' }, { status: 400 });
  }

  const limit = triageLimiter.check(clientKey(request));
  if (!limit.ok) {
    return NextResponse.json(
      { error: 'rate-limited', retryAfter: limit.retryAfter, limit: limit.limit },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } },
    );
  }

  if (!hasApiKey()) {
    return NextResponse.json(
      { verdict: heuristicVerdict(parsed.task, parsed.answers, 'offline'), remaining: limit.remaining },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  const modelResult = await modelVerdict(parsed);
  if (!modelResult) {
    return NextResponse.json(
      {
        verdict: heuristicVerdict(parsed.task, parsed.answers, 'online'),
        remaining: limit.remaining,
        degraded: true,
      },
      { headers: { 'Cache-Control': 'no-store' } },
    );
  }

  return NextResponse.json(
    { verdict: { ...modelResult, mode: 'online' }, remaining: limit.remaining },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}

export function GET() {
  return NextResponse.json({ error: 'method-not-allowed' }, { status: 405 });
}
