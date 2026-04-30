---
{
    "title": "Multi-Stream Updates for the Unique Model",
    "language": "en",
    "description": "Use the Sequence Mapping feature of the Doris Unique model to solve version control problems when multiple data streams concurrently update different columns of the same wide table."
}
---

<!-- Knowledge type: Feature + Procedure -->
<!-- Applicable scenarios: Concurrent writes from multiple data streams to a wide table / Real-time updates for some columns combined with on-demand updates for others -->

## Business Scenarios and Pain Points

In wide-table scenarios in a data warehouse, different columns of the same table often come from **different data sources** or **different processing pipelines**. Common cases include:

- **Real-time stream**: Continuously updates some fields of the table (for example, columns related to user behavior).
- **Offline stream (or on-demand stream)**: Updates other fields of the table at specific times (for example, columns related to user profiles or tags).

In this scenario, multiple data streams concurrently write to the same primary-key table and face two core problems:

| Pain Point | Description |
| --- | --- |
| **Concurrent overwrite problem** | Different data streams arrive at different times. A simple REPLACE aggregation cannot guarantee that the data from each stream is updated in version order. |
| **High cost of joining data** | It is almost impossible to wait for all columns to be assembled before writing. The interval can be very long, and the business cannot tolerate it. |

The Doris Unique model natively supports version control based on a Sequence column, but **only a single global Sequence column can be defined**, which cannot independently control the update version of different columns from different data streams. To address this, Doris provides the **Sequence Mapping** feature.

## Solution: Sequence Mapping

<!-- Knowledge type: One-line definition -->

**Sequence Mapping** is a multi-stream concurrent update mechanism supported by the Doris Unique model. By specifying different Sequence columns for different data columns, it enables independent version control for each data stream without interference.

### How It Works

Suppose a Unique table contains the following columns:

| Column | A | B | C | D | E | s1 | s2 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Role | Key | Key | Value | Value | Value | Sequence | Sequence |

- Data stream 1 writes to columns `A, B, C, D` and uses `s1` as the version control column.
- Data stream 2 writes to columns `A, B, E` and uses `s2` as the version control column.

With this mapping:

- `s1` controls the version of columns `C, D`: only when the `s1` of the new data is greater than the `s1` of the existing data, `C, D, s1` are updated.
- `s2` controls the version of column `E`: only when the `s2` of the new data is greater than the `s2` of the existing data, `E, s2` are updated.
- The two streams **do not interfere with each other**, and queries can read the latest data of all columns.

## Usage Example

### 1. Create a Table That Supports Sequence Mapping

Use the `sequence_mapping.<sequence_col>` property in `PROPERTIES` to declare the mapping between a Sequence column and the Value columns it controls.

The following example creates a Unique table where columns `c, d` are version-controlled by `s1`, and column `e` is version-controlled by `s2`:

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `e`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT "",
    `s2` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d",
    "sequence_mapping.s2" = "e"
);
```

> Supported types for Sequence columns: integer types, `DATE`, and `DATETIME`. **The type cannot be changed after the column is created.**

After creation, the table schema is as follows:

```sql
MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| s2    | int    | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+
```

### 2. Write and Query Data

The following five insert operations demonstrate how different Sequence values affect updates of each column.

**Insert 1**: Writes only `c, d, s1` and does not write `e, s2`.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,2,2,2);
Query OK, 1 row affected (0.080 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**Insert 2**: `s1=1` is less than the existing `s1=2`, so `c, d, s1` are not updated.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1);
Query OK, 1 row affected (0.048 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 | NULL |    2 | NULL |
+------+------+------+------+------+------+------+
```

**Insert 3**: Writes `e, s2`. Since the previous `s2` was `NULL` (treated as the smallest value), `e, s2` are updated.

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.043 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    2 |    2 |    2 |    2 |    2 |
+------+------+------+------+------+------+------+
```

**Insert 4**: `s1=3` is greater than the existing `s1=2`, so `c, d, s1` are updated, while `e, s2` are not affected.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,3,3,3);
Query OK, 1 row affected (0.049 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    2 |    3 |    2 |
+------+------+------+------+------+------+------+
```

**Insert 5**: Writes both groups of columns. Both `s1=4` and `s2=4` are greater than the existing values, so all columns are updated.

```sql
MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | e    | s1   | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+------+
```

A summary of the update results:

| Operation | Trigger Condition | Updated Columns |
| --- | --- | --- |
| Insert 1 | First write of `c, d, s1` | `c, d, s1` |
| Insert 2 | New `s1` < existing `s1` | None |
| Insert 3 | First write of `e, s2` | `e, s2` |
| Insert 4 | New `s1` > existing `s1` | `c, d, s1` |
| Insert 5 | Both new `s1` and `s2` are greater than existing values | `c, d, s1, e, s2` |

