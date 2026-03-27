/**
 * XML 解析工具
 * 使用正则表达式解析 WZ XML 文件（处理大型文件）
 */
const fs = require('fs');
const path = require('path');

/**
 * WZ XML 解析器类
 * 使用正则表达式直接提取字符串节点，适用于大型 XML 文件
 */
class WZParser {
    constructor() {
        // 正则表达式匹配 <string name="xxx" value="yyy"/> 格式
        this.stringPattern = /<string\s+name="([^"]+)"\s+value="([^"]*)"\s*\/>/g;
        // 正则表达式匹配 <imgdir name="xxx"> 格式
        this.imgdirPattern = /<imgdir\s+name="([^"]+)"[^>]*>/g;
    }

    /**
     * 解析 XML 文件
     * @param {string} filePath - XML 文件路径
     * @returns {Object|null} 解析后的对象
     */
    parseFile(filePath) {
        try {
            if (!fs.existsSync(filePath)) {
                console.warn(`文件不存在: ${filePath}`);
                return null;
            }

            const xmlContent = fs.readFileSync(filePath, 'utf-8');
            return this.extractEntries(xmlContent);
        } catch (error) {
            console.error(`解析失败 ${filePath}: ${error.message}`);
            return null;
        }
    }

    /**
     * 从 XML 内容中提取所有字符串条目
     * @param {string} xmlContent - XML 字符串
     * @returns {Map<string, Map<string, string>>} ID -> {字段名 -> 值}
     */
    extractEntries(xmlContent) {
        const entries = new Map();

        // 提取所有 imgdir 块及其内容
        const imgdirMatches = this.matchAll(this.imgdirPattern, xmlContent);

        for (const imgdirMatch of imgdirMatches) {
            const imgdirName = imgdirMatch[1];
            const imgdirStart = imgdirMatch.index;
            const imgdirEnd = this.findClosingTagEnd(xmlContent, imgdirStart, '<imgdir', '</imgdir>');

            if (imgdirEnd === -1) continue;

            const imgdirContent = xmlContent.substring(imgdirStart, imgdirEnd);

            // 在 imgdir 块内提取所有 string 节点
            const stringMatches = this.matchAll(this.stringPattern, imgdirContent);

            if (stringMatches.length > 0) {
                const stringMap = new Map();
                for (const stringMatch of stringMatches) {
                    const name = stringMatch[1];
                    const value = stringMatch[2];
                    stringMap.set(name, value);
                }
                entries.set(imgdirName, stringMap);
            }
        }

        // 处理顶层直接的 string 节点（如 QuestCategory.img 的格式）
        // 格式: <string name="0" value="empty"/>
        const topLevelStrings = this.matchAll(this.stringPattern, xmlContent);
        if (topLevelStrings.length > 0 && entries.size === 0) {
            // 检查是否整个文件只有顶层的 string，没有 imgdir
            const root = new Map();
            for (const match of topLevelStrings) {
                root.set(match[1], match[2]);
            }
            if (root.size > 0) {
                entries.set('root', root);
            }
        }

        return entries;
    }

    /**
     * 查找配对的闭合标签位置
     * @param {string} content - 内容
     * @param {number} start - 起始位置
     * @param {string} openTag - 开始标签名
     * @param {string} closeTag - 闭合标签名
     * @returns {number} 闭合标签结束位置
     */
    findClosingTagEnd(content, start, openTag, closeTag) {
        const openPos = content.indexOf('>', start) + 1;
        let depth = 1;
        let pos = openPos;

        while (depth > 0 && pos < content.length) {
            const nextOpen = content.indexOf(openTag, pos);
            const nextClose = content.indexOf(closeTag, pos);

            if (nextClose === -1) return -1;

            if (nextOpen !== -1 && nextOpen < nextClose) {
                depth++;
                pos = nextOpen + openTag.length;
            } else {
                depth--;
                if (depth === 0) {
                    return nextClose + closeTag.length;
                }
                pos = nextClose + closeTag.length;
            }
        }

        return -1;
    }

    /**
     * 获取所有匹配项
     * @param {RegExp} regex - 正则表达式
     * @param {string} content - 内容
     * @returns {Array} 匹配结果数组
     */
    matchAll(regex, content) {
        const results = [];
        let match;
        // 创建全局正则
        const globalRegex = new RegExp(regex.source, 'g');
        while ((match = globalRegex.exec(content)) !== null) {
            results.push(match);
        }
        return results;
    }

    /**
     * 提取所有字符串字段（兼容旧接口）
     * @param {Object} parsed - 解析后的对象
     * @returns {Map<string, Map<string, string>>} ID -> {字段名 -> 值}
     */
    extractAllStringEntries(parsed) {
        // parsed 在新的实现中已经是提取后的格式
        if (parsed instanceof Map) {
            return parsed;
        }
        return parsed || new Map();
    }

    /**
     * 提取字符串条目（兼容旧接口）
     * @param {Object} parsed - 解析后的对象
     * @returns {Map<string, Map<string, string>>} ID -> {字段名 -> 值}
     */
    extractStringEntries(parsed) {
        return this.extractAllStringEntries(parsed);
    }
}

module.exports = {
    WZParser
};