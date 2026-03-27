/**
 * WZ 翻译术语表提取器
 * 从 wz-zh-CN 和 wz 目录中提取中英文对照术语
 */
const fs = require('fs');
const path = require('path');
const { WZParser } = require('./parser');
const { TermEntry, GlossaryStats } = require('./models');

// 需要提取的文件映射
// key: 文件标识, value: { zhFile: 中文文件, enFile: 英文文件, category: 分类 }
const FILE_MAPPINGS = {
    'Mob.img': { category: 'mob', priorityFields: ['name'] },
    'Npc.img': { category: 'npc', priorityFields: ['name', 'func'] },
    'Item.img': { category: 'item', priorityFields: ['name'] },
    'Skill.img': { category: 'skill', priorityFields: ['name', 'bookName'] },
    'Map.img': { category: 'map', priorityFields: ['name'] },
    'MonsterBook.img': { category: 'monsterbook', priorityFields: ['name'] },
    'Pet.img': { category: 'pet', priorityFields: ['name'] },
    'Consume.img': { category: 'consume', priorityFields: ['name'] },
    'Cash.img': { category: 'cash', priorityFields: ['name'] },
    'Eqp.img': { category: 'equipment', priorityFields: ['name'] },
    'Etc.img': { category: 'etc', priorityFields: ['name'] },
    'Npc.img': { category: 'npc', priorityFields: ['name', 'func'] },
    'QuestInfo.img': { category: 'quest', priorityFields: ['name'] }
};

// 排除的文件
const EXCLUDED_FILES = [
    'QuestCategory.img'  // 已知翻译有误
];

// 排除的字段名
const EXCLUDED_FIELD_NAMES = [
    'MISSING NAME'
];

/**
 * 检测字符串是否包含中文字符
 */
function containsChinese(str) {
    if (!str) return false;
    return /[\u4e00-\u9fff]/.test(str);
}

/**
 * 术语表提取器类
 */
class GlossaryExtractor {
    constructor(wzZhRoot, wzEnRoot) {
        this.wzZhRoot = wzZhRoot;
        this.wzEnRoot = wzEnRoot;
        this.parser = new WZParser();
        this.entries = [];
        this.seenZhTerms = new Set();   // 已见过的中文术语（用于去重）
        this.seenEnTerms = new Set();    // 已见过的英文术语（用于去重）
        this.stats = new GlossaryStats();
    }

    /**
     * 检测条目是否有效
     * @returns {{valid: boolean, reason: string}}
     */
    validateEntry(zhValue, enValue, fieldType) {
        // 1. 检查字段名是否为排除列表中的值
        if (EXCLUDED_FIELD_NAMES.includes(zhValue)) {
            return { valid: false, reason: '字段名为 MISSING NAME' };
        }
        if (EXCLUDED_FIELD_NAMES.includes(enValue)) {
            return { valid: false, reason: '字段名为 MISSING NAME' };
        }

        // 2. 检查zh和en是否完全相同
        if (zhValue === enValue) {
            return { valid: false, reason: 'zh和en完全相同' };
        }

        // 3. 检查是否都是中文
        if (containsChinese(zhValue) && containsChinese(enValue)) {
            return { valid: false, reason: 'zh和en都是中文' };
        }

        // 4. 检查zh中是否没有中文（zh全是英文）
        if (!containsChinese(zhValue)) {
            return { valid: false, reason: 'zh中没有中文' };
        }

        return { valid: true, reason: '' };
    }

    /**
     * 检测条目是否重复（基于zh或en）
     */
    isDuplicate(zhValue, enValue) {
        // 基于中文去重
        if (this.seenZhTerms.has(zhValue)) {
            return true;
        }
        // 基于英文去重
        if (this.seenEnTerms.has(enValue)) {
            return true;
        }
        return false;
    }

    /**
     * 标记术语为已见过
     */
    markAsSeen(zhValue, enValue) {
        this.seenZhTerms.add(zhValue);
        this.seenEnTerms.add(enValue);
    }

    /**
     * 从指定目录提取术语
     * @param {string} wzDir - WZ 目录名 (如 "String.wz")
     * @param {string} imgFile - 图片文件名 (如 "Mob.img.xml")
     */
    extractFromFile(wzDir, imgFile) {
        const fileName = imgFile.replace('.xml', '');

        // 检查是否在排除列表中
        if (EXCLUDED_FILES.includes(fileName)) {
            console.log(`跳过排除的文件: ${imgFile}`);
            return;
        }

        const mapping = FILE_MAPPINGS[fileName];
        if (!mapping) {
            // 对于未配置的 String.wz 文件，跳过
            console.log(`跳过未配置的文件: ${imgFile}`);
            return;
        }

        const zhPath = path.join(this.wzZhRoot, wzDir, imgFile);
        const enPath = path.join(this.wzEnRoot, wzDir, imgFile);

        // 解析中文和英文文件
        const zhParsed = this.parser.parseFile(zhPath);
        const enParsed = this.parser.parseFile(enPath);

        if (!zhParsed || !enParsed) {
            console.warn(`无法解析文件: ${imgFile}`);
            return;
        }

        // 提取条目
        const zhEntries = this.parser.extractAllStringEntries(zhParsed);
        const enEntries = this.parser.extractAllStringEntries(enParsed);

        // 匹配中英文条目
        this.matchAndExtract(zhEntries, enEntries, mapping.category, path.join(wzDir, imgFile));
    }

