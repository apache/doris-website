---
{
    "title": "ST_X",
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

当 point 是一个合法的 POINT 类型时，返回对应的 X 坐标值

## 语法

```sql
ST_X( <point>)
```
## 参数

| 参数   | 说明       |
|------|----------|
| `<point>` | 二维点的几何坐标 |

## 返回值

几何坐标中的 X 值

## 举例

```sql
SELECT ST_X(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| st_x(st_point(24.7, 56.7)) |
+----------------------------+
|                       24.7 |
+----------------------------+
```