---
{
    "title": "PERCENTILE_ARRAY",
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

`PERCENTILE_ARRAY` 函数用于计算精确的百分位数数组，允许一次性计算多个百分位数值。这个函数主要适用于小数据量。

主要特点：
1. 精确计算：提供精确的百分位数结果，而不是近似值
2. 批量处理：可以一次计算多个百分位数
3. 适用范围：最适合处理数据量较小的场景

## 语法

```sql
PERCENTILE_ARRAY(<col>, <array_p>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<col>` | 需要计算百分位数的列 |
| `<array_p>` | 百分位数数组，数组中的每个元素必须在 `[0.0, 1.0]` 范围内，例如 `[0.5, 0.95, 0.99]` |

## 返回值

返回一个 `DOUBLE` 类型的数组，包含了对应于输入百分位数数组的计算结果。

## 举例

```sql
-- 创建示例表
CREATE TABLE sales_data (
    id INT,
    amount DECIMAL(10, 2)
) DUPLICATE KEY(`id`)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1"
);

-- 插入示例数据
INSERT INTO sales_data VALUES
(1, 10.5),
(2, 15.2),
(3, 20.1),
(4, 25.8),
(5, 30.3),
(6, 35.7),
(7, 40.2),
(8, 45.9),
(9, 50.4),
(10, 100.6);

-- 计算多个百分位数
SELECT percentile_array(amount, [0.25, 0.5, 0.75, 0.9]) as percentiles
FROM sales_data;
```

```text
+-----------------------------------------+
| percentiles                             |
+-----------------------------------------+
| [21.25, 32.5, 43.75, 54.99999999999998] |
+-----------------------------------------+
```
