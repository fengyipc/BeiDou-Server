/*
 * 该文件是OdinMS枫之谷服务器的一部分
 * 版权所有 (C) 2008 Patrick Huy <patrick.huy@frz.cc>
 *                Matthias Butz <matze@odinms.de>
 *                Jan Christian Meyer <vimes@odinms.de>
 *
 * 本程序是自由软件：您可以根据自由软件基金会发布的GNU Affero通用公共许可证第3版
 * 重新分发或修改它。您不得使用、修改或分发本程序的任何其他版本。
 *
 * 本程序分发时希望它有用，但没有任何担保；甚至没有适销性或特定用途适用性的默示担保。
 * 详情请参阅GNU Affero通用公共许可证。
 *
 * 您应该已收到GNU Affero通用公共许可证的副本。如果没有，请参阅<http://www.gnu.org/licenses/>。
 */
/*
 *
 *@author Ronan
 */

var status = 0;
var expedition;
var expedMembers;
var player;
var em;
const ExpeditionType = Java.type('org.gms.server.expeditions.ExpeditionType');
const exped = ExpeditionType.BALROG_NORMAL;
var expedName = "巨魔蝙蝠怪";
var expedBoss = "巨魔蝙蝠怪";
var expedMap = "蝙蝠怪之墓";

var list = "你想进行什么操作？#b\r\n\r\n#L1#查看当前远征队成员#l\r\n#L2#开始战斗！#l\r\n#L3#终止远征#l";

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {

    player = cm.getPlayer();
    expedition = cm.getExpedition(exped);
    em = cm.getEventManager("BalrogBattle");

    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0) {
            cm.dispose();
            return;
        }

        if (status == 0) {
            if (player.getLevel() < exped.getMinLevel() || player.getLevel() > exped.getMaxLevel()) { // 等级不符合要求
                cm.sendOk("你不符合挑战" + expedBoss + "的条件！");
                cm.dispose();
            } else if (expedition == null) { // 创建远征队
                cm.sendSimple("#e#b<远征队：" + expedName + ">\r\n#k#n" + em.getProperty("party") + "\r\n\r\n要组建队伍挑战#r" + expedBoss + "#k吗？\r\n#b#L1#立即创建队伍！#l\r\n\#L2#再考虑一下...#l\r\n\#L3#查看远征队信息...#l");
                status = 1;
            } else if (expedition.isLeader(player)) { // 队长操作界面
                if (expedition.isInProgress()) {
                    cm.sendOk("你的远征队已经开始战斗，让我们为这些勇士祈祷吧。");
                    cm.dispose();
                } else {
                    cm.sendSimple(list);
                    status = 2;
                }
            } else if (expedition.isRegistering()) { // 远征队招募中
                if (expedition.contains(player)) { // 已加入但未开始
                    cm.sendOk("你已加入远征队，请等待队长#r" + expedition.getLeader().getName() + "#k开始。");
                    cm.dispose();
                } else { // 加入远征队
                    cm.sendOk(expedition.addMember(cm.getPlayer()));
                    cm.dispose();
                }
            } else if (expedition.isInProgress()) { // 远征进行中
                if (expedition.contains(player)) { // 已注册则传送进入
                    var eim = em.getInstance(expedName + player.getClient().getChannel());
                    if (eim.getIntProperty("canJoin") == 1) {
                        eim.registerPlayer(player);
                    } else {
                        cm.sendOk("你的队伍已开始与" + expedBoss + "的战斗，让我们为这些勇士祈祷吧。");
                    }

                    cm.dispose();
                } else { // 未加入提示
                    cm.sendOk("其他远征队已开始挑战" + expedBoss + "，让我们为这些勇士祈祷吧。");
                    cm.dispose();
                }
            }
        } else if (status == 1) {
            if (selection == 1) {
                expedition = cm.getExpedition(exped);
                if (expedition != null) {
                    cm.sendOk("已有人创建远征队，尝试加入他们吧！");
                    cm.dispose();
                    return;
                }

                var res = cm.createExpedition(exped);
                if (res == 0) {
                    cm.sendOk("已创建#r" + expedBoss + "远征队#k\r\n\r\n再次与我对话可查看队伍或开始战斗！");
                } else if (res > 0) {
                    cm.sendOk("今日挑战次数已达上限，请改日再来...");
                } else {
                    cm.sendOk("创建远征队时发生错误，请稍后再试。");
                }

                cm.dispose();

            } else if (selection == 2) {
                cm.sendOk("当然，不是每个人都准备好挑战" + expedBoss + "。");
                cm.dispose();

            } else {
                cm.sendSimple("你好，我是#b#n无影#n#k，寺庙守护者。这座寺庙正遭受巨魔蝙蝠怪部队的围攻。我们尚不清楚是谁下达的命令。" +
                    "几周来，#e#b阿尔泰尔骑士团#n#k不断派遣佣兵，但每次都被全歼。" +
                    "那么，旅行者，你愿意尝试击败这个恐怖存在吗？\r\n  #L1#什么是#e阿尔泰尔骑士团#n？");

                status = 10;
            }
        } else if (status == 2) {
            if (selection == 1) {
                if (expedition == null) {
                    cm.sendOk("无法加载远征队信息。");
                    cm.dispose();
                    return;
                }
                expedMembers = expedition.getMemberList();
                var size = expedMembers.size();
                if (size == 1) {
                    cm.sendOk("你是远征队唯一的成员。");
                    cm.dispose();
                    return;
                }
                var text = "当前远征队成员（点击可踢出）：\r\n";
                text += "\r\n\t\t1." + expedition.getLeader().getName();
                for (var i = 1; i < size; i++) {
                    text += "\r\n#b#L" + (i + 1) + "#" + (i + 1) + ". " + expedMembers.get(i).getValue() + "#l\n";
                }
                cm.sendSimple(text);
                status = 6;
            } else if (selection == 2) {
                var min = exped.getMinSize();
                var size = expedition.getMemberList().size();
                if (size < min) {
                    cm.sendOk("需要至少" + min + "名队员才能开始。");
                    cm.dispose();
                    return;
                }

                cm.sendOk("远征队即将开始，你将传送至#b" + expedMap + "#k。");
                status = 4;
            } else if (selection == 3) {
                const PacketCreator = Java.type('org.gms.util.PacketCreator');
                player.getMap().broadcastMessage(PacketCreator.serverNotice(6, expedition.getLeader().getName() + "已解散远征队"));
                cm.endExpedition(expedition);
                cm.sendOk("远征队已解散。有时候撤退才是上策。");
                cm.dispose();

            }
        } else if (status == 4) {
            if (em == null) {
                cm.sendOk("无法初始化事件，请在论坛反馈此问题。");
                cm.dispose();
                return;
            }

            em.setProperty("leader", player.getName());
            em.setProperty("channel", player.getClient().getChannel());
            if (!em.startInstance(expedition)) {
                cm.sendOk("其他队伍已开始挑战" + expedBoss + "，让我们为这些勇士祈祷吧。");
                cm.dispose();
                return;
            }

            cm.dispose();

        } else if (status == 6) {
            if (selection > 0) {
                var banned = expedMembers.get(selection - 1);
                expedition.ban(banned);
                cm.sendOk("已将" + banned.getValue() + "移出远征队");
                cm.dispose();
            } else {
                cm.sendSimple(list);
                status = 2;
            }
        } else if (status == 10) {
            cm.sendOk("阿尔泰尔骑士团是监管世界经济与军事行动的精英佣兵组织，创立于黑魔法师被击败40年后，旨在预防未来可能的袭击。");
            cm.dispose();
        }
    }
}