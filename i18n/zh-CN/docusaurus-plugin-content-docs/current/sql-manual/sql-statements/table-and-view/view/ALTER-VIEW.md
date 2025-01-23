---
{
    "title": "ALTER VIEW",
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

该语句用于修改一个逻辑视图的定义。

## 语法

```sql
ALTER VIEW [db_name.]<view_name> 
 ([column_definition])
AS <query_stmt>
```

其中：
```sql
column_definition:
    column_name [COMMENT 'comment'] [,...]
```

## 必选参数

**<view_name>**
> 视图的标识符（即名称）；在创建视图的数据库中必须唯一。  
> 标识符必须以字母字符（如果开启unicode名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My View`）。  
> 标识符不能使用保留关键字。  
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**<query_stmt>**
> 定义视图的 SELECT 查询语句。

## 可选参数

**<db_name>**
> 视图所在的数据库名称。如果未指定，则默认为当前数据库。

**<column_definition>**
> 视图的列定义。

## 权限控制

| 权限          | 对象   | 说明                                 |
|-------------|------|------------------------------------|
| Alter_priv  | 视图  | 需要所修改视图的 Select_Priv 权限。           |
| Select_Priv | 表、视图 | 需要拥有被查询的表、视图、物化视图的 Select_Priv 权限。 |

## 示例

1、修改 example_db 上的视图 example_view

  ```sql
  ALTER VIEW example_db.example_view
  (
    c1 COMMENT "column 1",
    c2 COMMENT "column 2",
    c3 COMMENT "column 3"
  )
  AS SELECT k1, k2, SUM(v1) FROM example_table 
  GROUP BY k1, k2
  ```

