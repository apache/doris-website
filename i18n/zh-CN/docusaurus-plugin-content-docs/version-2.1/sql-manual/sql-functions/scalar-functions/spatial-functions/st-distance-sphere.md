---
{
    "title": "ST_DISTANCE_SPHERE",
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

计算地球两点之间的球面距离，单位为 米。传入的参数分别为 X 点的经度，X 点的纬度，Y 点的经度，Y 点的纬度。

## 语法

```sql
ST_Distance_Sphere( <x_lng>, <x_lat>, <y_lng>, <y_lat>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x_lng>` | 经度数据，合理的取值范围是 [-180, 180] |
| `<y_lng>` | 经度数据，合理的取值范围是 [-180, 180] |
| `<x_lat>` | 纬度数据，合理的取值范围是 [-90, 90] |
| `<y_lat>` | 纬度数据，合理的取值范围是 [-90, 90] |

## 返回值

两点之间的球面距离

## 举例

```sql
select st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219);
```

```text
+----------------------------------------------------------------------------+
| st_distance_sphere(116.35620117, 39.939093, 116.4274406433, 39.9020987219) |
+----------------------------------------------------------------------------+
|                                                         7336.9135549995917 |
+----------------------------------------------------------------------------+
```

