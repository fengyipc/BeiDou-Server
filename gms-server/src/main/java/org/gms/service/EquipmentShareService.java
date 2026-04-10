package org.gms.service;

import com.mybatisflex.core.query.QueryWrapper;
import lombok.extern.slf4j.Slf4j;
import org.gms.client.inventory.Equip;
import org.gms.dao.entity.EquipmentShareDO;
import org.gms.dao.mapper.EquipmentShareMapper;
import org.gms.server.ItemInformationProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
public class EquipmentShareService {

    @Autowired
    private EquipmentShareMapper equipmentShareMapper;

    public boolean shareEquip(int world, String sharerName, Equip equip) {
        boolean isRare = equip.getOwner() != null && equip.getOwner().contains("「稀有」");

        Map<String, Integer> wzStats = ItemInformationProvider.getInstance().getEquipStats(equip.getItemId());
        int reqJob = wzStats != null && wzStats.containsKey("reqJob") ? wzStats.get("reqJob") : 0;

        EquipmentShareDO record = EquipmentShareDO.builder()
                .world(world)
                .sharerName(sharerName)
                .itemId(equip.getItemId())
                .isRare(isRare ? 1 : 0)
                .upgradeSlots((int) equip.getUpgradeSlots())
                .level((int) equip.getLevel())
                .str((int) equip.getStr())
                .dex((int) equip.getDex())
                .inte((int) equip.getInt())
                .luk((int) equip.getLuk())
                .hp((int) equip.getHp())
                .mp((int) equip.getMp())
                .watk((int) equip.getWatk())
                .matk((int) equip.getMatk())
                .wdef((int) equip.getWdef())
                .mdef((int) equip.getMdef())
                .acc((int) equip.getAcc())
                .avoid((int) equip.getAvoid())
                .speed((int) equip.getSpeed())
                .jump((int) equip.getJump())
                .hands((int) equip.getHands())
                .itemLevel((int) equip.getItemLevel())
                .vicious((int) equip.getVicious())
                .flag((int) equip.getFlag())
                .expiration(equip.getExpiration())
                .reqJob(reqJob)
                .build();

        int rows = equipmentShareMapper.insert(record);
        return rows > 0;
    }

    public List<EquipmentShareDO> listEquips(int world) {
        return equipmentShareMapper.selectListByQuery(
                QueryWrapper.create()
                        .eq("world", world)
                        .orderBy("shared_at", false));
    }

    public List<EquipmentShareDO> listMyEquips(int world, String sharerName) {
        return equipmentShareMapper.selectListByQuery(
                QueryWrapper.create()
                        .eq("world", world)
                        .eq("sharer_name", sharerName)
                        .orderBy("shared_at", false));
    }

    public Optional<EquipmentShareDO> takeEquip(long id, int world) {
        EquipmentShareDO record = equipmentShareMapper.selectOneById(id);
        if (record == null || record.getWorld() != world) {
            return Optional.empty();
        }
        equipmentShareMapper.deleteById(id);
        return Optional.of(record);
    }

    public Optional<EquipmentShareDO> revokeEquip(long id, String sharerName) {
        EquipmentShareDO record = equipmentShareMapper.selectOneById(id);
        if (record == null || !sharerName.equals(record.getSharerName())) {
            return Optional.empty();
        }
        equipmentShareMapper.deleteById(id);
        return Optional.of(record);
    }

    public void reInsert(EquipmentShareDO record) {
        record.setId(null);
        equipmentShareMapper.insert(record);
    }
}
