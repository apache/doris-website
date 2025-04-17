---
{
    "title": "ST_Y",
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

当 point 是一个合法的 POINT 类型时，返回对应的 Y 坐标值

## 语法

```sql
ST_Y( <point>)
```

## 参数

| 参数   | 说明       |
|------|----------|
| `<point>` | 二维点的几何坐标 |

## 返回值

几何坐标中的 Y 值

## 举例

```sql
SELECT ST_Y(ST_Point(24.7, 56.7));
```

```text
+----------------------------+
| ST_Y(ST_Point(24.7, 56.7)) |
+----------------------------+
| 56.7                       |
+----------------------------+
```

