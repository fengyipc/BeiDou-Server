var status = -1;
var exchangeItem = 4000437;

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
        cm.sendSimple("伤员这么多，药却不够……#b\r\n#L0#喂，把这些黑色孢子拿去吧。用它们能做出更好的药。#l");
    } else if (status == 1) {
        if (!cm.haveItem(exchangeItem, 100)) {
            cm.sendNext("你没有足够的... 我至少需要100个。");
            cm.dispose();
        } else {
            cm.sendGetNumber("嘿，这主意不错！每给我 100 个#i，我可以给你 #i4310000#完美音调" + exchangeItem + "##t" + exchangeItem + "#你给我。你想要多少个？（当前持有：" + cm.itemQuantity(exchangeItem) + ")", Math.min(300, cm.itemQuantity(exchangeItem) / 100), 1, Math.min(300, cm.itemQuantity(exchangeItem) / 100));
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