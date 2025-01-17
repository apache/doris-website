---
{
    "title": "BITMAP_AND",
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

计算两个及以上输入的 BITMAP 的交集，返回新的 BITMAP.

## 语法

```sql
BITMAP_AND(<bitmap>, <bitmap>,[, <bitmap>...])
```

## 参数

| 参数         | 说明               |
|------------|------------------|
| `<bitmap>` | 被求交集的原 BITMAP 之一 |

## 返回值

返回一个 BITMAP  
- 当参数存在空值时，返回 NULL

## 举例

```sql
MySQL> select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5')));
```

```text
+-----------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'))) |
+-----------------------------------------------------------------------------------------------------------------------+
| 1,2                                                                                                                   |
+-----------------------------------------------------------------------------------------------------------------------+
```

```sql
MySQL> select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),bitmap_empty()));
```

```text
+---------------------------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), bitmap_empty())) |
+---------------------------------------------------------------------------------------------------------------------------------------+
|                                                                                                                                       |
+---------------------------------------------------------------------------------------------------------------------------------------+
```

```sql
MySQL> select bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'),NULL));
```

```text
+-----------------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_and(bitmap_from_string('1,2,3'), bitmap_from_string('1,2'), bitmap_from_string('1,2,3,4,5'), NULL)) |
+-----------------------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                                        |
+-----------------------------------------------------------------------------------------------------------------------------+
```


