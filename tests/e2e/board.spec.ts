import { expect, test } from '@playwright/test';

const TASKS_KEY = 'quadrant.tasks.v1';

test('adds a task to Do now and keeps it after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Send the revised proposal');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  const doNow = page.getByRole('region', { name: 'Do now' });
  await expect(doNow.getByText('Send the revised proposal')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('region', { name: 'Do now' }).getByText('Send the revised proposal')).toBeVisible();
  const stored = await page.evaluate((key) => localStorage.getItem(key), TASKS_KEY);
  expect(stored).toContain('Send the revised proposal');
});

test('captures with the number keys into the chosen quadrant', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('New task');
  await input.fill('Chase the vendor quote');
  await input.press('3');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await expect(page.getByRole('region', { name: 'Delegate' }).getByText('Chase the vendor quote')).toBeVisible();
});

test('moves a task to another quadrant from the row menu', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Draft the hiring plan');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await page.getByRole('button', { name: 'Options for "Draft the hiring plan"' }).click();
  await page.getByRole('menuitem', { name: 'Schedule' }).click();

  await expect(page.getByRole('region', { name: 'Schedule' }).getByText('Draft the hiring plan')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Do now' }).getByText('Draft the hiring plan')).toBeHidden();
});

test('reorders tasks inside a quadrant', async ({ page }) => {
  await page.goto('/');
  for (const title of ['First task', 'Second task']) {
    await page.getByLabel('New task').fill(title);
    await page.getByRole('button', { name: 'Add', exact: true }).click();
  }

  await page.getByRole('button', { name: 'Options for "Second task"' }).click();
  await page.getByRole('menuitem', { name: 'Move up' }).click();

  const titles = await page
    .getByRole('region', { name: 'Do now' })
    .locator('li button[title="Rename task"]')
    .allInnerTexts();
  expect(titles.slice(0, 2)).toEqual(['Second task', 'First task']);
});

test('completes a task and restores it after clearing', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('File the invoice');
  await page.getByRole('button', { name: 'Add', exact: true }).click();
  await page.getByLabel('Mark "File the invoice" as done').check({ force: true });

  await page.getByRole('button', { name: 'Clear completed' }).click();
  await expect(page.getByRole('status')).toContainText('Cleared 1 completed task');
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('File the invoice')).toBeVisible();
});

test('sets a due date and flags an overdue task', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Submit the filing');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await page.getByRole('button', { name: 'Options for "Submit the filing"' }).click();
  await page.getByLabel('Due date').fill('2020-01-02');

  await expect(page.getByText(/Overdue/)).toBeVisible();
});

test('focus mode hides Delegate and Drop', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Delegate' })).toBeVisible();
  await page.getByRole('button', { name: 'Focus' }).click();
  await expect(page.getByRole('region', { name: 'Delegate' })).toBeHidden();
  await expect(page.getByRole('region', { name: 'Drop' })).toBeHidden();
  await expect(page.getByRole('region', { name: 'Do now' })).toBeVisible();
});

test('keeps the chosen theme after a reload', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('exports the board as JSON', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Exportable task');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]).then(([event]) => event);

  expect(download.suggestedFilename()).toMatch(/^quadrant-\d{4}-\d{2}-\d{2}\.json$/);
});

test('rejects an invalid import without destroying the board', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Survives a bad import');
  await page.getByRole('button', { name: 'Add', exact: true }).click();

  await page.getByLabel('Import a Quadrant board file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"nope":true}'),
  });

  await expect(page.getByRole('status')).toContainText('not a Quadrant board');
  await expect(page.getByText('Survives a bad import')).toBeVisible();
});
