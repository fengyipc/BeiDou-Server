/**
 * 功能：装备共享 - 同世界玩家间共享装备
 * 版本：1.0
 */

var InventoryType = Java.type('org.gms.client.inventory.InventoryType');
var ItemInformationProvider = Java.type('org.gms.server.ItemInformationProvider');

var TITLE = "\t\t\t\t\t#e#d装 备 共 享#k#n\t\t\t\t\r\n";
var SEP = '#d' + '\r\n'.padStart(28, '——') + '#k';

var JOB_NAMES = {
    0: "全职业", 1: "战士", 2: "魔法师", 4: "弓箭手", 8: "飞侠", 16: "海盗"
};

var shareList = [];
var myShareList = [];
var equipSlots = [];
var selectedSlot = -1;
var selectedShareId = -1;
var selectedDto = null;

var PAGE_SIZE = 10;
var browsePage = 0;
var browseJobFilter = -1;

function start() {
    levelStart();
}

function levelnull() {
    cm.dispose();
}

function levelStart() {
    var text = TITLE;
    text += SEP;
    text += "在这里你可以共享不需要的装备给同世界的其他冒险家，\r\n也可以从其他冒险家共享的装备中取用自己需要的。\r\n\r\n";
    text += "#L0##b提交装备#k#l\t\t#L1##b浏览共享#k#l\r\n\r\n";
    text += "#L2##b我的共享#k#l\t\t#L3##r退出#k#l\r\n";
    cm.sendSelectLevel(text);
}

// ==================== 提交装备 ====================
function level0() {
    var inv = cm.getInventory(1);
    var items = inv.list();
    var iter = items.iterator();
    equipSlots = [];
    var text = TITLE + SEP;
    text += "#e请选择要共享的装备：#n\r\n\r\n";

    var idx = 0;
    while (iter.hasNext()) {
        var item = iter.next();
        var pos = item.getPosition();
        if (pos <= 0) continue;

        var itemId = item.getItemId();
        equipSlots.push(pos);
        var owner = item.getOwner();
        var rareTag = (owner != null && String(owner).indexOf("「稀有」") >= 0) ? " #b[稀有]#k" : "";
        var lvTag = " Lv." + getReqLevel(itemId);
        var scrollTag = (item.getLevel() > 0) ? " #g+" + item.getLevel() + "#k" : "";
        text += "#L" + idx + "##v" + itemId + "#" + rareTag + lvTag + " #z" + itemId + "#" + scrollTag;
        text += buildBriefStats(item);
        text += "#l\r\n";
        idx++;
    }

    if (idx === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "你的装备栏中没有可共享的装备。");
        return;
    }

    cm.sendNextSelectLevel("SubmitConfirm", text);
}

function levelSubmitConfirm(sel) {
    if (sel < 0 || sel >= equipSlots.length) {
        cm.sendOkLevel("Start", TITLE + SEP + "#r无效的选择。#k");
        return;
    }
    selectedSlot = equipSlots[sel];
    var inv = cm.getInventory(1);
    var item = inv.getItem(selectedSlot);
    if (item == null) {
        cm.sendOkLevel("Start", TITLE + SEP + "#r该装备已不存在。#k");
        return;
    }

    var itemId = item.getItemId();
    var text = TITLE + SEP;
    text += "确定要共享以下装备吗？\r\n\r\n";
    text += "#v" + itemId + "# #z" + itemId + "#\r\n";
    text += buildFullStats(item);
    text += "\r\n#r共享后装备将从你的背包中移除，其他玩家可取用。#k\r\n";
    text += "你可以在「我的共享」中随时撤回。";
    cm.sendYesNoLevel("Start", "SubmitDo", text);
}

function levelSubmitDo() {
    var success = cm.submitSharedEquip(selectedSlot);
    if (success) {
        cm.sendOkLevel("Start", TITLE + SEP + "#b装备共享成功！#k\r\n其他冒险家现在可以看到并取用这件装备了。");
    } else {
        cm.sendOkLevel("Start", TITLE + SEP + "#r共享失败！#k\r\n该装备可能不可交易或已不存在。");
    }
}

