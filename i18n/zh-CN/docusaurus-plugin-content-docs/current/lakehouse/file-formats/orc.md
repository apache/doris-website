---
{
    "title": "ORC",
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


本文档用于介绍 Doris 的 ORC 文件格式的读写支持情况。该文档适用于以下功能。

* Catalog 中对数据的读取、写入操作。

* Table Valued Function 中对数据的读取操作。

* Broker Load 中对数据的读取操作。

* Export 中对数据的写入操作。

* Outfile 中对数据的写入操作。

## 支持的压缩格式

* umcomressed

* snappy

* lz4

* zstd

* lzo

* zlib

## 参数

### session variable

* `enable_orc_lazy_mat` (2.1+, 3.0+)

控制 Orc Reader 是否启用延迟物化技术。默认为 true。

* `hive_orc_use_column_names` (2.1.6+, 3.0.3+)

Doris 在读取 Hive 表 Orc 数据类型时，默认会根据 Hive 表的列名从 Orc 文件中找同名的列来读取数据。当该变量为 `false` 时，Doris 会根据 Hive 表中的列顺序从 Parquet 文件中读取数据，与列名无关。类似于 Hive 中的 `orc.force.positional.evolution` 变量。该参数只适用于顶层列名，对 Struct 内部无效。

* `orc_tiny_stripe_threshold_bytes` (2.1.8+, 3.0.3+) 

在 Orc 文件中如果一个 stripe 的字节大小小于 `orc_tiny_stripe_threshold`, 我们认为该 stripe 为 tiny stripe。对于多个连续的 tiny stripe 我们会进行读取优化，即一次性读多个 tiny stripe。 如果你不想使用该优化，可以将该值设置为0。默认为 8M。

* `orc_once_max_read_bytes` (2.1.8+, 3.0.3+) 

在使用 tiny stripe 读取优化的时候，会对多个 tiny stripe 合并成一次IO，该参数用来控制每次 IO 请求的最大字节大小。你不应该将值设置的小于 `orc_tiny_stripe_threshold`。默认为 8M。

* `orc_max_merge_distance_bytes` (2.1.8+, 3.0.3+) 

在使用 tiny stripe 读取优化的时候，由于需要读取的两个 tiny stripe 并不一定连续, 当两个 tiny stripe 之间距离大于该参数时，我们不会将其合并成一次IO。默认为 1M。

* `check_orc_init_sargs_success` (dev)

检查 orc 谓词下推是否成功，用于调试。默认为 false。

* `orc_tiny_stripe_amplification_factor` (dev)

在 tiny stripe 优化中，如果 orc 文件中的列较多，而查询中只使用其中的少数列，tiny stripe 优化会导致严重的读取放大。当实际读取的字节数占整个 stripe 的比例大于该参数时，将使用 tiny stripe 读取优化。该参数的默认值为 0.4，最小值为 0。

### be.conf

* `orc_natural_read_size_mb` (2.1+, 3.0+)

Orc Reader 一次性读取的最大字节大小。
