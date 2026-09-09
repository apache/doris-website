---
{
    "title": "Data Type Mapping",
    "language": "en",
    "description": "Data type mapping for Doris Streaming Job CDC: how upstream MySQL types map to Doris column types during automatic table creation, and how values are converted when written into Doris."
}
---

<!-- Knowledge type: Reference / data type mapping -->

The table below shows how each upstream MySQL column type maps to a Doris column type. There is a single mapping, shared by both sync methods — the only difference is who creates the target table:

- **Auto Table Creation Sync**: Doris reads the upstream schema and creates the target table with these Doris column types automatically.
- **SQL Mapping Sync**: you create the target table yourself, using a compatible Doris type for each column.

In both cases, the values are written following the same mapping. For types that are not supported, see [Limitations](./continuous-load-overview.md#limitations).

## JDBC URL Parameter Normalization

> Supported since version 4.1.4.

When you create a Streaming Job with a MySQL data source (or use the `cdc_stream()` table function), Doris automatically appends the following parameters to `jdbc_url` unless you set them explicitly:

| Parameter | Injected Value | Effect |
| --- | --- | --- |
| `tinyInt1isBit` | `false` | `TINYINT(1)` is read as `TINYINT` (`1` / `0`) instead of `BOOLEAN` (`true` / `false`) |
| `yearIsDateType` | `false` | `YEAR` is read as an integer year instead of a date |
| `useUnicode` | `true` | Use Unicode encoding |
| `characterEncoding` | `utf-8` | Use UTF-8 as the character set |

If any of these parameters is set explicitly in `jdbc_url`, Doris keeps your value and does not override it. The PostgreSQL `jdbc_url` is not normalized.

:::caution Upgrade impact

After upgrading from 4.1.3 or earlier, `TINYINT(1)` columns in existing MySQL CDC jobs are reported as `1` / `0` instead of `true` / `false`, and `YEAR` columns as integer years instead of dates. To keep the previous behavior, set `tinyInt1isBit=true` and `yearIsDateType=true` explicitly in `jdbc_url`.

:::

## MySQL to Doris

| MySQL Type | Doris Type | Notes |
| --- | --- | --- |
| `BOOLEAN` / `TINYINT(1)` | `TINYINT` | **Since version 4.1.4** this maps to `TINYINT` (values `1` / `0`); before 4.1.4 it mapped to `BOOLEAN` (`true` / `false`). See [JDBC URL Parameter Normalization](#jdbc-url-parameter-normalization) for the reason |
| `TINYINT` | `TINYINT` | `UNSIGNED` → `SMALLINT` |
| `SMALLINT` | `SMALLINT` | `UNSIGNED` → `INT` |
| `MEDIUMINT` | `INT` | `UNSIGNED` → `INT` |
| `INT` | `INT` | `UNSIGNED` → `BIGINT` |
| `BIGINT` | `BIGINT` | `UNSIGNED` → `LARGEINT` |
| `YEAR` | `SMALLINT` | **Since version 4.1.4** the value is read as an integer year rather than as a date; the MySQL zero year (`0000`) is kept as `0` |
| `FLOAT` | `FLOAT` | |
| `DOUBLE` | `DOUBLE` | |
| `DECIMAL(p,s)` | `DECIMAL(p,s)` | Very high precision falls back to `STRING` |
| `DATE` | `DATE` | |
| `DATETIME` | `DATETIME(s)` | Microsecond scale (0–6) preserved |
| `TIMESTAMP` | `DATETIME(s)` | Normalized to the server time zone |
| `TIME` | `STRING` | Serialized as a string, e.g. `12:34:56.000000` |
| `CHAR` | `CHAR` | |
| `VARCHAR` | `VARCHAR` | |
| `TINYTEXT` / `TEXT` / `MEDIUMTEXT` / `LONGTEXT` | `STRING` | |
| `BINARY` / `VARBINARY` / `TINYBLOB` / `BLOB` / `MEDIUMBLOB` / `LONGBLOB` | `STRING` | Base64-encoded string |
| `BIT(1)` | `BOOLEAN` | |
| `BIT(n>1)` | `STRING` | Base64-encoded string |
| `JSON` | `STRING` | Stored as JSON text |
| `ENUM` | `STRING` | Resolved to the label value |
| `SET` | `STRING` | Resolved to comma-separated labels |
| Spatial types (`GEOMETRY`, `POINT`, …) and other types | Not supported | Auto Table Creation fails for tables with such columns; use SQL Mapping Sync (cast in `SELECT`) or exclude the column |
