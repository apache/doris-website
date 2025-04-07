---
{
    "title": "ARRAY_REDUCE",
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
规约数组来得到一个值

## 语法

```sql
ARRAY_REDUCE(lambda, <arr>, <val>)
```

## 参数
| 参数 | 说明 |
|---|---|
| `lambda` | 带有两个输入参数的lambda表达式。lambda可以执行有效的标量函数，但不支持聚合函数。 |
| `<arr>` | ARRAY 数组 |
| `<val>` | reduce的初始值。支持常量值和表中的列. |

## 返回值

数组的规约值。

## 举例

```sql
select array_reduce((s,x)->s+x, [1, 2, 3, 4, 5], 0);
```
```text
+---------------------------------------------------+
| array_reduce((s,x)->s+x, ARRAY(1, 2, 3, 4, 5), 0) |
+---------------------------------------------------+
| 15                                                |
+---------------------------------------------------+
```
```sql
select array_reduce((s,x)->s-x, [1, 2, 3, 4, 5], 0);
```
```text
+---------------------------------------------+
| array_reduce((s,x)->s-x, ARRAY(1, 2, 3), 0) |
+---------------------------------------------+
| -6                                          |
+---------------------------------------------+
```