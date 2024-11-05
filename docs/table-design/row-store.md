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

# Hybrid Storage

Doris defaults to columnar storage, where each column is stored contiguously. Columnar storage offers excellent performance for analytical scenarios (such as aggregation, filtering, sorting, etc.), as it only reads the necessary columns, reducing unnecessary IO. However, in point query scenarios (such as `SELECT *`), all columns need to be read, requiring an IO operation for each column, which can lead to IOPS becoming a bottleneck, especially for wide tables with many columns (e.g., hundreds of columns).

To address the IOPS bottleneck in point query scenarios, starting from version 2.0.0, Doris supports hybrid storage. When users create tables, they can specify whether to enable row storage. With row storage enabled, each row only requires one IO operation for point queries (such as `SELECT *`), significantly improving performance.

## Syntax

When creating a table, specify whether to enable row storage, which columns to enable row storage for, and the storage compression unit size page_size in the table's PROPERTIES.

1. Whether to enable row storage: defaults to false (not enabled).
``` 
"store_row_column" = "true"
```

2. Which columns to enable row storage for:if `"store_row_column" = "true"`, all columns are enabled by default. If you need to specify that only some columns are enabled for row storage, set the row_store_columns parameter, formatted as a comma-separated list of column names.
``` 
"row_store_columns" = "column1,column2,column3"
```

3. Row storage page_size: defaults to 16KB.
``` 
"row_store_page_size" = "16384"
```

The page is the smallest unit of storage read/write operations, and page_size is the size of the row storage page. This means that reading one row also requires generating an IO for a page. The larger the value, the better the compression effect and the lower the storage space usage, but the higher the IO overhead for point queries (since one IO reads at least one page), and vice versa. The smaller the value, the higher the storage space, the better the point query performance. The default value of 16KB is a balanced choice in most cases. If you prefer query performance, you can configure a smaller value such as 4KB or even lower. If you prefer storage space, you can configure a larger value such as 64KB or even higher.

## Example

The example below creates an 8-column table, where "key,v1,v3,v5,v7" are the 5 columns enabled for row storage. To optimize for high-concurrency point query performance, the page_size is configured to 4KB.

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
     "row_store_columns" = "key,v1,v3,v5,v7",
     "row_store_page_size" = "4096"
);
```

For more information on point query usage, please refer to [High-Concurrent Point Query](../query-acceleration/high-concurrent-point-query).
