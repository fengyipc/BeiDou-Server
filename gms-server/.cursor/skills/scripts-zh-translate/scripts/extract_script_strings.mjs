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

/**
 * Pure string initializers: var/let/const x = "..." or x = "..." (no + / ${}).
 * bindEnd: source character offset after the binding is complete (declarator / assignment end).
 */
function collectStringBindings(ast) {
  const bindings = [];
  walk(ast, (node) => {
    if (node.type === "VariableDeclarator") {
      const id = node.id;
      const init = node.init;
      if (id?.type === "Identifier" && init) {
        const got = getStringFromNode(init);
        if (got?.value != null && !got.hasInterpolation) {
          bindings.push({
            name: id.name,
            bindEnd: node.end,
            litStart: init.start,
            litEnd: init.end,
            value: got.value,
            template: got.template,
            line: init.loc?.start?.line ?? 0,
            column: init.loc?.start?.column ?? 0,
          });
        }
      }
    }
    if (node.type === "AssignmentExpression" && node.operator === "=") {
      const left = node.left;
      if (left?.type === "Identifier") {
        const got = getStringFromNode(node.right);
        if (got?.value != null && !got.hasInterpolation) {
          bindings.push({
            name: left.name,
            bindEnd: node.end,
            litStart: node.right.start,
            litEnd: node.right.end,
            value: got.value,
            template: got.template,
            line: node.right.loc?.start?.line ?? 0,
            column: node.right.loc?.start?.column ?? 0,
          });
        }
      }
    }
  });
  return bindings;
}

/** Latest binding for `name` that finishes before `callStart` (0-based source offset). */
function resolveStringBinding(name, callStart, bindings) {
  let best = null;
  for (const b of bindings) {
    if (b.name !== name) continue;
    if (b.bindEnd > callStart) continue;
    if (!best || b.bindEnd > best.bindEnd) best = b;
  }
  return best;
}

/**
 * Menu / list text often uses `var opts = ["a","b"]; selStr += ... + opts[i] + ...; cm.sendSimple(selStr)`.
 * Emit one unit per string element (byte span = that literal) so each line can be translated in place.
 */
function addUnitsFromArrayExpression(arrNode, arrayName, source, addUnit) {
  if (arrNode.type !== "ArrayExpression") return;
  const elements = arrNode.elements || [];
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if (!el || el.type === "SpreadElement") continue;
    const got = getStringFromNode(el);
    if (got?.value == null || got.hasInterpolation) continue;
    const start = el.start;
    const end = el.end;
    if (start == null || end == null) continue;
    addUnit({
      callee: `array:${arrayName}[${i}]`,
      sourceText: got.value,
      template: got.template,
      hasInterpolation: false,
      byteStart: utf8ByteOffset(source, start),
      byteEnd: utf8ByteOffset(source, end),
      line: el.loc?.start?.line ?? 0,
      column: el.loc?.start?.column ?? 0,
    });
  }
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

  const bindings = collectStringBindings(ast);
  const seenLiteralSpan = new Set();
  const units = [];

  function addUnit(unit) {
    const key = `${unit.byteStart}|${unit.byteEnd}`;
    if (seenLiteralSpan.has(key)) return;
    seenLiteralSpan.add(key);
    units.push(unit);
  }

  walk(ast, (node) => {
    if (node.type === "VariableDeclarator") {
      const id = node.id;
      const init = node.init;
      if (id?.type === "Identifier" && init?.type === "ArrayExpression") {
        addUnitsFromArrayExpression(init, id.name, source, addUnit);
      }
    }
    if (node.type === "AssignmentExpression" && node.operator === "=") {
      const left = node.left;
      const right = node.right;
      if (left?.type === "Identifier" && right?.type === "ArrayExpression") {
        addUnitsFromArrayExpression(right, left.name, source, addUnit);
      }
    }
  });

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
    const callStart = node.start ?? 0;

    const got = getStringFromNode(argNode);
    if (got && got.value !== null && !got.hasInterpolation) {
      const start = argNode.start;
      const end = argNode.end;
      if (start == null || end == null) return;

      addUnit({
        callee: `${obj.name}.${method}`,
        sourceText: got.value,
        template: got.template,
        hasInterpolation: got.hasInterpolation,
        byteStart: utf8ByteOffset(source, start),
        byteEnd: utf8ByteOffset(source, end),
        line: argNode.loc?.start?.line ?? 0,
        column: argNode.loc?.start?.column ?? 0,
      });
      return;
    }

    if (argNode.type === "Identifier") {
      const b = resolveStringBinding(argNode.name, callStart, bindings);
      if (!b) return;

      addUnit({
        callee: `${obj.name}.${method}`,
        sourceText: b.value,
        template: b.template,
        hasInterpolation: false,
        byteStart: utf8ByteOffset(source, b.litStart),
        byteEnd: utf8ByteOffset(source, b.litEnd),
        line: b.line,
        column: b.column,
      });
    }
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
