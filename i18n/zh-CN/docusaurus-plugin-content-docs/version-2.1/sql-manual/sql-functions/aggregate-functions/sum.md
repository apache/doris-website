---
{
    "title": "SUM",
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

用于返回选中字段所有值的和。

## 语法

```sql
SUM(<expr>)
```

## 参数

| 参数 | 说明 |
| --- | --- |
| `<expr>` | 要计算和的字段 |

## 返回值

返回选中字段所有值的和。

## 举例
```sql
-- 创建示例表
CREATE TABLE sales_table (
    product_id INT,
    price DECIMAL(10,2),
    quantity INT
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);

-- 插入测试数据
INSERT INTO sales_table VALUES
(1, 99.99, 2),
(2, 159.99, 1),
(3, 49.99, 5),
(4, 299.99, 1),
(5, 79.99, 3);

-- 计算销售总金额
SELECT SUM(price * quantity) as total_sales
FROM sales_table;
```

```text
+-------------+
| total_sales |
+-------------+
|     1149.88 |
+-------------+
```
