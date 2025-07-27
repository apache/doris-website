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

当 point 是一个合法的 POINT 类型时，返回对应的 Y 坐标值。在地理空间场景中，Y 坐标通常对应 纬度（Latitude），取值范围为 [-90.0, 90.0]（单位：度）

## 语法

```sql
ST_Y( <point>)
```

## 参数

| 参数   | 说明       |
|------|----------|
| `<point>` | 待提取 Y 坐标的几何对象，必须是有效的 POINT 类型（二维点）。其中，Y（纬度）范围为 [-90.0, 90.0]，X（经度）范围为 [-180.0, 180.0]。 |

## 返回值

几何坐标中的 Y 值，类型为双精度浮点数（Double）。

若输入为有效的 POINT 对象，返回该点的 Y 坐标（纬度）。
若输入为 NULL、空点（POINT EMPTY）、三维点或无效点（如纬度超出范围），返回 NULL。

## 举例

正常坐标
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

输入为空点（POINT EMPTY

```sql
mysql> SELECT ST_Y(ST_GeometryFromText("POINT EMPTY"));
+------------------------------------------+
| ST_Y(ST_GeometryFromText("POINT EMPTY")) |
+------------------------------------------+
|                                     NULL |
+------------------------------------------+
```
输入为三维点（不支持）

```sql
mysql> SELECT ST_Y(ST_GeometryFromText("POINT (10 20 30)"));
+-----------------------------------------------+
| ST_Y(ST_GeometryFromText("POINT (10 20 30)")) |
+-----------------------------------------------+
|                                          NULL |
+-----------------------------------------------+
```


输入为 NULL

```sql
mysql> SELECT ST_Y(NULL);
+------------+
| ST_Y(NULL) |
+------------+
|       NULL |
+------------+
```

纬度超出范围（无效点）

```sql
mysql> SELECT ST_Y(ST_Point(116.4, 91));
+---------------------------+
| ST_Y(ST_Point(116.4, 91)) |
+---------------------------+
|                      NULL |
+---------------------------+
```

经度超出范围（无效点）

```sql
mysql> SELECT ST_Y(ST_Point(190, 39.9));
+---------------------------+
| ST_Y(ST_Point(190, 39.9)) |
+---------------------------+
|                      NULL |
+---------------------------+
```