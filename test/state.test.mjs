import assert from 'node:assert/strict';
import test from 'node:test';

import {
  AGENT_NAMES,
  agentNamesFor,
  createTeamRecord,
  defaultRoles,
  defaultTasks,
  inferPromptLanguage,
  normalizeChatLang,
  normalizeOutputLang,
  outputFiles,
  patchTask,
  pickNames,
  progress,
  publicTeam,
  specialistLanguageFor,
} from '../lib/state.js';

test('output language aliases and file plans', () => {
  assert.equal(normalizeOutputLang('both'), 'both-hans');
  assert.equal(normalizeOutputLang('both-hant'), 'both-hant');
  assert.equal(normalizeOutputLang('zh-tw'), 'zh-Hant');
  assert.equal(normalizeChatLang('zh-cn'), 'zh-Hans');
  assert.equal(normalizeChatLang('zh-hk'), 'zh-Hant');
  assert.equal(normalizeChatLang('EN-us'), 'en');

  assert.deepEqual(
    outputFiles('both').map((entry) => entry.filename),
    ['review-en.md', 'review-zh-Hans.md'],
  );
  assert.deepEqual(
    outputFiles('both-hant').map((entry) => entry.filename),
    ['review-en.md', 'review-zh-Hant.md'],
  );
  assert.deepEqual(outputFiles('zh-Hant'), [{ lang: 'zh-Hant', filename: 'review-zh-Hant.md' }]);
  assert.equal(specialistLanguageFor('both-hant'), 'en');
  assert.equal(specialistLanguageFor('zh-Hans'), 'zh-Hans');
});

test('prompt language inference handles English, Simplified, and Traditional', () => {
  assert.equal(inferPromptLanguage('Review this report'), 'en');
  assert.equal(inferPromptLanguage('请评审这个报告'), 'zh-Hans');
  assert.equal(inferPromptLanguage('請評審這個報告'), 'zh-Hant');
  assert.equal(inferPromptLanguage('请 review this'), 'zh-Hans');
});

test('role and task composition follows the pentest gate', () => {
  const pentestRoles = defaultRoles(true).map((role) => role.key);
  const nonPentestRoles = defaultRoles(false).map((role) => role.key);
  assert.ok(pentestRoles.includes('technical'));
  assert.ok(pentestRoles.includes('rebuttal'));
  assert.ok(!nonPentestRoles.includes('technical'));
  assert.ok(!nonPentestRoles.includes('rebuttal'));
  assert.deepEqual(nonPentestRoles, ['task_handler', 'reader', 'client', 'proofreader']);

  const pentestTasks = defaultTasks(true);
  const nonPentestTasks = defaultTasks(false);
  assert.equal(pentestTasks.length, 6);
  assert.equal(nonPentestTasks.length, 4);
  assert.deepEqual(
    nonPentestTasks.find((task) => task.id === 'final-review').dependencies,
    ['read-summary', 'proofread', 'client-advice'],
  );
  assert.deepEqual(
    pentestTasks.find((task) => task.id === 'final-review').dependencies,
    ['read-summary', 'proofread', 'technical-check', 'rebuttal', 'client-advice'],
  );
});

test('team record, task patch, progress, and public view', () => {
  const team = createTeamRecord({
    id: 'rev-test',
    sessionId: 'session-1',
    cwd: 'C:/work',
    title: 'Sample Report',
    reportPath: 'C:/work/sample-report.pdf',
    pentest: true,
    chatLang: 'en',
    outputLang: 'both-hant',
    runDir: 'C:/work/reviews/sample',
    focus: 'Specifically review the CVSS scores and whether they can be lowered.',
  });
  assert.equal(team.id, 'rev-test');
  assert.equal(team.outputLang, 'both-hant');
  assert.equal(team.focus, 'Specifically review the CVSS scores and whether they can be lowered.');
  assert.equal(team.members.length, 6);
  assert.equal(team.tasks.length, 6);

  patchTask(team, 'read-summary', {
    status: 'completed',
    outputPath: 'C:/work/reviews/sample/agents/read-summary.md',
  });
  const counts = progress(team);
  assert.equal(counts.completed, 1);
  assert.equal(counts.total, 6);

  const view = publicTeam(team);
  assert.equal(view.tasks.find((task) => task.id === 'read-summary').status, 'completed');
  assert.equal(view.outputs.length, 0);
  assert.equal(view.summary, null);
  assert.equal(view.focus, team.focus);
});

