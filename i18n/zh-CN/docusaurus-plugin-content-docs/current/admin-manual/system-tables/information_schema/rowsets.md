---
{
    "title": "rowsets",
    "language": "zh-CN",
    "description": "返回 Rowset 的基础信息。"
}
---

## 概述

返回 Rowset 的基础信息。

## 所属数据库


`information_schema`


## 表信息

| 列名                   | 类型        | 说明                                   |
| :--------------------- | :---------- | :------------------------------------- |
| BACKEND_ID             | bigint      | Backend 的 ID，是 Backend 的唯一标识。 |
| ROWSET_ID              | varchar(64) | Rowset 的 ID，是 Rowset 的唯一标识。   |
| TABLET_ID              | bigint      | Tablet 的 ID，是 Tablet 的唯一标识。   |
| ROWSET_NUM_ROWS        | bigint      | Rowset 包含的数据行数。                |
| TXN_ID                 | bigint      | 写入 Rowset 的事务 ID。                |
| NUM_SEGMENTS           | bigint      | Rowset 包含的 Segment 数目。           |
| START_VERSION          | bigint      | Rowset 的开始版本号。                  |
| END_VERSION            | bigint      | Rowset 的结束版本号。                  |
| INDEX_DISK_SIZE        | bigint      | Rowset 内索引的存储空间。              |
| DATA_DISK_SIZE         | bigint      | Rowset 内数据的存储空间。              |
| CREATION_TIME          | datetime    | Rowset 的创建时间。                    |
| NEWEST_WRITE_TIMESTAMP | datetime    | Rowset 的最近写入时间。                |
| SCHEMA_VERSION         | int         | Rowset 数据对应的表 Schema 版本号。    |
| COMMIT_TSO             | bigint      | Rowset 元数据中记录的提交 TSO（64 位）。通常只有在 FE 级别 `enable_tso_feature = true`、表级 `enable_tso = true`，且事务成功拿到有效 TSO 时才会有值；未记录时通常为 `-1`。 |

## 使用说明

- `COMMIT_TSO` 适合用于追踪开启 TSO 的表所生成 Rowset 的全局提交顺序。
- 如果 `COMMIT_TSO = -1`，通常表示该表未开启 TSO 记录能力，或者该事务没有持久化 commit TSO。
- `COMMIT_TSO` 反映的是已经提交到 Rowset 元数据中的结果，而不是 `TSOService` 当前的内部状态；表级 TSO 开关也不会改变服务如何发号。

示例：

```sql
SELECT BACKEND_ID, TXN_ID, TABLET_ID, ROWSET_ID, COMMIT_TSO
FROM information_schema.rowsets
WHERE COMMIT_TSO != -1
ORDER BY COMMIT_TSO DESC
LIMIT 20;
```
