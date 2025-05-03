/*
	NPC 名称: 		虚无存在
	所在地图: 		地城：异界入口
	功能描述: 		将你传送至另一个维度
*/

function start() {
    if (cm.getQuestStatus(6107) == 1 || cm.getQuestStatus(6108) == 1) {
        var ret = checkJob();
        if (ret == -1) {
            cm.sendOk("请组建队伍后再来与我对话。");
        } else if (ret == 0) {
            cm.sendOk("请确保队伍人数为2人。");
        } else if (ret == 1) {
            cm.sendOk("队伍中有成员的职业不符合进入异界的条件。");
        } else if (ret == 2) {
            cm.sendOk("队伍中有成员的等级不符合进入异界的要求。");
        } else {
            var em = cm.getEventManager("s4aWorld");
            if (em == null) {
                cm.sendOk("因未知原因无法进入，请重试。");
            } else if (em.getProperty("started") === "true") {
                cm.sendOk("已有其他队伍正在异界挑战小巨魔蝙蝠怪。");
            } else {
                var eli = em.getEligibleParty(cm.getParty());
                if (eli.size() > 0) {
                    if (!em.startInstance(cm.getParty(), cm.getPlayer().getMap(), 1)) {
                        cm.sendOk("该副本已存在以你命名的队伍记录。");
                    }
                } else {
                    cm.sendOk("当前无法开启任务，可能因为：\n1. 队伍人数不符\n2. 成员不符合条件\n3. 成员不在当前地图\n如需组队可尝试使用队伍搜寻功能。");
                }
            }
        }
    } else {
        cm.sendOk("因未知原因无法进入异界。");
    }

    cm.dispose();
}

function action(mode, type, selection) {
}

function checkJob() {
    var party = cm.getParty();

    if (party == null) {
        return -1;
    }
    //    if (party.getMembers().size() != 2) {
    //	return 0;
    //    }
    var it = party.getMembers().iterator();

    while (it.hasNext()) {
        var cPlayer = it.next();

        if (cPlayer.getJobId() == 312 || cPlayer.getJobId() == 322 || cPlayer.getJobId() == 900) {
            if (cPlayer.getLevel() < 120) {
                return 2;
            }
        } else {
            return 1;
        }
    }
    return 3;
}