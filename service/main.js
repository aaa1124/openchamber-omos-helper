// service/main.ts
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
var PORT = Number(process.env.OPENCHAMBER_SERVICE_PORT || 0);
var TOKEN = String(process.env.OPENCHAMBER_SERVICE_TOKEN || "");
var DATA_DIR = process.env.OPENCHAMBER_DATA_DIR || path.join(os.homedir(), ".config", "openchamber");
var BUILTIN_AGENTS = ["orchestrator", "oracle", "explorer", "designer", "fixer", "council", "observer"];
var COMMON_VARIANTS = ["none", "minimal", "low", "medium", "high", "xhigh", "max", "thinking"];
var xdgConfig = process.env.XDG_CONFIG_HOME || path.join(os.homedir(), ".config");
var opencodeConfigDir = path.join(xdgConfig, "opencode");
function pickExisting(candidates) {
  for (const file of candidates) {
    try {
      if (fs.statSync(file).isFile())
        return file;
    } catch {}
  }
  return null;
}
function userConfigPath() {
  const base = path.join(opencodeConfigDir, "oh-my-opencode-slim");
  return pickExisting([`${base}.jsonc`, `${base}.json`]);
}
function projectConfigPath(directory) {
  if (!directory || typeof directory !== "string")
    return null;
  const base = path.join(directory, ".opencode", "oh-my-opencode-slim");
  return pickExisting([`${base}.jsonc`, `${base}.json`]);
}
function skipTrivia(s, i) {
  while (i < s.length) {
    const c = s[i];
    if (c === " " || c === "\t" || c === `
` || c === "\r" || c === "\uFEFF") {
      i += 1;
    } else if (c === "/" && s[i + 1] === "/") {
      while (i < s.length && s[i] !== `
`)
        i += 1;
    } else if (c === "/" && s[i + 1] === "*") {
      i += 2;
      while (i < s.length && !(s[i] === "*" && s[i + 1] === "/"))
        i += 1;
      i += 2;
    } else {
      break;
    }
  }
  return i;
}
function parseString(s, i) {
  const start = i;
  i += 1;
  while (i < s.length) {
    const c = s[i];
    if (c === "\\") {
      i += 2;
      continue;
    }
    if (c === '"') {
      i += 1;
      return { kind: "scalar", start, end: i, value: JSON.parse(s.slice(start, i)) };
    }
    if (c === `
`)
      break;
    i += 1;
  }
  throw new Error(`Unterminated string at ${start}`);
}
function parseValue(s, i) {
  i = skipTrivia(s, i);
  const c = s[i];
  if (c === "{")
    return parseObject(s, i);
  if (c === "[")
    return parseArray(s, i);
  if (c === '"')
    return parseString(s, i);
  const start = i;
  if (c === "-" || c >= "0" && c <= "9") {
    while (i < s.length && /[0-9eE+\-.]/.test(s[i]))
      i += 1;
    return { kind: "scalar", start, end: i, value: Number(s.slice(start, i)) };
  }
  for (const literal of ["true", "false", "null"]) {
    if (s.startsWith(literal, i)) {
      return { kind: "scalar", start, end: i + literal.length, value: JSON.parse(literal) };
    }
  }
  throw new Error(`Unexpected token at ${i}`);
}
function parseObject(s, i) {
  const start = i;
  const members = [];
  i += 1;
  for (;; ) {
    i = skipTrivia(s, i);
    if (i >= s.length)
      throw new Error("Unterminated object");
    if (s[i] === "}") {
      i += 1;
      return { kind: "object", start, end: i, members };
    }
    if (s[i] === ",") {
      i += 1;
      continue;
    }
    if (s[i] !== '"')
      throw new Error(`Expected a key at ${i}`);
    const keyNode = parseString(s, i);
    i = skipTrivia(s, keyNode.end);
    if (s[i] !== ":")
      throw new Error(`Expected ':' at ${i}`);
    i = skipTrivia(s, i + 1);
    const value = parseValue(s, i);
    members.push({ key: keyNode.value, keyStart: keyNode.start, keyEnd: keyNode.end, value });
    i = value.end;
  }
}
function parseArray(s, i) {
  const start = i;
  const items = [];
  i += 1;
  for (;; ) {
    i = skipTrivia(s, i);
    if (i >= s.length)
      throw new Error("Unterminated array");
    if (s[i] === "]") {
      i += 1;
      return { kind: "array", start, end: i, items };
    }
    if (s[i] === ",") {
      i += 1;
      continue;
    }
    const value = parseValue(s, i);
    items.push(value);
    i = value.end;
  }
}
function parseJsonc(text) {
  const node = parseValue(text, 0);
  const rest = skipTrivia(text, node.end);
  if (rest < text.length)
    throw new Error(`Trailing content at ${rest}`);
  return node;
}
function valueOf(node) {
  if (node.kind === "scalar")
    return node.value;
  if (node.kind === "array")
    return node.items.map(valueOf);
  const out = {};
  for (const member of node.members)
    out[member.key] = valueOf(member.value);
  return out;
}
function findMember(node, key) {
  if (!node || node.kind !== "object")
    return null;
  let found = null;
  for (const member of node.members)
    if (member.key === key)
      found = member;
  return found;
}
function resolveObject(root, keys) {
  let node = root;
  for (const key of keys) {
    const member = findMember(node, key);
    if (!member || member.value.kind !== "object")
      return null;
    node = member.value;
  }
  return node;
}
function lineIndent(text, pos) {
  const lineStart = text.lastIndexOf(`
`, Math.max(0, pos - 1)) + 1;
  const line = text.slice(lineStart, pos);
  const match = /^[ \t]*/.exec(line);
  return match ? match[0] : "";
}
function serialize(value, indent, inlineDepth = 0) {
  if (value === null || typeof value !== "object")
    return JSON.stringify(value);
  const pad = `${indent}  `;
  if (Array.isArray(value)) {
    if (value.length === 0)
      return "[]";
    const simple = value.every((entry) => entry === null || typeof entry !== "object");
    const inline = `[${value.map((entry) => serialize(entry, pad, inlineDepth + 1)).join(", ")}]`;
    if (simple && inline.length <= 88)
      return inline;
    return `[
${value.map((entry) => pad + serialize(entry, pad, inlineDepth + 1)).join(`,
`)}
${indent}]`;
  }
  const keys = Object.keys(value);
  if (keys.length === 0)
    return "{}";
  const body = keys.map((key) => pad + JSON.stringify(key) + ": " + serialize(value[key], pad, inlineDepth + 1));
  return `{
${body.join(`,
`)}
${indent}}`;
}
function insertIntoObject(text, node, key, value) {
  if (node.members.length === 0) {
    const indent = lineIndent(text, node.start);
    return text.slice(0, node.start) + serialize({ [key]: value }, indent) + text.slice(node.end);
  }
  const close = node.end - 1;
  let cursor = close - 1;
  while (cursor > node.start && /\s/.test(text[cursor]))
    cursor -= 1;
  const hasComma = text[cursor] === ",";
  const memberIndent = lineIndent(text, node.members[0].keyStart);
  const valueText = serialize(value, memberIndent);
  const insertion = (hasComma ? "" : ",") + `
` + memberIndent + JSON.stringify(key) + ": " + valueText;
  return text.slice(0, close) + insertion + text.slice(close);
}
function replaceValue(text, node, value) {
  const indent = lineIndent(text, node.start);
  return text.slice(0, node.start) + serialize(value, indent) + text.slice(node.end);
}
function ensureObjectPath(text, keys) {
  let working = text;
  let root = parseJsonc(working);
  if (root.kind !== "object")
    throw new Error("Config root is not an object");
  let node = root;
  const walked = [];
  for (const key of keys) {
    let member = findMember(node, key);
    if (!member) {
      working = insertIntoObject(working, node, key, {});
      root = parseJsonc(working);
      node = resolveObject(root, walked);
      member = findMember(node, key);
    }
    if (!member || member.value.kind !== "object") {
      throw new Error(`Config path ${walked.concat(key).join(".")} is not an object`);
    }
    node = member.value;
    walked.push(key);
  }
  return { text: working, node, root };
}
function setMember(text, parentKeys, key, value) {
  const ensured = ensureObjectPath(text, parentKeys);
  const member = findMember(ensured.node, key);
  if (member)
    return replaceValue(ensured.text, member.value, value);
  return insertIntoObject(ensured.text, ensured.node, key, value);
}
function removeMember(text, node, key) {
  const index = node.members.findIndex((member) => member.key === key);
  if (index < 0)
    return text;
  if (node.members.length === 1)
    return text.slice(0, node.start) + "{}" + text.slice(node.end);
  if (index > 0) {
    const previous = node.members[index - 1];
    const member = node.members[index];
    return text.slice(0, previous.value.end) + text.slice(member.value.end);
  }
  const member = node.members[0];
  const next = node.members[1];
  return text.slice(0, member.keyStart) + text.slice(next.keyStart);
}
function readConfig(file) {
  const text = fs.readFileSync(file, "utf8");
  return { text, data: valueOf(parseJsonc(text)) };
}
function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
function normalizePreset(entry) {
  const out = {};
  if (!isObject(entry))
    return out;
  for (const [agent, config] of Object.entries(entry)) {
    if (!isObject(config))
      continue;
    out[agent] = {
      model: typeof config.model === "string" ? config.model : "",
      variant: typeof config.variant === "string" ? config.variant : "",
      skills: Array.isArray(config.skills) ? config.skills.filter((s) => typeof s === "string") : []
    };
  }
  return out;
}
var modelsCache = { at: 0, value: null };
var agentsCache = { at: 0, key: "", value: null };
async function serverCredentials() {
  try {
    const raw = fs.readFileSync(path.join(DATA_DIR, "settings.json"), "utf8");
    const settings = JSON.parse(raw);
    const port = Number(settings.desktopLocalPort);
    const token = typeof settings.desktopLocalClientToken === "string" ? settings.desktopLocalClientToken : "";
    if (!port || !token)
      return null;
    return { port, token };
  } catch {
    return null;
  }
}
async function serverGet(apiPath, query) {
  const credentials = await serverCredentials();
  if (!credentials)
    return null;
  const url = new URL(`http://127.0.0.1:${credentials.port}${apiPath}`);
  for (const [key, value] of Object.entries(query || {})) {
    if (value)
      url.searchParams.set(key, value);
  }
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${credentials.token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(6000)
    });
    if (!response.ok)
      return null;
    const body = await response.json();
    return body && typeof body === "object" && "data" in body ? body.data : body;
  } catch {
    return null;
  }
}
async function loadModels(directory) {
  if (modelsCache.value && Date.now() - modelsCache.at < 60000)
    return modelsCache.value;
  const data = await serverGet("/api/model", { directory });
  if (!Array.isArray(data))
    return { models: [], error: "OpenChamber API unavailable" };
  const models = data.filter((m) => m && typeof m.providerID === "string" && (typeof m.modelID === "string" || typeof m.id === "string")).map((m) => ({
    providerID: m.providerID,
    id: m.modelID || m.id,
    name: typeof m.name === "string" ? m.name : m.modelID || m.id
  })).sort((a, b) => a.providerID === b.providerID ? a.name.localeCompare(b.name) : a.providerID.localeCompare(b.providerID));
  const value = { models, error: null };
  modelsCache = { at: Date.now(), value };
  return value;
}
async function loadEffectiveAgents(directory) {
  const key = directory || "";
  if (agentsCache.value && agentsCache.key === key && Date.now() - agentsCache.at < 15000)
    return agentsCache.value;
  const data = await serverGet("/api/agent", { directory });
  const effective = {};
  if (Array.isArray(data)) {
    for (const agent of data) {
      if (!agent || typeof agent.id !== "string")
        continue;
      const model = agent.model;
      effective[agent.id] = isObject(model) ? {
        model: typeof model.providerID === "string" && typeof model.id === "string" ? `${model.providerID}/${model.id}` : "",
        variant: typeof model.variant === "string" ? model.variant : ""
      } : { model: "", variant: "" };
    }
  }
  agentsCache = { at: Date.now(), key, value: effective };
  return effective;
}
async function buildState(directory) {
  const userPath = userConfigPath();
  if (!userPath) {
    return {
      ok: false,
      error: "oh-my-opencode-slim.json not found in ~/.config/opencode",
      userConfigPath: null,
      directory: directory || null
    };
  }
  const user = readConfig(userPath);
  const projectPath = projectConfigPath(directory);
  const project = projectPath ? readConfig(projectPath) : null;
  const mergedPresets = {
    ...isObject(user.data.presets) ? user.data.presets : {},
    ...project && isObject(project.data.presets) ? project.data.presets : {}
  };
  const userPresets = isObject(user.data.presets) ? user.data.presets : {};
  const presetNames = Object.keys(userPresets);
  const shadowed = project && isObject(project.data.presets) ? Object.keys(project.data.presets) : [];
  const presets = {};
  for (const name of presetNames)
    presets[name] = normalizePreset(userPresets[name]);
  const customAgents = isObject(user.data.agents) ? Object.keys(user.data.agents) : [];
  const agentNames = Array.from(new Set([
    ...BUILTIN_AGENTS,
    ...customAgents,
    ...Object.values(presets).flatMap((preset) => Object.keys(preset)),
    ...Object.values(mergedPresets).flatMap((preset) => isObject(preset) ? Object.keys(preset) : [])
  ])).sort();
  const variants = Array.from(new Set([...COMMON_VARIANTS, ...Object.values(presets).flatMap((p) => Object.values(p).map((a) => a.variant)).filter(Boolean)]));
  const modelsResult = await loadModels(directory);
  const effective = await loadEffectiveAgents(directory);
  return {
    ok: true,
    userConfigPath: userPath,
    projectConfigPath: projectPath,
    directory: directory || null,
    activePreset: typeof user.data.preset === "string" ? user.data.preset : null,
    effectivePreset: typeof (project?.data.preset ?? user.data.preset) === "string" ? project?.data.preset ?? user.data.preset : null,
    presets,
    presetNames,
    shadowedPresets: shadowed,
    agentNames,
    builtinAgents: BUILTIN_AGENTS,
    variants,
    models: modelsResult.models,
    modelsError: modelsResult.error,
    effective
  };
}
function savePreset(body) {
  const file = userConfigPath();
  if (!file)
    return { ok: false, error: "No user config file found" };
  const presetName = typeof body?.presetName === "string" ? body.presetName.trim() : "";
  if (!presetName || presetName.length > 120)
    return { ok: false, error: "Invalid preset name" };
  const agents = isObject(body?.agents) ? body.agents : null;
  if (!agents)
    return { ok: false, error: "No agents supplied" };
  let text = fs.readFileSync(file, "utf8");
  let changed = 0;
  for (const [agent, config] of Object.entries(agents)) {
    if (!/^[A-Za-z0-9._-]{1,80}$/.test(agent))
      return { ok: false, error: `Invalid agent name: ${agent}` };
    if (!isObject(config))
      continue;
    const model = typeof config.model === "string" ? config.model.trim() : "";
    const variant = typeof config.variant === "string" ? config.variant.trim() : "";
    const skills = Array.isArray(config.skills) ? config.skills.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim()) : [];
    text = setMember(text, ["presets", presetName, agent], "model", model);
    text = setMember(text, ["presets", presetName, agent], "variant", variant);
    text = setMember(text, ["presets", presetName, agent], "skills", skills);
    changed += 3;
  }
  if (body?.setDefault === true) {
    text = setMember(text, [], "preset", presetName);
    changed += 1;
  }
  if (Array.isArray(body?.remove)) {
    for (const agent of body.remove) {
      if (typeof agent !== "string" || !/^[A-Za-z0-9._-]{1,80}$/.test(agent))
        continue;
      const parent = resolveObject(parseJsonc(text), ["presets", presetName]);
      if (!parent)
        continue;
      text = removeMember(text, parent, agent);
      changed += 1;
    }
  }
  const parsed = valueOf(parseJsonc(text));
  if (!isObject(parsed.presets) || !isObject(parsed.presets[presetName])) {
    return { ok: false, error: "Patched config failed validation" };
  }
  const backup = `${file}.pantheon-backup`;
  try {
    fs.writeFileSync(backup, fs.readFileSync(file), "utf8");
  } catch {}
  fs.writeFileSync(file, text, "utf8");
  modelsCache = { at: 0, value: null };
  agentsCache = { at: 0, key: "", value: null };
  return { ok: true, path: file, backup, changed };
}
function send(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload),
    "cache-control": "no-store"
  });
  res.end(payload);
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1e6) {
        reject(new Error("Body too large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      const raw = Buffer.concat(chunks).toString("utf8");
      if (!raw)
        return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        reject(new Error("Invalid JSON body"));
      }
    });
    req.on("error", reject);
  });
}
var server = http.createServer(async (req, res) => {
  if (!TOKEN || req.headers.authorization !== `Bearer ${TOKEN}`) {
    send(res, 401, { ok: false, error: "Unauthorized" });
    return;
  }
  const url = new URL(req.url || "/", "http://127.0.0.1");
  try {
    if (req.method === "GET" && url.pathname === "/health") {
      send(res, 200, { ok: true });
      return;
    }
    if (req.method === "GET" && url.pathname === "/state") {
      send(res, 200, await buildState(url.searchParams.get("directory") || undefined));
      return;
    }
    if (req.method === "POST" && url.pathname === "/save") {
      const body = await readBody(req);
      const result = savePreset(body);
      if (!result.ok) {
        send(res, 400, result);
        return;
      }
      const state = await buildState(typeof body?.directory === "string" ? body.directory : undefined);
      send(res, 200, { ...result, state });
      return;
    }
    send(res, 404, { ok: false, error: "Not found" });
  } catch (error) {
    send(res, 500, { ok: false, error: error instanceof Error ? error.message : String(error) });
  }
});
server.listen(PORT, "127.0.0.1", () => {
  process.stderr.write(`[pantheon] listening on 127.0.0.1:${PORT}
`);
});
