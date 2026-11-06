/**
 * Host-side runtime for dsh-report-reviewer.
 *
 * Owns the team record, the run directory, named child activations, and the
 * panel state route's data source. It deliberately uses DSH's native
 * `subagents.startActivation` and does not depend on dsh-agent-teams.
 */

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  agentNamesFor,
  createTeamRecord,
  findMember,
  findTask,
  outputFiles,
  patchMember,
  patchTask,
  progress,
  publicTeam,
  runId,
  slugify,
  specialistLanguageFor,
  teamId,
} from './state.js';
import { readRole } from './roles.js';

const STATE_DIR = '.report-review';
const TEAMS_DIR = 'teams';
const AGENTS_DIR = 'agents';

function safeResolve(cwd, value) {
  if (path.isAbsolute(value)) return value;
  return path.resolve(cwd, value);
}

function textOf(result) {
  if (result === undefined || result === null) return '';
  if (typeof result === 'string') return result;
  if (Array.isArray(result)) {
    return result
      .map((part) => {
        if (typeof part === 'string') return part;
        if (part && typeof part.text === 'string') return part.text;
        if (part && part.type === 'text' && typeof part.content === 'string') return part.content;
        return '';
      })
      .filter(Boolean)
      .join('\n');
  }
  if (typeof result === 'object') {
    if (typeof result.output === 'string') return result.output;
    if (Array.isArray(result.output)) return textOf(result.output);
    if (typeof result.text === 'string') return result.text;
    if (typeof result.finalText === 'string') return result.finalText;
    if (typeof result.message === 'string') return result.message;
    if (result.output && typeof result.output === 'object') return textOf(result.output);
    return JSON.stringify(result);
  }
  return String(result);
}

