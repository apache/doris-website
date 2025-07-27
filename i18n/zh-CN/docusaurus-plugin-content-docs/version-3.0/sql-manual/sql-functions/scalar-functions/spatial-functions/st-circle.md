---
{
    "title": "ST_CIRCLE",
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

将一个 WKT（Well Known Text）转化为地球球面上的一个圆。

## 语法

```sql
ST_CIRCLE( <center_lng>, <center_lat>, <radius>)
```
## 参数

| 参数 | 说明 |
| -- | -- |
| `<center_lng>` | 	圆心的经度，类型为 DOUBLE，取值范围为 [-180, 180] |
| `<center_lat>` |	圆心的纬度，类型为 DOUBLE，取值范围为 [-180, 180] |
| `<radius>` | 	圆的半径，类型为 DOUBLE，单位为 米|


## 返回值

返回地球球面上的圆，类型为 GeoCircle。其 WKT 表示形式为 CIRCLE ((<center_lng> <center_lat>), <radius>)，其中包含圆心坐标和半径信息。

ST_CIRCLE 存在以下边缘情况：

- 若任何输入参数为 NULL，返回 NULL。
- 若 <center_lng> 超出 [-180, 180] 或 <center_lat> 超出 [-90, 90]，返回 NULL。
- 若 <radius> 为 0，返回以圆心为唯一点的特殊圆（WKT 表示为 CIRCLE ((<center_lng> <center_lat>), 0)）。

## 举例

基本用法（正常圆）

```sql
SELECT ST_AsText(ST_Circle(111, 64, 10000));
```

```text
+--------------------------------------------+
| st_astext(st_circle(111.0, 64.0, 10000.0)) |
+--------------------------------------------+
| CIRCLE ((111 64), 10000)                   |
+--------------------------------------------+
```

赤道上的圆（纬度 0°）

```sql
mysql> SELECT ST_AsText(ST_Circle(0, 0, 5000));
+----------------------------------+
| ST_AsText(ST_Circle(0, 0, 5000)) |
+----------------------------------+
| CIRCLE ((0 0), 5000)             |
+----------------------------------+
```


半径为 0 的圆（退化为点）

```sql
mysql> SELECT ST_AsText(ST_Circle(120, 30, 0));
+----------------------------------+
| ST_AsText(ST_Circle(120, 30, 0)) |
+----------------------------------+
| CIRCLE ((120 30), 0)             |
+----------------------------------+
```

无效参数（经度超出范围）

```sql
mysql> SELECT ST_AsText(ST_Circle(190, 30, 1000));
+-------------------------------------+
| ST_AsText(ST_Circle(190, 30, 1000)) |
+-------------------------------------+
| NULL                                |
+-------------------------------------+
```

参数为 NULL

```sql
mysql> SELECT ST_AsText(ST_Circle(NULL, 30, 1000));
+--------------------------------------+
| ST_AsText(ST_Circle(NULL, 30, 1000)) |
+--------------------------------------+
| NULL                                 |
+--------------------------------------+
```