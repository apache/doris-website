---
{
    "title": "CEIL",
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

对浮点及定点小数按特定位数向上取整，返回取整过后的浮点或定点数。

## 语法

```sql
CEIL(<a>[, <d>])
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<a>` | 浮点(Double)或定点(Decimal)参数，表示要进行取整的参数 |
| `<d>` | 可选的，整数，表示舍入目标位数，正数为向小数点后舍入，负数为向小数点前舍入，`0` 表示舍入到整数。不填写时等同于 `<d> = 0` |

## 返回值

按照下面规则返回最小的大于或者等于 `<a>` 的舍入数字:

舍入到 `1/(10^d)` 位，即，使结果可整除`1/(10^d)`。如果 `1/(10^d)` 不精确，则舍入位数为相应数据类型的最接近的数字。

对于 Decimal 类型的入参 `<a>`，假设其类型为 `Decimal(p, s)`，则返回值类型为：

- `Decimal(p, 0)`，若 `<d> <= 0`
- `Decimal(p, <d>)`，若 `0 < <d> <= s`
- `Decimal(p, s)`，若 `<d> > s`

## 别名

- DCEIL
- CEILING

## 举例

```sql
select ceil(123.456);
```

```text
+---------------+
| ceil(123.456) |
+---------------+
|           124 |
+---------------+
```

```sql
select ceil(123.456, 2);
```

```text
+------------------+
| ceil(123.456, 2) |
+------------------+
|           123.46 |
+------------------+
```

```sql
select ceil(123.456, -2);
```

```text
+-------------------+
| ceil(123.456, -2) |
+-------------------+
|               200 |
+-------------------+
```

```sql
select ceil(123.45, 1), ceil(123.45), ceil(123.45, 0), ceil(123.45, -1);
```

```text
+-----------------+--------------+-----------------+------------------+
| ceil(123.45, 1) | ceil(123.45) | ceil(123.45, 0) | ceil(123.45, -1) |
+-----------------+--------------+-----------------+------------------+
|           123.5 |          124 |             124 |              130 |
+-----------------+--------------+-----------------+------------------+
```

```sql
select ceil(x, 2) from ( select cast(123.456 as decimal(6,3)) as x from numbers("number"="5") )t;
```

```text
+------------+
| ceil(x, 2) |
+------------+
|     123.46 |
|     123.46 |
|     123.46 |
|     123.46 |
|     123.46 |
+------------+
```
