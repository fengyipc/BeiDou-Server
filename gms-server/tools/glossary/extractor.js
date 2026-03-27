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
    'QuestInfo.img': { category: 'quest', priorityFields: ['name'] },
    'ToolTipHelp.img': { category: 'tooltip', priorityFields: ['Title', 'Desc'] }
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
     * 从 XML 内容中递归提取所有嵌套的 string 节点
     * @param {string} xmlContent - XML 字符串
     * @returns {Array} [{path, name, value}, ...]
     */
    extractNestedStrings(xmlContent) {
        const results = [];
        // 匹配 imgdir 标签
        const imgdirRegex = /<imgdir\s+name="([^"]+)"[^>]*>/g;
        // 匹配 string 标签
        const stringRegex = /<string\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/g;

        let imgdirMatch;
        const imgdirPositions = [];

        // 找到所有 imgdir 的位置
        while ((imgdirMatch = imgdirRegex.exec(xmlContent)) !== null) {
            imgdirPositions.push({
                name: imgdirMatch[1],
                start: imgdirMatch.index,
                end: imgdirMatch.index + imgdirMatch[0].length
            });
        }

        // 对每个 imgdir，提取其闭合标签之间的所有 string
        for (let i = 0; i < imgdirPositions.length; i++) {
            const current = imgdirPositions[i];
            const next = imgdirPositions[i + 1];

            // 找到当前 imgdir 的结束位置（下一个同级或父级 imgdir 的开始之前，或 </imgdir>）
            let endPos = next ? next.start : xmlContent.lastIndexOf('</imgdir>', xmlContent.length - 10);

            // 找到当前 imgdir 的内容区域（跳过开始标签）
            const contentStart = xmlContent.indexOf('>', current.start) + 1;
            const contentEnd = endPos;
            const content = xmlContent.substring(contentStart, contentEnd);

            // 在内容中查找所有 string
            let stringMatch;
            while ((stringMatch = stringRegex.exec(content)) !== null) {
                results.push({
                    path: current.name,
                    name: stringMatch[1],
                    value: stringMatch[2]
                });
            }

            // 递归处理子 imgdir
            const childContent = content;
            const childResults = this.extractNestedStringsFromContent(childContent, current.name);
            results.push(...childResults);
        }

        return results;
    }

    /**
     * 从内容中递归提取嵌套的 string（带路径前缀）
     */
    extractNestedStringsFromContent(content, parentPath) {
        const results = [];
        const imgdirRegex = /<imgdir\s+name="([^"]+)"[^>]*>/g;
        const stringRegex = /<string\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/g;

        let imgdirMatch;
        const imgdirs = [];

        while ((imgdirMatch = imgdirRegex.exec(content)) !== null) {
            imgdirs.push({
                name: imgdirMatch[1],
                start: imgdirMatch.index,
                end: imgdirMatch.index + imgdirMatch[0].length
            });
        }

        for (let i = 0; i < imgdirs.length; i++) {
            const current = imgdirs[i];
            const next = imgdirs[i + 1];
            let endPos = next ? next.start : content.indexOf('</imgdir>', content.length - 10);
            if (endPos === -1) endPos = content.length;

            const childStart = content.indexOf('>', current.start) + 1;
            const childContent = content.substring(childStart, endPos);

            // 提取当前层的 string
            let stringMatch;
            while ((stringMatch = stringRegex.exec(childContent)) !== null) {
                results.push({
                    path: `${parentPath}/${current.name}`,
                    name: stringMatch[1],
                    value: stringMatch[2]
                });
            }

            // 递归子层
            const grandchildResults = this.extractNestedStringsFromContent(childContent, `${parentPath}/${current.name}`);
            results.push(...grandchildResults);
        }

        return results;
    }

    /**
     * 特殊提取 ToolTipHelp.img（嵌套结构）
     */
    extractToolTipHelp() {
        const zhPath = path.join(this.wzZhRoot, 'String.wz', 'ToolTipHelp.img.xml');
        const enPath = path.join(this.wzEnRoot, 'String.wz', 'ToolTipHelp.img.xml');

        if (!fs.existsSync(zhPath) || !fs.existsSync(enPath)) {
            console.warn(`ToolTipHelp.img.xml 文件不存在`);
            return;
        }

        const zhContent = fs.readFileSync(zhPath, 'utf-8');
        const enContent = fs.readFileSync(enPath, 'utf-8');

        // 提取嵌套的字符串
        const zhStrings = this.extractNestedStrings(zhContent);
        const enStrings = this.extractNestedStrings(enContent);

        // 构建中文映射: path:name -> value
        const zhMap = new Map();
        for (const item of zhStrings) {
            const key = `${item.path}:${item.name}`;
            zhMap.set(key, item.value);
        }

        // 构建英文映射并匹配
        const category = 'tooltip';
        const sourceFile = 'String.wz\\ToolTipHelp.img.xml';

        for (const item of enStrings) {
            const key = `${item.path}:${item.name}`;
            const zhValue = zhMap.get(key);
            const enValue = item.value;

            if (!zhValue || !enValue) continue;

            // 跳过空值
            if (zhValue === 'empty' || enValue === 'empty') continue;

            // 验证条目
            const validation = this.validateEntry(zhValue, enValue, item.name);
            if (!validation.valid) continue;

            // 检查重复
            if (this.isDuplicate(zhValue, enValue)) continue;

            // 标记为已见过
            this.markAsSeen(zhValue, enValue);

            // 创建术语条目，id 设为空字符串
            const entry = new TermEntry(
                zhValue,
                enValue,
                '',  // id 为空
                category,
                item.name,  // fieldType 为 Title/Desc
                sourceFile
            );

            this.entries.push(entry);
            this.stats.addEntry(entry);
        }

        console.log(`提取 ToolTipHelp: ${enStrings.length} 条`);
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

        // 特殊处理 ToolTipHelp.img（嵌套结构）
        console.log('处理文件: String.wz/ToolTipHelp.img.xml');
        this.extractToolTipHelp();

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