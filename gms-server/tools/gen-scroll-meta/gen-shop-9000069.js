/**
 * 9000069 商店 shopitems 数据生成工具
 *
 * 用法:
 *   node tools/gen-scroll-meta/gen-shop-9000069.js
 *
 * 功能:
 *   1. 从 scripts-zh-CN/BeiDouSpecial/兑换卷轴.js 中提取顶层 `const data = {...};`
 *      常量（卷轴 ID → [类别名, 成功率档位]）；
 *   2. 结合 scroll-defense-ids.js / scroll-accuracy-ids.js 以及 EXCLUDED_EXCHANGE_SCROLL_IDS
 *      三个白名单，过滤掉防御卷轴 / 命中率武器卷轴 / 手工排除单品；
 *   3. 仅保留档位为 6（60%）与 1（10%）的卷轴，按：
 *        - 档位 6 → price = 1,000,000
 *        - 档位 1 → price = 1,500,000
 *      写入 Flyway 迁移脚本 V2.0.7__shopitems_9000069_rebuild.sql。
 *
 * 与现有 V1.0.55__shopitems_insert_data.sql 对齐：
 *   INSERT INTO `shopitems` (`shopid`, `itemid`, `price`, `pitch`, `position`) VALUES ...
 *   不显式指定 shopitemid（由 AUTO_INCREMENT 分配）。
 *
 * 幂等策略：脚本开头固定 DELETE 再 INSERT；Flyway 单文件事务可保证中途失败可重试。
 */
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '../..');
const SCRIPT_PATH = path.join(
    PROJECT_ROOT,
    'scripts-zh-CN',
    'BeiDouSpecial',
    '兑换卷轴.js'
);
const OUTPUT_SQL = path.join(
    PROJECT_ROOT,
    'src',
    'main',
    'resources',
    'db',
    'migration',
    'V2.0.7__shopitems_9000069_rebuild.sql'
);

const { DEFENSE_SCROLL_IDS } = require('./scroll-defense-ids.js');
const { ACCURACY_WEAPON_SCROLL_IDS } = require('./scroll-accuracy-ids.js');
// 与 兑换卷轴.js 中 EXCLUDED_EXCHANGE_SCROLL_IDS 保持一致（手工排除单品）
const EXCLUDED_EXCHANGE_SCROLL_IDS = [2040412, 2040413];

const PRICE_MAP = {
    6: 1000000, // 60% 成功率卷轴
    1: 1500000, // 10% 成功率卷轴
};

/**
 * 从 兑换卷轴.js 中提取顶层 `const data = { ... };` 对象。
 * 由于该脚本包含 Nashorn 风格语法，这里仅抓取 data 定义块再 eval 为 JS 对象。
 *
 * @returns {Object<string, [string, number]>}
 */
function extractDataObject() {
    const src = fs.readFileSync(SCRIPT_PATH, 'utf8');
    const re = /const\s+data\s*=\s*(\{[\s\S]*?\})\s*;/;
    const m = re.exec(src);
    if (!m) {
        throw new Error('无法在 兑换卷轴.js 中定位顶层 `const data = { ... };`');
    }
    // 使用 new Function 在隔离作用域中求值
    // eslint-disable-next-line no-new-func
    return new Function('return ' + m[1])();
}

