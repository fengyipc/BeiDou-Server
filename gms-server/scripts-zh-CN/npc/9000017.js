/*
    This file is part of the HeavenMS MapleStory Server
    Copyleft (L) 2016 - 2019 RonanLana

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU Affero General Public License as
    published by the Free Software Foundation version 3 as published by
    the Free Software Foundation. You may not use, modify or distribute
    this program under any other version of the GNU Affero General Public
    License.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU Affero General Public License for more details.

    You should have received a copy of the GNU Affero General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
/* 可可
        精炼NPC：
	* 混沌卷轴合成器（笑）
        *
        * @作者 RonanLana (ronancpl)
*/

var status = 0;
var selectedType = -1;
var selectedItem = -1;
var item;
var mats;
var matQty;
var cost;
var qty;
var equip;
var last_use; //最后一项是消耗品

function start() {
    cm.getPlayer().setCS(true);
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == 1) {
        status++;
    } else {
        cm.sendOk("哦，好吧...想做生意的时候再来找我们吧。");
        cm.dispose();
        return;
    }

    if (status == 0) {
        const GameConfig = Java.type('org.gms.config.GameConfig');
        if (!GameConfig.getServerBoolean("use_enable_custom_npc_script")) {
            cm.sendOk("嗨，我是#b#p" + cm.getNpc() + "##k。");
            cm.dispose();
            return;
        }

        var selStr = "嘿，冒险家！过来，靠近点...我们有个#b绝佳的商机#k要告诉你。想知道是什么吗？继续听下去...";
        cm.sendNext(selStr);
    } else if (status == 1) {
        var selStr = "我们掌握了合成强大的#b#t2049100##k的技艺！当然，制作它并不容易...但别担心！只要收集一些材料给我，并支付#b1,200,000金币#k的服务费，就能#b获得它#k。你还想继续吗？";
        cm.sendYesNo(selStr);
    } else if (status == 2) {
        //selectedItem = selection;
        selectedItem = 0;

        var itemSet = [2049100, 7777777];
        var matSet = new Array([4031203, 4001356, 4000136, 4000082, 4001126, 4080100, 4000021, 4003005]);
        var matQtySet = new Array([100, 60, 40, 80, 10, 8, 200, 120]);
        var costSet = [1200000, 7777777];
        item = itemSet[selectedItem];
        mats = matSet[selectedItem];
        matQty = matQtySet[selectedItem];
        cost = costSet[selectedItem];

        var prompt = "那么，你想让我们制作一些#t" + item + "#？这样的话，你想让我们制作多少呢？";
        cm.sendGetNumber(prompt, 1, 1, 100)
    } else if (status == 3) {
        qty = (selection > 0) ? selection : (selection < 0 ? -selection : 1);
        last_use = false;

        var prompt = "你想让我们制作";
        if (qty == 1) {
            prompt += "一个#t" + item + "#？";
        } else {
            prompt += qty + "个#t" + item + "#？";
        }

        prompt += "这样的话，我们需要你提供特定的材料。记得确保你的背包有足够的空间！#b";

        if (mats instanceof Array) {
            for (var i = 0; i < mats.length; i++) {
                prompt += "\r\n#i" + mats[i] + "# " + matQty[i] * qty + "个#t" + mats[i] + "#";
            }
        } else {
            prompt += "\r\n#i" + mats + "# " + matQty * qty + "个#t" + mats + "#";
        }

        if (cost > 0) {
            prompt += "\r\n#i4031138# " + cost * qty + "金币";
        }
        cm.sendYesNo(prompt);
    } else if (status == 4) {
        var complete = true;

        if (cm.getMeso() < cost * qty) {
            cm.sendOk("得了吧！我们可不是在做慈善！大家都需要钱过日子，带上钱来我们才能开始交易和合成。");
        } else if (!cm.canHold(item, qty)) {
            cm.sendOk("你都没检查背包有没有空间就来谈生意了？");
        } else {
            if (mats instanceof Array) {
                for (var i = 0; complete && i < mats.length; i++) {
                    if (matQty[i] * qty == 1) {
                        complete = cm.haveItem(mats[i]);
                    } else {
                        complete = cm.haveItem(mats[i], matQty[i] * qty);
                    }
                }
            } else {
                complete = cm.haveItem(mats, matQty * qty);
            }

            if (!complete) {
                cm.sendOk("你在开玩笑吧？没有所有材料我们可没法开始制作。去收集齐了再来找我们！");
            } else {
                if (mats instanceof Array) {
                    for (var i = 0; i < mats.length; i++) {
                        cm.gainItem(mats[i], -matQty[i] * qty);
                    }
                } else {
                    cm.gainItem(mats, -matQty * qty);
                }
                cm.gainMeso(-cost * qty);
                cm.gainItem(item, qty);
                cm.sendOk("哇...真不敢相信成功了！刚才还以为会失...咳咳。当然会成功，我们的工作一向高效！和你做生意很愉快。");
            }
        }
        cm.dispose();
    }
}