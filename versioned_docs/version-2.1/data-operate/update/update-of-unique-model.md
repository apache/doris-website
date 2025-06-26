---
{
    "title": "Updating Data on Unique Key Model",
    "language": "en"
}
---

This document introduces how to update data in the Doris unique key model using various load methods.

## Whole Row Update

When loading data into the unique key model using Doris-supported methods like Stream Load, Broker Load, Routine Load, Insert Into, etc., new data is inserted if there is no existing primary key data row. If there is an existing primary key data row, it is updated. This means the load operation in the Doris unique key model works in an "upsert" mode. The process of updating existing records is the same as loading new records by default, so you can refer to the data load documentation for more details.

## Partial Column Update

Partial column update allows you to update specific fields in a table without modifying all fields. You can use the Update statement to perform this operation, which typically involves reading the entire row, updating the desired fields, and writing it back. This read-write transaction is time-consuming and not suitable for large-scale data writing. Doris provides a feature to directly insert or update partial column data in the unique key model load update, bypassing the need to read the entire row first, thus significantly improving update efficiency.

:::caution Note

1. Version 2.0 only supports partial column updates in the Merge-on-Write implementation of the Unique Key.
2. Starting from version 2.0.2, partial column updates are supported using INSERT INTO.
3. Partial column updates are not supported on tables with synchronized materialized views.
4. Partial column updates are not allowed on tables doing schema change.
:::

### Applicable Scenarios

- Real-time dynamic column updates, requiring frequent updates of specific fields in the table. For example, updating fields related to the latest user behavior in a user tag table for real-time analysis and decision-making in advertising/recommendation systems.
- Merging multiple source tables into one large wide table.
- Data correction.

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

#### Partial Column Update Using Load Methods

**StreamLoad/BrokerLoad/RoutineLoad**

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

**INSERT INTO**

In all data models, the default behavior of `INSERT INTO` when given partial columns is to write the entire row. To prevent misuse, in the Merge-on-Write implementation, `INSERT INTO` maintains the semantics of whole row UPSERT by default. To enable partial column updates, set the following session variable:

```sql
SET enable_unique_key_partial_update=true;
INSERT INTO order_tbl (order_id, order_status) VALUES (1, 'Pending Shipment');
```

Note that the session variable `enable_insert_strict` defaults to true, enabling strict mode by default. In strict mode, partial column updates do not allow updating non-existent keys. To insert non-existent keys using the insert statement for partial column updates, set `enable_unique_key_partial_update` to true and `enable_insert_strict` to false.

**Flink Connector**

If using Flink Connector, add the following configuration:

```sql
'sink.properties.partial_columns' = 'true',
```

Specify the columns to be loaded in `sink.properties.column` (must include all key columns).

#### Update Result

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

Future versions will support flexible column updates, allowing users to update different columns for each row in the same batch load.
