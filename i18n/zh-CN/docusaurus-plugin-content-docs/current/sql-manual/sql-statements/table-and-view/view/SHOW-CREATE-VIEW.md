---
{
    "title": "SHOW CREATE VIEW",
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

显示指定视图创建时的 CREATE VIEW 语句。

## 语法

```sql
SHOW CREATE VIEW <name>
```

## 必选参数

`<name>`：要查看的视图名称。

## 返回结果

- View: 查询的视图名称。
- Create View: 数据库中持久化的 SQL 语句。
- character_set_client: 表示创建视图时会话中 character_set_client 系统变量的值。
- collation_connection: 表示创建视图时会话中 collation_connection 系统变量的值。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限（Privilege） | 对象（Object） | 说明（Notes） |
| :---------------- | :------------- | :------------ |
| SHOW_VIEW_PRIV    | 表（Table）    |               |

视图信息还可以通过 INFORMATION_SCHEMA.VIEWS 表查询。

## 示例

```sql
CREATE VIEW vtest AS SELECT 1, 'test';
SHOW CREATE VIEW vtest;
```

查询结果：

```sql
+-------+------------------------------------------+----------------------+----------------------+
| View  | Create View                              | character_set_client | collation_connection |
+-------+------------------------------------------+----------------------+----------------------+
| vtest | CREATE VIEW `vtest` AS SELECT 1, 'test'; | utf8mb4              | utf8mb4_0900_bin     |
+-------+------------------------------------------+----------------------+----------------------+

```


