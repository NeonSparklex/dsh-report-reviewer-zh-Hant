# Changelog

## 0.3.0 — 2026-11-06

- Traditional Chinese-only port. The original multilingual folder is kept.
- Added a **user focus** field. Text after the options is passed verbatim to
  every specialist, shown in the panel, and applied in the final review. It
  adds emphasis; it does not replace the full review.
- Added the **Rebuttal Reviewer** (pentest only): a client-side senior
  sysadmin/security reviewer that challenges severity, impact, evidence and
  remediation in a professional way. The goal is a more accurate and defensible
  report, not blame avoidance.
- Chat and Markdown output now default to English. `--lang` and
  `--outputlang` override them. The panel UI follows the DSH display language.
- Added `--nochatwindow`: the final chat message is only a short completion
  notice plus the run folder and document paths; the Markdown review is
  unchanged.
- Removed session-specific wording from the active plugin;
  examples and tests now use a generic `report.pdf` / `sample-report.pdf`.
- Added regression tests for focus, the Rebuttal Reviewer, the new task counts,
  and the name-to-task mapping.

## 0.2.0 — 2026-11-06

- The findings summary is now a table grouped by severity. Every row carries
  the remediation key points, so the client sees “what is wrong” and “what to
  do” in the same view.
- The remediation summary is now a table by Short / Medium / Long term with
  counts, main actions, findings covered, and coverage gaps.
- Specialist names are randomized on every new review from a 27-name pool.
  No specialist name repeats within a run, and the pool never uses the fixed
  Task Handler name (`Cope`). Subagent mode receives the same unique names
  through `suggestedNames`.
- Added regression tests for the name picker, the name-to-task mapping, and
  per-run uniqueness.

## 0.1.1 — 2026-11-06

- Fix the tool parameter schema sent to the model. The previous build sent the
  authoring map (`{ title: { type: "string", ... } }`) instead of an
  object-rooted JSON Schema, so the provider rejected every request with
  `Invalid schema for function 'report_prepare_run'`.
- Add a regression test for every tool's model-facing parameter schema.
- Pass a real `AbortSignal` to the subagent service. Without it, the first
  `report_agent_start` call would fail inside `startActivation`.
- Set the child's `maxDepth` to `1`. `0` rejected the child itself with
  `subagent depth 1 exceeds maxDepth 0`.
- Read the published child id from the lifecycle event's `id` field and treat
  `aborted`, `max-tokens`, and `refusal` as failed outcomes.

## 0.1.0 — 2026-11-06

- Initial `/report-review` skill.
- Structural summary, language/consistency scan, technical/factual review, and client/technical advice.
- Pentest gate: non-pentest documents keep Reader, Proofreader, and Client Consultant only.
- Custom named-agent team runtime with live task tracking.
- Custom right-sidebar Report Review panel.
- `--mode team` and `--mode subagent`.
- Independent `--lang` and `--outputlang` settings.
- English, Simplified Chinese, and Traditional Chinese output.
- Two separate Markdown files for `both`, `both-hans`, and `both-hant`.
