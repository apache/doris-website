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

## Parameters

### Session Variables

* `enable_orc_lazy_mat` (2.1+, 3.0+)

    Controls whether the ORC Reader enables lazy materialization. Default is true.

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

    When reading ORC data types from Hive tables, Doris will, by default, read data from columns in the ORC file that have the same name as the columns in the Hive table. When this variable is set to `false`, Doris will read data from the ORC file based on the column order in the Hive table, regardless of column names. This is similar to the `orc.force.positional.evolution` variable in Hive. This parameter only applies to top-level column names and is ineffective for columns inside Structs.

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+)

    In ORC files, if the byte size of a Stripe is less than `orc_tiny_stripe_threshold`, it is considered a Tiny Stripe. For multiple consecutive Tiny Stripes, read optimization will be performed, i.e., multiple Tiny Stripes will be read at once to reduce the number of IO operations. If you do not want to use this optimization, you can set this value to 0. Default is 8M.

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+)

    When using Tiny Stripe read optimization, multiple Tiny Stripes will be merged into a single IO operation. This parameter controls the maximum number of bytes for each IO request. You should not set this value smaller than `orc_tiny_stripe_threshold`. Default is 8M.

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+)

    When using Tiny Stripe read optimization, since two Tiny Stripes to be read may not be consecutive, if the distance between two Tiny Stripes is greater than this parameter, they will not be merged into a single IO operation. Default is 1M.

* `orc_tiny_stripe_amplification_factor` (3.1.0+)

    In Tiny Stripe optimization, if there are many columns in the ORC file but only a few are used in the query, Tiny Stripe optimization may cause severe read amplification. When the proportion of actually read bytes to the entire Stripe exceeds this parameter, Tiny Stripe read optimization will be used. The default value is 0.4, and the minimum value is 0.

* `check_orc_init_sargs_success` (3.1.0+)

    Checks whether ORC predicate pushdown is successful, used for debugging. Default is false.

### BE Configuration

* `orc_natural_read_size_mb` (2.1+, 3.0+)

    The maximum number of bytes that the ORC Reader reads at one time. Default is 8 MB.
