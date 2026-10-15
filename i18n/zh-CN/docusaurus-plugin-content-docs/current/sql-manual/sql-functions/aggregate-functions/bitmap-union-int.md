---
{
    "title": "BITMAP-UNION-INT",
    "language": "zh-CN",
    "description": "计算输入表达式中不同非负整数的个数，忽略负数和 NULL。"
}
---

## 描述

计算输入表达式中不同非负整数的个数，忽略负数和 NULL。

对于支持的整数类型，结果等价于 `COUNT(DISTINCT CASE WHEN expr >= 0 THEN expr END)` 和 `BITMAP_COUNT(BITMAP_AGG(expr))`。只有输入不包含负数时，结果才与 `COUNT(DISTINCT expr)` 相同。

## 使用说明

忽略负数是开发版本的行为。早期版本可能将负数计入结果，因此升级后，包含负数的查询可能返回不同的结果。

## 语法

```sql
BITMAP_UNION_INT(<expr>)
```

## 参数

| 参数 | 描述 |
| --- | --- |
| `<expr>` | 输入的表达式，支持类型为 TinyInt，SmallInt，Integer。 |

## 返回值

返回 BIGINT 类型，表示不同非负整数的个数。忽略 NULL 和负数。输入为空或组内只有 NULL 和负数时，返回 0；结果不会为 NULL。

## 示例

```sql
-- setup
CREATE TABLE pv_bitmap (
    dt INT,
    page INT,
    user_id BITMAP
) DISTRIBUTED BY HASH(dt) BUCKETS 1
PROPERTIES ("replication_num" = "1");
INSERT INTO pv_bitmap VALUES
    (1, 100, to_bitmap(100)),
    (1, 100, to_bitmap(200)),
    (1, 100, to_bitmap(300)),
    (1, 300, to_bitmap(300)),
    (2, 200, to_bitmap(300));
```

```text
Query OK, 0 rows affected
Query OK, 5 rows affected
```

```sql
select bitmap_union_int(dt) from pv_bitmap;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    2 |
+----------------------+
```

```sql
select bitmap_union_int(dt) from pv_bitmap where dt is null;
```

```text
+----------------------+
| bitmap_union_int(dt) |
+----------------------+
|                    0 |
+----------------------+
```

负数不计入结果，零计入结果：

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (
    SELECT -1 AS x UNION ALL SELECT 0 UNION ALL SELECT 1
    UNION ALL SELECT 1 UNION ALL SELECT NULL
) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 2 |
+-------------------+
```

组内只有负数和 NULL 时返回零：

```sql
SELECT bitmap_union_int(x) AS nonnegative_count
FROM (SELECT -1 AS x UNION ALL SELECT -2 UNION ALL SELECT NULL) AS input;
```

```text
+-------------------+
| nonnegative_count |
+-------------------+
|                 0 |
+-------------------+
```
