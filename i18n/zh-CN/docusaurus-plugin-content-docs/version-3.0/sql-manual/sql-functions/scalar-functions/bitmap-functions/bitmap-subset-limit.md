---
{
    "title": "BITMAP_SUBSET_LIMIT",
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

从不小于指定位置 position 开始，按照指定基数 cardinality_limit 为上限截取 Bitmap 元素，返回一个 Bitmap 子集。

## 语法

```sql
bitmap_subset_limit(<bitmap>, <position>, <cardinality_limit>)
```

## 参数

| 参数                    | 描述          |
|-----------------------|-------------|
| `<bitmap>`            | Bitmap 值    |
| `<position>`          | 范围开始的位置（包含） |
| `<cardinality_limit>` | 基数上限        |

## 返回值

指定范围的子集 Bitmap。

## 示例

获取从位置 0 开始，基数限制为 3 的 Bitmap 子集：

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 0, 3)) value;
```

结果如下：

```text
+-----------+
| value     |
+-----------+
| 1,2,3     |
+-----------+
```

获取从位置 4 开始，基数限制为 3 的 Bitmap 子集：

```sql
select bitmap_to_string(bitmap_subset_limit(bitmap_from_string('1,2,3,4,5'), 4, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 4,5   |
+-------+
```
