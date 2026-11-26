import { expect, test } from '@playwright/test';
import { answer, confirm, dialog, fillTask, openDialog, TASKS_KEY } from './helpers';

test('the add control opens a real dialog that focuses the task field', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);

  await expect(dialog(page).getByLabel('Task', { exact: true })).toBeFocused();
  await expect(dialog(page).getByLabel('Due date')).toBeVisible();
  await expect(dialog(page).getByLabel('Note')).toBeVisible();
  await expect(dialog(page).getByText('Question 1')).toBeVisible();
});

test('the N key opens the dialog from anywhere on the page', async ({ page }) => {
  await page.goto('/');
  await page.locator('body').press('n');
  await expect(dialog(page)).toBeVisible();
});

test('Escape and Cancel both close it without adding anything', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Never added');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  expect(await page.evaluate((key) => localStorage.getItem(key), TASKS_KEY)).not.toContain('Never added');

  await openDialog(page);
  await dialog(page).getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
});

test('asks about consequence first, then the goal', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);

  await expect(dialog(page).getByText(/would something break/i)).toBeVisible();
  await answer(page, true);
  await expect(dialog(page).getByText(/move a goal you would actually defend/i)).toBeVisible();
  await expect(dialog(page).getByText('Question 2')).toBeVisible();
});

test('places urgent and important work in Do now and explains why', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Send the revised proposal');

  await answer(page, true);
  await answer(page, true);

  await expect(dialog(page).getByText(/Something breaks if it waits/)).toBeVisible();
  await expect(dialog(page).getByText(/% confident/)).toBeVisible();
  await confirm(page);

  await expect(
    page.getByRole('region', { name: 'Do now' }).getByText('Send the revised proposal'),
  ).toBeVisible();
});

test('stops after two questions when the goal answer is yes', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Draft the hiring plan');

  await answer(page, false);
  await answer(page, true);

  await expect(dialog(page).getByText('Schedule', { exact: true })).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Yes', exact: true })).toBeHidden();
  await expect(dialog(page).getByText('Placed')).toBeVisible();
});

test('asks a third question only when importance came back no', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Reply to the conference organiser');

  await answer(page, true);
  await answer(page, false);

  await expect(dialog(page).getByText('Question 3')).toBeVisible();
  await expect(dialog(page).getByText(/somebody else pick this up/i)).toBeVisible();

  await answer(page, true);
  await expect(dialog(page).getByText('Delegate', { exact: true })).toBeVisible();
});

test('keeps the note and the due date with the task', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Submit the filing');
  await dialog(page).getByLabel('Due date').fill('2026-12-24');
  await dialog(page).getByLabel('Note').fill('  Two copies, signed  ');
  await answer(page, true);
  await answer(page, true);
  await confirm(page);

  const stored = await page.evaluate((key) => localStorage.getItem(key), TASKS_KEY);
  expect(stored).toContain('Two copies, signed');
  expect(stored).toContain('2026-12-24');
  await expect(page.getByText('Two copies, signed')).toBeVisible();
});

test('the user can overrule the tree and the dialog says so', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'File the invoice');

  await dialog(page).getByRole('button', { name: 'Place in Delegate' }).click();
  await expect(dialog(page).getByText('Your call')).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Add to Delegate' })).toBeEnabled();

  await confirm(page);
  await expect(page.getByRole('region', { name: 'Delegate' }).getByText('File the invoice')).toBeVisible();
});

test('changing an earlier answer resets the questions after it', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Chase the vendor quote');

  await answer(page, false);
  await answer(page, false);
  await expect(dialog(page).getByText('Question 3')).toBeVisible();

  await dialog(page).getByRole('button', { name: 'Change answer: Consequence' }).click();

  await expect(dialog(page).getByText('Question 1')).toBeVisible();
  await expect(dialog(page).getByText(/would something break/i)).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: 'Answer to add' })).toBeDisabled();
});

test('Answer again starts the questions over', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Book the planning day');

  await answer(page, true);
  await answer(page, true);
  await dialog(page).getByRole('button', { name: 'Answer again' }).click();

  await expect(dialog(page).getByText('Question 1')).toBeVisible();
  await expect(dialog(page).getByRole('button', { name: /^Add to / })).toHaveCount(0);
});

test('answers with the Y and N keys, then adds with Enter', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Water the plants');

  await dialog(page).click({ position: { x: 12, y: 12 } });
  await page.keyboard.press('n');
  await page.keyboard.press('y');
  await expect(dialog(page).getByText('Schedule', { exact: true })).toBeVisible();

  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(page.getByRole('region', { name: 'Schedule' }).getByText('Water the plants')).toBeVisible();
});

test('the add button stays disabled until there is a task and an area', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await expect(dialog(page).getByRole('button', { name: 'Add task' })).toBeDisabled();

  await fillTask(page, 'Something real');
  await expect(dialog(page).getByRole('button', { name: 'Answer to add' })).toBeDisabled();

  await answer(page, true);
  await answer(page, true);
  await expect(dialog(page).getByRole('button', { name: 'Add to Do now' })).toBeEnabled();
});

test('the number keys place it straight away', async ({ page }) => {
  await page.goto('/');
  await openDialog(page);
  await fillTask(page, 'Book the planning day');
  await dialog(page).click({ position: { x: 12, y: 12 } });
  await page.keyboard.press('2');

  await expect(dialog(page).getByRole('button', { name: 'Add to Schedule' })).toBeEnabled();
});

test('fits a phone without overflowing, and keeps its actions reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await openDialog(page);

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);

  await fillTask(page, 'Phone task');
  await answer(page, true);
  await answer(page, true);

  const button = dialog(page).getByRole('button', { name: 'Add to Do now' });
  await expect(button).toBeInViewport();
  await button.click();
  await expect(page.getByRole('dialog')).toBeHidden();
});
