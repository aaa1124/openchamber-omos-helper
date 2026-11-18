import { connectHost, HostRequestError } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';
import { watchActivity, type ActivityView, type RunState, type SubagentRun } from './activity';

type AgentState = 'match' | 'drift' | 'missing' | 'unknown' | 'inherited';

type AgentReadout = {
  name: string;
  model: string;
  variant: string;
  runningModel: string;
  runningVariant: string;
  status: AgentState;
};

type StatusReadout = {
  ok: boolean;
  error?: string;
  userConfigPath: string | null;
  projectConfigPath: string | null;
  directory: string | null;
  presetName: string | null;
  presetSource: 'project' | 'user' | null;
  presetFound: boolean;
  presetCount: number;
  agents: AgentReadout[];
  driftCount: number;
  missingCount: number;
  runningAvailable: boolean;
};

type RunMeta = {
  key: RunState;
  label: string;
  full: string;
  glyph: string;
  rank: number;
};

type AgentRowView = {
  key: string;
  row: HTMLElement;
  description: HTMLElement;
  runs: HTMLElement;
  configTitle: string | undefined;
};

type RunNode = {
  item: HTMLLIElement;
  button: HTMLButtonElement;
  glyph: HTMLElement;
  owner: HTMLElement;
  label: HTMLElement;
  status: HTMLElement;
};

const RUN_META: Record<RunState, RunMeta> = {
  'waiting-permission': {
    key: 'waiting-permission',
    label: 'Permission',
    full: 'Waiting for permission',
    glyph: '!',
    rank: 0,
  },
  'waiting-question': {
    key: 'waiting-question',
    label: 'Waiting',
    full: 'Waiting for an answer',
    glyph: '?',
    rank: 1,
  },
  retrying: { key: 'retrying', label: 'Retrying', full: 'Retrying', glyph: '↻', rank: 2 },
  running: { key: 'running', label: 'Running', full: 'Running', glyph: '●', rank: 3 },
  failed: { key: 'failed', label: 'Failed', full: 'Failed', glyph: '✕', rank: 4 },
  done: { key: 'done', label: 'Done', full: 'Done', glyph: '✓', rank: 5 },
  idle: { key: 'idle', label: 'Idle', full: 'Idle', glyph: '○', rank: 6 },
  unknown: { key: 'unknown', label: 'Unknown', full: 'Unknown state', glyph: '·', rank: 7 },
};

const host = connectHost();
const root = document.getElementById('root') as HTMLElement;

let directory: string | null = null;
let started = false;
let isMobile = false;
let busy = true;
let loadToken = 0;
let state: StatusReadout | null = null;
let message: { kind: 'error' | 'info'; text: string } | null = null;
let lastHeight = 0;
let heightQueued = false;

let activity: ActivityView = { runs: [], unavailable: false, needsPermission: false };
let activityStarted = false;
let stopActivity: (() => void) | null = null;
let renderReady = false;

let agentRows: AgentRowView[] = [];
const runNodes = new Map<string, RunNode>();
const pendingRuns = new Set<string>();

let otherWrap: HTMLElement | null = null;
let otherLabel: HTMLElement | null = null;
let otherCount: HTMLElement | null = null;
let otherList: HTMLElement | null = null;
let permissionNote: HTMLElement | null = null;
let unavailableNote: HTMLElement | null = null;
let actionNote: HTMLElement | null = null;

let actionNoteText = '';
let actionNoteTimer: ReturnType<typeof setTimeout> | null = null;

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Record<string, unknown> = {},
  ...children: (Node | string | null | undefined)[]
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = String(value);
    else if (key === 'text') node.textContent = String(value);
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (value === true) {
      node.setAttribute(key, '');
    } else {
      node.setAttribute(key, String(value));
    }
  }
  for (const child of children) {
    if (child === null || child === undefined) continue;
    node.append(typeof child === 'string' ? document.createTextNode(child) : child);
  }
  return node;
}

function serviceError(error: unknown): { code: string; text: string } {
  if (error instanceof HostRequestError) {
    return { code: String(error.code || ''), text: error.message || String(error.code || 'Request failed') };
  }
  return { code: '', text: error instanceof Error ? error.message : String(error) };
}

