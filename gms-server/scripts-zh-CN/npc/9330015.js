/**
 * NPC 屈原 9330015
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2025-05-30
 */

const 粽子 = 4001449;
const 奖励 = [2022784, 2022785, 2022786, 2022138, 2022071, 1302080, 3010078];
const 数量 = [1, 2, 3, 5, 10, 100, 200];

let chooseItem = 0;
function start() {
    levelStart();
}

function levelStart() {
    let text = "五月初五，粽叶飘香。勇者啊，你可愿助我收集散落各地的端午香粽吗？这些#b#z" + 粽子 + "##k沾染了魔物的浊气，需以正气净化。\r\n";
    text += "#L0##b这些粽子有什么特别之处？#l\r\n#L1#需要多少粽子？能换什么奖励？#l\r\n#L2#我这有粽子送给你#l\r\n";
    cm.sendSelectLevel(text);
}

function level0() {
    cm.sendNextLevel("Start", "此粽以艾叶裹米，本是祭奠之礼。如今魔物夺之，若任其沾染邪气，恐生祸端。每夺回一枚，我便以诗书之力为你祈福");
}

function level1() {
    let text = "凡献上香粽者，皆可得谢礼：\r\n";
    text += '#d' + '\r\n'.padStart(28,'——') + '#k';
    for (let i = 0; i < 6; i++) {
        text += 数量[i] + "个#b#z" + 粽子 + "##k可获赠#r#z" + 奖励[i] + "##k\r\n";
    }
    text += "若集齐200个，另有#r#e秘宝相赠#k!\r\n";
    cm.sendNextLevel("Start", text);
}

function level2() {
    let text = "你想要用粽子兑换什么礼品呢？\r\n\r\n";
    for (let i = 0; i < 6; i++) {
        text += "#L" + i +"#我想要兑换#z" + 奖励[i] + "##v" + 奖励[i] + "##l\r\n";
    }
    text += "\r\n#L6#我想要用200个粽子兑换#r#e隐藏奖励#k#l\r\n";
    cm.sendNextSelectLevel("Change", text);
}


function levelChange(choose) {
    chooseItem = choose;
    if (choose < 6) {
        let text = "请输入你想要兑换的#z" + 奖励[choose] + "##v" + 奖励[choose] + "#个数：\r\n";
        cm.getInputNumberLevel("ChangeNum", text, 1, 0, 999);
    } else {
        levelChangeNum(1);
    }
}

function levelChangeNum(num) {
    if (!cm.hasItem(粽子, 数量[chooseItem] * num)) {
        cm.sendOk("你没有这么多粽子，别来消遣我了~");
        cm.dispose();
    } else if (!cm.canHold(奖励[chooseItem], num)) {
        cm.sendOk("检查一下你的背包空间？放不下我的赠礼了~");
        cm.dispose();
    } else if (chooseItem === 6 && cm.hasItem(奖励[6])) {
        cm.sendOk("你已经拥有我的神秘奖励#z"  + 奖励[6] + "##v" + 奖励[6] + "#了，兑换其它奖励吧！");
        cm.dispose();
    } else {
        cm.gainItem(粽子, - 数量[chooseItem] * num);
        cm.gainItem(奖励[chooseItem], num)
        cm.sendOk("路漫漫其修远兮……感谢你净化这些粽子。请收下这份心意!");
        cm.dispose();
    }
}