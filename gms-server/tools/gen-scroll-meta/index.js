/**
 * WZ 卷轴元数据提取工具 - 入口脚本
 *
 * 用法: node tools/gen-scroll-meta/index.js
 *
 * 功能：
 *   1. 扫描 wz/Item.wz/Consume/*.img.xml；
 *   2. 解析每个 8 位卷轴 imgdir，抽取其 info 节点下的 inc* 属性、success、cursed；
 *   3. 判定是否为"防御卷轴"（所有 inc* 属性均属于 {incPDD, incMDD, incMHP, incMMP}）；
 *   4. 判定是否为"命中率武器卷轴"（ID 落在武器卷轴段 2043xxx / 2044xxx，
 *      且 inc* 属性中数值最大者包含 incACC，宽口径含并列最大）；
 *   5. 输出三份产物：
 *      - scroll-meta.json        全量元数据（供开发者查阅）
 *      - scroll-defense-ids.js   仅防御卷轴 ID 数组，供 兑换卷轴.js 合并
 *      - scroll-accuracy-ids.js  仅命中率武器卷轴 ID 数组，供 兑换卷轴.js 合并
 *
 * 该脚本仅用于离线 / 数据变更时更新白名单，不在运行时被调用。
 *
 * -------------------------------------------------------------------
 * 防御卷轴识别规则
 * -------------------------------------------------------------------
 *   卷轴 info 节点下所有 inc* 属性都属于 {incPDD, incMDD, incMHP, incMMP}
 *   集合；且至少存在一个 inc* 字段。
 *
 * -------------------------------------------------------------------
 * 命中率武器卷轴识别规则
 * -------------------------------------------------------------------
 *   1) ID 范围限定：仅考虑 2043000-2044999（即 2043xxx / 2044xxx，
 *      覆盖单手剑/单手斧/单手钝器/短刀/双手剑/双手斧/双手钝器/枪/矛/
 *      弓/弩/拳套/指节 等武器卷轴段）；
 *   2) inc* 属性值最大的字段集合包含 incACC（命中率）。
 *      - 严格最大：incACC 唯一最大，直接命中；
 *      - 并列最大：如 incACC == incPAD 等，宽口径也判为命中率武器卷轴。
 *   3) 至少需要存在一个 inc* 字段；若卷轴没有任何 inc* 字段，则不视为
 *      命中率武器卷轴（避免误伤特殊卷轴）。
 */
const fs = require('fs');
const path = require('path');

// ============================================================================
// 常量配置
// ============================================================================

// 项目根目录（本脚本位于 tools/gen-scroll-meta/）
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const CONSUME_DIR = path.join(PROJECT_ROOT, 'wz', 'Item.wz', 'Consume');
const OUTPUT_DIR = __dirname;

// 防御系属性集合：info 下仅出现这些 inc* 字段才判定为"防御卷轴"
const DEFENSE_INC_KEYS = new Set(['incPDD', 'incMDD', 'incMHP', 'incMMP']);

// 武器卷轴 ID 段：2043xxx / 2044xxx（仅这两段参与"命中率武器卷轴"判定）
const WEAPON_SCROLL_ID_MIN = 2043000;
const WEAPON_SCROLL_ID_MAX = 2044999;

// 卷轴物品 ID 段前缀：204 / 205 / 207（204 装备卷轴，205 白卷，207 混沌卷）
// 本次仅需防御类卷轴识别，范围集中在 2040xxx。
// 但我们仍扫描全部 Consume 下 XML，按 info 内是否存在 inc* 字段作为判定依据。

// ============================================================================
// XML 工具函数（针对 WZ 的简单结构，使用正则解析而非完整 XML DOM）
// ============================================================================

