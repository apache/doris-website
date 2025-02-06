---
{
    "title": "ST_POLYGON",
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

将一个 WKT（Well Known Text）转化为对应的多边形内存形式

## 别名

- ST_POLYGONFROMTEXT
- ST_POLYFROMTEXT

## 语法

```sql
ST_POLYGON( <wkt>)
```

## 参数

| 参数   | 说明                 |
|------|--------------------|
| `<wkt>` | 由 POLYGON 函数生成的一个多边形 |

## 返回值

多边形的内存形式。

## 举例

```sql
SELECT ST_AsText(ST_Polygon("POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))"));
```

```text
+------------------------------------------------------------------+
| st_astext(st_polygon('POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))')) |
+------------------------------------------------------------------+
| POLYGON ((0 0, 10 0, 10 10, 0 10, 0 0))                          |
+------------------------------------------------------------------+
```