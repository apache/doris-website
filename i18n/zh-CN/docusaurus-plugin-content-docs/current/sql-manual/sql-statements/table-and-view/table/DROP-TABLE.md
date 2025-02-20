---
{
    "title": "DROP-TABLE",
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

该语句用于删除 Table。
## 语法

```sql
DROP TABLE [IF EXISTS] [<db_name>.]<table_name> [FORCE];
```

## 必选参数
**1.`<table_name>`**
> 指定表的标识符（即名称），在其所在的数据库（Database）中必须唯一。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Object`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

## 可选参数

**1.`<db_name>`**
> 指定数据库的标识符（即名称）。
>
> 标识符必须以字母字符（如果开启 unicode 名字支持，则可以是任意语言文字的字符）开头，并且不能包含空格或特殊字符，除非整个标识符字符串用反引号括起来（例如`My Database`）。
>
> 标识符不能使用保留关键字。
>
> 有关更多详细信息，请参阅标识符要求和保留关键字。

**2.`FORCE`**
> 如果指定，则系统不会检查该表是否存在未完成的事务，表将直接被删除并且不能被恢复，一般不建议执行此操作。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：


| 权限（Privilege） | 对象（Object） | 说明（Notes）                 |
| :---------------- | :------------- | :---------------------------- |
| Drop_priv        | 表（Table）    | DROP TABLE 属于表 DROP 操作 |

## 注意事项

- 执行 `DROP TABLE` 一段时间内，可以通过 RECOVER 语句恢复被删除的表。详见 [RECOVER](../../recycle/RECOVER) 语句。
- 如果执行 `DROP TABLE FORCE`，则系统不会检查该表是否存在未完成的事务，表将直接被删除并且不能被恢复，一般不建议执行此操作。

## 示例

1. 删除一个 Table
   
    ```sql
    DROP TABLE my_table;
    ```
    
2. 如果存在，删除指定 Database 的 Table
   
    ```sql
    DROP TABLE IF EXISTS example_db.my_table;
    ```
    
3. 如果存在，删除指定 Database 的 Table，强制删除

    ```sql
    DROP TABLE IF EXISTS example_db.my_table FORCE;
    ```