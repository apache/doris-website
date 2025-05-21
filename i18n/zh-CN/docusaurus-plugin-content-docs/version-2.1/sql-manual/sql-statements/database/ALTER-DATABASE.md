---
{
    "title": "ALTER DATABASE",
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

该语句用于设置指定 db 的属性和改动 db 名字以及设定 db 的多种 quota。

## 语法

```sql
ALTER DATABASE <db_name> RENAME <new_name>
ALTER DATABASE <db_name> SET { DATA | REPLICA | TRANSACTION } QUOTA <quota>
ALTER DATABASE <db_name> SET <PROPERTIES> ("<key>" = "<value>" [, ...])
```

## 必选参数

** 1. `<db_name>`**
>  数据库名称

** 2. `<new_db_name>`**
>  新的数据库名称

** 3. `<quota>`**
>  数据库数据量配额或者数据库的副本数量配额

** 4. `<PROPERTIES>`**
>  该数据库的附加信息

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象    | 说明             |
|:-----------|:------|:---------------|
| ALTER_PRIV | 对应数据库 | 需要对对应数据库具有变更权限 |

## 注意事项

重命名数据库后，如需要，请使用 REVOKE 和 GRANT 命令修改相应的用户权限。数据库的默认数据量配额为 8192PB，默认副本数量配额为 1073741824。

## 示例

- 设置指定数据库数据量配额

  ```sql
    ALTER DATABASE example_db SET DATA QUOTA 10995116277760;
  ```

- 将数据库 example_db 重命名为 example_db2

  ```sql
    ALTER DATABASE example_db RENAME example_db2;
  ```

- 设定指定数据库副本数量配额

  ```sql
    ALTER DATABASE example_db SET REPLICA QUOTA 102400;
  ```

- 修改 db 下 table 的默认副本分布策略（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "tag.location.default:2");
  ```

- 取消 db 下 table 的默认副本分布策略（该操作仅对新建的 table 生效，不会修改 db 下已存在的 table）

  ```sql
    ALTER DATABASE example_db SET PROPERTIES("replication_allocation" = "");
  ```
