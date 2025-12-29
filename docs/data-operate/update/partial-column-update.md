---
{
    "title": "Partial Column Update",
    "language": "en",
    "description": "This document explains how to perform partial column updates in Doris for Unique Key Model and Aggregate Key Model tables."
}
---

Partial column update allows you to update specific fields in a table without modifying all fields. This document explains how to perform partial column updates for both Unique Key Model and Aggregate Key Model tables.

## Overview

Partial column update is a feature that enables you to update only specific columns in a table row, rather than updating the entire row. This is particularly useful for:

- Real-time dynamic column updates, requiring frequent updates of specific fields in the table. For example, updating fields related to the latest user behavior in a user tag table for real-time analysis and decision-making in advertising/recommendation systems.
- Merging multiple source tables into one large wide table.
- Data correction.

## Partial Column Update for Unique Key Model

Doris provides a feature to directly insert or update partial column data in the unique key model load update, bypassing the need to read the entire row first, thus significantly improving update efficiency.

:::caution Note

1. Version 2.0 only supports partial column updates in the Merge-on-Write implementation of the Unique Key.
2. Starting from version 2.0.2, partial column updates are supported using INSERT INTO.
3. Partial column updates are not supported on tables with synchronized materialized views.
4. Partial column updates are not allowed on tables doing schema change.
:::

### Usage Example

Assume there is an order table `order_tbl` in Doris, where the order id is the Key column, and the order status and order amount are the Value columns. The data status is as follows:

| Order id | Order Amount | Order Status |
| -------- | -------------| -------------|
| 1        | 100          | Pending Payment |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | Pending Payment |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

After the user clicks to pay, the Doris system needs to change the order status of the order with order id '1' to 'Pending Shipment'.

### Partial Column Update Using Load Methods

#### StreamLoad/BrokerLoad/RoutineLoad

Prepare the following CSV file:

```
1,Pending Shipment
```

Add the following header during load:

```sql
partial_columns:true
```

Specify the columns to be loaded in `columns` (must include all key columns). Below is an example of Stream Load:

```sql
curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

#### INSERT INTO

In all data models, the default behavior of `INSERT INTO` when given partial columns is to write the entire row. To prevent misuse, in the Merge-on-Write implementation, `INSERT INTO` maintains the semantics of whole row UPSERT by default. To enable partial column updates, set the following session variable:

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending Shipment');
```

Note that the session variable `enable_insert_strict` defaults to true, enabling strict mode by default. In strict mode, partial column updates do not allow updating non-existent keys. To insert non-existent keys using the insert statement for partial column updates, set `enable_unique_key_partial_update` to true and `enable_insert_strict` to false.

#### Flink Connector

If using Flink Connector, add the following configuration:

```sql
'sink.properties.partial_columns' = 'true',
```

Specify the columns to be loaded in `sink.properties.column` (must include all key columns).

### Update Result

The result after the update is as follows:

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | Pending Shipment |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

### Usage Notes

Since the Merge-on-Write implementation needs to complete the entire row of data during writing to ensure optimal query performance, using it for partial column updates may decrease partial load performance.

Performance optimization suggestions:

- Use SSDs equipped with NVMe or high-speed SSD cloud disks, as completing data will read a large amount of historical data, generating high read IOPS and throughput.
- Enabling row storage can reduce the IOPS generated when completing data, significantly improving load performance. Enable row storage by setting the following property when creating a table:

```Plain
"store_row_column" = "true"
```

Currently, all rows in the same batch data writing task (whether a load task or `INSERT INTO`) can only update the same columns. To update data with different columns, write in different batches.

### Flexible Partial Column Updates

Previously, Doris's partial update feature required that every row in an import update the same columns. Now, Doris supports a more flexible partial update method that allows each row in a single import to update different columns (supported since 3.1.0).

:::caution Note:

