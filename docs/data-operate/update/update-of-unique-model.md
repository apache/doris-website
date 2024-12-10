---
{
    "title": "Updating Data on Unique Key Model",
    "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

This document primarily introduces the updates based on the load data on the Doris Unique Key model.

## Updates on All Columns

When load data into the primary key model (Unique model) in Doris using supported load methods such as Stream Load, Broker Load, Routine Load, Insert Into, etc., if there are no corresponding data rows with the primary key, new data will be inserted. If there are corresponding data rows with the primary key, the data will be updated. In other words, load data into the Doris primary key model follows an "upsert" mode. Based on the import, updating existing records is by default the same as load a new record. Therefore, you can refer to the data load documentation section for more details.

## Partial Update

Updating partial columns mainly refers to directly updating certain field values in a table instead of updating all field values. This can be done using the Update statement, which typically involves reading the entire row data, updating specific field values, and then writing it back. This read-write transaction is time-consuming and not suitable for writing large amounts of data. In the context of load updates on the primary key model, Doris provides a functionality to directly insert or update partial column data without reading the entire row data, significantly improving the update efficiency.

:::caution
Note:

1. Partial updates are only supported in the Merge-on-Write implementation of the Unique Key starting from version 2.0.
2. Starting from version 2.0.2, partial updates are supported using INSERT INTO.
3. Partial updates are not supported on tables with materialized views.
:::

### Use Cases

- Real-time dynamic column updates that require high-frequency updates on certain fields in the table. For example, in a user tag table, there are fields containing the latest user behavior information that needs real-time updates to enable real-time analysis and decision-making in advertising/recommendation systems.

- Combining multiple source tables into a large denormalized table.

- Data correction.

### Usage

**Table Creation**

When creating the table, the following property needs to be specified to enable the Merge-on-Write implementation:

```Plain
enable_unique_key_merge_on_write = true
```

**StreamLoad/BrokerLoad/RoutineLoad**

If you are using Stream Load/Broker Load/Routine Load, add the following header during the load:

```Plain
partial_columns: true
```

Also, specify the columns to be loaded in the `columns` section (all key columns must be included, otherwise updates won't be possible).

**Flink Connector**

If you are using the Flink Connector, add the following configuration:

```Plain
'sink.properties.partial_columns' = 'true',
```

Also, specify the columns to be loaded in `sink.properties.column` (all key columns must be included, otherwise updates won't be possible).

**INSERT INTO**

In all data models, when using `INSERT INTO` with a subset of columns, the default behavior is to insert the entire row. To enable partial column updates in the Merge-on-Write implementation, the following session variable needs to be set:

```sql
set enable_unique_key_partial_update=true
```

Note that the default value for the session variable `enable_insert_strict`, which controls whether the insert statement operates in strict mode, is true. In strict mode, updating non-existing keys during partial column updates is not allowed. So, if you want to insert non-existing keys during partial column updates using the insert statement, you need to set `enable_unique_key_partial_update` to true and also set `enable_insert_strict` to false.

### Example

Suppose there is an order table named `order_tbl` in Doris, where the order ID is a key column, and the order status and order amount are value columns. The data is as follows:

| Order ID | Order Amount | Order Status |
| -------- | ------------ | ------------ |
| 1        | 100          | Pending      |

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        | 100          | Pending      |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

Now, when a user clicks on payment, the Doris system needs to update the order status of the order with ID '1' to 'To be shipped'.

If you are using Stream Load, you can update as follows:

```sql
$ cat update.csv

1,To be shipped

$ curl --location-trusted -u root: -H "partial_columns:true" -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

If you are using `INSERT INTO`, you can update as following methods:

```sql
set enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) values (1,'To be shipped');
```

The translated version in English:

After the update, the result is as follows:

```sql
+----------+--------------+--------------+
| order_id | order_amount | order_status |
+----------+--------------+--------------+
| 1        |          100 | To be shipped |
+----------+--------------+--------------+
1 row in set (0.01 sec)
```

### Notes

Due to the Merge-on-Write implementation requiring data completion during data writing to ensure optimal query performance, performing partial column updates using the Merge-on-Write implementation may result in a decrease in load performance.

Suggestions for improving load performance:

- Use SSDs equipped with NVMe or high-speed SSD cloud disks. Reading historical data in large quantities during data completion will generate high read IOPS and read throughput.

- Enabling row storage can significantly reduce the IOPS generated during data completion, resulting in noticeable improvements in load performance. Users can enable row storage by using the following property when creating the table:

```Plain
"store_row_column" = "true"
```

Now, all rows in a batch write task (whether it is an load task or `INSERT INTO`) can only update the same columns. If you need to update different columns, you will need to perform separate batch writes.

## Flexible Partial Column Updates

Before version x.x.x, Doris's partial update feature required that every row in an import update the same columns. Starting from version x.x.x, Doris supports a more flexible partial update method that allows each row in a single import to update different columns.

:::caution
Note

1. The flexible partial update feature is supported since version x.x.x.
2. Currently, only the Stream Load import method and tools using Stream Load (e.g. Doris-Flink-Connector) support this feature.
3. The import file must be in JSON format when using flexible column updates.
:::

### Applicable Scenarios

When using CDC to synchronize data from a database system to Doris in real-time, the records output by the source system may not contain complete row data, but only the values of the primary keys and the updated columns. In such cases, the columns updated in a batch of data within a time window may differ. Flexible column updates can be used to import data into Doris.

### Usage

**Enabling Flexible Column Updates for Existing Tables**

For existing Merge-On-Write tables created in old versions of Doris, after upgrading, you can enable flexible partial updates using the command: `ALTER TABLE db1.tbl1 ENABLE FEATURE "UPDATE_FLEXIBLE_COLUMNS";`. After executing this command, if the result of `show create table db1.tbl1` includes `"enable_unique_key_skip_bitmap_column" = "true"`, the feature has been successfully enabled. Ensure that the target table has the light-schema-change feature enabled beforehand.

**Using Flexible Column Updates for New Tables**

For new tables, to use the flexible column update feature, specify the following table properties when creating the table to enable Merge-on-Write, light-schema-change, and include the required hidden bitmap column for flexible column updates:

```Plain
"enable_light_schema_change" = "true"
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

### Example

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
"enable_light_schema_change" = "true",
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

### Limitations and Considerations

1. Similar to previous partial updates, flexible column updates require that each row of imported data include all key columns. Rows not meeting this requirement will be filtered out and counted in filter rows. If the number of filtered rows exceeds the `max_filter_ratio` threshold for this import, the entire import will fail, and filtered data will generate an error log.

2. In flexible partial update loads, key-value pairs in each JSON object are only valid if the key matches a column name in the target table. Key-value pairs that do not meet this requirement will be ignored. Pairs with keys `__DORIS_VERSION_COL__`, `__DORIS_ROW_STORE_COL__`, or `__DORIS_SKIP_BITMAP_COL__` will also be ignored.

3. If the table properties of the target table include `function_column.sequence_type`, the import can specify the value for the `__DORIS_SEQUENCE_COL__` column by including a key-value pair in the JSON object with key `__DORIS_SEQUENCE_COL__`. For rows that do not specify a value for the `__DORIS_SEQUENCE_COL__`, if the key exists in the original table, the value will be filled from the old row; otherwise, it will be set to null.

For example, for the following table:

```sql
CREATE TABLE t2 (
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
"enable_light_schema_change" = "true",
"enable_unique_key_skip_bitmap_column" = "true",
"function_column.sequence_type" = "int");
```

The original data in the table is:

```sql
+---+----+----+----+----+----+----------------------+
| k | v1 | v2 | v3 | v4 | v5 |__DORIS_SEQUENCE_COL__|
+---+----+----+----+----+----+----------------------+
| 0 | 0  | 0  | 0  | 0  | 0  | 0                    |
| 1 | 1  | 1  | 1  | 1  | 10 | 10                   |
| 2 | 2  | 2  | 2  | 2  | 20 | 20                   |
| 3 | 3  | 3  | 3  | 3  | 30 | 30                   |
| 4 | 4  | 4  | 4  | 4  | 40 | 40                   |
| 5 | 5  | 5  | 5  | 5  | 50 | 50                   |
+---+----+----+----+----+----+----------------------+
```

Importing data using flexible partial column updates:

```json
{"k": 1, "v1": 111, "v5": 9, "__DORIS_SEQUENCE_COL__": 9}
{"k": 2, "v2": 222, "v5": 25, "__DORIS_SEQUENCE_COL__": 25}
{"k": 3, "v3": 333}
{"k": 4, "v4": 444, "v5": 50, "v1": 411, "v3": 433, "v2": null, "__DORIS_SEQUENCE_COL__": 50}
{"k": 5, "v5": null, "__DORIS_SEQUENCE_COL__": null}
{"k": 6, "v1": 611, "v3": 633}
{"k": 7, "v3": 733, "v5": 300, "__DORIS_SEQUENCE_COL__": 300}
```

The final data in the table is as follows:

```sql
+---+--------+--------+-----+------+--------+
| k | v1     | v2     | v3  | v4   | v5     |
+---+--------+--------+-----+------+--------+
| 0 | 0      | 0      | 0   | 0    | 0      |
| 1 | 1      | 1      | 1   | 1    | 1      |
| 5 | 5      | 5      | 5   | 5    | 5      |
| 2 | 2      | 222    | 2   | 2    | 25     |
| 3 | 3      | 3      | 333 | 3    | 3      |
| 4 | 411    | <null> | 433 | 444  | 50     |
| 6 | 611    | 9876   | 633 | 1234 | <null> |
| 7 | <null> | 9876   | 733 | 1234 | 300    |
+---+--------+--------+-----+------+--------+
```

4. When the table property `function_column.sequence_col` is set in the target table, the key-value pair in the JSON object for flexible column updates with the key `__DORIS_SEQUENCE_COL__` will be ignored. The value of the `__DORIS_SEQUENCE_COL__` column in a specific row during import will be the same of the final value of the column specified by the table property `function_column.sequence_col` for that row.

For example, for the following table:

```sql
CREATE TABLE t3 (
  `k` int(11) NULL, 
  `v1` BIGINT NULL,
  `v2` BIGINT NULL DEFAULT "9876",
  `v3` BIGINT NOT NULL,
  `v4` BIGINT NOT NULL DEFAULT "1234",
  `v5` BIGINT NULL DEFAULT "31"
) UNIQUE KEY(`k`) DISTRIBUTED BY HASH(`k`) BUCKETS 1
PROPERTIES(
"replication_num" = "3",
"enable_unique_key_merge_on_write" = "true",
"enable_light_schema_change" = "true",
"enable_unique_key_skip_bitmap_column" = "true",
"function_column.sequence_col" = "v5");
```

The original data in the table is as follows:

```sql
+---+----+----+----+----+----+----------------------+
| k | v1 | v2 | v3 | v4 | v5 |__DORIS_SEQUENCE_COL__|
+---+----+----+----+----+----+----------------------+
| 0 | 0  | 0  | 0  | 0  | 0  | 0                    |
| 1 | 1  | 1  | 1  | 1  | 10 | 10                   |
| 2 | 2  | 2  | 2  | 2  | 20 | 20                   |
| 3 | 3  | 3  | 3  | 3  | 30 | 30                   |
| 4 | 4  | 4  | 4  | 4  | 40 | 40                   |
| 5 | 5  | 5  | 5  | 5  | 50 | 50                   |
+---+----+----+----+----+----+----------------------+
```

Using flexible partial updates, the following data is imported:

```json
{"k": 1, "v1": 111, "v5": 9}
{"k": 2, "v2": 222, "v5": 25}
{"k": 3, "v3": 333}
{"k": 4, "v4": 444, "v5": 50, "v1": 411, "v3": 433, "v2": null}
{"k": 5, "v5": null}
{"k": 6, "v1": 611, "v3": 633}
{"k": 7, "v3": 733, "v5": 300}
```

The final data in the table is as follows:

```sql
+---+--------+--------+-----+------+-----+
| k | v1     | v2     | v3  | v4   | v5  |
+---+--------+--------+-----+------+-----+
| 0 | 0      | 0      | 0   | 0    | 0   |
| 1 | 1      | 1      | 1   | 1    | 10  |
| 5 | 5      | 5      | 5   | 5    | 50  |
| 2 | 2      | 222    | 2   | 2    | 25  |
| 3 | 3      | 3      | 333 | 3    | 30  |
| 4 | 411    | <null> | 433 | 444  | 50  |
| 6 | 611    | 9876   | 633 | 1234 | 31  |
| 7 | <null> | 9876   | 733 | 1234 | 300 |
+---+--------+--------+-----+------+-----+
```

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

6. Flexible partial updates are not supported on tables with Variant columns.

7. Flexible partial updates are not supported on tables with synchronous materialized views.
