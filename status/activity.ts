import type { connectHost, GuestProject, GuestSessionRecord } from '@openchamber/sdk';

export type RunState = 'running' | 'retrying' | 'waiting-permission' | 'waiting-question' | 'done' | 'failed' | 'idle' | 'unknown';
export type SubagentRun = { id: string; title: string; agent: string | null; status: RunState };
export type ActivityView = { runs: SubagentRun[]; unavailable: boolean; needsPermission: boolean };

const directoryKey = (path: string) => path.replace(/\\/g, '/').replace(/\/+$/, '') || '/';

function runState(session: GuestSessionRecord): RunState {
  if (session.activity !== 'idle' && session.activity !== 'unknown') return session.activity;
  if (session.outcome === 'completed') return 'done';
  if (session.outcome === 'failed') return 'failed';
  return session.activity;
}

function projectRuns(records: Map<string, GuestSessionRecord>, root: string): SubagentRun[] {
  const children = new Map<string, GuestSessionRecord[]>();
  for (const record of records.values()) {
    if (record.parentId === null) continue;
    const siblings = children.get(record.parentId) ?? [];
    siblings.push(record);
    children.set(record.parentId, siblings);
  }

  const seen = new Set([root]);
  const runs: SubagentRun[] = [];
  let frontier = [root];
  for (let depth = 1; depth <= 8 && frontier.length > 0; depth++) {
    const next: string[] = [];
    for (const parent of frontier) {
      for (const record of children.get(parent) ?? []) {
        if (seen.has(record.id)) continue;
        seen.add(record.id);
        next.push(record.id);
        if (record.archivedAt === null) {
          runs.push({ id: record.id, title: record.title, agent: record.agent ?? null, status: runState(record) });
        }
      }
    }
    frontier = next;
  }
  return runs.sort((a, b) => a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

export function watchActivity(
  host: ReturnType<typeof connectHost>,
  callback: (view: ActivityView) => void,
): () => void {
  let stopped = false;
  let ready = false;
  let directory: string | null = null;
  let sessionId: string | null = null;
  let generation = 0;
  let reconnect = false;
  let stopScope: (() => void) | undefined;
  let lastView: string | undefined;

  function emit(runs: SubagentRun[] = [], unavailable = false, needsPermission = false) {
    const view: ActivityView = { runs, unavailable, needsPermission };
    const key = JSON.stringify(view);
    if (stopped || key === lastView) return;
    lastView = key;
    callback(view);
  }

  function start(dir: string, root: string, current: () => boolean): () => void {
    let revision = 0;
    let projectsKey: string | undefined;
    let stopProjects: (() => void) | undefined;
    let stopSessions: (() => void) | undefined;

    function clearSessions() {
      revision++;
      stopSessions?.();
      stopSessions = undefined;
    }

    function unavailable(error?: unknown) {
      reconnect = true;
      const code = (error as { code?: unknown } | null | undefined)?.code;
      emit([], true, code === 'NOT_GRANTED' || code === 'DENIED');
    }

    async function resolveProject(projects: GuestProject[], fresh: () => boolean): Promise<string | undefined> {
      const exact = projects.filter(project => directoryKey(project.directory) === dir);
      if (exact.length === 1) return exact[0].id;

      const trees = await Promise.allSettled(projects.map(project => host.listWorktrees(project.id)));
      if (!fresh()) return;
      const matches = new Set(exact.map(project => project.id));
      for (const result of trees) {
        if (result.status === 'fulfilled' && result.value.state === 'ready' &&
            result.value.worktrees.some(tree => directoryKey(tree.directory) === dir)) {
          matches.add(result.value.projectId);
        }
      }
      if (matches.size === 1) return matches.values().next().value;

      // A directory may not be in topology yet. Use the current chat, never an
      // arbitrary project or merely a path prefix, to disambiguate.
      const candidates = matches.size > 0 ? projects.filter(project => matches.has(project.id)) : projects;
      const sessions = await Promise.allSettled(candidates.map(project => host.listSessions(project.id)));
      if (!fresh()) return;
      const owners = sessions.flatMap(result =>
        result.status === 'fulfilled' && result.value.sessions.some(record =>
          record.id === root && record.projectId === result.value.projectId &&
          (matches.size > 0 || directoryKey(record.directory) === dir))
          ? [result.value.projectId] : []);
      if (owners.length === 1) return owners[0];
      for (const result of [...trees, ...sessions]) {
        if (result.status === 'rejected') throw result.reason;
      }
    }

    async function subscribe(projects: GuestProject[], fresh: () => boolean) {
      try {
        const projectId = await resolveProject(projects, fresh);
        if (!fresh()) return;
        if (!projectId) {
          unavailable();
          return;
        }
        const retained = new Map<string, GuestSessionRecord>();
        const stop = await host.onSessions(projectId, snapshot => {
          if (!fresh() || snapshot.projectId !== projectId || snapshot.state === 'loading') return;
          if (snapshot.state === 'error') {
            unavailable();
            return;
          }
          const records = new Map(snapshot.sessions
            .filter(record => record.projectId === projectId)
            .map(record => [record.id, record]));
          // Keep terminal rows through partial snapshots; explicit archive or
          // a new state wins. Retain their lineage too, including archived hops.
          const present = new Set(records.keys());
          for (const [id, record] of retained) if (!records.has(id)) records.set(id, record);
          const runs = projectRuns(records, root).filter(run =>
            present.has(run.id) || run.status === 'done' || run.status === 'failed');
          retained.clear();
          for (const run of runs) {
            if (run.status !== 'done' && run.status !== 'failed') continue;
            let id: string | null = run.id;
            while (id !== null && id !== root && !retained.has(id)) {
              const record = records.get(id);
              if (!record) break;
              retained.set(id, record);
              id = record.parentId;
            }
          }
          const partial = snapshot.coverage.some(entry => entry.state === 'error');
          reconnect = partial;
          emit(runs, partial);
        });
        if (fresh()) stopSessions = stop;
        else stop();
      } catch (error) {
        if (fresh()) unavailable(error);
      }
    }

    void host.onProjects(snapshot => {
      if (!current() || snapshot.state === 'loading') return;
      if (snapshot.state === 'error') {
        clearSessions();
        projectsKey = undefined;
        unavailable();
        return;
      }
      const key = JSON.stringify(snapshot.projects.map(project => [project.id, directoryKey(project.directory)]).sort());
      if (key === projectsKey) return;
      projectsKey = key;
      clearSessions();
      const ownRevision = revision;
      emit();
      void subscribe(snapshot.projects, () => current() && revision === ownRevision);
    }).then(stop => {
      if (current()) stopProjects = stop;
      else stop();
    }, error => {
      if (current()) {
        clearSessions();
        unavailable(error);
      }
    });

    return () => {
      clearSessions();
      stopProjects?.();
    };
  }

  function update(dir: string | null, root: string | null, retry = false) {
    if (stopped) return;
    if (dir !== null) dir = directoryKey(dir);
    if (dir === directory && root === sessionId && !retry && lastView !== undefined) return;
    directory = dir;
    sessionId = root;
    reconnect = false;
    const stamp = ++generation;
    stopScope?.();
    stopScope = undefined;
    emit();
    // Coalesce paired directory/session pushes, without delaying the clear.
    queueMicrotask(() => {
      const current = () => !stopped && stamp === generation;
      if (current() && ready && dir !== null && root !== null) stopScope = start(dir, root, current);
    });
  }

  const listeners = [
    host.onReady(context => {
      ready = true;
      update(context.directory, context.session?.id ?? null, reconnect);
    }),
    host.onDirectory(value => { if (ready) update(value, sessionId); }),
    host.onSession(value => { if (ready) update(directory, value?.id ?? null); }),
  ];

  return () => {
    if (stopped) return;
    stopped = true;
    stopScope?.();
    for (const stop of listeners) stop();
  };
}