// ==================== 浏览共享 ====================
function level1() {
    shareList = cm.listSharedEquips();
    if (shareList == null || shareList.size() === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "当前没有任何共享装备。");
        return;
    }

    var jobBuckets = {};
    for (var i = 0; i < shareList.size(); i++) {
        var dto = shareList.get(i);
        var rj = dto.getReqJob() != null ? dto.getReqJob() : 0;
        var key = getJobGroupKey(rj);
        if (!jobBuckets[key]) jobBuckets[key] = 0;
        jobBuckets[key]++;
    }

    var text = TITLE + SEP;
    text += "#e请选择职业分类浏览：#n\r\n\r\n";
    text += "#L-1##b全部装备 (" + shareList.size() + ")#k#l\r\n\r\n";

    var jobKeys = [0, 1, 2, 4, 8, 16];
    for (var j = 0; j < jobKeys.length; j++) {
        var k = jobKeys[j];
        var count = jobBuckets[k] || 0;
        if (count > 0) {
            text += "#L" + k + "##b" + JOB_NAMES[k] + " (" + count + ")#k#l\r\n\r\n";
        }
    }

    var otherCount = 0;
    var keys = Object.keys(jobBuckets);
    for (var i = 0; i < keys.length; i++) {
        var numKey = parseInt(keys[i]);
        if (JOB_NAMES[numKey] === undefined && numKey !== -1) {
            otherCount += jobBuckets[keys[i]];
        }
    }
    if (otherCount > 0) {
        text += "#L999##b多职业 (" + otherCount + ")#k#l\r\n\r\n";
    }

    cm.sendNextSelectLevel("BrowseList", text);
}

function levelBrowseList(sel) {
    browseJobFilter = sel;
    browsePage = 0;
    showBrowsePage();
}

function showBrowsePage() {
    var filtered = [];
    for (var i = 0; i < shareList.size(); i++) {
        var dto = shareList.get(i);
        var rj = dto.getReqJob() != null ? dto.getReqJob() : 0;
        if (browseJobFilter === -1) {
            filtered.push(dto);
        } else if (browseJobFilter === 999) {
            if (JOB_NAMES[getJobGroupKey(rj)] === undefined) {
                filtered.push(dto);
            }
        } else {
            if (getJobGroupKey(rj) === browseJobFilter) {
                filtered.push(dto);
            }
        }
    }

    var total = filtered.length;
    if (total === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "该分类下没有共享装备。");
        return;
    }

    var startIdx = browsePage * PAGE_SIZE;
    var endIdx = Math.min(startIdx + PAGE_SIZE, total);
    var text = TITLE + SEP;
    var filterName = browseJobFilter === -1 ? "全部" : (browseJobFilter === 999 ? "多职业" : (JOB_NAMES[browseJobFilter] || "未知"));
    text += "#e" + filterName + " - 共 " + total + " 件 (第" + (browsePage + 1) + "页)#n\r\n\r\n";

    for (var i = startIdx; i < endIdx; i++) {
        var dto = filtered[i];
        var itemId = dto.getItemId();
        var rareTag = (dto.getIsRare() != null && dto.getIsRare() == 1) ? " #b[稀有]#k" : "";
        var lvTag = " Lv." + getReqLevel(itemId);
        var scrollTag = (val(dto.getLevel()) > 0) ? " #g+" + dto.getLevel() + "#k" : "";
        text += "#L" + i + "##v" + itemId + "#" + rareTag + lvTag + " #z" + itemId + "#" + scrollTag;
        text += buildBriefStatsFromDto(dto);
        text += " #d[" + dto.getSharerName() + "]#k";
        text += "#l\r\n";
    }
    text += "\r\n";

    if (endIdx < total) {
        text += "#L88888##b下一页 >>>#k#l\t";
    }
    if (browsePage > 0) {
        text += "#L88889##b<<< 上一页#k#l\t";
    }
    text += "#L88890##r返回#k#l";

    cm.sendNextSelectLevel("BrowseSelect", text);
}

function levelBrowseSelect(sel) {
    if (sel === 88888) {
        browsePage++;
        showBrowsePage();
        return;
    }
    if (sel === 88889) {
        browsePage--;
        showBrowsePage();
        return;
    }
    if (sel === 88890) {
        levelStart();
        return;
    }

    var filtered = getFilteredList();
    if (sel < 0 || sel >= filtered.length) {
        cm.sendOkLevel("Start", TITLE + SEP + "#r无效的选择。#k");
        return;
    }
    selectedDto = filtered[sel];
    selectedShareId = selectedDto.getId();

    var itemId = selectedDto.getItemId();
    var rareTag = (selectedDto.getIsRare() != null && selectedDto.getIsRare() == 1) ? " #b[稀有]#k" : "";
    var lvTag = " Lv." + getReqLevel(itemId);
    var scrollTag = (val(selectedDto.getLevel()) > 0) ? " #g+" + selectedDto.getLevel() + "#k" : "";
    var text = TITLE + SEP;
    text += "#v" + itemId + "#" + rareTag + lvTag + " #e#z" + itemId + "##n" + scrollTag + "\r\n";
    text += buildFullStatsFromDto(selectedDto);
    text += "\r\n#d分享人: " + selectedDto.getSharerName() + "#k\r\n\r\n";
    text += "是否取用这件装备？";

    cm.sendYesNoLevel("Start", "BrowseTake", text);
}

