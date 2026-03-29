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
status = -1;
//Need more questions.
quest = ["在金银岛魔法密林，下列 NPC 中你不会见到谁？#b\r\n#L0#Shane\r\n#L1#Francois\r\n#L2#汉斯\r\n#L3#妖精 艾温\r\n#L4#Roel", "在神秘岛，下列哪一种怪物你不会遇到……？#b\r\n#L0#白狼\r\n#L1#黑鳄鱼\r\n#L2#白雪人\r\n#L3#白狼人\r\n#L4#日光精灵", "以下哪种怪物的等级最高……？#b\r\n#L0#三眼章鱼\r\n#L1#漂漂猪\r\n#L2#绿蘑菇\r\n#L3#斧木妖\r\n#L4#蓝水灵", "在冒险岛中，以下哪一组药水与效果的搭配是错误的……？#b\r\n#L0#圣水 - 解除诅咒或封印状态。\r\n#L1#清晨之露 - 恢复 MP 3000\r\n#L2#汉堡 - 恢复 HP 400\r\n#L3#沙拉 - 恢复 MP 200\r\n#L4#蓝色药水 - 恢复 MP 100", "下列哪些NPC与宠物毫无关系……？#b\r\n#L0#科洛伊\r\n#L1#妖精 玛丽\r\n#L2#巴罗德\r\n#L3#比休斯\r\n#L4#科尔"];
ans = [4, 1, 3, 1, 3];
rand = parseInt(Math.random() * quest.length);

function start() {
    if (cm.getPlayer().gotPartyQuestItem("JBQ") && !cm.haveItem(4031058)) {
        if (cm.haveItem(4005004)) {
            if (!cm.canHold(4031058)) {
                cm.sendNext("接受此试炼前，请确保有一个空闲的ETC槽位。");
            } else {
                cm.sendNext("好的...我将在这里测试你的智慧。回答所有问题正确，你就会通过测试，但是，如果你有一次说谎，那么你就得重新开始，好吗，我们开始吧。");
                return;
            }
        } else {
            cm.sendNext("给我一个 #b#t4005004##k 以便继续问题。");
        }
    }
    cm.dispose();
}

function action(mode, type, selection) {
    status++;
    if (mode != 1) {
        cm.dispose();
        return;
    }
    if (status == 0) {
        cm.gainItem(4005004, -1);
    }
    if (status > 0) {
        if (selection != ans[rand]) {
            cm.sendNext("你已经失败了这个问题。");
            cm.dispose();
            return;
        }
    }
    while (quest[rand] === "" && status <= 4) {
        rand = parseInt(Math.random() * quest.length);
    }
    if (status <= 4) {
        cm.sendSimple("这是第" + (status + 1) + (status == 0 ? "st" : status == 1 ? "nd" : status == 2 ? "rd" : "th") + "个问题。" + quest[rand]);
        quest[rand] = "";
    } else {
        cm.sendOk("好的。你的所有答案都被证明是真实的。你的智慧得到了验证。拿着这条项链回去吧。");
        cm.gainItem(4031058, 1);
        cm.dispose();
    }
}