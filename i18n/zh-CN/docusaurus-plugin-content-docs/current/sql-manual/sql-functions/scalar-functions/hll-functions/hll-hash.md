---
{
    "title": "HLL_HASH",
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

将一个值转换为 HLL（HyperLogLog）类型。该函数通常用于数据加载时，将普通类型的值转换为 HLL 类型，常用于处理大数据集的去重和计数操作。

特殊情况：
- 如果输入值为 NULL，则返回 NULL。

## 语法

```sql
HLL_HASH(<value>)
```

## 参数

| 参数     | 说明                                                   |
| -------- | ------------------------------------------------------ |
| `<value>` | 需要转换为 HLL 类型的值。可以是字符串、数字或任意数据类型。 |

## 返回值

返回一个 HLL 类型的值。返回结果类型为 HLL。

## 举例

```sql
select HLL_CARDINALITY(HLL_HASH('abc'));
```

```text
+----------------------------------+
| hll_cardinality(HLL_HASH('abc')) |
+----------------------------------+
|                                1 |
+----------------------------------+
```