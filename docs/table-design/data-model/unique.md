---
{
    "title": "Unique Key Model",
    "language": "en",
    "description": "The Doris Unique Key Model guarantees the uniqueness of Key columns and supports UPSERT and deduplication. It fits data update scenarios such as high-frequency updates, dimension synchronization, and profile tagging."
}
---

The Unique Key Model guarantees the uniqueness of Key columns: when a row is inserted or updated, new data overwrites any existing row with the same Key, so records always reflect the latest version. Use it when your data requires frequent updates by primary key.

<!-- Knowledge type: Data model -->
<!-- Applicable scenarios: Data update / High-frequency writes / Primary key deduplication -->

## When to Use

The Unique Key Model fits three main scenarios:

1. **High-frequency data updates**: Real-time synchronization of dimension tables from upstream OLTP databases, which requires efficient UPSERT operations.
2. **Efficient data deduplication**: In ad delivery, customer relationship management (CRM), and similar systems, records are deduplicated by user ID.
3. **Partial column updates**: For profile tagging where dynamic tags change frequently, or order scenarios where the transaction status changes, you can update only the affected columns.

## Create a Unique Key Table

Declare the primary key with the `UNIQUE KEY` keyword. Merge-on-write is enabled by default and is the right choice for almost all workloads, so no extra property is required:

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
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```

Each row is identified by `(user_id, user_name)`. Writing a row whose Key already exists overwrites it; a row with a new Key is inserted.

## Upsert Data

Insert data with a standard `INSERT` statement. Rows with an existing Key are updated; rows with a new Key are inserted. Doris uses the Key columns for both sorting and deduplication.

![unique-key-model-insert](/images/table-desigin/unique-key-model-insert.png)

In the following example, the original table has 4 rows. Re-inserting 2 rows with existing Keys updates them in place:

```sql
-- Insert original data
INSERT INTO example_tbl_unique VALUES
(101, 'Tom', 'BJ', 26, 1),
(102, 'Jason', 'BJ', 27, 1),
(103, 'Juice', 'SH', 20, 2),
(104, 'Olivia', 'SZ', 22, 2);

-- Re-insert the same Keys with new values
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

Under whole-row `UPSERT` semantics, if `INSERT INTO` specifies only some columns, Doris fills the unspecified columns with NULL or default values.

## Update Only Some Columns

To change a few fields without rewriting the whole row, use partial column update. It requires the merge-on-write implementation (the default) and is enabled through a parameter. See [Partial Column Update](../../data-operate/update/update-of-unique-model).

## Choose an Implementation

The Unique Key Model has two storage implementations: **merge-on-write** (the default, recommended for most workloads) and **merge-on-read** (suited to write-heavy, read-light pipelines). The implementation is fixed at table creation and cannot be changed later through schema change.

For how each one works, their performance trade-offs, and how to enable merge-on-read, see [Merge-on-Write](./merge-on-write).

## Notes

When using the Unique Key Model, note the following limitations:

1. **The implementation cannot be changed**: merge-on-write or merge-on-read can only be set at table creation and cannot be modified through schema change.
2. **Whole-row UPSERT fills in default values**: even if `INSERT INTO` specifies only some columns, Doris fills the unspecified columns with NULL or default values.
3. **Partial column updates require merge-on-write**: to update only some columns, you must use the merge-on-write implementation and enable partial column update support through a specific parameter. For details, see [Partial Column Update](../../data-operate/update/update-of-unique-model).
4. **Partition keys must be a subset of Key columns**: to guarantee data uniqueness, partition keys must be a subset of the Key columns.
