import { expect, test } from '@playwright/test';

const TASKS_KEY = 'quadrant.tasks.v1';

test('places a task directly in a chosen quadrant', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Chase the vendor quote');
  await page.getByRole('button', { name: /Delegate/ }).last().click();

  const delegate = page.getByRole('region', { name: 'Delegate' });
  await expect(delegate.getByText('Chase the vendor quote')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('region', { name: 'Delegate' }).getByText('Chase the vendor quote')).toBeVisible();
});

test('places a task with the number keys', async ({ page }) => {
  await page.goto('/');
  const input = page.getByLabel('New task');
  await input.fill('Book the planning day');
  await input.press('2');
  await expect(page.getByRole('region', { name: 'Schedule' }).getByText('Book the planning day')).toBeVisible();
});

test('moves a task from the row menu', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Draft the hiring plan');
  await page.getByRole('button', { name: /Do now/ }).last().click();

  await page.getByRole('button', { name: 'Options for "Draft the hiring plan"' }).click();
  await page.getByRole('menuitem', { name: 'Schedule' }).click();

  await expect(page.getByRole('region', { name: 'Schedule' }).getByText('Draft the hiring plan')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Do now' }).getByText('Draft the hiring plan')).toBeHidden();
});

test('reorders tasks inside a quadrant', async ({ page }) => {
  await page.goto('/');
  for (const title of ['First task', 'Second task']) {
    await page.getByLabel('New task').fill(title);
    await page.getByRole('button', { name: /Do now/ }).last().click();
  }

  await page.getByRole('button', { name: 'Options for "Second task"' }).click();
  await page.getByRole('menuitem', { name: 'Move up' }).click();

  const titles = await page
    .getByRole('region', { name: 'Do now' })
    .locator('li button[title="Rename task"]')
    .allInnerTexts();
  expect(titles.slice(0, 2)).toEqual(['Second task', 'First task']);
});

test('completes a task then restores it after clearing', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('File the invoice');
  await page.getByRole('button', { name: /Do now/ }).last().click();
  await page.getByLabel('Mark "File the invoice" as done').check({ force: true });

  await page.getByRole('button', { name: 'Clear completed' }).click();
  await expect(page.getByRole('status')).toContainText('Cleared 1 completed task');
  await page.getByRole('status').getByRole('button', { name: 'Undo' }).click();
  await expect(page.getByText('File the invoice')).toBeVisible();
});

test('sets a due date and marks it overdue', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Submit the filing');
  await page.getByRole('button', { name: /Do now/ }).last().click();

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
  await page.getByRole('button', { name: /Do now/ }).last().click();

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export', exact: true }).click(),
  ]).then(([event]) => event);

  expect(download.suggestedFilename()).toMatch(/^quadrant-\d{4}-\d{2}-\d{2}\.json$/);
});

test('rejects a bad import without losing the board', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('New task').fill('Survives a bad import');
  await page.getByRole('button', { name: /Do now/ }).last().click();

  await page.getByLabel('Import a Quadrant board file').setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"nope":true}'),
  });

  await expect(page.getByRole('status')).toContainText('not a Quadrant board');
  await expect(page.getByText('Survives a bad import')).toBeVisible();
  expect(await page.evaluate((key) => localStorage.getItem(key), TASKS_KEY)).toContain('Survives a bad import');
});

test('has no horizontal overflow on a small phone', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await page.goto('/');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await expect(page.getByLabel('New task')).toBeVisible();
});
