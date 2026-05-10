---
{
    "title": "Concurrent Update Control for the Unique Key Model",
    "language": "en",
    "description": "Apache Doris concurrent update control guide for the Unique Key model: version management based on MVCC, replacement order control for out-of-order data through the Sequence column, and configurable UPDATE concurrency."
}
---

<!-- Knowledge type: Feature description + Procedure -->
<!-- Applicable scenarios: High-concurrency data ingestion / Out-of-order updates on the Unique Key model / UPDATE transaction control -->

Under the Unique Key model, Doris provides comprehensive concurrent update control. It mainly addresses the following three typical scenarios:

| User scenario | Pain point | Doris solution |
| --- | --- | --- |
| Multiple imports of the same primary key | Determining which record finally takes effect under concurrent imports | MVCC (Multi-Version Concurrency Control), where the version number determines the overwrite order |
| Out-of-order arrival from multi-threaded synchronization | Older data arrives later and incorrectly overwrites newer data | Sequence column: the user specifies the replacement order, and the row with the larger sequence value wins |
| Concurrent UPDATEs on the same table | Row-level updates may produce dirty data, so they run serially by default | A table-level lock guarantees the Serializable isolation level, with an option to lift the concurrency limit |

The following sections describe the working principles and usage of these mechanisms.

## MVCC Multi-Version Concurrency Control

<!-- Knowledge type: Concept description -->

Doris uses Multi-Version Concurrency Control (MVCC) to manage concurrent updates:

- Each data write operation is assigned a write transaction, which guarantees the atomicity of the write (either fully succeeds or fully fails).
- When the write transaction commits, the system assigns it a version number.
- When you import data multiple times into a Unique Key table, if duplicate primary keys exist, Doris determines the overwrite order by the version number: **data with a higher version number overwrites data with a lower version number**.

## UPDATE Concurrency Control

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Concurrent execution of multiple UPDATE statements -->

### Default Behavior

By default, Doris **does not allow** multiple `UPDATE` operations to run concurrently on the same table.

The reason is that Doris currently supports row-level updates: even if you only declare `SET v2 = 1`, all other Value columns are also overwritten (although their values do not change). If two `UPDATE` operations update the same row at the same time, the behavior is undefined and there is a risk of dirty data.

For this reason, the `UPDATE` statement provides Serializable isolation by default through a table-level lock, so multiple `UPDATE` operations can only run serially.

### Lifting the Concurrency Limit

In real-world use, if you can guarantee that concurrent updates will not operate on the same row at the same time, you can lift the concurrency limit by changing an FE configuration:

| Configuration item | Default value | Description |
| --- | --- | --- |
| `enable_concurrent_update` | `false` | When set to `true`, allows `UPDATE` to run concurrently, but no longer provides transaction guarantees |

## Sequence Column

<!-- Knowledge type: Feature description -->
<!-- Applicable scenarios: Multi-threaded concurrent synchronization / Out-of-order data ingestion -->

### Why You Need a Sequence Column

The Unique model is mainly designed for scenarios that require unique primary keys, and it can guarantee primary key uniqueness. However, in the following situations, relying on the import version number alone is not enough:

- When you synchronize data into Doris with multiple concurrent threads, data from different threads may arrive out of order.
- Older data may arrive later and incorrectly overwrite newer data.
- When data with the same primary key is imported in the same batch or across different batches, the replacement order is not guaranteed, so the final result is non-deterministic.

To solve this, Doris supports specifying a **Sequence column** at import time. For rows with the same Key columns, replacement is performed based on the Sequence column value: **a larger value replaces a smaller value**, and the reverse does not trigger replacement. This puts the decision about ordering in your hands.

In implementation, Doris adds a hidden column `__DORIS_SEQUENCE_COL__`. The column type is specified by the user when creating the table, and the value is determined at import time. Doris then uses this value to decide which row wins among rows that share the same Key columns.

:::caution Note
The Sequence column is currently only supported by the Unique model.
:::

### Enabling the Sequence Column

You can enable it in the following ways:

| Scenario | Operation |
| --- | --- |
| Enable on a new table | Set `function_column.sequence_col` or `function_column.sequence_type` in the `PROPERTIES` of the `CREATE TABLE` statement |
| Enable on an existing table | Run `ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")` |
| Check whether it is enabled | Run `SET show_hidden_columns=true`, then run `desc tablename`. If the output contains `__DORIS_SEQUENCE_COL__`, it is enabled |

The two properties differ as follows:

| Property | Meaning | Whether the schema must contain a corresponding column |
| --- | --- | --- |
| `function_column.sequence_col` | Maps the Sequence column to an existing column in the table | Yes |
| `function_column.sequence_type` | Specifies only the type of the Sequence column, stored in a hidden column | No |

Supported column types: integer types, `DATE`, and `DATETIME`. **The column type cannot be changed once the table is created.**

