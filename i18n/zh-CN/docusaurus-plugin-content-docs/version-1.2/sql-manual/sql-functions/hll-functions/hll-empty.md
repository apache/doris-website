---
{
    "title": "HLL_EMPTY",
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

`HLL_EMPTY` 用于返回一个 HLL（HyperLogLog）类型的空值，表示一个没有任何元素的数据集合。

## 语法

```sql
HLL_EMPTY()
```

## 返回值

返回一个 HLL 类型的空值，表示一个没有任何元素的数据集合。

## 举例

```sql
select hll_cardinality(hll_empty());
```

```text
+------------------------------+
| hll_cardinality(hll_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```