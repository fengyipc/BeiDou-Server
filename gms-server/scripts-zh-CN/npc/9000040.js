/*
    This file is part of the HeavenMS MapleStory Server
    Copyleft (L) 2016 - 2019 RonanLana

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
/* Dalair
	勋章NPC.

        装备合成NPC:
        * @author Ronan Lana
 */

var status;
var mergeFee = 50000;
var name;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0 && type > 0) {
            cm.dispose();
            return;
        }
        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        if (status == 0) {
            const GameConfig = Java.type('org.gms.config.GameConfig');
            if (!GameConfig.getServerBoolean("use_enable_custom_npc_script")) {
                cm.sendOk("勋章排名系统当前不可用...");
                cm.dispose();
                return;
            }

            var levelLimit = !cm.getPlayer().isCygnus() ? 160 : 110;
            var selStr = "由于勋章排名系统当前不可用... 我现在提供#b装备合成#k服务！";

            const MakerProcessor = Java.type('org.gms.client.processor.action.MakerProcessor');
            if (!GameConfig.getServerBoolean("use_starter_merge") && (cm.getPlayer().getLevel() < levelLimit || MakerProcessor.getMakerSkillLevel(cm.getPlayer()) < 3)) {
                selStr += "不过，你需要达到#r制造技能3级#k，并且至少#r110级#k(骑士团职业)或#r160级#k(其他职业)，以及准备#r" + cm.numberWithCommas(mergeFee) + "金币#k才能使用此服务。";
                cm.sendOk(selStr);
                cm.dispose();
            } else if (cm.getMeso() < mergeFee) {
                selStr += "很抱歉，这项服务需要收取#r" + cm.numberWithCommas(mergeFee) + "金币#k的费用，您目前的资金似乎不足...请稍后再来。";
                cm.sendOk(selStr);
                cm.dispose();
            } else {
                selStr += "只需支付#r" + cm.numberWithCommas(mergeFee) + "#k金币，就能将背包中的多余装备合成到当前穿戴的装备上，根据合成材料的属性提升装备能力！";
                cm.sendNext(selStr);
            }
        } else if (status == 1) {
            selStr = "#r警告#b：请确保您要合成的物品位于选中物品#r之后#b的栏位中。#k所有位于选中物品#b下方#k的装备都将被完全合成。\r\n\r\n请注意，接受合成加成的装备将变为#r不可交易#k状态，且已经获得过合成加成的装备#r无法再次用于合成#k。\r\n\r\n";
            cm.sendGetText(selStr);
        } else if (status == 2) {
            name = cm.getText();

            if (cm.getPlayer().mergeAllItemsFromName(name)) {
                cm.gainMeso(-mergeFee);
                cm.sendOk("合成完成！感谢使用本服务，请享受您的新装备属性。");
            } else {
                cm.sendOk("您的#b装备栏#k中不存在名为#b'" + name + "'#k的装备！");
            }

            cm.dispose();
        }
    }
}