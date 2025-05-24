/*
    This file is part of the OdinMS Maple Story Server
    Copyright (C) 2008 Patrick Huy <patrick.huy@frz.cc>
               Matthias Butz <matze@odinms.de>
               Jan Christian Meyer <vimes@odinms.de>

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
/* 	
    NPC Name: 		Big Headward
        Map(s): 		Victoria Road : Henesys Hair Salon (100000104)
    Description: 		Random haircut

        GMS-like revised by Ronan -- contents found thanks to Mitsune (GamerBewbs), Waltzing, AyumiLove
*/

var status = 0;

var mhair_r = Array(30010, 30070, 30080, 30090, 30100, 30690, 30760, 33000);
var fhair_r = Array(31130, 31530, 31820, 31920, 31940, 34000, 34030);

// var mhair_v = Array(30010, 30070, 30080, 30090, 30100, 30480, 30560, 30690, 30760, 30850, 30890, 30930, 30950);
var mhair_v = [
    30000,
    30010,
    30020,
    30030,
    30040,
    30050,
    30060,
    30070,
    30080,
    30090,
    30100,
    30110,
    30120,
    30130,
    30140,
    30150,
    30160,
    30170,
    30180,
    30190,
    30200,
    30210,
    30220,
    30230,
    30240,
    30250,
    30260,
    30270,
    30280,
    30290,
    30300,
    30310,
    30320,
    30330,
    30340,
    30350,
    30360,
    30370,
    30400,
    30410,
    30420,
    30430,
    30440,
    30450,
    30460,
    30470,
    30480,
    30490,
    30510,
    30520,
    30530,
    30540,
    30550,
    30560,
    30570,
    30580,
    30590,
    30600,
    30610,
    30620,
    30630,
    30640,
    30650,
    30660,
    30670,
    30680,
    30690,
    30700,
    30710,
    30720,
    30730,
    30740,
    30750,
    30760,
    30770,
    30780,
    30790,
    30800,
    30810,
    30820,
    30830,
    30840,
    30850,
    30860,
    30870,
    30880,
    30890,
    30900,
    30910,
    30920,
    30930,
    30940,
    30950,
    30990,
    33000,
    33040,
    33100
];
var fhair_v = [
    31000,
    31010,
    31020,
    31030,
    31040,
    31050,
    31060,
    31070,
    31080,
    31090,
    31100,
    31110,
    31120,
    31130,
    31140,
    31150,
    31160,
    31170,
    31180,
    31190,
    31200,
    31210,
    31220,
    31230,
    31240,
    31250,
    31260,
    31270,
    31280,
    31290,
    31300,
    31310,
    31320,
    31330,
    31340,
    31350,
    31400,
    31410,
    31420,
    31430,
    31440,
    31450,
    31460,
    31470,
    31480,
    31490,
    31510,
    31520,
    31530,
    31540,
    31550,
    31560,
    31570,
    31580,
    31590,
    31600,
    31610,
    31620,
    31630,
    31640,
    31650,
    31660,
    31670,
    31680,
    31690,
    31700,
    31710,
    31720,
    31730,
    31740,
    31750,
    31760,
    31770,
    31780,
    31790,
    31800,
    31810,
    31820,
    31830,
    31840,
    31850,
    31860,
    31870,
    31880,
    31890,
    31910,
    31920,
    31930,
    31940,
    31950,
    34000,
    34010,
    34020,
    34030,
    34050,
    34110
];

var hairnew = Array();

function pushIfItemExists(array, itemid) {
    if ((itemid = cm.getCosmeticItem(itemid)) != -1 && !cm.isCosmeticEquipped(itemid)) {
        array.push(itemid);
    }
}

function start() {
    status = -1;
    action(1, 0, 0);
}

function action(mode, type, selection) {
    if (mode < 1) {  // disposing issue with stylishs found thanks to Vcoc
        cm.dispose();
    } else {
        if (mode == 1) {
            status++;
        } else {
            status--;
        }

        if (status == 0) {
            cm.sendSimple("嗨，我是 #p1012117#，周围最有魅力、最时尚的造型师。如果你正在寻找最好看的发型，那就别再找啦！\r\n\#L0##i5150040##t5150040##l\r\n\#L1##i5150044##t5150044##l");
        } else if (status == 1) {
            if (selection == 0) {
                beauty = 1;
                cm.sendYesNo("如果你使用这张普通皇家理发券，你的头发可能会随机变成新造型……你还是想用 #b#t5150040##k 来尝试吗？不管怎样我都会帮你做的。但别忘了，这可是随机的哦！");
            } else {
                beauty = 2;

                hairnew = Array();
                if (cm.getPlayer().getGender() == 0) {
                    for (var i = 0; i < mhair_v.length; i++) {
                        pushIfItemExists(hairnew, mhair_v[i] + parseInt(cm.getPlayer().getHair() % 10));
                    }
                } else {
                    for (var i = 0; i < fhair_v.length; i++) {
                        pushIfItemExists(hairnew, fhair_v[i] + parseInt(cm.getPlayer().getHair() % 10));
                    }
                }

                cm.sendStyle("使用这张高级皇家理发券，你可以选择你想要的发型。挑选一个最让你满意的发型吧……", hairnew);
            }
        } else if (status == 2) {
            if (beauty == 1) {
                if (cm.haveItem(5150040) == true) {
                    hairnew = Array();
                    if (cm.getPlayer().getGender() == 0) {
                        for (var i = 0; i < mhair_r.length; i++) {
                            pushIfItemExists(hairnew, mhair_r[i] + parseInt(cm.getPlayer().getHair() % 10));
                        }
                    } else {
                        for (var i = 0; i < fhair_r.length; i++) {
                            pushIfItemExists(hairnew, fhair_r[i] + parseInt(cm.getPlayer().getHair() % 10));
                        }
                    }

                    cm.gainItem(5150040, -1);
                    cm.setHair(hairnew[Math.floor(Math.random() * hairnew.length)]);
                    cm.sendOk("尽情享受你全新的时尚发型吧！");
                } else {
                    cm.sendOk("嗯……看起来你没有我们指定的理发券……没有它我恐怕不能给你理发。很抱歉……");
                }
            } else if (beauty == 2) {
                if (cm.haveItem(5150044) == true) {
                    cm.gainItem(5150044, -1);
                    cm.setHair(hairnew[selection]);
                    cm.sendOk("尽情享受你全新的时尚发型吧！");
                } else {
                    cm.sendOk("嗯……看起来你没有我们指定的理发券……没有它我恐怕不能给你理发。很抱歉……");
                }
            }

            cm.dispose();
        }
    }
}
