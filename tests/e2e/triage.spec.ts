import { expect, test, type Page } from '@playwright/test';

interface MockVerdict {
  quadrant: 'do' | 'schedule' | 'delegate' | 'delete';
  title: string;
  reason: string;
  confidence: number;
  source: 'model' | 'heuristic';
  mode: 'online' | 'offline';
}

const verdict: MockVerdict = {
  quadrant: 'do',
  title: 'Send the revised proposal',
  reason: 'A date and a person are already attached to it.',
  confidence: 0.86,
  source: 'model',
  mode: 'online',
};

async function mockTriage(page: Page, body: unknown, status = 200) {
  await page.route('**/api/triage', async (route) => {
    await route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function startTriage(page: Page, task = 'send revised proposal to Meera') {
  await page.goto('/');
  await page.getByLabel('New task').fill(task);
  await page.getByRole('button', { name: 'Sort it' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
}

test('asks four questions and places the task from the verdict', async ({ page }) => {
  await mockTriage(page, { verdict });
  await startTriage(page);

  await expect(page.getByText('Question 1 of 4')).toBeVisible();
  await page.keyboard.press('y');
  await expect(page.getByText('Question 2 of 4')).toBeVisible();
  await page.keyboard.press('n');
  await expect(page.getByText('Question 3 of 4')).toBeVisible();
  await page.keyboard.press('y');
  await expect(page.getByText('Question 4 of 4')).toBeVisible();
  await page.keyboard.press('n');

  await expect(page.getByText('The sorter says')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByRole('dialog').getByText('Send the revised proposal')).toBeVisible();
  await expect(page.getByRole('dialog').getByText('86% confident')).toBeVisible();

  await page.getByRole('button', { name: 'Add to Do now' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Do now' }).getByText('Send the revised proposal')).toBeVisible();
});

test('answering with the buttons works the same as the keys', async ({ page }) => {
  await mockTriage(page, { verdict });
  await startTriage(page, 'fix the invoice');

  for (let index = 0; index < 4; index += 1) {
    await page.getByRole('button', { name: /^No/ }).click();
  }

  await expect(page.getByText('The sorter says')).toBeVisible({ timeout: 15_000 });
});

test('lets the user overrule the verdict before adding', async ({ page }) => {
  await mockTriage(page, { verdict });
  await startTriage(page);

  for (let index = 0; index < 4; index += 1) await page.keyboard.press('y');
  await expect(page.getByText('The sorter says')).toBeVisible({ timeout: 15_000 });

  await page.getByRole('dialog').getByRole('button', { name: 'Schedule' }).click();
  await page.getByRole('button', { name: 'Add to Schedule' }).click();

  await expect(page.getByRole('region', { name: 'Schedule' }).getByText('Send the revised proposal')).toBeVisible();
});

test('goes back to a previous question', async ({ page }) => {
  await mockTriage(page, { verdict });
  await startTriage(page);

  await page.keyboard.press('y');
  await expect(page.getByText('Question 2 of 4')).toBeVisible();
  await page.getByRole('button', { name: 'Back' }).click();
  await expect(page.getByText('Question 1 of 4')).toBeVisible();
});

test('explains the rate limit and still lets the user place the task', async ({ page }) => {
  await mockTriage(page, { error: 'rate-limited', retryAfter: 45 }, 429);
  await startTriage(page);

  for (let index = 0; index < 4; index += 1) await page.keyboard.press('n');

  await expect(page.getByText(/Try again in 45 seconds/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('The sorter is unavailable')).toBeVisible();

  // The escape hatch lives in the sheet, so nothing is blocked by the message.
  await page.getByRole('dialog').getByRole('button', { name: 'Schedule' }).click();
  await page.getByRole('button', { name: 'Add to Schedule' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Schedule' }).getByText(/proposal to Meera/)).toBeVisible();
});

test('says so when the model did not answer', async ({ page }) => {
  await mockTriage(page, {
    verdict: { ...verdict, source: 'heuristic', mode: 'online' },
    degraded: true,
  });
  await startTriage(page);

  for (let index = 0; index < 4; index += 1) await page.keyboard.press('n');
  await expect(page.getByText(/the four answer rule decided/)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Rule based estimate')).toBeVisible();
});

test('closes on Escape and on the backdrop', async ({ page }) => {
  await mockTriage(page, { verdict });
  await startTriage(page);

  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();

  await page.getByLabel('New task').fill('second task');
  await page.getByRole('button', { name: 'Sort it' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('the sheet fits a phone and keeps its actions reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockTriage(page, { verdict });
  await startTriage(page, 'a long enough task title to wrap on a narrow phone screen');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  const dialogBox = await page.getByRole('dialog').boundingBox();
  expect(dialogBox?.width ?? 0).toBeLessThanOrEqual(390.5);

  for (let index = 0; index < 4; index += 1) await page.getByRole('button', { name: /^Yes/ }).click();
  const accept = page.getByRole('button', { name: /^Add to/ });
  await expect(accept).toBeVisible({ timeout: 15_000 });
  const acceptBox = await accept.boundingBox();
  expect((acceptBox?.y ?? 0) + (acceptBox?.height ?? 0)).toBeLessThanOrEqual(844);
});
