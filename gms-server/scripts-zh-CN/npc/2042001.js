/**
 -- Version Info -----------------------------------------------------------------------------------
 1.0 - First Version by Drago (MapleStorySA)
 2.0 - Second Version by Ronan (HeavenMS)
 3.0 - Third Version by Jayd - translated CPQ contents to English and added Pirate items
 ---------------------------------------------------------------------------------------------------
 **/

var status = 0;
var rnk = -1;
var n1 = 50; //???
var n2 = 40; //??? ???
var n3 = 7; //35
var n4 = 10; //40
var n5 = 20; //50

var cpqMap = 980000000;
var cpqMinLvl = 30;
var cpqMaxLvl = 70;
var cpqMinAmt = 1;
var cpqMaxAmt = 6;

// Ronan的自定义矿石精炼NPC
var refineRocks = true;     // 启用月亮石、星星石
var refineCrystals = true;  // 启用普通水晶
var refineSpecials = true;  // 启用锂矿石、特殊水晶
var feeMultiplier = 7.0;

function start() {
    status = -1;

    const GameConfig = Java.type('org.gms.config.GameConfig');
    if (!GameConfig.getServerBoolean("use_cpq")) {
        if (GameConfig.getServerBoolean("use_enable_custom_npc_script")) {
            status = 0;
            action(1, 0, 4);
        } else {
            cm.sendOk("怪物嘉年华当前不可用。");
            cm.dispose();
        }

        return;
    }

    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        if (status >= 0 && mode == 0) {
            cm.dispose();
            return;
        }
        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        const GameConfig = Java.type('org.gms.config.GameConfig');
        if (cm.getPlayer().getMapId() == 980000010) {
            if (status == 0) {
                cm.sendNext("希望你在怪物嘉年华玩得开心！");
            } else if (status > 0) {
                cm.warp(980000000, 0);
                cm.dispose();
            }
        } else if (cm.getChar().getMap().isCPQLoserMap()) {
            if (status == 0) {
                if (cm.getChar().getParty() != null) {
                    var shiu = "";
                    if (cm.getPlayer().getFestivalPoints() >= 300) {
                        shiu += "#rA#k";
                        cm.sendOk("很遗憾，尽管表现出色，你们还是输掉了比赛。下次胜利一定会属于你们！\r\n\r\n#b你的成绩: " + shiu);
                        rnk = 10;
                    } else if (cm.getPlayer().getFestivalPoints() >= 100) {
                        shiu += "#rB#k";
                        rnk = 20;
                        cm.sendOk("虽然表现优异，但你们还是输掉了比赛。再努力一点，胜利就是你们的了！\r\n\r\n#b你的成绩: " + shiu);
                    } else if (cm.getPlayer().getFestivalPoints() >= 50) {
                        shiu += "#rC#k";
                        rnk = 30;
                        cm.sendOk("很遗憾你们输掉了比赛。胜利属于努力的人。我看到你们的努力，胜利离你们不远了！\r\n\r\n#b你的成绩: " + shiu);
                    } else {
                        shiu += "#rD#k";
                        rnk = 40;
                        cm.sendOk("你们输掉了比赛，表现也反映出这一点。期待你们下次能有更好的表现。\r\n\r\n#b你的成绩: " + shiu);
                    }
                } else {
                    cm.warp(980000000, 0);
                    cm.dispose();
                }
            } else if (status == 1) {
                switch (rnk) {
                    case 10:
                        cm.warp(980000000, 0);
                        cm.gainExp(17500);
                        cm.dispose();
                        break;
                    case 20:
                        cm.warp(980000000, 0);
                        cm.gainExp(1200);
                        cm.dispose();
                        break;
                    case 30:
                        cm.warp(980000000, 0);
                        cm.gainExp(5000);
                        cm.dispose();
                        break;
                    case 40:
                        cm.warp(980000000, 0);
                        cm.gainExp(2500);
                        cm.dispose();
                        break;
                    default:
                        cm.warp(980000000, 0);
                        cm.dispose();
                        break;
                }
            }
        } else if (cm.getChar().getMap().isCPQWinnerMap()) {
            if (status == 0) {
                if (cm.getChar().getParty() != null) {
                    var shi = "";
                    if (cm.getPlayer().getFestivalPoints() >= 300) {
                        shi += "#rA#k";
                        rnk = 1;
                        cm.sendOk("恭喜获胜！！！多么出色的表现！对手完全不是你们的对手！希望下次继续保持！\r\n\r\n#b你的成绩: " + shi);
                    } else if (cm.getPlayer().getFestivalPoints() >= 100) {
                        shi += "#rB#k";
                        rnk = 2;
                        cm.sendOk("恭喜获胜！表现太棒了！你们很好地压制了对手！再努力一点，下次一定能拿到A！\r\n\r\n#b你的成绩: " + shi);
                    } else if (cm.getPlayer().getFestivalPoints() >= 50) {
                        shi += "#rC#k";
                        rnk = 3;
                        cm.sendOk("恭喜获胜。表现中规中矩，算不上出色。期待你们下次更好的表现。\r\n\r\n#b你的成绩: " + shi);
                    } else {
                        shi += "#rD#k";
                        rnk = 4;
                        cm.sendOk("虽然获胜了，但表现并不理想。下次参加怪物嘉年华时请更积极一些！\r\n\r\n#b你的成绩: " + shi);
                    }
                } else {
                    cm.warp(980000000, 0);
                    cm.dispose();
                }
            } else if (status == 1) {
                switch (rnk) {
                    case 1:
                        cm.warp(980000000, 0);
                        cm.gainExp(50000);
                        cm.dispose();
                        break;
                    case 2:
                        cm.warp(980000000, 0);
                        cm.gainExp(25500);
                        cm.dispose();
                        break;
                    case 3:
                        cm.warp(980000000, 0);
                        cm.gainExp(21000);
                        cm.dispose();
                        break;
                    case 4:
                        cm.warp(980000000, 0);
                        cm.gainExp(19505);
                        cm.dispose();
                        break;
                    default:
                        cm.warp(980000000, 0);
                        cm.dispose();
                        break;
                }
            }
        } else if (cm.getMapId() == cpqMap) {   // 仅限CPQ1
            if (status == 0) {
                if (cm.getParty() == null) {
                    status = 10;
                    cm.sendOk("参加战斗前需要先创建队伍！");
                } else if (!cm.isLeader()) {
                    status = 10;
                    cm.sendOk("如果想开始战斗，请让#b队长#k来和我对话。");
                } else {
                    var party = cm.getParty().getMembers();
                    var inMap = cm.partyMembersInMap();
                    var lvlOk = 0;
                    var isOutMap = 0;
                    for (var i = 0; i < party.size(); i++) {
                        if (party.get(i).getLevel() >= cpqMinLvl && party.get(i).getLevel() <= cpqMaxLvl) {
                            lvlOk++;

                            if (party.get(i).getPlayer().getMapId() != cpqMap) {
                                isOutMap++;
                            }
                        }
                    }

                    if (party >= 1) {
                        status = 10;
                        cm.sendOk("队伍人数不足。需要#b" + cpqMinAmt + "#k至#r" + cpqMaxAmt + "#k名队员，并且他们必须和你同地图。");
                    } else if (lvlOk != inMap) {
                        status = 10;
                        cm.sendOk("确保队伍中所有成员等级都在" + cpqMinLvl + "~" + cpqMaxLvl + "之间！");
                    } else if (isOutMap > 0) {
                        status = 10;
                        cm.sendOk("有部分队员不在当前地图！");
                    } else {
                        if (!cm.sendCPQMapLists()) {
                            cm.sendOk("所有怪物嘉年华场地都在使用中！请稍后再试。");
                            cm.dispose();
                        }
                    }
                }
            } else if (status == 1) {
                if (cm.fieldTaken(selection)) {
                    if (cm.fieldLobbied(selection)) {
                        cm.challengeParty(selection);
                        cm.dispose();
                    } else {
                        cm.sendOk("房间已满。");
                        cm.dispose();
                    }
                } else {
                    var party = cm.getParty().getMembers();
                    if ((selection >= 0 && selection <= 3) && party.size() < (GameConfig.getServerBoolean("use_enable_solo_expeditions") ? 1 : 2)) {
                        cm.sendOk("至少需要2名玩家才能参加战斗！");
                    } else if ((selection >= 4 && selection <= 5) && party.size() < (GameConfig.getServerBoolean("use_enable_solo_expeditions") ? 1 : 3)) {
                        cm.sendOk("至少需要3名玩家才能参加战斗！");
                    } else {
                        cm.cpqLobby(selection);
                    }
                    cm.dispose();
                }
            } else if (status == 11) {
                cm.dispose();
            }
        } else {
            if (status == 0) {
                var talk = "你想做什么？如果是第一次参加怪物嘉年华，需要先了解一些基本信息！\r\n#b#L0# 前往怪物嘉年华1.#l \r\n#L3# 前往怪物嘉年华2.#l \r\n#L1# 了解怪物嘉年华.#l\r\n#L2# 兑换#t4001129#.#l";
                if (GameConfig.getServerBoolean("use_enable_custom_npc_script")) {
                    talk += "\r\n#L4# ...我只想精炼矿石可以吗？#l";
                }
                cm.sendSimple(talk);
            } else if (status == 1) {
                if (selection == 0) {
                    if ((cm.getLevel() >= cpqMinLvl && cm.getLevel() <= cpqMaxLvl) || cm.getPlayer().isGM()) {
                        cm.getChar().saveLocation("MONSTER_CARNIVAL");
                        cm.warp(980000000, 0);
                        cm.dispose();

                    } else if (cm.getLevel() < cpqMinLvl) {
                        cm.sendOk(`参加怪物嘉年华需要至少${cpqMaxLvl}级。等你变强了再来找我。`);
                        cm.dispose();

                    } else {
                        cm.sendOk(`抱歉，只有${cpqMinLvl}~${cpqMaxLvl}级的玩家可以参加怪物嘉年华。`);
                        cm.dispose();

                    }
                } else if (selection == 1) {
                    status = 60;
                    cm.sendSimple("你想了解什么？\r\n#b#L0# 什么是怪物嘉年华？#l\r\n#L1# 怪物嘉年华概述.#l\r\n#L2# 怪物嘉年华详细信息.#l\r\n#L3# 没什么，我改变主意了.#l");
                } else if (selection == 2) {
                    cm.sendSimple("记住，如果你有#t4001129#，可以兑换物品。选择你想兑换的物品！\r\n#b#L0# #t1122007# (" + n1 + "枚纪念币)#l\r\n#L1# #t2041211# (" + n2 + "枚纪念币)#l\r\n#L2# 战士武器#l\r\n#L3# 法师武器#l\r\n#L4# 弓箭手武器#l\r\n#L5# 盗贼武器#l\r\n#L6# 海盗武器#l");
                } else if (selection == 3) {
                    cm.getChar().saveLocation("MONSTER_CARNIVAL");
                    cm.warp(980030000, 0);
                    cm.dispose();

                } else if (selection == 4) {
                    var selStr = "好吧，我提供稳定的#b矿石精炼#k服务，收取常规费用#r" + ((feeMultiplier * 100) | 0) + "%#k的额外费用。你想做什么？#b";

                    var options = ["精炼矿物矿石", "精炼宝石矿石"];
                    if (refineCrystals) {
                        options.push("精炼水晶矿石");
                    }
                    if (refineRocks) {
                        options.push("精炼月石/星石");
                    }

                    for (var i = 0; i < options.length; i++) {
                        selStr += "\r\n#L" + i + "# " + options[i] + "#l";
                    }

                    cm.sendSimple(selStr);

                    status = 76;
                }
            } else if (status == 2) {
                select = selection;
                if (select == 0) {
                    if (cm.haveItem(4001129, n1) && cm.canHold(4001129)) {
                        cm.gainItem(1122007, 1);
                        cm.gainItem(4001129, -n1);
                        cm.dispose();
                    } else {
                        cm.sendOk("检查是否缺少#b#t4001129##k或装备栏已满。");
                        cm.dispose();
                    }
                } else if (select == 1) {
                    if (cm.haveItem(4001129, n2) && cm.canHold(2041211)) {
                        cm.gainItem(2041211, 1);
                        cm.gainItem(4001129, -n2);
                        cm.dispose();
                    } else {
                        cm.sendOk("检查是否缺少#b#t4001129##k或消耗栏已满。");
                        cm.dispose();
                    }
                } else if (select == 2) {//S2 战士 26 S3 法师 6 S4 弓箭手 6 S5 盗贼 8
                    status = 10;
                    cm.sendSimple("请确保你有足够的#t4001129#兑换所需武器。选择你想兑换的武器。我这里的武器都非常棒，可不是我自卖自夸！\r\n#b#L0# #z1302004# (" + n3 + "枚纪念币)#l\r\n#L1# #z1402006# (" + n3 + "枚纪念币)#l\r\n#L2# #z1302009# (" + n4 + "枚纪念币)#l\r\n#L3# #z1402007# (" + n4 + "枚纪念币)#l\r\n#L4# #z1302010# (" + n5 + "枚纪念币)#l\r\n#L5# #z1402003# (" + n5 + "枚纪念币)#l\r\n#L6# #z1312006# (" + n3 + "枚纪念币)#l\r\n#L7# #z1412004# (" + n3 + "枚纪念币)#l\r\n#L8# #z1312007# (" + n4 + "枚纪念币)#l\r\n#L9# #z1412005# (" + n4 + "枚纪念币)#l\r\n#L10# #z1312008# (" + n5 + "枚纪念币)#l\r\n#L11# #z1412003# (" + n5 + "枚纪念币)#l\r\n#L12# 下一页 (1/2)#l");
                } else if (select == 3) {
                    status = 20;
                    cm.sendSimple("选择你想兑换的武器。这里的武器都非常吸引人。亲眼看看吧！\r\n#b#L0# #z1372001# (" + n3 + "枚纪念币)#l\r\n#L1# #z1382018# (" + n3 + "枚纪念币)#l\r\n#L2# #z1372012# (" + n4 + "枚纪念币)#l\r\n#L3# #z1382019# (" + n4 + "枚纪念币)#l\r\n#L4# #z1382001# (" + n5 + "枚纪念币)#l\r\n#L5# #z1372007# (" + n5 + "枚纪念币)#l");
                } else if (select == 4) {
                    status = 30;
                    cm.sendSimple("选择你想兑换的武器。这里的武器都非常吸引人。亲眼看看吧！\r\n#b#L0# #z1452006# (" + n3 + "枚纪念币)#l\r\n#L1# #z1452007# (" + n4 + "枚纪念币)#l\r\n#L2# #z1452008# (" + n5 + "枚纪念币)#l\r\n#L3# #z1462005# (" + n3 + "枚纪念币)#l\r\n#L4# #z1462006# (" + n4 + "枚纪念币)#l\r\n#L5# #z1462007# (" + n5 + "枚纪念币)#l");
                } else if (select == 5) {
                    status = 40;
                    cm.sendSimple("选择你想兑换的武器。这里的武器都是最高品质的。选择最合你心意的吧！\r\n#b#L0# #z1472013# (" + n3 + "枚纪念币)#l\r\n#L1# #z1472017# (" + n4 + "枚纪念币)#l\r\n#L2# #z1472021# (" + n5 + "枚纪念币)#l\r\n#L3# #z1332014# (" + n3 + "枚纪念币)#l\r\n#L4# #z1332031# (" + n4 + "枚纪念币)#l\r\n#L5# #z1332011# (" + n4 + "枚纪念币)#l\r\n#L6# #z1332016# (" + n5 + "枚纪念币)#l\r\n#L7# #z1332003# (" + n5 + "枚纪念币)#l");
                } else if (select == 6) {
                    status = 50; //海盗奖励
                    cm.sendSimple("选择你想兑换的武器。这里的武器都是最高品质的。选择最合你心意的吧！\r\n#b#L0# #z1482005# (" + n3 + "枚纪念币)#l \r\n#b#L1# #z1482006# (" + n4 + "枚纪念币)#l \r\n#b#L2# #z1482007# (" + n5 + "枚纪念币)#l \r\n#b#L3# #z1492005# (" + n3 + "枚纪念币)#l \r\n#b#L4# #z1492006# (" + n4 + "枚纪念币)#l \r\n#b#L5# #z1492007# (" + n5 + "枚纪念币)#l");
                }
            } else if (status == 11) {
                if (selection == 12) {
                    cm.sendSimple("选择你想兑换的武器。这里的武器都非常实用。看看吧！\r\n#b#L0# #z1322015# (" + n3 + "枚纪念币)#l\r\n#L1# #z1422008# (" + n3 + "枚纪念币)#l\r\n#L2# #z1322016# (" + n4 + "枚纪念币)#l\r\n#L3# #z1422007# (" + n4 + "枚纪念币)#l\r\n#L4# #z1322017# (" + n5 + "枚纪念币)#l\r\n#L5# #z1422005# (" + n5 + "枚纪念币)#l\r\n#L6# #z1432003# (" + n3 + "枚纪念币)#l\r\n#L7# #z1442003# (" + n3 + "枚纪念币)#l\r\n#L8# #z1432005# (" + n4 + "枚纪念币)#l\r\n#L9# #z1442009# (" + n4 + "枚纪念币)#l\r\n#L10# #z1442005# (" + n5 + "枚纪念币)#l\r\n#L11# #z1432004# (" + n5 + "枚纪念币)#l\r\n#L12# 返回第一页 (2/2)#l");
                } else {
                    var item = [1302004, 1402006, 1302009, 1402007, 1302010, 1402003, 1312006, 1412004, 1312007, 1412005, 1312008, 1412003];
                    var cost = [n3, n3, n4, n4, n5, n5, n3, n3, n4, n4, n5];
                    if (cm.haveItem(4001129, cost[selection]) && cm.canHold(item[selection])) {
                        cm.gainItem(item[selection], 1);
                        cm.gainItem(4001129, -cost[selection]);
                        cm.dispose();
                    } else {
                        cm.sendOk("你的#b#t4001129##k不足，或者背包已满。请检查。");
                        cm.dispose();
                    }
                }
            } else if (status == 12) {
                if (selection == 12) {
                    status = 10;
                    cm.sendSimple("请确保你有足够的#b#t4001129##k兑换所需武器。选择你想兑换的武器。我这里的武器都非常棒，可不是我自卖自夸！\r\n#b#L0# #z1302004# (" + n3 + "枚纪念币)#l\r\n#L1# #z1402006# (" + n3 + "枚纪念币)#l\r\n#L2# #z1302009# (" + n4 + "枚纪念币)#l\r\n#L3# #z1402007# (" + n4 + "枚纪念币)#l\r\n#L4# #z1302010# (" + n5 + "枚纪念币)#l\r\n#L5# #z1402003# (" + n5 + "枚纪念币)#l\r\n#L6# #z1312006# (" + n3 + "枚纪念币)#l\r\n#L7# #z1412004# (" + n3 + "枚纪念币)#l\r\n#L8# #z1312007# (" + n4 + "枚纪念币)#l\r\n#L9# #z1412005# (" + n4 + "枚纪念币)#l\r\n#L10# #z1312008# (" + n5 + "枚纪念币)#l\r\n#L11# #z1412003# (" + n5 + "枚纪念币)#l\r\n#L12# 下一页 (1/2)#l");
                } else {
                    var item = [1322015, 1422008, 1322016, 1422007, 1322017, 1422005, 1432003, 1442003, 1432005, 1442009, 1442005, 1432004];
                    var cost = [n3, n3, n4, n4, n5, n5, n3, n3, n4, n4, n5, n5];
                    if (cm.haveItem(4001129, cost[selection]) && cm.canHold(item[selection])) {
                        cm.gainItem(item[selection], 1);
                        cm.gainItem(4001129, -cost[selection]);
                        cm.dispose();
                    } else {
                        cm.sendOk("你的#b#t4001129##k不足，或者背包已满。请检查。");
                        cm.dispose();
                    }
                }
            } else if (status == 21) {
                var item = [1372001, 1382018, 1372012, 1382019, 1382001, 1372007];
                var cost = [n3, n3, n4, n4, n5, n5];
                if (cm.haveItem(4001129, cost[selection]) && cm.canHold(item[selection])) {
                    cm.gainItem(item[selection], 1);
                    cm.gainItem(4001129, -cost[selection]);
                    cm.dispose();
                } else {
                    cm.sendOk("你的#b#t4001129##k不足，或者背包已满。请检查。");
                    cm.dispose();
                }
            } else if (status == 31) {
                var item = [1452006, 1452007, 1452008, 1462005, 1462006, 1462007];
                var cost = [n3, n4, n5, n3, n4, n5];
                if (cm.haveItem(4001129, cost[selection]) && cm.canHold(item[selection])) {
                    cm.gainItem(item[selection], 1);
                    cm.gainItem(4001129, -cost[selection]);
                    cm.dispose();
                } else {
                    cm.sendOk("你的#b#t4001129##k不足，或者背包已满。请检查。");
                    cm.dispose();
                }
            } else if (status == 41) {
                var item = [1472013, 1472017, 1472021, 1332014, 1332031, 1332011, 1332016, 1332003];
                var cost = [n3, n4, n5, n3, n4, n4, n5, n5];
                if (cm.haveItem(4001129, cost[selection]) && cm.canHold(item[selection])) {
                    cm.gainItem(item[selection], 1);
                    cm.gainItem(4001129, -cost[selection]);
                    cm.dispose();
                } else {
                    cm.sendOk("你的#b#t4001129##k不足，或者背包已满。请检查。");
                    cm.dispose();
                }
            } else if (status == 51) {
                var item = [1482005, 1482006, 1482007, 1492005, 1492006, 1492007];
                var cost = [n3, n4, n5, n3, n4, n5];
                if (cm.haveItem(4001129, cost[selection]) && cm.canHold(item[selection])) {
                    cm.gainItem(item[selection], 1);
                    cm.gainItem(4001129, -cost[selection]);
                    cm.dispose();
                } else {
                    cm.sendOk("你的#b#t4001129##k不足，或者背包已满。请检查。");
                    cm.dispose();
                }
            } else if (status == 61) {
                select = selection;
                if (selection == 0) {
                    cm.sendNext("哈哈！我是怪物嘉年华的主持人Spiegelmann。我在这里举办了第一届#b怪物嘉年华#k，等待像你这样的冒险者来参加这场盛会！");
                } else if (selection == 1) {
                    cm.sendNext("#b怪物嘉年华#k由两支队伍进入战场，击败对方召唤的怪物组成。#b通过获得的嘉年华点数(CP)来决定胜负#k。");
                } else if (selection == 2) {
                    cm.sendNext("进入嘉年华场地后，会出现怪物列表窗口。#b选择你想使用的怪物，点击确定#k即可。很简单吧？");
                } else {
                    cm.dispose();
                }
            } else if (status == 62) {
                if (select == 0) {
                    cm.sendNext("什么是#b怪物嘉年华#k？哈哈哈！可以说是一次难忘的体验！这是与其他冒险者之间的战斗！#k");
                } else if (select == 1) {
                    cm.sendNext("进入嘉年华场地后，你的任务是#b通过击败对方召唤的怪物获得CP，并用这些CP干扰对方队伍#k。");
                } else if (select == 2) {
                    cm.sendNext("熟悉操作后，可以尝试使用#bTAB和F1~F12键#k。#bTAB键切换怪物召唤/技能/保护者#k界面，#bF1~F12可以直接打开对应窗口#k。");
                }
            } else if (status == 63) {
                if (select == 0) {
                    cm.sendNext("我知道让你们用真武器互相战斗太危险了；我也不会建议这种野蛮行为。我提供的是比赛的刺激感，与强大对手竞争的兴奋感。你们队伍和对手队伍都#b召唤怪物，并击败对方召唤的怪物#k。这就是怪物嘉年华的精髓。此外，你还可以用嘉年华中获得的金币兑换新装备和武器！#k");
                } else if (select == 1) {
                    cm.sendNext("有三种干扰对手的方式：#b召唤怪物、使用技能、召唤保护者#k。如果想了解更多细节，可以查看'详细说明'！");
                } else if (select == 2) {
                    cm.sendNext("#b召唤#k怪物会召唤一只受你控制的怪物攻击对方队伍。使用CP召唤怪物，它会出现在同一区域攻击对方队伍。");
                }
            } else if (status == 64) {
                if (select == 0) {
                    cm.sendNext("当然，事情没那么简单。还有其他方法可以阻止对方击败怪物，这需要你自己去探索。怎么样？有兴趣来场友谊赛吗？");
                    cm.dispose();
                } else if (select == 1) {
                    cm.sendNext("请记住。保留CP从来不是个好主意。#b你使用的CP将帮助决定怪物嘉年华的胜负#k。");
                } else if (select == 2) {
                    cm.sendNext("#b技能#k是使用黑暗、虚弱等能力阻止对方击败怪物。不需要太多CP，但很有效。唯一问题是持续时间不长。明智地使用这个策略！");
                }
            } else if (status == 65) {
                if (select == 1) {
                    cm.sendNext("哦，不用担心死亡惩罚。在怪物嘉年华中，#b死亡不会损失经验值#k。所以这确实是一次独特的体验！");
                    cm.dispose();
                } else if (select == 2) {
                    cm.sendNext("#b保护者#k是一种召唤物，能大幅增强你方召唤的怪物能力。保护者会一直存在直到被对方摧毁，所以我建议你先召唤几只怪物，再召唤保护者。");
                }
            } else if (status == 66) {
                cm.sendNext("最后，在怪物嘉年华中，#b不能使用随身携带的物品/恢复药水#k。同时，怪物会掉落这些物品。#b拾取后物品会立即生效#k。所以掌握拾取时机很重要。");
                cm.dispose();
            } else if (status == 77) {
                var allDone;

                if (selection == 0) {
                    allDone = refineItems(0); // 矿物
                } else if (selection == 1) {
                    allDone = refineItems(1); // 宝石
                } else if (selection == 2 && refineCrystals) {
                    allDone = refineItems(2); // 水晶
                } else if (selection == 2 && !refineCrystals || selection == 3) {
                    allDone = refineRockItems(); // 月石/星石
                }

                if (allDone) {
                    cm.sendOk("完成。感谢惠顾~");
                } else {
                    cm.sendOk("完成。请注意有些物品#r无法精炼#k，可能是因为其它栏空间不足或金币不够支付费用。");
                }
                cm.dispose();
            }
        }
    }
}

