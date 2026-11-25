---
{
    "title": "Data Type Mapping",
    "language": "en",
    "description": "Data type mapping for Doris Streaming Job CDC: how upstream PostgreSQL types map to Doris column types during automatic table creation, and how values are converted when written into Doris."
}
---

:::caution Experimental feature

Doris continuous load is experimental and supported starting with Doris 4.1.5.

:::

<!-- Knowledge type: Reference / data type mapping -->

The table below shows how each upstream PostgreSQL column type maps to a Doris column type. There is a single mapping, shared by both sync methods — the only difference is who creates the target table:

- **Auto Table Creation Sync**: Doris reads the upstream schema and creates the target table with these Doris column types automatically.
- **SQL Mapping Sync**: you create the target table yourself, using a compatible Doris type for each column.

In both cases, the values are written following the same mapping. For types that are not supported, see [Limitations](./continuous-load-overview.md#limitations).

## PostgreSQL to Doris

| PostgreSQL Type | Doris Type | Notes |
| --- | --- | --- |
| `bool` / `boolean` | `BOOLEAN` | |
| `bit(1)` | `BOOLEAN` | |
| `bit(n>1)` / `varbit` / `bit varying` | `STRING` | Base64-encoded string |
| `int2` / `smallint` / `smallserial` | `SMALLINT` | |
| `int4` / `integer` / `serial` | `INT` | |
| `int8` / `bigint` / `bigserial` | `BIGINT` | |
| `float4` / `real` | `FLOAT` | |
| `float8` / `double precision` | `DOUBLE` | |
| `numeric(p,s)` / `decimal(p,s)` | `DECIMAL(p,s)` / `STRING` | Precision above 38 maps to `STRING` |
| `bpchar(n)` (i.e. `CHAR(n)`) | `CHAR` / `VARCHAR` | Length scaled ×3 for UTF-8; above 255 becomes `VARCHAR` |
| `varchar` / `text` | `STRING` | PostgreSQL `varchar` maps to `STRING` (no length) |
| `date` | `DATE` | |
| `timestamp` / `timestamp without time zone` / `timestamptz` / `timestamp with time zone` | `DATETIME(s)` | Scale 0–6; `timestamptz` normalized to the server time zone |
| `time` / `time without time zone` / `timetz` / `time with time zone` / `interval` | `STRING` | `timetz` keeps its UTC-normalized offset |
| `uuid` | `UUID` | |
| `inet` / `cidr` / `macaddr` / `macaddr8` | `STRING` | |
| `bytea` | `STRING` | Base64-encoded string |
| `xml` / `hstore` | `STRING` | |
| `json` / `jsonb` | `STRING` | Stored as JSON text |
| `point` | `STRING` | Serialized as a GeoJSON string (`type` / `coordinates` / `srid`) |
| Array types | `ARRAY<T>` | One-dimensional only. Supported element types: `int2`, `int4`, `int8`, `float4`, `float8`, `numeric(p,s)`, `bool`, `bpchar`, `varchar`, `text`, `date`, `timestamp`, `timestamptz`, `json`, `jsonb`, `uuid`. A non-empty source value must be sampled to infer dimensions; `bpchar[]` maps to `ARRAY<STRING>` |
| Other types | Not supported | |
