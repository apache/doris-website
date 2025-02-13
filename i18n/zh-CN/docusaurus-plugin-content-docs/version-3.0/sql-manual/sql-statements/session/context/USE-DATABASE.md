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

用于切换到指定的数据库或计算组。

## 语法

```SQL
USE { [<catalog_name>.]<database_name>[@<compute_group_name>] | @<compute_group_name> }
```

## 必选参数

切换到指定的数据库。

**1. `<database_name>`**
> 要切换的数据库名称。
> 如果未指定数据目录，则默认为当前数据目录。

只切换到指定的计算组。

**1. `<compute_group_name>`**
> 要切换的计算组名称。

## 可选参数

切换到指定的数据库。

**1. `<catalog_name>`**
> 要切换的数据目录名称。

**2. `<compute_group_name>`**
> 要切换的计算组名称。

## 权限控制

| 权限          | 对象       | 说明                              |
|-------------|----------|---------------------------------|
| SELECT_PRIV | 数据目录、数据库 | 需要对要切换的数据目录、数据有 SELECT_PRIV 权限。 |
| USAGE_PRIV  | 计算组      | 需要对要切换的计算组有 USAGE_PRIV 权限。     |


## 示例

1. 如果 demo 数据库存在，尝试使用它：

   ```sql
   use demo;
   ```

2. 如果 demo 数据库在 hms_catalog 的 Catalog 下存在，尝试切换到 hms_catalog, 并使用它：

    ```sql
    use hms_catalog.demo;
    ```
3. 如果 demo 数据库在当前目录中存在，并且您想使用名为 'cg1' 的计算组，请尝试访问它：

    ```sql
    use demo@cg1;
    ```

4. 如果您只想使用名为 'cg1' 的计算组，请尝试访问它：

    ```sql
    use @cg1;
    ```