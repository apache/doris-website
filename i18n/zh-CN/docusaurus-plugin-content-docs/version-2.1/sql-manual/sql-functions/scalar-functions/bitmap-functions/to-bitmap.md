---
{
    "title": "TO_BITMAP",
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

将一个无符号的长整型数转换为 Bitmap。

输入为取值在 0 ~ 18446744073709551615 区间的 unsigned bigint，输出为包含该元素的 bitmap。

## 语法

`to_bitmap(<expr>)`

## 参数

| 参数        | 描述                                     |
|-----------|----------------------------------------|
| `<expr>` | 无符号的长整型数，范围为 0 ~ 18446744073709551615 |

## 返回值

包含对应长整型数的 Bitmap。  
当输入值不在对应范围内时，则返回 `NULL`。

## 示例

将一个整数转换为 Bitmap 并计算 Bitmap 中的元素数量：

```sql
select bitmap_count(to_bitmap(10));
```

结果如下：

```text
+-----------------------------+
| bitmap_count(to_bitmap(10)) |
+-----------------------------+
|                           1 |
+-----------------------------+
```

将一个负整数转换为 Bitmap（该整数在有效范围之外），并将其转换为字符串：

```sql
select bitmap_to_string(to_bitmap(-1));
```

结果如下：

```text
+---------------------------------+
| bitmap_to_string(to_bitmap(-1)) |
+---------------------------------+
|                                 |
+---------------------------------+
```
