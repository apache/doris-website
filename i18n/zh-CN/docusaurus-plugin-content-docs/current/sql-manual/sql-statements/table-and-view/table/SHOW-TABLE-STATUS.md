---
{
    "title": "SHOW TABLE STATUS",
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

该语句用于展示一个表或者视图的一些信息。

## 语法

```sql
SHOW TABLE STATUS [ FROM [ <catalog_name>.]<db_name> ] [ LIKE <like_condition> ]
```
## 可选参数

**1. `FROM 子句`**
> FROM 子句中可以指定查询的 catalog 名称以及 database 的名称。

**2. `LIKE 子句`**
> LIKE 子句中可以按照表名进行模糊查询。

## 返回值

| 列名（Column）          | 类型（DataType） | 说明（Notes）       |
|:--------------------|:-------------|:----------------|
| Name | 字符串          | 表名称             |
| Engine | 字符串          | 表引擎             |
| Version | 字符串          |                 |
| Row_format | 字符串          |                 |
| Rows | 字符串          | 表的行数            |
| Avg_row_length | 整型           | 每行数据平均长度        |
| Data_length | 整型           | 表的数据大小          |
| Max_data_length | 整型           | 最大数据行的长度        |
| Index_length | 整型           | 索引的长度           |
| Data_free |              |                 |
| Auto_increment |              |                 |
| Create_time | Datetime     | 创建时间            |
| Update_time | Datetime     | 更新时间            |
| Check_time | Datetime     |                 |
| Collation | 字符集          | 字符集，目前只支持 utf-8 |
| Checksum | 字符串          |                 |
| Create_options | 字符串          |                 |
| Comment | 字符串          | 表注释             |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）               |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV    | 表（Table）, 视图（View） | 目前仅支持 **ADMIN** 权限执行此操作 |

## 注意事项

- 该语句主要用于兼容 MySQL 语法，目前仅显示 Comment 等少量信息。

## 示例

- 查看当前数据库下所有表的信息

    ```sql
    SHOW TABLE STATUS
    ```
  
    ```text
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation | Checksum | Create_options | Comment |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | test_table | Doris  |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:45:36 | 2025-01-22 11:45:36 | NULL       | utf-8     |     NULL | NULL           |         |
    | test_view  | View   |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:46:32 | NULL                | NULL       | utf-8     |     NULL | NULL           |         |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    ```

- 查看指定数据库下，名称包含 example 的表的信息

    ```sql
    SHOW TABLE STATUS FROM db LIKE "%test%"
    ```

    ```text
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | Name       | Engine | Version | Row_format | Rows | Avg_row_length | Data_length | Max_data_length | Index_length | Data_free | Auto_increment | Create_time         | Update_time         | Check_time | Collation | Checksum | Create_options | Comment |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    | test_table | Doris  |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:45:36 | 2025-01-22 11:45:36 | NULL       | utf-8     |     NULL | NULL           |         |
    | test_view  | View   |    NULL | NULL       |    0 |              0 |           0 |            NULL |         NULL |      NULL |           NULL | 2025-01-22 11:46:32 | NULL                | NULL       | utf-8     |     NULL | NULL           |         |
    +------------+--------+---------+------------+------+----------------+-------------+-----------------+--------------+-----------+----------------+---------------------+---------------------+------------+-----------+----------+----------------+---------+
    ```