function errorText(error) {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function note(text, limit = 4000) {
  const value = typeof text === 'string' ? text.trim() : '';
  return value.length > limit ? `${value.slice(0, limit)}\n…[truncated]` : value;
}

export class ReportReviewRuntime {
  constructor(ctx, logger = console) {
    this.ctx = ctx;
    this.logger = logger;
    this.teamCwds = new Map();
    this.pending = new Map();
    this.childIndex = new Map();
    this.locks = new Map();
  }

  cwdOf(agent) {
    const cwd = agent?.session?.header?.cwd;
    return typeof cwd === 'string' && cwd.length > 0 ? cwd : process.cwd();
  }

  stateRoot(cwd) {
    return path.join(cwd, STATE_DIR);
  }

  teamsRoot(cwd) {
    return path.join(cwd, STATE_DIR, TEAMS_DIR);
  }

  teamFile(cwd, id) {
    return path.join(this.teamsRoot(cwd), `${id}.json`);
  }

  async withLock(key, operation) {
    const previous = this.locks.get(key) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(operation);
    let tail;
    tail = next.catch(() => undefined).finally(() => {
      if (this.locks.get(key) === tail) this.locks.delete(key);
    });
    this.locks.set(key, tail);
    return next;
  }

  async prepareRun({ cwd, title, reportPath, outputLang, outputDir }) {
    const base = outputDir ? safeResolve(cwd, outputDir) : path.join(cwd, 'reviews');
    const dirName = `${slugify(title || path.basename(reportPath || 'report'))}-${runId(reportPath)}`;
    const runDir = path.join(base, dirName);
    await mkdir(path.join(runDir, AGENTS_DIR), { recursive: true });
    const outputs = outputFiles(outputLang).map((entry) => ({
      lang: entry.lang,
      path: path.join(runDir, entry.filename),
    }));
    return { runDir, outputs };
  }

  async saveTeam(team, cwd) {
    const directory = this.teamsRoot(cwd);
    await mkdir(directory, { recursive: true });
    const file = this.teamFile(cwd, team.id);
    const temporary = `${file}.${process.pid}.tmp`;
    team.updatedAt = new Date().toISOString();
    await writeFile(temporary, `${JSON.stringify(team, null, 2)}\n`, 'utf8');
    const { rename } = await import('node:fs/promises');
    await rename(temporary, file);
    this.teamCwds.set(team.id, cwd);
  }

  async loadTeam(cwd, id) {
    const known = this.teamCwds.get(id);
    const roots = [...new Set([cwd, known].filter(Boolean))];
    for (const root of roots) {
      try {
        const raw = await readFile(this.teamFile(root, id), 'utf8');
        const team = JSON.parse(raw);
        this.teamCwds.set(id, root);
        return team;
      } catch (error) {
        if (error?.code !== 'ENOENT') this.logger.warn?.(`[report-reviewer] cannot read team ${id}: ${errorText(error)}`);
      }
    }
    throw new Error(`report-review team "${id}" was not found in ${roots.join(', ')}`);
  }

  async createTeam({ cwd, sessionId, title, reportPath, pentest, mode, chatLang, outputLang, outputDir, focus }) {
    const prepared = await this.prepareRun({ cwd, title, reportPath, outputLang, outputDir });
    const names = agentNamesFor(pentest);
    const team = createTeamRecord({
      id: teamId(),
      sessionId,
      cwd,
      title,
      reportPath,
      pentest,
      mode,
      chatLang,
      outputLang,
      focus,
      runDir: prepared.runDir,
      names,
    });
    team.outputs = prepared.outputs.map((entry) => ({ lang: entry.lang, path: null, plannedPath: entry.path }));
    for (const task of team.tasks) {
      if (task.role === 'task_handler') continue;
      task.outputPath = path.join(prepared.runDir, AGENTS_DIR, `${task.id}.md`);
    }
    await this.saveTeam(team, cwd);
    return team;
  }

  buildAgentPrompt({ team, task, member, prompt, language, outputPath }) {
    const roleText = readRole(task.role);
    const reportType = team.pentest ? 'penetration-test report' : 'non-pentest document';
    const lines = [
      `You are ${member.name}, the ${member.title} in the "${team.title}" report-review team.`,
      '',
      roleText.trim(),
      '',
      '--- TASK ---',
      `Task id: ${task.id}`,
      `Task: ${task.subject}`,
      `Report: ${team.reportPath}`,
      `Report type: ${reportType}`,
      `Output language: ${language}`,
      `Output file: ${outputPath}`,
      `Run directory: ${team.runDir}`,
      '',
      ...(team.focus === null || team.focus === undefined || team.focus === ''
        ? []
        : [
            '--- USER FOCUS ---',
            team.focus,
            'Apply this focus to the whole review. It adds emphasis; it does not replace the full review or the role instructions.',
            '',
          ]),
      '--- TOOLS AND RULES ---',
      'Use the best document-reading tool visible to you. Prefer doc_read for PDF/DOCX/XLSX/PPTX, pdf_read for page-specific PDF work, doc_ocr for image-only pages, and read for plain text.',
      'Read the report itself, not only the summary of it. Do not invent page numbers, quotes, findings, names, CVEs, or fixes.',
      'Every claim that refers to the report must carry a page citation such as (p.12) or (p.12-14).',
      'Keep quoted text, commands, host names, finding ids, CVEs and product names in the original language. Do not translate quoted text.',
      'Write only the designated Output file. Do not modify the input report or any other file in the run directory.',
      'Do not start subagents. Do not run network commands against any target. This is a document review, not a penetration test.',
      '',
      '--- TASK-SPECIFIC INSTRUCTION ---',
      String(prompt ?? '').trim(),
      '',
      '--- COMPLETION ---',
      'Write the complete structured report to the Output file using the write tool.',
      'If the file cannot be written, put the complete report in your final message instead.',
      'In your final message return: a line `DONE <path>` (or `FAILED <reason>`), a five-bullet summary, and a list of pages or sections you could not read.',
      'Do not paste the whole report into the final message when the file was written.',
    ];
    return lines.join('\n');
  }

  async startAgent({ agent, teamId: id, taskId, prompt, language, signal }) {
    const cwd = this.cwdOf(agent);
    return this.withLock(`${id}:${cwd}`, async () => {
      const team = await this.loadTeam(cwd, id);
      if (team.status !== 'running') throw new Error(`team ${id} is ${team.status}, not running`);
      const task = findTask(team, taskId);
      if (!task) throw new Error(`task "${taskId}" does not exist`);
      if (task.status === 'running' || task.status === 'completed') throw new Error(`task "${taskId}" is already ${task.status}`);
      const member = findMember(team, task.role);
      if (!member) throw new Error(`member for role "${task.role}" does not exist`);
      const subagents = this.ctx.get('subagents');
      if (subagents === undefined) throw new Error('the DSH subagent service is unavailable; run with --mode subagent or enable subagents');
      const outputPath = task.outputPath ?? path.join(team.runDir, AGENTS_DIR, `${task.id}.md`);
      await mkdir(path.dirname(outputPath), { recursive: true });
      const languageValue = language || team.specialistLanguage || 'en';
      const fullPrompt = this.buildAgentPrompt({ team, task, member, prompt, language: languageValue, outputPath });
      const activation = await subagents.startActivation({
        provider: 'spawn',
        label: `${team.title} / ${task.id}`,
        request: {
          prompt: [{ type: 'text', text: fullPrompt }],
          parent: agent,
          // The child is depth 1. `0` rejects the child itself; `1` allows
          // this child and blocks it from starting grandchildren.
          maxDepth: 1,
        },
        // The subagent service requires a real AbortSignal and calls
        // signal.throwIfAborted() before it admits the child. The tool call's
        // signal lives for the parent turn, which is the right lifetime: the
        // turn stays open while report_wait is waiting for the children.
        signal: signal ?? new AbortController().signal,
        delivery: 'caller',
      });
      this.pending.set(`${team.id}:${task.id}`, activation.result);
      this.childIndex.set(activation.childId, { cwd, teamId: team.id, taskId: task.id });
      patchTask(team, task.id, {
        status: 'running',
        childId: activation.childId,
        outputPath,
        startedAt: new Date().toISOString(),
      });
      patchMember(team, task.role, { status: 'running' });
      await this.saveTeam(team, cwd);
      return { childId: activation.childId, taskId: task.id, outputPath };
    });
  }

  async waitTeam({ agent, teamId: id }) {
    const cwd = this.cwdOf(agent);
    const initial = await this.loadTeam(cwd, id);
    const entries = initial.tasks
      .filter((task) => this.pending.has(`${initial.id}:${task.id}`))
      .map((task) => ({
        task,
        promise: this.pending.get(`${initial.id}:${task.id}`),
      }));
    const settled = await Promise.allSettled(entries.map((entry) => entry.promise));
    return this.withLock(`${id}:${cwd}`, async () => {
      const team = await this.loadTeam(cwd, id);
      for (let index = 0; index < entries.length; index += 1) {
        const task = findTask(team, entries[index].task.id) ?? entries[index].task;
        const result = settled[index];
        this.pending.delete(`${team.id}:${task.id}`);
        const member = findMember(team, task.role);
        if (result.status === 'fulfilled') {
          const output = note(textOf(result.value));
          let fileExists = false;
          try {
            const info = await stat(task.outputPath);
            fileExists = info.isFile() && info.size > 0;
          } catch {
            fileExists = false;
          }
          patchTask(team, task.id, {
            status: 'completed',
            endedAt: new Date().toISOString(),
            note: fileExists ? `Output written to ${task.outputPath}` : output || 'No output file was written.',
          });
          if (member) patchMember(team, task.role, { status: 'completed' });
          this.logger.info?.(`[report-reviewer] ${task.id} completed; outputFile=${String(fileExists)}`);
        } else {
          patchTask(team, task.id, {
            status: 'failed',
            endedAt: new Date().toISOString(),
            note: errorText(result.reason),
          });
          if (member) patchMember(team, task.role, { status: 'failed' });
          this.logger.warn?.(`[report-reviewer] ${task.id} failed: ${errorText(result.reason)}`);
        }
      }
      await this.saveTeam(team, cwd);
      return publicTeam(team);
    });
  }

  async onSubagentEnd(info) {
    // The lifecycle event carries the published child identity as `id`.
    const childId = info?.id ?? info?.childId ?? info?.subagentId;
    if (typeof childId !== 'string') return;
    const known = this.childIndex.get(childId);
    if (!known) return;
    try {
      await this.withLock(`${known.teamId}:${known.cwd}`, async () => {
        const team = await this.loadTeam(known.cwd, known.teamId);
        const task = findTask(team, known.taskId);
        if (!task || task.status === 'completed' || task.status === 'failed') return;
        const failed =
          Boolean(info?.error) ||
          ['error', 'aborted', 'max-tokens', 'refusal'].includes(info?.stopReason) ||
          info?.status === 'error';
        patchTask(team, task.id, {
          status: failed ? 'failed' : 'completed',
          endedAt: new Date().toISOString(),
          note: failed ? errorText(info?.error ?? info?.stopReason ?? 'child failed') : task.note ?? 'Child activation ended.',
        });
        patchMember(team, task.role, { status: failed ? 'failed' : 'completed' });
        await this.saveTeam(team, known.cwd);
        this.childIndex.delete(childId);
      });
    } catch (error) {
      this.logger.warn?.(`[report-reviewer] cannot update child ${childId}: ${errorText(error)}`);
    }
  }

  async updateTask({ agent, teamId: id, taskId, status, note: taskNote }) {
    const cwd = this.cwdOf(agent);
    return this.withLock(`${id}:${cwd}`, async () => {
      const team = await this.loadTeam(cwd, id);
      const task = findTask(team, taskId);
      if (!task) throw new Error(`task "${taskId}" does not exist`);
      if (!['pending', 'running', 'completed', 'failed', 'skipped'].includes(status)) {
        throw new Error(`invalid task status "${status}"`);
      }
      patchTask(team, taskId, {
        status,
        note: taskNote ?? task.note,
        ...(status === 'completed' || status === 'failed' ? { endedAt: new Date().toISOString() } : {}),
      });
      if (task.role !== 'task_handler') patchMember(team, task.role, { status });
      if (taskId === 'final-review' && status === 'completed') {
        team.status = 'done';
        team.archivedAt = new Date().toISOString();
      }
      await this.saveTeam(team, cwd);
      return publicTeam(team);
    });
  }

  async finish({ agent, teamId: id, outputs, summary }) {
    const cwd = this.cwdOf(agent);
    return this.withLock(`${id}:${cwd}`, async () => {
      const team = await this.loadTeam(cwd, id);
      team.outputs = Array.isArray(outputs)
        ? outputs
            .filter((entry) => entry && typeof entry.path === 'string' && entry.path.length > 0)
            .map((entry) => ({ lang: String(entry.lang ?? 'en'), path: entry.path }))
        : team.outputs;
      if (typeof summary === 'string' && summary.trim() !== '') team.summary = summary.trim();
      patchTask(team, 'final-review', {
        status: 'completed',
        endedAt: new Date().toISOString(),
        note: team.summary ?? 'Final review completed.',
      });
      patchMember(team, 'task_handler', { status: 'completed' });
      for (const member of team.members) {
        if (member.key !== 'task_handler' && member.status === 'running') member.status = 'completed';
      }
      team.status = 'done';
      team.archivedAt = new Date().toISOString();
      await this.saveTeam(team, cwd);
      return publicTeam(team);
    });
  }

  async status({ agent, teamId: id }) {
    const cwd = this.cwdOf(agent);
    const team = await this.loadTeam(cwd, id);
    return publicTeam(team);
  }

  async listTeamsForSession(sessionId) {
    const roots = new Set();
    const registry = this.ctx.get('workspaceRegistry');
    if (registry?.list) {
      for (const workspace of registry.list()) {
        if (typeof workspace?.path === 'string') roots.add(workspace.path);
      }
    }
    const live = this.ctx.get('agents')?.get?.(sessionId);
    if (live) roots.add(this.cwdOf(live));
    for (const [id, cwd] of this.teamCwds) {
      if (id) roots.add(cwd);
    }
    const teams = [];
    for (const root of roots) {
      let files = [];
      try {
        files = await readdir(this.teamsRoot(root));
      } catch {
        continue;
      }
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        try {
          const team = JSON.parse(await readFile(path.join(this.teamsRoot(root), file), 'utf8'));
          if (sessionId === undefined || team.sessionId === sessionId) teams.push(team);
        } catch {
          // A half-written or unrelated file must not break the panel.
        }
      }
    }
    teams.sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt)));
    return teams;
  }

  progressOf(team) {
    return progress(team);
  }

  specialistLanguage(team) {
    return team?.specialistLanguage ?? specialistLanguageFor(team?.outputLang);
  }
}
