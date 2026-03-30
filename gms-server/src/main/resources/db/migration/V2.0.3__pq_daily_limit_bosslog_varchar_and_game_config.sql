-- PQ 每日次数：bosslog 需支持 PQ_* 字符串；并写入默认 game_config（未存在时插入）

ALTER TABLE `bosslog_daily`
    MODIFY COLUMN `bosstype` VARCHAR(32) NOT NULL;
ALTER TABLE `bosslog_weekly`
    MODIFY COLUMN `bosstype` VARCHAR(32) NOT NULL;

INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.Boolean', 'pq_daily_limit_enabled', 'false', 'pq_daily_limit_enabled', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `game_config` WHERE `config_code` = 'pq_daily_limit_enabled');

INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.Integer', 'pq_daily_limit_default', '3', 'pq_daily_limit_default', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `game_config` WHERE `config_code` = 'pq_daily_limit_default');

INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.util.Map', 'pq_daily_limit_overrides', '{}', 'pq_daily_limit_overrides JSON e.g. {"LudiPQ":5}', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `game_config` WHERE `config_code` = 'pq_daily_limit_overrides');

INSERT INTO `game_config`(`config_type`, `config_sub_type`, `config_clazz`, `config_code`, `config_value`, `config_desc`, `update_time`)
SELECT 'server', 'Game Mechanics', 'java.lang.String', 'pq_daily_limit_excluded', '[]', 'pq_daily_limit_excluded JSON array of event names', NOW()
WHERE NOT EXISTS (SELECT 1 FROM `game_config` WHERE `config_code` = 'pq_daily_limit_excluded');

INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'pq_daily_limit_enabled', '是否启用组队PQ副本每日参与次数限制', NULL
WHERE NOT EXISTS (SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'pq_daily_limit_enabled');

INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'pq_daily_limit_default', '组队PQ默认每日次数（可被 overrides 覆盖）', NULL
WHERE NOT EXISTS (SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'pq_daily_limit_default');

INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'pq_daily_limit_overrides', '按 Event 脚本名覆盖每日次数，JSON 对象', NULL
WHERE NOT EXISTS (SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'pq_daily_limit_overrides');

INSERT INTO `lang_resources`(`lang_type`, `lang_base`, `lang_code`, `lang_value`, `lang_extend`)
SELECT 'zh-CN', 'game_config', 'pq_daily_limit_excluded', '不参与次数限制的 Event 脚本名列表，JSON 数组', NULL
WHERE NOT EXISTS (SELECT 1 FROM `lang_resources` WHERE `lang_type` = 'zh-CN' AND `lang_code` = 'pq_daily_limit_excluded');
