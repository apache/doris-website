---
{
    "title": "ST_GEOMETRYFROMTEXT",
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

将一个 WKT（Well Known Text）转化为对应的内存的几何形式

## 别名

- ST_GEOMFROMTEXT

## 语法

```sql
ST_GEOMETRYFROMTEXT( <wkt>)
```
## 参数

| 参数    | 说明      |
|-------|---------|
| `<wkt>` | 图形的内存形式 |

支持的WKT格式:
- `POINT` - 空间中的单个点
- `LINESTRING` - 连接的线段序列
- `POLYGON` - 由一个或多个环定义的封闭区域, 要求至少有三个不同的点且首尾闭合
- `MULTIPOLYGON` - 多边形的集合, 要求多边形之间仅能存在有限个离散点的接触

:::info 备注
从 Apache Doris 2.1.10 开始支持 MULTIPOLYGON 格式解析
:::

## 返回值

WKB 的对应的几何存储形式

当输入的 WKT 格式不符合规范或输入为 NULL 时返回 NULL。

## 举例

```sql
-- POINT 样例
SELECT ST_AsText(ST_GeometryFromText("POINT (1 1)"));
```

```text
+-----------------------------------------------+
| ST_AsText(ST_GeometryFromText("POINT (1 1)")) |
+-----------------------------------------------+
| POINT (1 1)                                   |
+-----------------------------------------------+
```

```sql
-- POINT 不合法样例(端点过多)
SELECT ST_AsText(ST_GeometryFromText("POINT (1 1, 2 2)"));
```

```text
+----------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POINT (1 1, 2 2)")) |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+
```

```sql
-- LINESTRING 样例
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```

```sql
-- LINESTRING 不合法样例(端点过少)
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1)"));
```

```text
+----------------------------------------------------+
| ST_AsText(ST_GeometryFromText("LINESTRING (1 1)")) |
+----------------------------------------------------+
| NULL                                               |
+----------------------------------------------------+
```

```sql
-- POLYGON 样例
SELECT ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))"));
```

``` text
+-----------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))")) |
+-----------------------------------------------------------------------+
| POLYGON ((0 0, 1 0, 1 1, 0 1, 0 0))                                   |
+-----------------------------------------------------------------------+
```

```sql
-- POLYGON 不合法样例(首尾不闭合)
SELECT ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1))"));
```

```text
+------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 1 1, 0 1))")) |
+------------------------------------------------------------------+
| NULL                                                             |
+------------------------------------------------------------------+
```

```sql
-- POLYGON 不合法样例(端点过少)
SELECT ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 0 0))"));
```

```text
+-------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("POLYGON ((0 0, 1 0, 0 0))")) |
+-------------------------------------------------------------+
| NULL                                                        |
+-------------------------------------------------------------+
```

```sql
-- MULTIPOLYGON 样例
SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))"));
```

```text
+-----------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))")) |
+-----------------------------------------------------------------------------------------------------------+
| MULTIPOLYGON (((0 0, 1 0, 1 1, 0 1, 0 0)), ((2 2, 3 2, 3 3, 2 3, 2 2)))                                   |
+-----------------------------------------------------------------------------------------------------------+
```

```sql
-- MULTIPOLYGON 样例(仅有有限个离散点接触)
SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0), (4 4, 6 4, 6 6, 4 6, 4 4)), ((4 5, 5 4, 6 5, 5 6, 4 5)))"));
```

```text
+------------------------------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0), (4 4, 6 4, 6 6, 4 6, 4 4)), ((4 5, 5 4, 6 5, 5 6, 4 5)))")) |
+------------------------------------------------------------------------------------------------------------------------------------------+
| MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0), (4 4, 6 4, 6 6, 4 6, 4 4)), ((4 5, 5 4, 6 5, 5 6, 4 5)))                                   |
+------------------------------------------------------------------------------------------------------------------------------------------+
```

``` sql
-- MULTIPOLYGON 不合法样例(存在重叠部分)
SELECT ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0)), ((10 0, 20 0, 20 10, 10 10, 10 0)))"));
```

```text
+----------------------------------------------------------------------------------------------------------------------+
| ST_AsText(ST_GeometryFromText("MULTIPOLYGON (((0 0, 10 0, 10 10, 0 10, 0 0)), ((10 0, 20 0, 20 10, 10 10, 10 0)))")) |
+----------------------------------------------------------------------------------------------------------------------+
| NULL                                                                                                                 |
+----------------------------------------------------------------------------------------------------------------------+
```

```sql
-- 输入 NULL
SELECT ST_AsText(ST_GeometryFromText(NULL));
```

```text
+--------------------------------------+
| ST_AsText(ST_GeometryFromText(NULL)) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```