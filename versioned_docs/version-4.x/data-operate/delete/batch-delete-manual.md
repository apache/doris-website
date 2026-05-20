---
{
    "title": "Load-Based Batch Delete",
    "language": "en",
    "description": "The Doris Unique Key model supports batch deletion by carrying delete markers during data loading. It is suitable for CDC synchronization and large-scale primary key deletion scenarios, and offers better performance than the DELETE statement.",
    "keywords": [
        "Doris batch delete",
        "Unique Key delete",
        "delete marker",
        "__DORIS_DELETE_SIGN__",
        "CDC sync",
        "merge_type DELETE",
        "Stream Load delete",
        "Broker Load delete",
        "Routine Load delete"
    ]
}
---

<!-- Knowledge type: Procedure + Feature description -->
<!-- Applicable scenarios: CDC synchronization / Large-scale primary key deletion / Merged data writes -->

**Load-based batch delete** is a deletion method provided by the Doris Unique Key model. By carrying a **delete marker column** during data loading, rows to be deleted are marked as deleted, and background Compaction asynchronously cleans them up.

Compared with the `DELETE` statement, delete markers offer higher performance and better usability in batch deletion and CDC scenarios.

### Applicable Scenarios

| Scenario | Description |
|------|------|
| **CDC synchronization** | When synchronizing from an OLTP database (such as MySQL) to Doris through binlog, Insert and Delete operations appear alternately in the binlog. Using delete markers allows both types of operations to be handled uniformly, simplifying the code and improving load and query performance. |
| **Batch deletion by primary key** | When a large amount of data needs to be deleted by primary key, each `DELETE` statement generates an empty Rowset and produces a new data version. Frequent deletions significantly degrade query performance. Delete markers can be written in batches, avoiding this issue. |

### Comparison with the DELETE Statement

| Item | Load-based batch delete | DELETE statement |
|------|------|------|
| Applicable model | Unique Key | Unique Key / Aggregate Key / Duplicate Key |
| Trigger method | Carry delete markers during loading | Execute SQL |
| Data version | Shares the version of the load | Generates a new version each time |
| Large-batch deletion performance | High | Low |
| CDC scenario fit | Native support | Requires extra handling |

---

## How It Works

<!-- Knowledge type: Concept description -->

### Core Mechanism

- **Hidden column**: Every Unique Key table contains a hidden column `__DORIS_DELETE_SIGN__`. A value of `1` indicates that the row is marked as deleted.
- **Load-time write**: A load task can specify which rows to mark as deleted through mapping conditions. The syntax differs slightly across load methods.
- **Query filtering**: During query planning, the FE automatically appends the filter condition `__DORIS_DELETE_SIGN__ != true`, so marked rows are invisible to users.
- **Background cleanup**: The BE Compaction process periodically performs physical cleanup of rows marked as deleted.

### Data Example

#### Step 1: Create the Table

Create a Unique Key table:

```sql
CREATE TABLE example_table (
    id BIGINT NOT NULL,
    value STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 10
PROPERTIES (
    "replication_num" = "3"
);
```

#### Step 2: View Hidden Columns

Use the session variable `show_hidden_columns` to display hidden columns:

```sql
mysql> set show_hidden_columns=true;

mysql> desc example_table;
+-----------------------+---------+------+-------+---------+-------+
| Field                 | Type    | Null | Key   | Default | Extra |
+-----------------------+---------+------+-------+---------+-------+
| id                    | bigint  | No   | true  | NULL    |       |
| value                 | text    | Yes  | false | NULL    | NONE  |
| __DORIS_DELETE_SIGN__ | tinyint | No   | false | 0       | NONE  |
| __DORIS_VERSION_COL__ | bigint  | No   | false | 0       | NONE  |
+-----------------------+---------+------+-------+---------+-------+
```

#### Step 3: Write a Delete Marker

Suppose the table contains the following data:

```sql
+------+-------+
| id   | value |
+------+-------+
|    1 | foo   |
|    2 | bar   |
+------+-------+
```

Use `INSERT INTO` to write a delete marker for the row where `id = 1` (this is for illustration only; in production, use the corresponding load method):

```sql
mysql> insert into example_table (id, __DORIS_DELETE_SIGN__) values (1, 1);
```

#### Step 4: Verify Query Results

By default, queries automatically filter out marked rows:

```sql
mysql> select * from example_table;
+------+-------+
| id   | value |
+------+-------+
|    2 | bar   |
+------+-------+
```

After enabling `show_hidden_columns`, the row with `id = 1` is still present and only marked:

