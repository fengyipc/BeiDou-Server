/*
 * Time Temple - Kirston
 * Twilight of the Gods
 */

function start() {
    cm.sendAcceptDecline("只要有了善良之镜，我就能再次召唤黑魔法师！\r\n等等！不对劲！为什么黑魔法师没有现身？等等，这股力量是……？我感觉到了什么……与黑魔法师完全不同啊啊啊啊！！！\r\n\r\n #b（把手放在克里斯顿的肩上。）");
}

function action(mode, type, selection) {
    if (mode == 1) {
        cm.removeNpc(270050100, 2141000);
        cm.forceStartReactor(270050100, 2709000);
    }
    cm.dispose();

// If accepted, = summon PB + Kriston Disappear + 1 hour timer
// If deny = NoTHING HAPPEN
}