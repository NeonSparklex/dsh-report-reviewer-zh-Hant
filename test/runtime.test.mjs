import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { ReportReviewRuntime } from '../lib/runtime.js';

const log = { info() {}, warn() {} };

test('buildAgentPrompt includes role, report, output file, focus, and rules', () => {
  const runtime = new ReportReviewRuntime({}, log);
  const prompt = runtime.buildAgentPrompt({
    team: {
      title: 'Sample Report',
      reportPath: 'C:/work/sample-report.pdf',
      pentest: true,
      focus: 'Specifically review the CVSS scores and whether they can be lowered.',
      runDir: 'C:/work/reviews/sample',
    },
    task: { id: 'read-summary', subject: 'Read and summarize', role: 'reader' },
    member: { name: 'Nova', title: 'Reader' },
    prompt: 'Read every page.',
    language: 'en',
    outputPath: 'C:/work/reviews/sample/agents/read-summary.md',
  });
  assert.match(prompt, /You are Nova, the Reader/u);
  assert.match(prompt, /sample-report\.pdf/u);
  assert.match(prompt, /read-summary\.md/u);
  assert.match(prompt, /USER FOCUS/u);
  assert.match(prompt, /CVSS scores/u);
  assert.match(prompt, /page citation/u);
  assert.match(prompt, /Do not start subagents/u);
});

test('prepareRun creates a run folder and the correct planned documents', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'report-reviewer-'));
  try {
    const runtime = new ReportReviewRuntime({}, log);
    const prepared = await runtime.prepareRun({
      cwd: root,
      title: 'Sample Report',
      reportPath: 'sample-report.pdf',
      outputLang: 'both-hant',
    });
    assert.ok(existsSync(prepared.runDir));
    assert.ok(existsSync(path.join(prepared.runDir, 'agents')));
    assert.deepEqual(
      prepared.outputs.map((entry) => entry.lang),
      ['en', 'zh-Hant'],
    );
    assert.ok(prepared.outputs[0].path.endsWith('review-en.md'));
    assert.ok(prepared.outputs[1].path.endsWith('review-zh-Hant.md'));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('createTeam persists state and loadTeam reads it back', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'report-reviewer-'));
  try {
    const runtime = new ReportReviewRuntime({}, log);
    const team = await runtime.createTeam({
      cwd: root,
      sessionId: 'session-test',
      title: 'Sample Report',
      reportPath: path.join(root, 'sample-report.pdf'),
      pentest: true,
      mode: 'team',
      chatLang: 'en',
      outputLang: 'both',
      focus: 'Specifically review the CVSS scores and whether they can be lowered.',
    });
    assert.equal(team.tasks.length, 6);
    assert.equal(team.members.length, 6);
    assert.equal(team.focus, 'Specifically review the CVSS scores and whether they can be lowered.');
    assert.equal(new Set(team.members.map((member) => member.name)).size, team.members.length);
    assert.ok(team.tasks.every((task) => team.members.some((member) => member.name === task.assignee)));
    assert.ok(team.runDir.endsWith('review-en.md') === false);
    const file = path.join(root, '.report-review', 'teams', `${team.id}.json`);
    assert.ok(existsSync(file));
    const raw = JSON.parse(await readFile(file, 'utf8'));
    assert.equal(raw.id, team.id);
    assert.equal(raw.outputLang, 'both-hans');
    const loaded = await runtime.loadTeam(root, team.id);
    assert.equal(loaded.reportPath, team.reportPath);
    assert.equal(loaded.tasks.find((task) => task.id === 'final-review').status, 'pending');
    const view = await runtime.status({ agent: { session: { header: { cwd: root } } }, teamId: team.id });
    assert.equal(view.pentest, true);
    assert.equal(view.progress.total, 6);
    assert.equal(view.focus, team.focus);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
