---
{
    "title": "SHOW SQL_BLOCK_RULE",
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

查看已配置的 SQL 阻止规则。如果未指定规则名，则显示所有规则。  

## 语法  

```sql
SHOW SQL_BLOCK_RULE [FOR <rule_name>];
```

## 可选参数  

 `<rule_name>` 
 要查看的 SQL 阻止规则名称。如果未指定，则显示所有规则。 

## 权限控制

执行该命令的用户需具备以下权限：  

| 权限    | 适用对象   | 说明  |
|---------|----------|------|
| `ADMIN` | 用户或角色 | 仅拥有 `ADMIN` 权限的用户或角色可执行此操作。 |

## 示例  

1. 查看所有 SQL 阻止规则  
```sql
SHOW SQL_BLOCK_RULE;
```

```text
+------------+----------------------------+---------+-------------+------------+-------------+--------+--------+
| Name       | Sql                        | SqlHash | PartitionNum | TabletNum  | Cardinality | Global | Enable |
+------------+----------------------------+---------+-------------+------------+-------------+--------+--------+
| test_rule  | select * from order_analysis | NULL    | 0           | 0          | 0           | true   | true   |
| test_rule2 | NULL                        | NULL    | 30          | 0          | 10000000000 | false  | true   |
+------------+----------------------------+---------+-------------+------------+-------------+--------+--------+
```

2. 查看指定的 SQL 阻止规则  
```sql
SHOW SQL_BLOCK_RULE FOR test_rule2;
```

```text
+------------+------+---------+-------------+------------+-------------+--------+--------+
| Name       | Sql  | SqlHash | PartitionNum | TabletNum  | Cardinality | Global | Enable |
+------------+------+---------+-------------+------------+-------------+--------+--------+
| test_rule2 | NULL | NULL    | 30          | 0          | 10000000000 | false  | true   |
+------------+------+---------+-------------+------------+-------------+--------+--------+
```
