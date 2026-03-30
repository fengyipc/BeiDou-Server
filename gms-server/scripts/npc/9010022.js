var status;
var sel;

// Indices #2 / #3 = Monster Carnival 1 & 2 (classic mirror layout). Only min levels; no upper cap.

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
                selStr += "#0# Ludibrium PQ (101)";
            }
            if (lv >= 44) {
                selStr += "#1# Ellin Forest (Poison Fog)";
            }
            if (lv >= 30) {
                selStr += "#2# Monster Carnival 1";
            }
            if (lv >= 51) {
                selStr += "#3# Monster Carnival 2";
            }
            if (lv >= 51) {
                selStr += "#4# Orbis PQ (Goddess Tower)";
            }
            if (lv >= 55) {
                selStr += "#5# Pirate Ship";
            }
            if (lv >= 71) {
                selStr += "#6# Romeo and Juliet";
            }

            if (selStr == "") {
                cm.sendDimensionalMirror("#-1# There is no place for you to transport to from here.");
                cm.dispose();
            } else {
                cm.sendDimensionalMirror(selStr);
            }
        } else if (status == 1) {
            cm.getPlayer().saveLocation("MIRROR");
            switch (selection) {
                case 0:
                    cm.warp(922010100, 0);
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
                    cm.warp(200080101, 0);
                    break;
                case 5:
                    cm.warp(251010404, 0);
                    break;
                case 6:
                    cm.warp(261000021, 0);
                    break;
            }
            cm.dispose();
        }
    }
}
