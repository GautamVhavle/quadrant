import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = '/home/gautamvhavle/projects/quadrant/docs/screenshots';
const BASE = 'http://127.0.0.1:4180/';
const TASKS = [
  { id: 'a1', title: 'Send the revised proposal to Meera', quadrant: 'do', done: false, notes: 'She wants the numbers in the first section.' },
  { id: 'a2', title: 'Fix the duplicate invoice that finance flagged', quadrant: 'do', done: false },
  { id: 'b1', title: 'Draft the Q1 hiring plan for the industrial practice', quadrant: 'schedule', done: false },
  { id: 'b2', title: 'Book the half day for the paint sector market model', quadrant: 'schedule', done: false },
  { id: 'c1', title: 'Reply to the conference organiser about the panel slot', quadrant: 'delegate', done: false },
  { id: 'd1', title: 'Reorganise the shared drive folders again', quadrant: 'delete', done: false },
];

mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();

async function seed(page) {
  const now = Date.now();
  const day = 86400000;
  const iso = (t) => new Date(t).toISOString().slice(0, 10);
  const tasks = TASKS.map((task, index) => ({
    ...task,
    createdAt: now,
    due: index === 0 ? iso(now - day) : index === 2 ? iso(now + 4 * day) : undefined,
  }));
  await page.addInitScript(
    ([list, theme]) => {
      localStorage.setItem('quadrant.tasks.v1', list);
      localStorage.setItem('quadrant.theme.v1', theme);
    },
    [JSON.stringify(tasks), 'light'],
  );
}

async function openDialog(page, title) {
  await page.getByRole('button', { name: /What needs doing/ }).click();
  await page.getByRole('dialog').getByLabel('Task', { exact: true }).fill(title);
  // Blur so the field renders from the start of the title in the capture.
  await page.getByRole('dialog').getByLabel('Task', { exact: true }).evaluate((el) => el.blur());
}

const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
const page = await desktop.newPage();
await seed(page);
await page.goto(BASE, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/desktop-light.png` });

await openDialog(page, 'send the revised proposal to Meera before the 4pm call');
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/dialog-question.png` });

const d = page.getByRole('dialog');
await d.getByRole('button', { name: 'Yes', exact: true }).click();
await page.waitForTimeout(500);
await d.getByRole('button', { name: 'Yes', exact: true }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/dialog-verdict.png` });

// dark dialog
await page.keyboard.press('Escape');
await page.getByRole('radio', { name: 'Dark' }).click();
await page.waitForTimeout(500);
await page.screenshot({ path: `${OUT}/desktop-dark.png` });
await openDialog(page, 'reply to the conference organiser about the panel slot');
await d.getByRole('button', { name: 'Yes', exact: true }).click();
await page.waitForTimeout(400);
await d.getByRole('button', { name: 'No', exact: true }).click();
await page.waitForTimeout(800);
await page.screenshot({ path: `${OUT}/dialog-dark.png` });

// explainer and footer, light
await page.keyboard.press('Escape');
await page.getByRole('radio', { name: 'Light' }).click();
await page.waitForTimeout(400);
await page.getByRole('region', { name: /How the questions decide/i }).scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/decision-explainer.png` });
await page.getByRole('contentinfo').scrollIntoViewIfNeeded();
await page.waitForTimeout(600);
await page.screenshot({ path: `${OUT}/footer.png` });

const phone = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
});
const small = await phone.newPage();
await seed(small);
await small.goto(BASE, { waitUntil: 'networkidle' });
await small.waitForTimeout(600);
await small.screenshot({ path: `${OUT}/mobile-light.png` });

await openDialog(small, 'draft the hiring plan for the industrial practice');
await small.waitForTimeout(400);
await small.screenshot({ path: `${OUT}/mobile-dialog.png` });
const md = small.getByRole('dialog');
await md.getByRole('button', { name: 'No', exact: true }).click();
await small.waitForTimeout(400);
await md.getByRole('button', { name: 'Yes', exact: true }).click();
await small.waitForTimeout(800);
await small.screenshot({ path: `${OUT}/mobile-verdict.png` });

await browser.close();
console.log('screenshots written');
