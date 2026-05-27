---
{
    "title": "Column Update",
    "language": "en",
    "description": "Apache Doris partial column update guide: efficiently update specified columns in the Unique Key Model and Aggregate Key Model, covering Stream Load, INSERT INTO, Flink Connector, and flexible column update scenarios."
}
---

<!-- Knowledge type: Operations guide + Feature description -->
<!-- Use cases: Real-time field updates / Multi-source wide-table joining / Data correction -->

In data update workflows, business requirements often call for modifying only a subset of fields in a row, for example:

- **Real-time, high-frequency field updates**: a user-tag table needs to keep the latest behavior fields up to date in real time so that ads and recommendation systems can perform real-time analysis and decision making.
- **Multi-source wide-table joining**: data from several source tables is joined by primary key into one wide table, where each source table contributes only some of the columns.
- **Data correction**: a batch operation corrects the values of certain fields in some records while leaving the other fields unchanged.

A traditional `UPDATE` statement usually has to read the full row first and then write the full row back. This "read-modify-write" transaction performs poorly under high-volume writes and cannot meet high-throughput requirements.

**The partial column update capability provided by Doris** allows you to write only the columns that need to change at load time, without first reading the full row, which significantly improves update efficiency. This document describes how to perform partial column updates on the **Unique Key Model** and the **Aggregate Key Model**.

## Capability Overview

<!-- Knowledge type: Capability definition -->

| Data model | Implementation | Write performance | Query performance | Use cases |
| --- | --- | --- | --- | --- |
| Unique Key (Merge-on-Write) | Fill in the full row at write time | Medium (affected by IO) | High | Real-time updates, scenarios sensitive to query performance |
| Aggregate Key (`REPLACE_IF_NOT_NULL`) | Aggregate at query time | High (comparable to a normal load) | Lower (aggregate queries are 5 to 10 times slower than MoW) | Scenarios sensitive to write throughput where lower query performance is acceptable |

## Column Update on the Unique Key Model

<!-- Knowledge type: Operating procedure -->

During a load on the Unique Key Model, Doris can directly insert or update partial column data without first reading the full row, which significantly improves update efficiency.

:::caution Note

1. In version 2.0, partial column updates are supported only in the Merge-on-Write implementation of Unique Key.
2. Starting from version 2.0.2, you can use `INSERT INTO` for partial column updates.
3. Partial column updates are not supported on tables that have synchronous materialized views.
4. Partial column updates are not supported on tables that are undergoing a Schema Change.

:::

### Example

Assume Doris contains an order table `order_tbl`, where the order ID is the Key column and the order status and order amount are Value columns. Create it with the Merge-on-Write Unique-Key model and load the seed row:

```sql
CREATE TABLE order_tbl (
  order_id     INT,
  order_status VARCHAR(64),
  order_amount INT
)
UNIQUE KEY (order_id)
DISTRIBUTED BY HASH (order_id) BUCKETS 1
PROPERTIES (
  "replication_num" = "1",
  "enable_unique_key_merge_on_write" = "true"
);

INSERT INTO order_tbl VALUES (1, 'Pending payment', 100);
```

The current data is then:

| Order ID | Order amount | Order status |
| --- | --- | --- |
| 1 | 100 | Pending payment |

```sql
+----------+--------------+------------------+
| order_id | order_amount | order_status     |
+----------+--------------+------------------+
| 1        |          100 | Pending payment  |
+----------+--------------+------------------+
1 row in set (0.01 sec)
```

When the user clicks pay, the order status of order ID `1` needs to change to `Pending shipment` without affecting the order amount field.

### Partial Column Updates Through Loading

#### Stream Load / Broker Load / Routine Load

Prepare the following CSV file:

```text
1,Pending shipment
```

Add the following header during the load:

```text
partial_columns:true
```

In the `columns` parameter, specify the columns to load (**all Key columns must be included**, otherwise the update cannot be performed). The following is a Stream Load example:

```shell
curl --location-trusted -u root: \
    -H "partial_columns:true" \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T /tmp/update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO

Across all data models, the default behavior of `INSERT INTO` with a subset of columns is a full-row write. To prevent misuse, in the Merge-on-Write implementation `INSERT INTO` still defaults to full-row UPSERT semantics. To enable partial column update semantics, first set the following session variable:

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

#### Flink Connector

When using the Flink Connector, add the following configuration:

```text
'sink.properties.partial_columns' = 'true'
```

Specify the columns to load in `sink.properties.column` (**all Key columns must be included**, otherwise the update cannot be performed).

### Update Result

The result after the update is as follows:

```sql
+----------+--------------+-------------------+
| order_id | order_amount | order_status      |
+----------+--------------+-------------------+
| 1        |          100 | Pending shipment  |
+----------+--------------+-------------------+
1 row in set (0.01 sec)
```

### Notes

<!-- Knowledge type: Performance tuning -->

The Merge-on-Write implementation has to fill in the full row at write time to guarantee optimal query performance. As a result, partial column updates with Merge-on-Write reduce load performance to some extent.

**Recommendations for write performance optimization:**

- **Use high-performance SSDs**: NVMe SSDs or high-speed cloud SSDs are recommended. Filling in the row reads a large amount of historical data, which produces high read IOPS and read throughput.
- **Enable row store**: this can significantly reduce the IOPS produced when filling in rows, and noticeably improves load performance. Enable it at table creation with the following property:

    ```text
    "store_row_column" = "true"
    ```

**Batch constraint:** all rows in the same batch write task (whether a load task or `INSERT INTO`) can update only the same set of columns. To update different columns, split the data into multiple batches. This constraint can be removed with the flexible column update feature described below.

### Flexible Column Update

<!-- Knowledge type: Feature description -->
<!-- Use cases: Real-time CDC sync / Scenarios where the updated columns differ row by row -->

Previously, the partial column update feature in Doris required all rows in a single load to update the same set of columns. **Starting from version 3.1.0**, Doris supports a more flexible update method: **each row in a single load can update a different set of columns**.

:::caution Note

1. Flexible column update supports Stream Load, Routine Load, and any tool that uses Stream Load as the underlying load method (such as the Doris Flink Connector).
2. The load file must be in JSON format when using flexible column update.

:::

#### Use Cases

When CDC is used to synchronize data from another system to Doris in real time, the records emitted by the source system may not be full rows but only the primary key plus the updated columns. In this case, within a time window the rows in a batch may each update different columns, and flexible column update can be used to load such data into Doris.

#### Usage

##### 1. Enable Flexible Column Update

**New tables:** specify the following properties at table creation to enable Merge-on-Write and add the `bitmap` hidden column required by flexible column update:

```text
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**Existing tables:** for an existing Merge-on-Write table created in an older Doris version, you can enable flexible column update after upgrading Doris with the following statement:

```sql
ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";
```

After execution, run `SHOW CREATE TABLE db1.tbl1`. If the result contains `"enable_unique_key_skip_bitmap_column" = "true"`, the feature has been enabled successfully.

:::tip
Before using this approach on an existing table, make sure light-schema-change is enabled on the target table.
:::

##### 2. Enable in Load Tasks

The configuration for each load method is as follows:

| Load method | Configuration item | Value |
| --- | --- | --- |
| Stream Load | header | `unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS` |
| Flink Doris Connector | sink property | `'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'` |
| Routine Load | `PROPERTIES` | `"unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"` |

**Full Routine Load example:**

```sql
CREATE ROUTINE LOAD db1.job1 ON tbl1
PROPERTIES (
    "format" = "json",
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
)
FROM KAFKA (
    "kafka_broker_list" = "localhost:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

You can also use `ALTER ROUTINE LOAD` to change the update mode of an existing Routine Load job:

```sql
-- 1. Pause the job
PAUSE ROUTINE LOAD FOR db1.job1;

-- 2. Change the update mode
ALTER ROUTINE LOAD FOR db1.job1
PROPERTIES (
    "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
);