function syncHeight() {
  if (heightQueued) return;
  heightQueued = true;
  requestAnimationFrame(() => {
    heightQueued = false;
    const height = Math.ceil(root.getBoundingClientRect().height);
    if (height > 0 && height !== lastHeight) {
      lastHeight = height;
      void host.setHeight(height).catch(() => {
        /* older hosts ignore the resize; the section keeps its configured height */
      });
    }
  });
}

async function load() {
  const token = ++loadToken;
  busy = true;
  render();
  try {
    const result: any = await host.serviceRequest({
      method: 'GET',
      path: '/status',
      query: directory ? { directory } : undefined,
    });
    if (token !== loadToken) return;
    const raw = result?.body;
    const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
    if (!data) throw new Error('Empty answer from the local service');
    if (data.ok === false) {
      state = null;
      message = { kind: 'error', text: data.error || 'Could not read the config.' };
    } else {
      state = data as StatusReadout;
      message = null;
    }
  } catch (error) {
    if (token !== loadToken) return;
    const info = serviceError(error);
    state = null;
    message =
      info.code === 'NO_SERVICE'
        ? { kind: 'error', text: 'Allow the local service in Settings → Extensions to read presets.' }
        : { kind: 'error', text: info.text };
  } finally {
    if (token === loadToken) {
      busy = false;
      render();
    }
  }
}

async function openEditor() {
  try {
    await host.openSurface('plugin:openchamber-omos-helper');
  } catch (error) {
    const info = serviceError(error);
    const text =
      info.code === 'UNSUPPORTED' || info.code === 'NO_DIRECTORY'
        ? 'Open the openchamber-omos-helper panel from the rail.'
        : `Could not open the editor: ${info.text}`;
    await host.toast({ kind: 'info', message: text }).catch(() => {
      /* the toast is best effort */
    });
  }
}

function agentDescription(agent: AgentReadout): string | undefined {
  const running = agent.runningModel
    ? `Running as ${agent.runningModel}${agent.runningVariant ? ` · ${agent.runningVariant}` : ''}`
    : 'Not registered in the running server';
  return agent.status === 'drift' || agent.status === 'missing' || agent.status === 'inherited'
    ? running
    : agent.status === 'match'
      ? 'Matches the running server'
      : undefined;
}

function agentBlock(agent: AgentReadout): HTMLElement {
  const configTitle = agentDescription(agent);
  const model = agent.model || 'inherited';
  const dot = el('span', { class: 'dot', 'aria-hidden': 'true' });
  const description = el('span', { class: 'sr-only', text: configTitle || '' });
  const row = el(
    'div',
    { class: 'agent', 'data-status': agent.status, title: configTitle },
    dot,
    el('span', { class: 'name', text: agent.name }),
    el('span', { class: `model${agent.model ? '' : ' inherited'}`, text: model }),
    agent.variant ? el('span', { class: 'variant', text: agent.variant }) : null,
    description,
  );
  const runs = el('ul', { class: 'runs', hidden: true, 'aria-label': `Subagents for ${agent.name}` });
  agentRows.push({
    key: agent.name.toLowerCase(),
    row,
    description,
    runs,
    configTitle,
  });
  return el('div', { class: 'agent-wrap' }, row, runs);
}

function renderFooter(): HTMLElement {
  return el(
    'div',
    { class: 'footer' },
    el('button', { type: 'button', text: 'Refresh', disabled: busy, onclick: () => void load() }),
    isMobile ? null : el('button', { type: 'button', text: 'Open editor', onclick: () => void openEditor() }),
  );
}

function runMeta(status: RunState): RunMeta {
  return (RUN_META as Record<string, RunMeta>)[status] ?? RUN_META.unknown;
}

function compareRuns(a: SubagentRun, b: SubagentRun): number {
  return runMeta(a.status).rank - runMeta(b.status).rank;
}

function runTitle(run: SubagentRun): string {
  const value = typeof run.title === 'string' ? run.title : '';
  return value.trim() ? value : 'Untitled subagent';
}

function agentLabel(run: SubagentRun): string {
  const value = typeof run.agent === 'string' ? run.agent : '';
  return value ? value : 'Unknown agent';
}

function captureRunFocus(): string | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement)) return null;
  const button = active.closest<HTMLElement>('.run');
  return button?.dataset.runId || null;
}

function restoreRunFocus(runId: string | null) {
  if (!runId) return;
  const active = document.activeElement;
  if (active && active !== document.body && root.contains(active)) return;
  const node = runNodes.get(runId);
  if (node?.button.isConnected) node.button.focus({ preventScroll: true });
}

