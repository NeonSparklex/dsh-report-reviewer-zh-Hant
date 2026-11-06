/**
 * Pure team-state and language helpers for dsh-report-reviewer.
 *
 * This module has no DSH imports, so it can be tested with node --test and
 * reused by the host tools without starting the Harness.
 */

import { createHash, randomInt, randomUUID } from 'node:crypto';

export const CHAT_LANGS = Object.freeze(['en', 'zh-Hans', 'zh-Hant']);
export const OUTPUT_LANGS = Object.freeze([
  'en',
  'zh-Hans',
  'zh-Hant',
  'both',
  'both-hans',
  'both-hant',
]);

export const TASK_STATES = Object.freeze(['pending', 'running', 'completed', 'failed', 'skipped']);

/**
 * Specialist names are picked fresh for every new review run. The pool is
 * intentionally small and human-readable; the Task Handler stays Cope so the
 * skill prompt and the panel agree.
 */
export const AGENT_NAMES = Object.freeze([
  'Alice',
  'Atlas',
  'Bolt',
  'Cleo',
  'Dash',
  'Echo',
  'Fern',
  'Fish',
  'Gale',
  'Hazel',
  'Iris',
  'Jade',
  'Kite',
  'Luna',
  'Mira',
  'Moss',
  'Neo',
  'Nova',
  'Onyx',
  'Pearl',
  'Reed',
  'Sage',
  'Taro',
  'Vera',
  'Wren',
  'Zara',
  'Zephyr',
]);

const DEFAULT_NAMES = Object.freeze({
  task_handler: 'Cope',
  reader: 'Alice',
  technical: 'Bolt',
  client: 'Fish',
  proofreader: 'Mira',
  rebuttal: 'Onyx',
});

function nameFor(names, key) {
  return names?.[key] ?? DEFAULT_NAMES[key];
}

/**
 * Pick `count` distinct names from AGENT_NAMES. Excluded names (for example
 * the fixed Task Handler name) are removed first. The loop is bounded because
 * count is validated against the remaining pool length.
 */
export function pickNames(count, { exclude = [] } = {}) {
  const pool = AGENT_NAMES.filter((name) => !exclude.includes(name));
  if (!Number.isInteger(count) || count < 0 || count > pool.length) {
    throw new RangeError(`cannot pick ${count} unique agent names from ${pool.length}`);
  }
  const picked = [];
  while (picked.length < count) {
    picked.push(pool.splice(randomInt(pool.length), 1)[0]);
  }
  return picked;
}

/**
 * Build the role-to-name map for one run. The Task Handler keeps its fixed
 * name; every specialist gets a fresh unique name from the pool.
 */
export function agentNamesFor(pentest, taskHandlerName = 'Cope') {
  const specialistKeys = ['reader', ...(pentest ? ['technical', 'rebuttal'] : []), 'client', 'proofreader'];
  const picked = pickNames(specialistKeys.length, { exclude: [taskHandlerName] });
  const names = { task_handler: taskHandlerName };
  for (const [index, key] of specialistKeys.entries()) names[key] = picked[index];
  return names;
}

const HAN = /[\u3400-\u9fff\uf900-\ufaff]/u;

const TRADITIONAL_HINTS = new Set(
  '這 個 與 為 說 時 間 發 現 報 告 評 審 證 據 風 險 修 復 密 碼 政 策 應 該 裡 麼 樣 點 數 錯 誤 檢 查 文 檔 語 言 產 品 團 隊 執 行 讀 取 寫 入 檔 案 說 明 書 頁 碼 網 路 連 線 權 限 驗 證 測 試 結 果 問 題 建 議 客 戶 技 術 摘 要 完 整 覆 蓋 範 圍 漏 洞 嚴 重 等 級 修 補 證 明 風 險 管 理 資 安 事 件 通 報 法 規 合 規'.split(' '),
);
const SIMPLIFIED_HINTS = new Set(
  '这 个 与 为 说 时 间 发 现 报 告 评 审 证 据 风 险 修 复 密 码 政 策 应 该 里 么 样 点 数 错 误 检 查 文 档 语 言 产 品 团 队 执 行 读 取 写 入 档 案 说 明 书 页 码 网 络 连 线 权 限 验 证 测 试 结 果 问 题 建 议 客 户 技 术 摘 要 完 整 覆 盖 范 围 漏 洞 严 重 等 级 修 补 证 明 风 险 管 理 资 安 事 件 通 报 法 规 合 规'.split(' '),
);

