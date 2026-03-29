/*
	This file is part of the OdinMS Maple Story Server
    Copyright (C) 2008 Patrick Huy <patrick.huy@frz.cc> 
                       Matthias Butz <matze@odinms.de>
                       Jan Christian Meyer <vimes@odinms.de>

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License version 3
    as published by the Free Software Foundation. You may not use, modify
    or distribute this program under any other version of the
    GNU Affero General Public License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

var inMap = [540000000, 550000000, 551000000];
var toMap = [550000000, [551000000, 541000000], 550000000];
var cost = [42000, [10000, 0], 10000];
var toMapSp = [0, [2, 4], 4];

var location;
var text;

var travelCost;
var travelMap;
var travelSp;

var startedTravel = false;

var status = 0;

function start() {
    if (cm.getPlayer().getMap().getId() != 540000000) {
        text = "嘿，我是#p9201135#，在#r马来西亚#k当导游。您想去哪里旅游？\n\n";
    } else {
        text = "嘿，我是#p9201135#，在#r马来西亚#k当导游。由于你还没登记我们与合作方#b枫叶旅行社#k推出的特惠旅游套餐，这次的车费会贵上不少。那么，现在要出发吗？\n\n";
        startedTravel = true;
    }

    for (var i = 0; i < toMap.length; i++) {
        if (inMap[i] == cm.getPlayer().getMap().getId()) {
            if (inMap[i] == 550000000) {
                toMap[1][1] = cm.getPlayer().peekSavedLocation("WORLDTOUR");
                if (toMap[1][1] == -1) {
                    toMap[1][1] = 541000000;
                }
            }

            location = i;
            break;
        }
    }

    if (toMap[location] instanceof Array) {
        var maps = toMap[location];
        var costs = cost[location];

        for (var i = 0; i < maps.length; i++) {
            text += "\t\r\n#b#L" + i + "##m" + maps[i] + "# " + (costs[i] > 0 ? "(" + costs[i] + "金币)" : "") + "#l";
        }
    } else {
        text += "\t\r\n#b#L0##m" + toMap[location] + "# " + (cost[location] > 0 ? "(" + cost[location] + "金币)" : "") + "#l";
    }

    text += "#k";

    cm.sendSimple(text);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
        return;
    } else if (mode == 0) {
        cm.sendNext("如果你需要搭车，你知道该来找我了！");
        cm.dispose();
        return;
    } else {
        status++;
    }
    if (status == 1) {
        if (toMap[location] == null) {
            cm.dispose();
            return;
        }

        if (toMap[location] instanceof Array) {
            var maps = toMap[location];
            var costs = cost[location];
            var sps = toMapSp[location];

            travelCost = costs[selection];
            travelMap = maps[selection];
            travelSp = sps[selection];
        } else {
            travelCost = cost[location];
            travelMap = toMap[location];
            travelSp = toMapSp[location];
        }

        if (travelCost > 0) {
            cm.sendYesNo("您想前往#b#m" + travelMap + "##k吗？前往#b#m" + travelMap + "##k需要花费#r" + cm.numberWithCommas(travelCost) + "金币#k。您现在要前往吗？");
        } else {
            cm.sendNext("在#r马来西亚#k度过了愉快的时光吗？希望是的，一路平安！");
        }
    } else if (status == 2) {
        if (cm.getMeso() < travelCost) {
            cm.sendNext("你似乎没有足够的金币。");
        } else {
            if (travelCost > 0) {
                cm.gainMeso(-travelCost);
                if (startedTravel) {
                    cm.getPlayer().saveLocation("WORLDTOUR");
                }
            } else {
                travelMap = cm.getPlayer().getSavedLocation("WORLDTOUR");
                if (travelMap == -1) {
                    travelMap = toMap[1][1];
                }
            }

            cm.warp(travelMap, travelSp);
        }
        cm.dispose();
    }
}