---
{
"title": "BIT_TEST",
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
将`<x>`的值转换为二进制的形式，返回指定位置`<bits>`的值，`<bits>`从 0 开始，从右到左。

如果`<bits>` 有多个值，则将多个`<bits>`位置上的值用与运算符结合起来，返回最终结果。

如果`<bits>` 的取值为负数或者超过`<x>`的 bit 位总数，则会返回结果为 0。

整数`<x>`范围：TINYINT、SMALLINT、INT、BIGINT、LARGEINT。

## 别名
- BIT_TEST_ALL

## 语法
```sql
BIT_TEST( <x>, <bits>[, <bits> ... ])
```

## 参数
| 参数      | 说明     |
|---------|--------|
| `<x>`   | 需计算的整数 |
| `<bits>` | 指定位置的值 |

## 返回值

返回指定位置的值

## 举例

```sql
select BIT_TEST(43, 1), BIT_TEST(43, -1), BIT_TEST(43, 0, 1, 3, 5,2);
```

```text
+-----------------+------------------+-----------------------------+
| bit_test(43, 1) | bit_test(43, -1) | bit_test(43, 0, 1, 3, 5, 2) |
+-----------------+------------------+-----------------------------+
|               1 |                0 |                           0 |
+-----------------+------------------+-----------------------------+
```

