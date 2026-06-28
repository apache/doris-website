---
{
    "title": "Data Type Mapping",
    "language": "en",
    "description": "Data type mapping for Doris Streaming Job CDC: how upstream PostgreSQL types map to Doris column types during automatic table creation, and how values are converted when written into Doris."
}
---

<!-- Knowledge type: Reference / data type mapping -->

The table below shows how each upstream PostgreSQL column type maps to a Doris column type. There is a single mapping, shared by both sync methods — the only difference is who creates the target table:

- **Auto Table Creation Sync**: Doris reads the upstream schema and creates the target table with these Doris column types automatically.
- **SQL Mapping Sync**: you create the target table yourself, using a compatible Doris type for each column.

In both cases, the values are written following the same mapping. For types that are not supported, see [Limitations](./continuous-load-overview.md#limitations).

## PostgreSQL to Doris

| PostgreSQL Type | Doris Type | Notes |
| --- | --- | --- |
| `bool` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` | `STRING` | |
| `int2` / `smallserial` | `SMALLINT` | |
| `int4` / `serial` | `INT` | |
| `int8` / `bigserial` | `BIGINT` | |
| `float4` | `FLOAT` | |
| `float8` | `DOUBLE` | |
| `numeric(p,s)` | `DECIMAL(min(p,38), s)` | Precision capped at 38; scale defaults to 9 when unspecified |
| `bpchar(n)` (i.e. `CHAR(n)`) | `CHAR` / `VARCHAR` | Length scaled ×3 for UTF-8; `> 255` becomes `VARCHAR` |
| `varchar` / `text` | `STRING` | PostgreSQL `varchar` maps to `STRING` (no length) |
| `date` | `DATE` | |
| `timestamp` / `timestamptz` | `DATETIME(s)` | Scale 0–6; `timestamptz` normalized to the server time zone |
| `time` / `timetz` / `interval` | `STRING` | `timetz` keeps its UTC-normalized offset |
| `uuid` / `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64-encoded string |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `JSON` | |
| Geometry types (`point`, `line`, `polygon`, …) | `STRING` | Serialized as a GeoJSON string (`type` / `coordinates` / `srid`) |
| Array types (e.g. `int4[]`, `text[]`) | `ARRAY<T>` | One-dimensional only |
| Other / user-defined types | `STRING` | |
