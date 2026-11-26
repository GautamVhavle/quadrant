import { expect, type Page } from '@playwright/test';

export const TASKS_KEY = 'quadrant.tasks.v1';

/** The dialog itself. Every query in a spec should hang off this. */
export function dialog(page: Page) {
  return page.getByRole('dialog', { name: 'Add a task' });
}

export async function openDialog(page: Page) {
  await page.getByRole('button', { name: /What needs doing/ }).click();
  await expect(dialog(page)).toBeVisible();
}

export async function fillTask(page: Page, title: string) {
  await dialog(page).getByLabel('Task', { exact: true }).fill(title);
}

export async function answer(page: Page, value: boolean) {
  await dialog(page).getByRole('button', { name: value ? 'Yes' : 'No', exact: true }).click();
}

export async function confirm(page: Page) {
  await dialog(page)
    .getByRole('button', { name: /^Add to / })
    .click();
  await expect(page.getByRole('dialog')).toBeHidden();
}

/** Adds a task by answering the tree, in order. */
export async function addByAnswers(page: Page, title: string, answers: boolean[]) {
  await openDialog(page);
  await fillTask(page, title);
  for (const value of answers) await answer(page, value);
  await confirm(page);
}

/** Adds a task by overriding the tree with a named quadrant. */
export async function addToQuadrant(page: Page, title: string, quadrant: string) {
  await openDialog(page);
  await fillTask(page, title);
  await dialog(page).getByRole('button', { name: `Place in ${quadrant}` }).click();
  await dialog(page).getByRole('button', { name: `Add to ${quadrant}` }).click();
  await expect(page.getByRole('dialog')).toBeHidden();
}
