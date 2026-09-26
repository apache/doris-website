---
{
    "title": "ST_DIFFERENCE",
    "language": "zh-CN",
    "description": "返回两个多边形的差集几何图形（A - B），即属于多边形 A 但不属于多边形 B 的点集。"
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

返回两个多边形的差集几何图形。差集 A - B 是属于多边形 A 但不属于多边形 B 的所有点的集合。

目前仅支持 Polygon × Polygon 运算。如果任一输入不是 Polygon 类型，则返回 NULL。

## 语法

```sql
ST_DIFFERENCE( <polygon1>, <polygon2>)
```

## 参数

| 参数 | 说明 |
|----------|------------------------|
| `<polygon1>` | 第一个多边形几何图形（A），必须为 Polygon 类型。 |
| `<polygon2>` | 第二个多边形几何图形（B），从第一个中减去，必须为 Polygon 类型。 |

## 返回值

返回一个 Polygon 几何图形，表示 polygon1 减去 polygon2 的差集（A - B）。

ST_DIFFERENCE 存在以下边缘情况：

- 若任一输入参数为 NULL，返回 NULL。
- 若任一输入不是 Polygon 类型（如 Point、Line、MultiPolygon、Circle），返回 NULL。
- 若 polygon1 完全被 polygon2 包含（结果为空），返回 NULL。
- 若两个多边形相同（结果为空），返回 NULL。
- 若两个多边形不相交，返回原始的 polygon1。
- 当 polygon2 完全在 polygon1 内部时，结果可能包含孔洞（内环）。

## 举例

两个重叠多边形的差集

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((5 10.0374230459107, 0 10, 0 0, 10 0, 10 5.01900181748964, 5 5, 5 10.0374230459107))            |
+----------------------------------------------------------------------------------------------------------+
```

两个不相交多边形的差集（返回原始多边形）

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((20 20, 30 20, 30 30, 20 30, 20 20))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                                                                  |
+----------------------------------------------------------------------------------------------------------+
```

相同多边形的差集（返回 NULL）

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'))) |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

内部多边形的差集（结果带孔洞）

```sql
SELECT ST_AsText(ST_Difference(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((3 3, 7 3, 7 7, 3 7, 3 3))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((3 3, 7 3, 7 7, 3 7, 3 3))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0), (3 3, 7 3, 7 7, 3 7, 3 3))                                      |
+----------------------------------------------------------------------------------------------------------+
```

参数为 NULL（返回 NULL）

```sql
SELECT ST_AsText(ST_Difference(NULL, ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_difference(NULL, st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))                     |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```