/** Return whether a value is one of the three single display languages. */
export function isChatLang(value) {
  return CHAT_LANGS.includes(value);
}

/** Return whether a value is one of the accepted output-language tokens. */
export function isOutputLang(value) {
  return OUTPUT_LANGS.includes(value);
}

/**
 * Normalize a chat language token. Chinese aliases are mapped to the
 * script-qualified BCP 47 ids used by the plugin.
 */
export function normalizeChatLang(value, fallback = 'en') {
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  const raw = value.trim().toLowerCase().replace(/_/gu, '-');
  if (raw === 'en' || raw.startsWith('en-')) return 'en';
  if (raw === 'zh' || raw === 'zh-cn' || raw === 'zh-sg' || raw === 'zh-hans' || raw.startsWith('zh-hans-')) {
    return 'zh-Hans';
  }
  if (
    raw === 'zh-tw' ||
    raw === 'zh-hk' ||
    raw === 'zh-mo' ||
    raw === 'zh-hant' ||
    raw.startsWith('zh-hant-') ||
    raw === 'zh-traditional'
  ) {
    return 'zh-Hant';
  }
  return fallback;
}

/**
 * Normalize a document-output token. `both` is an alias for `both-hans`.
 * Single-language output remains a single language.
 */
export function normalizeOutputLang(value, fallback = 'en') {
  if (typeof value !== 'string' || value.trim() === '') return fallback;
  const raw = value.trim().toLowerCase().replace(/_/gu, '-');
  if (raw === 'both' || raw === 'both-hans' || raw === 'both-simplified') return 'both-hans';
  if (raw === 'both-hant' || raw === 'both-traditional') return 'both-hant';
  return normalizeChatLang(raw, fallback);
}

/**
 * Infer the prompt language. A Chinese prompt is classified by script hints;
 * an ambiguous Chinese prompt defaults to Simplified Chinese.
 */
export function inferPromptLanguage(text, fallback = 'en') {
  const value = typeof text === 'string' ? text : '';
  if (!HAN.test(value)) return fallback;
  let traditional = 0;
  let simplified = 0;
  for (const char of value) {
    if (TRADITIONAL_HINTS.has(char)) traditional += 1;
    if (SIMPLIFIED_HINTS.has(char)) simplified += 1;
  }
  if (traditional > simplified) return 'zh-Hant';
  return 'zh-Hans';
}

/** Return the output documents for an output-language token. */
export function outputFiles(outputLang) {
  switch (normalizeOutputLang(outputLang)) {
    case 'en':
      return Object.freeze([{ lang: 'en', filename: 'review-en.md' }]);
    case 'zh-Hans':
      return Object.freeze([{ lang: 'zh-Hans', filename: 'review-zh-Hans.md' }]);
    case 'zh-Hant':
      return Object.freeze([{ lang: 'zh-Hant', filename: 'review-zh-Hant.md' }]);
    case 'both-hant':
      return Object.freeze([
        { lang: 'en', filename: 'review-en.md' },
        { lang: 'zh-Hant', filename: 'review-zh-Hant.md' },
      ]);
    case 'both-hans':
    default:
      return Object.freeze([
        { lang: 'en', filename: 'review-en.md' },
        { lang: 'zh-Hans', filename: 'review-zh-Hans.md' },
      ]);
  }
}

