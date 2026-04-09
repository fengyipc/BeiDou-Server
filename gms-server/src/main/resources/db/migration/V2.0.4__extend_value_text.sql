-- extend_value 列从 varchar(255) 扩展为 text，以支持存储较长的 JSON 数据（如矿石仓库）
ALTER TABLE `extend_value` MODIFY COLUMN `extend_value` text COMMENT '扩展字段值';
