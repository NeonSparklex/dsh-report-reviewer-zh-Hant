window.__ModuleLoader__.load({
  id: 'dsh-report-reviewer-zh-hant',
  factory(require) {
    const React = require('react');
    const h = React.createElement;

    const NS = 'reportReviewZhHant';
    const TAB_ID = 'dsh-report-reviewer-zh-hant';
    const TAB_KIND = 'report-review-zh-hant';
    const ROUTE = '/plugins/dsh-report-reviewer-zh-hant/state';

    const EN = {
      'panel.title': 'Report Review',
      'panel.loading': 'Loading review team…',
      'panel.error': 'Review panel data is unavailable.',
      'panel.empty': 'No review has run in this session yet.',
      'panel.emptyHint': 'Run /report-review <report-path> to start one.',
      'panel.team': 'Team',
      'panel.agents': 'Agents',
      'panel.tasks': 'Tasks',
      'panel.outputs': 'Output documents',
      'panel.agentReports': 'Agent reports',
      'panel.report': 'Report',
      'panel.mode': 'Mode',
      'panel.language': 'Chat language',
      'panel.docLanguage': 'Document language',
      'panel.runDir': 'Run folder',
      'panel.progress': 'Progress',
      'panel.status': 'Status',
      'panel.assignee': 'Assignee',
      'panel.dependencies': 'Depends on',
      'panel.noOutputs': 'The final documents are not written yet.',
      'panel.noSummary': 'No final summary recorded.',
      'panel.generated': 'Last update',
      'panel.open': 'Open report review panel',
      'panel.headerButton': 'Review',
      'status.pending': 'pending',
      'status.running': 'running',
      'status.completed': 'completed',
      'status.failed': 'failed',
      'status.skipped': 'skipped',
      'status.done': 'done',
      'status.team.running': 'running',
      'status.team.done': 'done',
      'status.team.failed': 'failed',
      'progress.of': 'of',
      'progress.tasks': 'tasks',
      'role.task_handler': 'Task Handler',
      'role.reader': 'Reader',
      'role.technical': 'Technical Consultant',
      'role.client': 'Client Consultant',
      'role.proofreader': 'Proofreader',
      'panel.focus': 'User focus',
      'panel.pentest': 'pentest',
      'panel.nonPentest': 'non-pentest',
      'panel.summary': 'Summary',
      'panel.written': 'written',
      'panel.planned': 'planned',
      'panel.running': 'running',
      'panel.mode.team': 'team',
      'panel.mode.subagent': 'subagent',
      'role.rebuttal': 'Rebuttal Reviewer',
    };

    const ZH = {
      'panel.title': '报告评审',
      'panel.loading': '正在加载评审团队…',
      'panel.error': '评审面板数据暂不可用。',
      'panel.empty': '当前会话还没有运行过评审。',
      'panel.emptyHint': '运行 /report-review <报告路径> 开始。',
      'panel.team': '团队',
      'panel.agents': '代理',
      'panel.tasks': '任务',
      'panel.outputs': '输出文档',
      'panel.agentReports': '代理报告',
      'panel.report': '报告',
      'panel.mode': '模式',
      'panel.language': '聊天语言',
      'panel.docLanguage': '文档语言',
      'panel.runDir': '运行目录',
      'panel.progress': '进度',
      'panel.status': '状态',
      'panel.assignee': '负责人',
      'panel.dependencies': '依赖',
      'panel.noOutputs': '最终文档尚未写入。',
      'panel.noSummary': '没有记录最终摘要。',
      'panel.generated': '最后更新',
      'panel.open': '打开报告评审面板',
      'panel.headerButton': '评审',
      'status.pending': '等待中',
      'status.running': '进行中',
      'status.completed': '已完成',
      'status.failed': '失败',
      'status.skipped': '已跳过',
      'status.done': '已完成',
      'status.team.running': '进行中',
      'status.team.done': '已完成',
      'status.team.failed': '失败',
      'progress.of': '/',
      'progress.tasks': '个任务',
      'role.task_handler': '任务处理者',
      'role.reader': '阅读者',
      'role.technical': '技术顾问',
      'role.client': '客户顾问',
      'role.proofreader': '校对者',
      'panel.focus': '用户关注点',
      'panel.pentest': '渗透测试',
      'panel.nonPentest': '非渗透测试',
      'panel.summary': '摘要',
      'panel.written': '已写入',
      'panel.planned': '计划中',
      'panel.running': '进行中',
      'panel.mode.team': '团队',
      'panel.mode.subagent': '子代理',
      'role.rebuttal': '反驳评审',
    };

    const ZH_HANT = {
      'panel.title': '報告評審',
      'panel.loading': '正在載入評審團隊…',
      'panel.error': '評審面板資料暫不可用。',
      'panel.empty': '目前工作階段還沒有執行過評審。',
      'panel.emptyHint': '執行 /report-review <報告路徑> 開始。',
      'panel.team': '團隊',
      'panel.agents': '代理',
      'panel.tasks': '任務',
      'panel.outputs': '輸出文件',
      'panel.agentReports': '代理報告',
      'panel.report': '報告',
      'panel.mode': '模式',
      'panel.language': '聊天語言',
      'panel.docLanguage': '文件語言',
      'panel.runDir': '執行目錄',
      'panel.progress': '進度',
      'panel.status': '狀態',
      'panel.assignee': '負責人',
      'panel.dependencies': '依賴',
      'panel.noOutputs': '最終文件尚未寫入。',
      'panel.noSummary': '沒有記錄最終摘要。',
      'panel.generated': '最後更新',
      'panel.open': '開啟報告評審面板',
      'panel.headerButton': '評審',
      'status.pending': '等待中',
      'status.running': '進行中',
      'status.completed': '已完成',
      'status.failed': '失敗',
      'status.skipped': '已跳過',
      'status.done': '已完成',
      'status.team.running': '進行中',
      'status.team.done': '已完成',
      'status.team.failed': '失敗',
      'progress.of': '/',
      'progress.tasks': '個任務',
      'role.task_handler': '任務處理者',
      'role.reader': '閱讀者',
      'role.technical': '技術顧問',
      'role.client': '客戶顧問',
      'role.proofreader': '校對者',
      'panel.focus': '使用者關注點',
      'panel.pentest': '滲透測試',
      'panel.nonPentest': '非滲透測試',
      'panel.summary': '摘要',
      'panel.written': '已寫入',
      'panel.planned': '計劃中',
      'panel.running': '進行中',
      'panel.mode.team': '團隊',
      'panel.mode.subagent': '子代理',
      'role.rebuttal': '反駁評審',
    };

    const FIXED_T = (key) => ZH_HANT[key] ?? EN[key] ?? key;

    const COLORS = {
      completed: 'var(--dsw-alias-state-success-primary)',
      done: 'var(--dsw-alias-state-success-primary)',
      running: 'var(--dsw-alias-state-warn-primary)',
      failed: 'var(--dsw-alias-state-error-primary)',
      skipped: 'var(--dsw-alias-state-idle-primary)',
      pending: 'var(--dsw-alias-state-idle-primary)',
    };

    const cardStyle = {
      border: '1px solid var(--dsw-alias-border-l1)',
      borderRadius: '8px',
      background: 'var(--dsw-alias-bg-layer-1)',
      padding: '10px 11px',
      marginBottom: '10px',
    };

    const sectionTitleStyle = {
      margin: '0 0 7px',
      fontSize: '11px',
      fontWeight: 600,
      letterSpacing: '0.04em',
      textTransform: 'uppercase',
      color: 'var(--dsw-alias-label-secondary)',
    };

    const monoStyle = {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      fontSize: '11px',
      wordBreak: 'break-word',
    };

    const mutedStyle = { color: 'var(--dsw-alias-label-secondary)' };

    function useLabel(t) {
      return (key, fallback) => {
        if (typeof t !== 'function') return fallback ?? key;
        const value = t(key);
        return value === key ? (fallback ?? key) : value;
      };
    }

    function StatusDot({ status }) {
      return h('span', {
        'aria-hidden': true,
        style: {
          display: 'inline-block',
          width: '7px',
          height: '7px',
          borderRadius: '50%',
          marginRight: '6px',
          background: COLORS[status] ?? COLORS.pending,
          flex: '0 0 auto',
        },
      });
    }

    function Badge({ status, label }) {
      return h(
        'span',
        {
          style: {
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            border: `1px solid ${COLORS[status] ?? COLORS.pending}`,
            color: COLORS[status] ?? COLORS.pending,
            borderRadius: '999px',
            padding: '1px 7px',
            fontSize: '10.5px',
            lineHeight: '16px',
            whiteSpace: 'nowrap',
          },
        },
        label,
      );
    }

    function Row({ children, style }) {
      return h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', ...style } }, children);
    }

    function ProgressBar({ team, label }) {
      const progress = team.progress ?? { total: 0, completed: 0, failed: 0, running: 0 };
      const total = Math.max(1, progress.total ?? 0);
      const done = (progress.completed ?? 0) + (progress.failed ?? 0);
      const width = `${Math.min(100, Math.round((done / total) * 100))}%`;
      return h(
        'div',
        { style: { marginBottom: '10px' } },
        h(
          'div',
          { style: { display: 'flex', justifyContent: 'space-between', marginBottom: '4px', ...mutedStyle } },
          h('span', null, label),
          h('span', null, `${progress.completed ?? 0}/${progress.total ?? 0}`),
        ),
        h(
          'div',
          {
            style: {
              height: '5px',
              borderRadius: '999px',
              background: 'var(--dsw-alias-bg-layer-2)',
              overflow: 'hidden',
            },
          },
          h('div', {
            style: {
              height: '100%',
              width,
              background: 'var(--dsw-alias-brand-primary)',
              borderRadius: '999px',
              transition: 'width 240ms ease',
            },
          }),
        ),
        (progress.running ?? 0) > 0
          ? h('div', { style: { ...mutedStyle, fontSize: '10.5px', marginTop: '4px' } }, `${progress.running} ${tr('panel.running', 'running')}`)
          : null,
      );
    }

    function AgentRows({ team, tr }) {
      const members = Array.isArray(team.members) ? team.members : [];
      return h(
        'div',
        null,
        members.map((member) =>
          h(
            Row,
            {
              key: member.key,
              style: {
                justifyContent: 'space-between',
                padding: '5px 0',
                borderTop: '1px solid var(--dsw-alias-border-l1)',
              },
            },
            h(
              Row,
              { style: { minWidth: 0 } },
              h(StatusDot, { status: member.status }),
              h('span', { style: { fontWeight: 550 } }, member.name),
              h('span', { style: { ...mutedStyle, fontSize: '10.5px' } }, tr(`role.${member.key}`, member.title)),
            ),
            h(Badge, { status: member.status, label: tr(`status.${member.status}`, member.status) }),
          ),
        ),
      );
    }

    function TaskRows({ team, tr }) {
      const tasks = Array.isArray(team.tasks) ? team.tasks : [];
      return h(
        'div',
        null,
        tasks.map((task) =>
          h(
            'div',
            {
              key: task.id,
              style: {
                padding: '7px 0',
                borderTop: '1px solid var(--dsw-alias-border-l1)',
              },
            },
            h(
              Row,
              { style: { alignItems: 'flex-start', justifyContent: 'space-between' } },
              h(
                'div',
                { style: { minWidth: 0 } },
                h(
                  Row,
                  { style: { alignItems: 'center' } },
                  h(StatusDot, { status: task.status }),
                  h('span', { style: { fontWeight: 550, ...monoStyle } }, task.id),
                  h('span', { style: { ...mutedStyle, fontSize: '10.5px' } }, `· ${task.assignee}`),
                ),
                h('div', { style: { marginTop: '2px', lineHeight: 1.45 } }, task.subject),
                task.dependencies && task.dependencies.length > 0
                  ? h(
                      'div',
                      { style: { ...mutedStyle, fontSize: '10.5px', marginTop: '2px' } },
                      `${tr('panel.dependencies', 'Depends on')}: ${task.dependencies.join(', ')}`,
                    )
                  : null,
                task.outputPath
                  ? h(
                      'div',
                      { style: { ...monoStyle, ...mutedStyle, marginTop: '3px' } },
                      task.outputPath,
                    )
                  : null,
              ),
              h(Badge, { status: task.status, label: tr(`status.${task.status}`, task.status) }),
            ),
          ),
        ),
      );
    }

    function OutputRows({ team, tr }) {
      const outputs = Array.isArray(team.outputs) ? team.outputs : [];
      if (outputs.length === 0) {
        return h('div', { style: { ...mutedStyle, fontSize: '11.5px' } }, tr('panel.noOutputs', 'The final documents are not written yet.'));
      }
      return h(
        'div',
        null,
        outputs.map((output, index) =>
          h(
            'div',
            {
              key: `${output.lang}-${index}`,
              style: {
                padding: '6px 0',
                borderTop: '1px solid var(--dsw-alias-border-l1)',
              },
            },
            h(
              Row,
              { style: { justifyContent: 'space-between' } },
              h('span', { style: { fontWeight: 550 } }, output.lang ?? 'en'),
              h('span', { style: { ...mutedStyle, fontSize: '10.5px' } }, output.path ? tr('panel.written', 'written') : tr('panel.planned', 'planned')),
            ),
            h('div', { style: { ...monoStyle, ...mutedStyle, marginTop: '3px' } }, output.path ?? output.plannedPath ?? ''),
          ),
        ),
      );
    }

    function Panel({ sessionId, t }) {
      const tr = useLabel(FIXED_T);
      const [snapshot, setSnapshot] = React.useState({ loading: true, error: null, teams: [], generatedAt: null });

      React.useEffect(() => {
        let cancelled = false;
        let timer = null;
        const load = async () => {
          try {
            const query = sessionId ? `?sessionId=${encodeURIComponent(sessionId)}` : '';
            const response = await fetch(`${ROUTE}${query}`, {
              method: 'GET',
              headers: { accept: 'application/json' },
              credentials: 'same-origin',
            });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            if (!cancelled) {
              setSnapshot({
                loading: false,
                error: null,
                teams: Array.isArray(data.teams) ? data.teams : [],
                generatedAt: data.generatedAt ?? null,
              });
            }
          } catch (error) {
            if (!cancelled) {
              setSnapshot((current) => ({
                ...current,
                loading: false,
                error: error instanceof Error ? error.message : String(error),
              }));
            }
          }
          if (!cancelled) timer = setTimeout(load, 1500);
        };
        load();
        return () => {
          cancelled = true;
          if (timer !== null) clearTimeout(timer);
        };
      }, [sessionId]);

      const team = snapshot.teams[0];
      const statusLabel = team ? tr(`status.team.${team.status}`, team.status) : '';

      return h(
        'div',
        {
          style: {
            height: '100%',
            overflow: 'auto',
            padding: '12px 13px 20px',
            background: 'var(--dsw-alias-bg-base)',
            color: 'var(--dsw-alias-label-primary)',
            fontSize: '12.5px',
            lineHeight: '1.55',
            boxSizing: 'border-box',
          },
        },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' } },
          h('div', { style: { fontSize: '13px', fontWeight: 650 } }, tr('panel.title', 'Report Review')),
          team ? h(Badge, { status: team.status, label: statusLabel }) : null,
        ),
        snapshot.loading
          ? h('div', { style: { ...mutedStyle, padding: '12px 0' } }, tr('panel.loading', 'Loading review team…'))
          : snapshot.error
            ? h(
                'div',
                { style: { border: '1px solid var(--dsw-alias-state-error-primary)', borderRadius: '8px', padding: '10px', color: 'var(--dsw-alias-state-error-primary)' } },
                tr('panel.error', 'Review panel data is unavailable.'),
                h('div', { style: { ...monoStyle, marginTop: '5px' } }, snapshot.error),
              )
            : !team
              ? h(
                  'div',
                  { style: { ...cardStyle, textAlign: 'center', padding: '18px 12px' } },
                  h('div', { style: { fontWeight: 550, marginBottom: '4px' } }, tr('panel.empty', 'No review has run in this session yet.')),
                  h('div', { style: { ...mutedStyle, fontSize: '11.5px' } }, tr('panel.emptyHint', 'Run /report-review <report-path> to start one.')),
                )
              : h(
                  React.Fragment,
                  null,
                  h(
                    'div',
                    { style: cardStyle },
                    h(Row, { style: { justifyContent: 'space-between', alignItems: 'flex-start' } },
                      h('div', { style: { minWidth: 0 } },
                        h('div', { style: { fontWeight: 650, marginBottom: '3px' } }, team.title),
                        h('div', { style: { ...monoStyle, ...mutedStyle } }, team.reportPath),
                      ),
                    ),
                    h(
                      'div',
                      { style: { marginTop: '7px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 10px' } },
                      h('div', null, h('span', { style: mutedStyle }, `${tr('panel.mode', 'Mode')}: `), tr(`panel.mode.` + team.mode, team.mode)),
                      h('div', null, h('span', { style: mutedStyle }, `${tr('panel.language', 'Chat language')}: `), team.chatLang),
                      h('div', null, h('span', { style: mutedStyle }, `${tr('panel.docLanguage', 'Document language')}: `), team.outputLang),
                      h('div', null, h('span', { style: mutedStyle }, `${tr('panel.report', 'Report')}: `), team.pentest ? tr('panel.pentest', 'pentest') : tr('panel.nonPentest', 'non-pentest')),
                    ),
                    team.runDir
                      ? h('div', { style: { ...monoStyle, ...mutedStyle, marginTop: '6px' } }, `${tr('panel.runDir', 'Run folder')}: ${team.runDir}`)
                      : null,
                    team.focus
                      ? h('div', { style: { ...mutedStyle, marginTop: '6px', whiteSpace: 'pre-wrap' } }, `${tr('panel.focus', 'User focus')}: ${team.focus}`)
                      : null,
                  ),
                  h(
                    'div',
                    { style: cardStyle },
                    h(ProgressBar, { team, label: tr('panel.progress', 'Progress') }),
                    h('div', { style: { ...mutedStyle, fontSize: '10.5px' } }, `${team.progress.completed}/${team.progress.total} ${tr('progress.tasks', 'tasks')}`),
                  ),
                  h(
                    'div',
                    { style: cardStyle },
                    h('div', { style: sectionTitleStyle }, tr('panel.agents', 'Agents')),
                    h(AgentRows, { team, tr }),
                  ),
                  h(
                    'div',
                    { style: cardStyle },
                    h('div', { style: sectionTitleStyle }, tr('panel.tasks', 'Tasks')),
                    h(TaskRows, { team, tr }),
                  ),
                  h(
                    'div',
                    { style: cardStyle },
                    h('div', { style: sectionTitleStyle }, tr('panel.outputs', 'Output documents')),
                    h(OutputRows, { team, tr }),
                  ),
                  team.summary
                    ? h(
                        'div',
                        { style: cardStyle },
                        h('div', { style: sectionTitleStyle }, tr('panel.summary', 'Summary')),
                        h('div', { style: { whiteSpace: 'pre-wrap' } }, team.summary),
                      )
                    : null,
                  snapshot.generatedAt
                    ? h('div', { style: { ...mutedStyle, fontSize: '10px', textAlign: 'right' } }, `${tr('panel.generated', 'Last update')}: ${snapshot.generatedAt}`)
                    : null,
                ),
      );
    }

    function HeaderButton({ t, open }) {
      const tr = useLabel(FIXED_T);
      return h(
        'button',
        {
          type: 'button',
          onClick: () => {
            try {
              open();
            } catch (error) {
              console.warn(`dsh-report-reviewer: cannot open panel: ${String(error)}`);
            }
          },
          title: tr('panel.open', 'Open report review panel'),
          'aria-label': tr('panel.open', 'Open report review panel'),
          style: {
            border: '1px solid var(--dsw-alias-border-l2)',
            background: 'transparent',
            color: 'var(--dsw-alias-label-secondary)',
            borderRadius: '6px',
            padding: '3px 8px',
            fontSize: '11.5px',
            lineHeight: '18px',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          },
        },
        tr('panel.headerButton', 'Review'),
      );
    }

    return {
      inject: ['slots', 'locale'],
      apply(ctx) {
        ctx.effect(
          () => ctx.locale.addLanguage({ id: 'zh-Hant', label: '繁體中文', fallback: 'en' }),
          'dsh-report-reviewer: traditional Chinese language',
        );
        ctx.effect(
          () => ctx.locale.register(NS, { en: EN, zh: ZH }),
          'dsh-report-reviewer: dictionaries',
        );
        ctx.effect(
          () => ctx.locale.register(NS, 'zh-Hant', ZH_HANT),
          'dsh-report-reviewer: traditional Chinese dictionary',
        );

        ctx.inject(['sidebarRight', 'sidebarRightTabs'], (native) => {
          const t = FIXED_T;
          native.effect(
            () =>
              native.sidebarRightTabs.register({
                id: TAB_ID,
                kind: TAB_KIND,
                title: () => t('panel.title'),
              }),
            'dsh-report-reviewer: tab type',
          );
          native.slots.inject('conversation.session.header.actions', () =>
            native.slots.register(
              {
                name: 'conversation.session.header.actions',
                id: 'report-review-open',
                order: 55,
                locale: NS,
                inject: () => ({
                  open: () => native.sidebarRight.openTab(TAB_KIND),
                }),
              },
              HeaderButton,
            ),
          );
          native.slots.inject('sidebar.right.pane.tab', () =>
            native.slots.register(
              {
                name: 'sidebar.right.pane.tab',
                key: TAB_ID,
                locale: NS,
              },
              Panel,
            ),
          );
        });
      },
    };
  },
});
