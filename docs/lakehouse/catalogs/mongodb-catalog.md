---
{
    "title": "MongoDB Catalog",
    "language": "en",
    "description": "Query MongoDB with Doris 5.0: BSON types, schemas, read routing, consistent snapshots, and bounded parallel scans.",
    "keywords": ["MongoDB Catalog", "Doris 5.0", "native MongoDB", "BSON", "readConcern", "readPreference", "MongoDB snapshot", "parallel scan"]
}
---

MongoDB Catalog lets Doris query MongoDB collections, standard views, and logical time-series collections directly, join them with other Doris data, and copy supported columns into internal tables. The native reader preserves BSON types without a Trino connector, JDBC driver, or BE JVM.

:::note
Available from **Doris 5.0.0**. Use a matching FE/BE build containing the MongoDB connector and native reader. This is a read-only connector: MongoDB writes, CDC, and external table/database management are not supported.
:::

## Supported deployments and objects

MongoDB 7.0 and 8.0 are the qualified server series. Connect a sharded collection through **mongos**, rather than assembling reads from individual shards. Every FE and participating BE must reach the addresses MongoDB advertises, including discovered replica-set members.

| Deployment/object | Ordinary reads | Common snapshot | Parallel range reads |
| --- | --- | --- | --- |
| Ordinary collection on a replica set | Yes | Yes | Yes, opt-in |
| Ordinary collection through mongos | Yes | Yes | Yes, opt-in |
| Standard view | Yes, by its public name and with its pipeline/collation | No | No |
| Time-series collection | Yes, as logical measurements | Yes, with the qualified simple-collation definition | No |
| Standalone MongoDB | Yes, for ordinary reads | No | No |

Time-series reads do not access `system.buckets`, invent a unique `_id`, or deduplicate measurements with equal timestamps. SRV, mixed-version upgrades/downgrades, and other server/authentication combinations are not qualified by this page.

## Quick start

### 1. Prepare MongoDB data and a reader

Run with a MongoDB account allowed to create the example data and user. Replace `<password>` with your own password.

```javascript
const analytics = db.getSiblingDB("analytics");
analytics.orders.insertMany([
    {_id: ObjectId("000000000000000000000001"), order_id: NumberLong("1"),
     amount: NumberDecimal("12.34"), created: ISODate("2024-01-01T00:00:00.123Z")},
    {_id: ObjectId("000000000000000000000002"), order_id: NumberLong("2"),
     amount: NumberDecimal("5.60"), created: ISODate("2024-01-01T00:00:01.000Z")}
]);
db.getSiblingDB("admin").createUser({
    user: "doris_reader", pwd: "<password>",
    roles: [{role: "read", db: "analytics"}]
});
```

Doris needs `find` on each logical collection or view. Schema discovery from validators also needs full collection metadata. With custom MongoDB roles, provide the corresponding metadata permissions; an explicit or document schema can be used with a restricted view-only reader. A Doris user must also have permission to create/use the catalog and query its external tables.

### 2. Create the Catalog

Use the appropriate URI topology below. This example uses an explicit mapping, so it does not depend on a MongoDB validator or sampled documents.

```sql
CREATE CATALOG mongo_catalog PROPERTIES (
    'type' = 'mongodb',
    'mongodb.uri' = 'mongodb://mongo1.example.com:27017,mongo2.example.com:27017/?replicaSet=rs0',
    'mongodb.username' = 'doris_reader',
    'mongodb.password' = '<password>',
    'mongodb.auth_database' = 'admin',
    'mongodb.databases' = 'analytics',
    'mongodb.schema.mode' = 'explicit',
    'mongodb.schema' = '{"analytics.orders":{"columns":[
        {"name":"id","path":["_id"],"bson_types":["objectId"],"doris_type":"VARBINARY(12)"},
        {"name":"order_id","path":["order_id"],"bson_types":["long"],"doris_type":"BIGINT"},
        {"name":"amount","path":["amount"],"bson_types":["decimal"],"doris_type":"DECIMAL(18,2)"},
        {"name":"created","path":["created"],"bson_types":["date"],"doris_type":"DATETIME(3)"}
    ]}}'
);
```

