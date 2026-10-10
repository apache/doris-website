---
{
    "title": "ST_SYMDIFFERENCE",
    "language": "zh-CN",
    "description": "返回两个多边形的对称差集几何图形（A ∪ B - A ∩ B），即属于其中一个多边形但不同时属于两者的点集。"
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

返回两个多边形的对称差集几何图形。对称差集是属于多边形 A 或多边形 B，但不同时属于两者的所有点的集合。等价于 (A ∪ B) - (A ∩ B)，也等价于 (A - B) ∪ (B - A)。

目前仅支持 Polygon × Polygon 运算。如果任一输入不是 Polygon 类型，则返回 NULL。

## 语法

```sql
ST_SYMDIFFERENCE( <polygon1>, <polygon2>)
```

## 参数

| 参数 | 说明 |
|----------|------------------------|
| `<polygon1>` | 第一个多边形几何图形，必须为 Polygon 类型。 |
| `<polygon2>` | 第二个多边形几何图形，必须为 Polygon 类型。 |

## 返回值

返回一个 Polygon 几何图形，表示两个输入多边形的对称差集。

ST_SYMDIFFERENCE 存在以下边缘情况：

- 若任一输入参数为 NULL，返回 NULL。
- 若任一输入不是 Polygon 类型（如 Point、Line、MultiPolygon、Circle），返回 NULL。
- 若两个多边形相同（对称差集为空），返回 NULL。
- 若两个多边形不相交，返回包含两个多边形的多区域多边形。
- 该运算是对称的：ST_SYMDIFFERENCE(A, B) = ST_SYMDIFFERENCE(B, A)。

## 举例

两个重叠多边形的对称差集

```sql
SELECT ST_AsText(ST_SymDifference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((5 10.0374230459107, 0 10, 0 0, 10 0, 10 5.01900181748964, 5 5, 5 10.0374230459107), (5 10.0374230459107, 10 10, 10 5.01900181748964, 15 5, 15 15, 5 15, 5 10.0374230459107)) |
+----------------------------------------------------------------------------------------------------------+
```

两个不相交多边形的对称差集（返回两个多边形）

```sql
SELECT ST_AsText(ST_SymDifference(ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"), ST_Polygon("POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(st_polygon('POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))'), st_polygon('POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0), (10 10, 15 10, 15 15, 10 15, 10 10))                                |
+----------------------------------------------------------------------------------------------------------+
```

相同多边形的对称差集（返回 NULL）

```sql
SELECT ST_AsText(ST_SymDifference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'))) |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

参数为 NULL（返回 NULL）

```sql
SELECT ST_AsText(ST_SymDifference(NULL, ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_symdifference(NULL, st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))                  |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```