### Usage Example

The following example uses Stream Load to demonstrate the full workflow.

#### 1. Create a Table That Supports the Sequence Column

Create the Unique model table `test_table` and map the Sequence column to the `modify_date` column in the table:

```sql
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```

The resulting table schema looks like this:

```sql
MySQL>  desc test_table;
+-------------+--------------+------+-------+---------+---------+
| Field       | Type         | Null | Key   | Default | Extra   |
+-------------+--------------+------+-------+---------+---------+
| user_id     | BIGINT       | No   | true  | NULL    |         |
| date        | DATE         | No   | true  | NULL    |         |
| group_id    | BIGINT       | No   | true  | NULL    |         |
| modify_date | DATE         | No   | false | NULL    | REPLACE |
| keyword     | VARCHAR(128) | No   | false | NULL    | REPLACE |
+-------------+--------------+------+-------+---------+---------+
```

If you do not want this column to appear in the table schema, use `function_column.sequence_type` to specify the type instead:

```sql
PROPERTIES (
    "function_column.sequence_type" = 'Date'
);
```

#### 2. Import Data and Verify the Sequence Behavior

When using the column-mapping approach (`function_column.sequence_col`), the import command does not need any extra parameters. Use Stream Load to import the following data:

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```

Stream Load command:

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```

Query result:

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

Because `2020-03-05` is the largest value in the Sequence column (`modify_date`), the `keyword` column finally keeps `c`.

#### 3. Specifying the Sequence Column in Different Import Methods

When you use `function_column.sequence_type` at table creation (that is, when the Sequence column is not directly mapped to a column in the table), you must explicitly specify the mapping from the Sequence column to a data column at import time.

**Stream Load**

In the header, use `function_column.sequence_col` to specify the `source_sequence` mapping for the hidden column:

```shell
curl --location-trusted -u root \
    -H "columns: k1,k2,source_sequence,v1,v2" \
    -H "function_column.sequence_col: source_sequence" \
    -T testData http://host:port/api/testDb/testTbl/_stream_load
```

**Broker Load**

Specify the `source_sequence` field for the hidden column mapping in the `ORDER BY` clause:

```sql
LOAD LABEL db1.label1
(
    DATA INFILE("hdfs://host:port/user/data/*/test.txt")
    INTO TABLE `tbl1`
    COLUMNS TERMINATED BY ","
    (k1,k2,source_sequence,v1,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```

**Routine Load**

The mapping is the same as above. Example:

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
    [WITH MERGE|APPEND|DELETE]
    COLUMNS(k1, k2, source_sequence, v1, v2),
    WHERE k1  100 and k2 like "%doris%"
    [ORDER BY source_sequence]
    PROPERTIES
    (
        "desired_concurrent_number"="3",
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

#### 4. Verify the Replacement Order Guarantee

Continuing from the previous example, import the following data (where all Sequence values are smaller than the existing maximum `2020-03-05`):

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```

Query result:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```

Because all Sequence values in this import are smaller than the existing maximum `2020-03-05`, the result remains unchanged.

Now import data with a larger Sequence value:

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```

Query result:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```

Because the Sequence value `2020-03-23` of the newly imported data is greater than the existing maximum `2020-03-05`, the original data is replaced.

**Conclusion**: During imports, Doris compares the Sequence column values across all batches and **writes the record with the largest value into the table**.

### Usage Notes

<!-- Knowledge type: Caveats -->

1. **The Sequence column must be specified explicitly**: in import jobs such as Stream Load and Broker Load, as well as in row-update `INSERT` statements, you must explicitly specify the Sequence column (unless its default value is `CURRENT_TIMESTAMP`). Otherwise, you will receive the following error:

    ```Plain
    Table test_tbl has sequence column, need to specify the sequence column
    ```

2. **Disabling the Sequence column constraint check**: in scenarios such as table replication or internal data migration, you can disable the mandatory Sequence column check on `INSERT` statements through a session variable:

    ```sql
    set require_sequence_in_insert = false;
    ```

3. **Compatibility with partial column updates**: starting from version 2.0, the Merge-on-Write implementation of Doris Unique Key tables supports partial column updates. In a partial-column-update import, only some columns can be updated each time, so **the Sequence column is not required**:

    - If the import job includes the Sequence column, the behavior is unchanged.
    - If the import job does not include the Sequence column, Doris uses the Sequence column value from the matched historical data as the Sequence column value of the updated row.
    - If no record with the same Key exists in the historical data, Doris automatically fills in `null` or the default value.

4. **Correctness guarantee under concurrent imports**: when concurrent imports occur, Doris uses MVCC to guarantee data correctness. If two batches of imports both update different columns of the same Key, after the import job with the lower version number succeeds, the import job with the higher version number uses the rows written by the lower-version job for the same Key to fill in the missing values.
