---
{
    "title": "External Metadata Cache Memory Management",
    "language": "en",
    "description": "Describes FE, Catalog, and cache-entry memory limits for external metadata caches in Doris 4.1.5, including Hive, Iceberg, and Paimon configuration."
}
---

Starting from Doris 4.1.5, selected external metadata caches can be limited by estimated retained memory. This prevents metadata from a large table, a single Catalog, or multiple Catalogs from continuously consuming FE heap.

Use this feature when:

- Hive tables have enough partitions to create large partition-pruning structures;
- Iceberg table metadata, snapshots, or manifests are large;
- Paimon snapshots contain large partition projections;
- an FE serves multiple Catalogs and one Catalog must not dominate metadata-cache memory.

:::caution
These limits cover only the estimator-backed cache entries listed in this document. They are not a hard FE heap limit. Shared infrastructure such as Catalogs, FileIO objects, and thread pools, and metadata caches that are not yet estimator-backed, are outside this quota.
:::

## Quick start

Prerequisites:

- an existing Hive, Iceberg, or Paimon Catalog;
- permission to update FE configuration and the target Catalog;
- Doris 4.1.5 or later on every FE.

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

## Quota hierarchy

Three levels of memory limits are available:

| Level | Location | Setting | Scope |
|---|---|---|---|
| FE | `fe.conf` | `external_meta_cache_max_weight` | All managed external metadata caches on the current FE |
| Catalog | Catalog property | `meta.cache.max-weight` | All managed entries in the current Catalog |
| Cache entry | Catalog property | `meta.cache.<engine>.<entry>.max-weight` | One cache entry for one engine |

The effective limit is the minimum of all configured limits.

| FE limit | Catalog limit | Entry limit | Behavior |
|---|---|---|---|
| Not set | Not set | Not set | Memory accounting is disabled; the existing count and TTL policies remain in use |
| Set | Not set | Not set | All managed entries share the FE quota |
| Not set | Set | Not set | Managed entries in the Catalog share the Catalog quota |
| Not set | Not set | Set | Only that entry is limited; there is no combined FE or Catalog limit |
| Set | Set | Set | All three levels apply and the strictest limit wins |

The configured hierarchy must satisfy these rules:

- a Catalog limit cannot exceed the FE-wide limit;
- an entry limit cannot exceed its configured direct parent;
- on heterogeneous FEs, a follower further clamps admission to its local FE limit.

`CREATE CATALOG` or `ALTER CATALOG` fails when the hierarchy is invalid instead of silently ignoring the property.

## Value format

Fixed sizes support these case-insensitive binary units:

```text
B, KB, MB, GB, TB, PB
```

Examples include `512MB` and `4GB`.

Only `external_meta_cache_max_weight` accepts a percentage, such as `10%` or `12.5%`. The percentage is calculated from each FE's JVM maximum heap, so FEs with different heap sizes receive different byte limits.

Zero has different meanings at different levels:

| Setting | Meaning of `0` |
|---|---|
| `external_meta_cache_max_weight` | Disables the FE-wide quota without disabling caches |
| `meta.cache.max-weight` | Invalid; the Catalog limit must be positive |
| `meta.cache.<engine>.<entry>.max-weight` | Disables that cache entry; it does not remove the entry-level override |

`0%` is invalid. Use the plain value `0` to disable the FE-wide quota.

## Supported cache entries

Only the following entries accept `max-weight` in this version:

| Catalog/engine | Entry | Property | Cached data |
|---|---|---|---|
| Hive | `partition_values` | `meta.cache.hive.partition_values.max-weight` | Partition names, values, pruning indexes, and sorted ranges |
| Iceberg | `table` | `meta.cache.iceberg.table.max-weight` | Schema, partition and sort definitions, properties, and a non-growing current-snapshot metadata generation |
| Iceberg | `snapshot` | `meta.cache.iceberg.snapshot.max-weight` | Snapshot partition projection and its bound non-growing metadata generation |
| Iceberg | `manifest` | `meta.cache.iceberg.manifest.max-weight` | Parsed DataFile and DeleteFile lists; this entry is disabled by default and also requires `enable=true` |
| Paimon | `snapshot` | `meta.cache.paimon.snapshot.max-weight` | Snapshot, schema generation, and partition projection |

These common entries remain count-bounded and do not accept `max-weight`:

- Hive `schema`, `partition`, and `file`;
- Iceberg `schema` and `view`;
- Paimon `schema` and `table`;
- existing Hudi, MaxCompute, and Doris Catalog cache entries.

