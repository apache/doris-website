---
{
    "title": "REGR_INTERCEPT",
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

`REGR_INTERCEPT` 函数用于计算线性回归方程中的截距（y轴截距）。它返回组内非空值对的单变量线性回归线的截距。对于非空值对，使用以下公式计算：

`AVG(y) - REGR_SLOPE(y, x) * AVG(x)`

其中 `x` 是自变量，`y` 是因变量。

## 语法

```sql
REGR_INTERCEPT(<y>, <x>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<y>` | 因变量，必须是可以计算为数值类型的表达式。 |
| `<x>` | 自变量，必须是可以计算为数值类型的表达式。 |

## 返回值

返回 `DOUBLE` 类型的值，表示线性回归线与 `y` 轴的交点。

## 举例

```sql
-- 创建示例表
CREATE TABLE test_regr_intercept (
  `id` int,
  `x` int,
  `y` int
) DUPLICATE KEY (`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
INSERT INTO test_regr_intercept VALUES
(1, 18, 13),
(2, 14, 27),
(3, 12, 2),
(4, 5, 6),
(5, 10, 20);

-- 计算x和y的线性回归截距
SELECT REGR_INTERCEPT(y, x) FROM test_regr_intercept;
```

```text
+-------------------------+
| regr_intercept(y, x)    |
+-------------------------+
|      5.512931034482759  | 
+-------------------------+
```