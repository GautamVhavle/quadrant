import { isQuadrantId, type QuadrantId } from './types';

export type AnswerKey = 'q1' | 'q2' | 'q3' | 'q4';

export type TriageAnswers = Record<AnswerKey, boolean>;

export interface TriageQuestion {
  id: AnswerKey;
  /** Short label used in the summary chips. */
  label: string;
  /** The question as asked. */
  text: string;
  /** Why we ask it, shown quietly under the question. */
  hint: string;
}

export const QUESTIONS: TriageQuestion[] = [
  {
    id: 'q1',
    label: 'Something breaks',
    text: 'If this slipped to next week, would something actually break?',
    hint: 'Consequence of delay, not effort',
  },
  {
    id: 'q2',
    label: 'Someone waiting',
    text: 'Is someone else waiting on it, with a date you do not control?',
    hint: 'An external commitment already made',
  },
  {
    id: 'q3',
    label: 'Moves a goal',
    text: 'Does it move a goal you would defend in a review?',
    hint: 'Importance, judged by outcomes',
  },
  {
    id: 'q4',
    label: 'Could be handed off',
    text: 'Could someone else do it nearly as well?',
    hint: 'Sharpens the delegation case',
  },
];

export interface Verdict {
  quadrant: QuadrantId;
  title: string;
  reason: string;
  confidence: number;
  source: 'model' | 'heuristic';
  mode: 'online' | 'offline';
}

export interface TriageRequest {
  task: string;
  answers: TriageAnswers;
}

export const MAX_TASK_LENGTH = 240;

export function isUrgent(answers: TriageAnswers): boolean {
  return answers.q1 || answers.q2;
}

export function isImportant(answers: TriageAnswers): boolean {
  return answers.q3;
}

/** The deterministic mapping. Also the guidance handed to the model. */
export function mapAnswers(answers: TriageAnswers): QuadrantId {
  const urgent = isUrgent(answers);
  const important = isImportant(answers);
  if (urgent && important) return 'do';
  if (!urgent && important) return 'schedule';
  if (urgent && !important) return 'delegate';
  return 'delete';
}

function heuristicReason(quadrant: QuadrantId, answers: TriageAnswers): string {
  const urgent = isUrgent(answers);
  switch (quadrant) {
    case 'do':
      return urgent && answers.q3
        ? 'A date or a person is already attached to it, and it moves something you care about.'
        : 'It moves something you care about and waiting would cost you.';
    case 'schedule':
      return 'Worth doing, with no external deadline yet. Give it a slot before it becomes urgent.';
    case 'delegate':
      return answers.q4
        ? 'Time sensitive but not yours specifically. Hand it off and keep the outcome.'
        : 'Time sensitive and not that important. Give it a short slot and stop carrying it.';
    case 'delete':
      return 'Nothing breaks if it waits and it does not move a goal. Dropping it is the honest call.';
  }
}

function heuristicConfidence(answers: TriageAnswers, quadrant: QuadrantId): number {
  let score = 0.62;
  if (answers.q1 && answers.q2) score += 0.1;
  if (answers.q3) score += 0.08;
  if (quadrant === 'delegate' && answers.q4) score += 0.12;
  if (quadrant === 'delete' && !answers.q3 && !answers.q1 && !answers.q2) score += 0.1;
  return Math.min(0.95, Number(score.toFixed(2)));
}

export function clampTitle(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, MAX_TASK_LENGTH);
}

export function heuristicVerdict(task: string, answers: TriageAnswers, mode: 'online' | 'offline' = 'offline'): Verdict {
  const quadrant = mapAnswers(answers);
  return {
    quadrant,
    title: clampTitle(task),
    reason: heuristicReason(quadrant, answers),
    confidence: heuristicConfidence(answers, quadrant),
    source: 'heuristic',
    mode,
  };
}

export function parseAnswers(value: unknown): TriageAnswers | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const keys: AnswerKey[] = ['q1', 'q2', 'q3', 'q4'];
  const answers = {} as TriageAnswers;
  for (const key of keys) {
    if (typeof candidate[key] !== 'boolean') return null;
    answers[key] = candidate[key] as boolean;
  }
  return answers;
}

export function parseTriageRequest(value: unknown): TriageRequest | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.task !== 'string') return null;
  const task = clampTitle(candidate.task);
  if (!task) return null;
  const answers = parseAnswers(candidate.answers);
  if (!answers) return null;
  return { task, answers };
}

/** Validates whatever the model returned before it is allowed near the interface. */
export function parseModelVerdict(value: unknown): Omit<Verdict, 'mode'> | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as Record<string, unknown>;
  const quadrant = candidate.quadrant;
  if (typeof quadrant !== 'string' || !isQuadrantId(quadrant)) return null;
  const reason = typeof candidate.reason === 'string' ? candidate.reason.trim().slice(0, 220) : '';
  if (!reason) return null;
  const title = typeof candidate.title === 'string' ? clampTitle(candidate.title) : '';
  const rawConfidence = typeof candidate.confidence === 'number' ? candidate.confidence : 0.7;
  const confidence = Math.min(0.99, Math.max(0.35, Number(rawConfidence.toFixed(2))));
  return { quadrant, title, reason, confidence, source: 'model' };
}
