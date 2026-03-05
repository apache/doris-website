---
{
    "title": "TOPN_WEIGHTED",
    "language": "zh-CN",
    "description": "TOPNWEIGHTED 函数返回指定列中出现频率最高的 N 个值，并且可以为每个值指定权重。与普通的 TOPN 函数不同，TOPNWEIGHTED 允许通过权重来调整值的重要性。"
}
---

## 描述

TOPN_WEIGHTED 函数返回指定列中出现频率最高的 N 个值，并且可以为每个值指定权重。与普通的 TOPN 函数不同，TOPN_WEIGHTED 允许通过权重来调整值的重要性。

## 语法

```sql
TOPN_WEIGHTED(<expr>, <weight>, <top_num> [, <space_expand_rate>])
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要统计的列或表达式，支持类型为 TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，IPV4，IPV6，String。 |
| `<weight>` | 用于调整权重的列或表达式，支持类型为 Double。|
| `<top_num>` | 要返回的最高频率值的数量，必须是正整数，支持类型为 Integer。 |
| `<space_expand_rate>` | 可选项，该值用来设置 Space-Saving 算法中使用的 counter 个数`counter_numbers = top_num * space_expand_rate` space_expand_rate 的值越大，结果越准确，默认值为 50，支持类型为 Integer。 |

## 返回值

返回一个数组，包含加权计数最高的 N 个值。
如果组内没有合法数据，返回 NULL。

## 举例
```sql
-- setup
CREATE TABLE product_sales (
    product_id INT,
    sale_amount DECIMAL(10,2),
    sale_date DATE
) DISTRIBUTED BY HASH(product_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO product_sales VALUES
(1, 100.00, '2024-01-01'),
(2, 50.00, '2024-01-01'),
(1, 150.00, '2024-01-01'),
(3, 75.00, '2024-01-01'),
(1, 200.00, '2024-01-01'),
(2, 80.00, '2024-01-01'),
(1, 120.00, '2024-01-01'),
(4, 90.00, '2024-01-01');
```

```sql
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales;
```

查找销售额最高的前 3 个产品（按销售金额加权）

```text
+--------------+
| top_products |
+--------------+
| [1, 2, 4]    |
+--------------+
```

```sql
SELECT TOPN_WEIGHTED(product_id, sale_amount, 3) as top_products
FROM product_sales where product_id is null;
```

查找销售额最高的前 3 个产品（按销售金额加权）

```text
+--------------+
| top_products |
+--------------+
| NULL         |
+--------------+
```