function ensureRunNode(run: SubagentRun): RunNode {
  const existing = runNodes.get(run.id);
  if (existing) return existing;
  const glyph = el('span', { class: 'glyph', 'aria-hidden': 'true' });
  const owner = el('span', { class: 'run-owner' });
  const label = el('span', { class: 'run-label' });
  const status = el('span', { class: 'run-status' });
  const open = el('span', { class: 'run-open', 'aria-hidden': 'true', text: '›' });
  const button = el('button', { type: 'button', class: 'run' }, glyph, owner, label, status, open);
  button.dataset.runId = run.id;
  button.addEventListener('click', () => void openRun(run.id));
  const item = el('li', { class: 'run-item' }, button);
  const node: RunNode = { item, button, glyph, owner, label, status };
  runNodes.set(run.id, node);
  return node;
}

function updateRunNode(node: RunNode, run: SubagentRun, showOwner: boolean) {
  const meta = runMeta(run.status);
  const title = runTitle(run);
  const agent = agentLabel(run);
  node.button.dataset.status = meta.key;
  node.button.setAttribute('aria-label', `${title}, ${agent}, ${meta.full}. Open chat.`);
  node.button.title = `${title} · ${agent}. ${meta.full}. Open chat.`;
  node.glyph.textContent = meta.glyph;
  node.owner.textContent = agent;
  node.owner.hidden = !showOwner;
  node.label.textContent = title;
  node.status.textContent = meta.label;
}

function paintRuns(list: HTMLElement, runs: SubagentRun[], showOwner: boolean) {
  for (let index = 0; index < runs.length; index++) {
    const run = runs[index] as SubagentRun;
    const node = ensureRunNode(run);
    updateRunNode(node, run, showOwner);
    const current = list.children[index] ?? null;
    if (current !== node.item) list.insertBefore(node.item, current);
  }
  while (list.children.length > runs.length) list.lastElementChild?.remove();
  list.hidden = runs.length === 0;
}

function liveSummary(runs: SubagentRun[]): { kind: string; text: string } | null {
  let permission = 0;
  let question = 0;
  let retrying = 0;
  let running = 0;
  for (const run of runs) {
    const key = runMeta(run.status).key;
    if (key === 'waiting-permission') permission++;
    else if (key === 'waiting-question') question++;
    else if (key === 'retrying') retrying++;
    else if (key === 'running') running++;
  }
  if (permission + question + retrying + running === 0) return null;
  const parts: string[] = [];
  if (permission > 0) parts.push(`${permission} waiting for permission`);
  if (question > 0) parts.push(`${question} waiting for an answer`);
  if (retrying > 0) parts.push(`${retrying} retrying`);
  if (running > 0) parts.push(`${running} running`);
  const kind = permission + question > 0 ? 'waiting' : retrying > 0 ? 'retrying' : 'running';
  return { kind, text: `Live: ${parts.join(', ')}` };
}

function paintAgentLive(view: AgentRowView, runs: SubagentRun[]) {
  const live = liveSummary(runs);
  const config = view.configTitle ? `${view.configTitle}.` : '';
  if (!live) {
    view.row.removeAttribute('data-live');
    view.description.textContent = config;
    if (view.configTitle) view.row.title = view.configTitle;
    else view.row.removeAttribute('title');
    return;
  }
  view.row.setAttribute('data-live', live.kind);
  view.description.textContent = config ? `${config} ${live.text}.` : `${live.text}.`;
  view.row.title = view.configTitle ? `${view.configTitle} · ${live.text}` : live.text;
}

function updatePermissionNotes() {
  if (!permissionNote || !unavailableNote) return;
  const denied = activity.needsPermission;
  const permissionText = 'Allow session access in Settings → Extensions to show live subagent activity.';
  if (!denied) {
    if (!permissionNote.hidden) permissionNote.hidden = true;
    if (permissionNote.textContent) permissionNote.textContent = '';
  } else {
    permissionNote.hidden = false;
    if (permissionNote.textContent !== permissionText) permissionNote.textContent = permissionText;
  }
  unavailableNote.hidden = !(activity.unavailable && !denied);
}

function updateActionNote() {
  if (!actionNote) return;
  if (!actionNoteText) {
    actionNote.hidden = true;
    if (actionNote.textContent) actionNote.textContent = '';
    return;
  }
  actionNote.hidden = false;
  if (actionNote.textContent !== actionNoteText) actionNote.textContent = actionNoteText;
}

