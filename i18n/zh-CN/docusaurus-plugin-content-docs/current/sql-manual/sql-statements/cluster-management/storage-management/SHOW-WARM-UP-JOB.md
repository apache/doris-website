---
{
    "title": "SHOW WARM UP JOB",
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

## 描述

这些命令用于在 Doris 中显示预热作业。

## 语法

```sql
   SHOW WARM UP JOB [ WHERE id = 'id' ] ;
```

## 参数

* id : 预热作业的 id。

## 示例

1. 查看所有预热作业

    ```sql
    SHOW WARM UP JOB;
    ```

2. 查看 id 为 13418 的预热作业

```sql
    SHOW WARM UP JOB WHERE id = 13418;
```

## 相关命令

 - [WARMUP COMPUTE GROUP](../Database-Administration-Statements/WARM-UP-COMPUTE-GROUP.md)

## 参考

 - [管理文件缓存](../../../compute-storage-decoupled/file-cache.md)

## 关键字

    SHOW, CACHE, HOTSPOT, COMPUTE GROUP 
