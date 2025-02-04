---
{
    "title": "BITMAP_MIN",
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

计算并返回 Bitmap 中的最小值。

## 语法

```sql
bitmap_min(<bitmap>)
```

## 参数

| 参数        | 描述             |
|-----------|----------------|
| `<bitmap>` | Bitmap 类型列或表达式 |

## 返回值

Bitmap 中的最小值。  
若 Bitmap 为空则返回 `NULL`。

## 示例

计算一个空 Bitmap 的最小值：

```sql
select bitmap_min(bitmap_from_string('')) value;
```

结果如下：

```text
+-------+
| value |
+-------+
|  NULL |
+-------+
```

计算包含多个元素的 Bitmap 的最小值：

```sql
select bitmap_min(bitmap_from_string('1,9999999999')) value;
```

结果如下：

```text
+-------+
| value |
+-------+
|     1 |
+-------+
```
