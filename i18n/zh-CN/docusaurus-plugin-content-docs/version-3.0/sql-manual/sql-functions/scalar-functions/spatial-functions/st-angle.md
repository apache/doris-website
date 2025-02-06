---
{
    "title": "ST_ANGLE",
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

输入三个点，它们表示两条相交的线。返回这些线之间的夹角。

## 语法

```sql
ST_ANGLE( <point1>, <point2>, <point3>)
```

## 参数

| 参数       | 说明                       |
|----------|--------------------------|
| `<point1>` | 第一条直线的第一个端点              |
| `<point2>` | 第一条直线的第二个端点且是第二条直线的第一个端点 |
| `<point3>` | 第二条直线的第二个端点              |

## 返回值

这些线之间的夹角以弧度表示，范围为 [0, 2pi)。夹角按顺时针方向从第一条线开始测量，直至第二条线。

ST_ANGLE 存在以下边缘情况：

- 如果点 2 和点 3 相同，则返回 NULL。
- 如果点 2 和点 1 相同，则返回 NULL。
- 如果点 2 和点 3 是完全对映点，则返回 NULL。
- 如果点 2 和点 1 是完全对映点，则返回 NULL。
- 如果任何输入地理位置不是单点或为空地理位置，则会抛出错误。

## 举例

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(0, 1));
```

```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------------------------+
|                                                     4.71238898038469 |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Angle(ST_Point(0, 0),ST_Point(1, 0),ST_Point(0, 1));
```

```text
+----------------------------------------------------------------------+
| st_angle(st_point(0.0, 0.0), st_point(1.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------------------------+
|                                                  0.78547432161873854 |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(1, 0));
```

```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(1.0, 0.0)) |
+----------------------------------------------------------------------+
|                                                                    0 |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Angle(ST_Point(1, 0),ST_Point(0, 0),ST_Point(0, 0));
```

```text
+----------------------------------------------------------------------+
| st_angle(st_point(1.0, 0.0), st_point(0.0, 0.0), st_point(0.0, 0.0)) |
+----------------------------------------------------------------------+
|                                                                 NULL |
+----------------------------------------------------------------------+
```

```sql
SELECT ST_Angle(ST_Point(0, 0),ST_Point(-30, 0),ST_Point(150, 0));
```

```text
+--------------------------------------------------------------------------+
| st_angle(st_point(0.0, 0.0), st_point(-30.0, 0.0), st_point(150.0, 0.0)) |
+--------------------------------------------------------------------------+
|                                                                     NULL |
+--------------------------------------------------------------------------+
```

