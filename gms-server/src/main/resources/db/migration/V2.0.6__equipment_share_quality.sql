-- 将 is_rare (0/1) 列迁移为 quality (1-5) 列
-- 品质等级：1=次品, 2=普通, 3=优质, 4=稀有, 5=神器

-- 1. 添加新列 quality，默认值为 2（普通）
ALTER TABLE equipment_share ADD COLUMN quality TINYINT NOT NULL DEFAULT 2 AFTER is_rare;

-- 2. 迁移旧数据：is_rare=1 -> quality=4（稀有），is_rare=0 -> quality=2（普通）
UPDATE equipment_share SET quality = 4 WHERE is_rare = 1;
UPDATE equipment_share SET quality = 2 WHERE is_rare = 0;

-- 3. 删除旧列 is_rare
ALTER TABLE equipment_share DROP COLUMN is_rare;