-- 3. Resume the job
RESUME ROUTINE LOAD FOR db1.job1;
```

:::caution Routine Load restrictions

When using `UPDATE_FLEXIBLE_COLUMNS` mode in Routine Load, the following restrictions apply:

- The data format must be JSON (`"format" = "json"`).
- The `jsonpaths` property cannot be specified.
- The `fuzzy_parse` option cannot be enabled.
- The `COLUMNS` clause cannot be used.
- The `WHERE` clause cannot be used.

:::

#### Full Example

**Step 1: Create a test table**

```sql
CREATE TABLE t1 (
    `k`  INT NULL,
    `v1` BIGINT NULL,
    `v2` BIGINT NULL DEFAULT "9876",
    `v3` BIGINT NOT NULL,
    `v4` BIGINT NOT NULL DEFAULT "1234",
    `v5` BIGINT NULL
) UNIQUE KEY(`k`)
DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES (
    "replication_num" = "3",
    "enable_unique_key_merge_on_write" = "true",
    "enable_unique_key_skip_bitmap_column" = "true"
);
```

**Step 2: Existing data in the table**

```sql
MySQL root@127.1:d1> select * from t1;
+---+----+----+----+----+----+
| k | v1 | v2 | v3 | v4 | v5 |
+---+----+----+----+----+----+
| 0 | 0  | 0  | 0  | 0  | 0  |
| 1 | 1  | 1  | 1  | 1  | 1  |
| 2 | 2  | 2  | 2  | 2  | 2  |
| 3 | 3  | 3  | 3  | 3  | 3  |
| 4 | 4  | 4  | 4  | 4  | 4  |
| 5 | 5  | 5  | 5  | 5  | 5  |
+---+----+----+----+----+----+
```

**Step 3: Prepare flexible column update data**

Each row can update a different set of columns:

```json
{"k": 0, "__DORIS_DELETE_SIGN__": 1}
{"k": 1, "v1": 10}
{"k": 2, "v2": 20, "v5": 25}
{"k": 3, "v3": 30}
{"k": 4, "v4": 20, "v1": 43, "v3": 99}
{"k": 5, "v5": null}
{"k": 6, "v1": 999, "v3": 777}
{"k": 2, "v4": 222}
{"k": 1, "v2": 111, "v3": 111}
```

**Step 4: Load through Stream Load**

```shell
curl --location-trusted -u root: \
    -H "Expect:100-continue" \
    -H "strict_mode:false" \
    -H "format:json" \
    -H "read_json_by_line:true" \
    -H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
    -T test1.json \
    -XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

**Step 5: Check the update result**

```sql
MySQL root@127.1:d1> select * from t1;
+---+-----+------+-----+------+--------+
| k | v1  | v2   | v3  | v4   | v5     |
+---+-----+------+-----+------+--------+
| 1 | 10  | 111  | 111 | 1    | 1      |
| 2 | 2   | 20   | 2   | 222  | 25     |
| 3 | 3   | 3    | 30  | 3    | 3      |
| 4 | 43  | 4    | 99  | 20   | 4      |
| 5 | 5   | 5    | 5   | 5    | <null> |
| 6 | 999 | 9876 | 777 | 1234 | <null> |
+---+-----+------+-----+------+--------+
```

#### Restrictions and Notes

1. As with normal partial column updates, flexible column update requires every row to contain **all Key columns**. Rows that do not satisfy this requirement are filtered and counted in `filter rows`. When `filtered rows` exceeds the upper bound allowed by the load's `max_filter_ratio`, the entire load fails. Each filtered row is recorded in the error log.
2. Among the key-value pairs in a JSON object, only those whose Key matches a column name in the target table take effect. The rest are ignored. In addition, key-value pairs whose Key is `__DORIS_VERSION_COL__`, `__DORIS_ROW_STORE_COL__`, or `__DORIS_SKIP_BITMAP_COL__` are also ignored.
3. Flexible column update is not supported on tables containing Variant columns.
4. Flexible column update is not supported on tables that have synchronous materialized views.
5. When using flexible column update, the following load parameters **cannot** be specified or enabled:
    - `merge_type`
    - `delete`
    - `fuzzy_parse`
    - `columns`
    - `jsonpaths`
    - `hidden_columns`
    - `function_column.sequence_col`
    - `sql`
    - `memtable_on_sink_node` move-forward
    - `group_commit`
    - `where`

