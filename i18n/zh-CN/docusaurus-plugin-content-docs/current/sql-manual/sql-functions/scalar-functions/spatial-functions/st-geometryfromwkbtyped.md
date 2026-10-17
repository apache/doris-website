---
{
    "title": "ST_GEOMETRYFROMWKBTYPED（开发版）",
    "language": "zh-CN",
    "description": "将十六进制二维 XY WKB 构造为 GEOMETRY 类型值，保留原始字节并使用默认空间参数，适用于 Iceberg V3 空间列写入。支持基础几何与 EMPTY；输入为 NULL 或包含非法 WKB、未支持的维度或 SRID 元数据时返回 NULL。"
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

将十六进制二维 XY WKB 构造为 GEOMETRY 类型值，保留原始字节，使用默认参数 OGC:CRS84。输入为 NULL 时返回 NULL。

本函数属于支持 Iceberg V3 空间类型的开发版本，返回值用于 Iceberg 空间列。历史函数 `ST_GEOMETRYFROMWKB` 和 `ST_GEOMFROMWKB` 继续返回采用历史几何编码的 STRING 值。

## 语法

```sql
ST_GEOMETRYFROMWKBTYPED(<wkb_hex>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<wkb_hex>` | 包含标准二维 XY WKB 十六进制内容的 STRING。支持 Point、LineString、Polygon、MultiPoint、MultiLineString、MultiPolygon 和 GeometryCollection，包括 EMPTY 值；不支持 Z/M 和内嵌 SRID。 |

## 返回值

返回可空的 `GEOMETRY` 类型值，默认参数为 `OGC:CRS84`。非法十六进制或 WKB、不支持的维度或 SRID、无穷坐标及超出地理范围的坐标返回 NULL。EMPTY 是几何值，与 SQL NULL 不同。

## 示例

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED('0101000000000000000000F03F0000000000000040'));
```

```text
POINT (1 2)
```

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED(NULL));
```

```text
NULL
```

```sql
SELECT ST_AsText(ST_GEOMETRYFROMWKBTYPED('01010000208A11000068270210774C5D40B8DECA334C3B4240'));
```

```text
NULL
```

建表、参数保留及计算限制请参见 [Iceberg 空间类型](../../../../lakehouse/catalogs/iceberg-catalog.mdx#iceberg-spatial-types)。
