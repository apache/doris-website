---
{
"title": "COLLECT_SET",
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

聚合函数，聚合指定列的所有唯一值，去除重复的元素，并返回一个集合类型的结果。

## 别名

- GROUP_UNIQ_ARRAY

## 语法

```sql
COLLECT_SET(<expr> [,<max_size>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要聚合的列或表达式 |
| `<max_size>` | 可选参数，通过设置该参数能够将结果数组的大小限制为 max_size 个元素 |

## 返回值

返回类型是 ARRAY，该数组包含去重后的所有值，特殊情况：

- 如果值为NULL，则会过滤

## 举例

```sql
select k1,k2,k3 from collect_set_test order by k1;
```

```text
+------+------------+-------+
| k1   | k2         | k3    |
+------+------------+-------+
|    1 | 2023-01-01 | hello |
|    2 | 2023-01-01 | NULL  |
|    2 | 2023-01-02 | hello |
|    3 | NULL       | world |
|    3 | 2023-01-02 | hello |
|    4 | 2023-01-02 | doris |
|    4 | 2023-01-03 | sql   |
+------+------------+-------+
```

```sql
select collect_set(k1),collect_set(k1,2) from collect_set_test;
```

```text
+-------------------------+--------------------------+
| collect_set(`k1`)       | collect_set(`k1`,2)      |
+-------------------------+--------------------------+
| [4,3,2,1]               | [1,2]                    |
+----------------------------------------------------+
```

```sql
select k1,collect_set(k2),collect_set(k3,1) from collect_set_test group by k1 order by k1;
```

```text
+------+-------------------------+--------------------------+
| k1   | collect_set(`k2`)       | collect_set(`k3`,1)      |
+------+-------------------------+--------------------------+
|    1 | [2023-01-01]            | [hello]                  |
|    2 | [2023-01-01,2023-01-02] | [hello]                  |
|    3 | [2023-01-02]            | [world]                  |
|    4 | [2023-01-02,2023-01-03] | [sql]                    |
+------+-------------------------+--------------------------+
```
