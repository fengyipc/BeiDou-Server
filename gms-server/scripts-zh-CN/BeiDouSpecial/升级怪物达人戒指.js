/**
 * 功能： 升级怪物达人戒指
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2025-04-30
 */

const RING_ITEM = [1112330, 1112331, 1112332, 1112333, 1112334, 1112335, 1112336, 1112337, 1112338];

// 彩色蜗牛壳, 蘑菇王芽孢, 毒菇, 战甲吹泡泡鱼的内存卡，歇尔夫的珍珠, 格瑞芬多角, 喷火龙的尾巴, 帕普拉特斯之发
const BOSS_ITEM = [2210006, 4000040, 4000176, 4000124, 4032474, 4000243, 4000235, 4031901];
const BOSS_ITEM_NUM = [10, 10, 10, 5, 5, 3, 3, 1];
const Other_ITEM = [4021000, 4021001, 4021003, 4021004, 4021005];
const Other_ITEM_NUM = [2, 4, 6, 8, 10];
let currentRingItemIndex = -1;
let currentCardNum = 0;
let Server;
function start() {
    currentCardNum = cm.getPlayer().getFullMonsterCards();
    let text = '#e通过完成收集怪物卡可以升级你的怪物达人戒指#n\r\n';
    text += '当前已收集的怪物卡数：#r#e' + currentCardNum + '张#n#k\r\n\r\n';
    text += '#n1. 初始时你可以领取一个#e#z'+ RING_ITEM[0] + '##n\r\n';
    text += '#n2. 每收集40张怪物卡，可以升级一次戒指星级\r\n';
    text += '#d' + '\r\n'.padStart(28,'——') + '#k';

    currentRingItem = RING_ITEM.findIndex(item => hasItem(item));
    if (currentRingItem === -1) {
        text += '#L0#领取初始怪物达人戒指#l\r\n';
    } else {
        text += '#L1#升级怪物达人戒指#l\r\n'
    }
    cm.sendSelectLevel(text);
}

function level0() {
    if (RING_ITEM.some(item => hasItem(item))) {
        cm.sendOk("你已经拥有了怪物达人戒指，请继续努力完成怪物升级它吧！");
    } else if (!cm.canHold(RING_ITEM[0], 1)) {
        cm.sendOk("首先检查你的装备栏是否有空位。");
    } else {
        cm.gainItem(RING_ITEM[0], 1);
        cm.sendOk('#e#z'+ RING_ITEM[0] + '#已经发放到你的背包了，请努力收集怪物卡升级它吧！');
   }
   cm.dispose();
}

function level1() {
    const levelCards = Math.min(currentCardNum - currentRingItem * 40, 40);

    let text = '当前已收集的怪物卡数：#r#e' + currentCardNum + '张#n#k\r\n';
    text += '当前拥有：#b#z' + RING_ITEM[currentRingItem]+ '##k#n\r\n';
    text += '#d' + '\r\n'.padStart(28,'——') + '#k';

    if (currentRingItem >= 8) {
        text += '你已经升级满星怪物卡戒指，继续努力战斗吧！';
        cm.sendOk(text);
    }

    text += (currentRingItem + 1) + '星怪物卡收集进度：#B' + (levelCards/0.4) + "#\t";

    canUpgrade = levelCards === 40;
    if (canUpgrade) {
        text += '可以升级戒指啦！\r\n\r\n'
    } else {
        text += '还差' + (40 - levelCards) + '张怪物卡\r\n\r\n';
    }

    text += '额外所需材料：';
    text += '#v' + BOSS_ITEM[currentRingItem] + "#" + BOSS_ITEM_NUM[currentRingItem] + "个\t";
    if (Other_ITEM[currentRingItem]) {
        text += '#v' + Other_ITEM[currentRingItem] + "#" + Other_ITEM_NUM[currentRingItem] + "个\r\n";
    } else {
        text += '\r\n';
    }

    if (!canUpgrade) {
        cm.sendOk(text);
        return;
    }

    text += '#L3#升级' + (currentRingItem + 1) + '星怪物达人戒指#l\r\n'
    cm.sendSelectLevel(text);
}

function level3() {
    if (currentRingItem === -1) {
        cm.sendOk("你还没有怪物达人戒指，请先领取初始怪物达人戒指吧");
        return;
    }
    if (!cm.hasItem(BOSS_ITEM[currentRingItem], BOSS_ITEM_NUM[currentRingItem]) ||
    (Other_ITEM[currentRingItem] && !cm.hasItem(Other_ITEM[currentRingItem], Other_ITEM_NUM[currentRingItem]))) {
        cm.sendOk("你当前拥有的升级材料不足，请检查你的背包！");
    } else if (cm.getPlayer().haveItemEquipped(RING_ITEM[currentRingItem])) {
        cm.sendOk("请先取下你的怪物达人戒指放置在背包后再尝试升级！");
    } else {
        cm.gainItem(BOSS_ITEM[currentRingItem], -BOSS_ITEM_NUM[currentRingItem]);
        if (Other_ITEM[currentRingItem]) cm.gainItem(Other_ITEM[currentRingItem], -Other_ITEM_NUM[currentRingItem]);
        cm.gainItem(RING_ITEM[currentRingItem], -1);
        cm.gainItem(RING_ITEM[currentRingItem + 1], 1);
        if (!Server) Server = Java.type("org.gms.net.server.Server");
        cm.sendOk("已成功将你的戒指升级为#e#z" + RING_ITEM[currentRingItem + 1] + "##n,请继续努力！");
        const msg = "[怪物达人戒指]" + " : 恭喜玩家" + player.getName() + "将怪物达人戒指升级至" + (currentRingItem + 1) + "星";
    }
}
function hasItem(item) {
    return cm.getPlayer().haveItemEquipped(item) || cm.hasItem(item);
}