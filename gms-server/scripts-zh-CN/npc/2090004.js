/* @author aaroncsn <MapleSea Like>
 * @author Ronan
	NPC Name: 		Mr. Do
	Map(s): 		Mu Lung: Mu Lung(2500000000)
	Description: 		Potion Creator
 */

var status = 0;
var selectedType = -1;
var selectedItem = -1;
var item;
var mats;
var matQty;
var matMeso;
var rewdSet;
var makeQty = 1;

var itemSet;
var matSet;
var matQtySet;
var matQtyMeso;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == 1) {
        status++;
    } else {
        cm.sendOk("哦，等你决定好要从我这里得到什么再来和我谈吧。我现在很忙。");
        cm.dispose();
        return;
    }

    if (status == 0) {
        if (cm.isQuestActive(3821) && !cm.haveItem(4031554) && !cm.haveItem(4161030) && cm.isQuestCompleted(3830)) {
            //player lost his book, help him complete quest anyways

            if (cm.canHold(4031554)) {
                cm.sendOk("哦，那个男孩让你给他带一个#t4031554#？没问题，反正我还欠他个人情呢。现在，告诉他我在还人情，好吗？");
                cm.gainItem(4031554, 1);
                cm.dispose();
                return;
            } else {
                cm.sendOk("哦，那个男孩让你给他带一个#t4031554#？先在你的其他物品栏腾出空间吧。");
                cm.dispose();
                return;
            }
        }
        var selStr = "我是个多才多艺的人，告诉我你想做什么。#b"
        var options = ["制作药剂", "制作卷轴", "捐赠药剂材料"];
        for (var i = 0; i < options.length; i++) {
            selStr += "\r\n#L" + i + "# " + options[i] + "#l";
        }

        cm.sendSimple(selStr);
    } else if (status == 1) {
        selectedType = selection;
        var selStr;
        if (selectedType == 0) { //制作药剂
            itemSet = [2022145, 2022146, 2022147, 2022148, 2022149, 2022150, 2050004, 4031554];
            matSet = [2022116, 2022116, [4000281, 4000293], [4000276, 2002005], [4000288, 4000292], 4000295, [2022131, 2022132], [4000286, 4000287, 4000293]];
            matQtySet = [3, 3, [10, 10], [20, 1], [20, 20], 10, [1, 1], [20, 20, 20]];
            matQtyMeso = [0, 0, 910, 950, 1940, 600, 700, 1000];

            if (!cm.haveItem(4161030)) {
                cm.sendNext("如果你想制作药剂，你必须先学习《药材组合书》。没有什么比在没有适当知识的情况下制作药剂更危险的了。");
                cm.dispose();
                return;
            }

            selStr = "你对制作哪种药剂感兴趣？#b";

            for (var i = 0; i < itemSet.length; i++) {
                selStr += "\r\n#L" + i + "# #v" + itemSet[i] + "# #t" + itemSet[i] + "##l";
            }
            selStr += "#k";
        } else if (selectedType == 1) { //制作卷轴
            status++;

            selStr = "你对制作哪种卷轴感兴趣？#b";
            itemSet = [2043000, 2043100, 2043200, 2043300, 2043700, 2043800, 2044000, 2044100, 2044200, 2044300, 2044400, 2044500, 2044600, 2044700, 2044800, 2044900];

            for (var i = 0; i < itemSet.length; i++) {
                selStr += "\r\n#L" + i + "# #v" + itemSet[i] + "# #t" + itemSet[i] + "##l";
            }
        } else {//捐赠药剂材料
            status++;

            selStr = "所以你想捐赠一些药剂材料？这真是个好消息！捐赠将以#b100#k为单位接受。捐赠者将获得一颗能制作卷轴的弹珠。你想捐赠以下哪种材料？#b";
            itemSet = [4000276, 4000277, 4000278, 4000279, 4000280, 4000291, 4000292, 4000286, 4000287, 4000293, 4000294, 4000298, 4000284, 4000288, 4000285, 4000282, 4000295, 4000289, 4000296, 4000297];

            for (var i = 0; i < itemSet.length; i++) {
                selStr += "\r\n#L" + i + "# #v" + itemSet[i] + "# #t" + itemSet[i] + "##l";
            }
        }

        cm.sendSimple(selStr);
    } else if (status == 2) {
        selectedItem = selection;
        cm.sendGetText("你想制作多少个#b#t" + itemSet[selectedItem] + "##k？");
    } else if (status == 3) {
        if (selectedType == 0) { //药剂
            var text = cm.getText();
            makeQty = parseInt(text);
            if (isNaN(makeQty)) {
                makeQty = 1;
            }

            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            matMeso = matQtyMeso[selectedItem];

            var prompt = "你想制作#b" + makeQty + "个 #t" + item + "##k？为了制作" + makeQty + "个 #t" + item + "#，你需要以下物品：\r\n";
            if (mats instanceof Array) {
                for (var i = 0; i < mats.length; i++) {
                    prompt += "\r\n#i" + mats[i] + "# " + matQty[i] * makeQty + "个 #t" + mats[i] + "#";
                }
            } else {
                prompt += "\r\n#i" + mats + "# " + matQty * makeQty + "个 #t" + mats + "#";
            }

            if (matMeso > 0) {
                prompt += "\r\n#i4031138# " + matMeso * makeQty + " 金币";
            }

            cm.sendYesNo(prompt);
        } else if (selectedType == 1) { //卷轴
            selectedItem = selection;

            itemSet = [2043000, 2043100, 2043200, 2043300, 2043700, 2043800, 2044000, 2044100, 2044200, 2044300, 2044400, 2044500, 2044600, 2044700, 2044800, 2044900];
            matSet = [[4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001],
                [4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001],
                [4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001], [4001124, 4010001]];
            matQtySet = [[100, 10], [100, 10], [100, 10], [100, 10], [100, 10], [100, 10], [100, 10],
                [100, 10], [100, 10], [100, 10], [100, 10], [100, 10], [100, 10], [100, 10], [100, 10],
                [100, 10]];
            item = itemSet[selectedItem];
            mats = matSet[selectedItem];
            matQty = matQtySet[selectedItem];
            var prompt = "你想制作#b#t" + item + "##k？为了制作 #t" + item + "#，你需要以下物品：";
            if (mats instanceof Array) {
                for (var i = 0; i < mats.length; i++) {
                    prompt += "\r\n#i" + mats[i] + "# " + matQty[i] + "个 #t" + mats[i] + "#";
                }
            } else {
                prompt += "\r\n#i" + mats + "# " + matQty + "个 #t" + mats + "#";
            }

            cm.sendYesNo(prompt);
        } else if (selectedType == 2) {
            selectedItem = selection;

            itemSet = [4000276, 4000277, 4000278, 4000279, 4000280, 4000291, 4000292, 4000286, 4000287, 4000293, 4000294, 4000298, 4000284, 4000288, 4000285, 4000282, 4000295, 4000289, 4000296, 4000297];
            rewdSet = [7, 7, [7, 8], 10, 11, 8, [7, 8], [7, 9], [7, 8], 9, 10, [10, 11], 11, [11, 12], 13, 13, 14, 15, [15, 16], 17];

            item = itemSet[selectedItem];
            var prompt = "你确定要捐赠#b100个 #t" + item + "##k吗？";
            cm.sendYesNo(prompt);
        }
    } else if (status == 4) {
        if (selectedType == 0) {
            var complete = true;
            if (mats instanceof Array) {
                for (var i = 0; i < mats.length; i++) {
                    if (!cm.haveItem(mats[i], matQty[i] * makeQty)) {
                        complete = false;
                    }
                }
            } else {
                if (!cm.haveItem(mats, matQty * makeQty)) {
                    complete = false;
                }
            }

            if (cm.getMeso() < matMeso * makeQty) {
                complete = false;
            }

            if (!complete || !cm.canHold(item, makeQty)) {
                cm.sendOk("请确保你既不缺少材料，同时在消耗品栏有足够的空间。");
            } else {
                if (mats instanceof Array) {
                    for (var i = 0; i < mats.length; i++) {
                        cm.gainItem(mats[i], -matQty[i] * makeQty);
                    }
                } else {
                    cm.gainItem(mats, -matQty * makeQty);
                }

                if (matMeso > 0) {
                    cm.gainMeso(-matMeso * makeQty);
                }
                cm.gainItem(item, makeQty);
            }

            cm.dispose();
        } else if (selectedType == 1) {
            var complete = true;
            if (mats instanceof Array) {
                for (var i = 0; i < mats.length; i++) {
                    if (!cm.haveItem(mats[i], matQty[i])) {
                        complete = false;
                    }
                }
            } else {
                if (!cm.haveItem(mats, matQty)) {
                    complete = false;
                }
            }

            if (Math.random() >= 0.9) //A lucky find! Scroll 60%
            {
                item += 1;
            }

            if (!complete || !cm.canHold(item, 1)) {
                cm.sendOk("请确保你既不缺少材料，同时在消耗品栏有足够的空间。");
            } else {
                if (mats instanceof Array) {
                    for (var i = 0; i < mats.length; i++) {
                        cm.gainItem(mats[i], -matQty[i]);
                    }
                } else {
                    cm.gainItem(mats, -matQty);
                }

                cm.gainItem(item, 1);
            }

            cm.dispose();
        } else if (selectedType == 2) {
            var complete = true;

            if (!cm.haveItem(item, 100)) {
                complete = false;
            }

            if (!complete) {
                cm.sendOk("请确保你既不缺少材料，同时在其他物品栏有足够的空间。");
                cm.dispose();
                return;
            }

            var reward;
            if (rewdSet[selectedItem] instanceof Array) {
                var length = rewdSet[selectedItem][1] - rewdSet[selectedItem][0];
                reward = rewdSet[selectedItem][0] + Math.round(Math.random() * length);
            } else {
                reward = rewdSet[selectedItem];
            }

            if (!cm.canHold(4001124, reward)) {
                cm.sendOk("请确保你既不缺少材料，同时在其他物品栏有足够的空间。");
            } else {
                cm.gainItem(item, -100);
                cm.gainItem(4001124, reward);
            }

            cm.dispose();
        }
    }
}
