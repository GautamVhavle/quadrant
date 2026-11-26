import type { QuadrantId } from './types';

export type DecisionQuestionId = 'consequence' | 'goal' | 'handoff';

export interface DecisionQuestion {
  id: DecisionQuestionId;
  /** Two or three words, used on the answer trail. */
  short: string;
  /** The question as asked. */
  text: string;
  /** Why this question exists, shown quietly under it. */
  why: string;
  /** What a yes means, spelled out so the answer is not ambiguous. */
  yes: string;
  /** What a no means. */
  no: string;
}

export const QUESTIONS: Record<DecisionQuestionId, DecisionQuestion> = {
  consequence: {
    id: 'consequence',
    short: 'Consequence',
    text: 'If this slipped to next week, would something break or would someone be let down?',
    why: 'Urgency is the cost of waiting, not how busy the work makes you feel.',
    yes: 'Something breaks, or a person is already relying on you.',
    no: 'Waiting a week costs nothing real.',
  },
  goal: {
    id: 'goal',
    short: 'The goal',
    text: 'Does it move a goal you would actually defend in a review?',
    why: 'Importance is judged by outcomes you would stand behind, not by effort spent.',
    yes: 'It moves a result you care about and would argue for.',
    no: 'It is activity without an outcome attached.',
  },
  handoff: {
    id: 'handoff',
    short: 'The handoff',
    text: 'Could somebody else pick this up and get it done nearly as well?',
    why: 'Asked only when importance came back no, because that is the one case where it changes the answer.',
    yes: 'Someone else could carry it and you keep the outcome.',
    no: 'It is yours, and nobody else could really take it.',
  },
};

export const QUESTION_ORDER: DecisionQuestionId[] = ['consequence', 'goal', 'handoff'];

export const FIRST_QUESTION: DecisionQuestionId = 'consequence';

export type DecisionAnswers = Partial<Record<DecisionQuestionId, boolean>>;

export interface DecisionStep {
  question: DecisionQuestionId;
  answer: boolean;
}

export interface Decision {
  quadrant: QuadrantId;
  reason: string;
  confidence: number;
  steps: DecisionStep[];
  complete: true;
}

/**
 * A decision tree, not a questionnaire. Each question is only asked when its
 * answer can still change the result, so a clear cut task is placed in two
 * questions and only the ambiguous ones see a third.
 */
export function nextQuestion(answers: DecisionAnswers): DecisionQuestionId | null {
  if (answers.consequence === undefined) return 'consequence';
  if (answers.goal === undefined) return 'goal';
  // Urgent plus important is already decided, and so is important without urgency.
  if (answers.goal) return null;
  if (answers.handoff === undefined) return 'handoff';
  return null;
}

function resolve(answers: DecisionAnswers): {
  quadrant: QuadrantId;
  reason: string;
} {
  const urgent = answers.consequence === true;
  const important = answers.goal === true;
  const handoff = answers.handoff === true;

  if (urgent && important) {
    return {
      quadrant: 'do',
      reason: 'Something breaks if it waits and it moves a goal you care about. This is the work to do next.',
    };
  }
  if (!urgent && important) {
    return {
      quadrant: 'schedule',
      reason: 'It moves a real goal but nothing breaks yet. Give it a slot before it turns urgent.',
    };
  }
  if (urgent && handoff) {
    return {
      quadrant: 'delegate',
      reason: 'Waiting costs you and it is not your goal. Hand it off and keep the outcome.',
    };
  }
  if (urgent && !handoff) {
    return {
      quadrant: 'do',
      reason: 'Waiting costs you, and nobody else could really take it. Only you can do this one.',
    };
  }
  if (!urgent && handoff) {
    return {
      quadrant: 'delegate',
      reason: 'Nothing breaks and it is not your goal, but someone else could carry it. Hand it off.',
    };
  }
  return {
    quadrant: 'delete',
    reason: 'Nothing breaks if it waits, it moves no goal, and nobody else needs it. Dropping it is the honest call.',
  };
}

function walk(answers: DecisionAnswers): DecisionStep[] {
  const steps: DecisionStep[] = [];
  let question: DecisionQuestionId | null = 'consequence';
  while (question) {
    const answer = answers[question];
    if (answer === undefined) break;
    steps.push({ question, answer });
    question = nextQuestion(Object.fromEntries(steps.map((step) => [step.question, step.answer])));
  }
  return steps;
}

export function decide(answers: DecisionAnswers): Decision | null {
  if (nextQuestion(answers) !== null) return null;
  const steps = walk(answers);
  const { quadrant, reason } = resolve(answers);
  // Two clean questions is a stronger signal than a path that needed the third.
  const confidence = steps.length > 2 ? 0.74 : 0.82;
  return { quadrant, reason, confidence, steps, complete: true };
}

export function isComplete(answers: DecisionAnswers): boolean {
  return decide(answers) !== null;
}

/** The answer trail as a readable line, used in the verdict and the row history. */
export function describePath(steps: DecisionStep[]): string {
  return steps.map((step) => `${QUESTIONS[step.question].short.toLowerCase()}: ${step.answer ? 'yes' : 'no'}`).join(' · ');
}
