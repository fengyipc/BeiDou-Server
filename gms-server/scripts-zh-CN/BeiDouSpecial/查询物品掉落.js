/**
 * 功能：查询物品掉落的怪物及其爆率
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2025-04-03
 */

const MAX_ITEM_NUM = 5;

let ItemInformationProvider;
let MonsterInformationProvider;

function start() {
    if (!ItemInformationProvider) {
        ItemInformationProvider = Java.type('org.gms.server.ItemInformationProvider');//导入 物品信息 类
        MonsterInformationProvider = Java.type('org.gms.server.life.MonsterInformationProvider');//导入 怪物信息 类
    }
    // 玩家输完数字后，会自动调用level1，并且将输入的字符串传入
    cm.getInputTextLevel("1", "请输入物品名称：");
}

function level1(inputText) {
    const jsItemList = getItemListByName(inputText);
    let text = "";
    jsItemList.forEach(item => {
      text += "#b#e#z" + item.id + "#: #k#n #v" + item.id + "# 掉落怪物列表：\r\n";
      text += '#d' + '\r\n'.padStart(28,'——') + '#k';
      const MobList = getWhoDrops(item.id);
      MobList.forEach(mob => {
        text += mob + " \r\n";
      });
    });
    cm.sendOk(text);
}

// 根据输入的物品名模糊搜索获取物品列表转换为js数组，前五个
function getItemListByName(name) {
    const itemList = ItemInformationProvider.getInstance().getItemDataByName(name);
    let jsItemList = [];
    for (var i = 0; i < itemList.size(); i++) {
        var pair = itemList.get(i);
        jsItemList.push({ id: pair.left, name: pair.right });
    }
    jsItemList.sort(function(a, b) {
        return a.name.length - b.name.length;
    });
    return jsItemList.slice(0, MAX_ITEM_NUM);
}

// 获取物品掉落的怪物列表，并转换为js数组
function getWhoDrops(itemID) {
    const mobSet = ItemInformationProvider.getInstance().getWhoDrops(itemID);
    return Array.from(mobSet);
}
//    return Array.from(mobSet).reduce((acc, mob) => {
//        const mobInfo = MonsterInformationProvider.getMobsIDsFromName(mob)[0];
//        acc.push({ id: mobInfo.left, name: mobInfo.right });
//        return acc;
//    }, []);
//}