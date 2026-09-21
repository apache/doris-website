---
{
    "title": "OceanBase Data Type Mapping",
    "language": "en",
    "sidebar_label": "Data Type Mapping",
    "description": "Learn how MySQL-compatible OceanBase column types map to Doris column types during CDC Auto Table Creation Sync."
}
---

<!-- Knowledge type: Reference / data type mapping -->

OceanBase CDC continuous load supports only MySQL compatibility mode and uses the MySQL type conversion path. The following table shows how OceanBase column types map to Doris column types during automatic table creation.

:::caution Experimental feature

OceanBase CDC continuous load is available as an experimental feature starting from Doris 4.1.4.

:::

## JDBC URL Parameter Normalization

When you create an OceanBase Streaming Job, Doris automatically appends the following parameters to `jdbc_url` unless you set them explicitly:

| Parameter | Injected Value | Effect |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | Reads `TINYINT(1)` as `TINYINT` (`1` / `0`) instead of `BOOLEAN` (`true` / `false`). |
| `yearIsDateType` | `false` | Reads `YEAR` as an integer year instead of a date. |
| `useUnicode` | `true` | Uses Unicode encoding. |
| `characterEncoding` | `utf-8` | Uses UTF-8 as the character set. |

If any of these parameters is set explicitly in `jdbc_url`, Doris keeps the configured value.

## OceanBase to Doris

| OceanBase Type (MySQL compatibility mode) | Doris Type | Notes |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | Values are `1` / `0` by default. Set `tinyInt1isBit=true` to change the JDBC read behavior. |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | Read as an integer year; zero year (`0000`) is preserved as `0`. |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | Very high precision falls back to `STRING`. |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Preserves microsecond scale from 0 to 6. |
| `TIMESTAMP` | `DATETIME(s)` | Normalized to the server time zone. |
| `TIME` | `STRING` | Stored as a string, for example, `12:34:56.000000`. |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64-encoded string. |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64-encoded string. |
| `JSON` | `STRING` | Stored as JSON text. |
| `ENUM` | `STRING` | Resolved to the label value. |
| `SET` | `STRING` | Resolved to comma-separated labels. |
| Spatial types (`GEOMETRY`, `POINT`, and others) and other types | Not supported | Automatic table creation fails for a table containing such a column. Exclude a non-key column with `table.<table_name>.exclude_columns`. |

## Considerations

- Type mapping is based on metadata returned by OceanBase through MySQL Connector/J.
- Unsupported types do not fall back to an arbitrary Doris type. Verify the target table schema before creating a production job.
- `TIMESTAMP` is affected by the source time zone and the `serverTimezone` JDBC URL parameter. Set and verify the time zone explicitly for cross-time-zone deployments.
- Primary key columns cannot be excluded through `table.<table_name>.exclude_columns`.

## Related Documents

- [OceanBase CDC with Auto Table Creation](./continuous-load-oceanbase-database.md)
- [OceanBase Schema Change Sync](./schema-change-oceanbase.md)
- [Continuous Load Overview](./continuous-load-overview.md)
