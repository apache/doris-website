---
{
    "title": "Updating Data on Aggregate Key Model",
    "language": "en",
    "description": "This document primarily introduces how to update the Doris Aggregate model based on data load."
}
---

This document primarily introduces how to update the Doris Aggregate model based on data load.

## Whole Row Update

When loading data into the Aggregate model table using Doris-supported methods such as Stream Load, Broker Load, Routine Load, Insert Into, etc., the new values will be aggregated with the old values according to the column's aggregation function to produce new aggregated values.  This value may be generated at the time of insertion or during asynchronous compaction, but users will get the same return value when querying.

## Partial Column Update of Aggregate Model

The Aggregate table is mainly used in pre-aggregation scenarios rather than data update scenarios, but partial column updates can be achieved by setting the aggregation function to REPLACE_IF_NOT_NULL.

**Create Table**

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

**Data Insertion**

Whether it is Stream Load, Broker Load, Routine Load, or `INSERT INTO`, directly write the data of the fields to be updated.

**Example**

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

## Notes on Partial Column Updates

The Aggregate Key model does not perform any additional processing during the write process, so the write performance is not affected and is the same as normal data load. However, the cost of aggregation during query is relatively high, and the typical aggregation query performance is 5-10 times lower than the Merge-on-Write implementation of the Unique Key model.

Since the `REPLACE_IF_NOT_NULL` aggregation function only takes effect when the value is not NULL, users cannot change a field value to NULL.
