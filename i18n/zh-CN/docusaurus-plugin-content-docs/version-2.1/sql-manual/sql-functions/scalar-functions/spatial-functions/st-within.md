---
{
    "title": "ST_WITHIN",
    "language": "zh-CN",
    "description": "判断几何图形 shape1 是否完全位于几何图形 shape2 的内部"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at:

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


## 描述

判断几何图形 shape1 是否完全位于几何图形 shape2 的内部

## 语法

```sql
ST_WITHIN( <shape1>, <shape2>)
```

## 参数

| 参数       | 说明                     |
|----------|------------------------|
| `<shape1>` | 传入的几何图形，用于判断是否在 shape2 内部 |
| `<shape2>` | 传入的几何图形，用于判断是否包含 shape1 |

## 返回值

返回 1:shape1 完全位于 shape2 内部

返回 0:shape1 不完全位于 shape2 内部


## 举例

```sql
SELECT ST_Within(ST_Point(5, 5), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+-------------------------------------------------------------------------------------+
| st_within(st_point(5.0, 5.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+-------------------------------------------------------------------------------------+
|                                                                                   1 |
+-------------------------------------------------------------------------------------+
```

```sql
SELECT ST_Within(ST_Point(50, 50), ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+---------------------------------------------------------------------------------------+
| st_within(st_point(50.0, 50.0), st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+---------------------------------------------------------------------------------------+
|                                                                                     0 |
+---------------------------------------------------------------------------------------+
```