### Behavior Control for Newly Inserted Rows

<!-- Knowledge type: Configuration parameter -->

The session variable or load property `partial_update_new_key_behavior` controls the behavior of **newly inserted rows** in partial column updates and flexible column updates.

| Value | Behavior |
| --- | --- |
| `ERROR` | The Key of every row must already exist in the table, otherwise the load fails. |
| `APPEND` | Both updating existing rows and inserting new rows whose Key does not exist are allowed. |

#### Example Table Schema

```sql
CREATE TABLE user_profile (
    id               INT,
    name             VARCHAR(10),
    age              INT,
    city             VARCHAR(10),
    balance          DECIMAL(9, 0),
    last_access_time DATETIME
) ENGINE=OLAP
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES (
    "enable_unique_key_merge_on_write" = "true"
);
```

Existing data in the table:

```sql
mysql> select * from user_profile;
+----+-------+-----+----------+---------+---------------------+
| id | name  | age | city     | balance | last_access_time    |
+----+-------+-----+----------+---------+---------------------+
|  1 | kevin |  18 | shenzhen |     400 | 2023-07-01 12:00:00 |
+----+-------+-----+----------+---------+---------------------+
```

#### Scenario 1: `ERROR` Mode (Reject New Rows)

Because the Keys of the second and third rows (`3` and `18`) do not exist in the original table, this insert fails:

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');

-- Error:
-- (1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error:
-- [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR.
-- Row with key=[3] is not in table., host: 127.0.0.1")
```

#### Scenario 2: `APPEND` Mode (Allow New Rows)

```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;

INSERT INTO user_profile (id, balance, last_access_time) VALUES
    (1, 500, '2023-07-03 12:00:01'),
    (3, 23, '2023-07-03 12:00:02'),
    (18, 9999999, '2023-07-03 12:00:03');
```

After execution, the original row is updated and two new rows are added. For columns that the user did not specify:

1. If the column **has a default value**, the default value is used.
2. Otherwise, if the column **allows NULL**, NULL is used.
3. Otherwise, the insert fails.

Query result:

```sql
mysql> select * from user_profile;
+----+-------+------+----------+---------+---------------------+
| id | name  | age  | city     | balance | last_access_time    |
+----+-------+------+----------+---------+---------------------+
|  1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|  3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
| 18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+----+-------+------+----------+---------+---------------------+
```

## Column Update on the Aggregate Key Model

<!-- Knowledge type: Operating procedure -->
<!-- Use cases: Sensitive to write throughput, lower query performance is acceptable -->

The Aggregate table is mainly used for pre-aggregation scenarios, but it can also achieve a partial column update effect by setting the aggregate function to `REPLACE_IF_NOT_NULL`.

### Create the Table

Set the aggregate function of each field that needs column update to `REPLACE_IF_NOT_NULL`:

```sql
CREATE TABLE order_tbl (
    order_id     INT(11) NULL,
    order_amount INT(11) REPLACE_IF_NOT_NULL NULL,
    order_status VARCHAR(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

### Write Data

Whether you use Stream Load, Broker Load, Routine Load, or `INSERT INTO`, simply write the data of the fields to be updated. **No additional parameters are required.**

### Example

The example is the same as before. The corresponding Stream Load command is (no extra header is needed):

```shell
$ cat update.csv
1,Pending shipment

curl --location-trusted -u root: \
    -H "column_separator:," \
    -H "columns:order_id,order_status" \
    -T ./update.csv \
    http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

The corresponding `INSERT INTO` statement is (no extra session variable is needed):

```sql
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending shipment');
```

### Notes

- **Write performance**: the Aggregate Key Model does no extra processing during writes, so write performance is the same as a normal data load.
- **Query performance**: aggregation at query time is expensive. Compared with the Merge-on-Write implementation of the Unique Key Model, typical aggregate queries are **5 to 10 times** slower.
- **NULL value restriction**: because the `REPLACE_IF_NOT_NULL` aggregate function takes effect only on non-NULL values, **a field value cannot be changed to NULL**.