function showActionNote(text: string) {
  actionNoteText = text;
  updateActionNote();
  syncHeight();
  if (actionNoteTimer !== null) clearTimeout(actionNoteTimer);
  actionNoteTimer = setTimeout(() => {
    actionNoteTimer = null;
    actionNoteText = '';
    updateActionNote();
    syncHeight();
  }, 8000);
}

function clearActionNote() {
  if (actionNoteTimer !== null) {
    clearTimeout(actionNoteTimer);
    actionNoteTimer = null;
  }
  if (!actionNoteText) return;
  actionNoteText = '';
  updateActionNote();
  syncHeight();
}

function renderActivity() {
  if (!renderReady) return;
  const focusedRun = captureRunFocus();
  const runs = activity.runs.slice().sort(compareRuns);
  const assigned = new Set<SubagentRun>();
  const renderedIds = new Set<string>();

  for (const view of agentRows) {
    const own: SubagentRun[] = [];
    for (const run of runs) {
      if (assigned.has(run)) continue;
      const agent = typeof run.agent === 'string' ? run.agent : '';
      if (agent && agent.toLowerCase() === view.key) {
        assigned.add(run);
        own.push(run);
      }
    }
    paintRuns(view.runs, own, false);
    paintAgentLive(view, own);
    for (const run of own) renderedIds.add(run.id);
  }

  const other = runs.filter(run => !assigned.has(run));
  if (otherList && otherLabel && otherCount && otherWrap) {
    paintRuns(otherList, other, true);
    if (other.length > 0) {
      const label = agentRows.length > 0 ? 'Other subagents' : 'Subagents';
      if (otherLabel.textContent !== label) otherLabel.textContent = label;
      otherCount.textContent = String(other.length);
      otherList.setAttribute('aria-label', label);
    }
    otherWrap.hidden = other.length === 0;
    for (const run of other) renderedIds.add(run.id);
  }

  for (const [id, node] of runNodes) {
    if (renderedIds.has(id)) continue;
    node.item.remove();
    runNodes.delete(id);
  }

  updatePermissionNotes();
  updateActionNote();
  restoreRunFocus(focusedRun);
  syncHeight();
}

function applyActivity(view: ActivityView) {
  const runs = Array.isArray(view.runs)
    ? view.runs.filter(run => run && typeof run.id === 'string' && run.id.length > 0)
    : [];
  activity = {
    runs,
    unavailable: view.unavailable === true,
    needsPermission: view.needsPermission === true,
  };
  if (renderReady) renderActivity();
}

function startActivity() {
  if (activityStarted) return;
  try {
    stopActivity = watchActivity(host, applyActivity);
    activityStarted = true;
  } catch (error) {
    const info = serviceError(error);
    applyActivity({
      runs: [],
      unavailable: true,
      needsPermission: info.code === 'NOT_GRANTED' || info.code === 'DENIED',
    });
  }
}

function stopWatchingActivity() {
  stopActivity?.();
  stopActivity = null;
  activityStarted = false;
}

async function openRun(runId: string) {
  if (pendingRuns.has(runId)) return;
  pendingRuns.add(runId);
  const node = runNodes.get(runId);
  const hadFocus = node?.button === document.activeElement;
  if (node) {
    node.button.disabled = true;
    node.button.setAttribute('aria-busy', 'true');
  }
  try {
    await host.openSession(runId);
    clearActionNote();
  } catch (error) {
    const info = serviceError(error);
    const text =
      info.code === 'UNSUPPORTED'
        ? 'This host cannot open a subagent chat from here.'
        : info.code === 'NOT_FOUND'
          ? 'That subagent chat is no longer available.'
          : `Could not open the subagent chat${info.text ? `: ${info.text}` : '.'}`;
    showActionNote(text);
    await host.toast({ kind: 'error', message: text }).catch(() => {
      /* the inline note above is the fallback */
    });
  } finally {
    pendingRuns.delete(runId);
    const current = runNodes.get(runId);
    if (current) {
      current.button.disabled = false;
      current.button.removeAttribute('aria-busy');
      if (hadFocus && current.button.isConnected && document.activeElement === document.body) {
        current.button.focus({ preventScroll: true });
      }
    }
  }
}

