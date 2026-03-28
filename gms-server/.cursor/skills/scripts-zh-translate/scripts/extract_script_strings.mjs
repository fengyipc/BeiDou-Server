/**
 * Extract player-visible string literals from scripts-zh-CN npc/quest/reactor JS.
 * Emits JSON to stdout: { "files": [ { "relativePath", "units": [...] } ] }
 * Requires @babel/parser (run from gms-server after npm install).
 */
import fs from "fs";
import path from "path";
import { parse } from "@babel/parser";

const RECEIVERS = new Set(["cm", "qm", "rm"]);

/** @param {string} source @param {number} charIndex UTF-16 code unit index */
function utf8ByteOffset(source, charIndex) {
  if (charIndex <= 0) return 0;
  return Buffer.byteLength(source.slice(0, charIndex), "utf8");
}

/**
 * Returns 0-based index of the message string argument, or -1.
 * @param {string} method
 * @param {number} argc
 */
function textArgIndex(method, argc) {
  const m = {
    sendNext: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendOk: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendPrev: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendNextPrev: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendYesNo: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendSimple: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendAcceptDecline: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendGetNumber: (n) => (n === 4 || n === 5 ? 0 : -1),
    sendGetText: (n) => (n >= 1 && n <= 2 ? 0 : -1),
    sendStyle: (n) => (n === 2 ? 0 : -1),
    sendDimensionalMirror: (n) => (n === 1 ? 0 : -1),
    sendSelectLevel: (n) => {
      if (n === 1) return 0;
      if (n === 2 || n === 3) return 1;
      return -1;
    },
    sendNextLevel: (n) => (n === 2 || n === 3 ? 1 : -1),
    sendOkLevel: (n) => (n === 2 || n === 3 ? 1 : -1),
    sendLastLevel: (n) => (n === 2 || n === 3 ? 1 : -1),
    sendLastNextLevel: (n) => (n === 3 || n === 4 ? 2 : -1),
    sendNextSelectLevel: (n) => (n === 2 || n === 3 ? 1 : -1),
    sendYesNoLevel: (n) => (n === 3 || n === 4 ? 2 : -1),
    sendAcceptDeclineLevel: (n) => (n === 3 || n === 4 ? 2 : -1),
    getInputNumberLevel: (n) => (n === 5 ? 1 : -1),
    getInputTextLevel: (n) => (n === 2 ? 1 : -1),
    getPnpcInputNumberLevel: (n) => (n === 6 ? 1 : -1),
    getPnpcInputTextLevel: (n) => (n === 3 ? 1 : -1),
    playerMessage: (n) => (n === 2 ? 1 : -1),
    dropMessage: (n) => (n === 2 ? 1 : -1),
    mapMessage: (n) => (n === 2 ? 1 : -1),
    guildMessage: (n) => (n === 2 ? 1 : -1),
    message: (n) => (n === 1 ? 0 : -1),
    npcTalk: (n) => (n === 2 ? 1 : -1),
    showInfoText: (n) => (n === 1 ? 0 : -1),
    talkGuide: (n) => (n === 1 ? 0 : -1),
    showInstruction: (n) => (n === 3 ? 0 : -1),
    earnTitle: (n) => (n === 1 ? 0 : -1),
    weakenAreaBoss: (n) => (n === 2 ? 1 : -1),
    setGetText: (n) => (n === 1 ? 0 : -1),
    summonBossDelayed: (n) => (n === 6 ? 5 : -1),
  };
  const fn = m[method];
  if (!fn) return -1;
  return fn(argc);
}

function walk(node, visitor) {
  if (!node || typeof node !== "object") return;
  visitor(node);
  for (const key of Object.keys(node)) {
    if (key === "loc" || key === "range" || key === "start" || key === "end" || key === "extra") continue;
    const v = node[key];
    if (Array.isArray(v)) {
      for (const c of v) walk(c, visitor);
    } else if (v && typeof v === "object" && v.type) {
      walk(v, visitor);
    }
  }
}

function getStringFromNode(node) {
  if (node.type === "StringLiteral") {
    return { value: node.value, template: false, hasInterpolation: false };
  }
  if (node.type === "TemplateLiteral") {
    if (node.expressions && node.expressions.length > 0) {
      return { value: null, template: true, hasInterpolation: true };
    }
    let s = "";
    for (const q of node.quasis) {
      s += q.value.cooked != null ? q.value.cooked : q.value.raw;
    }
    return { value: s, template: true, hasInterpolation: false };
  }
  return null;
}

function extractFromSource(relativePath, source) {
  let ast;
  try {
    ast = parse(source, {
      sourceType: "script",
      allowReturnOutsideFunction: true,
      allowAwaitOutsideFunction: true,
      errorRecovery: true,
      plugins: ["numericSeparator", "optionalChaining", "nullishCoalescingOperator"],
    });
  } catch (e) {
    return { error: String(e.message || e), units: [] };
  }

  const units = [];

  walk(ast, (node) => {
    if (node.type !== "CallExpression") return;
    const callee = node.callee;
    if (callee?.type !== "MemberExpression") return;
    if (callee.computed) return;
    const obj = callee.object;
    const prop = callee.property;
    if (obj?.type !== "Identifier" || prop?.type !== "Identifier") return;
    if (!RECEIVERS.has(obj.name)) return;

    const method = prop.name;
    const args = node.arguments || [];
    const idx = textArgIndex(method, args.length);
    if (idx < 0 || idx >= args.length) return;

    const argNode = args[idx];
    const got = getStringFromNode(argNode);
    if (!got || got.value === null) return;

    const start = argNode.start;
    const end = argNode.end;
    if (start == null || end == null) return;

    const byteStart = utf8ByteOffset(source, start);
    const byteEnd = utf8ByteOffset(source, end);
    const line = argNode.loc?.start?.line ?? 0;
    const column = argNode.loc?.start?.column ?? 0;

    units.push({
      callee: `${obj.name}.${method}`,
      sourceText: got.value,
      template: got.template,
      hasInterpolation: got.hasInterpolation,
      byteStart,
      byteEnd,
      line,
      column,
    });
  });

  return { error: null, units };
}

function collectJsFiles(base, subdirs) {
  const out = [];
  for (const sub of subdirs) {
    const dir = path.join(base, sub);
    if (!fs.existsSync(dir)) continue;
    const walkDir = (d) => {
      for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, ent.name);
        if (ent.isDirectory()) walkDir(p);
        else if (ent.isFile() && ent.name.endsWith(".js")) out.push(p);
      }
    };
    walkDir(dir);
  }
  return out.sort();
}

function main() {
  const args = process.argv.slice(2);
  let base = process.cwd();
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--base" && args[i + 1]) {
      base = path.resolve(args[++i]);
    }
  }

  const subdirs = [
    "scripts-zh-CN/npc",
    "scripts-zh-CN/quest",
    "scripts-zh-CN/reactor",
  ];
  const absFiles = collectJsFiles(base, subdirs);
  const files = [];

  for (const abs of absFiles) {
    const relativePath = path.relative(base, abs).split(path.sep).join("/");
    let category = "npc";
    if (relativePath.includes("/quest/")) category = "quest";
    else if (relativePath.includes("/reactor/")) category = "reactor";

    const source = fs.readFileSync(abs, "utf8");
    const { error, units } = extractFromSource(relativePath, source);
    files.push({ relativePath, category, error, units });
  }

  process.stdout.write(JSON.stringify({ base, files }, null, 0));
}

main();
