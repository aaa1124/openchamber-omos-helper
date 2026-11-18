import { expect, test } from 'bun:test';
import type {
  connectHost, GuestProjectsSnapshot, GuestSessionRecord, GuestSessionsSnapshot,
  GuestWorktreesSnapshot, HostReadyContext, SessionSnapshot,
} from '@openchamber/sdk';
import { watchActivity, type ActivityView } from './activity';

type Listener<T> = (value: T) => void;
const projects: GuestProjectsSnapshot = {
  kind: 'projects', state: 'ready',
  projects: [{ id: 'p', directory: '/repo', name: 'P' }, { id: 'q', directory: '/other', name: 'Q' }],
};
const session = (id: string): SessionSnapshot => ({ id, title: id, busy: false });
const record = (id: string, parentId: string | null, extra: Partial<GuestSessionRecord> = {}): GuestSessionRecord => ({
  id, parentId, title: id, projectId: 'p', directory: '/repo', createdAt: 0, updatedAt: 0,
  archivedAt: null, worktree: null, activity: 'unknown', outcome: null, items: [], ...extra,
});
const snapshot = (sessions: GuestSessionRecord[], projectId = 'p'): GuestSessionsSnapshot =>
  ({ kind: 'sessions', state: 'ready', projectId, coverage: [], sessions });
const flush = async () => { for (let i = 0; i < 20; i++) await Promise.resolve(); };

function fixture() {
  const ready = new Set<Listener<HostReadyContext>>();
  const directories = new Set<Listener<string | null>>();
  const chats = new Set<Listener<SessionSnapshot | null>>();
  const projectListeners: Listener<GuestProjectsSnapshot>[] = [];
  const sessionListeners: { id: string; push: Listener<GuestSessionsSnapshot> }[] = [];
  const closes: string[] = [];
  const options = {
    projectsError: undefined as unknown,
    sessionStop: undefined as Promise<() => void> | undefined,
    worktrees: (id: string): Promise<GuestWorktreesSnapshot> => Promise.resolve({
      kind: 'worktrees', state: 'ready', projectId: id,
      worktrees: id === 'p' ? [{ directory: '/tree', name: 'Tree', branch: 'test', status: 'ready' }] : [],
    }),
    sessions: (id: string) => Promise.resolve(snapshot([], id)),
  };
  function listen<T>(listeners: Set<Listener<T>>, push: Listener<T>) {
    listeners.add(push);
    return () => { listeners.delete(push); };
  }
  const host = {
    onReady: (push: Listener<HostReadyContext>) => listen(ready, push),
    onDirectory: (push: Listener<string | null>) => listen(directories, push),
    onSession: (push: Listener<SessionSnapshot | null>) => listen(chats, push),
    onProjects: async (push: Listener<GuestProjectsSnapshot>) => {
      if (options.projectsError) throw options.projectsError;
      projectListeners.push(push);
      push(projects);
      return () => { closes.push('projects'); };
    },
    onSessions: async (id: string, push: Listener<GuestSessionsSnapshot>) => {
      sessionListeners.push({ id, push });
      return options.sessionStop ?? (() => { closes.push(id); });
    },
    listWorktrees: (id: string) => options.worktrees(id),
    listSessions: (id: string) => options.sessions(id),
  } satisfies Pick<ReturnType<typeof connectHost>, 'onReady' | 'onDirectory' | 'onSession' |
    'onProjects' | 'onSessions' | 'listWorktrees' | 'listSessions'>;
  const views: ActivityView[] = [];
  const stop = watchActivity(host as ReturnType<typeof connectHost>, view => views.push(view));
  return {
    options, stop, closes, views, sessionListeners, projectListeners,
    last: () => views.at(-1),
    ready: (directory: string, id: string) => ready.forEach(push =>
      push({ directory, session: session(id) } as HostReadyContext)),
    dir: (value: string | null) => directories.forEach(push => push(value)),
    chat: (id: string | null) => chats.forEach(push => push(id === null ? null : session(id))),
    listenerCount: () => ready.size + directories.size + chats.size,
  };
}

