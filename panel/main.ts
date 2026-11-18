import { connectHost, HostRequestError } from '@openchamber/sdk';
import { applyHostReady } from '@openchamber/sdk/ui';

type AgentConfig = { model: string; variant: string; skills: string[] };
type Preset = Record<string, AgentConfig>;
type ModelEntry = { providerID: string; id: string; name: string };

type State = {
  ok: boolean;
  error?: string;
  userConfigPath: string | null;
  projectConfigPath: string | null;
  directory: string | null;
  activePreset: string | null;
  presets: Record<string, Preset>;
  presetNames: string[];
  shadowedPresets: string[];
  agentNames: string[];
  builtinAgents: string[];
  variants: string[];
  models: ModelEntry[];
  modelsError: string | null;
  effective: Record<string, { model: string; variant: string }>;
};

const host = connectHost();
const root = document.getElementById('root') as HTMLElement;

let directory: string | null = null;
let loaded = false;
let state: State | null = null;
let presetName = '';
let draft: Preset = {};
let removed = new Set<string>();
let dirty = false;
let busy = false;
let message: { kind: 'ok' | 'error' | 'info'; text: string } | null = null;
let saveAsDefault = false;
let saveButton: HTMLButtonElement | null = null;
let dirtyLabel: HTMLElement | null = null;

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

