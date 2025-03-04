---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
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

将两个 BITMAP 进行与非操作并返回计算结果，其中入参第一个叫 `基准 BITMAP`，第二个叫 `排除 BITMAP`。

## 别名

- BITMAP_ANDNOT

## 语法

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## 参数

| 参数          | 说明               |
|-------------|------------------|
| `<bitmap1>` | 被求与非的`基准 BITMAP` |
| `<bitmap2>` | 被求与非的`排除 BITMAP` |

## 返回值

返回一个 BITMAP。
- 当参数存在空值时，返回 NULL

## 举例

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5')));
```

```text
+--------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'))) |
+--------------------------------------------------------------------------------------------+
| 1,2                                                                                        |
+--------------------------------------------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty()));
```

```text
+-------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), bitmap_empty())) |
+-------------------------------------------------------------------------------+
| 1,2,3                                                                         |
+-------------------------------------------------------------------------------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL));
```

```text
+---------------------------------------------------------------------+
| bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'), NULL)) |
+---------------------------------------------------------------------+
| NULL                                                                |
+---------------------------------------------------------------------+
```
