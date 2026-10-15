---
{
    "title": "External Metadata Cache Memory Management",
    "language": "en",
    "description": "Limit FE heap used by Doris 4.1.4 external metadata caches with FE, Catalog, and entry quotas for Hive, Iceberg, Paimon.",
    "keywords": ["external metadata cache", "meta.cache.max-weight", "external_meta_cache_max_weight", "FE memory", "catalog_meta_cache_statistics", "Hive Iceberg Paimon metadata cache"]
}
---

Starting from Doris 4.1.4, selected external metadata caches can be limited by estimated retained memory. This prevents metadata from a large table, a single Catalog, or multiple Catalogs from continuously consuming FE heap.

Use this feature when:

- Hive tables have enough partitions to create large partition-pruning structures.
- Iceberg table metadata, snapshots, or manifests are large.
- Paimon table generations or snapshots contain large retained metadata and partition projections.
- An FE serves multiple Catalogs and one Catalog must not dominate metadata-cache memory.

:::caution
These limits cover only the estimator-backed cache entries listed in this document. They are not a hard FE heap limit. Shared runtime infrastructure such as Catalog clients and thread pools is not fully attributed to one cache entry, while bounded owner-specific payloads retained by an entry, including authentication context and Iceberg FileIO configuration or credentials, are conservatively charged. Metadata caches that are not estimator-backed remain outside this quota.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Configuring FE, Catalog, and entry memory limits -->
## Quick start

Prerequisites:

- An existing Hive, Iceberg, or Paimon Catalog.
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

The following example limits managed metadata caches in `iceberg_ctl` to 4 GB in total:

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB"
);
```

After the change, Doris clears the initialized cache group for this Catalog and recreates it with the new configuration on the next access.

:::tip
`meta.cache.max-weight` works even when no FE-wide limit is configured. In that case, it limits only this Catalog and does not limit the total across all Catalogs on the FE.
:::

### 3. Limit individual cache entries

The following example sets a Catalog limit and individual Iceberg entry limits:

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.iceberg.table.max-weight" = "1GB",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB",
    "meta.cache.iceberg.manifest.enable" = "true",
    "meta.cache.iceberg.manifest.max-weight" = "1GB"
);
```

The `table`, `snapshot`, and `manifest` entries are limited to 1 GB, 2 GB, and 1 GB respectively. Their combined usage cannot exceed the 4 GB Catalog limit, and the Catalog is still constrained by the FE-wide limit.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Understanding how FE, Catalog, and entry limits combine -->
## Quota hierarchy

Three levels of memory limits are available:

| Level | Location | Setting | Format | Default | Scope |
|---|---|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | Fixed size or percentage of the JVM maximum heap | Not set (`0`); no FE-wide quota | All managed external metadata caches on the current FE |
| Catalog | Catalog property | `meta.cache.max-weight` | Fixed size; must be positive | Not set; no Catalog quota | All managed entries in the current Catalog |
| Cache entry | Catalog property | `meta.cache.<engine>.<entry>.max-weight` | Fixed size; `0` disables the entry | Not set; bounded only by the parent limits | One cache entry for one engine |

The effective limit is the minimum of all configured limits.

| FE limit | Catalog limit | Entry limit | Behavior |
|---|---|---|---|
| Not set | Not set | Not set | Memory accounting is disabled; the existing count and TTL policies remain in use |
| Set | Not set | Not set | All managed entries share the FE quota |
| Not set | Set | Not set | Managed entries in the Catalog share the Catalog quota |
| Not set | Not set | Set | Only that entry is limited; there is no combined FE or Catalog limit |
| Set | Set | Set | All three levels apply and the strictest limit wins |

The configured hierarchy must satisfy these rules:

- A Catalog limit cannot exceed the FE-wide limit.
- An entry limit cannot exceed its configured direct parent.
- On heterogeneous FEs, a follower further clamps admission to its local FE limit.

`CREATE CATALOG` or `ALTER CATALOG` fails when the hierarchy is invalid instead of silently ignoring the property.

<!-- Knowledge Type: Configuration Parameters -->
<!-- Applicable Scenarios: Writing size and percentage values -->
## Value format

Fixed sizes support these case-insensitive binary units:

```text
B, KB, MB, GB, TB, PB
```

Examples include `512MB` and `4GB`.

Fixed-size values must use an integer amount. Decimal values are supported only for percentages, such as `12.5%`.

Only `external_meta_cache_max_weight` accepts a percentage, such as `10%` or `12.5%`. The percentage is calculated from each FE's JVM maximum heap, so FEs with different heap sizes receive different byte limits.

Zero has different meanings at different levels:

