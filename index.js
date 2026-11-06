/**
 * dsh-report-reviewer-zh-hant — host half.
 *
 * Registers:
 *   - the user-invocable `/report-review` skill,
 *   - the report-review team tools,
 *   - the authenticated panel-state route,
 *   - live child-settlement tracking for the custom panel.
 *
 * There is no dependency on dsh-agent-teams or dsh-doc-reader. The skill asks
 * the agent to use whichever document-reading tools are present, and the team
 * runtime uses DSH's native subagent service.
 */

import { readSkill } from './lib/roles.js';
import { ReportReviewRuntime } from './lib/runtime.js';
import { createTools } from './lib/tools.js';
import { registerStateRoute } from './lib/route.js';

export const name = 'report-reviewer-zh-hant';

export function apply(ctx) {
  const runtime = new ReportReviewRuntime(ctx, ctx.logger ?? console);

  ctx.inject(['tools'], (toolCtx) => {
    const tools = createTools(runtime);
    toolCtx.effect(() => {
      const disposers = tools.map((tool) => toolCtx.tools.register(tool));
      return () => {
        for (const dispose of disposers.reverse()) {
          try {
            dispose?.();
          } catch {
            /* keep unloading */
          }
        }
      };
    }, 'report-reviewer: tools');
  });

  ctx.inject(['skills'], (skillCtx) => {
    skillCtx.effect(
      () =>
        skillCtx.skills.register({
          name: 'report-review',
          description:
            'Review a report or deliverable: a page-cited structural summary, a mistake and inconsistency scan, and client/technical improvement advice. Pentest reports get the full review; other documents keep the summary, proofreading, and client advice.',
          whenToUse:
            'Use when the user asks to review, summarize, proofread, or improve a report or deliverable, especially a penetration-test report. Invoke with /report-review <path> and optional --lang, --outputlang, --mode, and --out options.',
          content: readSkill(),
          source: 'dsh-report-reviewer',
          invocation: {
            modelInvocable: true,
            userInvocable: true,
          },
        }),
      'report-reviewer: skill',
    );
  });

  ctx.inject(['webServer'], (webCtx) => {
    const webServer = webCtx.get('webServer');
    if (webServer !== undefined) {
      registerStateRoute({ ctx: webCtx, runtime, webServer });
    }
  });

  ctx.on('subagent/end', (info) => {
    void runtime.onSubagentEnd(info);
  });
}
