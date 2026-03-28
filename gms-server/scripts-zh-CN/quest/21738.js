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

var status = -1;

function start(mode, type, selection) {
    if (mode == -1) {
        qm.dispose();
    } else {
        if (mode == 0 && type > 0) {
            qm.dispose();
            return;
        }

        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        if (status == 0) {  // thanks ZERO傑洛 for noticing this quest shouldn't need a pw -- GMS-like string data thanks to skycombat
            qm.sendGetText("嗯，你有什么事？");
        } else if (status == 1) {
            qm.sendNext("（你告诉她巨型食人花的事。）", 3);
        } else if (status == 2) {
            qm.sendNext("巨型食人花？的确是个大麻烦，但我不觉得会真的影响到天空之城。等等，你刚才说巨型食人花在哪来着？", 9);
        } else if (status == 3) {
            qm.sendNext("人迹罕至的山路。", 3);
        } else if (status == 4) {
            qm.sendNext("……人迹罕至的山路？如果巨型食人花在那里，就说明有人想闯进封印的庭院！可为什么？更重要的是，是谁？", 9);
        } else if (status == 5) {
            qm.sendNext("封印的庭院？", 3);
        } else if (status == 6) {
            qm.sendAcceptDecline("我不能告诉你封印庭园的事。如果你想知道，我得先确认你是否配得上这份情报。介意让我窥探一下你的命运吗？", 9);
        } else if (status == 7) {
            qm.sendOk("好，现在就来看看你的命运。稍等我一下。");
        } else if (status == 8) {
            qm.forceStartQuest();
            qm.dispose();
        }
    }
}
