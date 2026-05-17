---
{
    "title": "SUM0",
    "language": "zh-CN",
    "description": "用于返回选中字段所有值的和。与 SUM 函数不同的是，当输入值全为 NULL 时，SUM0 返回 0 而不是 NULL。"
}
---

## 描述

用于返回选中字段所有值的和。与 SUM 函数不同的是，当输入值全为 NULL 时，SUM0 返回 0 而不是 NULL。

## 语法

```sql
SUM0(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要计算和的字段，支持类型为 Double，Float，Decimal，LargeInt，BigInt，Integer，SmallInt，TinyInt。 |

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