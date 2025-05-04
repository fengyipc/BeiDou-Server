/**
 * 功能： 升级任务达人戒指
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2025-04-11
 */

const RING_ITEM = [1112320, 1112321, 1112322, 1112323, 1112324, 1112325, 1112326, 1112327, 1112328];
let Server;
function start() {
    let text = '#e通过完成任务可以升级你的任务达人戒指#n\r\n';
    text += '当前已完成任务数：' + cm.getPlayer().getCompletedQuests().length + '个\r\n\r\n';
    text += '#n1. 初始时你可以领取一个#e#z'+ RING_ITEM[0] + '##n\r\n';
    text += '#n2. 每完成100个任务，可以升级一次戒指星级\r\n';
    text += '#d' + '\r\n'.padStart(28,'——') + '#k';
    // 玩家输完数字后，会自动调用level1，并且将输入的字符串传入
    text += '#L0#领取初始任务达人戒指#l\r\n';
    text += '#L1#升级任务达人戒指#l\r\n'
    cm.sendSelectLevel(text);
}

function level0() {
    if (RING_ITEM.some(item => hasItem(item))) {
        cm.sendOk("你已经拥有了任务达人戒指，请继续努力完成任务升级它吧！");
    } else if (!cm.canHold(RING_ITEM[0], 1)) {
        cm.sendOk("首先检查你的装备栏是否有空位。");
    } else {
        cm.gainItem(RING_ITEM[0], 1);
        cm.sendOk('#e#z'+ RING_ITEM[0] + '#已经发放到你的背包了，请努力完成任务升级它吧！');
   }
   cm.dispose();
}

function level1() {
    const questNum = cm.getPlayer().getCompletedQuests().length;
    const level = Math.floor(questNum / 100);
    const itemID_index = RING_ITEM.findIndex(item => hasItem(item))
    if (itemID_index === -1) {
        cm.sendOk("你还没有任务达人戒指，请先领取初始任务达人戒指吧");
    } else if (itemID_index === 8) {
        cm.sendOk("你已经升级满星任务达人戒指，继续努力战斗吧！")
    } else if (itemID_index === level) {
        cm.sendOk("你当前完成任务"+questNum+"个，已拥有#e#z" + RING_ITEM[itemID_index] + "##n，暂时不可升级，请努力完成任务升级它吧！");
    } else if (cm.getPlayer().haveItemEquipped(RING_ITEM[itemID_index])) {
        cm.sendOk("请先取下你的任务达人戒指放置在背包后再尝试升级！");
    } else {
        cm.gainItem(RING_ITEM[itemID_index], -1);
        cm.gainItem(RING_ITEM[level], 1);
        cm.sendOk("已成功将你的戒指升级为#e#z" + RING_ITEM[level] + "##n,请继续努力！");
        if (!Server) Server = Java.type("org.gms.net.server.Server");
        const msg = "[任务达人戒指]" + " : 恭喜玩家" + player.getName() + "将任务达人戒指升级至" + level + "星";
        Server.getInstance().broadcastMessage(player.getWorld(), PacketCreator.serverNotice(2, player.getClient().getChannel(), msg));
    }
    cm.dispose();
}
function hasItem(item) {
    return cm.getPlayer().haveItemEquipped(item) || cm.hasItem(item);
}