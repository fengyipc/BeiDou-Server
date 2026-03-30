var status;
var sel;

// #2、#3 为怪物嘉年华1 / 2（与经典次元之镜序号一致）。仅下限，无等级上限。

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode == -1) {
        cm.dispose();
    } else {
        if (mode == 0) {
            cm.dispose();
            return;
        }
        if (mode == 1) {
            status++;
        } else {
            status--;
        }
        if (status == 0) {
            var selStr = "";
            var lv = cm.getLevel();

            if (lv >= 35) {
                selStr += "#0# 玩具城组队任务(101)";
            }
            if (lv >= 44) {
                selStr += "#1# 毒雾森林";
            }
            if (lv >= 30) {
                selStr += "#2# 怪物嘉年华1";
            }
            if (lv >= 51) {
                selStr += "#3# 怪物嘉年华2";
            }
            if (lv >= 55) {
                selStr += "#4# 海盗船";
            }
            if (lv >= 51) {
                selStr += "#5# 女神塔组队任务";
            }
            if (lv >= 71) {
                selStr += "#6# 罗密欧与朱丽叶";
            }

            if (selStr == "") {
                cm.sendDimensionalMirror("#-1#从这里没有可以传送你的地点。");
                cm.dispose();
            } else {
                cm.sendDimensionalMirror(selStr);
            }
        } else if (status == 1) {
            cm.getPlayer().saveLocation("MIRROR");
            switch (selection) {
                case 0:
                    cm.warp(221024500, 0);
                    break;
                case 1:
                    cm.warp(300030100, 0);
                    break;
                case 2:
                    cm.getPlayer().saveLocation("MONSTER_CARNIVAL");
                    cm.warp(980000000, 3);
                    break;
                case 3:
                    cm.getPlayer().saveLocation("MONSTER_CARNIVAL");
                    cm.warp(980030000, 3);
                    break;
                case 4:
                    cm.warp(251010404, 0);
                    break;
                case 5:
                    cm.warp(200080101, 0);
                    break;
                case 6:
                    cm.warp(261000021, 0);
                    break;
            }
            cm.dispose();
        }
    }
}