test('groups only current-chat descendants across worktrees, through archives, up to depth eight', async () => {
  const f = fixture();
  f.ready('/tree/', 'root');
  await flush();
  expect(f.sessionListeners.map(x => x.id)).toEqual(['p']);
  const rows = [
    record('root', 'd8'), record('d1', 'root', { archivedAt: 1 }),
    record('d2', 'd1', { outcome: 'completed', activity: 'idle', agent: 'explore', directory: '/tree' }),
    record('d3', 'd2', { outcome: 'failed', activity: 'retrying' }),
    record('d4', 'd3', { activity: 'waiting-question' }),
    record('d5', 'd4', { activity: 'waiting-permission' }),
    record('d6', 'd5', { activity: 'idle' }),
    record('d7', 'd6'),
    record('d8', 'd7', { outcome: 'failed', activity: 'idle' }),
    record('d9', 'd8'), record('other', 'unrelated'),
    record('foreign', 'root', { projectId: 'q' }),
  ];
  const { push } = f.sessionListeners[0];
  push(snapshot(rows));
  expect(f.last()?.runs.map(x => [x.id, x.status])).toEqual([
    ['d2', 'done'], ['d3', 'retrying'], ['d4', 'waiting-question'], ['d5', 'waiting-permission'],
    ['d6', 'idle'], ['d7', 'unknown'], ['d8', 'failed'],
  ]);
  expect(f.last()?.runs[0]).toEqual({ id: 'd2', title: 'd2', agent: 'explore', status: 'done' });
  const emissions = f.views.length;
  push(snapshot(rows.toReversed().map(row => ({ ...row, updatedAt: 1 }))));
  expect(f.views).toHaveLength(emissions);
  push(snapshot(rows.filter(x => x.id !== 'd2')));
  expect(f.views).toHaveLength(emissions);
  push(snapshot(rows.map(x => x.id === 'd2' ? { ...x, archivedAt: 2 } : x)));
  expect(f.last()?.runs.map(x => x.id)).toEqual(['d3', 'd4', 'd5', 'd6', 'd7', 'd8']);
  f.stop();
});

test('clears immediately and discards old callbacks and late unsubscribe handles', async () => {
  const f = fixture();
  let release!: (stop: () => void) => void;
  f.options.sessionStop = new Promise(resolve => { release = resolve; });
  f.ready('/repo', 'root');
  await flush();
  const old = f.sessionListeners[0];
  old.push(snapshot([record('child', 'root', { activity: 'running' })]));
  expect(f.last()?.runs.map(x => x.id)).toEqual(['child']);
  f.dir('/other');
  f.chat('next');
  expect(f.last()?.runs).toEqual([]);
  old.push(snapshot([record('child', 'root')]));
  expect(f.last()?.runs).toEqual([]);
  f.options.sessionStop = undefined;
  release(() => { f.closes.push('late'); });
  await flush();
  expect(f.sessionListeners.map(x => x.id)).toEqual(['p', 'q']);
  expect(f.closes).toEqual(['projects', 'late']);
  const current = f.sessionListeners[1];
  current.push(snapshot([record('next-child', 'next', { projectId: 'q' })], 'q'));
  expect(f.last()?.runs.map(x => x.id)).toEqual(['next-child']);
  f.ready('/other', 'next');
  await flush();
  expect(f.sessionListeners).toHaveLength(2);
  f.chat(null);
  expect(f.last()?.runs).toEqual([]);
  f.stop();
  f.stop();
  expect(f.listenerCount()).toBe(0);
  expect(f.closes).toEqual(['projects', 'late', 'q', 'projects']);
  current.push(snapshot([record('next-child', 'next', { projectId: 'q' })], 'q'));
  expect(f.last()?.runs).toEqual([]);
});

test('reports a denied grant, retries on ready, and falls back to the current session when topology lags', async () => {
  const f = fixture();
  f.options.projectsError = { code: 'NOT_GRANTED' };
  f.ready('/new-tree', 'root');
  await flush();
  expect(f.last()).toEqual({ runs: [], unavailable: true, needsPermission: true });
  f.options.projectsError = undefined;
  f.options.sessions = id => Promise.resolve(snapshot(
    id === 'p' ? [record('root', null, { directory: '/new-tree' })] : [], id));
  f.ready('/new-tree', 'root');
  await flush();
  expect(f.sessionListeners.map(x => x.id)).toEqual(['p']);
  f.sessionListeners[0].push(snapshot([record('child', 'root')]));
  expect(f.last()?.runs.map(x => x.id)).toEqual(['child']);
  expect(f.last()?.needsPermission).toBe(false);
  f.stop();
});
