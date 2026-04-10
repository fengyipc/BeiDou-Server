package org.gms.dao.entity;

import com.mybatisflex.annotation.Column;
import com.mybatisflex.annotation.Id;
import com.mybatisflex.annotation.KeyType;
import com.mybatisflex.annotation.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serial;
import java.io.Serializable;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table("equipment_share")
public class EquipmentShareDO implements Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    @Id(keyType = KeyType.Auto)
    private Long id;

    private Integer world;

    private String sharerName;

    private Integer itemId;

    private Integer isRare;

    private Integer upgradeSlots;

    @Column("level_")
    private Integer level;

    @Column("str_")
    private Integer str;

    @Column("dex_")
    private Integer dex;

    @Column("int_")
    private Integer inte;

    @Column("luk_")
    private Integer luk;

    @Column("hp_")
    private Integer hp;

    @Column("mp_")
    private Integer mp;

    private Integer watk;

    private Integer matk;

    private Integer wdef;

    private Integer mdef;

    private Integer acc;

    @Column("avoid_")
    private Integer avoid;

    private Integer speed;

    private Integer jump;

    private Integer hands;

    private Integer itemLevel;

    private Integer vicious;

    @Column("flag_")
    private Integer flag;

    private Long expiration;

    private Integer reqJob;

    private LocalDateTime sharedAt;
}
