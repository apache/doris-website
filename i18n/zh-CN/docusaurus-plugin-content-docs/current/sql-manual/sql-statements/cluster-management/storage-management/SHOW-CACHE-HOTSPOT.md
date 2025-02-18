---
{
    "title": "SHOW CACHE HOTSPOT",
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

## 描述

该语句用于显示文件缓存的热点信息。

:::info 备注
在3.0.4版本之前可以使用`SHOW CACHE HOTSPOT`语句进行缓存热度信息统计查询,
从3.0.4版本开始不再支持使用 `SHOW CACHE HOTSPOT` 语句进行缓存热度信息统计查询,
请直接访问系统表 `__internal_schema.cloud_cache_hotspot` 进行查询.
具体用法请参考 [MANAGING FILE CACHE](../../../../compute-storage-decoupled/file-cache)
:::

## 语法

```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<db.table_name>]';
```

## 参数

| 参数名称                  | 描述                                                         |
|---------------------------|--------------------------------------------------------------|
| <compute_group_name>        | 计算组的名称。                                               |
| <table_name>                | 表的名称。                                                   |
## 示例

1. 显示整个系统的缓存热点信息

```sql
SHOW CACHE HOTSPOT '/';
```

2. 显示特定计算组 my_compute_group 的缓存热点信息

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```

## 参考

 - [MANAGING FILE CACHE](../../../../compute-storage-decoupled/file-cache)
 - [WARMUP CACHE](../Database-Administration-Statements/WARM-UP-COMPUTE-GROUP.md)

