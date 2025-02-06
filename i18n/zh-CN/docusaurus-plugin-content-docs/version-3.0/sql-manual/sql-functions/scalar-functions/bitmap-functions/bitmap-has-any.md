---
{
    "title": "BITMAP_HAS_ANY",
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

计算两个 Bitmap 是否存在相交元素。

## 语法

```sql
bitmap_has_any(<bitmap1>, <bitmap2>)
```

## 参数

| 参数        | 描述         |
|-----------|------------|
| `<bitmap1>` | 第一个 Bitmap |
| `<bitmap2>` | 第二个 Bitmap |

## 返回值

如果两个 Bitmap 存在相同元素，返回 true；  
如果两个 Bitmap 不存在相同元素，返回 false。

## 示例

检查一个 Bitmap 是否包含另一个 Bitmap 的任意元素：

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(2));
```

结果如下：

```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(2)) |
+--------------------------------------------+
|                                          0 |
+--------------------------------------------+
```

检查一个 Bitmap 是否包含自身的任意元素：

```sql
mysql> select bitmap_has_any(to_bitmap(1), to_bitmap(1));
```

结果如下：

```text
+--------------------------------------------+
| bitmap_has_any(to_bitmap(1), to_bitmap(1)) |
+--------------------------------------------+
|                                          1 |
+--------------------------------------------+
```