/**
 * 将 XML 文本按顶层 imgdir name="XXXXXXXX"（8 位数字）切分为若干卷轴块。
 * 由于 WZ 的 Consume XML 结构稳定：外层 imgdir 包一个 0204.img，其内部每个卷轴
 * 也是 imgdir name="02040001"（8 位），再往下 info 下是 int 字段。
 *
 * 为简化实现，这里只识别"name 属性恰好 8 位数字"的 imgdir 开闭标签配对。
 *
 * @param {string} xml 完整 XML 文本
 * @returns {Array<{id: string, body: string}>} 返回每个卷轴的 id（8 位字符串）与其 body（imgdir 之间内容）
 */
function splitScrollBlocks(xml) {
    const results = [];
    // 使用栈匹配 imgdir 的层级，保证找到的是同一级的 8 位 ID 卷轴块。
    const tagRe = /<imgdir\s+name="([^"]+)"\s*>|<\/imgdir>/g;
    const stack = [];
    let match;
    while ((match = tagRe.exec(xml)) !== null) {
        if (match[0].startsWith('</')) {
            // 闭合
            const top = stack.pop();
            if (top && /^\d{8}$/.test(top.name)) {
                // 确认为一个"卷轴 imgdir"，取其内部内容
                const body = xml.substring(top.bodyStart, match.index);
                results.push({ id: top.name, body });
            }
        } else {
            stack.push({ name: match[1], bodyStart: tagRe.lastIndex });
        }
    }
    return results;
}

/**
 * 从卷轴 body 中提取 <imgdir name="info"> 块的内部 XML。
 * @param {string} body 卷轴 imgdir 内部内容
 * @returns {string|null} info 节点内部 XML；找不到返回 null
 */
function extractInfoBlock(body) {
    const openRe = /<imgdir\s+name="info"\s*>/;
    const openMatch = openRe.exec(body);
    if (!openMatch) return null;
    // 查找成对的 </imgdir>，需要跳过 info 内部的嵌套 imgdir
    const after = body.substring(openMatch.index + openMatch[0].length);
    const tagRe = /<imgdir[^/][^>]*>|<\/imgdir>/g;
    let depth = 1;
    let m;
    while ((m = tagRe.exec(after)) !== null) {
        if (m[0].startsWith('</')) {
            depth--;
            if (depth === 0) {
                return after.substring(0, m.index);
            }
        } else {
            depth++;
        }
    }
    return null;
}

/**
 * 从 info XML 中抽取所有形如 <int name="xxx" value="N"/> 的字段。
 * 过滤掉 <uol ...>（如 icon 引用）以及 <canvas>（图片）。
 *
 * @param {string} infoXml info 节点内部 XML
 * @returns {Object<string, number>} 字段名 -> 数值
 */
function extractIntFields(infoXml) {
    const result = {};
    const intRe = /<int\s+name="([^"]+)"\s+value="(-?\d+)"\s*\/>/g;
    let m;
    while ((m = intRe.exec(infoXml)) !== null) {
        result[m[1]] = parseInt(m[2], 10);
    }
    return result;
}

/**
 * 判定一个卷轴是否属于"防御卷轴"。
 * 规则：所有以 "inc" 开头的字段都属于 DEFENSE_INC_KEYS；
 *       且至少存在一个 inc* 字段（没有任何属性的特殊卷轴不视为防御卷轴）。
 *
 * @param {Object<string, number>} incs 仅含 inc* 字段的对象
 * @returns {boolean}
 */
function isDefense(incs) {
    const keys = Object.keys(incs);
    if (keys.length === 0) return false;
    return keys.every((k) => DEFENSE_INC_KEYS.has(k));
}

/**
 * 判定一个卷轴是否为"命中率武器卷轴"。
 *
 * 规则（对应顶部注释）：
 *   1) ID 必须落在武器卷轴段 [WEAPON_SCROLL_ID_MIN, WEAPON_SCROLL_ID_MAX]；
 *   2) inc* 至少存在一个字段；
 *   3) inc* 数值最大的字段集合中包含 "incACC"（宽口径：并列最大也算）。
 *
 * @param {number} id 卷轴物品 ID（7-8 位）
 * @param {Object<string, number>} incs 仅含 inc* 字段的对象
 * @returns {boolean}
 */
