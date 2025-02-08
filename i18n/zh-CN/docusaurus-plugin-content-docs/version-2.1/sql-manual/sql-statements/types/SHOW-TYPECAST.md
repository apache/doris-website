---
{
  "title": "SHOW TYPECAST",
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

查看数据库下所有的类型转换。


# 语法

```sql
SHOW TYPE_CAST [ IN | FROM <db>];
```

## 必选参数

**1. `<db>`**

查询的数据库名称

## 返回值

| 列名        | 说明         |
|-------------|--------------|
| Origin Type | 原始类型     |
| Cast Type   | 转换类型     |


## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes）                     |
| :---------------- |:-----------|:------------------------------|
| Select_priv        | 库（DB）      | 用户或者角色对于 DB 拥护 Select_Priv 才能查看数据库下所有类型的转换 |


## 注意事项

- 如果用户指定了数据库，那么查看对应数据库的，否则直接查询当前会话所在数据库

## 示例

- 查看数据库 TESTDB 下所有的类型转换
    ```sql
    SHOW TYPE_CAST IN TESTDB;
    ```
    ```text
    +----------------+----------------+
    | Origin Type    | Cast Type      |
    +----------------+----------------+
    | DATETIMEV2     | BOOLEAN        |
    | DATETIMEV2     | TINYINT        |
    | DATETIMEV2     | SMALLINT       |
    | DATETIMEV2     | INT            |
    | DATETIMEV2     | BIGINT         |
    | DATETIMEV2     | LARGEINT       |
    | DATETIMEV2     | FLOAT          |
    | DATETIMEV2     | DOUBLE         |
    | DATETIMEV2     | DATE           |
    | DATETIMEV2     | DATETIME       |
    | DATETIMEV2     | DATEV2         |
    | DATETIMEV2     | DATETIMEV2     |
    | DATETIMEV2     | DECIMALV2      |
    | DATETIMEV2     | DECIMAL32      |
    | DATETIMEV2     | DECIMAL64      |
    | DATETIMEV2     | DECIMAL128     |
    | DATETIMEV2     | DECIMAL256     |
    | DATETIMEV2     | VARCHAR        |
    | DATETIMEV2     | STRING         |
    | DECIMAL256     | DECIMAL128     |
    | DECIMAL256     | DECIMAL256     |
    | DECIMAL256     | VARCHAR        |
    | DECIMAL256     | STRING         |
    +----------------+----------------+
    ```