| Topology | URI example |
| --- | --- |
| Replica set | `mongodb://mongo1.example.com:27017,mongo2.example.com:27017/?replicaSet=rs0` |
| Sharded cluster | `mongodb://router1.example.com:27017,router2.example.com:27017/` |
| Standalone, ordinary reads | `mongodb://mongo.example.com:27017/` |

`replicaSet` is the source replica-set name; mongos addresses identify routers, not shard members. `directConnection=true` addresses one server directly and should not be combined with a multi-host seed list. Prefer discovery for a replica set or multiple routers for a sharded cluster. URI credentials and separate username/password properties are alternative credential sources: do not specify both. Percent-encode reserved characters in URI credentials. See [MongoDB connection strings](https://www.mongodb.com/docs/manual/reference/connection-string/).

### 3. Query and materialize

```sql
SHOW DATABASES FROM mongo_catalog;
SHOW TABLES FROM mongo_catalog.analytics;
DESC mongo_catalog.analytics.orders;
SET time_zone = 'UTC';
SELECT order_id, amount, created
FROM mongo_catalog.analytics.orders ORDER BY order_id;
```

```text
1  12.34  2024-01-01 00:00:00.123
2   5.60  2024-01-01 00:00:01.000
```

Display or compare an ObjectId through its hexadecimal string:

```sql
SELECT FROM_BINARY(id) FROM mongo_catalog.analytics.orders ORDER BY order_id;
```

```text
000000000000000000000001
000000000000000000000002
```

To materialize the typed values in Doris:

```sql
CREATE DATABASE IF NOT EXISTS internal.reporting;
CREATE TABLE internal.reporting.order_copy
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES ('replication_num' = '1')
AS SELECT order_id, amount, created FROM mongo_catalog.analytics.orders;
SELECT count(*) FROM internal.reporting.order_copy;
```

The count is `2`. Set the replication policy for your cluster; the example uses one replica so it also runs on a single BE.

## Catalog parameters

Unknown `mongodb.*` properties are rejected. Timeout values are milliseconds; all three timeout properties accept `1`–`300000`.

| Parameter | Type | Required/default | Effect |
| --- | --- | --- | --- |
| `type` | STRING | Required: `mongodb` | Selects the native connector. |
| `mongodb.uri` | STRING | Required | MongoDB endpoint, topology, and URI options. The URI is sensitive. |
| `mongodb.username` | STRING | Optional, empty | Separate authentication user; omit when credentials are in the URI. |
| `mongodb.password` | STRING | Optional, empty | Separate password; requires `mongodb.username` and is sensitive. |
| `mongodb.auth_database` | STRING | `admin` | Authentication database for separate credentials; it can differ from the data database. URI credentials use their URI authentication source. |
| `mongodb.databases` | STRING | Empty | Comma-separated database allowlist. Avoids requiring permission to enumerate all databases; does not grant data access. |
| `mongodb.schema.mode` | STRING | `auto` | `auto`, `validator`, `explicit`, or `document`; see below. |
| `mongodb.schema` | JSON string | `{}` | Explicit mappings keyed by `database.collection`; at most 1 MiB and 1024 namespace entries. |
| `mongodb.type_mismatch` | STRING | `error` | `error` fails on an incompatible value; `null` replaces the failed top-level field with SQL NULL. |
| `mongodb.datetime_timezone` | STRING | `UTC` | Only `UTC` is accepted for BSON Date interpretation. |
| `mongodb.read_preference` | STRING | `primary` | Default data-node routing mode. |
| `mongodb.read_concern` | STRING | `majority` | Default `local`, `majority`, `available`, or `snapshot` policy. |
| `mongodb.connect_timeout_ms` | INT | `10000` | Connection establishment cap. |
| `mongodb.server_selection_timeout_ms` | INT | `10000` | Cap on finding a suitable server. |
| `mongodb.socket_timeout_ms` | INT | `1000` | Network I/O cap; the remaining scan deadline can shorten it. |
| `mongodb.pool_max_clients` | INT | `16`; range `1`–`1024` | Compatible client leases per Catalog/configuration on each BE; it is not a cluster-wide source limit. |

For read preference and concern, precedence is **explicit statement/session value > URI option > Catalog property > default**. An `inherit` session value uses the effective URI/Catalog policy. The Catalog connection/selection/socket/pool properties instead **override the corresponding URI transport options**. Timeouts and client limits do not set the number of splits.

TLS/authentication URI options are passed to the drivers; any referenced files must be available to the FE and BEs. Disabling TLS hostname validation is rejected. Certificate/credential rotation services and generalized cross-query/source admission are not provided by this Catalog. Use the authentication and TLS combinations qualified for your deployment.

## Schema and BSON types

Schema selection does **not** infer a schema by sampling records. Range-boundary sampling, described later, has a separate purpose.

| Mode | Selection |
| --- | --- |
| `auto` | An explicit namespace mapping, else a fully representable ordinary-collection `$jsonSchema` validator, else whole-document mode. |
| `validator` | Requires a fully representable ordinary-collection validator; fails otherwise. |
| `explicit` | Requires a namespace entry in `mongodb.schema`. |
| `document` | Exposes `_mongo_ejson` as canonical Extended JSON and `_mongo_bson` as the original BSON bytes. |

An incomplete validator mapping never silently discards declared fields. Unsupported validator constructs make `auto` fall back for the entire collection; `validator` fails. A validator does not prove historical documents match it. Mapped fields remain nullable; missing fields and BSON null both become SQL NULL. Use the original BSON or Extended JSON when that distinction matters.

Explicit bindings use the following fields:

| Field | Meaning |
| --- | --- |
| `name` | Required. Doris column name; Doris names are folded to lowercase. |
| `path` | Required. Exact, case-sensitive source path segments. `["a.b"]` is a literal dotted key; `["a","b"]` is a nested path. |
| `doris_type` | Required. Target type, including Decimal precision/scale or DATETIME fractional precision. |
| `bson_types` | Accepted BSON tags, such as `long`, `decimal`, `date`, or `objectId`; omission does not add implicit coercions. |
| `subtype` | Required Binary subtype when mapping `binData` to VARBINARY, for example `0`. |
| `children` | Optional recursive struct-field/array-element bindings. Struct children match by name; an array has one element binding. |

| BSON value | Doris mapping/constraint |
| --- | --- |
| Boolean | BOOLEAN. |
| int32 / int64 | Integer targets within range; BIGINT preserves int64 exactly. Values outside the target range or requiring a lossy conversion fail. |
| Double | Floating-point target subject to exact conversion rules; it is not an implicit integer/string conversion. |
| String | STRING/VARCHAR; no implicit numeric parsing. |
| Decimal128 | Explicit `DECIMAL(p,s)`, with `p <= 38`; no rounding. Validator-derived Decimal values use Extended JSON because there is no declared common scale. |
| Date | UTC `DATETIME(3)` by default, or explicit DATETIME precision `0`–`6` / BIGINT epoch milliseconds. No precision loss is allowed. |
| ObjectId | Raw VARBINARY(12); use `FROM_BINARY` for hex display and string comparisons/joins/grouping. Direct VARBINARY operators retain Doris's restrictions. |
| Binary | VARBINARY with an explicit subtype; Extended JSON preserves other representations. Declared VARBINARY length does not truncate bytes. |
| Timestamp | `STRUCT<seconds:BIGINT,increment:BIGINT>`, preserving both unsigned 32-bit components; not BSON Date. |
| Regular expression | Explicit `STRUCT<pattern:STRING,options:STRING>` preserves its pattern/options; validator-derived values use Extended JSON. |
| Object / Array | Representable STRUCT/ARRAY bindings, or canonical Extended JSON for free-form/heterogeneous values. |
| Other BSON tags | Preserve through canonical Extended JSON or raw BSON instead of assuming a typed conversion. |

Only the listed target families are supported; MAP, VARIANT, and arbitrary implicit casts are not. `mongodb.type_mismatch=null` rolls back a failed top-level field, including nested data; it does not keep a partially decoded array or suppress source/network/allocation errors.

### Date/time and Decimal precision

BSON Date has millisecond precision and carries no original time-zone label. `mongodb.datetime_timezone` stays UTC; Doris session `time_zone` controls the returned local datetime. Increasing DATETIME precision pads the millisecond value; it cannot recover microseconds that MongoDB never stored. A value with nonzero milliseconds cannot be silently truncated to `DATETIME(0)`: it becomes NULL under `type_mismatch=null`, or fails under `error`.

Decimal conversion likewise requires the exact target scale and precision. For example, `12.34` fits `DECIMAL(18,2)` but needs rounding for `DECIMAL(18,1)`; a value that does not fit fails or becomes NULL. Non-finite Decimal128 values have no Doris DECIMAL representation. Keep them as Extended JSON when needed.

## Read routing and consistency

`readPreference` chooses a member; `readConcern` controls the visibility MongoDB supplies. Doris forwards the effective policies. Choosing a secondary does not establish a snapshot or guarantee the latest data.

| `mongodb_read_preference` value | Effect |
| --- | --- |
| `inherit` | Use the effective URI/Catalog preference. |
| `primary` | Read the primary. |
| `primaryPreferred` | Prefer the primary; allow eligible secondaries if it is unavailable. |
| `secondary` | Require an eligible secondary. |
| `secondaryPreferred` | Prefer eligible secondaries; allow the primary if none is eligible. |
| `nearest` | Select an eligible member within the latency window, regardless of role. |

URI tag-set order and maximum-staleness constraints remain in effect when a session changes the mode. A `primary` override conflicting with URI tags/staleness/hedge criteria fails instead of discarding them. See [MongoDB read preference](https://www.mongodb.com/docs/manual/core/read-preference/).

| `mongodb_read_concern` value | Effect |
| --- | --- |
| `inherit` | Use the effective URI/Catalog concern. |
| `local` | Can read values not yet majority committed, which may be rolled back. |
| `majority` | Read the majority-committed view; does not pin one time across independent scans. |
| `available` | Relaxes consistency/shard-ownership checks and can return orphaned documents. |
| `snapshot` | Doris additionally pins one server-selected time across qualified MongoDB scans in this SQL statement. |

`linearizable` is rejected: this general collection-scan contract does not validate MongoDB's primary-only, uniquely identified single-document requirements. See [MongoDB read concern](https://www.mongodb.com/docs/manual/reference/read-concern/).

```sql
SET mongodb_read_preference = 'secondaryPreferred';
SELECT /*+ SET_VAR(mongodb_read_preference='primary', mongodb_read_concern='majority') */
    count(*) FROM mongo_catalog.analytics.orders;
SET mongodb_read_preference = 'inherit';
```

The statement uses primary/majority, returns `2` for the example data, and does not change the Catalog default or other sessions.

### One snapshot across scans

For snapshot reads, the account needs full namespace metadata and deployment identity access: `replSetGetConfig` on a replica set, or `find` on `config.version` through mongos. With a custom role, add these privileges to the data/metadata permissions. Range planning additionally needs `listIndexes` and `collStats` for the collection.

```javascript
db.getSiblingDB("admin").createRole({
    role: "doris_snapshot_identity",
    privileges: [{resource: {cluster: true}, actions: ["replSetGetConfig"]}],
    roles: []
});
db.getSiblingDB("admin").grantRolesToUser("doris_reader", ["doris_snapshot_identity"]);
```

The role above is for a replica set. For mongos, use `{resource: {db: "config", collection: "version"}, actions: ["find"]}` as its privilege instead.

```sql
SELECT /*+ SET_VAR(mongodb_read_concern='snapshot') */ l.n, r.n
FROM (SELECT count(*) n FROM mongo_catalog.analytics.orders) l
CROSS JOIN (SELECT count(*) n FROM mongo_catalog.analytics.orders) r;
```

The example returns `2, 2`. FE obtains a server-selected timestamp `T`; all participating MongoDB scans read that same `T`, including different Catalogs pointing to the same deployment. This timestamp is not the local wall clock, and user-supplied time-travel timestamps are not supported.

One statement cannot mix snapshot and ordinary MongoDB scans or pin independent MongoDB deployments. History must remain available for the entire query. Namespace replacement, replica-set configuration changes, incompatible time-series definitions, authorization failures, or `SnapshotTooOld` fail the statement. Doris does not select a newer timestamp or downgrade the read concern to turn a failed snapshot into success.

## Parallel range reads

The default `mongodb_split_strategy=single` creates **one split per table scan**. Only one scanner can read that split, even if scanner limits or BE count are higher. Multiple scan nodes in one SQL can still run concurrently; mongos may also fan a single request out internally.

| Setting | Type/default | Effect |
| --- | --- | --- |
| `mongodb_split_strategy` | STRING, `single` | `single`, conservative `auto`, or explicit `range`. |
| `mongodb_split_field` | STRING, empty | Empty selects `_id`; otherwise a safe top-level field, at most 256 characters. An explicit field requires exactly one MongoDB scan in the statement. |
| `file_split_size` | BIGINT, `0` | Positive value is the logical-byte target; otherwise use the shared size heuristic. |
| `max_initial_file_split_size` | BIGINT, 32 MiB | Initial target for smaller collections. |
| `max_file_split_size` | BIGINT, 64 MiB | Target for unknown size or size at least this value times `max_initial_file_split_num`. |
| `max_initial_file_split_num` | INT, `200` | Threshold in the shared size heuristic. |
| `max_file_split_num` | INT, `100000` | Count cap; nonpositive removes the user cap, while internal limits remain. Also caps the frozen MongoDB plan in streaming mode. |

Range planning requires a qualified common snapshot and ordinary collection. Multiple partitions additionally require a suitable visible index with the split field as its first key. Setting `max_file_split_num=1`, or a per-plan descriptor limit of one, keeps a single scan without a boundary probe. Partial, sparse, hidden, hashed, or non-simple-collation indexes are not eligible. Boundary families are scalar ObjectId, signed int32/int64, or Date. Decimal/string/double values are not coerced into boundaries.

FE estimates a total from logical collection bytes and the target size, then reads at most 4096 fixed-width candidate values along the index at `T`. This is bounded index-prefix sampling, **not random sampling or schema inference**. It sorts the candidates, chooses quantile boundaries, and reserves a disjoint complement. The plan freezes before any split is published. Sampling affects balance, not coverage.

For four admitted splits with integer samples `1`–`9`, boundaries may be `4` and `7`:

| Split | Coverage |
| --- | --- |
| 1 | Integer values below `4`. |
| 2 | Integer values `>= 4` and `< 7`. |
| 3 | Integer values `>= 7`, including unsampled values such as `1000000`. |
| 4 | All remaining field values, including other types, missing/null, and arrays. |

Half-open ranges place repeated boundary values in exactly one partition. Duplicate samples and budgets can reduce the actual count. The count includes the complement; a requested cap is not a guarantee of that many tasks.

```sql
SELECT /*+ SET_VAR(mongodb_read_concern='snapshot', mongodb_split_strategy='range',
                  file_split_size=1, max_file_split_num=4) */
    count(*) FROM mongo_catalog.analytics.orders;
```

This returns `2` for the quick-start data. The one-byte target is only to demonstrate planning on a tiny collection; use realistic byte targets for production. `auto` can retain single for small/unknown-size collections, missing indexes, unsupported types, or an optional probe-budget limit. `range` reports unsupported conditions. Neither mode converts authorization, source/history errors, or cancellation into a successful full rescan. A failed published plan cannot append a replacement single scan.

Planning has internal limits: 2-second probes bounded by query time, 256 partitions per pinned source, 4096 per statement, and descriptor-byte admission. Successful opt-in single fallbacks count toward admission. The sample uses one bounded response, leaving no remote sampling cursor. These safeguards do not add tunable split parameters.

More splits do not necessarily mean faster reads: a biased prefix can create skew, and the complement adds work. This is why single remains the default.

## Session controls and execution

| Session variable | Type/default | Effect |
| --- | --- | --- |
| `mongodb_read_preference` | STRING, `inherit` | Data routing, as listed above. |
| `mongodb_read_concern` | STRING, `inherit` | Visibility policy, as listed above. |
| `enable_mongodb_predicate_pushdown` | BOOLEAN, `true` | Enables safe source candidates, including LIKE candidates. |
| `enable_mongodb_like_pushdown` | BOOLEAN, `true` | Enables safe LIKE candidates when predicate pushdown is enabled. |
| `enable_mongodb_projection_pushdown` | BOOLEAN, `true` | Enables safe source-root projection. |
| `mongodb_split_strategy` | STRING, `single` | Split strategy, as listed above. |
| `mongodb_split_field` | STRING, empty | Split field, as listed above. |

These variables support `SET` and statement-scoped `SET_VAR`. Doris's existing `batch_size` controls source document batches (`1`–`65535`); `query_timeout` limits the query. `max_file_scanners_concurrency`, `min_file_scanners_concurrency`, `parallel_pipeline_task_num`, remote scanner pools, and workload groups control execution. Scanner and client limits apply within their BE execution scope; they are not a cluster-wide concurrency cap. Increasing them cannot create more readable splits. A busy client checkout yields its worker while retaining the split/deadline so a lease holder can resume.

Predicate pushdown is conservative and keeps the full Doris residual. It requires `type_mismatch=null`; `error` and strict-cast execution keep predicates local to preserve conversion failures. Safe scalar comparisons, positive IN/BETWEEN/IS NOT NULL, AND/OR, UTC Date ranges, and required literal LIKE substrings can be candidates. Unsafe casts/functions, nested/array predicates, NOT/!=/NOT IN, REGEXP, and other unsupported expressions remain local. Standard-view predicates stay local to preserve view semantics and collation.

Projection retains complete source roots needed by outputs/residuals. Whole-document bindings or literal dot/dollar roots can keep the full document. SQL joins, aggregations, sorting, OFFSET, and LIMIT execute in Doris; LIMIT is not pushed to MongoDB.

## Refresh, diagnostics, and troubleshooting

After changing a validator, mapping, view, or collection definition, refresh metadata:

```sql
REFRESH CATALOG mongo_catalog;
EXPLAIN SELECT /*+ SET_VAR(mongodb_read_concern='snapshot', mongodb_split_strategy='range') */
    count(*) FROM mongo_catalog.analytics.orders;
```

EXPLAIN and completed Profiles show the effective read policy/snapshot and split strategy, field, family, requested/admitted/actual counts, and decision reason. Profiles also expose source rows/bytes and `MongoSnapshotTimestamp`; they do not display source boundaries or connection credentials. Enable a query Profile with `SET enable_profile=true` when diagnosing a read.

| Symptom | Action |
| --- | --- |
| Authentication/metadata permission failure | Check the credential source, authentication database, collection metadata permissions, and snapshot identity permissions. Do not combine URI and separate credentials. |
| No eligible secondary / server-selection timeout | Check source health, advertised addresses, tags/staleness, and the selected topology. A standalone server is not a replica-set routing test. |
| Unexpected document columns | Check schema-mode precedence and whether the complete validator is representable; provide an explicit mapping if needed. |
| Conversion failure / unexpected NULL | Check BSON tags, Binary subtype, integer range, Decimal scale/precision, DATETIME precision, and mismatch policy. |
| Snapshot/range unavailable | Use a qualified replica set or mongos, supported object/read concern, suitable index, and sufficient metadata permissions. |
| `SnapshotTooOld` or source definition/configuration changed | Fail the query, refresh changed metadata, and start a new statement. Keep source history long enough for the entire read. |
| Too few actual splits / poor speedup | Inspect size/count settings, duplicate bounds, fallback reason and budgets; account for skew and complement cost before increasing scanner limits. |
| Slow cancellation | Check connection/selection/socket caps. Synchronous driver calls can continue until their configured cap; cancellation does not immediately interrupt every in-flight call. |

Use ordinary reads when independent-source federation or standard views are needed. Use snapshot when one statement needs a shared MongoDB point in time, and opt into range planning only after measuring its source cost. Do not treat a larger scanner setting as a substitute for an eligible split plan.
