import { describe, expect, it } from 'vitest';
import {
  QUESTIONS,
  clampTitle,
  heuristicVerdict,
  isImportant,
  isUrgent,
  mapAnswers,
  parseAnswers,
  parseModelVerdict,
  parseTriageRequest,
  type TriageAnswers,
} from '../lib/triage';

function answers(q1: boolean, q2: boolean, q3: boolean, q4: boolean): TriageAnswers {
  return { q1, q2, q3, q4 };
}

describe('questions', () => {
  it('asks exactly four, each with an id, label, text and hint', () => {
    expect(QUESTIONS).toHaveLength(4);
    for (const question of QUESTIONS) {
      expect(question.id).toMatch(/^q[1-4]$/);
      expect(question.label.length).toBeGreaterThan(2);
      expect(question.text.endsWith('?')).toBe(true);
      expect(question.hint.length).toBeGreaterThan(4);
    }
  });

  it('uses unique ids', () => {
    expect(new Set(QUESTIONS.map((question) => question.id)).size).toBe(4);
  });
});

describe('urgency and importance', () => {
  it('treats either time bound answer as urgent', () => {
    expect(isUrgent(answers(true, false, false, false))).toBe(true);
    expect(isUrgent(answers(false, true, false, false))).toBe(true);
    expect(isUrgent(answers(false, false, true, true))).toBe(false);
  });

  it('takes importance from the goal question only', () => {
    expect(isImportant(answers(true, true, true, false))).toBe(true);
    expect(isImportant(answers(true, true, false, true))).toBe(false);
  });
});

describe('mapAnswers', () => {
  const table: Array<[string, TriageAnswers, string]> = [
    ['urgent and important', answers(true, false, true, false), 'do'],
    ['urgent through the second question and important', answers(false, true, true, false), 'do'],
    ['not urgent but important', answers(false, false, true, false), 'schedule'],
    ['urgent and not important', answers(true, false, false, true), 'delegate'],
    ['urgent without a handoff', answers(true, false, false, false), 'delegate'],
    ['neither, all no', answers(false, false, false, false), 'delete'],
    ['neither, handoff yes', answers(false, false, false, true), 'delete'],
  ];

  for (const [name, input, expected] of table) {
    it(`maps ${name} to ${expected}`, () => {
      expect(mapAnswers(input)).toBe(expected);
    });
  }
});

describe('heuristicVerdict', () => {
  it('returns the mapped quadrant with a reason and a title', () => {
    const verdict = heuristicVerdict('  Send   the proposal ', answers(true, true, true, false));
    expect(verdict.quadrant).toBe('do');
    expect(verdict.title).toBe('Send the proposal');
    expect(verdict.reason.length).toBeGreaterThan(20);
    expect(verdict.source).toBe('heuristic');
    expect(verdict.mode).toBe('offline');
  });

  it('keeps confidence inside a believable range', () => {
    const low = heuristicVerdict('a', answers(false, false, false, false));
    const high = heuristicVerdict('b', answers(true, true, true, true));
    expect(low.confidence).toBeGreaterThanOrEqual(0.35);
    expect(high.confidence).toBeLessThanOrEqual(0.95);
    expect(high.confidence).toBeGreaterThan(low.confidence);
  });

  it('mentions the handoff when delegation is available', () => {
    const withHandoff = heuristicVerdict('a', answers(true, false, false, true));
    const withoutHandoff = heuristicVerdict('a', answers(true, false, false, false));
    expect(withHandoff.reason).toMatch(/Hand it off/);
    expect(withoutHandoff.reason).toMatch(/short slot/);
  });

  it('reports the mode it was given', () => {
    expect(heuristicVerdict('a', answers(true, false, true, false), 'online').mode).toBe('online');
  });
});

describe('clampTitle', () => {
  it('collapses whitespace and trims', () => {
    expect(clampTitle('  fix   the   invoice ')).toBe('fix the invoice');
  });

  it('caps at 240 characters', () => {
    expect(clampTitle('x'.repeat(400))).toHaveLength(240);
  });
});

describe('parseAnswers', () => {
  it('accepts four booleans', () => {
    expect(parseAnswers(answers(true, false, true, false))).toEqual(answers(true, false, true, false));
  });

  it('rejects missing, non boolean or absent objects', () => {
    expect(parseAnswers({ q1: true, q2: true, q3: true })).toBeNull();
    expect(parseAnswers({ q1: 'yes', q2: false, q3: false, q4: false })).toBeNull();
    expect(parseAnswers(null)).toBeNull();
    expect(parseAnswers('q1')).toBeNull();
  });
});

describe('parseTriageRequest', () => {
  it('accepts a task with answers and normalises the title', () => {
    const parsed = parseTriageRequest({ task: '  Call  the bank ', answers: answers(true, false, true, false) });
    expect(parsed?.task).toBe('Call the bank');
    expect(parsed?.answers.q1).toBe(true);
  });

  it('rejects an empty task', () => {
    expect(parseTriageRequest({ task: '   ', answers: answers(true, false, true, false) })).toBeNull();
  });

  it('rejects a task that is not a string', () => {
    expect(parseTriageRequest({ task: 42, answers: answers(true, false, true, false) })).toBeNull();
  });

  it('rejects malformed answers', () => {
    expect(parseTriageRequest({ task: 'ok', answers: { q1: true } })).toBeNull();
  });
});

describe('parseModelVerdict', () => {
  const valid = { quadrant: 'schedule', title: 'Draft the plan', reason: 'Worth doing, no deadline.', confidence: 0.8 };

  it('accepts a well formed verdict', () => {
    const parsed = parseModelVerdict(valid);
    expect(parsed).toMatchObject({ quadrant: 'schedule', source: 'model', confidence: 0.8 });
  });

  it('rejects an unknown quadrant', () => {
    expect(parseModelVerdict({ ...valid, quadrant: 'someday' })).toBeNull();
  });

  it('rejects a missing reason', () => {
    expect(parseModelVerdict({ ...valid, reason: '   ' })).toBeNull();
  });

  it('clamps confidence into range', () => {
    expect(parseModelVerdict({ ...valid, confidence: 4 })?.confidence).toBe(0.99);
    expect(parseModelVerdict({ ...valid, confidence: -2 })?.confidence).toBe(0.35);
  });

  it('tolerates a missing confidence and a missing title', () => {
    const parsed = parseModelVerdict({ quadrant: 'do', reason: 'Deadline today.' });
    expect(parsed?.confidence).toBeGreaterThan(0.35);
    expect(parsed?.title ?? '').toBe('');
  });
});
