/**
 * Model-facing tools for the report-review team runtime.
 *
 * The tools are intentionally small and legible: create the run, start named
 * child agents, wait for their reports, update the final-review task, and
 * finish. The panel is read-only over the same persisted state.
 */

import {
  CHAT_LANGS,
  OUTPUT_LANGS,
  agentNamesFor,
  outputFiles,
  publicTeam,
  specialistLanguageFor,
} from './state.js';
import { readRole } from './roles.js';
import path from 'node:path';

/**
 * Turn the compact authoring map used below (one schema per parameter, with
 * `required: true` on the parameter) into the object-rooted JSON Schema that
 * `ctx.tools.register` sends to the model.
 *
 * This is deliberately local. The plugin has no npm dependencies and is often
 * installed as a linked workspace package, so `@deepseek-ai/dsh-tools` is not
 * resolvable from here. The previous fallback returned the authoring map
 * unchanged, which the provider rejected with:
 *   Invalid schema for function ... is not of type "string"
 */
function compileParameters(parameters) {
  const properties = {};
  const required = [];
  for (const [name, schema] of Object.entries(parameters ?? {})) {
    if (schema === null || typeof schema !== 'object' || Array.isArray(schema)) {
      throw new TypeError(`parameter "${name}" must be a schema object`);
    }
    const { required: isRequired, ...wireSchema } = schema;
    properties[name] = wireSchema;
    if (isRequired === true) required.push(name);
  }
  return {
    type: 'object',
    properties,
    ...(required.length === 0 ? {} : { required }),
  };
}

/** Register-ready tool definition with a valid model-facing parameter schema. */
function defineTool(definition) {
  return { ...definition, parameters: compileParameters(definition.parameters) };
}

