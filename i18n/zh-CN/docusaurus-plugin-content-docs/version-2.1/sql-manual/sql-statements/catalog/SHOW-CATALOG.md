---
{
    "title": "SHOW CATALOGS",
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

该语句用于显示已存在是数据目录（catalog）

## 语法

```sql
SHOW CATALOGS [LIKE <catalog_name>]
```

说明：

LIKE：可按照 CATALOG 名进行模糊查询

## 可选参数

**1. `<catalog_name>`**

需要显示 catalog 的名字

## 返回值


| Column name  | Description |
|---|---|
| CatalogId | 数据目录唯一 ID |
| CatalogName | 数据目录名称，其中 internal 是默认内置的 catalog，不可修改 |
| Type | 数据目录类型 |
| IsCurrent | 是否为当前会话正在使用的数据目录 |
| CreateTime | 创建时间 |
| LastUpdateTime | 最后更新时间，REFRESH CATALOG， ALTER CATALOG，或者Hive、Paimon等外部元数据系统发生变更时间 |
| Comment | 备注 |

## 权限控制
| 权限（Privilege）                                                                                | 对象（Object） | 说明（Notes）      |
|:---------------------------------------------------------------------------------------------|:-----------|:---------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog    | 需要有上述权限中的一种就可以 |


## 示例

1. 查看当前已创建的数据目录

   ```sql
   SHOW CATALOGS;
   ```
   ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    |         0 | internal    | internal | yes       | UNRECORDED              | NULL                | Doris internal catalog |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    ```

2. 按照目录名进行模糊搜索

   ```sql
   SHOW CATALOGS LIKE 'hi%';
   ```
    ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
   ```
