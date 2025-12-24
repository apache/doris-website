---
{
    "title": "TOPN",
    "language": "zh-CN",
    "description": "TOPN 函数用于返回指定列中出现频率最高的 N 个值。它是一个近似计算函数，返回结果的顺序是按照计数值从大到小排序。"
}
---

## 描述

TOPN 函数用于返回指定列中出现频率最高的 N 个值。它是一个近似计算函数，返回结果的顺序是按照计数值从大到小排序。

## 语法

```sql
TOPN(<expr>, <top_num> [, <space_expand_rate>])
```

## 参数
| 参数 | 说明 |
| -- | -- |
| `<expr>` | 要统计的列或表达式，支持类型为 TinyInt，SmallInt，Integer，BigInt，LargeInt，Float，Double，Decimal，Date，Datetime，IPV4，IPV6，String。 |
| `<top_num>` | 要返回的最高频率值的数量，必须是正整数，支持类型为 Integer。 |
| `<space_expand_rate>` | 可选项，该值用来设置 Space-Saving 算法中使用的 counter 个数`counter_numbers = top_num * space_expand_rate` space_expand_rate 的值越大，结果越准确，默认值为 50，支持类型为 Integer。 |

## 返回值

返回一个 JSON 字符串，包含值和对应的出现次数。
如果组内没有合法数据，返回 NULL。

## 举例
```sql
-- setup
CREATE TABLE page_visits (
    page_id INT,
    user_id INT,
    visit_date DATE
) DISTRIBUTED BY HASH(page_id)
PROPERTIES (
    "replication_num" = "1"
);
INSERT INTO page_visits VALUES
(1, 101, '2024-01-01'),
(2, 102, '2024-01-01'),
(1, 103, '2024-01-01'),
(3, 101, '2024-01-01'),
(1, 104, '2024-01-01'),
(2, 105, '2024-01-01'),
(1, 106, '2024-01-01'),
(4, 107, '2024-01-01');
```

```sql
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits;
```

查找访问量最高的前 3 个页面。

```text
+---------------------+
| top_pages           |
+---------------------+
| {"1":4,"2":2,"4":1} |
+---------------------+
```

```sql
SELECT TOPN(page_id, 3) as top_pages
FROM page_visits where page_id is null;
```

```text
+-----------+
| top_pages |
+-----------+
| NULL      |
+-----------+
```