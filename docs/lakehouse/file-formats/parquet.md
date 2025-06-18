---
{
    "title": "Parquet",
    "language": "zh-CN"
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

This document introduces the support for reading and writing Parquet file formats in Doris. It applies to the following features:

* Reading and writing data in the Catalog.
* Reading data using Table Valued Functions.
* Reading data with Broker Load.
* Writing data during Export.
* Writing data with Outfile.

## Supported Compression Formats

* uncompressed
* snappy
* lz4
* zstd
* gzip
* lzo
* brotli

## parameter

### session variable

* `enable_parquet_lazy_mat` (2.1+, 3.0+)

Controls whether to use lazy materialization technology in parquet reader. The default value is true.

* `hive_parquet_use_column_names` (2.1.6+, 3.0.3+)

When Doris reads the Parquet data type of the Hive table, it will find the column with the same name from the Parquet file to read the data according to the column name of the Hive table by default. When this variable is `false`, Doris will read data from the Parquet file according to the column order in the Hive table, regardless of the column name. Similar to the `parquet.column.index.access` variable in Hive. This parameter only applies to the top-level column name and is invalid inside the Struct. 

### be.conf

* `enable_parquet_page_index` (2.1.5+, 3.0+)

Whether the Parquet Reader uses page index to filter data. This is only for debug purpose, in case sometimes the page index filters wrong data. The default value is false.

* `parquet_header_max_size_mb` (2.1+, 3.0+)

The maximum buffer size allocated when reading the Parquet Page header. The default value is 1M.

* `parquet_rowgroup_max_buffer_mb` (2.1+, 3.0+)

The maximum buffer size allocated when reading Parquet Row Group. The default value is 128M.

* `parquet_column_max_buffer_mb` (2.1+, 3.0+)

The maximum buffer size allocated when reading columns in a Parquet Row Group. The default value is 8M.

