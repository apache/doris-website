---
{
    "title": "ST_GEOMETRYFROMWKBTYPED（开发版）",
    "language": "zh-CN",
    "description": "将十六进制ISO WKB（XY、XYZ、XYM、XYZM） 构造为 GEOMETRY 类型值，保留原始字节并使用默认空间参数，适用于 Iceberg V3 空间列写入。支持基础几何与 EMPTY；输入为 NULL 或包含非法 WKB、不支持的 EWKB 标记或内嵌 SRID时返回 NULL。"
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

开发版将十六进制 ISO WKB 转为 `GEOMETRY('OGC:CRS84')`。结果保留原始 WKB，可写入 Iceberg 的 geometry 列。输入为 NULL 时返回 NULL。

## 语法

```sql
ST_GEOMETRYFROMWKBTYPED(<wkb_hex>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<wkb_hex>` | 十六进制 ISO WKB 字符串。支持 Point、LineString、Polygon、MultiPoint、MultiLineString、MultiPolygon 和 GeometryCollection，包括 EMPTY 及 Z/M 坐标。 |

## 返回值

返回可空的 `GEOMETRY`。非法十六进制、非法 WKB、PostGIS EWKB 维度标记或内嵌 SRID、无穷坐标和超出默认经纬度范围的坐标均返回 NULL。EMPTY 是有效的空间值。

## 示例

将点 (1, 2) 的 WKB 转成空间值。

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED('0101000000000000000000F03F0000000000000040'));
```

```text
POINT (1 2)
```

传入 NULL。

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED(NULL));
```

```text
NULL
```

传入带内嵌 SRID 的 EWKB。

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED('01010000208A11000068270210774C5D40B8DECA334C3B4240'));
```

```text
NULL
```

建表、参数保留及计算限制请参见 [Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
