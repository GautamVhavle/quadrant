import { parseModelVerdict, QUESTIONS, type TriageRequest, type Verdict } from '../triage';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'openai/gpt-4o-mini';
const TIMEOUT_MS = 12_000;

export function hasApiKey(): boolean {
  const key = process.env.OPENROUTER_API_KEY?.trim();
  if (!key) return false;
  // The placeholder from .env.example must never be treated as a real key.
  return !/DUMMY|REPLACE/i.test(key);
}

function buildMessages({ task, answers }: TriageRequest) {
  const answerLines = QUESTIONS.map(
    (question) => `- ${question.text} Answer: ${answers[question.id] ? 'yes' : 'no'}`,
  ).join('\n');

  const system = [
    'You sort one task using an Eisenhower urgency and importance matrix.',
    'You are given the task and four yes or no answers. Do not invent facts.',
    'Urgent means q1 or q2 is yes. Important means q3 is yes.',
    'Mapping: urgent and important is "do". Not urgent and important is "schedule".',
    'Urgent and not important is "delegate". Neither is "delete".',
    'If q4 is yes the delegation case is stronger. If the task is already shorter than 80 characters keep its wording.',
    'Reply with JSON only, no prose, using exactly these keys:',
    '{"quadrant":"do|schedule|delegate|delete","title":"short imperative task title under 90 characters","reason":"one sentence under 180 characters, plain language, no praise","confidence":0.0}',
    'confidence is your own 0 to 1 estimate that the quadrant is right.',
  ].join(' ');

  const user = `Task: ${task}\n\nAnswers:\n${answerLines}`;

  return [
    { role: 'system' as const, content: system },
    { role: 'user' as const, content: user },
  ];
}

/**
 * Asks OpenRouter for a verdict. Returns null on any failure so the caller can
 * fall back to the deterministic mapping. Never throws.
 */
export async function modelVerdict(input: TriageRequest): Promise<Omit<Verdict, 'mode'> | null> {
  if (!hasApiKey()) return null;

  const key = process.env.OPENROUTER_API_KEY as string;
  const model = process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.PUBLIC_SITE_URL || 'https://quadrant-tasks-nine.vercel.app',
        'X-Title': 'Quadrant',
      },
      body: JSON.stringify({
        model,
        messages: buildMessages(input),
        temperature: 0.2,
        max_tokens: 300,
        response_format: { type: 'json_object' },
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) return null;

    const payload: unknown = await response.json();
    const content = (payload as { choices?: Array<{ message?: { content?: string } }> })?.choices?.[0]?.message
      ?.content;
    if (typeof content !== 'string') return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      // Some models wrap JSON in a fence despite the instruction.
      const match = content.match(/\{[\s\S]*\}/);
      if (!match) return null;
      parsed = JSON.parse(match[0]);
    }

    return parseModelVerdict(parsed);
  } catch {
    return null;
  }
}