const textOutput = {
  schema: { type: 'string' },
  render: (_args, value) => [{ type: 'text', text: typeof value === 'string' ? value : JSON.stringify(value) }],
};

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`;
}

function failure(tool, error) {
  return `${tool}: ERROR: ${error instanceof Error ? error.message : String(error)}`;
}

const ROLE_TITLES = {
  task_handler: 'Task Handler',
  reader: 'Reader',
  technical: 'Technical Consultant',
  client: 'Client Consultant',
  proofreader: 'Proofreader',
  rebuttal: 'Rebuttal Reviewer',
};

const ROLE_NAMES = {
  task_handler: 'Cope',
  reader: 'Alice',
  technical: 'Bolt',
  client: 'Fish',
  proofreader: 'Mira',
  rebuttal: 'Onyx',
};

export function createTools(runtime) {
  return [
    defineTool({
      name: 'report_prepare_run',
      description:
        'Create the output folder for one report review and return the folder plus the planned Markdown paths. Use this in --mode subagent; in --mode team use report_team_create instead. It does not read the report and does not start agents.',
      parameters: {
        title: { type: 'string', description: 'Short report title used in the run folder name.' },
        reportPath: { type: 'string', description: 'Path to the report being reviewed.', required: true },
        outputLang: {
          type: 'string',
          enum: [...OUTPUT_LANGS],
          description: 'Document language: en, zh-Hans, zh-Hant, both, both-hans, or both-hant. Default: en.',
        },
        outputDir: { type: 'string', description: 'Optional output directory. Default: reviews/ in the workspace.' },
        focus: {
          type: 'string',
          description: 'Optional user focus: specific requirements, actions, or points to emphasize. It adds emphasis; it does not replace the full review.',
        },
      },
      output: textOutput,
      timeoutMs: 60_000,
      async execute(args, exec) {
        try {
          const cwd = runtime.cwdOf(exec.agent);
          const outputLang = args.outputLang ?? 'en';
          const prepared = await runtime.prepareRun({
            cwd,
            title: args.title,
            reportPath: args.reportPath,
            outputLang,
            outputDir: args.outputDir,
          });
          return json({
            runDir: prepared.runDir,
            agentsDir: path.join(prepared.runDir, 'agents'),
            outputs: prepared.outputs,
            outputFiles: outputFiles(outputLang),
            suggestedNames: agentNamesFor(true),
            focus: args.focus ?? null,
          });
        } catch (error) {
          return failure('report_prepare_run', error);
        }
      },
    }),

    defineTool({
      name: 'report_team_create',
      description:
        'Create the visible report-review team for --mode team. The team has named members, task rows, a run folder, and the user focus. It returns the team id and the task ids. Use the task ids with report_agent_start.',
      parameters: {
        title: { type: 'string', description: 'Short report title.', required: true },
        reportPath: { type: 'string', description: 'Path to the report being reviewed.', required: true },
        pentest: {
          type: 'boolean',
          description: 'True only when the document is a penetration-test report. Non-pentest runs omit the Technical Consultant and the Rebuttal Reviewer.',
          required: true,
        },
        mode: {
          type: 'string',
          enum: ['team', 'subagent'],
          description: 'Orchestration mode. Use team here.',
          required: true,
        },
        chatLang: {
          type: 'string',
          enum: [...CHAT_LANGS],
          description: 'Language of the chat review: en, zh-Hans, or zh-Hant. Default: en.',
        },
        outputLang: {
          type: 'string',
          enum: [...OUTPUT_LANGS],
          description: 'Language(s) of the Markdown documents. Default: en.',
        },
        outputDir: { type: 'string', description: 'Optional output directory. Default: reviews/.' },
        focus: {
          type: 'string',
          description: 'Optional user focus: specific requirements, actions, or points to emphasize. It adds emphasis; it does not replace the full review.',
        },
      },
      output: textOutput,
      timeoutMs: 60_000,
      async execute(args, exec) {
        try {
          const cwd = runtime.cwdOf(exec.agent);
          const sessionId = exec.agent?.id ?? exec.agent?.session?.id;
          const team = await runtime.createTeam({
            cwd,
            sessionId,
            title: args.title,
            reportPath: args.reportPath,
            pentest: args.pentest === true,
            mode: 'team',
            chatLang: args.chatLang ?? 'en',
            outputLang: args.outputLang ?? 'en',
            outputDir: args.outputDir,
            focus: args.focus,
          });
          return json({
            team: publicTeam(team),
            runDir: team.runDir,
            tasks: team.tasks.map((task) => ({ id: task.id, subject: task.subject, assignee: task.assignee, role: task.role })),
            specialistLanguage: specialistLanguageFor(team.outputLang),
          });
        } catch (error) {
          return failure('report_team_create', error);
        }
      },
    }),

    defineTool({
      name: 'report_agent_start',
      description:
        'Start one named child agent for a task in the report-review team. The child writes its complete report to its task output file. Call this for all independent tasks in one assistant message; then call report_wait once.',
      parameters: {
        teamId: { type: 'string', description: 'Team id returned by report_team_create.', required: true },
        taskId: { type: 'string', description: 'Task id, for example read-summary or proofread.', required: true },
        prompt: { type: 'string', description: 'Task-specific instruction for this agent. The role prompt is added by the host.', required: true },
        language: {
          type: 'string',
          enum: [...CHAT_LANGS],
          description: 'Optional specialist report language. Default: English when any English output is requested, otherwise the first output language.',
        },
      },
      output: textOutput,
      timeoutMs: 120_000,
      isConcurrencySafe: () => true,
      async execute(args, exec) {
        try {
          const started = await runtime.startAgent({
            agent: exec.agent,
            teamId: args.teamId,
            taskId: args.taskId,
            prompt: args.prompt,
            language: args.language,
            signal: exec.signal,
          });
          return json({ started: true, ...started });
        } catch (error) {
          return failure('report_agent_start', error);
        }
      },
    }),

    defineTool({
      name: 'report_wait',
      description:
        'Wait for all running child agents in the report-review team to finish. Returns each task status and its output file path. Call once after starting the independent tasks.',
      parameters: {
        teamId: { type: 'string', description: 'Team id returned by report_team_create.', required: true },
      },
      output: textOutput,
      timeoutMs: 1_800_000,
      async execute(args, exec) {
        try {
          const team = await runtime.waitTeam({ agent: exec.agent, teamId: args.teamId });
          return json({ team });
        } catch (error) {
          return failure('report_wait', error);
        }
      },
    }),

    defineTool({
      name: 'report_team_status',
      description:
        'Read the current report-review team state: members, tasks, status, output folder, and document paths. Use it before the final review if you need a fresh snapshot.',
      parameters: {
        teamId: { type: 'string', description: 'Team id returned by report_team_create.', required: true },
      },
      output: textOutput,
      timeoutMs: 30_000,
      async execute(args, exec) {
        try {
          const team = await runtime.status({ agent: exec.agent, teamId: args.teamId });
          return json({ team });
        } catch (error) {
          return failure('report_team_status', error);
        }
      },
    }),

    defineTool({
      name: 'report_task_update',
      description:
        'Update one task state. Use it to mark the final-review task running or completed, or to record a failure. Normal child tasks are updated automatically.',
      parameters: {
        teamId: { type: 'string', description: 'Team id.', required: true },
        taskId: { type: 'string', description: 'Task id.', required: true },
        status: {
          type: 'string',
          enum: ['pending', 'running', 'completed', 'failed', 'skipped'],
          description: 'New task status.',
          required: true,
        },
        note: { type: 'string', description: 'Optional short note.' },
      },
      output: textOutput,
      timeoutMs: 30_000,
      async execute(args, exec) {
        try {
          const team = await runtime.updateTask({
            agent: exec.agent,
            teamId: args.teamId,
            taskId: args.taskId,
            status: args.status,
            note: args.note,
          });
          return json({ team });
        } catch (error) {
          return failure('report_task_update', error);
        }
      },
    }),

    defineTool({
      name: 'report_team_finish',
      description:
        'Finish the report-review team: record the final Markdown paths and a short summary, mark the final-review task completed, and archive the run. Call only after the document files have been written.',
      parameters: {
        teamId: { type: 'string', description: 'Team id.', required: true },
        outputs: {
          type: 'array',
          description: 'The written Markdown files, one object per file: { lang, path }.',
          items: {
            type: 'object',
            properties: {
              lang: { type: 'string', description: 'en, zh-Hans, or zh-Hant.' },
              path: { type: 'string', description: 'Absolute or workspace-relative path to the Markdown file.' },
            },
            required: ['lang', 'path'],
          },
        },
        summary: { type: 'string', description: 'Short review summary for the team record.' },
      },
      output: textOutput,
      timeoutMs: 60_000,
      async execute(args, exec) {
        try {
          const team = await runtime.finish({
            agent: exec.agent,
            teamId: args.teamId,
            outputs: args.outputs,
            summary: args.summary,
          });
          return json({ team });
        } catch (error) {
          return failure('report_team_finish', error);
        }
      },
    }),

    defineTool({
      name: 'report_role_prompt',
      description:
        'Build a complete role prompt for one specialist. Use this in --mode subagent before calling the native subagent tool. In --mode team report_agent_start builds the prompt for you.',
      parameters: {
        role: {
          type: 'string',
          enum: ['reader', 'technical', 'client', 'proofreader', 'rebuttal'],
          description: 'Specialist role.',
          required: true,
        },
        name: { type: 'string', description: 'Friendly agent name, e.g. a name from suggestedNames.' },
        task: { type: 'string', description: 'Task-specific instruction.', required: true },
        reportPath: { type: 'string', description: 'Path to the report.', required: true },
        outputPath: { type: 'string', description: 'Path the child must write its report to.', required: true },
        language: {
          type: 'string',
          enum: [...CHAT_LANGS],
          description: 'Specialist report language.',
          required: true,
        },
        pentest: { type: 'boolean', description: 'Whether the document is a pentest report.' },
        title: { type: 'string', description: 'Report title.' },
        runDir: { type: 'string', description: 'Current run directory.' },
        focus: {
          type: 'string',
          description: 'Optional user focus: specific requirements, actions, or points to emphasize.',
        },
      },
      output: textOutput,
      timeoutMs: 30_000,
      isConcurrencySafe: () => true,
      async execute(args) {
        try {
          const role = args.role;
          const member = {
            name: args.name || ROLE_NAMES[role] || role,
            title: ROLE_TITLES[role] || role,
          };
          const team = {
            title: args.title || 'Report review',
            reportPath: args.reportPath,
            pentest: args.pentest === true,
            focus: args.focus ?? null,
            runDir: args.runDir || '',
          };
          const task = { id: role, subject: args.task, role };
          const prompt = runtime.buildAgentPrompt({
            team,
            task,
            member,
            prompt: args.task,
            language: args.language,
            outputPath: args.outputPath,
          });
          return prompt;
        } catch (error) {
          return failure('report_role_prompt', error);
        }
      },
    }),
  ];
}
