---
{
    "title": "SQRT",
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

返回一个值的平方根，要求输入值大于或等于0。特殊情况：

- 当参数为小于 0 时，返回 NULL

## 别名

- DSQRT

## 语法

```sql
SQRT(<a>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>` | 需要被计算平方根的值 |

## 返回值

参数 a 的平方根。特殊情况：

- 当参数为小于 0 时，返回 NULL

## 举例

```sql
select sqrt(9),sqrt(2),sqrt(-1)
```

```text
+-------------------------+-------------------------+--------------------------+
| sqrt(cast(9 as DOUBLE)) | sqrt(cast(2 as DOUBLE)) | sqrt(cast(-1 as DOUBLE)) |
+-------------------------+-------------------------+--------------------------+
|                       3 |      1.4142135623730951 |                     NULL |
+-------------------------+-------------------------+--------------------------+
```
