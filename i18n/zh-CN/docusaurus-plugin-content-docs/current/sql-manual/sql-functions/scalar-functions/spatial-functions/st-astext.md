---
{
    "title": "ST_ASTEXT",
    "language": "zh-CN",
    "description": "将一个几何图形转换为 WKT (Well-Known Text) 文本表示形式。WKT 是一种用于表示地理空间数据的文本格式，广泛应用于地理信息系统 (GIS) 中。"
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

将一个几何图形转换为 WKT (Well-Known Text) 文本表示形式。WKT 是一种用于表示地理空间数据的文本格式，广泛应用于地理信息系统 (GIS) 中。

目前支持的几何图形类型包括：Point（点）、LineString（线）、Polygon（多边形）、MultiPolygon（多多边形），Circle(圆)

## 别名

- ST_ASWKT

## 语法

```sql
ST_ASTEXT( <geo>)
```

# 参数

| 参数 | 说明       |
| -- |----------|
| `<geo>` | 需要转换为 WKT 格式的几何图形对象 |

## 返回值

该几何图形的 WKT 表示形式
ST_ASTEXT 存在以下边缘情况：

- 若输入参数为 NULL，返回 NULL。

## 举例


点对象转换
```sql
SELECT ST_AsText(ST_Point(24.7, 56.7));
```

```text
+---------------------------------+
| st_astext(st_point(24.7, 56.7)) |
+---------------------------------+
| POINT (24.7 56.7)               |
+---------------------------------+
```

线对象转换

```sql
mysql> SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
+---------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)")) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```

多边形对象转换

```sql
mysql> SELECT ST_AsText(ST_Polygon("POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))"));
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_Polygon("POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))")) |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| POLYGON ((114.104486 22.547119, 114.093758 22.547753, 114.096504 22.532057, 114.104229 22.539826, 114.106203 22.54268, 114.104486 22.547119))                      |
+--------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

多多边形对象转换

```sql
mysql> SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
+-----------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-----------------------------------------------------------------------------------------------------------+
| MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))                                   |
+-----------------------------------------------------------------------------------------------------------+
```

圆的对象转换

```sql
mysql> SELECT ST_AsText(ST_Circle(116.39748, 39.90882, 0.5));
+------------------------------------------------+
| ST_AsText(ST_Circle(116.39748, 39.90882, 0.5)) |
+------------------------------------------------+
| CIRCLE ((116.39748 39.90882), 0.5)             |
+------------------------------------------------+
```


NULL 输入

```sql
mysql> SELECT ST_AsText(NULL);
+-----------------+
| ST_AsText(NULL) |
+-----------------+
| NULL            |
+-----------------+
```