function getRefineFee(fee) {
    return ((feeMultiplier * fee) | 0);
}

function isRefineTarget(refineType, refineItemid) {
    if (refineType == 0) { //mineral refine
        return refineItemid >= 4010000 && refineItemid <= 4010007 && !(refineItemid == 4010007 && !refineSpecials);
    } else if (refineType == 1) { //jewel refine
        return refineItemid >= 4020000 && refineItemid <= 4020008 && !(refineItemid == 4020008 && !refineSpecials);
    } else if (refineType == 2) { //crystal refine
        return refineItemid >= 4004000 && refineItemid <= 4004004 && !(refineItemid == 4004004 && !refineSpecials);
    }

    return false;
}

function getRockRefineTarget(refineItemid) {
    if (refineItemid >= 4011000 && refineItemid <= 4011006) {
        return 0;
    } else if (refineItemid >= 4021000 && refineItemid <= 4021008) {
        return 1;
    }

    return -1;
}

function refineItems(refineType) {
    var allDone = true;

    var refineFees = [[300, 300, 300, 500, 500, 500, 800, 270], [500, 500, 500, 500, 500, 500, 500, 1000, 3000], [5000, 5000, 5000, 5000, 1000000]];
    var itemCount = {};

    const InventoryType = Java.type('org.gms.client.inventory.InventoryType');
    var iter = cm.getPlayer().getInventory(InventoryType.ETC).iterator();
    while (iter.hasNext()) {
        var it = iter.next();
        var itemid = it.getItemId();

        if (isRefineTarget(refineType, itemid)) {
            var ic = itemCount[itemid];

            if (ic != undefined) {
                itemCount[itemid] += it.getQuantity();
            } else {
                itemCount[itemid] = it.getQuantity();
            }
        }
    }

    for (var key in itemCount) {
        var itemqty = itemCount[key];
        var itemid = parseInt(key);

        var refineQty = ((itemqty / 10) | 0);
        if (refineQty <= 0) {
            continue;
        }

        while (true) {
            itemqty = refineQty * 10;

            var fee = getRefineFee(refineFees[refineType][(itemid % 100) | 0] * refineQty);
            if (cm.canHold(itemid + 1000, refineQty, itemid, itemqty) && cm.getMeso() >= fee) {
                cm.gainMeso(-fee);
                cm.gainItem(itemid, -itemqty);
                cm.gainItem(itemid + (itemid != 4010007 ? 1000 : 1001), refineQty);

                break;
            } else if (refineQty <= 1) {
                allDone = false;
                break;
            } else {
                refineQty--;
            }
        }
    }

    return allDone;
}

