---
{
    "title": "Hive to Doris Data Type Mapping",
    "sidebar_label": "Doris Data Type Mapping",
    "description": "Doris 4.2 Hive type mapping reference covering data types, precision, nested types, and unsupported types."
}
---

The following table describes how Doris 4.2 (`branch-4.2`) maps Hive external-table schemas when reading. Writes also depend on the target schema and supported write operations; the read mapping is not an automatic inverse mapping for writes.

| Hive Type     | Doris Type    | Comment                                        |
| ------------- | ------------- | ---------------------------------------------- |
| boolean       | boolean       |                                                |
| tinyint       | tinyint       |                                                |
| smallint      | smallint      |                                                |
| int           | int           |                                                |
| bigint        | bigint        |                                                |
| date          | date          |                                                |
| timestamp     | datetime(6)   | Mapped to datetime with precision 6            |
| float         | float         |                                                |
| double        | double        |                                                |
| decimal(P, S) | decimal(P, S) | Defaults to decimal(9, 0) if precision not specified |
| char(N)       | char(N)       |                                                |
| varchar(N)    | varchar(N)    |                                                |
| string        | string        |                                                |
| binary | VARBINARY | Since 4.1.5, this type always maps to `VARBINARY`. |
| timestamp with local time zone | TIMESTAMPTZ(6) | Since 4.1.5, this type always maps to `TIMESTAMPTZ(6)`. Precision is capped at 6, so higher precision is lost. |
| array         | array         |                                                |
| map           | map           |                                                |
| struct        | struct        |                                                |
| other         | unsupported   |                                                |

## Usage Notes

Child fields of complex types use the same mappings recursively. `TIMESTAMPTZ` represents an instant displayed in the session `time_zone`.

Hive Catalog derives schemas from Hive Metastore type strings. `timestamp` maps to `DATETIME(6)`; nanosecond data in the underlying file does not automatically change the mapping to `TIMESTAMP_NS`. Types not listed as supported, including `uniontype`, are unsupported.

Implementation reference: [HiveMetaStoreClientHelper.java](https://github.com/apache/doris/blob/bcaaa5f293674f1adba0dfa52c8f8f57fb5e9549/fe/fe-core/src/main/java/org/apache/doris/datasource/hive/HiveMetaStoreClientHelper.java) (`branch-4.2`).
