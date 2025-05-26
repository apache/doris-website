---
{
    "title": "ST_DISJOINT",
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

判断两个几何图形是否完全不相交（即没有任何公共点）。若两图形的边界、内部均无交集，则返回 `1`，否则返回 `0`。

:::info 备注
从 Apache Doris 2.1.10 开始支持该函数
:::

## 语法

```sql
ST_DISJOINT( <shape1>, <shape2> )
```

## 参数

| 参数       | 说明                     |
|----------|------------------------|
| `<shape1>` | 传入的几何图形，用于判断是否与 shape2 不相交 |
| `<shape2>` | 传入的几何图形，用于判断是否与 shape1 不相交 |

## 返回值

返回 1: shape1 图形与图形 shape2 不相交

返回 0: shape1 图形与图形 shape2 相交


## 举例

```sql
SELECT ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5));
```

```text
+------------------------------------------------------------------------------------+
| ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(5, 5)) |
+------------------------------------------------------------------------------------+
|                                                                                  0 |
+------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50));
```

```text
+--------------------------------------------------------------------------------------+
| ST_Disjoint(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Point(50, 50)) |
+--------------------------------------------------------------------------------------+
|                                                                                    1 |
+--------------------------------------------------------------------------------------+
```
