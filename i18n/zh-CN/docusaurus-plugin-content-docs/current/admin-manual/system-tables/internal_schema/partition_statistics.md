---
{
    "title": "partition_statistics",
    "language": "zh-CN",
    "description": "分区统计信息"
}
---

## 概述

分区统计信息

## 所属数据库


`__internal_schema`


## 表信息

| 列名               | 类型           | 说明                      |
| :----------------- | :------------- | :------------------------ |
| catalog_id         | varchar(64)    | Catalog 的 ID             |
| db_id              | varchar(64)    | Database 的 ID            |
| tbl_id             | varchar(64)    | Table 的 ID               |
| idx_id             | varchar(64)    | Index 的 ID               |
| part_name          | varchar(64)    | Partition 的名字          |
| part_id            | bigint         | Partition 的 ID           |
| col_id             | varchar(64)    | 列的 ID，当前存储的是列名 |
| count              | bigint         | 行数                      |
| ndv                | hll            | 不同值的数量              |
| null_count         | bigint         | NULL 的数量               |
| min                | varchar(65533) | 最小值                    |
| max                | varchar(65533) | 最大值                    |
| data_size_in_bytes | bigint         | 以字节计算的数据量        |
| update_time        | datetime       | 当前统计信息最后更新时间  |