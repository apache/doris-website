---
{
    "title": "External Metadata Cache Memory Management",
    "language": "en",
    "description": "Limit FE heap used by external metadata caches with FE, Catalog, and entry memory quotas for Hive, Iceberg, and Paimon.",
    "keywords": ["external metadata cache", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE memory", "catalog_meta_cache_statistics", "Hive Iceberg Paimon metadata cache"]
}
---

Starting from Doris 4.1.4, managed external metadata caches can be limited by estimated retained memory. This prevents metadata from a large table, a single Catalog, or multiple Catalogs from continuously consuming FE heap.

Use this feature when:

- Hive tables have enough partitions or files to create large partition and file-listing structures.
- Iceberg table metadata, partition projections, or manifests are large.
- Paimon partition projections are large.
- An FE serves multiple Catalogs and one Catalog must not dominate metadata-cache memory.

:::tip
The set of managed cache entries and their names differ between Doris 4.1.x/4.2.x and the current version. For a 4.1.x or 4.2.x cluster, switch to the 4.x version of this page.
:::

:::caution
These limits cover only the managed metadata caches listed in this document. They are not a hard FE heap limit. Load-time temporary memory, metadata objects still referenced by running queries, connector SDK caches, and shared runtime infrastructure such as Catalog clients and thread pools are outside the quota.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Configuring FE, Catalog, and entry memory limits -->
## Quick start

Prerequisites:

- An existing external Catalog, for example Hive, Iceberg, or Paimon.
- Permission to update FE configuration and the target Catalog.
- Doris 4.1.4 or later on every FE.

### 1. Configure the FE-wide limit

Set the following in `fe.conf` on every FE:

```properties
external_meta_cache_max_weight = 10%
```

All managed external metadata caches on that FE can then use at most 10% of the JVM maximum heap in total. Restart the FE after changing this setting.

You can also use a fixed size:

```properties
external_meta_cache_max_weight = 8GB
```

### 2. Limit one Catalog

The following example limits managed metadata caches in `hive_ctl` to 4 GB in total:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

After the change, Doris clears the initialized caches of this Catalog and recreates them with the new configuration on the next access.

:::tip
`meta.cache.max-weight` works even when no FE-wide limit is configured. In that case, it limits only this Catalog and does not limit the total across all Catalogs on the FE.
:::

### 3. Limit individual cache entries

The following example sets a Catalog limit and individual Hive entry limits:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

The `file` and `partition_view` entries are limited to 2 GB and 1 GB respectively. Their combined usage cannot exceed the 4 GB Catalog limit, and the Catalog is still constrained by the FE-wide limit.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Understanding how FE, Catalog, and entry limits combine -->
## Quota hierarchy

Three levels of memory limits are available:

| Level | Location | Setting | Format | Default | Scope |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | Fixed size or percentage of the JVM maximum heap | `0`; no FE-wide quota | All managed external metadata caches on the current FE |
| Catalog | Catalog property | `meta.cache.max-weight` | Fixed size; must be positive | Not set; no Catalog quota | All managed entries in the current Catalog |
| Cache entry | Catalog property | `meta.cache.<engine>.<entry>.max-weight` | Fixed size; must be positive | Not set; bounded only by the parent limits | One cache entry, or the group of caches that share that entry |

The effective limit of an entry is the minimum of all configured limits above it.

| FE limit | Catalog limit | Entry limit | Behavior |
|---|---|---|---|
| Not set | Not set | Not set | Memory accounting is disabled; only the count and TTL policies apply |
| Set | Not set | Not set | All managed entries on the FE share the FE quota |
| Not set | Set | Not set | All managed entries in the Catalog share the Catalog quota |
| Not set | Not set | Set | Only that entry is limited; there is no combined FE or Catalog limit |
| Set | Set | Set | All three levels apply and the strictest limit wins |

Validation rules:

- An entry limit cannot exceed the Catalog limit of the same Catalog. `CREATE CATALOG` or `ALTER CATALOG` fails with `meta.cache.<engine>.<entry>.max-weight can not exceed meta.cache.max-weight`.
- Each FE evaluates `external_meta_cache_max_weight` against its own JVM heap. On heterogeneous FEs, the same percentage yields different byte limits.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Writing size and percentage values -->
## Value format

Fixed sizes support these case-insensitive binary units:

```text
B, KB, MB, GB, TB, PB
```

Examples include `512MB` and `4GB`. Fixed-size values must use an integer amount and cannot be negative.

Only `external_meta_cache_max_weight` accepts a percentage, such as `10%` or `12.5%`. The percentage is calculated from each FE's JVM maximum heap.

Zero has different meanings at different levels:

| Setting | Meaning of `0` |
|---|---|
| `external_meta_cache_max_weight` | Disables the FE-wide quota without disabling caches |
| `meta.cache.max-weight` | Invalid; the Catalog limit must be positive |
| `meta.cache.<engine>.<entry>.max-weight` | Invalid; the entry limit must be positive |

`0%` is invalid. Use the plain value `0` to disable the FE-wide quota. To disable a cache entry, set its `enable` to `false` or its `ttl-second` to `0`; `max-weight` cannot be used for that purpose.

<!-- Knowledge Type: Capability Matrix -->
<!-- Applicable Scenarios: Choosing which cache entries to limit -->
## Managed cache entries

Every managed metadata cache has a size estimator. As soon as an FE-wide, Catalog, or entry limit applies to an entry, that entry is governed by memory. There is no separate group of count-only entries: without any applicable limit, every entry uses only its `enable`, `ttl-second`, and `capacity` settings.

Cache entries are configured with `meta.cache.<engine>.<entry>.{enable,ttl-second,capacity,max-weight}`. The tables below list the `<engine>` and `<entry>` tokens, the `ENTRY_NAME` shown in `information_schema.catalog_meta_cache_statistics`, and the defaults. Only the listed `<entry>` tokens accept `max-weight`; any other `max-weight` key under a known engine fails `CREATE CATALOG` or `ALTER CATALOG` with `Unknown metadata cache weight property`.

### Table schema of every external Catalog

| `<engine>` | `<entry>` | `ENTRY_NAME` | Cached data | Default enable / TTL / capacity |
|---|---|---|---|---|
| `default` | `schema` | `schema` | Column schema of external tables, for every Catalog type | `true` / `external_cache_expire_time_seconds_after_access` (86400 s) / `max_external_schema_cache_num` (10000) |

The legacy Catalog property `schema.cache.ttl-second` maps to `meta.cache.default.schema.ttl-second`.

### Hive

The `hive` engine is used by Hive Catalogs and by the Hive Metastore caches of Hudi Catalogs.

| `<entry>` | `ENTRY_NAME` | Cached data | Default enable / TTL / capacity |
|---|---|---|---|
| `table` | `hive-table` | Table objects from the Hive Metastore | `true` / 86400 s / 10000 |
| `partition_names` | `hive-partition-names` | Partition name lists of a table | `true` / 86400 s / 10000 |
| `partition` | `hive-partition` | Partition objects, including location and input format | `true` / 86400 s / 100000 |
| `column_stats` | `hive-column-stats` | Column statistics from the Hive Metastore | `true` / 86400 s / 10000 |
| `file` | `hive-file` | File listings of a table or partition | `true` / 86400 s / 10000 |
| `partition_view` | `hive-partition-view` | Partition-pruning structures derived from partition names | `true` / 86400 s / 1000 |

Legacy properties map to the unified keys as follows: `schema.cache.ttl-second` to `meta.cache.hive.table.ttl-second`, `partition.cache.ttl-second` to `meta.cache.hive.partition_names.ttl-second`, and `file.meta.cache.ttl-second` to `meta.cache.hive.file.ttl-second`.

A Hive Metastore Catalog that contains Iceberg tables also uses the `iceberg` entries below.

### Iceberg

| `<entry>` | `ENTRY_NAME` | Cached data | Default enable / TTL / capacity |
|---|---|---|---|
| `table` | `iceberg-table` | Loaded Iceberg table metadata | `true` / `meta.cache.iceberg.table.ttl-second` (86400 s) / 1000 |
| `partition` | `iceberg-partition` | Raw partition data of a table snapshot | `true` / same as `table` / 1000 |
| `manifest` | `iceberg-manifest` | Parsed manifest contents; used by scan planning only when `meta.cache.iceberg.manifest.enable` is `true` (default `false`) | `true` / no expiration / 100000 |
| `partition_view` | `iceberg.mvcc-partition-view`, `iceberg.list-partitions-view` | Two derived partition projections that share one budget | `true` / 86400 s / 1000 |

The following Iceberg caches have no `<entry>` token. They follow the Catalog and FE-wide limits and take their TTL from `meta.cache.iceberg.table.ttl-second`:

| `ENTRY_NAME` | Cached data |
|---|---|
| `iceberg-latest-snapshot` | Latest snapshot id of a table |
| `iceberg-format` | Inferred file format of a table |
| `iceberg-comment` | Table comments; created only for REST Catalogs with vended credentials |
| `iceberg-equality-delete-field-ids` | Equality-delete field ids of a snapshot |

:::note
When `iceberg.rest.session` is `user`, the `table`, `partition`, `partition_view`, latest-snapshot, and format caches are not created, because a shared cache would bypass per-user authorization. A REST Catalog with vended credentials does not create the `table` cache either.
:::

### Paimon

| `<entry>` | `ENTRY_NAME` | Cached data | Default enable / TTL / capacity |
|---|---|---|---|
| `partition_view` | `paimon.partition-view` | Partition projections derived from a table snapshot | `true` / 86400 s / 1000 |

The following Paimon caches have no `<entry>` token and follow only the Catalog and FE-wide limits:

| `ENTRY_NAME` | Cached data | TTL |
|---|---|---|
| `paimon-schema-at` | Schema of a table at a specific snapshot | No expiration; capacity 10000 |
| `paimon-latest-snapshot` | Latest snapshot id of a table | `meta.cache.paimon.table.ttl-second` (86400 s); capacity 1000 |

`meta.cache.paimon.table.ttl-second` also controls the TTL of the Paimon table schema cache.

### Hudi

A Hudi Catalog reports its caches under the `hudi` engine, but they are the Hive Metastore caches and are configured with `meta.cache.hive.<entry>.*` keys: `table`, `partition_names`, `partition`, and `column_stats`.

### MaxCompute

| `<engine>` | `<entry>` | `ENTRY_NAME` | Cached data | Default enable / TTL / capacity |
|---|---|---|---|---|
| `max_compute` | `partition` | `max-compute-partition` | Partition listings of a table | `true` / 600 s / 10000 |

### ADBC

| `<engine>` | `<entry>` | `ENTRY_NAME` | Cached data | Default enable / TTL / capacity |
|---|---|---|---|---|
| `adbc` | `metadata` | `adbc-namespaces`, `adbc-table-names`, `adbc-table-schema` | Namespaces, table names, and table schemas; the three caches share one budget | `true` / 600 s / 1000 |

### Doris

A Doris Catalog reports the `schema` and `backends` entries under the `doris` engine, configured with `meta.cache.doris.<entry>.*` keys.

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Typical Hive, Iceberg, and Paimon limit configurations -->
## Examples

### Use only Catalog limits

When there is no FE-wide limit, isolate Catalogs independently:

```sql
ALTER CATALOG hive_prod SET PROPERTIES (
    "meta.cache.max-weight" = "6GB"
);

ALTER CATALOG iceberg_ad_hoc SET PROPERTIES (
    "meta.cache.max-weight" = "2GB"
);
```

The Catalogs are limited to 6 GB and 2 GB respectively, but their combined use on the FE has no common limit.

### Limit Hive file listings and partition structures

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.file.max-weight" = "2GB",
    "meta.cache.hive.partition_view.max-weight" = "1GB"
);
```

File listings of tables with many files, and partition-pruning structures of highly partitioned tables, are usually the largest Hive entries.

### Limit Iceberg metadata and enable the manifest cache

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.partition.max-weight" = "1GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

### Limit Paimon partition projections

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.partition_view.max-weight" = "1GB"
);
```

