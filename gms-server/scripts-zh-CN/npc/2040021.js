/*
	This file is part of the OdinMS Maple Story Server
    Copyright (C) 2008 Patrick Huy <patrick.huy@frz.cc>
		       Matthias Butz <matze@odinms.de>
		       Jan Christian Meyer <vimes@odinms.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation version 3 as published by
    the Free Software Foundation. You may not use, modify or distribute
    this program under any other version of the GNU Affero General Public
    License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* Tara
	Ludibrium : Tara and Sarah's House (220000303)
	
	Refining NPC: 
	* Shoes - All classes, 30-50, stimulator (4130001) available on upgrades
	* Price is 90% of locations on same items
*/

var status = 0;
var selectedType = -1;
var selectedItem = -1;
var item;
var mats;
var matQty;
var cost;
var stimulator = false;
var stimID = 4130001;

function start() {
    cm.getPlayer().setCS(true);
    var selStr = "你好，欢迎来到玩具城鞋店。今天我能为你做些什么？#b"
    var options = ["什么是促进剂？", "制作战士鞋子", "制作弓箭手鞋子", "制作魔法师鞋子", "制作飞侠鞋子", "使用促进剂制作战士鞋子", "使用促进剂制作弓箭手鞋子", "使用促进剂制作魔法师鞋子", "使用促进剂制作飞侠鞋子"];
    for (var i = 0; i < options.length; i++) {
        selStr += "\r\n#L" + i + "# " + options[i] + "#l";
    }
    cm.sendSimple(selStr);
}

