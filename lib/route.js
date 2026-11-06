/**
 * Authenticated read-only route used by the custom right-sidebar panel.
 *
 * The panel polls this route; it never writes team state. The route is
 * registered only when the Web server service is present, so headless
 * profiles can still use the tools and the slash command.
 */

import { publicTeam } from './state.js';

function sendJson(res, status, value) {
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
  });
  res.end(JSON.stringify(value));
}

export function registerStateRoute({ ctx, runtime, webServer }) {
  return ctx.effect(
    () =>
      webServer.register({
        kind: 'exact',
        path: '/plugins/dsh-report-reviewer-zh-hant/state',
        handler: async (req, res) => {
          if (req.method !== 'GET') {
            res.writeHead(405, { allow: 'GET', 'cache-control': 'no-store' });
            res.end();
            return;
          }
          const gate = ctx.get('connection');
          const rejection = gate === undefined ? 503 : gate.requestRejection(req);
          if (rejection !== undefined) {
            sendJson(res, rejection, {
              error: rejection === 503 ? 'authentication unavailable' : rejection === 401 ? 'unauthorized' : 'forbidden',
            });
            return;
          }
          let sessionId;
          try {
            const url = new URL(req.url ?? '/', 'http://local');
            sessionId = url.searchParams.get('sessionId') ?? undefined;
          } catch {
            sendJson(res, 400, { error: 'invalid request url' });
            return;
          }
          try {
            const teams = await runtime.listTeamsForSession(sessionId);
            sendJson(res, 200, {
              generatedAt: new Date().toISOString(),
              teams: teams.map((team) => publicTeam(team)),
            });
          } catch (error) {
            ctx.logger.warn?.(`[report-reviewer] panel state failed: ${error instanceof Error ? error.message : String(error)}`);
            sendJson(res, 500, { error: 'failed to read report-review state' });
          }
        },
      }),
    'report-reviewer: panel state route',
  );
}
