---
{
    "title": "SUB_BITMAP",
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

从指定位置 position 开始，截取指定个数 cardinality_limit 的 Bitmap 元素，返回一个 Bitmap 子集。

## 语法

```sql
sub_bitmap(<bitmap>, <position>, <cardinality_limit>)
```

## 返回值

指定范围的子集 Bitmap。

## 参数

| 参数        | 描述          |
|-----------|-------------|
| `<bitmap>` | Bitmap 值    |
| `<position>` | 范围开始的位置（包含） |
| `<cardinality_limit>` | 基数上限        |

## 示例

获取从位置 0 开始，基数限制为 3 的 Bitmap 子集：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 0, 3)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 0,1,2 |
+-------+
```

获取从位置 -3 开始，基数限制为 2 的 Bitmap 子集：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), -3, 2)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 2,3   |
+-------+
```

获取从位置 2 开始，基数限制为 100 的 Bitmap 子集：

```sql
select bitmap_to_string(sub_bitmap(bitmap_from_string('1,0,1,2,3,1,5'), 2, 100)) value;
```

结果如下：

```text
+-------+
| value |
+-------+
| 2,3,5 |
+-------+
```
