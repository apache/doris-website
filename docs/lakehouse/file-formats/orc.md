---
{
    "title": "ORC",
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

This document introduces the support for reading and writing ORC file formats in Doris. It applies to the following functionalities:

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
* lzo
* zlib

## parameter

### session variable

* `enable_orc_lazy_mat` (2.1+, 3.0+)

Controls whether to use lazy materialization technology in orc reader. The default value is true.

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

When Doris reads the Orc data type of the Hive table, it will find the column with the same name from the Orc file according to the column name of the Hive table by default to read the data. When this variable is `false`, Doris will read data from the Parquet file according to the column order in the Hive table, regardless of the column name. Similar to the `orc.force.positional.evolution` variable in Hive. This parameter only applies to the top-level column name and is invalid inside the Struct.

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+) 

In an orc file, if the byte size of a stripe is less than `orc_tiny_stripe_threshold`, we consider the stripe to be a tiny stripe. For multiple consecutive tiny stripes, we will perform read optimization, that is, read multiple tiny stripes at a time. If you do not want to use this optimization, you can set this value to 0. The default is 8M.

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+) 

When using tiny stripe read optimization, multiple tiny stripes will be merged into one IO. This parameter is used to control the maximum byte size of each IO request. You should not set the value less than `orc_tiny_stripe_threshold`. The default is 8M.    

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+) 

When using tiny stripe read optimization, since the two tiny stripes to be read are not necessarily continuous, when the distance between two tiny stripes is greater than this parameter, we will not merge them into one IO. The default is 1M.

* `check_orc_init_sargs_success` (dev)

Check if orc predicate pushdown succeeded, for debugging purposes. Defaults to false.

* `orc_tiny_stripe_amplification_factor` (dev)

In the tiny stripe optimization, if there are many columns in the orc file and only a few of them are used in the query, the tiny stripe optimization will cause serious read amplification. When the proportion of the number of bytes actually read to the entire stripe is greater than this parameter, the tiny stripe read optimization will be used. The default value of this parameter is 0.4 and the minimum value is 0.


### be.conf

* `orc_natural_read_size_mb` (2.1+, 3.0+)

The maximum size in bytes that Orc Reader can read at one time.