### 3. Add or Drop Columns

A Sequence Mapping table supports dynamically adding or dropping columns and mappings using `ALTER TABLE`.

**Initial table creation**: Contains only one mapping `s1 -> c,d`.

```sql
CREATE TABLE `upsert_test` (
    `a`  bigint(20) NULL COMMENT "",
    `b`  int(11)    NULL COMMENT "",
    `c`  int(11)    NULL COMMENT "",
    `d`  int(11)    NULL COMMENT "",
    `s1` int(11)    NULL COMMENT ""
) ENGINE=OLAP
UNIQUE KEY(`a`, `b`)
COMMENT "OLAP"
DISTRIBUTED BY HASH(`a`, `b`) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "false",
    "light_schema_change" = "true",
    "replication_num" = "1",
    "sequence_mapping.s1" = "c,d"
);
```

**Write initial data**:

```sql
MySQL > insert into upsert_test(a, b, c, d, s1) values (1,1,1,1,1),(1,1,3,3,3),(1,1,2,2,2);
Query OK, 3 rows affected (0.101 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |
+------+------+------+------+------+
```

**Add columns and mapping**: Use `ALTER TABLE` to add columns `e, s2` and declare the `s2 -> e` mapping at the same time.

```sql
MySQL > alter table upsert_test add column (e int(11) NULL, s2 bigint) PROPERTIES('sequence_mapping.s2' = 'e');
Query OK, 0 rows affected (0.011 sec)

MySQL > desc upsert_test;
+-------+--------+------+-------+---------+---------+
| Field | Type   | Null | Key   | Default | Extra   |
+-------+--------+------+-------+---------+---------+
| a     | bigint | Yes  | true  | NULL    |         |
| b     | int    | Yes  | true  | NULL    |         |
| c     | int    | Yes  | false | NULL    | REPLACE |
| d     | int    | Yes  | false | NULL    | REPLACE |
| s1    | int    | Yes  | false | NULL    | REPLACE |
| e     | int    | Yes  | false | NULL    | REPLACE |
| s2    | bigint | Yes  | false | NULL    | REPLACE |
+-------+--------+------+-------+---------+---------+

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 | NULL | NULL |
+------+------+------+------+------+------+------+
```

**Write after the new mapping takes effect**:

```sql
MySQL > insert into upsert_test(a, b, e, s2) values (1,1,2,2);
Query OK, 1 row affected (0.052 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    3 |    3 |    3 |    2 |    2 |
+------+------+------+------+------+------+------+

MySQL > insert into upsert_test(a, b, c, d, s1, e, s2) values (1,1,5,5,4,5,4);
Query OK, 1 row affected (0.050 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | e    | s2   |
+------+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    5 |    4 |
+------+------+------+------+------+------+------+
```

**Drop columns**: Drop the Value column `e`, and the corresponding mapping is invalidated. Then drop the Sequence column `s2`.

```sql
MySQL > alter table upsert_test drop column e;
Query OK, 0 rows affected (0.006 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+------+
| a    | b    | c    | d    | s1   | s2   |
+------+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |    4 |
+------+------+------+------+------+------+

MySQL > alter table upsert_test drop column s2;
Query OK, 0 rows affected (0.005 sec)

MySQL > select * from upsert_test;
+------+------+------+------+------+
| a    | b    | c    | d    | s1   |
+------+------+------+------+------+
|    1 |    1 |    5 |    5 |    4 |
+------+------+------+------+------+
```

## Usage Constraints

<!-- Knowledge type: Configuration parameters / Usage limitations -->

When using Sequence Mapping, note the following constraints:

| Category | Constraint |
| --- | --- |
| **Table creation configuration** | `light_schema_change` must be enabled. If the `sequence_mapping` property is not declared at table creation, it cannot be enabled later. |
| **Column types** | Sequence columns only support integer types and time types (`DATE`, `DATETIME`), and the type cannot be changed after creation. |
| **Column roles** | Neither Sequence columns nor mapped columns can be Key columns. All non-Key columns must be mapped to a Sequence column. |
| **Mapping relationships** | Mapped columns of different Sequence columns **cannot overlap** (for example, `d` cannot be mapped to both `s1` and `s2`). After a mapping is established, **it cannot be modified** (for example, a column already mapped to `s1` cannot be remapped to `s2`). |
| **DDL limitations** | Column renaming is not supported. Rollup creation is not supported. |
| **Storage mode** | Currently only MOR (Merge-on-Read) tables are supported. Enabling alongside a global Sequence column is not supported. Batch delete operations are not supported. |
| **Load semantics** | Fields not included during loading are automatically filled with default values or `NULL`. When comparing Sequence columns, `NULL` is treated as the **smallest value**. |
