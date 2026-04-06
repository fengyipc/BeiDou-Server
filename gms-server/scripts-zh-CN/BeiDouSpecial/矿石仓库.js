/**
 * 功能：矿石仓库 - 存储矿石/母矿/宝石/水晶等材料
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2026-04-05
 */

var TITLE = "\t\t\t\t\t#e#d矿 石 仓 库#k#n\t\t\t\t\r\n";
var SEP = '#d' + '\r\n'.padStart(28, '——') + '#k';
var STORAGE_KEY = "矿石仓库";

var CATEGORIES = [
    {
        name: "矿石母矿",
        ids: [4010000, 4010001, 4010002, 4010003, 4010004, 4010005, 4010006, 4010007, 4010008]
    },
    {
        name: "矿石",
        ids: [4011000, 4011001, 4011002, 4011003, 4011004, 4011005, 4011006, 4011007, 4011008, 4011009, 4011010]
    },
    {
        name: "宝石母矿",
        ids: [4020000, 4020001, 4020002, 4020003, 4020004, 4020005, 4020006, 4020007, 4020008, 4020009]
    },
    {
        name: "宝石",
        ids: [4021000, 4021001, 4021002, 4021003, 4021004, 4021005, 4021006, 4021007, 4021008, 4021009, 4021010]
    },
    {
        name: "水晶母矿",
        ids: [4004000, 4004001, 4004002, 4004003, 4004004]
    },
    {
        name: "水晶",
        ids: [4005000, 4005001, 4005002, 4005003, 4005004]
    }
];

var ALL_IDS = [];
for (var c = 0; c < CATEGORIES.length; c++) {
    for (var i = 0; i < CATEGORIES[c].ids.length; i++) {
        ALL_IDS.push(CATEGORIES[c].ids[i]);
    }
}

var warehouse = {};
var selectedCatIndex = -1;
var selectedItemId = -1;

function loadWarehouse() {
    var raw = cm.getCharacterExtendValue(STORAGE_KEY);
    if (raw && raw.length > 0 && raw !== "null") {
        try {
            warehouse = JSON.parse(raw);
        } catch (e) {
            warehouse = {};
        }
    } else {
        warehouse = {};
    }
}

function saveWarehouse() {
    var clean = {};
    var keys = Object.keys(warehouse);
    for (var i = 0; i < keys.length; i++) {
        if (warehouse[keys[i]] > 0) {
            clean[keys[i]] = warehouse[keys[i]];
        }
    }
    warehouse = clean;
    cm.saveOrUpdateCharacterExtendValue(STORAGE_KEY, JSON.stringify(warehouse));
}

function getWarehouseTotal() {
    var total = 0;
    var keys = Object.keys(warehouse);
    for (var i = 0; i < keys.length; i++) {
        total += warehouse[keys[i]];
    }
    return total;
}

function formatItem(itemId, qty) {
    return "#v" + itemId + "# #b#z" + itemId + "##k x #r" + qty + "#k";
}

function start() {
    loadWarehouse();
    levelStart();
}

function levelnull() {
    cm.dispose();
}

function levelStart() {
    var text = TITLE;
    text += SEP;
    text += "仓库中共存储了 #r" + getWarehouseTotal() + "#k 个矿石材料\r\n\r\n";
    text += "#L0##b一键存入所有矿石#k#l\r\n\r\n";
    text += "#L1##b一键取出所有矿石#k#l\r\n\r\n";
    text += SEP;
    text += "#L2##d按分类存入矿石#k#l\t\t#L3##d按分类取出矿石#k#l\r\n\r\n";
    text += SEP;
    text += "#L4##e查看仓库#n#l\r\n";
    cm.sendSelectLevel(text);
}

// ==================== 一键存入 ====================
function level0() {
    var deposited = [];
    for (var i = 0; i < ALL_IDS.length; i++) {
        var id = ALL_IDS[i];
        var qty = cm.getItemQuantity(id);
        if (qty > 0) {
            cm.gainItem(id, -qty);
            warehouse["" + id] = (warehouse["" + id] || 0) + qty;
            deposited.push({ id: id, qty: qty });
        }
    }

    if (deposited.length === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "你的背包中没有任何矿石材料可以存入。");
        return;
    }

    saveWarehouse();
    var text = TITLE + SEP;
    text += "#e成功存入以下矿石：#n\r\n\r\n";
    for (var i = 0; i < deposited.length; i++) {
        text += formatItem(deposited[i].id, deposited[i].qty) + "\r\n";
    }
    text += "\r\n仓库共存储 #r" + getWarehouseTotal() + "#k 个矿石材料";
    cm.sendOkLevel("Start", text);
}

