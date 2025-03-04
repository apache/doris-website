---
{
    "title": "ALTER SQL_BLOCK_RULE",
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

该语句用于修改 SQL 阻止规则

## 语法

```sql
ALTER SQL_BLOCK_RULE <rule_name>
PROPERTIES (
          -- property
          <property>
          -- Additional properties
          [ , ... ]
          ) 
```

## 必选参数

**1. `<rule_name>`**

> 规则的名字

**2. `<property>`**

具体见[CREATE SQL_BLOCK_RULE](../data-governance/CREATE-SQL_BLOCK_RULE.md) 的介绍

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限 | 对象  | 说明 |
| :---------------- | :------------- | :------------ |
| ADMIN_PRIV      | 全局           |               |

## 示例

1. 修改 sql 并开启规则
   
  ```sql
  ALTER SQL_BLOCK_RULE test_rule PROPERTIES("sql"="select \\* from test_table","enable"="true")
  ```