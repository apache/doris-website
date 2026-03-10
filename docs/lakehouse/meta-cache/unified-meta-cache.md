---
{
    "title": "Unified External Meta Cache (4.1.x+)",
    "language": "en",
    "description": "User guide for unified external metadata cache: unified meta.cache.* properties, what is cached, and where to configure per catalog."
}
---

Starting from **Doris 4.1.x**, external metadata caching is unified for major External Catalog engines. The unified cache standardizes configuration models and monitoring metrics across different data lake engines (like Hive, Iceberg, etc.), reducing the configuration threshold and troubleshooting difficulty for multi-source data management.

As a user, you mainly need to care about three things:

- **What it affects:** Depends on the catalog engine (partitions, file listing, table metadata, manifests, etc.).
- **Where to configure:** Catalog `PROPERTIES` with unified `meta.cache.*` keys (see the catalog pages linked below).
- **How to observe:** `information_schema.catalog_meta_cache_statistics` system table (see the observability section below).

:::tip
Applies to Doris 4.1.x and later.
:::

## What External Meta Cache Includes

Before configuring, it's important to understand what is actually being cached. There are two layers of metadata caching that are easy to confuse:

- **Catalog object/name caches:** `SHOW DATABASES`, `SHOW TABLES`, database objects, table objects, and related generic caches described in [Metadata Cache](../meta-cache.md).
- **Engine entry caches:** Engine-specific runtime metadata such as Hive partitions/files, Iceberg manifests, Paimon table handles, and schema entries. This page focuses on this layer.

External meta cache entries cover different kinds of metadata. Some are configured by unified catalog properties, and some also inherit FE-level defaults:

| Category | Examples | How to configure |
|---|---|---|
| Engine entry caches | Hive `partition_values` / `partition` / `file`, Iceberg `manifest`, Paimon `table`, etc. | Catalog `PROPERTIES`: `meta.cache.<engine>.<entry>.*` |
| Schema cache | Per-engine `schema` entry, isolated by schema version token | FE configs provide defaults; catalog `meta.cache.<engine>.schema.*` can override them |

## Unified Property Model

All engine cache entries share the same property key pattern:

`meta.cache.<engine>.<entry>.{enable,ttl-second,capacity}`

The following table describes the property semantics:

| Property | Example | Meaning |
|---|---|---|
| `enable` | `true/false` | Whether this cache entry is enabled. |
| `ttl-second` | `600`, `0`, `-1` | `0` disables the entry; `-1` means no expiration; otherwise expire after access by TTL. |
| `capacity` | `10000` | Max entry count (count-based). `0` disables the entry. |

**Note on Effective State:**
Only when `enable=true` AND `ttl-second > 0` (or `-1`) AND `capacity > 0`, the cache entry will be truly effective (corresponding to `EFFECTIVE_ENABLED = true` in the observability table).

Notes:

- `<entry>` uses the cache entry name shown in the catalog documentation and the stats table, for example `partition_values`, `fs_view`, `meta_client`.
- There is currently no per-entry refresh interval property. Async refresh behavior still uses the FE config `external_cache_refresh_time_minutes`.

Example:

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
  -- Set the TTL of Hive file cache to 0, which immediately disables this cache entry
  "meta.cache.hive.file.ttl-second" = "0"
);
```

## Supported Engines and Configurations

The following table summarizes the current implementation and links to catalog-specific configuration pages:

| Catalog Engine | Entries you will see in stats (`<entry>`) | `ALTER CATALOG ... SET PROPERTIES` hot-reload | Detailed Configuration Guide |
|---|---|---|---|
| Hive | `schema`, `partition_values`, `partition`, `file` | Changes to `meta.cache.hive.*` are not applied through the unified hot-reload path; recreate the catalog or restart FE to apply new specs | [Hive Catalog](../catalogs/hive-catalog.mdx#meta-cache-unified) |
| Iceberg | `schema`, `table`, `view`, `manifest` | Supported | [Iceberg Catalog](../catalogs/iceberg-catalog.mdx#meta-cache-unified) |
| Paimon | `schema`, `table` | Supported | [Paimon Catalog](../catalogs/paimon-catalog.mdx#meta-cache-unified) |
| Hudi | `schema`, `partition`, `fs_view`, `meta_client` | Supported through HMS catalog property updates | [Hudi Catalog](../catalogs/hudi-catalog.md#meta-cache-unified) |
| MaxCompute | `schema`, `partition_values` | No dedicated hot-reload hook | [MaxCompute Catalog](../catalogs/maxcompute-catalog.md#meta-cache-unified) |

:::caution
For **Hive Catalogs**, changes to `meta.cache.hive.*` properties via `ALTER CATALOG` do **not** take effect dynamically. You must recreate the catalog or restart the Frontend (FE) node to apply the new configurations.
:::

## Observability

Use the system table to observe cache metrics:

```sql
SELECT catalog_name, engine_name, entry_name,
       effective_enabled, ttl_second, capacity,
       estimated_size, hit_rate, load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, engine_name, entry_name;
```

This table is documented at: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

Read the table as follows:

| Field | Convention |
|---|---|
| `ENGINE_NAME` | Cache engine, such as `hive` or `iceberg` |
| `ENTRY_NAME` | Exact entry name used by that engine, such as `partition_values`, `fs_view`, `manifest` |
| `EFFECTIVE_ENABLED` | Final enable state after evaluating `enable`, `ttl-second`, and `capacity` |
| `LOAD_FAILURE_COUNT` | Number of failed loads from external systems. Useful for identifying upstream metadata service issues. |
| `LAST_ERROR` | The exception message of the last failed load. Highly valuable for troubleshooting timeout or connection errors with HMS, S3, etc. |

Common queries filter by `catalog_name` and `engine_name`. This table no longer uses the old `cache_name` / `metric_name` pivoted model.

## Migration Note (Legacy Properties)

Starting from Doris 4.1.x, legacy catalog cache properties (for example, `schema.cache.ttl-second`, `file.meta.cache.ttl-second`) are deprecated. Use `meta.cache.*` properties instead and follow the catalog-specific pages above.