function buildActivityArea() {
  permissionNote = el('div', {
    class: 'note warning permission',
    role: 'status',
    'aria-live': 'polite',
    hidden: true,
  });
  actionNote = el('div', { class: 'note error action', role: 'status', 'aria-live': 'polite', hidden: true });
  otherLabel = el('span');
  otherCount = el('span', { class: 'group-count' });
  const heading = el('h3', { class: 'group-head' }, otherLabel, otherCount);
  otherList = el('ul', { class: 'runs other-runs' });
  otherWrap = el('div', { class: 'other', hidden: true }, heading, otherList);
  unavailableNote = el('div', { class: 'note', hidden: true, text: 'Live subagent activity is unavailable.' });
  root.append(el('div', { class: 'activity' }, permissionNote, actionNote, otherWrap, unavailableNote));
}

function render() {
  renderReady = false;
  root.replaceChildren();
  agentRows = [];
  runNodes.clear();
  otherWrap = null;
  otherLabel = null;
  otherCount = null;
  otherList = null;
  permissionNote = null;
  unavailableNote = null;
  actionNote = null;

  if (!state) {
    root.append(
      el('div', {
        class: `note${message?.kind === 'error' ? ' error' : ''}`,
        text: message?.text || (busy ? 'Reading presets…' : 'No config loaded.'),
      }),
    );
  } else {
    const agents = Array.isArray(state.agents) ? state.agents : [];

    root.append(
      el(
        'div',
        { class: 'head' },
        el('span', {
          class: 'preset',
          text: state.presetName || 'No default preset',
          title: 'Default preset for new sessions',
        }),
        state.presetSource === 'project'
          ? el('span', { class: 'badge', text: 'project', title: state.projectConfigPath || '' })
          : null,
        el('span', { class: 'count', text: agents.length === 1 ? '1 agent' : `${agents.length} agents` }),
      ),
    );

    if (!state.presetName) {
      root.append(
        el('div', {
          class: 'note',
          text: state.presetCount ? `${state.presetCount} presets in the config.` : 'No presets in the config yet.',
        }),
      );
    } else if (!state.presetFound) {
      root.append(el('div', { class: 'note warning', text: 'This preset is not in the merged config.' }));
    } else if (agents.length === 0) {
      root.append(el('div', { class: 'note', text: 'This preset has no agents.' }));
    } else {
      const list = el('div', { class: 'agents' });
      for (const agent of agents) list.append(agentBlock(agent));
      root.append(list);
    }

    if (!state.runningAvailable) {
      root.append(el('div', { class: 'note', text: 'Running models unavailable; start OpenChamber’s local API to compare.' }));
    } else {
      if (state.driftCount > 0) {
        root.append(
          el('div', {
            class: 'note warning',
            text:
              state.driftCount === 1
                ? '1 agent differs from the running server.'
                : `${state.driftCount} agents differ from the running server.`,
          }),
        );
      }
      if (state.missingCount > 0) {
        root.append(
          el('div', {
            class: 'note',
            text:
              state.missingCount === 1
                ? '1 agent is not registered in the running server.'
                : `${state.missingCount} agents are not registered in the running server.`,
          }),
        );
      }
    }

    if (state.projectConfigPath) {
      root.append(el('div', { class: 'note', text: 'Project override is in effect.', title: state.projectConfigPath }));
    }
  }

  buildActivityArea();
  if (state || message) root.append(renderFooter());

  renderReady = true;
  renderActivity();
  syncHeight();
}

if (typeof ResizeObserver === 'function') {
  new ResizeObserver(() => syncHeight()).observe(root);
}

host.onDirectory((next) => {
  const normalized = next || null;
  if (normalized === directory) return;
  directory = normalized;
  if (started) void load();
});

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  const nextMobile = context.device ? context.device.formFactor !== 'desktop' : false;
  const mobileChanged = nextMobile !== isMobile;
  isMobile = nextMobile;
  const nextDirectory = context.directory || null;
  startActivity();
  if (!started) {
    started = true;
    directory = nextDirectory;
    void load();
  } else if (nextDirectory !== directory) {
    directory = nextDirectory;
    void load();
  } else if (mobileChanged) {
    render();
  }
});

window.addEventListener('pagehide', () => {
  stopWatchingActivity();
});

window.addEventListener('pageshow', (event) => {
  if (event.persisted && started) startActivity();
});

render();
