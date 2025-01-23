---
{
"title": "BIT_SHIFT_LEFT",
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
用于 左移 操作的函数，通常用于执行 位移操作，将二进制数字的所有位向左移动指定的位数。它是位运算的一种形式，常用于处理二进制数据或进行高效的数学计算。

对于 BIGINT 类型的最大值 9223372036854775807，进行一位左移的结果将得到 -2。
## 语法
```sql
BIT_SHIFT_LEFT( <x>, <bits>)
```

## 参数
| 参数    | 说明                              |
|-------|---------------------------------|
| `<x>` | 需要进行位移的数字                       |
| `<bits>` | 需要左移的位数。它是一个整数，决定了 `<x>` 将被左移多少位 |

## 返回值

返回一个整数，表示左移操作后的结果。

## 举例
```sql
select BIT_SHIFT_LEFT(5, 2), BIT_SHIFT_LEFT(-5, 2), BIT_SHIFT_LEFT(9223372036854775807, 1);
```

```text
+----------------------+-----------------------+----------------------------------------+
| bit_shift_left(5, 2) | bit_shift_left(-5, 2) | bit_shift_left(9223372036854775807, 1) |
+----------------------+-----------------------+----------------------------------------+
|                   20 |                   -20 |                                     -2 |
+----------------------+-----------------------+----------------------------------------+
```
