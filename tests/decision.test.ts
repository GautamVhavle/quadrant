import { describe, expect, it } from 'vitest';
import {
  FIRST_QUESTION,
  QUESTIONS,
  QUESTION_ORDER,
  decide,
  isComplete,
  nextQuestion,
  type DecisionAnswers,
} from '../lib/decision';

function path(...answers: boolean[]): DecisionAnswers {
  const keys = ['consequence', 'goal', 'handoff'] as const;
  const result: DecisionAnswers = {};
  answers.forEach((answer, index) => {
    result[keys[index]] = answer;
  });
  return result;
}

describe('the question set', () => {
  it('asks about consequence first, which decides urgency', () => {
    expect(FIRST_QUESTION).toBe('consequence');
    expect(QUESTIONS.consequence.text).toMatch(/break|let you down/i);
  });

  it('explains every question, so the interface can show the reasoning', () => {
    for (const id of QUESTION_ORDER) {
      const question = QUESTIONS[id];
      expect(question.text.length).toBeGreaterThan(20);
      expect(question.why.length).toBeGreaterThan(10);
      expect(question.yes.length).toBeGreaterThan(5);
      expect(question.no.length).toBeGreaterThan(5);
      expect(question.short.length).toBeLessThan(20);
    }
  });

  it('never asks the same question twice in one path', () => {
    expect(new Set(QUESTION_ORDER).size).toBe(QUESTION_ORDER.length);
  });
});

describe('nextQuestion', () => {
  it('starts with consequence', () => {
    expect(nextQuestion({})).toBe('consequence');
  });

  it('asks about the goal whatever the urgency answer was', () => {
    expect(nextQuestion({ consequence: true })).toBe('goal');
    expect(nextQuestion({ consequence: false })).toBe('goal');
  });

  it('stops once the answer is already decided', () => {
    expect(nextQuestion({ consequence: true, goal: true })).toBeNull();
    expect(nextQuestion({ consequence: false, goal: true })).toBeNull();
  });

  it('asks the handoff question only when importance came back negative', () => {
    expect(nextQuestion({ consequence: true, goal: false })).toBe('handoff');
    expect(nextQuestion({ consequence: false, goal: false })).toBe('handoff');
  });

  it('stops when every needed answer is in', () => {
    expect(nextQuestion({ consequence: false, goal: false, handoff: true })).toBeNull();
    expect(nextQuestion({ consequence: true, goal: false, handoff: false })).toBeNull();
  });
});

describe('decide', () => {
  it('returns nothing until the tree is resolved', () => {
    expect(decide({})).toBeNull();
    expect(decide({ consequence: true })).toBeNull();
    expect(decide({ consequence: true, goal: false })).toBeNull();
  });

  it('places urgent and important work in Do now', () => {
    const decision = decide(path(true, true));
    expect(decision?.quadrant).toBe('do');
    expect(decision?.complete).toBe(true);
    expect(decision?.steps).toHaveLength(2);
  });

  it('places important but not urgent work in Schedule', () => {
    const decision = decide(path(false, true));
    expect(decision?.quadrant).toBe('schedule');
    expect(decision?.steps).toHaveLength(2);
  });

  it('places urgent work that is not yours in Delegate', () => {
    const decision = decide(path(true, false, true));
    expect(decision?.quadrant).toBe('delegate');
    expect(decision?.steps).toHaveLength(3);
  });

  it('keeps urgent work that only you can do in Do now', () => {
    const decision = decide(path(true, false, false));
    expect(decision?.quadrant).toBe('do');
    expect(decision?.reason).toMatch(/only you|nobody else/i);
  });

  it('places work that is neither urgent nor important and can be moved on in Delegate', () => {
    expect(decide(path(false, false, true))?.quadrant).toBe('delegate');
  });

  it('drops work that is neither urgent nor important and cannot be moved on', () => {
    const decision = decide(path(false, false, false));
    expect(decision?.quadrant).toBe('delete');
    expect(decision?.steps).toHaveLength(3);
  });

  it('reaches all four quadrants, so no area is dead weight', () => {
    const quadrants = new Set([
      decide(path(true, true))?.quadrant,
      decide(path(false, true))?.quadrant,
      decide(path(true, false, true))?.quadrant,
      decide(path(false, false, false))?.quadrant,
    ]);
    expect(quadrants).toEqual(new Set(['do', 'schedule', 'delegate', 'delete']));
  });

  it('records the path it took, in order', () => {
    const decision = decide(path(false, false, true));
    expect(decision?.steps).toEqual([
      { question: 'consequence', answer: false },
      { question: 'goal', answer: false },
      { question: 'handoff', answer: true },
    ]);
  });

  it('always explains itself', () => {
    const paths = [path(true, true), path(false, true), path(true, false, true), path(true, false, false), path(false, false, true), path(false, false, false)];
    for (const answers of paths) {
      const decision = decide(answers);
      expect(decision?.reason.length).toBeGreaterThan(20);
      expect(decision?.confidence).toBeGreaterThan(0.5);
      expect(decision?.confidence).toBeLessThan(1);
    }
  });

  it('is less certain when it needed the third question', () => {
    const two = decide(path(true, true))!.confidence;
    const three = decide(path(true, false, true))!.confidence;
    expect(two).toBeGreaterThan(three);
  });

  it('uses the same answer twice only if it was given twice', () => {
    const decision = decide(path(false, true, true));
    expect(decision?.steps.map((step) => step.question)).toEqual(['consequence', 'goal']);
  });
});

describe('isComplete', () => {
  it('matches the presence of a decision', () => {
    expect(isComplete({})).toBe(false);
    expect(isComplete({ consequence: false, goal: true })).toBe(true);
    expect(isComplete({ consequence: true, goal: false, handoff: true })).toBe(true);
  });
});