// ==================== 一键取出 ====================
function level1() {
    var keys = Object.keys(warehouse);
    var items = [];
    for (var i = 0; i < keys.length; i++) {
        if (warehouse[keys[i]] > 0) {
            items.push({ id: parseInt(keys[i]), qty: warehouse[keys[i]] });
        }
    }

    if (items.length === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "仓库中没有任何矿石材料可以取出。");
        return;
    }

    var failed = [];
    var withdrawn = [];
    for (var i = 0; i < items.length; i++) {
        if (cm.canHold(items[i].id)) {
            cm.gainItem(items[i].id, items[i].qty);
            delete warehouse["" + items[i].id];
            withdrawn.push(items[i]);
        } else {
            failed.push(items[i]);
        }
    }

    saveWarehouse();
    var text = TITLE + SEP;
    if (withdrawn.length > 0) {
        text += "#e成功取出以下矿石：#n\r\n\r\n";
        for (var i = 0; i < withdrawn.length; i++) {
            text += formatItem(withdrawn[i].id, withdrawn[i].qty) + "\r\n";
        }
    }
    if (failed.length > 0) {
        text += "\r\n#r背包空间不足，以下矿石未能取出：#k\r\n\r\n";
        for (var i = 0; i < failed.length; i++) {
            text += formatItem(failed[i].id, failed[i].qty) + "\r\n";
        }
    }
    cm.sendOkLevel("Start", text);
}

// ==================== 按分类存入 - 选择分类 ====================
function level2() {
    var text = TITLE + SEP;
    text += "#e请选择要存入的矿石分类：#n\r\n\r\n";
    for (var i = 0; i < CATEGORIES.length; i++) {
        text += "#L" + i + "##b" + CATEGORIES[i].name + "#k#l\r\n\r\n";
    }
    cm.sendNextSelectLevel("DepositCat", text);
}

function levelDepositCat(sel) {
    selectedCatIndex = sel;
    var cat = CATEGORIES[selectedCatIndex];
    var items = [];
    for (var i = 0; i < cat.ids.length; i++) {
        var qty = cm.getItemQuantity(cat.ids[i]);
        if (qty > 0) {
            items.push({ id: cat.ids[i], qty: qty });
        }
    }

    if (items.length === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "你的背包中没有【" + cat.name + "】类矿石。");
        return;
    }

    var text = TITLE + SEP;
    text += "#e【" + cat.name + "】- 背包中的矿石：#n\r\n\r\n";
    text += "#L" + 99999 + "##r一键存入本类所有矿石#k#l\r\n\r\n";
    text += SEP;
    for (var i = 0; i < items.length; i++) {
        text += "#L" + items[i].id + "#" + formatItem(items[i].id, items[i].qty) + "#l\r\n\r\n";
    }
    text += "\r\n点击矿石可选择存入数量";
    cm.sendNextSelectLevel("DepositChoose", text);
}

function levelDepositChoose(sel) {
    if (sel === 99999) {
        var cat = CATEGORIES[selectedCatIndex];
        var deposited = [];
        for (var i = 0; i < cat.ids.length; i++) {
            var qty = cm.getItemQuantity(cat.ids[i]);
            if (qty > 0) {
                cm.gainItem(cat.ids[i], -qty);
                warehouse["" + cat.ids[i]] = (warehouse["" + cat.ids[i]] || 0) + qty;
                deposited.push({ id: cat.ids[i], qty: qty });
            }
        }
        saveWarehouse();
        var text = TITLE + SEP;
        text += "#e成功存入【" + cat.name + "】：#n\r\n\r\n";
        for (var i = 0; i < deposited.length; i++) {
            text += formatItem(deposited[i].id, deposited[i].qty) + "\r\n";
        }
        cm.sendOkLevel("Start", text);
        return;
    }

    selectedItemId = sel;
    var qty = cm.getItemQuantity(selectedItemId);
    if (qty <= 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "你的背包中已没有该矿石。");
        return;
    }
    var text = formatItem(selectedItemId, qty) + "\r\n\r\n";
    text += "请输入要存入的数量：";
    cm.getInputNumberLevel("DepositNum", text, qty, 1, qty);
}

function levelDepositNum(num) {
    var qty = cm.getItemQuantity(selectedItemId);
    if (qty < num) {
        cm.sendOkLevel("Start", TITLE + SEP + "背包中该矿石数量不足。");
        return;
    }
    cm.gainItem(selectedItemId, -num);
    warehouse["" + selectedItemId] = (warehouse["" + selectedItemId] || 0) + num;
    saveWarehouse();

    var text = TITLE + SEP;
    text += "#e成功存入：#n\r\n\r\n";
    text += formatItem(selectedItemId, num) + "\r\n\r\n";
    text += "仓库中该矿石共 #r" + warehouse["" + selectedItemId] + "#k 个";
    cm.sendOkLevel("Start", text);
}

// ==================== 按分类取出 - 选择分类 ====================
function level3() {
    var text = TITLE + SEP;
    text += "#e请选择要取出的矿石分类：#n\r\n\r\n";
    for (var i = 0; i < CATEGORIES.length; i++) {
        var catTotal = 0;
        for (var j = 0; j < CATEGORIES[i].ids.length; j++) {
            catTotal += (warehouse["" + CATEGORIES[i].ids[j]] || 0);
        }
        var label = CATEGORIES[i].name + (catTotal > 0 ? "  #r(" + catTotal + ")#k" : "  #k(空)");
        text += "#L" + i + "##b" + label + "#k#l\r\n\r\n";
    }
    cm.sendNextSelectLevel("WithdrawCat", text);
}

