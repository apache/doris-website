---
{
"title": "DROP SQL_BLOCK_RULE",
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

删除一个或多个 SQL 阻止规则。支持同时删除多个规则，规则名称之间用逗号分隔。

## 语法

```sql
DROP SQL_BLOCK_RULE <rule_name>[, ...]
```

## 必选参数

`<rule_name>`
需要删除的 SQL 阻止规则名称，多个规则用逗号分隔。

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限     | 对象         | 说明                                      |
|---------|------------|-----------------------------------------|
| ADMIN  | 用户或角色 | 仅具有 ADMIN 权限的用户或角色可以执行 DROP 操作。 |

## 示例

删除 `test_rule1` 和 `test_rule2` 阻止规则：

```sql
DROP SQL_BLOCK_RULE test_rule1, test_rule2;
```
