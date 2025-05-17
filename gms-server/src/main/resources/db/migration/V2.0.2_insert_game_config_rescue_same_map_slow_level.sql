INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.Boolean', 'rescue_same_map', 'true', 'rescue_same_map', '2025-05-17 13:44:57'
WHERE NOT EXISTS (
    SELECT 1 FROM `game_config` WHERE `config_code` = 'rescue_same_map'
);
INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.Integer', 'slow_min_level', '70', 'slow_min_level', '2025-05-17 13:44:57'
WHERE NOT EXISTS (
    SELECT 1 FROM `game_config` WHERE `config_code` = 'slow_min_level'
);
INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.Integer', 'slow_max_level', '120', 'slow_max_level', '2025-05-17 13:44:57'
WHERE NOT EXISTS (
    SELECT 1 FROM `game_config` WHERE `config_code` = 'slow_max_level'
);
INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.Float', 'slow_level_exp_rate', '0', 'slow_level_exp_rate', '2025-05-17 13:44:57'
WHERE NOT EXISTS (
    SELECT 1 FROM `game_config` WHERE `config_code` = 'slow_level_exp_rate'
);


-- 中文内容
INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'rescue_same_map', '是否尽量把玩家解救回原本所在的地图', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'rescue_same_map'
);
INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'slow_min_level', '降低经验倍率的最小等级', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'slow_min_level'
);
INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'slow_max_level', '降低经验倍率的最大等级', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'slow_max_level'
);
INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'slow_level_exp_rate', '降低经验的倍率，0时不降低', NULL
WHERE NOT EXISTS (
    SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'slow_level_exp_rate'
);
