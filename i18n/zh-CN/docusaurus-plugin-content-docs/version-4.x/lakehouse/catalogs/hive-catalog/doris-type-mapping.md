---
{
    "title": "Hive 与 Doris 数据类型映射",
    "sidebar_label": "Doris 数据类型映射",
    "description": "Doris 4.2 Hive 类型映射参考：数据类型、精度、嵌套类型和不支持的类型。"
}
---

以下表格描述 Doris 4.2（`branch-4.2`）读取 Hive 外部表 Schema 时的类型映射。写入外部表时还受目标表 Schema 和写入能力限制，不能直接将读取映射反向使用。

| Hive Type     | Doris Type    | Comment                   |
| ------------- | ------------- | ------------------------- |
| boolean       | boolean       |                           |
| tinyint       | tinyint       |                           |
| smallint      | smallint      |                           |
| int           | int           |                           |
| bigint        | bigint        |                           |
| date          | date          |                           |
| timestamp     | datetime(6)   | 固定映射到精度为 6 的 datetime     |
| float         | float         |                           |
| double        | double        |                           |
| decimal(P, S) | decimal(P, S) | 如果未指定精度，默认为 decimal(9, 0) |
| char(N)       | char(N)       |                           |
| varchar(N)    | varchar(N)    |                           |
| string        | string        |                           |
| binary        | VARBINARY | 自 4.1.5 版本起固定映射为 `VARBINARY`，`enable.mapping.varbinary` 仅作为兼容标记，设为 `false` 不再恢复 `STRING` 映射。4.1.5 之前可通过该属性选择旧映射。 |
| timestamp with local time zone| TIMESTAMPTZ(6) | 自 4.1.5 版本起固定映射为 `TIMESTAMPTZ(6)`，`enable.mapping.timestamp_tz` 仅作为兼容标记，设为 `false` 不再恢复 `DATETIME` 映射。精度最高为 6，超过的部分会丢失。4.1.5 之前可通过该属性选择旧映射。 |
| array         | array         |                           |
| map           | map           |                           |
| struct        | struct        |                           |
| other         | unsupported   |                           |

## 使用说明

复合类型的子字段递归使用上述映射。`TIMESTAMPTZ` 表示时间点，按会话 `time_zone` 展示。4.2 中 `enable.mapping.varbinary` 和 `enable.mapping.timestamp_tz` 仅为兼容标记，设为 `false` 不会恢复 `STRING` 或 `DATETIME` 旧映射。

Hive Catalog 从 Hive Metastore 的类型字符串推断 Schema。`timestamp` 映射为 `DATETIME(6)`，不会因为底层文件保存了纳秒就自动映射为 `TIMESTAMP_NS`。`uniontype` 等未列为支持的类型不受支持。

实现依据：[HiveMetaStoreClientHelper.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/hive/HiveMetaStoreClientHelper.java)（`branch-4.2`）。
