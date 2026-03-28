/* @Author SharpAceX
* 5511000.js: Summons Targa.
*/

function act() {
    const targaMobId = 9420542;
    if (rm.getReactor().getMap().getMonsterById(targaMobId) == null) {
        rm.summonBossDelayed(targaMobId, 3200, -527, 637, "Bgm09/TimeAttack", "当心！愤怒的暴力熊现身了！");
    }
}