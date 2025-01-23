---
{
    "title": "HLL_FROM_BASE64",
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

将一个 base64 编码的字符串（通常由 `HLL_TO_BASE64` 函数生成）转换为 HLL 类型。如果输入字符串不合法或为 NULL，则返回 NULL。

## 语法

```sql
HLL_FROM_BASE64(<input>)
```

## 参数

| 参数     | 说明                                                                     |
| -------- | ------------------------------------------------------------------------ |
| `<input>` | base64 编码的字符串，通常由 `HLL_TO_BASE64` 函数生成。如果字符串不合法，则返回 NULL。 |

## 示例

```sql
select hll_union_agg(hll_from_base64(hll_to_base64(pv))), hll_union_agg(pv) from test_hll;
```

```text
+---------------------------------------------------+-------------------+
| hll_union_agg(hll_from_base64(hll_to_base64(pv))) | hll_union_agg(pv) |
+---------------------------------------------------+-------------------+
|                                                 3 |                 3 |
+---------------------------------------------------+-------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc'))));
```

```text
+------------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('abc')))) |
+------------------------------------------------------------------+
|                                                                1 |
+------------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(''))));
```

```text
+---------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash('')))) |
+---------------------------------------------------------------+
|                                                             1 |
+---------------------------------------------------------------+
```

```sql
select hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL))));
```

```text
+-----------------------------------------------------------------+
| hll_cardinality(hll_from_base64(hll_to_base64(hll_hash(NULL)))) |
+-----------------------------------------------------------------+
|                                                               0 |
+-----------------------------------------------------------------+
```