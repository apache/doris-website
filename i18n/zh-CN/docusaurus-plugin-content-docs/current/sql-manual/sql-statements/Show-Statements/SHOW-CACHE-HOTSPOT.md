---
{
    "title": "SHOW-CACHE-HOTSPOT",
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

## 语法

```sql
   SHOW CACHE HOTSPOT '/[compute_group_name/table_name]';
```

## 参数

1. compute_group_name : 计算组的名称。
2. table_name : 表的名称。

## 示例

1. 查看某个表的创建语句

    ```sql
    SHOW CACHE HOTSPOT '/';
    ```

## 相关命令

 - [WARMUP CACHE](../Database-Administration-Statements/WARM-UP-COMPUTE-GROUP.md)

## 参考

 - [MANAGING FILE CACHE](../../../compute-storage-decoupled/file-cache.md)

## 关键词

    SHOW, CACHE, HOTSPOT

