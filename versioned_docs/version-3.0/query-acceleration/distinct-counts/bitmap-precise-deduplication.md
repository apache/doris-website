---
{
"title": "BITMAP Precise Deduplication",
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

# BITMAP Precise Deduplication

This document explains how to achieve precise deduplication using the Bitmap type.

Bitmap is an efficient bitmap indexing technique that uses bits to indicate the presence of corresponding data. It is particularly suitable for scenarios requiring efficient set operations (e.g., union, intersection) and is highly memory-efficient. Using Bitmap for precise deduplication offers the following benefits over `COUNT DISTINCT`:

- Improved query speed.
- Reduced memory/disk usage.

------

## Implementation of Count Distinct

Traditional precise deduplication relies on `COUNT DISTINCT`. Consider the following example where deduplication is performed on the `name` column:

| id   | name |
| ---- | ---- |
| 1    | bob  |
| 2    | alex |
| 3    | jack |
| 4    | tom  |
| 5    | bob  |
| 6    | alex |

When Doris executes the query `SELECT COUNT(DISTINCT name) FROM t`, the process involves:

1. Grouping by the `name` column for stage-one deduplication.
2. Shuffling the grouped data.
3. Performing stage-two deduplication and finally counting the distinct names.

The process can be visualized as follows:

```
        Scan                              1st Group By                       2nd Group By                     Count 
  +---------------+                   +------------+                       +------------+                +------------+ 
  | id  | name    |                   |   name     |                       |   name     |                | count(name)| 
  +-----+---------+                   +------------+                       +------------+                +------------+ 
  |  1  |   bob   |  ---------------> |    bob     |                       |    bob     |    ------->    |     4      | 
  |  2  |   alex  |                   |    alex    |                       |    alex    |                +------------+ 
  |  5  |   bob   |                   +------------+                       |    jack    | 
  |  6  |   alex  |                                                        |    tom     | 
  +---------------+                                                        +------------+ 
                                                        ----------------> 
                                           
                                           
  +---------------+                   +------------+ 
  | id  | name    |                   |   name     | 
  +-----+---------+  ---------------> +------------+ 
  |  3  |  jack   |                   |    jack    | 
  |  4  |   tom   |                   |    tom     | 
  +-----+---------+                   +------------+
```

Since `COUNT DISTINCT` requires storing detailed data and performing shuffling, query performance slows down as the dataset grows. Using Bitmap for precise deduplication addresses the performance issues of `COUNT DISTINCT` in large datasets.

------

## Use Cases

In large-scale data scenarios, the cost of deduplication using `COUNT DISTINCT` increases significantly, resulting in slower queries. Bitmap-based precise deduplication addresses these performance bottlenecks by mapping detailed data to bits. While sacrificing the flexibility of raw data, Bitmap greatly enhances computational efficiency. Consider using Bitmap in the following scenarios:

- **Query Acceleration**: Bitmap utilizes bitwise operations for computation, offering excellent performance.
- **Storage Compression**: Bitmap compresses detailed data into bits, significantly reducing resource consumption on disk and in memory.

However, Bitmap can only perform precise deduplication on data types such as `TINYINT`, `SMALLINT`, `INT`, and `BIGINT`. For other data types, a global dictionary must be constructed. Doris implements precise deduplication using `RoaringBitmap`. For more details, refer to [RoaringBitmap](https://roaringbitmap.org/).

------

## Use BITMAP for Precise Deduplication

### Table Creation

1. When using Bitmap for deduplication, set the target column type to `BITMAP` in the table creation statement and specify `BITMAP_UNION` as the aggregate function.
2. Columns of type Bitmap cannot be used as key columns.

Create an aggregate table `test_bitmap`. The `id` column represents the user ID, and the `uv` column is of type `BITMAP`, using the aggregate function `BITMAP_UNION`:

```
CREATE TABLE test_bitmap(
        dt DATE,
        id INT,
        name CHAR(10),
        province CHAR(10),
        os CHAR(10),
        uv BITMAP BITMAP_UNION
)
AGGREGATE KEY (dt, id, name, province, os)
DISTRIBUTED BY HASH(id) BUCKETS 10;
```

------

### Data Import

Here is a sample dataset (`test_bitmap.csv`) that can be imported using Stream Load:

```
2022-05-05,10001,Test 01,Beijing,windows 
2022-05-05,10002,Test 01,Beijing,linux 
2022-05-05,10003,Test 01,Beijing,macos 
2022-05-05,10004,Test 01,Hebei,windows 
2022-05-06,10001,Test 01,Shanghai,windows 
2022-05-06,10002,Test 01,Shanghai,linux 
2022-05-06,10003,Test 01,Jiangsu,macos 
2022-05-06,10004,Test 01,Shaanxi,windows
```

**Stream Load Command**:

```
curl --location-trusted -u root: -H "label:label_test_bitmap_load" \
    -H "column_separator:," \
    -H "columns:dt,id,name,province,os, uv=to_bitmap(id)" -T test_bitmap.csv http://fe_IP:8030/api/demo/test_bitmap/_stream_load
```

------

### Querying Data

Bitmap columns cannot directly return raw values. Instead, use the `BITMAP_UNION_COUNT` aggregate function for queries.

**Total UV Calculation**:

```
SELECT BITMAP_UNION_COUNT(uv) FROM test_bitmap;
+---------------------+
| BITMAP_UNION_COUNT(`uv`) |
+---------------------+
|                   4 |
+---------------------+
```

Equivalent to:

```
SELECT COUNT(DISTINCT id) FROM test_bitmap;
+----------------------+
| COUNT(DISTINCT `id`) |
+----------------------+
|                    4 |
+----------------------+
```

**Daily UV Calculation**:

```
SELECT dt, BITMAP_UNION_COUNT(uv) FROM test_bitmap GROUP BY dt;
+------------+---------------------+
| dt         | BITMAP_UNION_COUNT |
+------------+---------------------+
| 2022-05-05 |                   4 |
| 2022-05-06 |                   4 |
+------------+---------------------+
```
