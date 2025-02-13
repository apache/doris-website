---
{
   "title": "SHOW FILE",
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

该语句用于展示一个 database 内创建的文件。

## 语法

```sql
SHOW FILE { [ FROM | IN ] <database_name>}
```

## 可选参数

**1. `<database_name>`**

> 文件归属于的database，如果没有指定，则使用当前 session 的 database。

## 返回值

| 列名        | 说明         |
|-----------|------------|
| FileId    | 文件 ID，全局唯一 |
| DbName    | 所属数据库名称    |
| Catalog   | 自定义分类      |
| FileName  | 文件名        |
| FileSize  | 文件大小，单位字节  |
| IsContent | 是否有内容      |
| MD5       | 文件的 MD5    |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object）         | 说明（Notes）                   |
|:--------------|:-------------------|:----------------------------|
| `ADMIN_PRIV`  | 用户（User）或 角色（Role） | 用户或者角色拥有文件所属数据库的访问权限就能执行此指令 |

## 示例

- 查看 session 数据库中已上传的文件

    ```sql
    SHOW FILE;
    ```
    ```text
    +-------+--------+----------+--------------------------+----------+-----------+----------------------------------+
    | Id    | DbName | Catalog  | FileName                 | FileSize | IsContent | MD5                              |
    +-------+--------+----------+--------------------------+----------+-----------+----------------------------------+
    | 12006 | testdb | doris_be | doris_be_metadata_layout | 89349    | true      | 9a3f68160b4106b0e923a0aa2fc05599 |
    +-------+--------+----------+--------------------------+----------+-----------+----------------------------------+
    ```

- 查看数据库 example_db 中已上传的文件

    ```sql
    SHOW FILE FROM example_db;
    ```
    ```text
    +-------+------------+----------+--------------------------+----------+-----------+----------------------------------+
    | Id    | DbName     | Catalog  | FileName                 | FileSize | IsContent | MD5                              |
    +-------+------------+----------+--------------------------+----------+-----------+----------------------------------+
    | 12007 | example_db | doris_fe | doris_fe_metadata_layout | 569373   | true      | 10385505d3c0d03f085fea6f8d51adfa |
    | 12008 | example_db | doris_be | doris_be_metadata_layout | 89349    | true      | 9a3f68160b4106b0e923a0aa2fc05599 |
    +-------+------------+----------+--------------------------+----------+-----------+----------------------------------+
    ```