function levelBrowseTake() {
    var success = cm.takeSharedEquip(selectedShareId);
    if (success) {
        cm.sendOkLevel("Start", TITLE + SEP + "#b成功取用装备！#k\r\n装备已放入你的背包中。");
    } else {
        cm.sendOkLevel("Start", TITLE + SEP + "#r取用失败！#k\r\n该装备可能已被他人取用，或你的背包空间不足。");
    }
}

// ==================== 我的共享 ====================
function level2() {
    myShareList = cm.mySharedEquips();
    if (myShareList == null || myShareList.size() === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "你当前没有共享任何装备。");
        return;
    }

    var text = TITLE + SEP;
    text += "#e你共享的装备 (共 " + myShareList.size() + " 件)：#n\r\n\r\n";

    for (var i = 0; i < myShareList.size(); i++) {
        var dto = myShareList.get(i);
        var itemId = dto.getItemId();
        var rareTag = (dto.getIsRare() != null && dto.getIsRare() == 1) ? " #b[稀有]#k" : "";
        var lvTag = " Lv." + getReqLevel(itemId);
        var scrollTag = (val(dto.getLevel()) > 0) ? " #g+" + dto.getLevel() + "#k" : "";
        text += "#L" + i + "##v" + itemId + "#" + rareTag + lvTag + " #z" + itemId + "#" + scrollTag;
        text += buildBriefStatsFromDto(dto);
        text += "#l\r\n";
    }

    cm.sendNextSelectLevel("MineDetail", text);
}

function levelMineDetail(sel) {
    if (sel < 0 || sel >= myShareList.size()) {
        cm.sendOkLevel("Start", TITLE + SEP + "#r无效的选择。#k");
        return;
    }
    selectedDto = myShareList.get(sel);
    selectedShareId = selectedDto.getId();

    var itemId = selectedDto.getItemId();
    var rareTag = (selectedDto.getIsRare() != null && selectedDto.getIsRare() == 1) ? " #b[稀有]#k" : "";
    var lvTag = " Lv." + getReqLevel(itemId);
    var scrollTag = (val(selectedDto.getLevel()) > 0) ? " #g+" + selectedDto.getLevel() + "#k" : "";
    var text = TITLE + SEP;
    text += "#v" + itemId + "#" + rareTag + lvTag + " #e#z" + itemId + "##n" + scrollTag + "\r\n";
    text += buildFullStatsFromDto(selectedDto);
    text += "\r\n\r\n是否撤回该共享？装备将返还到你的背包中。";

    cm.sendYesNoLevel("Start", "MineRevoke", text);
}

function levelMineRevoke() {
    var success = cm.revokeSharedEquip(selectedShareId);
    if (success) {
        cm.sendOkLevel("Start", TITLE + SEP + "#b撤回成功！#k\r\n装备已返还到你的背包中。");
    } else {
        cm.sendOkLevel("Start", TITLE + SEP + "#r撤回失败！#k\r\n该装备可能已被他人取用，或你的背包空间不足。");
    }
}

// ==================== 退出 ====================
function level3() {
    cm.dispose();
}

// ==================== 工具函数 ====================

function getJobGroupKey(reqJob) {
    if (reqJob === 0) return 0;
    if (reqJob === 1) return 1;
    if (reqJob === 2) return 2;
    if (reqJob === 4) return 4;
    if (reqJob === 8) return 8;
    if (reqJob === 16) return 16;
    if (JOB_NAMES[reqJob] !== undefined) return reqJob;
    return reqJob;
}

function getFilteredList() {
    var filtered = [];
    for (var i = 0; i < shareList.size(); i++) {
        var dto = shareList.get(i);
        var rj = dto.getReqJob() != null ? dto.getReqJob() : 0;
        if (browseJobFilter === -1) {
            filtered.push(dto);
        } else if (browseJobFilter === 999) {
            if (JOB_NAMES[getJobGroupKey(rj)] === undefined) {
                filtered.push(dto);
            }
        } else {
            if (getJobGroupKey(rj) === browseJobFilter) {
                filtered.push(dto);
            }
        }
    }
    return filtered;
}

function buildBriefStats(equip) {
    var parts = [];
    if (equip.getStr() > 0) parts.push("力+" + equip.getStr());
    if (equip.getDex() > 0) parts.push("敏+" + equip.getDex());
    if (equip.getInt() > 0) parts.push("智+" + equip.getInt());
    if (equip.getLuk() > 0) parts.push("运+" + equip.getLuk());
    if (equip.getWatk() > 0) parts.push("攻+" + equip.getWatk());
    if (equip.getMatk() > 0) parts.push("魔攻+" + equip.getMatk());
    if (parts.length === 0) return "";
    return " #r(" + parts.join(" ") + ")#k";
}