| Setting | Meaning of `0` |
|---|---|
| `external_meta_cache_max_weight` | Disables the FE-wide quota without disabling caches |
| `meta.cache.max-weight` | Invalid; the Catalog limit must be positive |
| `meta.cache.<engine>.<entry>.max-weight` | Disables that cache entry; it does not remove the entry-level override |

`0%` is invalid. Use the plain value `0` to disable the FE-wide quota.

<!-- Knowledge Type: Capability Matrix -->
<!-- Applicable Scenarios: Choosing which cache entries to limit -->
## Supported cache entries

Only the following entries accept `max-weight` in this version:

| Catalog/engine | Entry | Property | Cached data |
|---|---|---|---|
| Hive | `partition_values` | `meta.cache.hive.partition_values.max-weight` | Partition names, values, pruning indexes, and sorted ranges |
| Iceberg | `table` | `meta.cache.iceberg.table.max-weight` | Iceberg table metadata and the retained metadata generation |
| Iceberg | `snapshot` | `meta.cache.iceberg.snapshot.max-weight` | Snapshot, partition projection, and its retained table generation |
| Iceberg | `manifest` | `meta.cache.iceberg.manifest.max-weight` | Parsed DataFile and DeleteFile lists; this entry is disabled by default and also requires `enable=true` |
| Paimon | `table` | `meta.cache.paimon.table.max-weight` | Retained Paimon table metadata and its generation |
| Paimon | `snapshot` | `meta.cache.paimon.snapshot.max-weight` | Snapshot, schema generation, and partition projection |

These common entries remain count-bounded and do not accept `max-weight`:

- Hive `schema`, `partition`, and `file`.
- Iceberg `schema` and `view`.
- Paimon `schema`.
- Existing Hudi, MaxCompute, and Doris Catalog cache entries.

Setting `max-weight` on an unsupported entry causes Catalog creation or alteration to fail. For example, this configuration is invalid:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.max-weight" = "1GB"
);
```

:::note
An HMS Catalog can route Hive, Hudi, and Iceberg metadata caches. If it contains Iceberg tables, the same HMS Catalog can use `meta.cache.iceberg.table.max-weight`, `meta.cache.iceberg.snapshot.max-weight`, and `meta.cache.iceberg.manifest.max-weight`.
:::

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

### Limit large Hive partition structures

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "4GB",
    "meta.cache.hive.partition_values.max-weight" = "3GB"
);
```

This primarily limits partition-pruning structures created for highly partitioned Hive tables. Hive file-list caches are not included in this quota.

### Limit Paimon table generations and snapshots

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.table.max-weight" = "512MB",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

Paimon supports independent memory limits for both `table` and `snapshot` entries. This example reserves up to 512 MB for retained table generations and 1536 MB for snapshot projections, within the 2 GB Catalog limit.

### Compatibility with existing cache properties

For compatibility with existing Catalogs, Iceberg and Paimon `table.enable`, `table.ttl-second`, and `table.capacity` values are also used as defaults for the corresponding snapshot entry when its property is not explicitly set. For example:

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.paimon.table.ttl-second" = "600",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

Here, `table.ttl-second` controls the TTL of both the Paimon table object and snapshot caches, while `snapshot.max-weight` limits only the snapshot cache.

`max-weight` is not compatibility-mapped. Use the actual estimator-backed entry name:

- `meta.cache.iceberg.table.max-weight` for Iceberg table objects.
- `meta.cache.iceberg.snapshot.max-weight` for Iceberg snapshots.
- `meta.cache.paimon.table.max-weight` for Paimon table generations.
- `meta.cache.paimon.snapshot.max-weight` for Paimon snapshots.

### Combine memory and TTL policies

Memory limits can be used with `enable`, `ttl-second`, and `capacity`:

```sql
ALTER CATALOG iceberg_ctl SET PROPERTIES (
    "meta.cache.iceberg.snapshot.enable" = "true",
    "meta.cache.iceberg.snapshot.ttl-second" = "1800",
    "meta.cache.iceberg.snapshot.capacity" = "1000",
    "meta.cache.iceberg.snapshot.max-weight" = "2GB"
);
```

When `max-weight` is active, eviction is bounded by memory weight and `capacity` is no longer a simultaneous maximum entry count. However, `capacity=0` still disables the cache, so keep it greater than zero when using a memory limit.

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Understanding admission rejection and its effect on queries -->
## Behavior when a limit is reached

On a cache miss, Doris:

