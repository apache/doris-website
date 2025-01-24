---
{
    "title": "BITMAP_OR_COUNT",
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

计算两个及以上输入 Bitmap 的并集，返回并集的元素个数。

## 语法

```sql
bitmap_or_count(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 参数

| 参数          | 描述           |
|-------------|--------------|
| `<bitmap1>` | 第一个 Bitmap   |
| `<bitmap2>` | 第二个 Bitmap   |
| ...         | ...          |
| `<bitmapN>` | 第 N 个 Bitmap |

## 返回值

多个 Bitmap 并集的元素个数。  
如果有 Bitmap 为 `NULL` 则返回 `NULL`。

## 示例

计算一个非空 Bitmap 和一个空 Bitmap 的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty());
```

结果如下：

```text
+--------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_empty()) |
+--------------------------------------------------------------+
|                                                            3 |
+--------------------------------------------------------------+
```

计算两个相同 Bitmap 的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3'));
```

结果如下：

```text
+---------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('1,2,3')) |
+---------------------------------------------------------------------------+
|                                                                         3 |
+---------------------------------------------------------------------------+
```

计算两个不同 Bitmap 的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'));
```

结果如下：

```text
+---------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5')) |
+---------------------------------------------------------------------------+
|                                                                         5 |
+---------------------------------------------------------------------------+
```

计算多个 Bitmap（包括一个空 Bitmap）的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty());
```

结果如下：

```text
+-----------------------------------------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), bitmap_empty()) |
+-----------------------------------------------------------------------------------------------------------+
|                                                                                                         6 |
+-----------------------------------------------------------------------------------------------------------+
```

计算多个 Bitmap（包括一个 `NULL` 值）的并集中的元素数量：

```sql
select bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL);
```

结果如下：

```text
+-------------------------------------------------------------------------------------------------+
| bitmap_or_count(bitmap_from_string('1,2,3'), bitmap_from_string('3,4,5'), to_bitmap(100), NULL) |
+-------------------------------------------------------------------------------------------------+
|                                                                                            NULL |
+-------------------------------------------------------------------------------------------------+
```
