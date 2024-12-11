---
{
    "title": "file_cache_statistics",
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

## 概述

用于查看各个 BE 节点 [数据缓存](../../../lakehouse/filecache.md) 相关的指标信息。

指标信息来源于 BE 的数据缓存相关监控指标。

:::tip 提示
该系统表自 3.0.2 版本起支持。
:::

## 所属数据库

`information_schema`

## 表信息

| 列名 | 类型 | 说明 |
|---|---|---|
| BE_ID | BIGINT  | BE 节点 ID  | 
| BE_IP | VARCHAR(256)  | BE 节点 IP  | 
| CACHE_PATH | VARCHAR(256)  | BE 节点缓存路径  | 
| METRIC_NAME    | VARCHAR(256)   | 指标名称  | 
| METRIC_VALUE      | DOUBLE   | 指标值  | 

:::info 备注

Doris 不同版本可能包含不同的指标信息。

:::

### 2.1.x 版本指标说明

> 仅列举重要指标。

- `normal_queue_curr_elements`

    当前缓存中 File Block 的个数。

- `normal_queue_max_elements`

    缓存允许的 File Block 最大个数。

- `normal_queue_curr_size`

    当前缓存大小

- `normal_queue_max_size`

    缓存允许的最大大小

- `hits_ratio`

    自 BE 启动后的缓存总命中率。

- `hits_ratio_5m`

    最近 5 分钟的缓存命中率。

- `hits_ratio_1h`

    最近 1 小时的缓存命中率。

### 3.0.x 版本指标说明

TODO

## 示例

1. 查询所有缓存指标

    ```sql
    mysql> select * from information_schema.file_cache_statistics;
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | BE_ID | BE_IP         | CACHE_PATH                 | METRIC_NAME                | METRIC_VALUE       |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_elements |               1392 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_curr_size     |          248922234 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_elements  |             102400 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | normal_queue_max_size      |        21474836480 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio                 | 0.8539634687001242 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_1h              |                  0 |
    | 10003 | 172.20.32.136 | /mnt/output/be/file_cache/ | hits_ratio_5m              |                  0 |
    +-------+---------------+----------------------------+----------------------------+--------------------+
    ```

2. 查询缓存命中率，并按命中率排序

    ```sql
    select * from information_schema.file_cache_statistics where METRIC_NAME = "hits_ratio" order by METRIC_VALUE desc;
    ```