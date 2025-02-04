---
{
    "title": "ST_AREA",
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

计算地球球面上区域的面积

## 语法

```sql
ST_Area_Square_Meters( <geo>)
ST_Area_Square_Km( <geo>)
```
## 参数

| 参数 | 说明     |
| -- |--------|
| `<geo>` | 地球球面位置 |

## 返回值

ST_Area_Square_Meters( <geo>) 返回的单位是平方米

ST_Area_Square_Km( <geo>) 返回的单位是平方千米。

## 举例

```sql
SELECT ST_Area_Square_Meters(ST_Circle(0, 0, 1));
```

```text
+-------------------------------------------------+
| st_area_square_meters(st_circle(0.0, 0.0, 1.0)) |
+-------------------------------------------------+
|                              3.1415926535897869 |
+-------------------------------------------------+
```

```sql
SELECT ST_Area_Square_Km(ST_Polygon("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))"));
```

```text
+----------------------------------------------------------------------+
| st_area_square_km(st_polygon('POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))')) |
+----------------------------------------------------------------------+
|                                                   12364.036567076409 |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Area_Square_Meters(ST_Point(0, 1));
```

```text
+-------------------------------------------+
| st_area_square_meters(st_point(0.0, 1.0)) |
+-------------------------------------------+
|                                         0 |
+-------------------------------------------+
```

```sql
SELECT ST_Area_Square_Meters(ST_LineFromText("LINESTRING (1 1, 2 2)"));
```

```text
+-----------------------------------------------------------------+
| st_area_square_meters(st_linefromtext('LINESTRING (1 1, 2 2)')) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```

