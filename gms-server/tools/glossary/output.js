/**
 * 术语表输出格式化工具
 * 支持 JSON、CSV 等格式输出
 */
const fs = require('fs');
const path = require('path');

/**
 * 术语表输出器类
 */
class GlossaryOutput {
    constructor(outputDir) {
        this.outputDir = outputDir;
        this.ensureOutputDir();
    }

    /**
     * 确保输出目录存在
     */
    ensureOutputDir() {
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
        }
    }

    /**
     * 输出为 JSON 文件（按分类分开的）
     * @param {Object} entriesByCategory - 按分类分组的条目
     * @param {string} suffix - 文件后缀
     */
    outputJsonByCategory(entriesByCategory) {
        for (const [category, entries] of Object.entries(entriesByCategory)) {
            const filePath = path.join(this.outputDir, `${category}.json`);
            const data = {
                category,
                count: entries.length,
                entries: entries
            };
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`输出: ${filePath} (${entries.length} 条)`);
        }
    }

    /**
     * 输出为合并的 JSON 文件
     * @param {Array} entries - 所有条目
     * @param {string} fileName - 文件名
     */
    outputMergedJson(entries, fileName = 'glossary.json') {
        const filePath = path.join(this.outputDir, fileName);
        const data = {
            totalCount: entries.length,
            entries: entries.map(e => e.toJSON ? e.toJSON() : e)
        };
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`输出: ${filePath} (${entries.length} 条)`);
        return filePath;
    }

    /**
     * 输出为 CSV 文件
     * @param {Array} entries - 条目数组
     * @param {string} fileName - 文件名
     */
    outputCsv(entries, fileName = 'glossary.csv') {
        const filePath = path.join(this.outputDir, fileName);
        const headers = ['ID', '中文', '英文', '分类', '字段类型', '来源文件'];

        let csv = headers.join(',') + '\n';

        for (const entry of entries) {
            const e = entry.toJSON ? entry.toJSON() : entry;
            const row = [
                e.id || '',
                this.escapeCsv(e.zh || ''),
                this.escapeCsv(e.en || ''),
                e.category || '',
                e.fieldType || '',
                this.escapeCsv(e.source || '')
            ];
            csv += row.join(',') + '\n';
        }

        fs.writeFileSync(filePath, '\ufeff' + csv, 'utf-8'); // BOM for Excel
        console.log(`输出: ${filePath} (${entries.length} 条)`);
        return filePath;
    }

    /**
     * 转义 CSV 特殊字符
     * @param {string} value - 值
     */
    escapeCsv(value) {
        if (!value) return '';
        // 如果包含逗号、引号或换行，需要用引号包裹
        if (value.includes(',') || value.includes('"') || value.includes('\n')) {
            return '"' + value.replace(/"/g, '""') + '"';
        }
        return value;
    }

    /**
     * 输出统计报告
     * @param {GlossaryStats} stats - 统计信息
     * @param {string} fileName - 文件名
     */
    outputStats(stats, fileName = 'stats.json') {
        const filePath = path.join(this.outputDir, fileName);
        const data = stats.toJSON ? stats.toJSON() : stats;
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
        console.log(`输出: ${filePath}`);
        return filePath;
    }

    /**
     * 输出摘要报告到控制台
     * @param {GlossaryStats} stats - 统计信息
     */
    printSummary(stats) {
        console.log('\n========== 术语表提取摘要 ==========');
        console.log(`总条目数: ${stats.totalEntries}`);

        console.log('\n按分类统计:');
        for (const [category, count] of Object.entries(stats.categoryStats)) {
            console.log(`  ${category}: ${count}`);
        }

        console.log('\n按字段类型统计:');
        for (const [fieldType, count] of Object.entries(stats.fieldTypeStats)) {
            console.log(`  ${fieldType}: ${count}`);
        }

        console.log('\n===================================\n');
    }

    /**
     * 输出所有格式
     * @param {Array} entries - 条目数组
     * @param {GlossaryStats} stats - 统计信息
     * @param {Object} entriesByCategory - 按分类分组的条目
     */
    outputAll(entries, stats, entriesByCategory) {
        // 输出合并的 JSON
        this.outputMergedJson(entries);

        // 输出 CSV
        this.outputCsv(entries);

        // 输出分类的 JSON
        this.outputJsonByCategory(entriesByCategory);

        // 输出统计
        this.outputStats(stats);

        // 打印摘要
        this.printSummary(stats);
    }
}

module.exports = {
    GlossaryOutput
};