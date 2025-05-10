/**
 * 功能：查询物品掉落的怪物及其爆率
 * 作者：maplepeng
 * 版本：1.0
 * 日期：2025-04-03
 */

const MAX_ITEM_NUM = 20;

let ItemInformationProvider;
let MonsterInformationProvider;
let LifeFactory;

function start() {
    if (!ItemInformationProvider) {
        ItemInformationProvider = Java.type('org.gms.server.ItemInformationProvider');//导入 物品信息 类
        MonsterInformationProvider = Java.type('org.gms.server.life.MonsterInformationProvider');//导入 怪物信息 类
        LifeFactory = Java.type('org.gms.server.life.LifeFactory');
    }
    levelMain();
}

function levelMain() {
    cm.getInputTextLevel("Input", "请输入物品名称：");
}

function levelInput(inputText) {
    if (!inputText || inputText === ' ') {
        cm.sendLastLevel("Main", "输入为空,请重新输入！")
        return;
    }
    const jsItemList = getItemListByName(inputText);
    if (jsItemList.length === 0) {
        cm.sendLastLevel("Main", "未找到物品,请重新输入！")
        return;
    }

    let text = "以下是查找到的物品\r\n点击可以查询详细掉落怪物和倍率：\r\n";
    text  += '#d' + '\r\n'.padStart(28,'——') + '#k';
    let printItem = 0;
    for (const item of jsItemList) {
        text += "#L"+ item.id + "##b#e#z" + item.id + "#: #k#n #v" + item.id + "#\r\n";
        printItem += 1;
        if (printItem >= MAX_ITEM_NUM) break;
    }

    cm.sendNextSelectLevel("ShowDropList", text);
}

function levelShowDropList(itemID) {
    const droppers = getDropperAndRates(itemID);
    if (droppers.length === 0) {
        cm.sendOk("没有怪物掉落此物品！");
        cm.dispose();
        return;
    }

    let text = "#b#e#z" + itemID + "#: #k#n #v" + itemID + "#  由以下怪物掉落\r\n";
    let size = droppers.reduce((max, dropper) => Math.max(max, dropper.mob.getName().length), 0);  //取最长怪物名称长度
    text += '怪物名'.padEnd(size, '\t') + '爆率（爆率以实际地图查询为准）\r\n'
    text  += '#d' + '\r\n'.padStart(28,'——') + '#k';
    for (const dropper of droppers) {
        const mob = dropper.mob;
        const image = getMobImage(mob);
        if (image === null) continue;
        text += getMobImage(mob) + "\r\n"
        text += mob.getName().padEnd(size, '\t') + dropper.rate + "%\r\n\r\n";
    }

    cm.sendOk(text);
    cm.dispose();
}01

// 根据输入的物品名模糊搜索获取物品列表转换为js数组
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
    return jsItemList;
}

/**
 * 以下函数在某些特定的情况下可能会导致客户端闪退
 * @param mob
 * @returns {string}
 */
function getMobImage(mob){
    let type = [null,'stand','fly']
        type = type[mob.getStats().getMovetype() + 1];    //-1=未知类型，0=陆地类型，1=飞天类型
    if(type == null) {
        return null;     //没有怪物图片时不显示
    } else if (mob.getStats().getImgwidth() > 160 && mob.getStats().getImgheight() > 250) { //如果图片超过指定范围会造成客户端假死，因此这里需要替换成别的图片或者干脆不要。
        return `#fMap/Obj/Tdungeon.img/mushCatle/npc/0/0#\r\n(形象过大，不能展示)`;
    } else {
        //当前怪物ID最多7位数，不足7位数则需要在前面补0
        return `#fMob/${mob.getId().toString().padStart(7, '0')}.img/${type}/0#`;
    }
}

function getDropperAndRates(itemID) {
    const player = cm.getPlayer();
    const droppers = ItemInformationProvider.getInstance().getDropperIdAndRates(itemID).entrySet().toArray();
    let result = [];
    for (const dropper of droppers) {
        const mob = LifeFactory.getMonster(dropper.getKey());
        if (!mob) continue;
        const rate = mob.isBoss() ?
            (dropper.getValue() * player.getBossDropRate() * player.getFamilyDrop() / 10000).toFixed(4) :
            (dropper.getValue() * player.getDropRate() * player.getFamilyDrop() / 10000).toFixed(4);

        const existedMobIndex = result.findIndex((dropper) => dropper.mob.getName() === mob.getName());
        if (existedMobIndex !== -1) {
            if (result[existedMobIndex].rate > rate) {
                result.splice(existedMobIndex, 1);
            } else {
                continue;
            }
        }

        result.push({mob, rate })
    }

    result.sort(function(a, b) {
            return b.rate - a.rate;
        });
    return result;
}