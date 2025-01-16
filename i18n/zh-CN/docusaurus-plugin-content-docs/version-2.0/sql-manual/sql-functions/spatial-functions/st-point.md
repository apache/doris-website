---
{
    "title": "ST_POINT",
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

## ST_Point
## 描述

通过给定的 X 坐标值，Y 坐标值返回对应的 Point。

当前这个值只是在球面集合上有意义，X/Y 对应的是经度/纬度 (longitude/latitude);

## 语法

```sql
POINT ST_Point(DOUBLE x, DOUBLE y)
```
## 参数

| 参数  | 说明  |
|-----|-----|
| `x` | 横坐标 |
| `y` | 纵坐标 |

## 返回值

给定横坐标以及纵坐标对应的位置信息

## 举例

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