1. Loads metadata from the external source.
2. Freezes or materializes the candidate and estimates its retained memory.
3. Atomically checks the FE, Catalog, and entry quotas.
4. Evicts cold data from the same entry and retries when the quota is insufficient; if local eviction cannot satisfy the reservation, Doris schedules peer reclamation from sibling entries (and, for an FE-wide deficit, other Catalogs).
5. Returns the loaded object to the current request without caching it if admission still fails.

Therefore, a new object that is larger than the available quota does not normally fail the query because of the cache quota. It is not retained, so later accesses may load it again and increase query-planning latency.

If Doris cannot produce a reliable complete estimate, for example because the retained table form is unsupported, Iceberg metadata is still lazily loaded, preparation fails, or an accounting work budget is exceeded, it also skips caching instead of under-counting the object. The estimators do not perform generic reflective object-graph traversal or container sampling. Iceberg uses one fail-closed private-field probe only to verify that snapshot metadata is already loaded, avoiding estimation-time IO.

:::note
Local eviction is synchronous. Peer reclamation is asynchronous and best effort, so the current miss can still be returned without caching while sibling entries are reclaimed for later admissions. Configure entry-level limits when one entry must not dominate a shared FE or Catalog quota.
:::

If a scheduled refresh cannot be admitted because its estimate is incomplete or the budget is insufficient, Doris retains the previous known-good cached generation. The rejected refresh is not published.

:::caution
Quota checks happen during cache admission, after the object has been loaded and prepared. Doris does not reserve heap before accessing the external source. A remote-load failure, or one exceptionally large object exhausting FE heap before construction completes, can therefore still fail the current request. This feature limits memory retained after a successful load; it is not OOM protection for a single metadata load.
:::

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Applying limit changes without restarting queries -->
## Applying configuration and refreshing caches

- Restart an FE after changing `external_meta_cache_max_weight`.
- Changing Catalog properties, including `meta.cache.max-weight` or `meta.cache.<engine>.<entry>.*`, resets the Catalog execution context and clears initialized entries for all metadata-cache engines routed by that Catalog; the next access rebuilds them with the new context and configuration.
- Queries already in progress can continue with loaded objects while later accesses use the new configuration.

Memory limits control whether objects are retained. They do not change external metadata and do not replace `REFRESH CATALOG`, TTL, or metadata event synchronization.

<!-- Knowledge Type: Operational Steps -->
<!-- Applicable Scenarios: Troubleshooting / Performance tuning of FE heap usage -->
## Monitoring and troubleshooting memory pressure

The system table [`catalog_meta_cache_statistics`](../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics) reports one row for each FE, Catalog, metadata-cache engine, and cache entry. The following columns describe memory governance:

| Column | Meaning | Time semantics |
|---|---|---|
| `MAX_WEIGHT` | Effective memory limit of the entry in bytes. `-1` means no FE, Catalog, or entry limit applies to the entry. | Configuration |
| `ESTIMATED_WEIGHT` | Estimated bytes currently reserved by the entry. | Gauge at query time |
| `WEIGHT_REJECT_COUNT` | Admissions rejected because of an insufficient budget or an incomplete estimate. | Cumulative for the current cache instance |
| `LAST_WEIGHT_REJECT_REASON` | Reason of the most recent rejection. | Latest value |

Cumulative counters restart from zero when the cache group is rebuilt after a Catalog property change or an FE restart. The table keeps no history, so sample it periodically if you need a trend. Rows with `max_weight >= 0` are the memory-governed entries; the limits themselves come from `fe.conf` and the Catalog properties.

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

Compare the summed reservation with the configured `external_meta_cache_max_weight` and with the FE heap. The value is estimated retained-cache weight, not total FE heap. Load-time temporary memory, count-bounded entries, and connector SDK caches are outside it. If FE heap stays high while the reservation is low, go to step 6.

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

An entry whose `estimated_weight` approaches `max_weight` dominates the Catalog. A rising `weight_reject_count` indicates quota pressure: objects are loaded, cold data is evicted, and the object is still not retained, so later accesses reload it. `last_weight_reject_reason` tells whether the most recent rejection was caused by an insufficient budget or by an incomplete estimate. Incomplete estimates are not a quota problem; the object is served without caching.

### 4. Choose a control

| Goal | Setting | Takes effect |
|---|---|---|
| Bound the total on one FE | `external_meta_cache_max_weight` in `fe.conf` | After an FE restart |
| Isolate one Catalog | `meta.cache.max-weight` | On the next access after `ALTER CATALOG` |
| Stop one supported entry from dominating | `meta.cache.<engine>.<entry>.max-weight` | On the next access after `ALTER CATALOG` |
| Prefer fresher metadata over caching | Lower `meta.cache.<engine>.<entry>.ttl-second`, or set `meta.cache.<engine>.<entry>.enable` to `false` | On the next access after `ALTER CATALOG` |

