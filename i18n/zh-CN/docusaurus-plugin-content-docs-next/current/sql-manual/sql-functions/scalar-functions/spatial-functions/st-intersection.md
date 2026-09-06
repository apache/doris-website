---
{
    "title": "ST_INTERSECTION",
    "language": "zh-CN",
    "description": "返回两个多边形的交集几何图形，即两个多边形共有的点集。"
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

返回两个多边形的交集几何图形，即两个多边形共有的点集。

目前仅支持 Polygon × Polygon 运算。如果任一输入不是 Polygon 类型，则返回 NULL。

## 语法

```sql
ST_INTERSECTION( <polygon1>, <polygon2>)
```

## 参数

| 参数 | 说明 |
|----------|------------------------|
| `<polygon1>` | 第一个多边形几何图形，必须为 Polygon 类型。 |
| `<polygon2>` | 第二个多边形几何图形，必须为 Polygon 类型。 |

## 返回值

返回一个 Polygon 几何图形，表示两个输入多边形的交集。

ST_INTERSECTION 存在以下边缘情况：

- 若任一输入参数为 NULL，返回 NULL。
- 若任一输入不是 Polygon 类型（如 Point、Line、MultiPolygon、Circle），返回 NULL。
- 若两个多边形不相交（无公共区域），返回 NULL。
- 若两个输入为相同的多边形，返回该多边形本身。

## 举例

两个重叠多边形的交集

```sql
SELECT ST_AsText(ST_Intersection(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((5 5, 15 5, 15 15, 5 15, 5 5))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((5 5, 10 5.01900181748964, 10 10, 5 10.0374230459107, 5 5))                                     |
+----------------------------------------------------------------------------------------------------------+
```

两个不相交多边形的交集（返回 NULL）

```sql
SELECT ST_AsText(ST_Intersection(ST_Polygon("POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))"), ST_Polygon("POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_polygon('POLYGON ((0 0, 5 0, 5 5, 0 5, 0 0))'), st_polygon('POLYGON ((10 10, 15 10, 15 15, 10 15, 10 10))'))) |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

相同多边形的交集（返回多边形本身）

```sql
SELECT ST_AsText(ST_Intersection(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))'))) |
+----------------------------------------------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                                                                  |
+----------------------------------------------------------------------------------------------------------+
```

不支持的类型（Point × Polygon，返回 NULL）

```sql
SELECT ST_AsText(ST_Intersection(ST_Point(1, 1), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(st_point(1.0, 1.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))    |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```

参数为 NULL（返回 NULL）

```sql
SELECT ST_AsText(ST_Intersection(NULL, ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))")));
```

```text
+----------------------------------------------------------------------------------------------------------+
| st_astext(st_intersection(NULL, st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')))                   |
+----------------------------------------------------------------------------------------------------------+
| NULL                                                                                                      |
+----------------------------------------------------------------------------------------------------------+
```
