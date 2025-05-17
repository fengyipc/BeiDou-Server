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

/**
 * @author: Ronan
 * @npc: Guon
 * @map: 251010404 - Over the Pirate Ship
 * @func: Pirate PQ
 */

var status = 0;
var em = null;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0 && status == 0) {
            cm.dispose();
            return;
        }
        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        if (status == 0) {
            em = cm.getEventManager("PiratePQ");
            if (em == null) {
                cm.sendOk("海盗组队任务遇到了一个错误。");
                cm.dispose();
                return;
            } else if (cm.isUsingOldPqNpcStyle()) {
                action(1, 0, 0);
                return;
            }

            let text = "#e#b<组队任务：海盗船>\r\n#k#n" + em.getProperty("party") + "\r\n\r\n";
            text += "救命啊！我的儿子被绑在可怕的#r老海盗#k手中。我需要你的帮助... 你能组建或加入一个队伍来救他吗？请让你的#b队伍领袖#k与我交谈或者组建一个队伍\r\n";
            text += "#b#L0#我想参加这个组队任务\r\n";
            text += "#L1#我想" + (cm.getPlayer().isRecvPartySearchInviteEnabled() ? "禁用" : "启用") + "组队搜索\r\n";
            text += "#L2#我想了解更多详情。\r\n";
            text += "#L3#我想要兑换海盗船长帽";
            cm.sendSimple(text);
        } else if (status == 1) {
            if (selection == 0) {
                if (cm.getParty() == null) {
                    cm.sendOk("只有当你加入一个队伍时，你才能参加派对任务。");
                    cm.dispose();
                } else if (!cm.isLeader()) {
                    cm.sendOk("你的队长必须与我交谈才能开始这个组队任务。");
                    cm.dispose();
                } else {
                    var eli = em.getEligibleParty(cm.getParty());
                    if (eli.size() > 0) {
                        if (!em.startInstance(cm.getParty(), cm.getPlayer().getMap(), 1)) {
                            cm.sendOk("另一个队伍已经进入了该频道的#r组队任务#k。请尝试其他频道，或者等待当前队伍完成。");
                        }
                    } else {
                        cm.sendOk("你目前无法开始这个组队任务，因为你的队伍可能不符合人数要求，有些队员可能不符合尝试条件，或者他们不在这张地图上。如果你找不到队员，可以尝试使用组队搜索功能。");
                    }

                    cm.dispose();
                }
            } else if (selection == 1) {
                var psState = cm.getPlayer().toggleRecvPartySearchInvite();
                cm.sendOk("你的组队搜索状态现在是：#b" + (psState ? "enabled" : "disabled") + "#k。想要改变状态时随时找我。");
                cm.dispose();
            } else if (selection == 3) {
                let text = "你想要兑换什么帽子？\r\n\r\n#L0##b#z1002571#\r\n#L1##b#z1002572#\r\n#L2##b#z1002573#\r\n#L3##b#z1002574# (随机属性)"
                cm.sendSimple(text);
            } else {
                cm.sendOk("#e#b<组队任务：海盗船>#k#n\r\n在这个组队任务中，你的任务是逐步穿过船舱，与途中的所有海盗们战斗。当你到达#r老海盗#k处时，根据之前阶段打开的宝箱数量，boss会变得更加强大，所以要保持警惕。如果打开了这些宝箱，将会给你的船员带来许多额外的奖励，值得一试！祝你好运。");
                cm.dispose();
            }
        } else if (status == 2) {
            const enoughItem = cm.haveItem(4001455, 10);
            const items = [1002571, 1002572, 1002573, 1002574];
            const hasOne = items.findIndex(id => cm.haveItem(id));
            if (selection == 0) {
                if (hasOne === -1 && enoughItem) {
                    cm.gainItem(1002571, 1);
                    cm.gainItem(4001455, -10);
                    cm.sendOk("感谢你为救出无恙做的贡献，帽子已经给你啦！");
                    cm.dispose();
                } else {
                    cm.sendOk("你要么已经有了一个海盗船长帽了，要么没有10个#z4001455#");
                    cm.dispose();
                }
            } else if (selection == 1) {
                if (hasOne === 0 && enoughItem) {
                    cm.gainItem(1002571, -1);
                    cm.gainItem(1002572, 1);
                    cm.gainItem(4001455, -10);
                    cm.sendOk("感谢你为救出无恙做的贡献，帽子已经给你啦！");
                    cm.dispose();
                } else {
                    cm.sendOk("你要么还没有#z1002571#，要么没有10个#z4001455#");
                    cm.dispose();
                }
            } else if (selection == 2) {
                if (hasOne === 1 && enoughItem) {
                    cm.gainItem(1002572, -1);
                    cm.gainItem(1002573, 1);
                    cm.gainItem(4001455, -10);
                    cm.sendOk("感谢你为救出无恙做的贡献，帽子已经给你啦！");
                    cm.dispose();
                } else {
                    cm.sendOk("你要么还没有#z1002572#，要么没有10个#z4001455#");
                    cm.dispose();
                }
            } else if (selection == 3) {
                if((hasOne === 2 || hasOne === 3) && enoughItem) {
                    cm.gainItem(items[hasOne], -1);
                    cm.gainItem(4001455, -10);
                    cm.gainItem(1002574, 1, true, true);
                    cm.sendOk("感谢你为救出无恙做的贡献，帽子已经给你啦！");
                    cm.dispose();
                } else {
                    cm.sendOk("你未拥有#z1002573#或者#z1002574#，或者没有10个#z4001455#");
                    cm.dispose();
                }
            }
        }
    }
}