function action(mode, type, selection) {
    if (mode < 1) {
        cm.dispose();
        return;
    }
    status++;
    if (status == 1) {
        selectedType = selection;
        var selStr;
        var shoes;
        var itemSet;
        if (selectedType > 4) {
            stimulator = true;
            selectedType -= 4;
        } else {
            stimulator = false;
        }
        if (selectedType == 0) { // 什么是促进剂
            cm.sendNext("促进剂是一种特殊药剂，我可以在制作某些物品的过程中加入它。它能让物品拥有类似怪物掉落物品的属性。不过，也有可能没有任何变化，甚至物品属性低于平均水平。使用促进剂还有10%的几率得不到任何物品，所以请谨慎选择。")
            cm.dispose();
        } else if (selectedType == 1) { // 战士鞋子
            selStr = "战士鞋子？没问题，要哪种呢#b";
            itemSet = [1072003, 1072039, 1072040, 1072041, 1072002, 1072112, 1072113, 1072000, 1072126, 1072127, 1072132, 1072133, 1072134, 1072135];
            shoes = [" - 战士 30 级#b", " - 战士 30 级#b", " - 战士 30 级#b", " - 战士 30 级#b", " - 战士 35 级#b", " - 战士 35 级#b", " - 战士 35 级#b", " - 战士 40 级#b", " - 战士 40 级#b", " - 战士 40 级#b", " - 战士 50 级#b", " - 战士 50 级#b", " - 战士 50 级#b", " - 战士 50 级#b"];
        } else if (selectedType == 2) { // 弓箭手鞋子
            selStr = "弓箭手鞋子？没问题，要哪种呢？#b";
            itemSet = [1072079, 1072080, 1072081, 1072082, 1072083, 1072101, 1072102, 1072103, 1072118, 1072119, 1072120, 1072121, 1072122, 1072123, 1072124, 1072125];
            shoes = [" - 弓箭手 30 级#b", " - 弓箭手 30 级#b", " - 弓箭手 30 级#b", " - 弓箭手 30 级#b", " - 弓箭手 30 级#b", " - 弓箭手 35 级#b", " - 弓箭手 35 级#b", " - 弓箭手 35 级#b", " - 弓箭手 40 级#b", " - 弓箭手 40 级#b", " - 弓箭手 40 级#b", " - 弓箭手 40 级#b", " - 弓箭手 50 级#b", " - 弓箭手 50 级#b", " - 弓箭手 50 级#b", " - 弓箭手 50 级#b"];
        } else if (selectedType == 3) { // 魔法师鞋子
            selStr = "魔法师鞋子？没问题，要哪种呢？#b";
            itemSet = [1072075, 1072076, 1072077, 1072078, 1072089, 1072090, 1072091, 1072114, 1072115, 1072116, 1072117, 1072140, 1072141, 1072142, 1072143, 1072136, 1072137, 1072138, 1072139];
            shoes = [" - 魔法师 30 级#b", " - 魔法师 30 级#b", " - 魔法师 30 级#b", " - 魔法师 30 级#b", " - 魔法师 35 级#b", " - 魔法师 35 级#b", " - 魔法师 35 级#b", " - 魔法师 40 级#b", " - 魔法师 40 级#b", " - 魔法师 40 级#b", " - 魔法师 40 级#b", " - 魔法师 50 级#b", " - 魔法师 50 级#b", " - 魔法师 50 级#b", " - 魔法师 50 级#b"];
        } else if (selectedType == 4) { // 飞侠鞋子
            selStr = "飞侠鞋子？没问题，要哪种呢？#b";
            itemSet = [1072032, 1072033, 1072035, 1072036, 1072104, 1072105, 1072106, 1072107, 1072108, 1072109, 1072110, 1072128, 1072130, 1072129, 1072131];
            shoes = [" - 飞侠 30 级#b", " - 飞侠 30 级#b", " - 飞侠 30 级#b", " - 飞侠 30 级#b", " - 飞侠 35 级#b", " - 飞侠 35 级#b", " - 飞侠 35 级#b", " - 飞侠 40 级#b", " - 飞侠 40 级#b", " - 飞侠 40 级#b", " - 飞侠 40 级#b", " - 飞侠 50 级#b", " - 飞侠 50 级#b", " - 飞侠 50 级#b", " - 飞侠 50 级#b"];
        }
        if (selectedType != 0) {
            for (var i = 0; i < shoes.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + shoes[i] + "#l";
            }
            cm.sendSimple(selStr);
        }
    } else if (status == 2) {
        selectedItem = selection;
        if (selectedType == 1) { // 战士鞋子
            var itemSet = [1072003, 1072039, 1072040, 1072041, 1072002, 1072112, 1072113, 1072000, 1072126, 1072127, 1072132, 1072133, 1072134, 1072135];
            var matSet = [[4021003, 4011001, 4000021, 4003000], [4011002, 4011001, 4000021, 4003000],
                [4011004, 4011001, 4000021, 4003000], [4021000, 4011001, 4000021, 4003000], [4011001, 4021004, 4000021, 4000030, 4003000], [4011002, 4021004, 4000021, 4000030, 4003000], [4021008, 4021004, 4000021, 4000030, 4003000],
                [4011003, 4000021, 4000030, 4003000, 4000103], [4011005, 4021007, 4000030, 4003000, 4000104], [4011002, 4021007, 4000030, 4003000, 4000105], [4021008, 4011001, 4021003, 4000030, 4003000],
                [4021008, 4011001, 4011002, 4000030, 4003000], [4021008, 4011001, 4011005, 4000030, 4003000], [4021008, 4011001, 4011006, 4000030, 4003000]];
            var matQtySet = [[4, 2, 45, 15], [4, 2, 45, 15], [4, 2, 45, 15], [4, 2, 45, 15], [3, 1, 30, 20, 25], [3, 1, 30, 20, 25], [2, 1, 30, 20, 25],
                [4, 100, 40, 30, 100], [4, 1, 40, 30, 100], [4, 1, 40, 30, 100], [1, 3, 6, 65, 45], [1, 3, 6, 65, 45], [1, 3, 6, 65, 45], [1, 3, 6, 65, 45]];
            var costSet = [20000, 20000, 20000, 20000, 22000, 22000, 25000, 38000, 38000, 38000, 50000, 50000, 50000, 50000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 2) { // 弓箭手鞋子
            var itemSet = [1072079, 1072080, 1072081, 1072082, 1072083, 1072101, 1072102, 1072103, 1072118, 1072119, 1072120, 1072121, 1072122, 1072123, 1072124, 1072125];
            var matSet = [[4000021, 4021000, 4003000], [4000021, 4021005, 4003000], [4000021, 4021003, 4003000],
                [4000021, 4021004, 4003000], [4000021, 4021006, 4003000], [4021002, 4021006, 4000030, 4000021, 4003000], [4021003, 4021006, 4000030, 4000021, 4003000], [4021000, 4021006, 4000030, 4000021, 4003000],
                [4021000, 4003000, 4000030, 4000106], [4021006, 4003000, 4000030, 4000107], [4011003, 4003000, 4000030, 4000108], [4021002, 4003000, 4000030, 4000099], [4011001, 4021006, 4021008, 4000030, 4003000, 4000033],
                [4011001, 4021006, 4021008, 4000030, 4003000, 4000032], [4011001, 4021006, 4021008, 4000030, 4003000, 4000041], [4011001, 4021006, 4021008, 4000030, 4003000, 4000042]];
            var matQtySet = [[50, 2, 15], [50, 2, 15], [50, 2, 15], [50, 2, 15], [50, 2, 15],
                [3, 1, 15, 30, 20], [3, 1, 15, 30, 20], [3, 1, 15, 30, 20], [4, 30, 45, 100], [4, 30, 45, 100], [5, 30, 45, 100], [5, 30, 45, 100],
                [3, 3, 1, 60, 35, 80], [3, 3, 1, 60, 35, 150], [3, 3, 1, 60, 35, 100], [3, 3, 1, 60, 35, 250]];
            var costSet = [19000, 19000, 19000, 19000, 19000, 19000, 20000, 20000, 20000, 32000, 32000, 40000, 40000, 50000, 50000, 50000, 50000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 3) { // 魔法师鞋子
            var itemSet = [1072075, 1072076, 1072077, 1072078, 1072089, 1072090, 1072091, 1072114, 1072115, 1072116, 1072117, 1072140, 1072141, 1072142, 1072143, 1072136, 1072137, 1072138, 1072139];
            var matSet = [[4021000, 4000021, 4003000], [4021002, 4000021, 4003000], [4011004, 4000021, 4003000], [4021008, 4000021, 4003000], [4021001, 4021006, 4000021, 4000030, 4003000], [4021000, 4021006, 4000021, 4000030, 4003000],
                [4021008, 4021006, 4000021, 4000030, 4003000], [4021000, 4000030, 4000110, 4003000], [4021005, 4000030, 4000111, 4003000], [4011006, 4021007, 4000030, 4000100, 4003000], [4021008, 4021007, 4000030, 4000112, 4003000],
                [4021009, 4011006, 4021000, 4000030, 4003000], [4021009, 4011006, 4021005, 4000030, 4003000], [4021009, 4011006, 4021001, 4000030, 4003000], [4021009, 4011006, 4021003, 4000030, 4003000]];
            var matQtySet = [[2, 50, 15], [2, 50, 15], [2, 50, 15], [1, 50, 15], [3, 1, 30, 15, 20], [3, 1, 30, 15, 20], [2, 1, 40, 25, 20], [4, 40, 100, 25], [4, 40, 100, 25], [2, 1, 40, 100, 25], [2, 1, 40, 100, 30],
                [1, 3, 3, 60, 40], [1, 3, 3, 60, 40], [1, 3, 3, 60, 40], [1, 3, 3, 60, 40]];
            var costSet = [18000, 18000, 18000, 18000, 20000, 20000, 22000, 30000, 30000, 35000, 40000, 50000, 50000, 50000, 50000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 4) { // 飞侠鞋子
            var itemSet = [1072032, 1072033, 1072035, 1072036, 1072104, 1072105, 1072106, 1072107, 1072108, 1072109, 1072110, 1072128, 1072130, 1072129, 1072131];
            var matSet = [[4011000, 4000021, 4003000], [4011001, 4000021, 4003000], [4011004, 4000021, 4003000], [4011006, 4000021, 4003000], [4021000, 4021004, 4000021, 4000030, 4003000], [4021003, 4021004, 4000021, 4000030, 4003000],
                [4021002, 4021004, 4000021, 4000030, 4003000], [4021000, 4000030, 4000113, 4003000], [4021003, 4000030, 4000095, 4003000], [4021006, 4000030, 4000096, 4003000], [4021005, 4000030, 4000097, 4003000], [4011007, 4021005, 4000030, 4000114, 4003000],
                [4011007, 4021000, 4000030, 4000115, 4003000], [4011007, 4021003, 4000030, 4000109, 4003000], [4011007, 4021001, 4000030, 4000036, 4003000]];
            var matQtySet = [[3, 50, 15], [3, 50, 15], [2, 50, 15], [2, 50, 15], [3, 1, 30, 15, 20], [3, 1, 30, 15, 20], [3, 1, 30, 15, 20],
                [5, 45, 100, 30], [4, 45, 100, 30], [4, 45, 100, 30], [4, 45, 100, 30], [2, 3, 50, 100, 35], [2, 3, 50, 100, 35], [2, 3, 50, 100, 35], [2, 3, 50, 80, 35]];
            var costSet = [19000, 19000, 19000, 21000, 20000, 20000, 20000, 40000, 32000, 35000, 35000, 50000, 50000, 50000, 50000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        }
        // 玩具城费用减免 10%，与 2040016 和 2040020 不同，数组未改变
        cost *= 0.9;
        var prompt = "你想让我制作一个 #t" + item + "#？那样的话，我需要你提供特定的物品来制作它。不过，请确保你的背包有足够的空间！#b";
        if (stimulator) {
            prompt += "\r\n#i" + stimID + "# 1 #t" + stimID + "#";
        }
        if (mats instanceof Array) {
            for (var i = 0; i < mats.length; i++) {
                prompt += "\r\n#i" + mats[i] + "# " + matQty[i] + " #t" + mats[i] + "#";
            }
        } else {
            prompt += "\r\n#i" + mats + "# " + matQty + " #t" + mats + "#";
        }
        if (cost > 0) {
            prompt += "\r\n#i4031138# " + cost + " 金币";
        }
        cm.sendYesNo(prompt);
    } else if (status == 3) {
        var complete = true;

        if (!cm.canHold(item, 1)) {
            cm.sendOk("首先检查你的物品栏是否有空位。");
            cm.dispose();
            return;
        } else if (cm.getMeso() < cost) {
            cm.sendOk("抱歉，我们只接受金币。");
            cm.dispose();
            return;
        } else {
            if (mats instanceof Array) {
                for (var i = 0; complete && i < mats.length; i++) {
                    if (!cm.haveItem(mats[i], matQty[i])) {
                        complete = false;
                    }
                }
            } else if (!cm.haveItem(mats, matQty)) {
                complete = false;
            }
        }
        if (stimulator) { // 检查促进剂
            if (!cm.haveItem(stimID)) {
                complete = false;
            }
        }
        if (!complete) {
            cm.sendOk("抱歉，但我必须拥有这些物品才能完成制作。也许下次吧。");
        } else {
            if (mats instanceof Array) {
                for (var i = 0; i < mats.length; i++) {
                    cm.gainItem(mats[i], -matQty[i]);
                }
            } else {
                cm.gainItem(mats, -matQty);
            }
            cm.gainMeso(-cost);
            if (stimulator) { // 检查促进剂
                cm.gainItem(stimID, -1);
                var deleted = Math.floor(Math.random() * 10);
                if (deleted != 0) {
                    cm.gainItem(item, 1, true, true);
                    cm.sendOk("鞋子已经准备好了。小心，它们还很烫。");
                } else {
                    cm.sendOk("哎呀！我想我不小心加了太多的促进剂，嗯，整个东西现在都不能用了……抱歉，但我不能退款。");
                }
            } else {
                cm.gainItem(item, 1);
                cm.sendOk("鞋子已经准备好了。小心，它们还很烫。");
            }
        }
        cm.dispose();
    }
}