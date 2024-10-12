---
{
    "title": "Sync-Materialized View",
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

## What is a Synchronous Materialized View

A synchronous materialized view is a special type of table in Doris that stores pre-computed data sets based on defined SELECT statements. Doris automatically maintains the data in synchronous materialized views, ensuring that any new imports or deletions in the base table are reflected in the materialized view in real-time, maintaining data consistency without requiring any additional manual maintenance. When querying, Doris automatically selects the optimal materialized view and retrieves data directly from it.

## Applicable Scenarios

- Accelerating time-consuming aggregation operations

- Queries requiring prefix index matching

- Reducing the amount of data scanned by pre-filtering

- Speeding up queries by pre-computing complex expressions

## Limitations

- Synchronous materialized views only support SELECT statements for a single table, including WHERE, GROUP BY, and ORDER BY clauses, but not JOIN, HAVING, LIMIT clauses, LATERAL VIEW.

- Unlike asynchronous materialized views, synchronous materialized views cannot be queried directly.

- The SELECT list cannot include auto-increment columns, constants, duplicate expressions, or window functions.

- If the SELECT list contains aggregation functions, these must be root expressions (e.g., `sum(a + 1)` is supported, but `sum(a) + 1` is not), and no non-aggregation function expressions can follow the aggregation function (e.g., `SELECT x, sum(a)` is allowed, but `SELECT sum(a), x` is not).

- If the condition column for a DELETE statement exists in the materialized view, the DELETE operation cannot proceed. If data deletion is necessary, the materialized view must be dropped first.

- Excessive materialized views on a single table can impact import efficiency: When importing data, both the materialized views and the base table are updated synchronously. Excessive materialized views on a table can slow down imports, similar to importing data into multiple tables simultaneously.

- Materialized views on Unique Key data models can only reorder columns and do not support aggregation. Therefore, coarse-grained aggregation operations cannot be performed through materialized views on Unique Key models.

## Using Materialized Views

Doris provides a comprehensive set of DDL syntax for materialized views, including creation, viewing, and deletion. Below is an example demonstrating how to use materialized views to accelerate aggregation calculations. Suppose a user has a sales record detail table that stores transaction IDs, salespersons, stores, sale dates, and amounts. The table creation and data insertion statements are as follows:

```sql
-- Create a test_db  
create database test_db;  
use test_db;  
  
-- Create table  
create table sales_records  
(  
    record_id int,   
    seller_id int,   
    store_id int,   
    sale_date date,   
    sale_amt bigint  
)   
distributed by hash(record_id)   
properties("replication_num" = "1");  
  
-- Insert data  
insert into sales_records values(1,1,1,'2020-02-02',1);
```

### Creating a Materialized View

If users frequently need to analyze sales volumes by different stores, they can create a materialized view for the `sales_records` table, grouped by store ID and summing sales amounts for each store. The creation statement is as follows:

```sql
create materialized view store_amt as   
select store_id, sum(sale_amt) from sales_records group by store_id;
```

### Checking if the Materialized View is Created

Since creating a materialized view is an asynchronous operation, users need to check the status of the materialized view creation task asynchronously after submitting it. The command is as follows:

```sql
show alter table materialized view from test_db;
```

The output will show all materialized view creation tasks for that database. A sample output is:

```sql
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| JobId  | TableName     | CreateTime          | FinishTime          | BaseIndexName | RollupIndexName | RollupId | TransactionId | State    | Msg  | Progress | Timeout |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+  
| 494349 | sales_records | 2020-07-30 20:04:56 | 2020-07-30 20:04:57 | sales_records | store_amt       | 494350   | 133107        | FINISHED |      | NULL     | 2592000 |  
+--------+---------------+---------------------+---------------------+---------------+-----------------+----------+---------------+----------+------+----------+---------+
```

The `State` column indicates the status. When the state changes to `FINISHED`, the materialized view is successfully created.

### Canceling Materialized View Creation

If the background asynchronous task for creating the materialized view has not yet completed, it can be canceled with the following command:

```sql
cancel alter table materialized view from test_db.sales_records;
```

If the materialized view has already been created, it cannot be canceled, but it can be deleted using the DROP command.

### Viewing the Materialized View Structure

The structure of all materialized views created on a target table can be viewed using the following command:

```sql
desc sales_records all;
```

### Viewing the Creation Statement of a Materialized View

The creation statement for a materialized view can be viewed with the following command:

```sql
show create materialized view store_amt on sales_records;
```

### Querying a Materialized View

Once a materialized view is created, Doris automatically retrieves pre-aggregated data from the materialized view when querying by store ID, improving query efficiency. Users can still query the `sales_records` table, e.g.,:

```sql
select store_id, sum(sale_amt) from sales_records group by store_id;
```

This query will automatically match the `store_amt` materialized view. Users can verify this with the `explain` command:

```sql
explain select store_id, sum(sale_amt) from sales_records group by store_id;
```

### Dropping a Materialized View

```sql
drop materialized view store_amt on sales_records;
```

## Usage Examples

Below are additional examples demonstrating the use of materialized views.

### Example 1: Accelerating Aggregation Queries

Business Scenario: Calculating ad UV (Unique Visitors) and PV (Page Views).

Assuming the raw ad click data is stored in Doris, creating a materialized view with `bitmap_union` can speed up queries for ad PV and UV. First, create a table to store ad click details:

```sql
create table advertiser_view_record  
(  
    click_time datetime,   
    advertiser varchar(10),   
    channel varchar(10),   
    user_id int  
) distributed by hash(user_id) properties("replication_num" = "1");  
insert into advertiser_view_record values("2020-02-02 02:02:02",'a','a',1);
```

To calculate ad UV, a materialized view can be created to pre-aggregate unique `user_id`s by advertiser and channel:

```sql
create materialized view advertiser_uv as   
select   
    advertiser,   
    channel,   
    bitmap_union(to_bitmap(user_id))   
from   
    advertiser_view_record   
group by   
    advertiser, channel;
```

When querying ad UV, Doris will automatically retrieve data from the `advertiser_uv` materialized view, converting the original `count(distinct user_id)` to `bitmap_union_count(to_bitmap(user_id))`.

### Example 2: Matching Different Prefix Indexes

Business Scenario: Matching prefix indexes.

If a table has prefix indexes on k1 and k2, but queries sometimes involve k3, a materialized view can be created with k3 as the first column to leverage indexing:

```sql
create table test_table  
(  
    k1 int,   
    k2 int,   
    k3 int,   
    kx date  
)   
distributed by hash(k1)   
properties("replication_num" = "1");  
  
insert into test_table values(1,1,1,1);  
  
create materialized view mv_1 as SELECT k3, k2, k1 FROM test_table;
```

Queries with `WHERE k3 = 3` will match the materialized view, as verified by `explain`.

### Example 3: Pre-filtering and Expression Computation to Accelerate Queries

Business Scenario: Pre-filtering data or accelerating expression computation.

Create a table and materialized views for pre-filtering and expression computation:

```sql
create table d_table (  
   k1 int null,  
   k2 int not null,  
   k3 bigint null,  
   k4 date null  
)  
duplicate key (k1,k2,k3)  
distributed BY hash(k1) buckets 3  
properties("replication_num" = "1");  
  
-- Insert data...  
  
-- Pre-compute expressions  
create materialized view mv1 as   
select   
    abs(k1)+k2+1,          
    sum(abs(k2+2)+k3+3)   
from   
    d_table   
group by   
    abs(k1)+k2+1;  
  
-- Pre-filter data  
create materialized view mv2 as   
select   
    year(k4),  
    month(k4)   
from   
    d_table   
where   
    year(k4) = 2020;
```

## FAQ

If materialized views do not match queries as expected, check if the materialized view is still being built using:

```sql
show alter table materialized view from test_db;
```

Wait until the status changes to `FINISHED` before expecting materialized views to be available.