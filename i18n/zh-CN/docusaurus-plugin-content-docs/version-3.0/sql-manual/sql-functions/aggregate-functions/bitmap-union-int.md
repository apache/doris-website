---
{
"title": "BITMAP-UNION-INT",
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

计算 TINYINT,SMALLINT 和 INT 类型的列中不同值的个数，返回值和 COUNT(DISTINCT expr) 相同

## 语法

```sql
BITMAP_UNION_INT(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 支持 TINYINT，SMALLINT 和 INT 类型的列或列表达式 |

## 返回值

返回列中不同值的个数

## 举例

```sql
select dt,page,bitmap_to_string(user_id) from pv_bitmap;
```

```text
+------+------+---------------------------+
| dt   | page | bitmap_to_string(user_id) |
+------+------+---------------------------+
|    1 | 100  | 100,200,300               |
|    1 | 300  | 300                       |
|    2 | 200  | 300                       |
+------+------+---------------------------+
```

```
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```
