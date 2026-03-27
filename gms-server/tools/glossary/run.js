/**
 * WZ 翻译术语表提取工具 - 入口脚本
 *
 * 用法: node run.js
 *
 * 从 wz-zh-CN 和 wz 目录中提取中英文对照术语
 */
const path = require('path');

// 项目根目录
const PROJECT_ROOT = path.resolve(__dirname, '../..');
const wzZhRoot = path.join(PROJECT_ROOT, 'wz-zh-CN');
const wzEnRoot = path.join(PROJECT_ROOT, 'wz');
const outputDir = path.join(PROJECT_ROOT, 'glossary');

const { GlossaryExtractor } = require('./extractor');
const { GlossaryOutput } = require('./output');

/**
 * 主函数
 */
function main() {
    console.log('===========================================');
    console.log('  WZ 翻译术语表提取工具');
    console.log('===========================================\n');

    console.log('配置信息:');
    console.log(`  中文WZ目录: ${wzZhRoot}`);
    console.log(`  英文WZ目录: ${wzEnRoot}`);
    console.log(`  输出目录: ${outputDir}\n`);

    // 创建提取器
    const extractor = new GlossaryExtractor(wzZhRoot, wzEnRoot);

    // 执行提取
    const entries = extractor.extract();

    // 获取统计信息
    const stats = extractor.getStats();

    // 获取按分类分组的条目
    const entriesByCategory = extractor.getEntriesByCategory();

    // 创建输出器
    const output = new GlossaryOutput(outputDir);

    // 输出所有格式
    output.outputAll(entries, stats, entriesByCategory);

    console.log('提取完成!');
}

// 执行主函数
main();