    /**
     * 匹配并提取术语
     * @param {Map} zhEntries - 中文条目 Map<ID, Map<字段名, 值>>
     * @param {Map} enEntries - 英文条目 Map<ID, Map<字段名, 值>>
     * @param {string} category - 分类
     * @param {string} sourceFile - 来源文件
     */
    matchAndExtract(zhEntries, enEntries, category, sourceFile) {
        const priorityFields = FILE_MAPPINGS[sourceFile]?.priorityFields || ['name'];

        // 遍历中文条目
        for (const [id, zhFields] of zhEntries) {
            const enFields = enEntries.get(id);
            if (!enFields) continue;

            // 优先提取优先级高的字段
            for (const fieldType of priorityFields) {
                const zhValue = zhFields.get(fieldType);
                const enValue = enFields.get(fieldType);

                // 跳过无效值
                if (!zhValue || zhValue === 'empty' || !enValue || enValue === 'empty') {
                    continue;
                }

                // 验证条目
                const validation = this.validateEntry(zhValue, enValue, fieldType);
                if (!validation.valid) {
                    continue;
                }

                // 检查重复
                if (this.isDuplicate(zhValue, enValue)) {
                    continue;
                }

                // 标记为已见过
                this.markAsSeen(zhValue, enValue);

                // 创建术语条目
                const entry = new TermEntry(
                    zhValue,
                    enValue,
                    id,
                    category,
                    fieldType,
                    sourceFile
                );

                this.entries.push(entry);
                this.stats.addEntry(entry);
                break; // 只提取最高优先级的字段
            }

            // 如果没有匹配到优先级字段，尝试其他字段
            if (this.entries.filter(e => e.id === id && e.sourceFile === sourceFile).length === 0) {
                for (const [fieldType, zhValue] of zhFields) {
                    const enValue = enFields.get(fieldType);
                    if (!zhValue || zhValue === 'empty' || !enValue || enValue === 'empty') {
                        continue;
                    }

                    // 验证条目
                    const validation = this.validateEntry(zhValue, enValue, fieldType);
                    if (!validation.valid) {
                        continue;
                    }

                    // 检查重复
                    if (this.isDuplicate(zhValue, enValue)) {
                        continue;
                    }

                    // 标记为已见过
                    this.markAsSeen(zhValue, enValue);

                    const entry = new TermEntry(
                        zhValue,
                        enValue,
                        id,
                        category,
                        fieldType,
                        sourceFile
                    );

                    this.entries.push(entry);
                    this.stats.addEntry(entry);
                    break;
                }
            }
        }
    }

    /**
     * 从整个目录提取
     * @param {string} wzDir - WZ 目录名 (如 "String.wz")
     */
    extractFromDirectory(wzDir) {
        const zhDir = path.join(this.wzZhRoot, wzDir);

        if (!fs.existsSync(zhDir)) {
            console.warn(`中文目录不存在: ${zhDir}`);
            return;
        }

        const files = fs.readdirSync(zhDir).filter(f => f.endsWith('.xml'));

        for (const file of files) {
            console.log(`处理文件: ${wzDir}/${file}`);
            this.extractFromFile(wzDir, file);
        }
    }

    /**
     * 执行提取
     */
    extract() {
        console.log('开始提取翻译术语表...\n');

        // 只处理 String.wz 目录（目前 wz-zh-CN 只有这个目录有完整数据）
        this.extractFromDirectory('String.wz');

        // 处理 Etc.wz（排除 QuestCategory.img）
        this.extractFromDirectory('Etc.wz');

        console.log(`\n提取完成! 共 ${this.entries.length} 条术语`);
        return this.entries;
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return this.stats;
    }

    /**
     * 获取所有提取的条目
     */
    getEntries() {
        return this.entries;
    }

    /**
     * 按分类分组获取条目
     */
    getEntriesByCategory() {
        const grouped = {};
        for (const entry of this.entries) {
            if (!grouped[entry.category]) {
                grouped[entry.category] = [];
            }
            grouped[entry.category].push(entry.toJSON());
        }
        return grouped;
    }
}

module.exports = {
    GlossaryExtractor,
    FILE_MAPPINGS,
    EXCLUDED_FILES
};