### 5. What happens after the change

- A Catalog property change clears the initialized cache group of that Catalog and rebuilds it lazily. The counters in the system table restart from zero.
- Queries already in progress keep their loaded objects.
- A lower quota increases misses. Expect more external metadata loads and higher planning latency until the working set fits again.

### 6. What this mechanism cannot solve

If FE heap stays high while the accounted weight is low, the pressure comes from outside the quota. Lowering `max-weight` further does not help. Investigate instead:

- Count-bounded entries such as Hive `schema`, `partition`, and `file`. Tune their `capacity` and `ttl-second`.
- Metadata objects still referenced by running queries.
- Connector SDK caches, such as the Iceberg manifest cache controlled by `io.manifest.cache-enabled` or the Paimon `CachingCatalog` controlled by `paimon.cache-enabled`.
- Load-time and materialization peaks of a single large metadata load, which happen before admission.

### Symptom reference

| Symptom | Query | Interpretation | Action |
|---|---|---|---|
| FE heap is high and the summed reservation is close to `external_meta_cache_max_weight` | Step 1 | Managed caches are at the FE-wide bound | Lower the FE limit or the largest Catalog limit, or give the FE more heap |
| FE heap is high but the summed reservation is low | Step 1 | The pressure is outside the quota | Follow step 6 |
| One Catalog is close to its `meta.cache.max-weight`, or much larger on one FE | Step 2 | Its working set exceeds its share | Raise its limit if heap allows, or add entry limits inside it |
| `weight_reject_count` keeps rising and the reason is an insufficient budget | Step 3 | Objects are loaded but not retained and are reloaded later | Raise the quota, or lower competing entry limits |
| `weight_reject_count` keeps rising and the reason is an incomplete estimate | Step 3 | The object cannot be estimated reliably and is never cached | No quota change helps; queries still succeed without caching |
| `estimated_weight` stays at `max_weight` and the hit rate is low | Step 3 | The entry churns inside its quota | Raise the entry limit, or shorten the TTL to shrink the working set |

<!-- Knowledge Type: Behavior Description -->
<!-- Applicable Scenarios: Limits of estimated memory accounting -->
## Caveats

- `max-weight` is an estimated retained-cache admission budget. Type-specific formulas use rounded-up structural constants calibrated offline plus loader-time payload counters; they do not model the exact layout of the active JVM or third-party SDK. The result is not operating-system RSS and does not replace FE heap and GC monitoring.
- Shared runtime infrastructure is not fully charged to an individual entry, but bounded owner-specific authentication context, FileIO configuration, storage credentials, and transform payloads retained by an entry are conservatively included.
- Weight-bounded entries use soft values. Reservation records retain the key, generation, and weight, but no strong reference to the cached value. Under heap pressure, the JVM may collect a value before its TTL expires or its quota is full; Doris releases the matching reservation and reloads the value on a later access.
- Large objects are estimated only on load, refresh, or replacement. The completed weight is retained with the published generation, so cache hits do not rescan object contents.
- First-time Iceberg table or snapshot admission may materialize the current snapshot's manifest lists and can increase initial load latency.
- Newly supplied DDL properties strictly reject misspelled engine names, entry names, and options; legacy persisted properties that cannot be parsed at runtime are warned about and ignored so an upgraded Catalog can still initialize.
- When Doris memory governance is active for an Iceberg Catalog, the Iceberg SDK manifest-content cache is not auto-enabled because it is outside the Doris quota. An explicit `io.manifest.cache-enabled` setting takes precedence.
- When Doris memory governance is active for a Paimon Catalog, Paimon's SDK-level `CachingCatalog` is disabled by default to avoid an unbounded second metadata cache. An explicit `paimon.cache-enabled` setting takes precedence.
- After upgrading Iceberg or Paimon, use the SDK version shipped with the Doris release rather than replacing FE SDK JARs independently.

<!-- Knowledge Type: Architecture Decision -->
<!-- Applicable Scenarios: Planning metadata-cache memory across Catalogs -->
## Best practices

1. Start with an FE-wide limit so the total across Catalogs cannot grow without a bound.
2. Add Catalog limits for large production Catalogs that share an FE.
3. Add entry-level limits only for entries that dominate usage; every entry does not need its own setting.
4. Reserve enough heap for query planning and other FE caches instead of assigning most of the JVM heap to external metadata caches.
5. Increase the quota or reduce competing entry limits if the same object is repeatedly reloaded after admission rejection.
6. Use a percentage for heterogeneous FE heap sizes, or a fixed size when every FE must use the same byte limit.