function levelWithdrawCat(sel) {
    selectedCatIndex = sel;
    var cat = CATEGORIES[selectedCatIndex];
    var items = [];
    for (var i = 0; i < cat.ids.length; i++) {
        var stored = warehouse["" + cat.ids[i]] || 0;
        if (stored > 0) {
            items.push({ id: cat.ids[i], qty: stored });
        }
    }

    if (items.length === 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "仓库中没有【" + cat.name + "】类矿石。");
        return;
    }

    var text = TITLE + SEP;
    text += "#e【" + cat.name + "】- 仓库中的矿石：#n\r\n\r\n";
    text += "#L" + 99999 + "##r一键取出本类所有矿石#k#l\r\n\r\n";
    text += SEP;
    for (var i = 0; i < items.length; i++) {
        text += "#L" + items[i].id + "#" + formatItem(items[i].id, items[i].qty) + "#l\r\n\r\n";
    }
    text += "\r\n点击矿石可选择取出数量";
    cm.sendNextSelectLevel("WithdrawChoose", text);
}

function levelWithdrawChoose(sel) {
    if (sel === 99999) {
        var cat = CATEGORIES[selectedCatIndex];
        var withdrawn = [];
        var failed = [];
        for (var i = 0; i < cat.ids.length; i++) {
            var stored = warehouse["" + cat.ids[i]] || 0;
            if (stored > 0) {
                if (cm.canHold(cat.ids[i])) {
                    cm.gainItem(cat.ids[i], stored);
                    delete warehouse["" + cat.ids[i]];
                    withdrawn.push({ id: cat.ids[i], qty: stored });
                } else {
                    failed.push({ id: cat.ids[i], qty: stored });
                }
            }
        }
        saveWarehouse();
        var text = TITLE + SEP;
        if (withdrawn.length > 0) {
            text += "#e成功取出【" + cat.name + "】：#n\r\n\r\n";
            for (var i = 0; i < withdrawn.length; i++) {
                text += formatItem(withdrawn[i].id, withdrawn[i].qty) + "\r\n";
            }
        }
        if (failed.length > 0) {
            text += "\r\n#r背包空间不足，以下矿石未能取出：#k\r\n\r\n";
            for (var i = 0; i < failed.length; i++) {
                text += formatItem(failed[i].id, failed[i].qty) + "\r\n";
            }
        }
        cm.sendOkLevel("Start", text);
        return;
    }

    selectedItemId = sel;
    var stored = warehouse["" + selectedItemId] || 0;
    if (stored <= 0) {
        cm.sendOkLevel("Start", TITLE + SEP + "仓库中已没有该矿石。");
        return;
    }
    var text = formatItem(selectedItemId, stored) + "\r\n\r\n";
    text += "请输入要取出的数量：";
    cm.getInputNumberLevel("WithdrawNum", text, stored, 1, stored);
}

function levelWithdrawNum(num) {
    var stored = warehouse["" + selectedItemId] || 0;
    if (stored < num) {
        cm.sendOkLevel("Start", TITLE + SEP + "仓库中该矿石数量不足。");
        return;
    }
    if (!cm.canHold(selectedItemId)) {
        cm.sendOkLevel("Start", TITLE + SEP + "#r背包空间不足，无法取出。#k");
        return;
    }
    cm.gainItem(selectedItemId, num);
    warehouse["" + selectedItemId] = stored - num;
    if (warehouse["" + selectedItemId] <= 0) {
        delete warehouse["" + selectedItemId];
    }
    saveWarehouse();

    var text = TITLE + SEP;
    text += "#e成功取出：#n\r\n\r\n";
    text += formatItem(selectedItemId, num) + "\r\n\r\n";
    var remain = warehouse["" + selectedItemId] || 0;
    text += "仓库中该矿石剩余 #r" + remain + "#k 个";
    cm.sendOkLevel("Start", text);
}

// ==================== 查看仓库 ====================
function level4() {
    var text = TITLE + SEP;
    var totalItems = getWarehouseTotal();

    if (totalItems === 0) {
        text += "仓库中暂无任何矿石材料。\r\n\r\n";
        text += "快去挖矿收集矿石存入仓库吧！";
        cm.sendOkLevel("Start", text);
        return;
    }

    text += "仓库总计：#r" + totalItems + "#k 个矿石材料\r\n\r\n";

    for (var c = 0; c < CATEGORIES.length; c++) {
        var cat = CATEGORIES[c];
        var catItems = [];
        for (var i = 0; i < cat.ids.length; i++) {
            var stored = warehouse["" + cat.ids[i]] || 0;
            if (stored > 0) {
                catItems.push({ id: cat.ids[i], qty: stored });
            }
        }
        if (catItems.length > 0) {
            text += "#e#d【" + cat.name + "】#k#n\r\n";
            for (var i = 0; i < catItems.length; i++) {
                text += "  " + formatItem(catItems[i].id, catItems[i].qty) + "\r\n";
            }
            text += "\r\n";
        }
    }
    cm.sendOkLevel("Start", text);
}
