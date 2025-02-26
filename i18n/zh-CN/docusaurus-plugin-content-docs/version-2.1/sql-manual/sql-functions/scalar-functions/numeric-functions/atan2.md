---
{
    "title": "ATAN2",
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

返回 'y' / 'x' 的反正切。

## 语法

```sql
ATAN2(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<x>` | 参与计算的反正切的值，表示水平坐标（或 x 值），从原点 (0,0) 沿 x 轴的距离。 |
| `<y>` | 参与计算的反正切的值，表示垂直坐标（或 y 值），从原点 (0,0) 沿 y 轴的距离。 |

## 返回值

参数 y / x 的反正切值

## 举例

```sql
select atan2(0.1, 0.2);
```

```text
+---------------------+
| atan2(0.1, 0.2)     |
+---------------------+
| 0.46364760900080609 |
+---------------------+
```

```sql
select atan2(1.0, 1.0);
```

```text
+---------------------+
| atan2(1.0, 1.0)     |
+---------------------+
| 0.78539816339744828 |
+---------------------+
```
