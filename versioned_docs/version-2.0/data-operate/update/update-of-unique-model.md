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

In the future, flexible column updates will be supported, allowing users to update different columns for each row within the same batch load.
