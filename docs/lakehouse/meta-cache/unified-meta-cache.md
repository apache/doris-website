---
{
    "title": "Unified External Meta Cache (4.0.4+)",
    "language": "en",
    "description": "User guide for unified external metadata cache: unified meta.cache.* properties, what is cached, and where to configure per catalog."
}
---

Starting from **Doris 4.0.4**, external metadata caching is unified for major External Catalog engines. As a user, you only need to know:

| You want to know | Where in docs |
|---|---|
| Where to configure | Catalog `PROPERTIES` with `meta.cache.*` keys (see the catalog pages linked below). |
| What it affects | Depends on catalog engine (partitions, file listing, table metadata, manifests, etc.). |
| How to observe | `information_schema.catalog_meta_cache_statistics` (see the observability section below). |

:::tip
Applies to Doris 4.0.4 and later.
:::

## Unified Property Model

All engine cache modules share the same property key pattern:

`meta.cache.<engine>.<module>.{enable,ttl-second,capacity}`

The following table describes the property semantics:

| Property | Example | Meaning |
|---|---|---|
| `enable` | `true/false` | Whether this cache module is enabled. |
| `ttl-second` | `600`, `0`, `-1` | `0` disables the module; `-1` means no expiration; otherwise expire after access by TTL. |
| `capacity` | `10000` | Max entry count (count-based). `0` disables the module. |

Example (edit catalog properties):

```sql
ALTER CATALOG hive_ctl SET PROPERTIES (
  "meta.cache.hive.file.ttl-second" = "0"
);
```

## What External Meta Cache Includes

External meta cache covers different kinds of metadata. Some are configured by unified catalog properties, and some are controlled by FE configs:

| Category | Examples | How to configure |
|---|---|---|
| Engine module caches | Hive partitions/files, Iceberg manifests, Paimon table metadata, etc. | Catalog `PROPERTIES`: `meta.cache.<engine>.<module>.*` |
| Schema cache | Table schema, isolated by schema version token | FE configs (for example: `max_external_schema_cache_num`) |

## Catalog-Specific Configuration (Links)

For each catalog engine, the supported cache modules and the recommended properties are documented in its catalog page:

| Catalog engine | Where to configure module caches |
|---|---|
| Hive | [Hive Catalog](../catalogs/hive-catalog.mdx#meta-cache-404) |
| Iceberg | [Iceberg Catalog](../catalogs/iceberg-catalog.mdx#meta-cache-404) |
| Paimon | [Paimon Catalog](../catalogs/paimon-catalog.mdx#meta-cache-404) |
| Hudi | [Hudi Catalog](../catalogs/hudi-catalog.md#meta-cache-404) |
| MaxCompute | [MaxCompute Catalog](../catalogs/maxcompute-catalog.md#meta-cache-404) |

## Observability

Use the system table to observe cache metrics:

```sql
SELECT *
FROM information_schema.catalog_meta_cache_statistics
ORDER BY catalog_name, cache_name, metric_name;
```

This table is documented at: [catalog_meta_cache_statistics](../../admin-manual/system-tables/information_schema/catalog_meta_cache_statistics.md).

Naming convention:

| Field | Convention |
|---|---|
| `cache_name` | `<engine>_<module>_cache` (module `-` is converted to `_`) |

## Migration Note (Legacy Properties)

Starting from Doris 4.0.4, legacy catalog cache properties (for example, `schema.cache.ttl-second`, `file.meta.cache.ttl-second`) are deprecated. Use `meta.cache.*` properties instead and follow the catalog-specific pages above.
