import { connectHost, HostRequestError } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

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

function agentRow(agent: AgentReadout): HTMLElement {
  const running = agent.runningModel
    ? `Running as ${agent.runningModel}${agent.runningVariant ? ` · ${agent.runningVariant}` : ''}`
    : 'Not registered in the running server';
  const title =
    agent.status === 'drift' || agent.status === 'missing' || agent.status === 'inherited'
      ? running
      : agent.status === 'match'
        ? 'Matches the running server'
        : undefined;
  const model = agent.model || 'inherited';

  return el(
    'div',
    { class: 'agent', 'data-status': agent.status, title },
    el('span', { class: 'dot' }),
    el('span', { class: 'name', text: agent.name }),
    el('span', { class: `model${agent.model ? '' : ' inherited'}`, text: model }),
    agent.variant ? el('span', { class: 'variant', text: agent.variant }) : null,
  );
}

function renderFooter(): HTMLElement {
  return el(
    'div',
    { class: 'footer' },
    el('button', { type: 'button', text: 'Refresh', disabled: busy, onclick: () => void load() }),
    isMobile ? null : el('button', { type: 'button', text: 'Open editor', onclick: () => void openEditor() }),
  );
}

function render() {
  root.replaceChildren();

  if (!state) {
    root.append(el('div', { class: `note${message?.kind === 'error' ? ' error' : ''}`, text: message?.text || (busy ? 'Reading presets…' : 'No config loaded.') }));
    if (message) {
      root.append(renderFooter());
      syncHeight();
    }
    return;
  }

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
      state.presetSource === 'project' ? el('span', { class: 'badge', text: 'project', title: state.projectConfigPath || '' }) : null,
      el('span', { class: 'count', text: agents.length === 1 ? '1 agent' : `${agents.length} agents` }),
    ),
  );

  if (!state.presetName) {
    root.append(el('div', { class: 'note', text: state.presetCount ? `${state.presetCount} presets in the config.` : 'No presets in the config yet.' }));
  } else if (!state.presetFound) {
    root.append(el('div', { class: 'note warning', text: 'This preset is not in the merged config.' }));
  } else if (agents.length === 0) {
    root.append(el('div', { class: 'note', text: 'This preset has no agents.' }));
  } else {
    const list = el('div', { class: 'agents' });
    for (const agent of agents) list.append(agentRow(agent));
    root.append(list);
  }

  if (!state.runningAvailable) {
    root.append(el('div', { class: 'note', text: 'Running models unavailable; start OpenChamber’s local API to compare.' }));
  } else {
    if (state.driftCount > 0) {
      root.append(
        el('div', {
          class: 'note warning',
          text: state.driftCount === 1 ? '1 agent differs from the running server.' : `${state.driftCount} agents differ from the running server.`,
        }),
      );
    }
    if (state.missingCount > 0) {
      root.append(
        el('div', {
          class: 'note',
          text: state.missingCount === 1 ? '1 agent is not registered in the running server.' : `${state.missingCount} agents are not registered in the running server.`,
        }),
      );
    }
  }

  if (state.projectConfigPath) {
    root.append(el('div', { class: 'note', text: 'Project override is in effect.', title: state.projectConfigPath }));
  }

  root.append(renderFooter());

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

render();
