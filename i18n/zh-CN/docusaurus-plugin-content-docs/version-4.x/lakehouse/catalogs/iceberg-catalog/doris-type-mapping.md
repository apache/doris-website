---
{
    "title": "Iceberg 与 Doris 数据类型映射",
    "sidebar_label": "Doris 数据类型映射",
    "description": "Doris 4.2 Iceberg 类型映射参考：数据类型、精度、嵌套类型和不支持的类型。"
}
---

以下表格描述 Doris 4.2（`branch-4.2`）读取 Iceberg 外部表 Schema 时的类型映射。写入外部表时还受目标表 Schema 和写入能力限制，不能直接将读取映射反向使用。

| Iceberg Type                           | Doris Type           | Comment               |
| -------------------------------------- | -------------------- | --------------------- |
| boolean                                | boolean              |                       |
| integer                                | int                  |                       |
| long                                   | bigint               |                       |
| float                                  | float                |                       |
| double                                 | double               |                       |
| decimal(P, S)                          | decimal(P, S)        |                       |
| date                                   | date                 |                       |
| timestamp (Timestamp without timezone) | datetime(6)          | 固定映射到精度为 6 的 datetime |
| timestamptz (Timestamp with timezone)  | TIMESTAMPTZ(6) | 自 4.1.5 版本起固定映射为 `TIMESTAMPTZ(6)`。精度最高为 6，超过的部分会丢失。 |
| fixed(N) | VARBINARY(N) | 自 4.1.5 版本起保留固定二进制宽度。 |
| string                                 | string               |                       |
| binary                                 | VARBINARY | 自 4.1.5 版本起固定映射为 `VARBINARY`。 |
| uuid | UUID | 4.2 映射为原生 `UUID`；4.1.5 映射为 `VARBINARY(16)`。 |
| struct                                 | struct（2.1.3 版本开始支持） |                       |
| map                                    | map（2.1.3 版本开始支持）    |                       |
| list                                   | array                |                       |
| timestamp_ns (without timezone) | TIMESTAMP_NS | 保留纳秒精度，不按会话时区转换。 |
| timestamptz_ns (with timezone) | UNSUPPORTED | 不支持带时区的纳秒时间戳。 |
| time | UNSUPPORTED | 不映射为 Doris `TIME`。 |
| variant | VARIANT | Iceberg V3 Variant；读取需要参与查询的 BE 支持 Variant。 |
| other                                  | UNSUPPORTED          |                       |

## 使用说明

复合类型的子字段递归使用上述映射。`TIMESTAMPTZ` 表示时间点，按会话 `time_zone` 展示。

`timestamp` 和 `timestamptz` 使用微秒精度；只有不带时区的 `timestamp_ns` 映射为 `TIMESTAMP_NS`。`TIMESTAMP_NS` 的范围为 `1677-09-21 00:12:43.145224192` 至 `2262-04-11 23:47:16.854775807`，超出范围的值不能表示。

执行 `DESCRIBE table_name` 时，Extra 列中的 `WITH_TIMEZONE` 表示源字段带时区信息。

向 Iceberg UUID 字段写入 Parquet 时会保留 UUID 逻辑标记，包括嵌套字段。

实现依据：[IcebergUtils.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/iceberg/IcebergUtils.java)（`branch-4.2`）。