1. Currently, only the Stream Load import method and tools using Stream Load (e.g. Doris-Flink-Connector) support this feature.
2. The import file must be in JSON format when using flexible column updates.
:::

#### Applicable Scenarios

When using CDC to synchronize data from a database system to Doris in real-time, the records output by the source system may not contain complete row data, but only the values of the primary keys and the updated columns. In such cases, the columns updated in a batch of data within a time window may differ. Flexible column updates can be used to import data into Doris.

#### Usage

**Enabling Flexible Column Updates for Existing Tables**

For existing Merge-On-Write tables created in old versions of Doris, after upgrading, you can enable flexible partial updates using the command: `ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";`. After executing this command, if the result of `show create table db1.tbl1` includes `"enable_unique_key_skip_bitmap_column" = "true"`, the feature has been successfully enabled. Ensure that the target table has the light-schema-change feature enabled beforehand.

**Using Flexible Column Updates for New Tables**

For new tables, to use the flexible column update feature, specify the following table properties when creating the table to enable Merge-on-Write and include the required hidden bitmap column for flexible column updates:

```Plain
"enable_unique_key_merge_on_write" = "true"
"enable_unique_key_skip_bitmap_column" = "true"
```

**StreamLoad**

When using Stream Load, add the following header:

```Plain
unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS
```

**Flink Doris Connector**

If using the Flink Doris Connector, add the following configuration:

```Plain
'sink.properties.unique_key_update_mode' = 'UPDATE_FLEXIBLE_COLUMNS'
```

#### Example

Assuming the following table:

```sql
CREATE TABLE t1 (
  `k` int(11) NULL, 
  `v1` BIGINT NULL,
  `v2` BIGINT NULL DEFAULT "9876",
  `v3` BIGINT NOT NULL,
  `v4` BIGINT NOT NULL DEFAULT "1234",
  `v5` BIGINT NULL
) UNIQUE KEY(`k`) DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES(
"replication_num" = "3",
"enable_unique_key_merge_on_write" = "true",
"enable_unique_key_skip_bitmap_column" = "true");
```

The original data in the table is:

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

Now, updating some fields using flexible column updates:

```shell
$ cat test1.json
```
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
```shell
curl --location-trusted -u root: \
-H "strict_mode:false" \
-H "format:json" \
-H "read_json_by_line:true" \
-H "unique_key_update_mode:UPDATE_FLEXIBLE_COLUMNS" \
-T test1.json \
-XPUT http://<host>:<http_port>/api/d1/t1/_stream_load
```

After the update, the data in the table is:

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

#### Limitations and Considerations

1. Similar to previous partial updates, flexible column updates require that each row of imported data include all key columns. Rows not meeting this requirement will be filtered out and counted in filter rows. If the number of filtered rows exceeds the `max_filter_ratio` threshold for this import, the entire import will fail, and filtered data will generate an error log.

2. In flexible partial update loads, key-value pairs in each JSON object are only valid if the key matches a column name in the target table. Key-value pairs that do not meet this requirement will be ignored. Pairs with keys `__DORIS_VERSION_COL__`, `__DORIS_ROW_STORE_COL__`, or `__DORIS_SKIP_BITMAP_COL__` will also be ignored.

3. Flexible partial updates are not supported on tables with Variant columns.

4. Flexible partial updates are not supported on tables with synchronous materialized views.

5. When using flexible partial updates, the following import parameters cannot be specified or enabled:
    - The `merge_type` parameter cannot be specified.
    - The `delete` parameter cannot be specified.
    - The `fuzzy_parse` parameter cannot be enabled.
    - The `columns` parameter cannot be specified.
    - The `jsonpaths` parameter cannot be specified.
    - The `hidden_columns` parameter cannot be specified.
    - The `function_column.sequence_col` parameter cannot be specified.
    - The `sql` parameter cannot be specified.
    - The `memtable_on_sink_node` option cannot be enabled.
    - The `group_commit` parameter cannot be specified.
    - The `where` parameter cannot be specified.

