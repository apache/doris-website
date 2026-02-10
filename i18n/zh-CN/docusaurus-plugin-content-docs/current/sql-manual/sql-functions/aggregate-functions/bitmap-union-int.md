---
{
    "title": "BITMAP-UNION-INT",
    "language": "zh-CN",
    "description": "计算输入的表达式中不同值的个数，返回值和 COUNT(DISTINCT expr) 相同。"
}
---

## 描述

计算输入的表达式中不同值的个数，返回值和 COUNT(DISTINCT expr) 相同。

## 语法

```sql
BITMAP_UNION_INT(<expr>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<expr>` | 输入的表达式，支持类型为 TinyInt，SmallInt，Integer。 |

## 返回值

返回列中不同值的个数。
组内没有合法数据时，返回 0 。

## 举例

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
