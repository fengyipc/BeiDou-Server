/*
    本文件是HeavenMS枫之谷服务器的一部分
    版权所有(C) 2016 - 2019 RonanLana

    本程序是自由软件：您可以自由使用、修改和分发它
    但必须遵循GNU Affero通用公共许可证第3版的规定。
    您不能在其他版本的GNU Affero通用公共许可证下使用、修改或分发本程序。

    本程序分发是希望它有用，但没有任何担保；
    甚至没有适销性或特定用途适用性的默示担保。
    详情请参阅GNU Affero通用公共许可证。

    您应该已经收到了一份GNU Affero通用公共许可证的副本
    如果没有，请参阅<http://www.gnu.org/licenses/>。
*/
/* NPC: 枫叶TV / 拉里

	兑换NPC:
	* 卷轴生成器
        *
        * @作者 Ronan Lana
*/

var status;

var jobWeaponRestricted = [[[2043000, 2043100, 2044000, 2044100, 2043200, 2044200]], [[2043000, 2043100, 2044000, 2044100], [2043000, 2043200, 2044000, 2044200], [2044300, 2044400]], [[2043700, 2043800], [2043700, 2043800], [2043700, 2043800]], [[2044500], [2044600]], [[2044700], [2043300]], [[2044800], [2044900]]];
var aranWeaponRestricted = [jobWeaponRestricted[1][2][1]];

var tier1Scrolls = [];
var tier2Scrolls = [2040000, 2040400, 2040500, 2040600, 2040700, 2040800, 2040900];
var tier3Scrolls = [2048000, 2049200, 2041000, 2041100, 2041300, 2040100, 2040200, 2040300];

var typeTierScrolls = [["物理攻击", "魔法攻击"], ["力量", "敏捷", "智力", "运气", "命中", "回避", "移动速度", "跳跃力"], ["物理防御", "魔法防御", "最大HP", "最大MP"]];

var sgItems = [4003004, 4003005, 4001006, 4006000, 4006001, 4030012];
var sgToBucket = [100, 50, 37.5, 37.5, 37.5, 200];
var mesoToBucket = 2800000;

var sgAppliedItems = [0, 0, 0, 0, 0, 0];
var sgAppliedMeso = 0;

var sgBuckets = 0.0;
var sgBookBuckets = 0.0;
var sgItemBuckets = 0.0;

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0 && type > 0) {
            cm.dispose();
            return;
        }
        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        if (status == 0) {
            cm.sendNext("这里是枫叶TV卷轴生成器广播。投入你在冒险中获得的物资或金币来兑换奖励！你可以投入#b任意数量的物资#k，但请注意投入#r不同种类的物资#k和#r大量同类物资#k会提高获得更好奖励的几率！");
        } else if (status == 1) {
            var sendStr;

            if (sgItemBuckets > 0.0) {
                sendStr = "根据你当前投入的物品，你有#r" + sgBuckets + "#k个兑换桶(#r" + (sgItemBuckets < 1.0 ? sgItemBuckets.toFixed(2) : Math.floor(sgItemBuckets)) + "#k个物资桶)可以兑换奖励。请选择要投入的物资：";
            } else {
                sendStr = "你还没有投入任何物资。请选择要投入的物资：";
            }

            var listStr = "";
            var i;
            for (i = 0; i < sgItems.length; i++) {
                listStr += "#b#L" + i + "##t" + sgItems[i] + "##k";
                if (sgAppliedItems[i] > 0) {
                    listStr += " - " + sgAppliedItems[i];
                }
                listStr += "#l\r\n";
            }

            listStr += "#b#L" + i + "#金币#k";
            if (sgAppliedMeso > 0) {
                listStr += " - " + sgAppliedMeso;
            }
            listStr += "#l\r\n";

            cm.sendSimple(sendStr + "\r\n\r\n" + listStr + "#r#L" + (sgItems.length + 2) + "#兑换奖励！#l#k\r\n");
        } else if (status == 2) {
            if (selection == (sgItems.length + 2)) {
                if (sgItemBuckets < 1.0) {
                    cm.sendPrev("你投入的物资不足。请至少投入一个#b物资桶#k才能兑换奖励。");
                } else {
                    generateRandomScroll();
                    cm.dispose();
                }
            } else {
                var tickSel;
                if (selection < sgItems.length) {
                    tickSel = "#b#t" + sgItems[selection] + "##k";
                    curItemQty = cm.getItemQuantity(sgItems[selection]);
                } else {
                    tickSel = "#b金币#k";
                    curItemQty = cm.getMeso();
                }

                curItemSel = selection;
                if (curItemQty > 0) {
                    cm.sendGetText("你想投入多少" + tickSel + "？(当前有#r" + curItemQty + "#k)#k");
                } else {
                    cm.sendPrev("你没有" + tickSel + "可以投入卷轴生成器。点击'#r返回#k'回到主界面。");
                }
            }
        } else if (status == 3) {
            var text = cm.getText();

            try {
                var placedQty = parseInt(text);
                if (isNaN(placedQty) || placedQty < 0) {
                    throw true;
                }

                if (placedQty > curItemQty) {
                    cm.sendPrev("你不能投入#r" + (curItemSel < sgItems.length ? "#t" + sgItems[curItemSel] + "#" : "金币") + "#k超过你拥有的数量(#r" + curItemQty + "#k)。点击'#r返回#k'回到主界面。");
                } else {
                    if (curItemSel < sgItems.length) {
                        sgApplyItem(curItemSel, placedQty);
                    } else {
                        sgApplyMeso(placedQty);
                    }

                    cm.sendPrev("操作成功。点击'#r返回#k'回到主界面。");
                }
            } catch (err) {
                cm.sendPrev("请输入一个正数来投入物资。点击'#r返回#k'回到主界面。");
            }

            status = 2;
        } else {
            cm.dispose();
        }
    }
}

