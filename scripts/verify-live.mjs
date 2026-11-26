import { chromium } from '@playwright/test';

const URL = process.argv[2] ?? 'https://quadrant-tasks-nine.vercel.app/';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

const errors = [];
page.on('pageerror', (err) => {
  errors.push(String(err).slice(0, 200));
  console.log('[pageerror]', String(err).slice(0, 300));
});
page.on('response', (res) => {
  if (res.status() >= 400) console.log('[bad]', res.status(), res.url());
});

await page.goto(URL, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log('title:', await page.title());

await page.getByRole('button', { name: /What needs doing/ }).click();
const dialog = page.getByRole('dialog', { name: 'Add a task' });
await dialog.waitFor({ state: 'visible' });
console.log('dialog opened:', await dialog.isVisible());
console.log('focused field:', await page.evaluate(() => document.activeElement?.getAttribute('aria-label')));

await dialog.getByLabel('Task', { exact: true }).fill('Send the revised proposal to Meera');
await dialog.getByLabel('Due date').fill('2026-12-01');
await dialog.getByLabel('Note').fill('Numbers first, two pages.');

await dialog.getByRole('button', { name: 'Yes', exact: true }).click();
console.log(
  'question two:',
  await dialog
    .getByText(/move a goal you would actually defend/)
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false),
);
await dialog.getByRole('button', { name: 'Yes', exact: true }).click();
console.log('verdict:', (await dialog.locator('p.font-display').innerText()).trim());
console.log('reason shown:', await dialog.getByText(/Something breaks if it waits/).isVisible());

await dialog.getByRole('button', { name: /^Add to / }).click();
await dialog.waitFor({ state: 'hidden' });
const row = page.getByRole('region', { name: 'Do now' }).getByText('Send the revised proposal to Meera');
console.log('task on board:', await row.isVisible());
console.log('note on board:', await page.getByText('Numbers first, two pages.').isVisible());

const stored = await page.evaluate(() => localStorage.getItem('quadrant.tasks.v1'));
console.log('persisted:', stored?.includes('2026-12-01') && stored?.includes('Numbers first'));

await page.reload({ waitUntil: 'networkidle' });
console.log('survives reload:', await page.getByText('Send the revised proposal to Meera').isVisible());

const explainer = page.getByRole('region', { name: /How the questions decide/i });
await explainer.scrollIntoViewIfNeeded();
console.log('explainer:', await explainer.isVisible());

const footer = page.getByRole('contentinfo');
console.log('credit href:', await footer.getByRole('link', { name: 'Gautam Vhavle' }).getAttribute('href'));
console.log('repo href:', await footer.getByRole('link', { name: /GitHub/ }).getAttribute('href'));
console.log('third party hosts:', await page.evaluate(() => {
  const hosts = [...new Set(performance.getEntriesByType('resource').map((e) => new URL(e.name).host))];
  return hosts.filter((h) => h !== location.host).join(', ') || 'none';
}));

await page.screenshot({ path: '/tmp/live-quadrant.png' });
console.log('page errors:', errors.length);
await browser.close();
