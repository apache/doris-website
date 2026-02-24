---
{
    "title": "EXPLODE_BITMAP",
    "language": "en",
    "description": "The explodebitmap table function accepts a bitmap type data and maps each bit (bit) of the bitmap to a separate row."
}
---

## Description

The `explode_bitmap` table function accepts a bitmap type data and maps each bit (bit) of the bitmap to a separate row. It is commonly used for processing bitmap data, expanding each element of the bitmap into separate records. It should be used in conjunction with LATERAL VIEW.

`explode_bitmap_outer` works similarly to `explode_bitmap`, but its behavior differs when handling NULL or empty values. It allows records with empty or NULL bitmaps to exist, and in the result, it expands an empty or NULL bitmap into NULL rows.

## Syntax

```sql
EXPLODE_BITMAP(<bitmap>)
EXPLODE_BITMAP_OUTER(<bitmap>)
```

## Parameters

| Parameter | Description |
| -- | -- |
| `<bitmap>` | bitmap type |

## Return Value

Returns a row for each bit in the bitmap, with each row containing a single bit value.

## Examples

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