---
{
    "title": "Merge-on-Write",
    "language": "en",
    "description": "How the Doris Unique Key Model guarantees Key uniqueness: the merge-on-write and merge-on-read implementations, their performance trade-offs, and how to choose between them."
}
---

**Merge-on-write** and **merge-on-read** are the two storage implementations the [Unique Key Model](./unique) uses to guarantee the uniqueness of Key columns. Both return the same query results, but they resolve duplicate Keys at different times, which determines their read and write performance. Merge-on-write is the default and is recommended for most workloads.

<!-- Knowledge type: Concept -->
<!-- Applicable scenarios: Choosing a Unique Key implementation -->

## Comparison

| Implementation | Merge timing | Query performance | Predicate pushdown | Applicable scenarios |
| --- | --- | --- | --- | --- |
| Merge-on-write (default) | At write time | High | Supported | Most scenarios, balancing query and write performance |
| Merge-on-read | At query or compaction time | Lower | Not supported | Write-heavy, read-light scenarios |

## How Merge-on-Write Works

With merge-on-write, Doris resolves duplicate Keys as data is written. For each incoming row, it checks whether the Key already exists and marks any previous version as deleted. Only the latest row for each Key remains in storage.

Because duplicates are resolved at write time:

- Queries read a single version per Key, with no read-time merge.
- Filter predicates can be pushed down to the storage layer, so scans skip irrelevant data.
- Read performance does not degrade as past updates accumulate.

The cost is paid on write: each upsert performs a primary-key lookup to locate and mark the previous version, which adds some write overhead compared with merge-on-read. For the large majority of workloads this trade-off is worthwhile, which is why merge-on-write is the default.

## How Merge-on-Read Works

With merge-on-read, writes only append data. Doris keeps every version of a Key and merges them at query time or during compaction, returning the latest version.

Because duplicates are resolved at read time:

- Writes are lightweight, since no primary-key lookup is required on write.
- Every query must merge versions of the same Key, and predicates cannot be pushed down, so queries are slower.
- Query latency grows as versions accumulate between compactions.

This implementation suits write-heavy, read-light pipelines where write throughput matters more than query latency.

## Choosing Between Them

- **Use merge-on-write (default)** for the large majority of workloads, including real-time updates, dimension synchronization, and any case where query performance matters. It also unlocks capabilities such as partial column updates.
- **Use merge-on-read** only when writes vastly outweigh reads and minimizing write overhead is the priority.

The implementation is fixed at table creation and **cannot be changed later through schema change**, so choose before creating the table.

## Enabling Each Implementation

The implementation is controlled by the `enable_unique_key_merge_on_write` table property.

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

Some Unique Key features depend on the merge-on-write implementation:

- [Partial column update](../../data-operate/update/update-of-unique-model): update a subset of columns without rewriting the whole row.
- Predicate pushdown to the storage layer for faster filtered queries.

## Related

- [Unique Key Model](./unique)
- [Partial Column Update](../../data-operate/update/update-of-unique-model)
