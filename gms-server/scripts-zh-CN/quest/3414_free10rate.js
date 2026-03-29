var item;
var stance;
var status = -1;
var vecItem;

function end(mode, type, selection) {
    if (mode == 0) {
        qm.dispose();
        return;
    }
    status++;

    if (status == 0) {
        qm.sendNext("哇……就是这个！！！有了这份样本，欧米茄地带正在进行的研究终于能出成果了！能找到狩猎本领比我还强的人，我都不知道该说什么好。我也得重新振作！总之，你干得漂亮，我会好好奖励你的。");
    } else if (status == 1) {
        var talkStr = "请在这里选择你想要的卷轴，所有成功率均为10%。\r\n\r\n#r请选择一件道具\r\n#b"
        stance = qm.getPlayer().getJobStyle();

        const Job = Java.type('org.gms.client.Job');
        if (stance == Job.WARRIOR || stance == Job.BEGINNER) {
            vecItem = [2043002, 2043102, 2043202, 2044002, 2044102, 2044202, 2044402, 2044302];
        } else if (stance == Job.MAGICIAN) {
            vecItem = [2043702, 2043802];
        } else if (stance == Job.BOWMAN || stance == Job.CROSSBOWMAN) {
            vecItem = [2044502, 2044602];
        } else if (stance == Job.THIEF) {
            vecItem = [2043302, 2044702];
        } else {
            vecItem = [2044802, 2044902];
        }

        for (var i = 0; i < vecItem.length; i++) {
            talkStr += "\r\n#L" + i + "# #i" + vecItem[i] + "# #t" + vecItem[i] + "#";
        }
        qm.sendSimple(talkStr);
    } else if (status == 2) {
        item = vecItem[selection];
        item = qm.gainItem(item, 1);

        if (item != null) {
            qm.gainExp(12000);
            qm.completeQuest();
        }

        qm.dispose();
    }
}
