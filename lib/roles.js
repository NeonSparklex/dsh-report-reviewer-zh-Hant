/** Read the bundled role prompts and the slash-command skill body. */

import { readFileSync } from 'node:fs';

const ROLE_FILES = Object.freeze({
  task_handler: 'task-handler.md',
  reader: 'reader.md',
  technical: 'technical.md',
  client: 'client.md',
  proofreader: 'proofreader.md',
  rebuttal: 'rebuttal.md',
});

const cache = new Map();

function read(name) {
  if (cache.has(name)) return cache.get(name);
  const text = readFileSync(new URL(`../${name}`, import.meta.url), 'utf8');
  cache.set(name, text);
  return text;
}

/** Return one role prompt by role key. */
export function readRole(key) {
  const file = ROLE_FILES[key];
  if (!file) throw new Error(`unknown report-review role "${String(key)}"`);
  return read(`roles/${file}`);
}

/** Return the full skill body registered as /report-review. */
export function readSkill() {
  return read('skill/report-review.md');
}

/** The role keys that are spawned as child agents. */
export const CHILD_ROLE_KEYS = Object.freeze(['reader', 'technical', 'client', 'proofreader', 'rebuttal']);
