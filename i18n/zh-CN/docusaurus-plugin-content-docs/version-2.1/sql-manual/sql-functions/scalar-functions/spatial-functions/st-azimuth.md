---
{
    "title": "ST_AZIMUTH",
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

输入两个点，并返回由点 1 和点 2 形成的线段的方位角。方位角是点 1 的真北方向线与点 1 和点 2 形成的线段之间的角的弧度。

## 语法

```sql
ST_AZIMUTH( <point1>, <point2>)
```
## 参数

| 参数       | 说明           |
|----------|--------------|
| `<point1>` | 用于计算方位角的第一个点 |
| `<point2>` | 用于计算方位角的第二个点 |

## 返回值

正角在球面上按顺时针方向测量。例如，线段的方位角：

- 指北是 0
- 指东是 PI/2
- 指南是 PI
- 指西是 3PI/2

ST_Azimuth 存在以下边缘情况：

- 如果两个输入点相同，则返回 NULL。
- 如果两个输入点是完全对映点，则返回 NULL。
- 如果任一输入地理位置不是单点或为空地理位置，则会抛出错误。

## 举例

```sql
SELECT st_azimuth(ST_Point(1, 0),ST_Point(0, 0));
```

```text
+----------------------------------------------------+
| st_azimuth(st_point(1.0, 0.0), st_point(0.0, 0.0)) |
+----------------------------------------------------+
|                                   4.71238898038469 |
+----------------------------------------------------+
```

```sql
SELECT st_azimuth(ST_Point(0, 0),ST_Point(1, 0));
```

```text
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 0.0), st_point(1.0, 0.0)) |
+----------------------------------------------------+
|                                 1.5707963267948966 |
+----------------------------------------------------+
```

```sql
SELECT st_azimuth(ST_Point(0, 0),ST_Point(0, 1));
```

```text
+----------------------------------------------------+
| st_azimuth(st_point(0.0, 0.0), st_point(0.0, 1.0)) |
+----------------------------------------------------+
|                                                  0 |
+----------------------------------------------------+
```

```sql
SELECT st_azimuth(ST_Point(-30, 0),ST_Point(150, 0));
```

```text
+--------------------------------------------------------+
| st_azimuth(st_point(-30.0, 0.0), st_point(150.0, 0.0)) |
+--------------------------------------------------------+
|                                                   NULL |
+--------------------------------------------------------+
```

