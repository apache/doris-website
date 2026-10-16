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
| `<expr>` | 要统计的列或表达式，支持类型为 Boolean（Doris 4.1 系列自 4.1.5 起）、TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，IPV4，IPV6，String。 |
| `<weight>` | 用于调整权重的列或表达式，类型为 BIGINT。|
| `<top_num>` | 要返回的最高频率值的数量，必须是 INT 类型的正整数常量。 |
| `<space_expand_rate>` | 可选，INT 类型常量，默认值为 50。正数时，中间状态序列化最多保留 `top_num * space_expand_rate` 个候选，值越大通常越准确；该值不是本地聚合内存的硬上限。Doris 4.1 系列自 4.1.5 起，设置为 0 或负数会保留全部中间候选值，最终结果仍最多返回 `top_num` 个值；此模式可能占用更多内存，仍受查询内存限制。 |

## 返回值

返回一个数组，包含加权计数最高的 N 个值。
如果组内没有合法数据，返回 NULL。

<a id="举例"></a>

## 示例
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

BOOLEAN 输入示例（Doris 4.1 系列自 4.1.5 起）：

```sql
SELECT TOPN_WEIGHTED(TRUE, 1, 2), TOPN_WEIGHTED(CAST(NULL AS BOOLEAN), 1, 2);
```

```text
[1]    NULL
```