The remaining Paimon caches are bounded by the 2 GB Catalog limit.

### Combine memory and TTL policies

Memory limits can be used with `enable`, `ttl-second`, and `capacity`:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.enable" = "true",
    "meta.cache.hive.file.ttl-second" = "1800",
    "meta.cache.hive.file.capacity" = "20000",
    "meta.cache.hive.file.max-weight" = "2GB"
);
```

`capacity` remains a count limit and `max-weight` adds a memory limit; whichever is reached first triggers eviction. `capacity=0` or `ttl-second=0` still disables the entry.

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Understanding admission rejection and its effect on queries -->
## Behavior when a limit is reached

On a cache miss, Doris:

1. Loads metadata from the external source.
2. Estimates the retained memory of the loaded object and adds a fixed accounting overhead of 512 bytes.
3. Atomically checks the FE, Catalog, and entry quotas.
4. Returns the loaded object to the current request without caching it if admission fails, and asks other entries to release cold data asynchronously. Entries of the same Catalog are asked first; for an FE-wide deficit, other Catalogs follow.

A rejected object does not fail the query. It is not retained, so later accesses load it again and increase query-planning latency until the asynchronous reclamation has freed enough budget.

Estimation is skipped on cache hits. Estimators are of two kinds:

- Type-specific estimators size Hive Metastore objects, Hive file listings, Iceberg table metadata, manifests, and the derived partition projections of Hive, Iceberg, and Paimon.
- A generic estimator walks the object graph of the remaining caches completely, with a fixed visit budget. If the budget is exhausted, or the graph contains classes that cannot be inspected, the estimate is incomplete.

An incomplete estimate rejects admission instead of under-counting the object. The rejection reasons are recorded in `LAST_WEIGHT_REJECT_REASON`:

| Reason | Meaning |
|---|---|
| `budget_exceeded` | The FE, Catalog, or entry quota cannot hold the object |
| `entry_too_large` | The object alone is larger than the effective entry limit |
| `incomplete_estimate:<detail>` | The estimator could not size the object reliably |
| `invalid_zero_estimate` | The estimator returned zero |

:::caution
Quota checks happen during cache admission, after the object has been loaded. Doris does not reserve heap before accessing the external source. A remote-load failure, or one exceptionally large object exhausting FE heap before construction completes, can therefore still fail the current request. This feature limits memory retained after a successful load; it is not OOM protection for a single metadata load.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Applying limit changes without restarting queries -->
## Applying configuration and refreshing caches

- Restart an FE after changing `external_meta_cache_max_weight`. The value cannot be changed while Catalogs are initialized.
- Changing `meta.cache.max-weight` or `schema.cache.ttl-second` drops every metadata cache of the Catalog. Changing `meta.cache.<engine>.<entry>.*` drops the caches of that engine. The next access rebuilds them with the new configuration.
- Queries already in progress keep the objects they have loaded.
- When an FE-wide or Catalog limit applies to a Paimon Catalog, Paimon's own SDK `CachingCatalog` is disabled by default to avoid a second, unaccounted metadata cache. An explicit `paimon.cache-enabled` property takes precedence.

Memory limits control whether objects are retained. They do not change external metadata and do not replace `REFRESH CATALOG`, TTL, or metadata event synchronization.

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Troubleshooting / Performance tuning of FE heap usage -->
## Monitoring and troubleshooting memory pressure

The system table [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics) reports one row for each FE, Catalog, metadata-cache engine, and cache entry. The following columns describe memory governance:

| Column | Meaning | Time semantics |
|---|---|---|
| `MAX_WEIGHT` | Effective memory limit of the entry in bytes. `-1` means no FE, Catalog, or entry limit applies to the entry. | Configuration |
| `ESTIMATED_WEIGHT` | Estimated bytes currently reserved by the entry. | Gauge at query time |
| `WEIGHT_REJECT_COUNT` | Admissions rejected for any of the reasons listed above. | Cumulative for the current cache instance |
| `LAST_WEIGHT_REJECT_REASON` | Reason of the most recent rejection. | Latest value |

Cumulative counters restart from zero when the caches are rebuilt after a Catalog property change or an FE restart. The table keeps no history, so sample it periodically if you need a trend. Rows with `max_weight >= 0` are the memory-governed entries; the limits themselves come from `fe.conf` and the Catalog properties.

Doris also logs a rate-limited warning, at most once per minute per entry, when an admission is rejected:

```text
Metadata cache entry 'hive-file' rejected a value by weight: reason=budget_exceeded, used=..., max=...
```

Use the following steps when FE heap usage is high and you suspect external metadata caches.

### 1. Check whether managed caches contribute to the pressure

```sql
SELECT fe_host,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host
ORDER BY fe_host;
```

Compare the summed reservation with the configured `external_meta_cache_max_weight` and with the FE heap. The value is estimated retained-cache weight, not total FE heap. Load-time temporary memory, objects referenced by running queries, and connector SDK caches are outside it. If FE heap stays high while the reservation is low, go to step 6.

### 2. Locate the responsible Catalogs

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

Compare each Catalog with its `meta.cache.max-weight`. Look for a Catalog whose reservation is close to its limit, or one that is much larger on a single FE than on the others.

### 3. Drill down to cache entries

```sql
SELECT engine_name, entry_name,
       estimated_weight, max_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE fe_host = '<fe_host>'
  AND catalog_name = '<catalog_name>'
  AND max_weight >= 0
