---
{
    "title": "SHOW SQL_BLOCK_RULE",
    "language": "en"
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


## Description  
Displays the configured SQL blocking rules. If no rule name is specified, all rules will be displayed.  

## Syntax  
```sql
SHOW SQL_BLOCK_RULE [FOR <rule_name>];
```

## Optional Parameters  

`<rule_name>`

The name of the SQL blocking rule to display. If omitted, all rules will be shown. |

## Access Control Requirements  

Users executing this command must have the following privileges:  

| Privilege | Object        | Notes  |
|-----------|--------------|--------|
| `ADMIN`   | User or Role | Required to perform this operation. |

## Examples  

1. Display all SQL blocking rules  
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

2. Display a specific SQL blocking rule  
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
