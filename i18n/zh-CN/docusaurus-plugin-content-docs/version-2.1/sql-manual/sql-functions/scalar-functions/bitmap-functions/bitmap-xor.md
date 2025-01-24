---
{
    "title": "BITMAP_XOR",
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

计算两个及以上输入 Bitmap 的差集，返回新的 Bitmap。

## 语法

```sql
bitmap_xor(<bitmap1>, <bitmap2>, ..., <bitmapN>)
```

## 参数

| 参数          | 描述           |
|-------------|--------------|
| `<bitmap1>` | 第一个 Bitmap   |
| `<bitmap2>` | 第二个 Bitmap   |
| ...         | ...          |
| `<bitmapN>` | 第 N 个 Bitmap |

## 返回值

多个 Bitmap 差集的 Bitmap。

## 示例

计算两个 Bitmap 的对称差集：

```sql
select bitmap_count(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) cnt;
```

结果如下：

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

将两个 Bitmap 的对称差集转换为字符串：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4')));
```

结果如下：

```text
+----------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'))) |
+----------------------------------------------------------------------------------------+
| 1,4                                                                                    |
+----------------------------------------------------------------------------------------+
```

计算三个 Bitmap 的对称差集：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5')));
```

结果如下：

```text
+---------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'))) |
+---------------------------------------------------------------------------------------------------------------------+
| 1,3,5                                                                                                               |
+---------------------------------------------------------------------------------------------------------------------+
```

计算多个 Bitmap（包括一个空 Bitmap）的对称差集：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty()));
```

结果如下：

```text
+-------------------------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), bitmap_empty())) |
+-------------------------------------------------------------------------------------------------------------------------------------+
| 1,3,5                                                                                                                               |
+-------------------------------------------------------------------------------------------------------------------------------------+
```

计算多个 Bitmap（包括一个 `NULL` 值）的对称差集：

```sql
select bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL));
```

结果如下：

```text
+---------------------------------------------------------------------------------------------------------------------------+
| bitmap_to_string(bitmap_xor(bitmap_from_string('2,3'), bitmap_from_string('1,2,3,4'), bitmap_from_string('3,4,5'), NULL)) |
+---------------------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                                      |
+---------------------------------------------------------------------------------------------------------------------------+
```