ORDER BY estimated_weight DESC;
```

An entry whose `estimated_weight` approaches `max_weight` dominates the Catalog. A rising `weight_reject_count` with reason `budget_exceeded` indicates quota pressure: objects are loaded and returned but not retained, so later accesses reload them. `entry_too_large` means a single object exceeds the entry limit. `incomplete_estimate` is not a quota problem; the object is served without caching.

### 4. Choose a control

| Goal | Setting | Takes effect |
|---|---|---|
| Bound the total on one FE | `external_meta_cache_max_weight` in `fe.conf` | After an FE restart |
| Isolate one Catalog | `meta.cache.max-weight` | On the next access after `ALTER CATALOG` |
| Stop one entry from dominating | `meta.cache.<engine>.<entry>.max-weight` | On the next access after `ALTER CATALOG` |
| Prefer fresher metadata over caching | Lower `meta.cache.<engine>.<entry>.ttl-second`, or set `meta.cache.<engine>.<entry>.enable` to `false` | On the next access after `ALTER CATALOG` |

### 5. What happens after the change

- A Catalog property change drops the affected caches and rebuilds them lazily. The counters in the system table restart from zero.
- Queries already in progress keep their loaded objects.
- A lower quota increases misses. Expect more external metadata loads and higher planning latency until the working set fits again.

### 6. What this mechanism cannot solve

If FE heap stays high while the accounted weight is low, the pressure comes from outside the quota. Lowering `max-weight` further does not help. Investigate instead:

- Metadata objects still referenced by running queries.
- Connector SDK caches, such as Paimon's `CachingCatalog` when `paimon.cache-enabled` is set explicitly.
- Load-time and materialization peaks of a single large metadata load, which happen before admission.
- FE-internal caches that are created outside the managed Catalog owner and therefore do not appear in the system table.

### Symptom reference

| Symptom | Query | Interpretation | Action |
|---|---|---|---|
| FE heap is high and the summed reservation is close to `external_meta_cache_max_weight` | Step 1 | Managed caches are at the FE-wide bound | Lower the FE limit or the largest Catalog limit, or give the FE more heap |
| FE heap is high but the summed reservation is low | Step 1 | The pressure is outside the quota | Follow step 6 |
| One Catalog is close to its `meta.cache.max-weight`, or much larger on one FE | Step 2 | Its working set exceeds its share | Raise its limit if heap allows, or add entry limits inside it |
| `weight_reject_count` keeps rising with reason `budget_exceeded` | Step 3 | Objects are loaded but not retained and are reloaded later | Raise the quota, or lower competing entry limits |
| `weight_reject_count` keeps rising with reason `entry_too_large` | Step 3 | Single objects exceed the entry limit | Raise the entry limit, or accept that those objects are served uncached |
| `weight_reject_count` keeps rising with reason `incomplete_estimate` | Step 3 | The object cannot be estimated reliably and is never cached | No quota change helps; queries still succeed without caching |
| `estimated_weight` stays at `max_weight` and the hit rate is low | Step 3 | The entry churns inside its quota | Raise the entry limit, or shorten the TTL to shrink the working set |

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Limits of estimated memory accounting -->
## Caveats

- `max-weight` is an estimated retained-cache admission budget. Estimates use structural constants and payload counters; they do not model the exact layout of the active JVM. The result is not operating-system RSS and does not replace FE heap and GC monitoring.
- Cached values are held by strong references until they are evicted, expire, or are invalidated. Configure a quota if metadata caches must not grow with the working set.
- Shared runtime infrastructure such as Catalog clients, FileIO instances, and thread pools is not charged to any entry.
- Several physical caches can share one `<entry>` token and therefore one entry limit, for example the two Iceberg `partition_view` caches and the three ADBC `metadata` caches.
- Objects whose estimate is incomplete are never cached. If an entry shows a low hit rate together with `incomplete_estimate` rejections, caching is not effective for that object type.
- Newly submitted DDL properties strictly reject unknown `max-weight` keys of a known engine. Unknown keys that were persisted by an earlier or later version are tolerated so that an upgraded Catalog can still initialize.

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenarios: Planning metadata-cache memory across Catalogs -->
## Best practices

1. Start with an FE-wide limit so the total across Catalogs cannot grow without a bound.
2. Add Catalog limits for large production Catalogs that share an FE.
3. Add entry-level limits only for entries that dominate usage; every entry does not need its own setting.
4. Reserve enough heap for query planning and other FE caches instead of assigning most of the JVM heap to external metadata caches.
5. Increase the quota or reduce competing entry limits if the same object is repeatedly reloaded after `budget_exceeded` rejections.
6. Use a percentage for heterogeneous FE heap sizes, or a fixed size when every FE must use the same byte limit.
