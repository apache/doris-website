---
{
    "title": "Hive HLL UDF",
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

# Hive HLL UDF

 The Hive HLL UDF provides a set of UDFs for generating HLL operations in Hive tables, which are identical to Doris HLL. Hive HLL can be imported into Doris through Spark HLL Load. For more information about HLL, please refer to Using HLL for Approximate Deduplication.:[Approximate Deduplication Using HLL](https://doris.apache.org/docs/query-acceleration/distinct-counts/using-hll/)

 Function Introduction:
  1. UDAF
 
    · to_hll: An aggregate function that returns a Doris HLL column, similar to the to_bitmap function
 
    · hll_union：An aggregate function that calculates the union of groups, returning a Doris HLL column, similar to the bitmap_union function

  2. UDF

    · hll_cardinality: Returns the number of distinct elements added to the HLL, similar to the bitmap_count function

 Main Purpose:
  1. Reduce data import time to Doris by eliminating the need for dictionary construction and HLL pre-aggregation
  2. Save Hive storage by compressing data using HLL, significantly reducing storage costs compared to Bitmap statistics
  3. Provide flexible HLL operations in Hive, including union and cardinality statistics, and allow the resulting HLL to be directly imported into Doris
 
 Note:
 HLL statistics are approximate calculations with an error rate of around 1% to 2%.


## Usage

### Create a Hive table and insert test data

```sql
-- Create a test database, e.g., hive_test
use hive_test;

-- Create a Hive HLL table
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
  `k1`   int       COMMENT '',
  `k2`   String    COMMENT '',
  `k3`   String    COMMENT '',
  `uuid` binary    COMMENT 'hll'
) comment  'comment'

-- Create a normal Hive table and insert test data
CREATE TABLE IF NOT EXISTS `hive_table`(
    `k1`   int       COMMENT '',
    `k2`   String    COMMENT '',
    `k3`   String    COMMENT '',
    `uuid` int       COMMENT ''
) comment  'comment'

insert into hive_table select 1, 'a', 'b', 12345;
insert into hive_table select 1, 'a', 'c', 12345;
insert into hive_table select 2, 'b', 'c', 23456;
insert into hive_table select 3, 'c', 'd', 34567;
```

### Use Hive HLL UDF:

Hive HLL UDF needs to be used in Hive/Spark. First, compile the FE to obtain the hive-udf.jar file.
Compilation preparation: If you have compiled the ldb source code, you can directly compile the FE. If not, you need to manually install thrift, refer to [Setting Up Dec Env for FE - IntelliJ IDEA](https://doris.apache.org/community/developer-guide/fe-idea-dev/) for compilation and installation.

```sql
-- Clone the Doris source code
git clone https://github.com/apache/doris.git
cd doris
git submodule update --init --recursive

-- Install thrift (skip if already installed)
-- Enter the FE directory
cd fe

-- Execute the Maven packaging command (all FE submodules will be packaged)
mvn package -Dmaven.test.skip=true
-- Or package only the hive-udf module
mvn package -pl hive-udf -am -Dmaven.test.skip=true

-- The packaged hive-udf.jar file will be generated in the target directory
-- Upload the compiled hive-udf.jar file to HDFS, e.g., to the root directory
hdfs dfs -put hive-udf/target/hive-udf.jar /

```

Then, enter Hive and execute the following SQL statements:

```sql
-- Load the hive hll udf jar package, modify the hostname and port according to your actual situation
add jar hdfs://hostname:port/hive-udf.jar;

-- Create UDAF functions
create temporary function to_hll as 'org.apache.doris.udf.ToHllUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';
create temporary function hll_union as 'org.apache.doris.udf.HllUnionUDAF' USING JAR 'hdfs://hostname:port/hive-udf.jar';


-- Create UDF functions
create temporary function hll_cardinality as 'org.apache.doris.udf.HllCardinalityUDF' USING JAR 'hdfs://node:9000/hive-udf.jar';


-- Example: Use the to_hll UDAF to aggregate and generate HLL, and write it to the Hive HLL table
insert into hive_hll_table
select 
    k1,
    k2,
    k3,
    to_hll(uuid) as uuid
from 
    hive_table
group by 
    k1,
    k2,
    k3

-- Example: Use hll_cardinality to calculate the number of elements in the HLL
select k1, k2, k3, hll_cardinality(uuid) from hive_hll_table;
+-----+-----+-----+------+
| k1  | k2  | k3  | _c3  |
+-----+-----+-----+------+
| 1   | a   | b   | 1    |
| 1   | a   | c   | 1    |
| 2   | b   | c   | 1    |
| 3   | c   | d   | 1    |
+-----+-----+-----+------+

-- Example: Use hll_union to calculate the union of groups, returning 3 rows
select k1, hll_union(uuid) from hive_hll_table group by k1;

-- Example: Also can merge and then continue to statistics
select k3, hll_cardinality(hll_union(uuid)) from hive_hll_table group by k3;
+-----+------+
| k3  | _c1  |
+-----+------+
| b   | 1    |
| c   | 2    |
| d   | 1    |
+-----+------+
```

###  Hive HLL UDF Explanation

## Importing Hive HLL to Doris

### Method 1: Catalog (Recommended)

Create Hive table specified as TEXT format. For Binary type, Hive will save it as a base64 encoded string. At this time, you can use the Hive Catalog to directly import the HLL data into Doris using the [hll_from_base64](../sql-manual/sql-functions/hll-functions/hll-from-base64.md) function.

Here is a complete example:

1. Create a Hive table

```sql
CREATE TABLE IF NOT EXISTS `hive_hll_table`(
`k1`   int       COMMENT '',
`k2`   String    COMMENT '',
`k3`   String    COMMENT '',
`uuid` binary    COMMENT 'hll'
) stored as textfile

-- then reuse the previous steps to insert data from a normal table into it using the to_hll function
```

2. [Create a Doris catalog](../lakehouse/datalake-analytics/hive.md)

```sql
CREATE CATALOG hive PROPERTIES (
    'type'='hms',
    'hive.metastore.uris' = 'thrift://127.0.0.1:9083'
);
```

3. Create a Doris internal table

```sql
CREATE TABLE IF NOT EXISTS `doris_test`.`doris_hll_table`(
    `k1`   int                   COMMENT '',
    `k2`   varchar(10)           COMMENT '',
    `k3`   varchar(10)           COMMENT '',
    `uuid` HLL  HLL_UNION  COMMENT 'hll'
)
AGGREGATE KEY(k1, k2, k3)
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);
```

4. Import data from Hive to Doris

```sql
insert into doris_hll_table select k1, k2, k3, hll_from_base64(uuid) from hive.hive_test.hive_hll_table;

-- View the imported data, combining hll_to_base64 for decoding
select *, hll_to_base64(uuid) from doris_hll_table;
+------+------+------+------+---------------------+
| k1   | k2   | k3   | uuid | hll_to_base64(uuid) |
+------+------+------+------+---------------------+
|    1 | a    | b    | NULL | AQFw+a9MhpKhoQ==    |
|    1 | a    | c    | NULL | AQFw+a9MhpKhoQ==    |
|    2 | b    | c    | NULL | AQGyB7kbWBxh+A==    |
|    3 | c    | d    | NULL | AQFYbJB5VpNBhg==    |
+------+------+------+------+---------------------+

-- Also can use Doris's native HLL functions for statistics, and see that the results are consistent with the previous statistics in Hive
select k3, hll_cardinality(hll_union(uuid)) from doris_hll_table group by k3;
+------+----------------------------------+
| k3   | hll_cardinality(hll_union(uuid)) |
+------+----------------------------------+
| b    |                                1 |
| d    |                                1 |
| c    |                                2 |
+------+----------------------------------+

-- At this time, querying the external table data, i.e., the data before import, can also verify the correctness of the data
select k3, hll_cardinality(hll_union(hll_from_base64(uuid))) from hive.hive_test.hive_hll_table group by k3;
+------+---------------------------------------------------+
| k3   | hll_cardinality(hll_union(hll_from_base64(uuid))) |
+------+---------------------------------------------------+
| d    |                                                 1 |
| b    |                                                 1 |
| c    |                                                 2 |
+------+---------------------------------------------------+
```

### Method 2: Spark Load

 See details: [Spark Load](https://doris.apache.org/zh-CN/docs/1.2/data-operate/import/import-way/spark-load-manual) -> Basic operation -> Creating Load (Example 3: when the upstream data source is hive binary type table)
