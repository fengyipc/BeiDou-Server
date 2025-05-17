var status = -1;
var level = 1;

function start() {
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == 1) {
        status++;
    } else {
        status--;
    }
    if (cm.getPlayer().getMapId() == 925100700) {
        cm.warp(251010404, 0);
        cm.dispose();
        return;
    }

    if (status == 1) {   // leaders cant withdraw
        cm.warp(251010404, 0);
        return;
    }

    if (!cm.isEventLeader()) {
        // Player chose "No" or "End Chat"
        if (mode <= 0) {
            cm.dispose();
        } else {
            cm.sendYesNo("我希望你的队长来和我交谈。或者，你可能想要退出。你打算放弃这次行动吗？");
        }
    } else {
        var eim = cm.getEventInstance();
        if (eim == null) {
            cm.warp(251010404, 0);
            cm.sendNext("你怎么会在没有注册到实例的情况下出现在这里？");
            cm.dispose();
            return;
        }

        level = eim.getProperty("level");

        switch (cm.getPlayer().getMapId()) {
            case 925100000:
                cm.sendNext("我们现在要登上海盗船了！要进去，我们必须消灭所有守卫它的怪物。");
                cm.dispose();
                break;
            case 925100100:
                var emp = eim.getProperty("stage2");
                if (emp === "0") {
                    if (cm.haveItem(4001120, 20)) {
                        cm.sendNext("太棒了！现在去帮我收集20个#b#z4001121##k吧");
                        cm.gainItem(4001120, -20);
                        cm.getMap().killAllMonsters();
                        eim.setProperty("stage2", "1");
                    } else {
                        cm.sendNext("我们现在要登上海盗船了！要进去，我们必须证明自己是高贵的海盗，去帮我收集20个#b#z4001120##k吧。");
                    }
                } else if (emp === "1") {
                    if (cm.haveItem(4001121, 20)) {
                        cm.sendNext("太棒了！现在去帮我收集20个#b#z4001122##k吧");
                        cm.gainItem(4001121, -20);
                        cm.getMap().killAllMonsters();
                        eim.setProperty("stage2", "2");
                    } else {
                        cm.sendNext("我们现在要登上海盗船了！要进去，我们必须证明自己是高贵的海盗，去帮我收集20个#b#z4001121##k吧。");
                    }
                } else if (emp === "2") {
                    if (cm.haveItem(4001122, 20)) {
                        cm.sendNext("太棒了！现在我们出发吧。");
                        cm.gainItem(4001122, -20);
                        cm.getMap().killAllMonsters();
                        eim.setProperty("stage2", "3");
                        eim.showClearEffect(cm.getMapId());
                    } else {
                        cm.sendNext("我们现在要登上海盗船了！要进去，我们必须证明自己是高贵的海盗。去帮我收集20个#b#z4001122##k吧。");
                    }
                } else {
                    cm.sendNext("下一阶段已经开启。出发！");
                }
                cm.dispose();
                break;
            case 925100200:
            case 925100300:
                cm.sendNext("要攻打海盗船，我们必须先消灭守卫。");
                cm.dispose();
                break;
            case 925100201:
                if (cm.getMap().getMonsters().size() == 0) {
                    cm.sendNext("老海盗的宝箱出现了！如果你碰巧有钥匙，把它放在宝箱旁边就能揭开里面的宝藏。这肯定会让他生气的。");
                    if (eim.getProperty("stage2a") == "0") {
                        cm.getMap().setReactorState();
                        eim.setProperty("stage2a", "1");
                    }
                } else {
                    cm.sendNext("这些桔梗精藏起来了。我们必须解放它们。");
                }
                cm.dispose();
                break;
            case 925100301:
                if (cm.getMap().getMonsters().size() == 0) {
                    cm.sendNext("老海盗的宝箱出现了！如果你碰巧有钥匙，把它放在宝箱旁边就能揭开里面的宝藏。这肯定会让他生气的。");
                    if (eim.getProperty("stage3a") === "0") {
                        cm.getMap().setReactorState();
                        eim.setProperty("stage3a", "1");
                    }
                } else {
                    cm.sendNext("这些桔梗精藏起来了。我们必须解放它们。");
                }
                cm.dispose();
                break;
            case 925100202:
            case 925100302:
                cm.sendNext("这些是效忠于老海盗的船长和克鲁斯。你可以随意消灭他们。");
                cm.dispose();
                break;
            case 925100400:
                cm.sendNext("这些房间是船的动力源。我们必须用旧金属钥匙锁上这些门！");
                cm.dispose();
                break;
            case 925100500:
                if (cm.getMap().getMonsters().size() == 0) {
                    cm.sendNext("感谢你救了我们的队长！我们欠你一份人情。");
                } else {
                    cm.sendNext("消灭所有怪物！包括老海盗的爪牙！");
                }
                cm.dispose();
                break;
        }
    }


}