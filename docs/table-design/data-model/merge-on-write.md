---
{
    "title": "Merge-on-Write",
    "language": "en",
    "description": "How the Doris Unique Key Model guarantees Key uniqueness: the merge-on-write and merge-on-read implementations, their performance trade-offs, and how to choose between them."
}
---

**Merge-on-write** and **merge-on-read** are the two storage implementations of the [Unique Key Model](./unique). Both keep Key columns unique and return the same query results, but they resolve duplicate Keys at different times, and that affects read and write performance. Merge-on-write is the default and works best for most workloads.

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Choosing a Unique Key implementation -->

## Comparison

| Implementation | Merge timing | Write performance | Query performance | Applicable scenarios |
| --- | --- | --- | --- | --- |
| Merge-on-write (default) | At write time | Moderate | High | Most scenarios, balancing query and write performance |
| Merge-on-read | At query or compaction time | High | Lower | Write-heavy, read-light scenarios |

## How Merge-on-Write Works

With merge-on-write, Doris resolves duplicate Keys as data is written. For each incoming row, it checks whether the Key already exists and marks any previous version as deleted in a delete bitmap. Queries use the bitmap to skip the marked rows, so they read only the latest version. Compaction later removes those rows from disk.

Because duplicates are resolved at write time:

- Queries read a single version per Key, with no read-time merge.
- Doris can push filters down to the storage layer, so scans skip data that can't match.
- Read performance does not degrade as past updates accumulate.

The cost is on the write side. Each upsert looks up the primary key to find and mark the previous version, which adds some write overhead compared with merge-on-read. For most workloads this trade-off is worth it, so merge-on-write is the default.

## How Merge-on-Read Works

With merge-on-read, writes only append data. Doris keeps every version of a Key and merges them at query time or during compaction, returning the latest version.

Because duplicates are resolved at read time:

- Writes are lightweight, because they skip the primary-key lookup.
- Every query has to merge the versions of each Key, and Doris can't push filters down, so queries are slower.
- Query latency grows as versions accumulate between compactions.

It fits write-heavy, read-light pipelines, where write throughput matters more than query speed.

## Choosing Between Them

- **Use merge-on-write (default)** for most workloads, including real-time updates, dimension synchronization, and any case where query performance matters. It also enables features such as partial column updates.
- **Use merge-on-read** only when you have far more writes than reads and you need to minimize write overhead.

The implementation is fixed at table creation and **cannot be changed later through schema change**, so decide before you create the table.

## Enabling Each Implementation

The `enable_unique_key_merge_on_write` table property controls the implementation.

Merge-on-write (default):

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

Merge-on-read (set the property to `false`):

```sql
CREATE TABLE IF NOT EXISTS example_tbl_unique
(
    user_id         LARGEINT        NOT NULL,
    user_name       VARCHAR(50)     NOT NULL,
    city            VARCHAR(20),
    age             SMALLINT,
    sex             TINYINT
)
UNIQUE KEY(user_id, user_name)
DISTRIBUTED BY HASH(user_id) BUCKETS 10
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false"
);
```

## Capabilities That Require Merge-on-Write

[Partial column update](../../data-operate/update/update-of-unique-model) requires merge-on-write: it updates a subset of columns without rewriting the whole row.

## Related

- [Unique Key Model](./unique)
- [Partial Column Update](../../data-operate/update/update-of-unique-model)