```sql
mysql> set show_hidden_columns=true;
mysql> select * from example_table;
+------+-------+-----------------------+-----------------------+
| id   | value | __DORIS_DELETE_SIGN__ | __DORIS_VERSION_COL__ |
+------+-------+-----------------------+-----------------------+
|    1 | NULL  |                     1 |                     3 |
|    2 | bar   |                     0 |                     2 |
+------+-------+-----------------------+-----------------------+
```

---

## Load Merge Methods

<!-- Knowledge type: Configuration parameter -->

A load task controls data merging behavior through `merge_type`. Three methods are supported:

| merge_type | Behavior | Typical use |
|------|------|------|
| **APPEND** (default) | All data is appended to the existing data | Regular writes |
| **DELETE** | Deletes all rows whose Key columns match the loaded data | Batch deletion by primary key |
| **MERGE** | Performs APPEND or DELETE for each row based on the `DELETE ON` condition | CDC scenarios with mixed Insert/Delete |

> Note: `MERGE` must be used together with `DELETE ON <condition>`.

---

## Syntax for Each Load Method

<!-- Knowledge type: Procedure -->

The syntax for setting delete markers differs slightly across load methods. Each is described below.

### Stream Load

**Usage**: Configure the `columns`, `merge_type`, and `delete` fields in the HTTP Header.

**Example**:

```bash
-H "columns: k1, k2, label_c3"
-H "merge_type: [MERGE|APPEND|DELETE]"
-H "delete: label_c3=1"
```

**Parameter description**:

- `columns`: The load field mapping. It must include the marker column used to determine deletion.
- `merge_type`: The merge method. Valid values are `APPEND`, `DELETE`, and `MERGE`.
- `delete`: Takes effect when `merge_type=MERGE`. Specifies the delete condition.

For more examples, see the "Specify merge_type for Delete operation" and "Specify merge_type for Merge operation" sections in the [Stream Load Manual](../import/import-way/stream-load-manual.md).

### Broker Load

**Usage**: Specify delete markers in the `LOAD` clause using the `[MERGE|APPEND|DELETE]` keyword and the `DELETE ON` clause.

**Syntax example**:

```sql
LOAD LABEL db1.label1
(
    [MERGE|APPEND|DELETE] DATA INFILE("hdfs://abc.com:8888/user/palo/test/ml/file1")
    INTO TABLE tbl1
    COLUMNS TERMINATED BY ","
    (tmp_c1, tmp_c2, label_c3)
    SET
    (
        id = tmp_c2,
        name = tmp_c1
    )
    [DELETE ON label_c3=true]
)
WITH BROKER 'broker'
(
    "username" = "user",
    "password" = "pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

### Routine Load

**Usage**: When creating a routine load job, specify delete markers using the `WITH [MERGE|APPEND|DELETE]` and `DELETE ON` clauses.

**Syntax example**:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
[WITH MERGE|APPEND|DELETE]
COLUMNS(k1, k2, k3, v1, v2, label),
WHERE k1 > 100 and k2 like "%doris%"
[DELETE ON label=true]
PROPERTIES
(
    "desired_concurrent_number" = "3",
    "max_batch_interval" = "20",
    "max_batch_rows" = "300000",
    "max_batch_size" = "209715200",
    "strict_mode" = "false"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "kafka_partitions" = "0,1,2,3",
    "kafka_offsets" = "101,0,0,200"
);
```

---

## FAQ

<!-- Knowledge type: FAQ -->

**Q1: Which table models does load-based batch delete support?**

Only the Unique Key model is supported. For Aggregate Key and Duplicate Key tables, use the `DELETE` statement.

**Q2: When is the disk space of marked-deleted data actually released?**

It is asynchronously cleaned up by the BE background Compaction. The timing depends on Compaction scheduling and the number of data versions, and usually requires no user intervention.

**Q3: How can you check whether a row has been marked as deleted?**

Run `SET show_hidden_columns=true;` and then query the table. The hidden column `__DORIS_DELETE_SIGN__` becomes visible. A value of `1` indicates that the row is marked as deleted.

**Q4: Which merge_type should be used in CDC scenarios?**

`MERGE` is recommended, used together with `DELETE ON` to specify the delete condition. This allows Insert and Delete operations to be processed together in the same load.

**Q5: Do delete markers affect query performance?**

Normal queries automatically filter out marked rows, so the performance impact is negligible. After background Compaction completes, marked data is physically cleaned up.

---

## Related Links

- [Stream Load Manual](../import/import-way/stream-load-manual.md)
- [Broker Load Manual](../import/import-way/broker-load-manual.md)
- [Routine Load Manual](../import/import-way/routine-load-manual.md)
