---
{
"title": "ARRAY_MATCH_ANY",
"language": "zh-CN"
}
---

<!--  Licensed to the Apache Software Foundation (ASF) under one or more contributor license agreements.  See the NOTICE file distributed with this work for additional information regarding copyright ownership.  The ASF licenses this file to you under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.  See the License for the specific language governing permissions and limitations under the License. -->

## 描述

检查数组中是否有任何元素满足给定条件。如果数组包含 NULL 元素且所有非 NULL 元素都不满足条件，则返回 NULL。

## 语法

```sql
array_match_any(lambda, <arr> [, <arr> ...])
```

## 参数

- `lambda`: 定义检查条件的 lambda 表达式
- `<arr>`: 一个或多个要检查的数组。lambda 函数将应用于这些数组的每个元素

## 返回值

返回一个可空的布尔值：
- 如果数组中任何元素满足条件，则返回 `true`
- 如果数组中所有元素都不满足条件，则返回 `false`
- 如果数组包含 NULL 元素且所有非 NULL 元素都不满足条件，则返回 `NULL`

## 示例

```sql
-- 检查数组中是否有任何数字大于 5
mysql> SELECT array_match_any(x -> x > 5, [1, 2, 3, 4, 7]);
+----------------------------------------------+
| array_match_any(x -> x > 5, [1, 2, 3, 4, 7]) |
+----------------------------------------------+
|                                            1 |
+----------------------------------------------+

-- 检查数组中是否有任何数字大于另一个数组中对应位置的数字
mysql> SELECT array_match_any((x, i) -> x > i, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]);
+--------------------------------------------------------------------+
| array_match_any((x, i) -> x > i, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]) |
+--------------------------------------------------------------------+
|                                                                  0 |
+--------------------------------------------------------------------+

mysql> SELECT array_match_any((x, i) -> i > x, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]);
+--------------------------------------------------------------------+
| array_match_any((x, i) -> i > x, [1, 2, 3, 4, 5], [1, 2, 3, 4, 7]) |
+--------------------------------------------------------------------+
|                                                                  1 |
+--------------------------------------------------------------------+
```

## 注意事项

1. 函数处理 NULL 值的方式：
   - 如果存在 NULL 元素且所有非 NULL 元素都不满足条件，则返回 NULL
   - 如果任何非 NULL 元素满足条件，则无论是否存在 NULL 元素都返回 true

2. 该函数适用于：
   - 检查数组中是否有任何元素满足特定条件
   - 与其他数组函数组合进行复杂的数组操作