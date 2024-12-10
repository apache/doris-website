---
{
    "title": "Updating Data on Aggregate Key Model",
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



This guide is about ingestion-based data updates for the Aggregate Key model in Doris.

## Update all columns

When importing data into an Aggregate Key model in Doris by methods like Stream Load, Broker Load, Routine Load, and Insert Into, the new values are combined with the old values to produce new aggregated values based on the column's aggregation function. These values might be generated during insertion or produced asynchronously during compaction. However, when querying, users will always receive the same returned values.

## Partial column update for Aggregate Key model

Tables in the Aggregate Key model are primarily used in cases with pre-aggregation requirements rather than data updates, but Doris allows partial column updates for them, too. Simply set the aggregation function to `REPLACE_IF_NOT_NULL`.

**Create table**

For the columns that need to be updated, set the aggregation function to `REPLACE_IF_NOT_NULL`.

```Plain
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
+----------+--------------+-----------------+
| order_id | order_amount | order_status    |
+----------+--------------+-----------------+
| 1        |          100 | Pending Payment |
+----------+--------------+-----------------+
1 row in set (0.01 sec)
```

**Ingest data**

For Stream Load, Broker Load, Routine Load, or INSERT INTO, you can directly write the updates to the fields.

**Example**

Using the same example as above, the corresponding Stream Load command would be (no additional headers required):

```shell
$ cat update.csv

1,To be shipped

$ curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T /tmp/update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```

The corresponding `INSERT INTO` statement would be (no additional session variables required):

```Plain
INSERT INTO order_tbl (order_id, order_status) values (1,'Delivery Pending');
```

## Note

The Aggregate Key model does not perform additional data processing during data writing, so the writing performance in this model is the same as other models. However, aggregation during queries can result in performance loss. Typical aggregation queries can be 5~10 times slower than queries on Merge-on-Write tables in the Unique Key model.

Under this circumstance, users cannot set a field from non-NULL to NULL, because NULL values written will be automatically neglected by the REPLACE_IF_NOT_NULL aggregation function.