async function callService(path: string, method: 'GET' | 'POST', query?: Record<string, string>, body?: unknown): Promise<any> {
  const result: any = await host.serviceRequest({
    method,
    path,
    query,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const raw = result?.body;
  const data = typeof raw === 'string' ? JSON.parse(raw) : raw;
  if (!data || data.ok === false) throw new Error(data?.error || 'Request failed');
  return data;
}

function setDirty(next: boolean) {
  dirty = next;
  if (saveButton) saveButton.disabled = !dirty || busy || !state?.ok;
  if (dirtyLabel) dirtyLabel.textContent = dirty ? 'Unsaved changes' : '';
}

function loadDraft() {
  const preset = state?.presets?.[presetName] || {};
  draft = JSON.parse(JSON.stringify(preset));
  removed = new Set();
  saveAsDefault = state?.activePreset === presetName;
  setDirty(false);
}

async function load() {
  busy = true;
  message = null;
  render();
  try {
    const data = (await callService('/state', 'GET', directory ? { directory } : undefined)) as State;
    state = data;
    if (data.ok && data.presetNames.length) {
      if (!data.presetNames.includes(presetName)) presetName = data.activePreset && data.presetNames.includes(data.activePreset) ? data.activePreset : data.presetNames[0];
      loadDraft();
    } else if (data.ok) {
      presetName = '';
      draft = {};
    }
  } catch (error) {
    const info = serviceError(error);
    state = null;
    message =
      info.code === 'NO_SERVICE'
        ? {
            kind: 'error',
            text: 'The local service is not approved yet. Settings → Extensions → openchamber-omos-helper → allow the local service, then press Reload.',
          }
        : { kind: 'error', text: info.text };
  } finally {
    busy = false;
    render();
  }
}

async function save() {
  if (!state?.ok || !presetName) return;
  busy = true;
  message = null;
  render();
  try {
    const result: any = await callService('/save', 'POST', undefined, {
      presetName,
      agents: draft,
      remove: Array.from(removed),
      setDefault: saveAsDefault && state.activePreset !== presetName,
      directory,
    });
    if (result.state) {
      state = result.state as State;
      loadDraft();
    }
    message = { kind: 'ok', text: `Saved ${result.path}` };
  } catch (error) {
    message = { kind: 'error', text: serviceError(error).text };
  } finally {
    busy = false;
    render();
  }
}

function switchPreset(name: string) {
  if (dirty) return;
  presetName = name;
  loadDraft();
  render();
}

function addAgent(name: string) {
  if (!name || draft[name]) return;
  draft[name] = { model: '', variant: '', skills: [] };
  removed.delete(name);
  setDirty(true);
  render();
}

function removeAgent(name: string) {
  delete draft[name];
  removed.add(name);
  setDirty(true);
  render();
}

function render() {
  root.replaceChildren();
  saveButton = null;
  dirtyLabel = null;

  const header = el(
    'div',
    { class: 'row spread' },
    el('h1', { text: 'openchamber-omos-helper' }),
    el('button', {
      type: 'button',
      text: 'Reload',
      disabled: busy,
      onclick: () => {
        if (dirty) loadDraft();
        void load();
      },
    }),
  );
  root.append(header);

  if (state?.userConfigPath) {
    root.append(el('div', { class: 'path', text: state.userConfigPath }));
  }

  if (message) {
    root.append(el('div', { class: `banner ${message.kind === 'ok' ? 'ok' : message.kind === 'error' ? 'error' : 'info'}`, text: message.text }));
  }

  if (!state) {
    if (!message) root.append(el('div', { class: 'banner info', text: busy ? 'Loading…' : 'No configuration loaded.' }));
    return;
  }

  if (!state.ok) {
    root.append(el('div', { class: 'banner error', text: state.error || 'Could not read the config.' }));
    root.append(
      el('div', { class: 'footer' }, 'Install oh-my-opencode-slim first, or edit ', el('code', { text: '~/.config/opencode/oh-my-opencode-slim.json' }), ' by hand.'),
    );
    return;
  }

  if (state.projectConfigPath) {
    root.append(el('div', { class: 'banner info', text: `Project override: ${state.projectConfigPath}` }));
  }
  if (state.shadowedPresets.length) {
    root.append(
      el('div', {
        class: 'banner info',
        text: `Shadows this project: ${state.shadowedPresets.join(', ')} — the project file wins over what you save here.`,
      }),
    );
  }

  // preset picker
  const select = el('select', { disabled: dirty || busy || state.presetNames.length === 0 }) as HTMLSelectElement;
  for (const name of state.presetNames) {
    select.append(el('option', { value: name, text: name + (name === state.activePreset ? '  (default)' : '') }));
  }
  select.value = presetName;
  select.addEventListener('change', () => switchPreset(select.value));

  root.append(el('div', { class: 'row', style: 'margin-top:12px' }, el('span', { class: 'muted', text: 'Preset' }), select));

  if (!presetName) {
    root.append(el('div', { class: 'banner info', text: 'No presets in the user config yet.' }));
    return;
  }

  const datalists = el('div', { hidden: true });
  const modelList = el('datalist', { id: 'openchamber-omos-helper-models' });
  for (const model of [...state.models].sort((a, b) => `${a.providerID}/${a.id}`.localeCompare(`${b.providerID}/${b.id}`))) {
    modelList.append(el('option', { value: `${model.providerID}/${model.id}`, label: model.name }));
  }
  const variantList = el('datalist', { id: 'openchamber-omos-helper-variants' });
  for (const variant of state.variants) variantList.append(el('option', { value: variant }));
  datalists.append(modelList, variantList);
  root.append(datalists);

  // agents
  root.append(el('h2', { text: `Agents · ${Object.keys(draft).length}` }));

  for (const name of Object.keys(draft).sort()) {
    const config = draft[name];
    const modelInput = el('input', {
      type: 'text',
      list: 'openchamber-omos-helper-models',
      value: config.model,
      spellcheck: 'false',
      placeholder: 'provider/model',
    }) as HTMLInputElement;
    modelInput.addEventListener('input', () => {
      config.model = modelInput.value;
      setDirty(true);
    });

    const variantInput = el('input', {
      type: 'text',
      list: 'openchamber-omos-helper-variants',
      value: config.variant,
      spellcheck: 'false',
      placeholder: 'variant',
    }) as HTMLInputElement;
    variantInput.addEventListener('input', () => {
      config.variant = variantInput.value;
      setDirty(true);
    });

    const skillsInput = el('input', {
      type: 'text',
      value: config.skills.join(', '),
      spellcheck: 'false',
      placeholder: '* or simplify, requesting-code-review',
    }) as HTMLInputElement;
    skillsInput.addEventListener('input', () => {
      config.skills = skillsInput.value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean);
      setDirty(true);
    });

    const effective = state.effective[name];
    const effectiveText = effective?.model
      ? `Running as ${effective.model}${effective.variant ? ` · ${effective.variant}` : ''}`
      : 'Not currently registered';
    const stale = effective?.model && (effective.model !== config.model || (effective.variant || '') !== (config.variant || ''));

    const card = el(
      'div',
      { class: 'agent' },
      el(
        'div',
        { class: 'row spread' },
        el('span', { class: 'name', text: name }),
        el('button', {
          type: 'button',
          text: 'Remove',
          title: 'Remove from this preset (saved on Save)',
          onclick: () => removeAgent(name),
        }),
      ),
      el(
        'div',
        { class: 'fields' },
        el('div', {}, el('label', { text: 'Model' }), modelInput),
        el('div', {}, el('label', { text: 'Variant' }), variantInput),
        el('div', { class: 'skills' }, el('label', { text: 'Skills (comma separated, * for all)' }), skillsInput),
      ),
      el('div', { class: `active${stale ? ' stale' : ''}`, text: effectiveText }),
    );
    root.append(card);
  }

  // add agent
  const candidates = state.agentNames.filter((name) => !draft[name]);
  if (candidates.length) {
    const addSelect = el('select') as HTMLSelectElement;
    addSelect.append(el('option', { value: '', text: 'Add agent…' }));
    for (const name of candidates) addSelect.append(el('option', { value: name, text: name }));
    const addButton = el('button', {
      type: 'button',
      text: 'Add',
      disabled: true,
      onclick: () => addAgent(addSelect.value),
    }) as HTMLButtonElement;
    addSelect.addEventListener('change', () => {
      addButton.disabled = !addSelect.value;
    });
    root.append(el('div', { class: 'row', style: 'margin-top:10px' }, addSelect, addButton));
  }

  // default + save
  const defaultCheckbox = el('input', { type: 'checkbox', checked: saveAsDefault }) as HTMLInputElement;
  defaultCheckbox.addEventListener('change', () => {
    saveAsDefault = defaultCheckbox.checked;
    setDirty(true);
  });

  saveButton = el('button', { type: 'button', class: 'primary', text: 'Save', onclick: () => void save() }) as HTMLButtonElement;
  saveButton.disabled = !dirty || busy;

  const revertButton = el('button', {
    type: 'button',
    text: 'Revert',
    disabled: !dirty || busy,
    onclick: () => {
      loadDraft();
      render();
    },
  }) as HTMLButtonElement;

  const defaultRow =
    state.activePreset === presetName
      ? el('div', { class: 'hint', text: 'This preset is the default in your config.' })
      : el('label', { class: 'row', style: 'margin-top:12px' }, defaultCheckbox, el('span', { text: `Make ${presetName} the default preset` }));

  root.append(defaultRow);

  const toolbar = el('div', { class: 'row toolbar' }, saveButton, revertButton);
  root.append(toolbar);

  dirtyLabel = el('span', { class: 'hint' });
  if (dirty) dirtyLabel.textContent = 'Unsaved changes';
  root.append(dirtyLabel);

  const notes: string[] = [];
  if (state.modelsError) notes.push(`Model list unavailable (${state.modelsError}); type any provider/model.`);
  if (state.projectConfigPath) notes.push('Project config is read-only here; edit it in the file.');
  notes.push('Saved values apply to new sessions. For the running chat, run /preset ' + presetName + ' after saving.');

  root.append(
    el(
      'div',
      { class: 'footer' },
      ...notes.flatMap((note, index) => (index ? [el('br'), document.createTextNode(note)] : [document.createTextNode(note)])),
    ),
  );
}

host.onReady((context) => {
  applyHostReady(context, document.documentElement);
  const nextDirectory = context.directory || null;
  if (!loaded || nextDirectory !== directory) {
    directory = nextDirectory;
    loaded = true;
    void load();
  }
});

render();
