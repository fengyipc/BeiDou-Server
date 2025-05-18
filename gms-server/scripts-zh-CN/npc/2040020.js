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

/* Sarah
	Ludibrium : Tara and Sarah's House (220000303)

	Refining NPC:
	* items - All classes, 30-50, stimulator (4130000) available on upgrades
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
var stimID = 4130000;

function start() {
    cm.getPlayer().setCS(true);

    var selStr = "你好，欢迎来到玩具城手套店。今天有什么可以帮您的吗？#b"
    var options = ["促进剂是什么？", "制作一件战士手套", "制作一件弓箭手手套", "制作一件魔法师手套", "制作一件飞侠手套",
        "使用促进剂制作一件战士手套", "使用促进剂制作一件弓箭手手套", "使用促进剂制作一件魔法师手套", "使用促进剂制作一件飞侠手套"];
    for (var i = 0; i < options.length; i++) {
        selStr += "\r\n#L" + i + "# " + options[i] + "#l";
    }
    cm.sendSimple(selStr);
}

function action(mode, type, selection) {
    if (mode > 0) {
        status++;
    } else {
        cm.dispose();
        return;
    }
    if (status == 1) {
        selectedType = selection;
        if (selectedType > 4) {
            stimulator = true;
        } else {
            stimulator = false;
        }
        if (selectedType == 0) { //促进剂是什么？
            cm.sendNext("促进剂是一种特殊药剂，我可以在制作某些物品的过程中加入它。加入后，物品会获得类似怪物掉落物品的属性。不过，也有可能没有任何变化，甚至物品属性低于平均水平。使用促进剂还有10%的几率得不到任何物品，所以请谨慎选择。")
            cm.dispose();
        } else if (selectedType == 1) { //战士手套
            var selStr = "战士手套？没问题，要哪种呢？#b";
            var itemSet = [1082007, 1082008, 1082023, 1082009];
            var items = [" - 战士30级手套#b", " - 战士35级手套#b", " - 战士40级手套#b", " - 战士50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 2) { //弓箭手手套
            var selStr = "弓箭手手套？没问题，要哪种呢？#b";
            var itemSet = [1082048, 1082068, 1082071, 1082084];
            var items = [" - 弓箭手30级手套#b", " - 弓箭手35级手套#b", " - 弓箭手40级手套#b", " - 弓箭手50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 3) { //魔法师手套
            var selStr = "魔法师手套？没问题，要哪种呢？#b";
            var itemSet = [1082051, 1082054, 1082062, 1082081];
            var items = [" - 魔法师30级手套#b", " - 魔法师35级手套#b", " - 魔法师40级手套#b", " - 魔法师50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 4) { //飞侠手套
            var selStr = "飞侠手套？没问题，要哪种呢？#b";
            var itemSet = [1082042, 1082046, 1082075, 1082065];
            var items = [" - 飞侠30级手套#b", " - 飞侠35级手套#b", " - 飞侠40级手套#b", " - 飞侠50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 5) { //带促进剂的战士手套
            var selStr = "带促进剂的战士手套？没问题，要哪种呢？#b";
            var itemSet = [1082005, 1082006, 1082035, 1082036, 1082024, 1082025, 1082010, 1082011];
            var items = [" - 战士30级手套#b", " - 战士30级手套#b", " - 战士35级手套#b", " - 战士35级手套#b",
                " - 战士40级手套#b", " - 战士40级手套#b", " - 战士50级手套#b", " - 战士50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 6) { //带促进剂的弓箭手手套
            var selStr = "带促进剂的弓箭手手套？没问题，要哪种呢？#b";
            var itemSet = [1082049, 1082050, 1082069, 1082070, 1082072, 1082073, 1082085, 1082083];
            var items = [" - 弓箭手30级手套#b", " - 弓箭手30级手套#b", " - 弓箭手35级手套#b", " - 弓箭手35级手套#b", " - 弓箭手40级手套#b", " - 弓箭手40级手套#b", " - 弓箭手50级手套#b", " - 弓箭手50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 7) { //带促进剂的魔法师手套
            var selStr = "带促进剂的魔法师手套？没问题，要哪种呢？#b";
            var itemSet = [1082052, 1082053, 1082055, 1082056, 1082063, 1082064, 1082082, 1082080];
            var items = [" - 魔法师30级手套#b", " - 魔法师30级手套#b", " - 魔法师35级手套#b", " - 魔法师35级手套#b",
                " - 魔法师40级手套#b", " - 魔法师40级手套#b", " - 魔法师50级手套#b", " - 魔法师50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        } else if (selectedType == 8) { //带促进剂的飞侠手套
            var selStr = "带促进剂的飞侠手套？没问题，要哪种呢？#b";
            var itemSet = [1082043, 1082044, 1082047, 1082045, 1082076, 1082074, 1082067, 1082066];
            var items = [" - 飞侠30级手套#b", " - 飞侠30级手套#b", " - 飞侠35级手套#b", " - 飞侠35级手套#b", " - 飞侠40级手套#b",
                " - 飞侠40级手套#b", " - 飞侠50级手套#b", " - 飞侠50级手套#b"];
            for (var i = 0; i < items.length; i++) {
                selStr += "\r\n#L" + i + "# #z" + itemSet[i] + "#" + items[i] + "#l";
            }
            cm.sendSimple(selStr);
        }
    } else if (status == 2) {
        selectedItem = selection;
        if (selectedType == 1) { //战士手套
            var itemSet = [1082007, 1082008, 1082023, 1082009];
            var matSet = [[4011000, 4011001, 4003000], [4000021, 4011001, 4003000], [4000021, 4011001, 4003000], [4011001, 4021007, 4000030, 4003000]];
            var matQtySet = [[3, 2, 15], [30, 4, 15], [50, 5, 40], [3, 2, 30, 45]];
            var costSet = [18000, 27000, 36000, 45000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 2) { //弓箭手手套
            var itemSet = [1082048, 1082068, 1082071, 1082084];
            var matSet = [[4000021, 4011006, 4021001], [4011000, 4011001, 4000021, 4003000], [4011001, 4021000, 4021002, 4000021, 4003000], [4011004, 4011006, 4021002, 4000030, 4003000]];
            var matQtySet = [[50, 2, 1], [1, 3, 60, 15], [3, 1, 3, 80, 25], [3, 1, 2, 40, 35]];
            var costSet = [18000, 27000, 36000, 45000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 3) { //魔法师手套
            var itemSet = [1082051, 1082054, 1082062, 1082081];
            var matSet = [[4000021, 4021006, 4021000], [4000021, 4011006, 4011001, 4021000], [4000021, 4021000, 4021006, 4003000], [4021000, 4011006, 4000030, 4003000]];
            var matQtySet = [[60, 1, 2], [70, 1, 3, 2], [80, 3, 3, 30], [3, 2, 35, 40]];
            var costSet = [22500, 27000, 36000, 45000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 4) { //飞侠手套
            var itemSet = [1082042, 1082046, 1082075, 1082065];
            var matSet = [[4011001, 4000021, 4003000], [4011001, 4011000, 4000021, 4003000], [4021000, 4000101, 4000021, 4003000], [4021005, 4021008, 4000030, 4003000]];
            var matQtySet = [[2, 50, 10], [3, 1, 60, 15], [3, 100, 80, 30], [3, 1, 40, 30]];
            var costSet = [22500, 27000, 36000, 45000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 5) { //带促进剂的战士手套
            var itemSet = [1082005, 1082006, 1082035, 1082036, 1082024, 1082025, 1082010, 1082011];
            var matSet = [[1082007, 4011001], [1082007, 4011005], [1082008, 4021006], [1082008, 4021008], [1082023, 4011003], [1082023, 4021008],
                [1082009, 4011002], [1082009, 4011006]];
            var matQtySet = [[1, 1], [1, 2], [1, 3], [1, 1], [1, 4], [1, 2], [1, 5], [1, 4]];
            var costSet = [18000, 22500, 27000, 36000, 40500, 45000, 49500, 54000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 6) { //带促进剂的弓箭手手套
            var itemSet = [1082049, 1082050, 1082069, 1082070, 1082072, 1082073, 1082085, 1082083];
            var matSet = [[1082048, 4021003], [1082048, 4021008], [1082068, 4011002], [1082068, 4011006], [1082071, 4011006], [1082071, 4021008], [1082084, 4011000, 4021000], [1082084, 4011006, 4021008]];
            var matQtySet = [[1, 3], [1, 1], [1, 4], [1, 2], [1, 4], [1, 2], [1, 1, 5], [1, 2, 2]];
            var costSet = [13500, 18000, 19800, 22500, 27000, 36000, 49500, 54000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 7) { //带促进剂的魔法师手套
            var itemSet = [1082052, 1082053, 1082055, 1082056, 1082063, 1082064, 1082082, 1082080];
            var matSet = [[1082051, 4021005], [1082051, 4021008], [1082054, 4021005], [1082054, 4021008], [1082062, 4021002], [1082062, 4021008],
                [1082081, 4021002], [1082081, 4021008]];
            var matQtySet = [[1, 3], [1, 1], [1, 3], [1, 1], [1, 4], [1, 2], [1, 5], [1, 3]];
            var costSet = [31500, 36000, 36000, 40500, 40500, 45000, 49500, 54000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        } else if (selectedType == 8) { //带促进剂的飞侠手套
            var itemSet = [1082043, 1082044, 1082047, 1082045, 1082076, 1082074, 1082067, 1082066];
            var matSet = [[1082042, 4011004], [1082042, 4011006], [1082046, 4011005], [1082046, 4011006], [1082075, 4011006], [1082075, 4021008], [1082065, 4021000], [1082065, 4011006, 4021008]];
            var matQtySet = [[1, 2], [1, 1], [1, 3], [1, 2], [1, 4], [1, 2], [1, 5], [1, 2, 1]];
            var costSet = [13500, 18000, 19800, 22500, 36000, 45000, 49500, 54000];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            cost = costSet[selectedItem];
        }
        var prompt = "你想让我制作一个 #t" + item + "# 吗？那样的话，我需要你提供特定的物品来制作它。不过，请确保你的背包有足够的空间！#b";
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
        if (stimulator) { //检查促进剂
            if (!cm.haveItem(stimID)) {
                complete = false;
            }
        }
        if (!complete) {
            cm.sendOk("抱歉，但我必须拥有这些物品才能做到完美。也许下次吧。");
        } else {
            if (mats instanceof Array) {
                for (var i = 0; i < mats.length; i++) {
                    cm.gainItem(mats[i], -matQty[i]);
                }
            } else {
                cm.gainItem(mats, -matQty);
            }
            cm.gainMeso(-cost);
            if (stimulator) { //检查促进剂
                cm.gainItem(stimID, -1);
                var deleted = Math.floor(Math.random() * 10);
                if (deleted != 0) {
                    cm.gainRandomItem(newItem);
                    cm.sendOk("手套已经准备好了。小心，它们还很烫。");
                } else {
                    cm.sendOk("哎呀！我想我不小心加了太多的促进剂，嗯，整个东西现在都不能用了……抱歉，但我不能退款。");
                }
            } else {
                cm.gainItem(item, 1);
                cm.sendOk("手套已经准备好了。小心，它们还很烫。");
            }
        }
        cm.dispose();
    }
}