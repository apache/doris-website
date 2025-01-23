---
{
"title": "ANY_VALUE",
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

返回分组中表达式或列的任意一个值。如果存在非NULL值，返回任意非NULL值，否则返回NULL。

## 别名

- ANY

## 语法

```sql
ANY_VALUE(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式 |

## 返回值

如果存在非NULL值，返回任意非NULL值，否则返回NULL。

## 举例

```sql
select id, any_value(name) from cost2 group by id;
```

```text
+------+-------------------+
| id   | any_value(`name`) |
+------+-------------------+
|    3 | jack              |
|    2 | jack              |
+------+-------------------+
```
