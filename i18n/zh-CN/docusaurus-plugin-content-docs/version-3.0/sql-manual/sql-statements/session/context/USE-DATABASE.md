---
{
    "title": "USE",
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

USE 命令允许我们在 SQL 环境中切换到特定的数据库或计算组。

## 语法

```SQL
USE <[CATALOG_NAME].DATABASE_NAME>
```

## 示例

1. 如果 demo 数据库存在，尝试使用它：

   ```sql
   mysql> use demo;
   Database changed
   ```

2. 如果 demo 数据库在 hms_catalog 的 Catalog 下存在，尝试切换到 hms_catalog, 并使用它：

    ```sql
    mysql> use hms_catalog.demo;
    Database changed
    ```
3. 如果 demo 数据库在当前目录中存在，并且您想使用名为 'cg1' 的计算组，请尝试访问它：

    ```sql
    mysql> use demo@cg1;
    Database changed
    ```

4. 如果您只想使用名为 'cg1' 的计算组，请尝试访问它：

    ```sql
    mysql> use @cg1;
    Database changed
    ```

## Relate Commands

## 关键词

    USE, DATABASE, USER, COMPUTE GROUP