---
{
    "title": "SUM",
    "language": "zh-CN",
    "description": "用于返回选中字段所有值的和。"
}
---

## 描述

用于返回选中字段所有值的和。

## 语法

```sql
SUM(<expr>)
```

## 参数
| 参数 | 说明 |
| --- | --- |
| `<expr>` | 要计算和的字段，支持类型为 Double，Float，Decimal，LargeInt，BigInt，Integer，SmallInt，TinyInt。 |

## 返回值

返回选中字段所有值的和。
当组内没有合法数据时，返回 NULL。

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
