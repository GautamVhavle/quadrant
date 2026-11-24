export type QuadrantId = 'do' | 'schedule' | 'delegate' | 'delete';

export interface Task {
  id: string;
  title: string;
  quadrant: QuadrantId;
  done: boolean;
  createdAt: number;
  completedAt?: number;
}

export interface QuadrantMeta {
  id: QuadrantId;
  name: string;
  axis: string;
  blurb: string;
  empty: string;
  colorVar: string;
  tintVar: string;
  key: string;
}

/** Grid order is deliberate: importance on the vertical axis, urgency on the horizontal. */
export const QUADRANTS: QuadrantMeta[] = [
  {
    id: 'schedule',
    name: 'Schedule',
    axis: 'Important, not urgent',
    blurb: 'The work that compounds. Give it time before it becomes a fire.',
    empty: 'Deep work, planning, training, relationships.',
    colorVar: 'q2',
    tintVar: 'q2t',
    key: '1',
  },
  {
    id: 'do',
    name: 'Do now',
    axis: 'Urgent and important',
    blurb: 'Real deadlines and genuine crises. Handle these, then leave.',
    empty: 'A deadline today, an outage, a decision only you can make.',
    colorVar: 'q1',
    tintVar: 'q1t',
    key: '2',
  },
  {
    id: 'delete',
    name: 'Drop',
    axis: 'Not urgent, not important',
    blurb: 'Busywork and filler. Removing it is the productive move.',
    empty: 'Doomscrolling, busywork, meetings with no decision.',
    colorVar: 'q4',
    tintVar: 'q4t',
    key: '3',
  },
  {
    id: 'delegate',
    name: 'Delegate',
    axis: 'Urgent, not important',
    blurb: "Other people's priorities wearing your name. Hand off or timebox.",
    empty: 'Routine requests, status chasing, most email.',
    colorVar: 'q3',
    tintVar: 'q3t',
    key: '4',
  },
];

export const QUADRANT_BY_ID = QUADRANTS.reduce(
  (acc, q) => ({ ...acc, [q.id]: q }),
  {} as Record<QuadrantId, QuadrantMeta>,
);

export function isQuadrantId(value: string): value is QuadrantId {
  return value === 'do' || value === 'schedule' || value === 'delegate' || value === 'delete';
}
