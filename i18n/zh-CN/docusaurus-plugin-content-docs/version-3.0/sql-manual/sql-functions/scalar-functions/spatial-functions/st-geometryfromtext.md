---
{
    "title": "ST_GEOMETRYFROMTEXT",
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

将一个线型 WKT（Well Known Text）转化为对应的内存的几何形式

## 别名

- ST_GEOMFROMTEXT

## 语法

```sql
ST_GEOMETRYFROMTEXT( <wkt>)
```
## 参数

| 参数 | 说明      |
| -- |---------|
| `<wkt>` | 图形的内存形式 |

## 支持的WKT格式

- `POINT` - 空间中的单个点
- `LINESTRING` - 连接的线段序列
- `POLYGON` - 由一个或多个环定义的封闭区域
- `MULTIPOLYGON` - 多边形的集合

:::info 备注
从 Apache Doris 3.0.6 开始支持 MULTIPOLYGON 格式解析
:::

## 返回值

WKB 的对应的几何存储形式

## 举例

```sql
SELECT ST_AsText(ST_GeometryFromText("LINESTRING (1 1, 2 2)"));
```

```text
+---------------------------------------------------------+
| st_astext(st_geometryfromtext('LINESTRING (1 1, 2 2)')) |
+---------------------------------------------------------+
| LINESTRING (1 1, 2 2)                                   |
+---------------------------------------------------------+
```


