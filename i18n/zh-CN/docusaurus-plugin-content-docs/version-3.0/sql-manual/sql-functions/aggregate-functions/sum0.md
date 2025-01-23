---
{
    "title": "SUM0",
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

用于返回选中字段所有值的和。与 SUM 函数不同的是，当输入值全为 NULL 时，SUM0 返回 0 而不是 NULL。

## 语法

```sql
SUM0(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要计算和的字段 |

## 返回值

返回选中字段所有值的和。如果所有值都为 NULL，则返回 0。

## 举例

```sql
-- 创建示例表
CREATE TABLE sales_table (
    product_id INT,
    price DECIMAL(10,2),
    quantity INT,
    discount DECIMAL(10,2)
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO sales_table VALUES
(1, 99.99, 2, NULL),
(2, 159.99, 1, NULL),
(3, 49.99, 5, NULL),
(4, 299.99, 1, NULL),
(5, 79.99, 3, NULL);

-- 对比 SUM 和 SUM0 的区别
SELECT 
    SUM(discount) as sum_discount,    -- 返回 NULL
    SUM0(discount) as sum0_discount   -- 返回 0
FROM sales_table;
```

```text
+--------------+---------------+
| sum_discount | sum0_discount |
+--------------+---------------+
|         NULL |          0.00 |
+--------------+---------------+
```