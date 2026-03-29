var status = -1;
var exchangeItem = 4000439;

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == 1) {
        status++;
    } else {
        cm.dispose();
        return;
    }
    if (status == 0) {
        cm.sendSimple("我的名字是#p2131001#，我是这个地方最强大的魔法师。#b\r\n#L0#嘿，拿着这些碎石。你可以用你的魔法对它们施展。#l");
    } else if (status == 1) {
        if (!cm.haveItem(exchangeItem, 100)) {
            cm.sendNext("你没有足够的... 我至少需要100个。");
            cm.dispose();
        } else {
            // thanks yuxaij for noticing a few methods having parameters not matching the expected Math library function parameter types
            cm.sendGetNumber("嘿，这主意不错！每给我 100 个#i，我可以给你 #i4310000#完美音调" + exchangeItem + "##t" + exchangeItem + "# 你给我的。你想要多少个？（当前物品： " + cm.itemQuantity(exchangeItem) + ")", Math.min(300, cm.itemQuantity(exchangeItem) / 100), 1, Math.min(300, cm.itemQuantity(exchangeItem) / 100));
        }
    } else if (status == 2) {
        if (selection >= 1 && selection <= cm.itemQuantity(exchangeItem) / 100) {
            if (!cm.canHold(4310000, selection)) {
                cm.sendOk("请在杂项标签页中腾出一些空间。");
            } else {
                cm.gainItem(4310000, selection);
                cm.gainItem(exchangeItem, -(selection * 100));
                cm.sendOk("谢谢！");
            }
        }
        cm.dispose();
    }
}