function getJobTierScrolls() {
    var scrolls = [];

    var job = cm.getPlayer().getJob();
    var jobScrolls = jobWeaponRestricted[Math.floor(cm.getPlayer().getJobStyle().getId() / 100)];

    const GameConstants = Java.type('org.gms.constants.game.GameConstants');
    var jobBranch = GameConstants.getJobBranch(job);
    if (jobBranch >= 2) {
        Array.prototype.push.apply(scrolls, jobScrolls[Math.floor((job.getId() / 10) % 10) - 1]);
    } else {
        for (var i = 0; i < jobScrolls.length; i++) {
            Array.prototype.push.apply(scrolls, jobScrolls[i]);
        }
    }

    return scrolls;
}

function getScrollTypePool(rewardTier) {
    var scrolls = [];
    switch (rewardTier) {
        case 1:
            if (cm.getPlayer().isAran()) {
                Array.prototype.push.apply(scrolls, aranWeaponRestricted);
            } else {
                Array.prototype.push.apply(scrolls, getJobTierScrolls());
            }

            Array.prototype.push.apply(scrolls, tier1Scrolls);
            break;
        case 2:
            Array.prototype.push.apply(scrolls, tier2Scrolls);
            break;
        default:
            Array.prototype.push.apply(scrolls, tier3Scrolls);
    }

    return scrolls;
}

function getScrollTier(scrollStats) {
    for (var i = 0; i < typeTierScrolls.length; i++) {
        for (var j = 0; j < typeTierScrolls[i].length; j++) {
            if (scrollStats.get(typeTierScrolls[i][j]) > 0) {
                return i + 1;
            }
        }
    }

    return 4;
}

function getScrollSuccessTier(scrollStats) {
    var prop = scrollStats.get("success");

    const GameConfig = Java.type('org.gms.config.GameConfig');
    if (prop > 90) {
        return 3;
    } else if (prop < 50) {
        return GameConfig.getServerInt("scroll_chance_rolls") > 2 ? 2 : 1;
    } else {
        return GameConfig.getServerInt("scroll_chance_rolls") > 2 ? 1 : 2;
    }
}

function getAvailableScrollsPool(baseScrolls, rewardTier, successTier) {
    var scrolls = [];
    const ItemInformationProvider = Java.type('org.gms.server.ItemInformationProvider');
    var ii = ItemInformationProvider.getInstance();

    for (var i = 0; i < baseScrolls.length; i++) {
        for (var j = 0; j < 100; j++) {
            var scrollid = baseScrolls[i] + j;
            var scrollStats = ii.getEquipStats(scrollid);
            if (scrollStats != null && ii.getScrollReqs(scrollid).isEmpty()) {
                var scrollTier = getScrollTier(scrollStats);
                if (scrollTier == rewardTier && successTier == getScrollSuccessTier(scrollStats)) {
                    scrolls.push(scrollid);
                }
            }
        }
    }

    return scrolls;
}

// 被动等级桶计算...

function getLevelTier(level) {
    return Math.floor((level - 1) / 15) + 1;
}

function getPlayerCardTierPower() {
    var cardset = cm.getPlayer().getMonsterBook().getCardSet();
    var countTier = [0, 0, 0, 0, 0, 0, 0, 0, 0];

    for (var iterator = cardset.iterator(); iterator.hasNext();) {
        var ce = iterator.next();

        var cardid = ce.getKey();
        var ceTier = Math.floor(cardid / 1000) % 10;
        countTier[ceTier] += ce.getValue();

        if (ceTier >= 8) {  // 是特殊卡片
            const LifeFactory = Java.type('org.gms.server.life.LifeFactory');
            const ItemInformationProvider = Java.type('org.gms.server.ItemInformationProvider');
            var mobLevel = LifeFactory.getMonsterLevel(ItemInformationProvider.getInstance().getCardMobId(cardid));
            var mobTier = getLevelTier(mobLevel) - 1;

            countTier[mobTier] += (ce.getValue() * 1.2);
        }
    }

    return countTier;
}

function calculateMobBookTierBuckets(tierSize, playerCards, tier) {
    if (tier < 1) {
        return 0.0;
    }

    tier--; // 从1开始
    var tierHitRate = playerCards[tier] / (tierSize[tier] * 5);
    if (tierHitRate > 0.5) {
        tierHitRate = 0.5;
    }

    return tierHitRate * 4;
}

