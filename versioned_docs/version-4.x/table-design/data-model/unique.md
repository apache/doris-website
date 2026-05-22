---
{
    "title": "Unique Key Model",
    "language": "en",
    "description": "The Doris Unique Key Model guarantees the uniqueness of Key columns and supports UPSERT and deduplication. It fits data update scenarios such as high-frequency updates, dimension synchronization, and profile tagging."
}
---

The Unique Key Model is designed for business scenarios that require data updates. This model guarantees the uniqueness of Key columns: when data is inserted or updated, new data overwrites old data with the same Key, ensuring that records always reflect the latest version.

<!-- Knowledge type: Data model -->
<!-- Applicable scenarios: Data update / High-frequency writes / Primary key deduplication -->

## Applicable Scenarios

The Unique Key Model is mainly suitable for the following three categories of business scenarios:

1. **High-frequency data updates**: Real-time synchronization of dimension tables from upstream OLTP databases, which requires efficient UPSERT operations.
2. **Efficient data deduplication**: In ad delivery, customer relationship management (CRM), and similar systems, deduplication is performed efficiently based on user IDs.
3. **Partial column updates**: For profile tagging scenarios where dynamic tags change frequently, or for order consumption scenarios where the transaction status changes, the partial column update capability of the Unique Key Model can be used.

## Core Features

The Unique Key Model provides the following core features:

| Feature | Description |
| --- | --- |
| UPSERT based on primary key | Records with duplicate primary keys are updated; records whose primary keys do not exist are inserted |
| Deduplication based on primary key | Key columns are unique, and data is deduplicated by the primary key columns |
| High-frequency data updates | Supports high-frequency update scenarios while balancing update performance and query performance |

## How It Works

The Doris Unique Key Model provides two implementations, compared as follows:

| Implementation | Default since version | Merge timing | Query performance | Predicate pushdown | Applicable scenarios |
| --- | --- | --- | --- | --- | --- |
| Merge-on-write | Default since 2.1 (introduced in 1.2) | Merged immediately at write time | High | Supported | Most scenarios, balancing query and write performance |
| Merge-on-read | Default before 2.1 | Merged at query or compaction time | Lower | Not supported | Write-heavy, read-light scenarios |

- **Merge-on-write**: Records with the same Key are merged immediately at write time, ensuring that the storage always holds the latest data. This mode balances query and write performance, avoids merging data across multiple versions, and supports predicate pushdown to the storage layer. **This mode is recommended for most scenarios.**
- **Merge-on-read**: Data is not merged at write time but is appended incrementally, with multiple versions retained inside Doris. At query or compaction time, versions with the same Key are merged. This mode suits write-heavy, read-light scenarios, but queries must merge multiple versions and predicates cannot be pushed down, which may affect query speed.

## Update Semantics

The Doris Unique Key Model supports two update semantics:

| Update semantics | Description | Implementation requirement |
| --- | --- | --- |
| Whole-row update | The default UPSERT semantics of the Unique Key Model: if the Key exists, the entire row is updated; otherwise, a new row is inserted | Supported by default |
| Partial column update | Only the specified columns are updated, and the original values of unspecified columns are kept | Must use merge-on-write and be enabled through a parameter |

Notes:

- Under whole-row `UPSERT` semantics, even if `INSERT INTO` specifies only some columns, Doris fills the unspecified columns with NULL or default values in the planner.
- For how to use partial column updates, see [Partial Column Update](../../data-operate/update/update-of-unique-model).

## Table Creation Examples

Use the `UNIQUE KEY` keyword to define a Unique Key table at table creation time, and use the `enable_unique_key_merge_on_write` property to control the implementation.

### Merge-on-write

Since Doris 2.1, merge-on-write is enabled by default:

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

### Merge-on-read

Before Doris 2.1, merge-on-read was enabled by default. Starting from 2.1, you must explicitly disable the `enable_unique_key_merge_on_write` property to use it:

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

## Data Insertion and Storage

In a Unique Key table, the Key columns are used not only for sorting but also for deduplication. When data is inserted, records with the same Key are overwritten.

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

In the following example, the original table has 4 rows. After inserting 2 rows, the new data updates the table based on the primary key:

```sql
-- Insert original data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- Update based on Key
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 27, 1),
(102, 'Jason', 'SH', 28, 1);

-- Query the updated data
SELECT * FROM example_tbl_unique;
+---------+-----------+------+------+------+
| user_id | user_name | city | age  | sex  |
+---------+-----------+------+------+------+
| 101     | Tom       | BJ   |   27 |    1 |
| 102     | Jason     | SH   |   28 |    1 |
| 104     | Olivia    | SZ   |   22 |    2 |
| 103     | Juice     | SH   |   20 |    2 |
+---------+-----------+------+------+------+
```

## Notes

When using the Unique Key Model, note the following limitations:

1. **The implementation cannot be changed**: The implementation of a Unique table (merge-on-write / merge-on-read) can only be specified at table creation time and cannot be modified through schema change.
2. **Whole-row UPSERT fills in default values**: Under whole-row `UPSERT` semantics, even if `INSERT INTO` specifies only some columns, Doris fills the unspecified columns with NULL or default values in the planner.
3. **Partial column updates require merge-on-write**: To update only some columns, you must use the merge-on-write implementation and enable partial column update support through a specific parameter. For details, see [Partial Column Update](../../data-operate/update/update-of-unique-model).
4. **Partition keys must be a subset of Key columns**: To guarantee data uniqueness, partition keys must be a subset of the Key columns.
