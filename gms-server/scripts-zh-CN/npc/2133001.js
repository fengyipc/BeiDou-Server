/**
 * @author: Ronan
 * @npc: Ellin
 * @map: Ellin PQ
 * @func: Ellin PQ Coordinator
 */

var status = 0;
var mapid;

function start() {
    mapid = cm.getPlayer().getMapId();

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
            var ellinStr = ellinMapMessage(mapid);

            if (mapid == 930000000) {
                cm.sendNext(ellinStr);
            } else if (mapid == 930000300) {
                var eim = cm.getEventInstance();

                if (eim.getIntProperty("statusStg4") == 0) {
                    eim.showClearEffect(cm.getMap().getId());
                    eim.setIntProperty("statusStg4", 1);
                }

                cm.sendNext(ellinStr);
            } else if (mapid == 930000400) {
                if (cm.haveItem(4001169, 20)) {
                    if (cm.isEventLeader()) {
                        cm.sendNext("哦，你带来了它们！我们现在可以继续了，我们要继续吗？");
                    } else {
                        cm.sendOk("你已经带来了他们，但你不是队长！请让队长把#t4001169#给我……");
                        cm.dispose();

                    }
                } else {
                    if (cm.getEventInstance().gridCheck(cm.getPlayer()) != 1) {
                        cm.sendNext(ellinStr);

                        cm.getEventInstance().gridInsert(cm.getPlayer(), 1);
                        status = -1;
                    } else {
                        var mobs = cm.getMap().countMonsters();

                        if (mobs > 0) {
                            if (!cm.haveItem(2270004)) {
                                if (cm.canHold(2270004, 10)) {
                                    cm.gainItem(2270004, 10);
                                    cm.sendOk("拿10个#t2270004#。首先，#r削弱#o9300174#的力量，一旦它的生命值降低，使用我给你的物品来捕捉它们。");
                                    cm.dispose();

                                } else {
                                    cm.sendOk("在领取净化器之前，请确保你的使用物品栏有足够的空间！");
                                    cm.dispose();

                                }
                            } else {
                                cm.sendYesNo(ellinStr + "\r\n\r\n你是否 #r想要退出#k？请三思，也许你的队友还在努力尝试这个副本。");
                            }
                        } else {
                            cm.sendYesNo("你们已经捕捉到了所有的 #o9300174#。让队长把所有的 #b20 #t4001169##k 给我，然后我们继续。" + "\r\n\r\n也许你是 #r想要退出#k？请三思，也许你的队友还在努力尝试这个副本。");
                        }
                    }
                }
            } else {
                cm.sendYesNo(ellinStr + "\r\n\r\n也许你 #r想要退出#k？请三思，也许你的队友还在努力尝试这个副本。");
            }
        } else if (status == 1) {
            if (mapid == 930000000) {
            } else if (mapid == 930000300) {
                cm.getEventInstance().warpEventTeam(930000400);
            } else if (mapid == 930000400) {
                if (cm.haveItem(4001169, 20) && cm.isEventLeader()) {
                    cm.gainItem(4001169, -20);
                    cm.getEventInstance().warpEventTeam(930000500);
                } else {
                    cm.warp(930000800, 0);
                }
            } else {
                cm.warp(930000800, 0);
            }

            cm.dispose();
        }
    }
}

function ellinMapMessage(mapid) {
    switch (mapid) {
        case 930000000:
            return "欢迎来到毒雾森林。请进入传送门继续前进。";

        case 930000100:
            return "#b#o9300172##k占据了这片区域。我们必须消灭所有这些被污染的怪物才能继续前进。";

        case 930000200:
            return "一根巨大的荆棘挡住了前方的道路。为了移除这个障碍，我们必须获取 #b#o9300173##k携带的毒液，以阻止过度生长的荆棘。然而，自然状态下的毒液浓度太高，无法处理。使用那边的 #b喷泉#k 来稀释它。";

        case 930000300:
            return "太棒了，你们终于找到我了。现在我们可以继续深入森林了。";

        case 930000400:
            return "#b#o9300175##k占领了这片区域。然而它们不是普通的怪物，它们的再生速度非常快，#r普通的武器和魔法对它们完全没有伤害#k。我们必须使用 #b#t2270004##k净化所有这些被污染的怪物！让你们的队长给我带来 20 颗#t4001169#。";

        case 930000600:
            return "森林所有问题的根源就在这里！把获得的魔法石放在祭坛上，做好准备！";

        case 930000700:
            return "就是这里，你们做到了！非常感谢你们净化了这片森林！";

    }
}