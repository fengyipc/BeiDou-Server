/**
 * 功能：查询物品掉落的怪物及其爆率
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2025-04-04
 */

let CommandsExecutor;

function start() {
    if (!CommandsExecutor) CommandsExecutor = Java.type('org.gms.client.command.CommandsExecutor');
    let text = "请选择要查询的扭蛋机所在城镇：\r\n";
    text += "#L1#射手村#l\r\n";
    text += "#L2#魔法密林#l\r\n";
    text += "#L3#勇士部落#l\r\n";
    text += "#L4#废弃都市#l\r\n";
    text += "#L5#林中之城#l\r\n";
    text += "#L6#古代神社#l\r\n";
    text += "#L7#昭和村更衣室(男)#l\r\n";
    text += "#L8#昭和村更衣室(女)#l\r\n";
    text += "#L9#新叶城#l\r\n";
    text += "#L10#诺特勒斯#l\r\n";
    cm.sendSelectLevel(text);
}

function level1() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 射手村");
    cm.dispose();
}
function level2() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 魔法密林");
    cm.dispose();
}
function level3() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 勇士部落");
    cm.dispose();
}
function level4() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 废弃都市");
    cm.dispose();
}
function level5() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 林中之城");
    cm.dispose();
}
function level6() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 古代神社");
    cm.dispose();
}
function level7() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 昭和村更衣室(男)");
    cm.dispose();
}
function level8() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 昭和村更衣室(女)");
    cm.dispose();
}
function level9() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 新叶城");
    cm.dispose();
}
function level10() {
    CommandsExecutor.getInstance().handle(cm.getClient(), "!gacha 诺特勒斯");
    cm.dispose();
}
