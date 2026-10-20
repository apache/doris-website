---
{
    "title": "Iceberg to Doris Data Type Mapping",
    "sidebar_label": "Doris Data Type Mapping",
    "description": "Doris 4.2 Iceberg type mapping reference covering data types, precision, nested types, and unsupported types."
}
---

The following table describes how Doris 4.2 (`branch-4.2`) maps Iceberg external-table schemas when reading. Writes also depend on the target schema and supported write operations; the read mapping is not an automatic inverse mapping for writes.

| Iceberg Type                           | Doris Type           | Comment                                 |
| -------------------------------------- | -------------------- | --------------------------------------- |
| boolean                                | boolean              |                                         |
| integer                                | int                  |                                         |
| long                                   | bigint               |                                         |
| float                                  | float                |                                         |
| double                                 | double               |                                         |
| decimal(P, S)                          | decimal(P, S)        |                                         |
| date                                   | date                 |                                         |
| timestamp (Timestamp without timezone) | datetime(6)          | Mapped to datetime with precision 6     |
| timestamptz (Timestamp with timezone) | TIMESTAMPTZ(6) | Since 4.1.5, this type always maps to `TIMESTAMPTZ(6)`. The `enable.mapping.timestamp_tz` property is retained for compatibility; setting it to `false` no longer restores the `DATETIME` mapping. Precision is capped at 6, so higher precision is lost. Earlier versions allow the property to select the legacy mapping. |
| fixed(N) | VARBINARY(N) | Since 4.1.5, the fixed binary width is preserved. |
| string                                 | string               |                                         |
| binary | VARBINARY | Since 4.1.5, this type always maps to `VARBINARY`. The `enable.mapping.varbinary` property is retained for compatibility; setting it to `false` no longer restores the `STRING` mapping. Earlier versions allow the property to select the legacy mapping. |
| uuid | UUID | Native `UUID` in 4.2; Doris 4.1.5 maps this to `VARBINARY(16)`. |
| struct                                 | struct (supported from version 2.1.3) |                                         |
| map                                    | map (supported from version 2.1.3)    |                                         |
| list                                   | array                |                                         |
| timestamp_ns (without timezone) | TIMESTAMP_NS | Preserves nanosecond precision without session time-zone conversion. |
| timestamptz_ns (with timezone) | UNSUPPORTED | Timezone-aware nanosecond timestamps are unsupported. |
| time | UNSUPPORTED | Does not map to Doris `TIME`. |
| variant | VARIANT | Iceberg V3 Variant; participating BEs must support Variant reads. |
| other                                  | UNSUPPORTED          |                                         |

## Usage Notes

Child fields of complex types use the same mappings recursively. `TIMESTAMPTZ` represents an instant displayed in the session `time_zone`. In 4.2, `enable.mapping.varbinary` and `enable.mapping.timestamp_tz` are compatibility markers; setting either to `false` does not restore the legacy `STRING` or `DATETIME` mapping.

`timestamp` and `timestamptz` use microsecond precision. Only timezone-naive `timestamp_ns` maps to `TIMESTAMP_NS`. Its range is `1677-09-21 00:12:43.145224192` through `2262-04-11 23:47:16.854775807`; values outside this range cannot be represented.

In `DESCRIBE table_name`, `WITH_TIMEZONE` in the Extra column identifies a timezone-aware source field.

Parquet writes to Iceberg UUID fields retain the UUID logical annotation, including nested fields.

Implementation reference: [IcebergUtils.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/iceberg/IcebergUtils.java) (`branch-4.2`).