function buildBriefStatsFromDto(dto) {
    var parts = [];
    if (val(dto.getStr()) > 0) parts.push("力+" + dto.getStr());
    if (val(dto.getDex()) > 0) parts.push("敏+" + dto.getDex());
    if (val(dto.getInte()) > 0) parts.push("智+" + dto.getInte());
    if (val(dto.getLuk()) > 0) parts.push("运+" + dto.getLuk());
    if (val(dto.getWatk()) > 0) parts.push("攻+" + dto.getWatk());
    if (val(dto.getMatk()) > 0) parts.push("魔攻+" + dto.getMatk());
    if (parts.length === 0) return "";
    return " #r(" + parts.join(" ") + ")#k";
}

function buildFullStats(equip) {
    var text = "────────────────────\r\n";
    text += "可升级次数: " + equip.getUpgradeSlots();
    if (equip.getLevel() > 0) text += "  已升级: " + equip.getLevel();
    text += "\r\n";

    var stats = [];
    if (equip.getStr() > 0) stats.push("力量 +" + equip.getStr());
    if (equip.getDex() > 0) stats.push("敏捷 +" + equip.getDex());
    if (equip.getInt() > 0) stats.push("智力 +" + equip.getInt());
    if (equip.getLuk() > 0) stats.push("运气 +" + equip.getLuk());
    if (equip.getHp() > 0) stats.push("最大HP +" + equip.getHp());
    if (equip.getMp() > 0) stats.push("最大MP +" + equip.getMp());
    if (equip.getWatk() > 0) stats.push("物理攻击 +" + equip.getWatk());
    if (equip.getMatk() > 0) stats.push("魔法攻击 +" + equip.getMatk());
    if (equip.getWdef() > 0) stats.push("物理防御 +" + equip.getWdef());
    if (equip.getMdef() > 0) stats.push("魔法防御 +" + equip.getMdef());
    if (equip.getAcc() > 0) stats.push("命中率 +" + equip.getAcc());
    if (equip.getAvoid() > 0) stats.push("回避率 +" + equip.getAvoid());
    if (equip.getSpeed() > 0) stats.push("移动速度 +" + equip.getSpeed());
    if (equip.getJump() > 0) stats.push("跳跃力 +" + equip.getJump());

    for (var i = 0; i < stats.length; i += 2) {
        text += stats[i];
        if (i + 1 < stats.length) text += "  " + stats[i + 1];
        text += "\r\n";
    }
    text += "────────────────────";
    return text;
}

function buildFullStatsFromDto(dto) {
    var text = "────────────────────\r\n";
    text += "可升级次数: " + val(dto.getUpgradeSlots());
    if (val(dto.getLevel()) > 0) text += "  已升级: " + dto.getLevel();
    text += "\r\n";

    var stats = [];
    if (val(dto.getStr()) > 0) stats.push("力量 +" + dto.getStr());
    if (val(dto.getDex()) > 0) stats.push("敏捷 +" + dto.getDex());
    if (val(dto.getInte()) > 0) stats.push("智力 +" + dto.getInte());
    if (val(dto.getLuk()) > 0) stats.push("运气 +" + dto.getLuk());
    if (val(dto.getHp()) > 0) stats.push("最大HP +" + dto.getHp());
    if (val(dto.getMp()) > 0) stats.push("最大MP +" + dto.getMp());
    if (val(dto.getWatk()) > 0) stats.push("物理攻击 +" + dto.getWatk());
    if (val(dto.getMatk()) > 0) stats.push("魔法攻击 +" + dto.getMatk());
    if (val(dto.getWdef()) > 0) stats.push("物理防御 +" + dto.getWdef());
    if (val(dto.getMdef()) > 0) stats.push("魔法防御 +" + dto.getMdef());
    if (val(dto.getAcc()) > 0) stats.push("命中率 +" + dto.getAcc());
    if (val(dto.getAvoid()) > 0) stats.push("回避率 +" + dto.getAvoid());
    if (val(dto.getSpeed()) > 0) stats.push("移动速度 +" + dto.getSpeed());
    if (val(dto.getJump()) > 0) stats.push("跳跃力 +" + dto.getJump());

    for (var i = 0; i < stats.length; i += 2) {
        text += stats[i];
        if (i + 1 < stats.length) text += "  " + stats[i + 1];
        text += "\r\n";
    }
    text += "────────────────────";
    return text;
}

function val(v) {
    return v != null ? v : 0;
}

function getReqLevel(itemId) {
    var lv = ItemInformationProvider.getInstance().getEquipLevelReq(itemId);
    return lv != null ? lv : 0;
}
