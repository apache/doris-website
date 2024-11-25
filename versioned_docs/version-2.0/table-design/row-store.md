---
{
    "title": "Hybrid Storage",
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

## Hybrid Storage

Doris defaults to columnar storage, where each column is stored contiguously. Columnar storage offers excellent performance for analytical scenarios (such as aggregation, filtering, sorting, etc.), as it only reads the necessary columns, reducing unnecessary IO. However, in point query scenarios (such as `SELECT *`), all columns need to be read, requiring an IO operation for each column, which can lead to IOPS becoming a bottleneck, especially for wide tables with many columns (e.g., hundreds of columns).

To address the IOPS bottleneck in point query scenarios, starting from version 2.0.0, Doris supports hybrid storage. When users create tables, they can specify whether to enable row storage. With row storage enabled, each row only requires one IO operation for point queries (such as `SELECT *`), significantly improving performance.

The principle of row storage is that an additional column is added during storage. This column concatenates all the columns of the corresponding row and stores them using a special binary format.

## Syntax

When creating a table, specify whether to enable row storage in the table's PROPERTIES.
``` 
"store_row_column" = "true"
```

## Example

The example below creates an 8-column table with row storage enabled.

``` 
CREATE TABLE `tbl_point_query` (
     `key` int(11) NULL,
     `v1` decimal(27, 9) NULL,
     `v2` varchar(30) NULL,
     `v3` varchar(30) NULL,
     `v4` date NULL,
     `v5` datetime NULL,
     `v6` float NULL,
     `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`key`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`key`) BUCKETS 1
PROPERTIES (
     "enable_unique_key_merge_on_write" = "true",
     "light_schema_change" = "true",
     "store_row_column" = "true"
);
```

Query
```
SELECT * FROM tbl_point_query WHERE key = 100;
```

For more information on point query usage, please refer to [High-Concurrent Point Query](../query-acceleration/high-concurrent-point-query).


## Notice

Enabling row storage will increase the storage space used. The increase in storage space is related to the data characteristics and is generally 2 to 10 times the size of the original table. The exact space usage needs to be tested with actual data.