function isAccuracyWeapon(id, incs) {
    if (id < WEAPON_SCROLL_ID_MIN || id > WEAPON_SCROLL_ID_MAX) return false;
    const keys = Object.keys(incs);
    if (keys.length === 0) return false;
    let max = -Infinity;
    for (const k of keys) {
        if (incs[k] > max) max = incs[k];
    }
    // 数值最大字段集合（处理并列最大）
    const topKeys = keys.filter((k) => incs[k] === max);
    return topKeys.includes('incACC');
}

// ============================================================================
// 主流程
// ============================================================================

/**
 * 读取 Consume 下全部 XML，提取所有卷轴记录。
 * @returns {Array<{id:number, incs:Object, success:number|null, cursed:number|null, isDefense:boolean, sourceFile:string}>}
 */
function collectScrolls() {
    if (!fs.existsSync(CONSUME_DIR)) {
        throw new Error(`找不到 Consume 目录: ${CONSUME_DIR}`);
    }
    const files = fs
        .readdirSync(CONSUME_DIR)
        .filter((f) => f.endsWith('.img.xml'))
        .sort();

    const records = [];
    for (const file of files) {
        const full = path.join(CONSUME_DIR, file);
        const xml = fs.readFileSync(full, 'utf8');
        const blocks = splitScrollBlocks(xml);
        for (const blk of blocks) {
            const infoXml = extractInfoBlock(blk.body);
            if (!infoXml) continue;
            const allInts = extractIntFields(infoXml);
            // 拆分 inc* 和元数据
            const incs = {};
            for (const [k, v] of Object.entries(allInts)) {
                if (k.startsWith('inc')) {
                    incs[k] = v;
                }
            }
            // 排序键便于产物稳定
            const incsSorted = {};
            for (const k of Object.keys(incs).sort()) incsSorted[k] = incs[k];

            records.push({
                id: parseInt(blk.id, 10), // 去除前导 0，得到 7 位游戏物品 ID
                incs: incsSorted,
                success: Object.prototype.hasOwnProperty.call(allInts, 'success') ? allInts.success : null,
                cursed: Object.prototype.hasOwnProperty.call(allInts, 'cursed') ? allInts.cursed : null,
                isDefense: isDefense(incsSorted),
                isAccuracyWeapon: isAccuracyWeapon(parseInt(blk.id, 10), incsSorted),
                sourceFile: file,
            });
        }
    }
    // 按 id 升序，保证可重入
    records.sort((a, b) => a.id - b.id);
    return records;
}

/**
 * 将 records 写入 scroll-meta.json
 */
function writeMetaJson(records) {
    const outPath = path.join(OUTPUT_DIR, 'scroll-meta.json');
    // 为了 diff 稳定：2 空格缩进，行末换行
    const json = JSON.stringify(records, null, 2) + '\n';
    fs.writeFileSync(outPath, json, 'utf8');
    return outPath;
}

/**
 * 将防御卷轴 ID 写入 scroll-defense-ids.js（CommonJS + ESM 双导出形式）。
 */
function writeDefenseIdsJs(records) {
    const defenseIds = records.filter((r) => r.isDefense).map((r) => r.id);
    defenseIds.sort((a, b) => a - b);

    // 每行 8 个 ID，提高可读性
    const lines = [];
    for (let i = 0; i < defenseIds.length; i += 8) {
        lines.push('  ' + defenseIds.slice(i, i + 8).join(', ') + ',');
    }
    // 去掉最后一项尾逗号（保留也合法，但为了更干净的 diff，这里保留以方便追加）
    const body = lines.join('\n');

    const content =
        '/**\n' +
        ' * 防御卷轴 ID 白名单\n' +
        ' *\n' +
        ' * 由 tools/gen-scroll-meta 根据 wz/Item.wz/Consume/*.img.xml 自动生成，\n' +
        ' * 请勿手工编辑；如需更新，重新运行：\n' +
        ' *   node tools/gen-scroll-meta/index.js\n' +
        ' *\n' +
        ' * 判定规则：卷轴 info 节点下所有 inc* 属性都属于\n' +
        ' *   {incPDD, incMDD, incMHP, incMMP} 集合。\n' +
        ` * 共 ${defenseIds.length} 个。\n` +
        ' */\n' +
        'const DEFENSE_SCROLL_IDS = Object.freeze([\n' +
        body +
        '\n]);\n\n' +
        '// 同时提供 ESM / CommonJS 两种导出方式，方便不同场景引入\n' +
        "if (typeof module !== 'undefined' && module.exports) {\n" +
        '  module.exports = { DEFENSE_SCROLL_IDS };\n' +
        '}\n';

    const outPath = path.join(OUTPUT_DIR, 'scroll-defense-ids.js');
    fs.writeFileSync(outPath, content, 'utf8');
    return { outPath, count: defenseIds.length };
}