test('non-pentest final review has client advice but no technical advice', () => {
  const team = createTeamRecord({
    title: 'Policy document',
    reportPath: 'policy.md',
    pentest: false,
    chatLang: 'zh-Hans',
    outputLang: 'zh-Hans',
    runDir: 'reviews/policy',
  });
  assert.ok(team.tasks.some((task) => task.id === 'client-advice'));
  assert.ok(!team.tasks.some((task) => task.id === 'technical-check'));
  assert.ok(!team.tasks.some((task) => task.id === 'rebuttal'));
  assert.ok(!team.members.some((member) => member.key === 'technical'));
  assert.ok(!team.members.some((member) => member.key === 'rebuttal'));
});

test('agent names are unique and never reuse the fixed Task Handler name', () => {
  const picked = pickNames(5, { exclude: ['Cope'] });
  assert.equal(new Set(picked).size, 5);
  assert.ok(picked.every((name) => AGENT_NAMES.includes(name)));
  assert.ok(!picked.includes('Cope'));

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const pentest = agentNamesFor(true);
    const specialistNames = ['reader', 'technical', 'rebuttal', 'client', 'proofreader'].map((key) => pentest[key]);
    assert.equal(new Set(specialistNames).size, 5);
    assert.ok(specialistNames.every((name) => AGENT_NAMES.includes(name)));
    assert.ok(!specialistNames.includes('Cope'));

    const nonPentest = agentNamesFor(false);
    const nonPentestNames = ['reader', 'client', 'proofreader'].map((key) => nonPentest[key]);
    assert.equal(new Set(nonPentestNames).size, 3);
    assert.ok(nonPentestNames.every((name) => AGENT_NAMES.includes(name)));
    assert.ok(!nonPentestNames.includes('Cope'));
  }
});

test('team record and task assignees use the supplied run names', () => {
  const names = {
    task_handler: 'Cope',
    reader: 'Nova',
    technical: 'Atlas',
    client: 'Pearl',
    proofreader: 'Wren',
    rebuttal: 'Sage',
  };
  const team = createTeamRecord({
    id: 'rev-names',
    title: 'Named run',
    reportPath: 'report.pdf',
    pentest: true,
    chatLang: 'en',
    outputLang: 'en',
    runDir: 'reviews/named',
    names,
  });
  assert.equal(team.members.find((member) => member.key === 'reader').name, 'Nova');
  assert.equal(team.members.find((member) => member.key === 'technical').name, 'Atlas');
  assert.equal(team.members.find((member) => member.key === 'client').name, 'Pearl');
  assert.equal(team.members.find((member) => member.key === 'proofreader').name, 'Wren');
  assert.equal(team.members.find((member) => member.key === 'rebuttal').name, 'Sage');
  assert.equal(team.tasks.find((task) => task.id === 'read-summary').assignee, 'Nova');
  assert.equal(team.tasks.find((task) => task.id === 'technical-check').assignee, 'Atlas');
  assert.equal(team.tasks.find((task) => task.id === 'rebuttal').assignee, 'Sage');
  assert.equal(team.tasks.find((task) => task.id === 'client-advice').assignee, 'Pearl');
  assert.equal(team.tasks.find((task) => task.id === 'proofread').assignee, 'Wren');
  assert.equal(team.tasks.find((task) => task.id === 'final-review').assignee, 'Cope');
});