function refineRockItems() {
    var allDone = true;
    var minItems = [[0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0]];
    var minRocks = [2147483647, 2147483647];

    var rockItems = [4011007, 4021009];
    var rockFees = [10000, 15000];

    const InventoryType = Java.type('org.gms.client.inventory.InventoryType');
    var iter = cm.getPlayer().getInventory(InventoryType.ETC).iterator();
    while (iter.hasNext()) {
        var it = iter.next();
        var itemid = it.getItemId();
        var rockRefine = getRockRefineTarget(itemid);
        if (rockRefine >= 0) {
            var rockItem = ((itemid % 100) | 0);
            var itemqty = it.getQuantity();

            minItems[rockRefine][rockItem] += itemqty;
        }
    }

    for (var i = 0; i < minRocks.length; i++) {
        for (var j = 0; j < minItems[i].length; j++) {
            if (minRocks[i] > minItems[i][j]) {
                minRocks[i] = minItems[i][j];
            }
        }
        if (minRocks[i] <= 0 || minRocks[i] == 2147483647) {
            continue;
        }

        var refineQty = minRocks[i];
        while (true) {
            var fee = getRefineFee(rockFees[i] * refineQty);
            if (cm.canHold(rockItems[i], refineQty) && cm.getMeso() >= fee) {
                cm.gainMeso(-fee);

                var j;
                if (i == 0) {
                    for (j = 4011000; j < 4011007; j++) {
                        cm.gainItem(j, -refineQty);
                    }
                    cm.gainItem(j, refineQty);
                } else {
                    for (j = 4021000; j < 4021009; j++) {
                        cm.gainItem(j, -refineQty);
                    }
                    cm.gainItem(j, refineQty);
                }

                break;
            } else if (refineQty <= 1) {
                allDone = false;
                break;
            } else {
                refineQty--;
            }
        }
    }

    return allDone;
}