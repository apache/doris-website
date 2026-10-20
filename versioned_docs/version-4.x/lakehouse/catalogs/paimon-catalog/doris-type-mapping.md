---
{
    "title": "Paimon to Doris Data Type Mapping",
    "sidebar_label": "Doris Data Type Mapping",
    "description": "Doris 4.2 Paimon type mapping reference covering data types, precision, nested types, and unsupported types."
}
---

The following table describes how Doris 4.2 (`branch-4.2`) maps Paimon external-table schemas when reading. Writes also depend on the target schema and supported write operations; the read mapping is not an automatic inverse mapping for writes.

| Paimon Type                        | Doris Type    | Comment                                                                 |
| ---------------------------------- | ------------- | ----------------------------------------------------------------------- |
| boolean                            | boolean       |                                                                         |
| tinyint                            | tinyint       |                                                                         |
| smallint                           | smallint      |                                                                         |
| integer                            | int           |                                                                         |
| bigint                             | bigint        |                                                                         |
| float                              | float         |                                                                         |
| double                             | double        |                                                                         |
| decimal(P, S)                      | decimal(P, S) |                                                                         |
| varchar(N) | VARCHAR(N) / STRING | `VARCHAR(N)` for `N <= 65533`; otherwise `STRING`. |
| char(N) | CHAR(N) / STRING | `CHAR(N)` for `N <= 255`; otherwise `STRING`. |
| binary(N), varbinary(N) | VARBINARY(N) | Preserves the declared byte length. `enable.mapping.varbinary=false` does not restore the `STRING` mapping. |
| date                               | date          |                                                                         |
| timestamp_without_time_zone(P) | DATETIME(P) / TIMESTAMP_NS | `DATETIME(P)` for `P <= 6`; in 4.2, `P > 6` maps to `TIMESTAMP_NS`, preserving sub-microsecond precision. |
| timestamp\_with\_local\_time\_zone | TIMESTAMPTZ(N) | Since 4.1.5, this type always maps to `TIMESTAMPTZ(N)`. The `enable.mapping.timestamp_tz` property is retained for compatibility; setting it to `false` no longer restores the `DATETIME` mapping. Precision is capped at 6, so higher precision is lost. Earlier versions allow the property to select the legacy mapping. |
| array                              | array         |                                                                         |
| map                                | map           |                                                                         |
| row                                | struct        |                                                                         |
| variant | VARIANT | Reading requires the FE configuration `enable_variant_v2=true`. |
| time_without_time_zone | UNSUPPORTED | |
| other                              | UNSUPPORTED   |                                                                         |

## Usage Notes

Child fields of complex types use the same mappings recursively. `TIMESTAMPTZ` represents an instant displayed in the session `time_zone`. In 4.2, `enable.mapping.varbinary` and `enable.mapping.timestamp_tz` are compatibility markers; setting either to `false` does not restore the legacy `STRING` or `DATETIME` mapping.

Precision handling differs for unzoned and local-zoned timestamps: 4.2 can preserve nanoseconds for the former, while the latter is capped at six fractional digits. The `TIMESTAMP_NS` range is `1677-09-21 00:12:43.145224192` through `2262-04-11 23:47:16.854775807`.

In `DESCRIBE table_name`, `WITH_TIMEZONE` in the Extra column identifies a timezone-aware source field.

Implementation reference: [PaimonUtil.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/paimon/PaimonUtil.java) (`branch-4.2`).