### Handling New Rows in Partial Column Updates

The session variable or import property `partial_update_new_key_behavior` controls the behavior when inserting new rows during partial column updates.

When `partial_update_new_key_behavior=ERROR`, each inserted row must have a key that already exists in the table. When `partial_update_new_key_behavior=APPEND`, partial column updates can update existing rows with matching keys or insert new rows with keys that do not exist in the table.

For example, consider the following table structure:
```sql
CREATE TABLE user_profile
(
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

Suppose the table contains the following data:
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     400 | 2023-07-01 12:00:00|
+------+-------+------+----------+---------+---------------------+
```

If you use `Insert Into` for partial column updates with `partial_update_new_key_behavior=ERROR`, and try to insert the following data, the operation will fail because the keys `(3)` and `(18)` do not exist in the original table:
```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=ERROR;
INSERT INTO user_profile (id, balance, last_access_time) VALUES
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
(1105, "errCode = 2, detailMessage = (127.0.0.1)[INTERNAL_ERROR]tablet error: [E-7003]Can't append new rows in partial update when partial_update_new_key_behavior is ERROR. Row with key=[3] is not in table., host: 127.0.0.1")
```

If you use `partial_update_new_key_behavior=APPEND` and perform the same partial column update:
```sql
SET enable_unique_key_partial_update=true;
SET partial_update_new_key_behavior=APPEND;
INSERT INTO user_profile (id, balance, last_access_time) VALUES 
(1, 500, '2023-07-03 12:00:01'),
(3, 23, '2023-07-03 12:00:02'),
(18, 9999999, '2023-07-03 12:00:03');
```

The existing row will be updated, and two new rows will be inserted. For columns not specified in the inserted data, if a default value is defined, the default will be used; if the column is nullable, NULL will be used; otherwise, the insert will fail.

The query result will be:
```sql
mysql> select * from user_profile;
+------+-------+------+----------+---------+---------------------+
| id   | name  | age  | city     | balance | last_access_time    |
+------+-------+------+----------+---------+---------------------+
|    1 | kevin |   18 | shenzhen |     500 | 2023-07-03 12:00:01 |
|    3 | NULL  | NULL | NULL     |      23 | 2023-07-03 12:00:02 |
|   18 | NULL  | NULL | NULL     | 9999999 | 2023-07-03 12:00:03 |
+------+-------+------+----------+---------+---------------------+
```

## Partial Column Update for Aggregate Key Model

The Aggregate table is mainly used in pre-aggregation scenarios rather than data update scenarios, but partial column updates can be achieved by setting the aggregation function to REPLACE_IF_NOT_NULL.

### Create Table

Set the aggregation function of the fields that need to be updated to `REPLACE_IF_NOT_NULL`.

```sql
CREATE TABLE order_tbl (
  order_id int(11) NULL,
  order_amount int(11) REPLACE_IF_NOT_NULL NULL,
  order_status varchar(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

### Data Insertion

Whether it is Stream Load, Broker Load, Routine Load, or `INSERT INTO`, directly write the data of the fields to be updated.

### Example

Similar to the previous examples, the corresponding Stream Load command is (no additional header required):

```shell
$ cat update.csv

1,To be shipped

curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T ./update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

The corresponding `INSERT INTO` statement is (no additional session variable settings required):

```sql
INSERT INTO order_tbl (order_id, order_status) values (1,'Shipped');
```

### Notes on Partial Column Updates

The Aggregate Key model does not perform any additional processing during the write process, so the write performance is not affected and is the same as normal data load. However, the cost of aggregation during query is relatively high, and the typical aggregation query performance is 5-10 times lower than the Merge-on-Write implementation of the Unique Key model.

Since the `REPLACE_IF_NOT_NULL` aggregation function only takes effect when the value is not NULL, users cannot change a field value to NULL.

