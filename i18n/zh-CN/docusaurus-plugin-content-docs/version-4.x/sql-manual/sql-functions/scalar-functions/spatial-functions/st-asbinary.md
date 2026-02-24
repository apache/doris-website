---
{
    "title": "ST_ASBINARY",
    "language": "zh-CN",
    "description": "将一个几何图形转换为标准的 WKB (Well-Known Binary) 二进制表示形式。WKB 是一种用于表示地理空间数据的二进制格式，广泛应用于地理信息系统 (GIS) 中。"
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

将一个几何图形转换为标准的 WKB (Well-Known Binary) 二进制表示形式。WKB 是一种用于表示地理空间数据的二进制格式，广泛应用于地理信息系统 (GIS) 中。

目前支持的几何图形类型包括：Point（点）、LineString（线）、Polygon（多边形）

## 语法

```sql
ST_ASBINARY( <geo>)
```

## 参数

| 参数 | 说明       |
| -- |----------|
| `<geo>` | 需要转换为 WKB 格式的几何图形对象,包括：Point（点）、LineString（线）、Polygon（多边形） |

## 返回值

返回该几何图形的 WKB 二进制表示，以十六进制字符串形式展示（例如：\x01010000...）。

ST_ASBINARY 存在以下边缘情况：

- 若输入参数为 NULL，返回 NULL。
- 若输入的几何图形类型不支持，返回 NULL。

## 举例


点对象转换

```sql
select ST_AsBinary(st_point(24.7, 56.7));
```

```text
+----------------------------------------------+
| st_asbinary(st_point(24.7, 56.7))            |
+----------------------------------------------+
| \x01010000003333333333b338409a99999999594c40 |
+----------------------------------------------+
```

线对象转换

```sql
select ST_AsBinary(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+--------------------------------------------------------------------------------------+
| st_asbinary(st_geometryfromtext('LINESTRING (1 1, 2 2)'))                            |
+--------------------------------------------------------------------------------------+
| \x010200000002000000000000000000f03f000000000000f03f00000000000000400000000000000040 |
+--------------------------------------------------------------------------------------+
```

多边形对象转换

```sql
select ST_AsBinary(ST_Polygon("POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))"));
```

```text
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| st_asbinary(st_polygon('POLYGON ((114.104486 22.547119,114.093758 22.547753,114.096504 22.532057,114.104229 22.539826,114.106203 22.542680,114.104486 22.547119))'))                                                         |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
| \x01030000000100000006000000f3380ce6af865c402d05a4fd0f8c364041ef8d2100865c403049658a398c3640b9fb1c1f2d865c409d9b36e334883640de921cb0ab865c40cf876709328a36402cefaa07cc865c407b319413ed8a3640f3380ce6af865c402d05a4fd0f8c3640 |
+------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------+
```

不支持的类型MultiPolyGon返回NULL

```sql
mysql> SELECT ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
+-------------------------------------------------------------------------------------------------------------+
| ST_AsBinary(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                        |
+-------------------------------------------------------------------------------------------------------------+
```

NULL 输入


```sql
mysql> SELECT ST_AsBinary(NULL);
+-------------------+
| ST_AsBinary(NULL) |
+-------------------+
| NULL              |
+-------------------+
```

