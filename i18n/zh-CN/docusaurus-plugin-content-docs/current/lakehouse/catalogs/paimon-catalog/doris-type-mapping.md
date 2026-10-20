---
{
    "title": "Paimon 与 Doris 数据类型映射",
    "sidebar_label": "Doris 数据类型映射",
    "description": "Doris 4.2 Paimon 类型映射参考：数据类型、精度、嵌套类型和不支持的类型。"
}
---

以下表格描述 Doris 4.2（`branch-4.2`）读取 Paimon 外部表 Schema 时的类型映射。写入外部表时还受目标表 Schema 和写入能力限制，不能直接将读取映射反向使用。

| Paimon Type                        | Doris Type    | Comment                                |
| ---------------------------------- | ------------- | -------------------------------------- |
| boolean                              | boolean                   |                                                                                                                                                                               |
| tinyint                              | tinyint                   |                                                                                                                                                                               |
| smallint                             | smallint                  |                                                                                                                                                                               |
| integer                              | int                       |                                                                                                                                                                               |
| bigint                               | bigint                    |                                                                                                                                                                               |
| float                                | float                     |                                                                                                                                                                               |
| double                               | double                    |                                                                                                                                                                               |
| decimal(P, S)                        | decimal(P, S)             |                                                                                                                                                                               |
| varchar(N) | VARCHAR(N) / STRING | `N <= 65533` 时为 `VARCHAR(N)`；更长时为 `STRING`。 |
| char(N) | CHAR(N) / STRING | `N <= 255` 时为 `CHAR(N)`；更长时为 `STRING`。 |
| binary(N), varbinary(N) | VARBINARY(N) | 保留声明的字节长度。`enable.mapping.varbinary=false` 不会恢复 `STRING` 映射。 |
| date                                 | date                      |                                                                                                                                                                               |
| timestamp_without_time_zone(P) | DATETIME(P) / TIMESTAMP_NS | `P <= 6` 时为 `DATETIME(P)`；4.2 中 `P > 6` 时为 `TIMESTAMP_NS`，保留亚微秒精度。 |
| timestamp\_with\_local\_time\_zone | TIMESTAMPTZ(N) | 自 4.1.5 版本起固定映射为 `TIMESTAMPTZ(N)`，`enable.mapping.timestamp_tz` 仅作为兼容标记，设为 `false` 不再恢复 `DATETIME` 映射。精度最高为 6，超过的部分会丢失。4.1.5 之前可通过该属性选择旧映射。 |
| array                                | array                     |                                                                                                                                                                               |
| map                                  | map                       |                                                                                                                                                                               |
| row                                  | struct                    |                                                                                                                                                                               |
| variant | VARIANT | 读取需要 FE 配置 `enable_variant_v2=true`。 |
| time_without_time_zone | UNSUPPORTED | |
| other                                | UNSUPPORTED               |                                                                                                                                                                               |

## 使用说明

复合类型的子字段递归使用上述映射。`TIMESTAMPTZ` 表示时间点，按会话 `time_zone` 展示。4.2 中 `enable.mapping.varbinary` 和 `enable.mapping.timestamp_tz` 仅为兼容标记，设为 `false` 不会恢复 `STRING` 或 `DATETIME` 旧映射。

无时区时间戳和带本地时区时间戳的精度处理不同：前者在 4.2 中可保留纳秒，后者最多保留 6 位小数。`TIMESTAMP_NS` 的范围为 `1677-09-21 00:12:43.145224192` 至 `2262-04-11 23:47:16.854775807`。

执行 `DESCRIBE table_name` 时，Extra 列中的 `WITH_TIMEZONE` 表示源字段带时区信息。

实现依据：[PaimonUtil.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/paimon/PaimonUtil.java)（`branch-4.2`）。