/**
 * 将命中率武器卷轴 ID 写入 scroll-accuracy-ids.js（CommonJS + ESM 双导出形式）。
 */
function writeAccuracyIdsJs(records) {
    const accuracyIds = records.filter((r) => r.isAccuracyWeapon).map((r) => r.id);
    accuracyIds.sort((a, b) => a - b);

    // 每行 8 个 ID，提高可读性
    const lines = [];
    for (let i = 0; i < accuracyIds.length; i += 8) {
        lines.push('  ' + accuracyIds.slice(i, i + 8).join(', ') + ',');
    }
    const body = lines.length > 0 ? lines.join('\n') : '  // (空)';

    const content =
        '/**\n' +
        ' * 命中率武器卷轴 ID 白名单\n' +
        ' *\n' +
        ' * 由 tools/gen-scroll-meta 根据 wz/Item.wz/Consume/*.img.xml 自动生成，\n' +
        ' * 请勿手工编辑；如需更新，重新运行：\n' +
        ' *   node tools/gen-scroll-meta/index.js\n' +
        ' *\n' +
        ' * 判定规则：\n' +
        ' *   1) ID 必须落在武器卷轴段 2043000 - 2044999；\n' +
        ' *   2) inc* 数值最大的字段集合包含 incACC（宽口径：并列最大也算）。\n' +
        ` * 共 ${accuracyIds.length} 个。\n` +
        ' */\n' +
        'const ACCURACY_WEAPON_SCROLL_IDS = Object.freeze([\n' +
        body +
        '\n]);\n\n' +
        '// 同时提供 ESM / CommonJS 两种导出方式，方便不同场景引入\n' +
        "if (typeof module !== 'undefined' && module.exports) {\n" +
        '  module.exports = { ACCURACY_WEAPON_SCROLL_IDS };\n' +
        '}\n';

    const outPath = path.join(OUTPUT_DIR, 'scroll-accuracy-ids.js');
    fs.writeFileSync(outPath, content, 'utf8');
    return { outPath, count: accuracyIds.length };
}

function main() {
    console.log('===========================================');
    console.log('  WZ 卷轴元数据提取工具');
    console.log('===========================================\n');
    console.log('配置信息:');
    console.log(`  Consume 源目录: ${CONSUME_DIR}`);
    console.log(`  输出目录:       ${OUTPUT_DIR}\n`);

    const records = collectScrolls();
    const metaPath = writeMetaJson(records);
    const { outPath: idsPath, count } = writeDefenseIdsJs(records);
    const { outPath: accPath, count: accCount } = writeAccuracyIdsJs(records);

    // 统计输出
    const total = records.length;
    const withIncs = records.filter((r) => Object.keys(r.incs).length > 0).length;
    console.log('统计信息:');
    console.log(`  扫描到卷轴数量:         ${total}`);
    console.log(`  含 inc* 属性卷轴:       ${withIncs}`);
    console.log(`  判定为防御卷轴数:       ${count}`);
    console.log(`  判定为命中率武器卷轴:   ${accCount}\n`);
    console.log('产物文件:');
    console.log(`  ${metaPath}`);
    console.log(`  ${idsPath}`);
    console.log(`  ${accPath}`);
    console.log('\n提取完成!');
}

main();
