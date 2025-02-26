---
{
    "title": "TOPN_WEIGHTED",
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

TOPN_WEIGHTED 函数返回指定列中出现频率最高的 N 个值，并且可以为每个值指定权重。与普通的 TOPN 函数不同，TOPN_WEIGHTED 允许通过权重来调整值的重要性。

## 语法

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要统计的列或表达式 |
| `<weight>` | 用于调整权重的列或表达式 |
| `<top_num>` | 要返回的最高频率值的数量，必须是正整数 |
| `<space_expand_rate>` | 可选项，该值用来设置 Space-Saving 算法中使用的 counter 个数`counter_numbers = top_num * space_expand_rate` space_expand_rate 的值越大，结果越准确，默认值为 50 |

## 返回值

返回一个数组，包含值和对应的加权计数。

## 举例
```sql
-- 创建示例表
CREATE TABLE product_sales (
    product_id INT,
    sale_amount DECIMAL(10,2),
    sale_date DATE
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO product_sales VALUES
(1, 100.00, '2024-01-01'),
(2, 50.00, '2024-01-01'),
(1, 150.00, '2024-01-01'),
(3, 75.00, '2024-01-01'),
(1, 200.00, '2024-01-01'),
(2, 80.00, '2024-01-01'),
(1, 120.00, '2024-01-01'),
(4, 90.00, '2024-01-01');

-- 查找销售额最高的前 3 个产品（按销售金额加权）
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales;
```

```text
+--------------+
| top_products |
+--------------+
| [1, 2, 4]    |
+--------------+
```
