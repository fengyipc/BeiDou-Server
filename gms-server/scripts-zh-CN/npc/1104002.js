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

var status;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        var mapobj = cm.getMap();

        if (mode == 0 && type > 0) {
            cm.getPlayer().dropMessage(5, "Eleanor: Oh, lost the Empress and still challenging us? Now you've done it! Prepare yourself!!!");

            const LifeFactory = Java.type('org.gms.server.life.LifeFactory');
            const Point = Java.type('java.awt.Point');
            mapobj.spawnMonsterOnGroundBelow(LifeFactory.getMonster(9001010), new Point(850, 0));
            mapobj.destroyNPC(1104002);

            cm.dispose();
            return;
        }
        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        if (status == 0) {
            if (!cm.isQuestStarted(20407)) {
                cm.sendOk("“... 骑士，你似乎还不确定要面对这场战斗，是吗？挑战一个人的时候，如果他们还没有心理准备进行战斗，那就没有什么优雅可言。和你那只笨拙的大鸟说说你的想法，也许它会给你一些勇气。”");
                cm.dispose();
                return;
            }

            cm.sendAcceptDecline("哈哈哈哈！这里的女皇已经在我的掌控之中，这对#b黑色之翼#k颠覆冒险岛世界来说，无疑是巨大的进展……那边的你，还想与我们为敌吗？还是说，看你似乎强得足以当我们的得力援军，#r你是否愿意不负所望、加入我们#k？反正你也已经无能为力了。");
        } else if (status == 1) {
            cm.sendOk("“哈，懦夫在#r黑魔法师#k的军队中没有立足之地。滚吧！”");
            cm.dispose();
        }
    }
}