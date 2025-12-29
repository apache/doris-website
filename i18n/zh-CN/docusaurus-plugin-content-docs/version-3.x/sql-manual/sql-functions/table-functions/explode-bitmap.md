---
{
    "title": "EXPLODE_BITMAP",
    "language": "zh-CN",
    "description": "explodebitmap 表函数，接受一个位图（bitmap）类型的数据，将位图中的每个 bit（位）映射为单独的行。通常用于处理位图数据，将位图中的每个元素展开成单独的记录。需配合 Lateral View 使用。"
}
---

## 描述

`explode_bitmap` 表函数，接受一个位图（bitmap）类型的数据，将位图中的每个 bit（位）映射为单独的行。通常用于处理位图数据，将位图中的每个元素展开成单独的记录。需配合 Lateral View 使用。

`explode_bitmap_outer` 与 `explode_bitmap` 类似，但在处理空值或 NULL 时，行为有所不同。它允许空位图或 NULL 位图的记录存在，并在返回结果中将空位图或者 NULL 位图展开为 NULL 行。

## 语法

```sql
EXPLODE_BITMAP(<bitmap>)
EXPLODE_BITMAP_OUTER(<bitmap>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<bitmap>` | bitmap 类型 |

## 返回值

返回位图中每一位对应的行，其中每一行包含一个位值。

## 举例

```sql
CREATE TABLE example1 (
    k1 INT
)DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
insert into example1 values(1),(2),(3),(4),(5),(6);
```

```sql
select k1 from example1 order by k1;
```

```text
+------+
| k1   |
+------+
|    1 |
|    2 |
|    3 |
|    4 |
|    5 |
|    6 |
+------+
```

```sql
select k1, e1 from example1 lateral view explode_bitmap(bitmap_empty()) tmp1 as e1 order by k1, e1;
Empty set
```

```sql
select k1, e1 from example1 lateral view explode_bitmap(bitmap_from_string("1")) tmp1 as e1 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    1 |    1 |
|    2 |    1 |
|    3 |    1 |
|    4 |    1 |
|    5 |    1 |
|    6 |    1 |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_bitmap(bitmap_from_string("1,2")) tmp1 as e1 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    1 |    1 |
|    1 |    2 |
|    2 |    1 |
|    2 |    2 |
|    3 |    1 |
|    3 |    2 |
|    4 |    1 |
|    4 |    2 |
|    5 |    1 |
|    5 |    2 |
|    6 |    1 |
|    6 |    2 |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_bitmap(bitmap_from_string("1,1000")) tmp1 as e1 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    1 |    1 |
|    1 | 1000 |
|    2 |    1 |
|    2 | 1000 |
|    3 |    1 |
|    3 | 1000 |
|    4 |    1 |
|    4 | 1000 |
|    5 |    1 |
|    5 | 1000 |
|    6 |    1 |
|    6 | 1000 |
+------+------+
```

```sql
select k1, e1, e2 from example1
lateral view explode_bitmap(bitmap_from_string("1,1000")) tmp1 as e1
lateral view explode_split("a,b", ",") tmp2 as e2 order by k1, e1, e2;
```

```text
+------+------+------+
| k1   | e1   | e2   |
+------+------+------+
|    1 |    1 | a    |
|    1 |    1 | b    |
|    1 | 1000 | a    |
|    1 | 1000 | b    |
|    2 |    1 | a    |
|    2 |    1 | b    |
|    2 | 1000 | a    |
|    2 | 1000 | b    |
|    3 |    1 | a    |
|    3 |    1 | b    |
|    3 | 1000 | a    |
|    3 | 1000 | b    |
|    4 |    1 | a    |
|    4 |    1 | b    |
|    4 | 1000 | a    |
|    4 | 1000 | b    |
|    5 |    1 | a    |
|    5 |    1 | b    |
|    5 | 1000 | a    |
|    5 | 1000 | b    |
|    6 |    1 | a    |
|    6 |    1 | b    |
|    6 | 1000 | a    |
|    6 | 1000 | b    |
+------+------+------+
```

```sql
CREATE TABLE example (
    k1 INT,
    v1 bitmap
)DUPLICATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
insert into example values(1,to_bitmap('10101')),(2,to_bitmap('0')),(3,to_bitmap(NULL));
```

```sql
SELECT id, k, v
FROM example
LATERAL VIEW explode_json_object(value_json) exploded_table AS k , v;
```

```text
+------+-------+
| k1   | bit   |
+------+-------+
|    2 |     0 |
|    1 | 10101 |
+------+-------+
```

```sql
SELECT id, k, v
FROM example
LATERAL VIEW explode_json_object_outer(value_json) exploded_table AS k, v;
```

```text
+------+-------+
| k1   | bit   |
+------+-------+
|    2 |     0 |
|    1 | 10101 |
|    3 |  NULL |
+------+-------+
```