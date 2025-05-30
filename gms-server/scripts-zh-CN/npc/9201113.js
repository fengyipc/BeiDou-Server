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
/*Jack
 *
 *@author Alan (SharpAceX)
 *@author Ronan
 */

var status = 0;
var expedition;
var expedMembers;
var player;
var em;
const ExpeditionType = Java.type('org.gms.server.expeditions.ExpeditionType');
var cwkpq = ExpeditionType.CWKPQ;
var list = "你想做什么？#b\r\n\r\n#L1#查看当前远征队成员#l\r\n#L2#开始战斗！#l\r\n#L3#退出远征队#l";

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {

    player = cm.getPlayer();
    expedition = cm.getExpedition(cwkpq);
    em = cm.getEventManager("CWKPQ");

    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0) {
            cm.dispose();
            return;
        }

        if (status == 0) {
            if (player.getLevel() < cwkpq.getMinLevel() || player.getLevel() > cwkpq.getMaxLevel()) { //Don't fit requirement, thanks Conrad
                cm.sendOk("你不符合条件参加枫叶城要塞派对任务！");
                cm.dispose();
            } else if (expedition == null) { //Start an expedition
                cm.sendSimple("#e#b<组队任务：红树林要塞>\r\n#k#n" + em.getProperty("party") + "\r\n\r\n你想组建一个队伍来尝试#r红树林要塞组队任务#k吗？\r\n#b#L1#让我们开始吧！#l\r\n\#L2#不，我想再等一会儿...#l");
                status = 1;
            } else if (expedition.isLeader(player)) { //If you're the leader, manage the exped
                if (expedition.isInProgress()) {
                    cm.sendOk("你的探险已经在进行中，对于那些仍在战斗中的人，让我们为那些勇敢的灵魂祈祷吧。");
                    cm.dispose();
                } else {
                    cm.sendSimple(list);
                    status = 2;
                }
            } else if (expedition.isRegistering()) { //If the expedition is registering
                if (expedition.contains(player)) { //If you're in it but it hasn't started, be patient
                    cm.sendOk("你已经注册了这次远征。请等待 #r" + expedition.getLeader().getName() + "#k 开始。");
                    cm.dispose();
                } else { //If you aren't in it, you're going to get added
                    cm.sendOk(expedition.addMember(cm.getPlayer()));
                    cm.dispose();
                }
            } else if (expedition.isInProgress()) { //Only if the expedition is in progress
                if (expedition.contains(player)) { //If you're registered, warp you in
                    em.getInstance("CWKPQ" + player.getClient().getChannel()).registerPlayer(player);
                    cm.dispose();
                } else { //If you're not in by now, tough luck
                    cm.sendOk("另一支探险队已经采取了主动行动来完成赤血城堡派对任务，让我们为那些勇敢的灵魂祈祷吧。");
                    cm.dispose();
                }
            }
        } else if (status == 1) {
            if (selection == 1) {
                expedition = cm.getExpedition(cwkpq);
                if (expedition != null) {
                    cm.sendOk("有人已经主动成为了远征队的领袖。试着加入他们吧！");
                    cm.dispose();
                    return;
                }

                var res = cm.createExpedition(cwkpq);
                if (res == 0) {
                    cm.sendOk("“#r红树林要塞派对任务远征#k已经创建。\r\n\r\n再次与我交谈以查看当前团队，或开始战斗！”");
                } else if (res > 0) {
                    cm.sendOk("抱歉，您已经达到了此次远征的尝试配额！请另选他日再试……");
                } else {
                    cm.sendOk("在启动远征时发生了意外错误，请稍后重试。");
                }

                cm.dispose();

            } else if (selection == 2) {
                cm.sendOk("当然，并不是每个人都愿意尝试红树林要塞派对任务。");
                cm.dispose();

            }
        } else if (status == 2) {
            if (selection == 1) {
                if (expedition == null) {
                    cm.sendOk("无法加载远征队。");
                    cm.dispose();
                    return;
                }
                expedMembers = expedition.getMemberList();
                var size = expedMembers.size();
                if (size == 1) {
                    cm.sendOk("你是探险队中唯一的成员。");
                    cm.dispose();
                    return;
                }
                var text = "以下成员组成了你的探险队（点击成员名字可以将其踢出探险队）：\r\n";
                text += "\r\n\t\t1." + expedition.getLeader().getName();
                for (var i = 1; i < size; i++) {
                    text += "\r\n#b#L" + (i + 1) + "#" + (i + 1) + ". " + expedMembers.get(i).getValue() + "#l\n";
                }
                cm.sendSimple(text);
                status = 6;
            } else if (selection == 2) {
                var min = cwkpq.getMinSize();
                var size = expedition.getMemberList().size();
                if (size < min) {
                    cm.sendOk("你的远征队至少需要有" + min + "名玩家注册。");
                    cm.dispose();
                    return;
                }

                cm.sendOk("探险队即将出发，你现在将被护送至#b神木村彩虹组队任务祭坛入口#k。");
                status = 4;
            } else if (selection == 3) {
                const PacketCreator = Java.type('org.gms.util.PacketCreator');
                player.getMap().broadcastMessage(PacketCreator.serverNotice(6, expedition.getLeader().getName() + "探险结束了。"));
                cm.endExpedition(expedition);
                cm.sendOk("这次探险已经结束。有时候最好的策略就是逃跑。");
                cm.dispose();

            }
        } else if (status == 4) {
            if (em == null) {
                cm.sendOk("事件无法初始化，请在论坛上报告此问题。");
                cm.dispose();
                return;
            }

            em.setProperty("leader", player.getName());
            em.setProperty("channel", player.getClient().getChannel());
            if (!em.startInstance(expedition)) {
                cm.sendOk("另一支探险队已经采取了主动行动，完成了红木城堡派对任务，让我们为那些勇敢的灵魂祈祷吧。");
                cm.dispose();
                return;
            }

            cm.dispose();

        } else if (status == 6) {
            if (selection > 0) {
                var banned = expedMembers.get(selection - 1);
                expedition.ban(banned);
                cm.sendOk("你已经从远征中禁止了 " + banned.getValue() + "。");
                cm.dispose();
            } else {
                cm.sendSimple(list);
                status = 2;
            }
        }
    }
}