Setting `max-weight` on an unsupported entry causes Catalog creation or alteration to fail. For example, this configuration is invalid:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
    "meta.cache.hive.file.max-weight" = "1GB"
);
```

:::note
An HMS Catalog can route Hive, Hudi, and Iceberg metadata caches. If it contains Iceberg tables, the same HMS Catalog can use `meta.cache.iceberg.table.max-weight`, `meta.cache.iceberg.snapshot.max-weight`, and `meta.cache.iceberg.manifest.max-weight`.
:::

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

### Limit Paimon snapshots

```sql
ALTER CATALOG paimon_ctl SET PROPERTIES (
    "meta.cache.max-weight" = "2GB",
    "meta.cache.paimon.snapshot.max-weight" = "1536MB"
);
```

The Paimon entry name is `snapshot`. `meta.cache.paimon.table.max-weight` is not valid.

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

- `meta.cache.iceberg.table.max-weight` for Iceberg table objects;
- `meta.cache.iceberg.snapshot.max-weight` for Iceberg snapshots;
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

## Behavior when a limit is reached

On a cache miss, Doris:

1. loads metadata from the external source;
2. applies type-specific conservative formulas and accumulates variable payload in the existing collection-building loops;
3. atomically checks the FE, Catalog, and entry quotas;
4. evicts cold data from the same entry and retries when the quota is insufficient;
5. returns the loaded object to the current request without caching it if admission still fails.

Therefore, a new object that is larger than the available quota does not normally fail the query because of the cache quota. It is not retained, so later accesses may load it again and increase query-planning latency.

If type-specific preparation cannot identify the required metadata generation, encounters an object type that is not yet supported, or fails while preparing the value, Doris also skips caching instead of using an incomplete result. This process does not use reflection to access private third-party SDK fields or sample container elements.

:::note
Admission evicts cold data only from the same physical cache entry. It does not actively evict across Catalogs or cache entries. If another entry continuously occupies a shared FE or Catalog quota, configure entry-level limits to prevent one entry from dominating it.
:::

:::caution
Quota checks happen during cache admission, after the object has been loaded and its retained size has been estimated. Doris does not reserve heap before accessing the external source. A remote-load failure, or one object exhausting FE heap before construction completes, can therefore still fail the current request. This feature limits memory retained after a successful load; it is not OOM protection for a single load.
:::

## Applying configuration and refreshing caches

- Restart an FE after changing `external_meta_cache_max_weight`;
- changing `meta.cache.max-weight` rebuilds the related cache groups for that Catalog;
- changing `meta.cache.<engine>.<entry>.*` rebuilds the cache group for that engine;
- queries already in progress can continue with loaded objects while later accesses use the new configuration.

Memory limits control whether objects are retained. They do not change external metadata and do not replace `REFRESH CATALOG`, TTL, or metadata event synchronization.

### Iceberg metadata-generation consistency

When an Iceberg `table` or `snapshot` entry becomes weight-bounded because any applicable limit is configured, each cache value retains only the key-bound, non-growing scalar metadata generation and the current snapshot JSON. Historical snapshots, refs, and statistics do not continue to grow inside that cache value.

If a query needs historical snapshots, refs, or other complete table metadata, Doris reads a statement-local copy from the exact `metadataFileLocation` pinned by the key and does so under the Catalog authentication context. One statement remains bound to one metadata generation even if the cache refreshes concurrently. An unbound stale cache generation is invalidated and retried once instead of being silently reused. This isolation can add a metadata-file read, but prevents lazy cache growth and preserves time-travel and concurrent-refresh consistency.

## Caveats

- `max-weight` uses type-specific conservative formulas and loader-time payload counters rather than VM-private layouts. It is not operating-system RSS and does not replace FE heap and GC monitoring;
- shared infrastructure such as Catalogs, FileIO objects, thread pools, and authenticators is not fully charged to an individual cache entry;
- weight-bounded cache values use soft references, and reservation records retain only the key, generation, and weight rather than a strong reference to the value. Under FE heap pressure, the JVM may collect a value before its TTL expires or its quota is full; Doris releases the matching reservation, and a later access reloads the value;
- values are calculated only on load, refresh, or replacement. The completed weight is stored with the cache value, so cache hits read it in O(1) without rescanning object contents;
- strict property validation rejects misspelled engine names, entry names, and options;
- after upgrading Iceberg or Paimon, use the SDK version shipped with the Doris release rather than replacing FE SDK JARs independently.

## Best practices

1. Start with an FE-wide limit so the total across Catalogs cannot grow without a bound;
2. add Catalog limits for large production Catalogs that share an FE;
3. add entry-level limits only for entries that dominate usage; every entry does not need its own setting;
4. reserve enough heap for query planning and other FE caches instead of assigning most of the JVM heap to external metadata caches;
5. increase the quota or reduce competing entry limits if the same object is repeatedly reloaded after admission rejection;
6. use a percentage for heterogeneous FE heap sizes, or a fixed size when every FE must use the same byte limit.