function buildRows(data) {
    const defenseSet = new Set(DEFENSE_SCROLL_IDS);
    const accuracySet = new Set(ACCURACY_WEAPON_SCROLL_IDS);
    const excludedSet = new Set(EXCLUDED_EXCHANGE_SCROLL_IDS);

    const rows = [];
    let position = 1;
    // 稳定顺序：按 itemid 升序
    const ids = Object.keys(data)
        .map((k) => parseInt(k, 10))
        .sort((a, b) => a - b);

    let skippedDefense = 0;
    let skippedAccuracy = 0;
    let skippedExcluded = 0;
    let skippedOtherTier = 0;

    for (const id of ids) {
        const [, tier] = data[String(id)];
        if (defenseSet.has(id)) {
            skippedDefense++;
            continue;
        }
        if (accuracySet.has(id)) {
            skippedAccuracy++;
            continue;
        }
        if (excludedSet.has(id)) {
            skippedExcluded++;
            continue;
        }
        const price = PRICE_MAP[tier];
        if (typeof price !== 'number') {
            skippedOtherTier++;
            continue; // 仅处理 60% / 10% 两档
        }
        rows.push({ itemid: id, price, pitch: 0, position: position++ });
    }

    return {
        rows,
        stats: {
            totalInData: ids.length,
            skippedDefense,
            skippedAccuracy,
            skippedExcluded,
            skippedOtherTier,
            inserted: rows.length,
        },
    };
}

function renderSql(rows) {
    const now = new Date().toISOString().slice(0, 10);
    const header =
        '-- ============================================================================\n' +
        '-- 9000069 商店 shopitems 重建脚本\n' +
        '--\n' +
        '-- 来源：scripts-zh-CN/BeiDouSpecial/兑换卷轴.js 的 data 对象中\n' +
        '--       档位为 6 (60%) / 1 (10%) 的卷轴，过滤掉：\n' +
        '--         - 防御卷轴（tools/gen-scroll-meta/scroll-defense-ids.js）\n' +
        '--         - 命中率武器卷轴（tools/gen-scroll-meta/scroll-accuracy-ids.js）\n' +
        '--         - 手工排除单品（2040412 / 2040413）\n' +
        '-- 价格规则：\n' +
        '--   60% (data[x][1] === 6) → price = 1,000,000 金币\n' +
        '--   10% (data[x][1] === 1) → price = 1,500,000 金币\n' +
        '--\n' +
        '-- 生成工具：tools/gen-scroll-meta/gen-shop-9000069.js\n' +
        `-- 生成时间：${now}\n` +
        '-- 维护方式：如需变更价格或上架集合，请修改生成工具后重跑，勿手改此文件。\n' +
        '-- ============================================================================\n\n';

    const del =
        '-- 清空 9000069 商店现有物品（原 9 条 shopitemid ∈ {6533..6541}）\n' +
        'DELETE FROM `shopitems` WHERE `shopid` = 9000069;\n\n';

    if (rows.length === 0) {
        return header + del + '-- （无符合条件的卷轴，未生成 INSERT）\n';
    }

    const valueLines = rows.map(
        (r) => `    (9000069, ${r.itemid}, ${r.price}, ${r.pitch}, ${r.position})`
    );
    const insert =
        `-- 共 ${rows.length} 张卷轴（60% / 10%）\n` +
        'INSERT INTO `shopitems` (`shopid`, `itemid`, `price`, `pitch`, `position`)\n' +
        'VALUES\n' +
        valueLines.join(',\n') +
        ';\n';

    return header + del + insert;
}

function main() {
    console.log('===========================================');
    console.log('  9000069 商店 shopitems 重建 SQL 生成工具');
    console.log('===========================================\n');

    const data = extractDataObject();
    const { rows, stats } = buildRows(data);
    const sql = renderSql(rows);
    fs.writeFileSync(OUTPUT_SQL, sql, 'utf8');

    console.log('统计信息:');
    console.log(`  data 对象总条目:          ${stats.totalInData}`);
    console.log(`  跳过-防御卷轴:           ${stats.skippedDefense}`);
    console.log(`  跳过-命中率武器卷轴:     ${stats.skippedAccuracy}`);
    console.log(`  跳过-手工排除单品:       ${stats.skippedExcluded}`);
    console.log(`  跳过-其它档位(如 3/7):   ${stats.skippedOtherTier}`);
    console.log(`  最终上架卷轴:            ${stats.inserted}`);
    console.log('\n产物文件:');
    console.log(`  ${OUTPUT_SQL}`);
    console.log('\n生成完成!');
}

main();