/** Human label for a language token. */
export function languageLabel(lang) {
  switch (normalizeChatLang(lang)) {
    case 'zh-Hans':
      return 'Simplified Chinese';
    case 'zh-Hant':
      return 'Traditional Chinese';
    default:
      return 'English';
  }
}

/** The specialist language: English when any English output is requested. */
export function specialistLanguageFor(outputLang) {
  const files = outputFiles(outputLang);
  return files.some((entry) => entry.lang === 'en') ? 'en' : files[0].lang;
}

/** A filesystem-safe slug from a report title or path. */
export function slugify(value, fallback = 'report') {
  const text = typeof value === 'string' ? value : '';
  const ascii = text
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  const base = ascii.length > 0 ? ascii : fallback;
  return base.slice(0, 56).replace(/-+$/gu, '') || fallback;
}

/** Compact local timestamp used in run-directory names. */
export function timestamp(date = new Date()) {
  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();
  const pad = (n, width = 2) => String(n).padStart(width, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/** Short deterministic id for a team. */
export function teamId() {
  return `rev-${Date.now().toString(36)}-${randomUUID().slice(0, 6)}`;
}

/** Short stable run id derived from the report path and time. */
export function runId(reportPath, date = new Date()) {
  const hash = createHash('sha1').update(String(reportPath ?? '')).digest('hex').slice(0, 6);
  return `${timestamp(date)}-${hash}-${randomUUID().slice(0, 4)}`;
}

/** Default named members. The Task Handler is the main agent, not a child. */
export function defaultRoles(pentest, names = {}) {
  const roles = [
    { key: 'task_handler', name: nameFor(names, 'task_handler'), title: 'Task Handler', status: 'running' },
    { key: 'reader', name: nameFor(names, 'reader'), title: 'Reader', status: 'pending' },
  ];
  if (pentest) roles.push({ key: 'technical', name: nameFor(names, 'technical'), title: 'Technical Consultant', status: 'pending' });
  roles.push(
    { key: 'client', name: nameFor(names, 'client'), title: 'Client Consultant', status: 'pending' },
    { key: 'proofreader', name: nameFor(names, 'proofreader'), title: 'Proofreader', status: 'pending' },
  );
  if (pentest) roles.push({ key: 'rebuttal', name: nameFor(names, 'rebuttal'), title: 'Rebuttal Reviewer', status: 'pending' });
  return roles;
}

/** Default task rows for a run. */
export function defaultTasks(pentest, names = {}) {
  const tasks = [
    {
      id: 'read-summary',
      subject: '閱讀文件並生成結構化摘要',
      assignee: nameFor(names, 'reader'),
      role: 'reader',
      status: 'pending',
      dependencies: [],
      outputPath: null,
      childId: null,
      startedAt: null,
      endedAt: null,
      note: null,
    },
    {
      id: 'proofread',
      subject: '校對語言、一致性與格式',
      assignee: nameFor(names, 'proofreader'),
      role: 'proofreader',
      status: 'pending',
      dependencies: [],
      outputPath: null,
      childId: null,
      startedAt: null,
      endedAt: null,
      note: null,
    },
  ];
  if (pentest) {
    tasks.push({
      id: 'technical-check',
      subject: '檢查技術與事實性陳述，提供技術建議',
      assignee: nameFor(names, 'technical'),
      role: 'technical',
      status: 'pending',
      dependencies: [],
      outputPath: null,
      childId: null,
      startedAt: null,
      endedAt: null,
      note: null,
    });
    tasks.push({
      id: 'rebuttal',
      subject: '從客戶安全團隊角度質疑嚴重性、影響與證據',
      assignee: nameFor(names, 'rebuttal'),
      role: 'rebuttal',
      status: 'pending',
      dependencies: [],
      outputPath: null,
      childId: null,
      startedAt: null,
      endedAt: null,
      note: null,
    });
  }
  tasks.push({
    id: 'client-advice',
    subject: '從客戶角度提供改進建議',
    assignee: nameFor(names, 'client'),
    role: 'client',
    status: 'pending',
    dependencies: [],
    outputPath: null,
    childId: null,
    startedAt: null,
    endedAt: null,
    note: null,
  });
  tasks.push({
    id: 'final-review',
    subject: '任務處理者最終評審與彙總輸出',
    assignee: nameFor(names, 'task_handler'),
    role: 'task_handler',
    status: 'pending',
    dependencies: tasks.map((task) => task.id),
    outputPath: null,
    childId: null,
    startedAt: null,
    endedAt: null,
    note: null,
  });
  return tasks;
}

/** Build the persisted team record. */
export function createTeamRecord(input) {
  const now = new Date().toISOString();
  const reportPath = String(input.reportPath ?? '');
  const title = String(input.title || reportPath.split(/[\\/]/u).pop() || 'Report review');
  const pentest = input.pentest === true;
  const outputLang = normalizeOutputLang(input.outputLang, 'en');
  return {
    schemaVersion: 1,
    id: input.id ?? teamId(),
    sessionId: input.sessionId ?? null,
    title,
    reportPath,
    cwd: input.cwd ?? null,
    mode: input.mode === 'subagent' ? 'subagent' : 'team',
    pentest,
    chatLang: normalizeChatLang(input.chatLang, 'en'),
    outputLang,
    specialistLanguage: specialistLanguageFor(outputLang),
    focus: String(input.focus ?? '').trim() || null,
    runDir: input.runDir ?? null,
    outputs: [],
    status: 'running',
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    archivedAt: null,
    members: defaultRoles(pentest, input.names),
    tasks: defaultTasks(pentest, input.names),
  };
}

/** Find a task by id. */
export function findTask(team, id) {
  return team?.tasks?.find((task) => task.id === id);
}

/** Find a member by role key or name. */
export function findMember(team, keyOrName) {
  return team?.members?.find((member) => member.key === keyOrName || member.name === keyOrName);
}

/** Apply a patch to one task and touch the team timestamp. */
export function patchTask(team, id, patch) {
  const task = findTask(team, id);
  if (!task) return undefined;
  Object.assign(task, patch);
  team.updatedAt = new Date().toISOString();
  return task;
}

/** Apply a patch to one member and touch the team timestamp. */
export function patchMember(team, keyOrName, patch) {
  const member = findMember(team, keyOrName);
  if (!member) return undefined;
  Object.assign(member, patch);
  team.updatedAt = new Date().toISOString();
  return member;
}

/** Whether every non-final task has a terminal state. */
export function workTasksDone(team) {
  return (team?.tasks ?? [])
    .filter((task) => task.id !== 'final-review')
    .every((task) => task.status === 'completed' || task.status === 'failed' || task.status === 'skipped');
}

/** Progress counts for the panel. */
export function progress(team) {
  const tasks = team?.tasks ?? [];
  const completed = tasks.filter((task) => task.status === 'completed').length;
  const failed = tasks.filter((task) => task.status === 'failed').length;
  const running = tasks.filter((task) => task.status === 'running').length;
  const total = tasks.length;
  return { total, completed, failed, running, pending: total - completed - failed - running };
}

/** A compact status object for model-facing tools. */
export function publicTeam(team) {
  if (!team) return null;
  return {
    id: team.id,
    title: team.title,
    reportPath: team.reportPath,
    mode: team.mode,
    pentest: team.pentest,
    chatLang: team.chatLang,
    outputLang: team.outputLang,
    focus: team.focus ?? null,
    runDir: team.runDir,
    status: team.status,
    progress: progress(team),
    members: team.members.map(({ key, name, title, status }) => ({ key, name, title, status })),
    tasks: team.tasks.map(({ id, subject, assignee, role, status, dependencies, outputPath, note }) => ({
      id,
      subject,
      assignee,
      role,
      status,
      dependencies,
      outputPath,
      note,
    })),
    outputs: team.outputs,
    summary: team.summary ?? null,
    createdAt: team.createdAt,
    updatedAt: team.updatedAt,
    archivedAt: team.archivedAt,
  };
}
