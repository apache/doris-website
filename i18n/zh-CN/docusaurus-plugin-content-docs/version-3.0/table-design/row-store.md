---
{
    "title": "行列混存",
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



Doris 默认采用列式存储，每个列连续存储，在分析场景（如聚合，过滤，排序等）有很好的性能，因为只需要读取所需要的列减少不必要的 IO。但是在点查场景（比如 `SELECT *`），需要读取所有列，每个列都需要一次 IO 导致 IOPS 成为瓶颈，特别对列多的宽表（比如上百列）尤为明显。

为了解决点查场景 IOPS 的瓶颈问题，Doris 2.0.0 版本开始支持行列混存，用户建表时指定开启行存后，点查（比如 `SELECT *`）每一行只需要一次 IO，性能有数量级提升。


## 使用语法

建表时在表的 PROPERTIES 中指定是否开启行存，哪些列开启行存，行存的存储压缩单元大小 page_size。

1. 是否开启行存：默认为 false 不开启
```
"store_row_column" = "true"
```

2. 哪些列开启行存：如果 1 开启，默认所有列开启行存，如果需要指定部分列开启行存，设置 row_store_columns 参数，格式为逗号分割的列名
```
"row_store_columns" = "column1,column2,column3"
```

3. 行存 page_size：默认为 16KB。
```
"row_store_page_size" = "16384"
```

page 是存储读写的最小单元，page_size 是行存 page 的大小，也就是说读一行也需要产生一个 page 的 IO。这个值越大压缩效果越好存储空间占用越低，但是点查时 IO 开销越大性能越低（因为一次 IO 至少读一个 page），反过来值越小存储空间越高，点查性能越好。默认值 16KB 是大多数情况下比较均衡的选择，如果更偏向查询性能可以配置较小的值比如 4KB 甚至更低，如果更偏向存储空间可以配置较大的值比如 64KB 甚至更高。


## 使用实例

下面的例子创建一个 8 列的表，其中 "key,v1,v3,v5,v7" 这 5 列开启行存，为了高并发点查性能配置 page_size 为 4KB。

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

更多点查的使用请参考 [高并发点查](../query/high-concurrent-point-query) 。
