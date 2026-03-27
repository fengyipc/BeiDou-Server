/**
 * 术语条目数据模型
 * 用于存储中英文对照的翻译术语
 */
class TermEntry {
    /**
     * @param {string} chinese - 中文术语
     * @param {string} english - 英文术语
     * @param {string} id - 条目ID（怪物/NPC/物品ID等）
     * @param {string} category - 分类（mob/npc/item/skill/map等）
     * @param {string} fieldType - 字段类型（name/desc/func/bookName等）
     * @param {string} sourceFile - 来源文件路径
     */
    constructor(chinese, english, id, category, fieldType, sourceFile) {
        this.chinese = chinese;
        this.english = english;
        this.id = id;
        this.category = category;
        this.fieldType = fieldType;
        this.sourceFile = sourceFile;
    }

    /**
     * 转换为 JSON 对象
     */
    toJSON() {
        return {
            zh: this.chinese,
            en: this.english,
            id: this.id,
            category: this.category,
            fieldType: this.fieldType,
            source: this.sourceFile
        };
    }
}

/**
 * 术语表统计信息
 */
class GlossaryStats {
    constructor() {
        this.totalEntries = 0;
        this.categoryStats = {};
        this.fieldTypeStats = {};
        this.missingTranslations = [];
    }

    addEntry(entry) {
        this.totalEntries++;

        // 统计分类
        if (!this.categoryStats[entry.category]) {
            this.categoryStats[entry.category] = 0;
        }
        this.categoryStats[entry.category]++;

        // 统计字段类型
        if (!this.fieldTypeStats[entry.fieldType]) {
            this.fieldTypeStats[entry.fieldType] = 0;
        }
        this.fieldTypeStats[entry.fieldType]++;

        // 记录缺失翻译的条目
        if (!entry.chinese || entry.chinese === 'empty' || !entry.english || entry.english === 'empty') {
            this.missingTranslations.push(entry);
        }
    }

    toJSON() {
        return {
            totalEntries: this.totalEntries,
            categoryStats: this.categoryStats,
            fieldTypeStats: this.fieldTypeStats,
            missingTranslations: this.missingTranslations.length,
            missingList: this.missingTranslations
        };
    }
}

module.exports = {
    TermEntry,
    GlossaryStats
};