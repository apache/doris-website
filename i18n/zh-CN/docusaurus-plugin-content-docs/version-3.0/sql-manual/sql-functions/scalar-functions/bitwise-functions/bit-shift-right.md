---
{
"title": "BIT_SHIFT_RIGHT",
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
用于 右移 位运算，通常用于将二进制数字的所有位向右移动指定的位数。这种操作通常用于处理二进制数据，或者用于一些数学计算（如除法的高效实现）。

对 -1 逻辑右移一位得到的结果是 BIGINT_MAX(9223372036854775807)。

对数字右移负数为得到对结果始终为 0。

## 语法
```sql
BIT_SHIFT_RIGHT( <x>, <bits>)
```

## 参数
| 参数    | 说明                               |
|-------|----------------------------------|
| `<x>` | 需要进行位移的数字                        |
| `<bits>` | 需要右移的位数。它是一个整数，决定了 `<x>` 将被右移多少位 |

## 返回值

返回一个整数，表示右移操作后的结果。

## 举例

```sql
select BIT_SHIFT_RIGHT(1024,3), BIT_SHIFT_RIGHT(-1,1), BIT_SHIFT_RIGHT(100, -1);
```

```text
+--------------------------+------------------------+--------------------------+
| bit_shift_right(1024, 3) | bit_shift_right(-1, 1) | bit_shift_right(100, -1) |
+--------------------------+------------------------+--------------------------+
|                      128 |    9223372036854775807 |                        0 |
+--------------------------+------------------------+--------------------------+
```