function calculateMobBookBuckets() {
    var book = cm.getPlayer().getMonsterBook();
    var bookLevelMult = 0.9 + (0.1 * book.getBookLevel());

    var playerLevelTier = getLevelTier(cm.getPlayer().getLevel());
    if (playerLevelTier > 8) {
        playerLevelTier = 8;
    }

    const MonsterBook = Java.type('org.gms.client.MonsterBook');
    var tierSize = MonsterBook.getCardTierSize();
    var playerCards = getPlayerCardTierPower();

    var prevBuckets = calculateMobBookTierBuckets(tierSize, playerCards, playerLevelTier - 1);
    var currBuckets = calculateMobBookTierBuckets(tierSize, playerCards, playerLevelTier);

    return (prevBuckets + currBuckets) * bookLevelMult;
}

function recalcBuckets() {
    sgBookBuckets = calculateMobBookBuckets();
    sgItemBuckets = calculateSuppliesBuckets();

    var buckets = sgBookBuckets + sgItemBuckets;
    if (buckets > 6.0) {
        sgBuckets = 6;
    } else {
        sgBuckets = Math.floor(buckets);
    }
}

// 变量桶计算...

function sgApplyItem(idx, amount) {
    if (sgAppliedItems[idx] != amount) {
        sgAppliedItems[idx] = amount;
        recalcBuckets();
    }
}

function sgApplyMeso(amount) {
    if (sgAppliedMeso != amount) {
        sgAppliedMeso = amount;
        recalcBuckets();
    }
}

function calculateSuppliesBuckets() {
    var suppliesHitRate = 0.0;
    for (var i = 0; i < sgItems.length; i++) {
        suppliesHitRate += sgAppliedItems[i] / sgToBucket[i];
    }
    suppliesHitRate *= 2;

    suppliesHitRate += (sgAppliedMeso / mesoToBucket);
    return suppliesHitRate;
}

function calculateScrollTiers() {
    var buckets = sgBuckets;
    var tiers = [0, 0, 0];
    while (buckets > 0) {
        var pool = [];
        for (var i = 0; i < tiers.length; i++) {
            if (tiers[i] < 2) {
                pool.push(i);
            }
        }

        var rnd = pool[Math.floor(Math.random() * pool.length)];

        tiers[rnd]++;
        buckets--;
    }

    // 标准化等级
    for (var i = 0; i < tiers.length; i++) {
        tiers[i] = 3 - tiers[i];
    }

    return tiers;
}

function getRandomScrollFromTiers(tiers) {
    var typeTier = tiers[0], subtypeTier = tiers[1], successTier = tiers[2];
    var scrollTypePool = getScrollTypePool(typeTier);
    var scrollPool = getAvailableScrollsPool(scrollTypePool, subtypeTier, successTier);

    if (scrollPool.length > 0) {
        return scrollPool[Math.floor(Math.random() * scrollPool.length)];
    } else {
        return -1;
    }
}

function getRandomScrollFromRightPermutations(tiers) {
    for (var i = 2; i >= 0; i--) {
        for (var j = i - 1; j >= 0; j--) {
            if (tiers[i] >= 3) {
                break;
            } else if (tiers[j] > 1) {
                tiers[i]++;
                tiers[j]--;

                var itemid = getRandomScrollFromTiers(tiers);
                if (itemid != -1) {
                    return itemid;
                }
            }
        }
    }

    return -1;
}

function getRandomScroll(tiers) {
    var itemid = getRandomScrollFromTiers(tiers);
    if (itemid == -1) {
        // 最坏情况下的右移排列...
        itemid = getRandomScrollFromRightPermutations(tiers);
    }

    return itemid;
}

function performExchange(sgItemid, sgCount) {
    if (cm.getMeso() < sgAppliedMeso) {
        return false;
    }

    for (var i = 0; i < sgItems.length; i++) {
        var itemid = sgItems[i];
        var count = sgAppliedItems[i];
        if (count > 0 && !cm.haveItem(itemid, count)) {
            return false;
        }
    }

    cm.gainMeso(-sgAppliedMeso);

    for (var i = 0; i < sgItems.length; i++) {
        var itemid = sgItems[i];
        var count = sgAppliedItems[i];
        cm.gainItem(itemid, -count);
    }

    cm.gainItem(sgItemid, sgCount);
    return true;
}

function generateRandomScroll() {
    const InventoryType = Java.type('org.gms.client.inventory.InventoryType');
    if (cm.getPlayer().getInventory(InventoryType.USE).getNumFreeSlot() >= 1) {
        var itemid = getRandomScroll(calculateScrollTiers());
        if (itemid != -1) {
            if (performExchange(itemid, 1)) {
                cm.sendNext("交易成功！你获得了#r#t" + itemid + "##k。");
            } else {
                cm.sendOk("哦，看起来缺少一些物品...请在兑换前再次检查你背包中的物品。");
            }
        } else {
            cm.sendOk("很抱歉，目前商店里没有可用的卷轴...请稍后再试。");
        }
    } else {
        cm.sendOk("请在尝试兑换卷轴前确保你的消耗栏有足够的空间。");
    }
}