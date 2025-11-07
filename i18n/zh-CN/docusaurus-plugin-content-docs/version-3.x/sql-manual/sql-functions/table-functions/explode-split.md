---
{
    "title": "EXPLODE_SPLIT",
    "language": "zh-CN"
}
---

## 描述

`explode_split` 表函数用于将字符串按照指定分隔符拆分为多个子字符串，并将每个子字符串展开为一行。每个子字符串作为单独的行返回，通常与 LATERAL VIEW 一起使用，便于将长字符串拆解为单独的部分，进行更细粒度的查询。

`explode_split_outer` 与 `explode_split` 类似。但与 `explode_split` 不同的是，它在处理空值和 NULL 值时会有不同的行为，能够处理空的或 NULL 的字符串。

## 语法
```sql
EXPLODE_SPLIT(<str>, <delimiter>)
EXPLODE_SPLIT_OUTER(<str>, <delimiter>)
```

## 参数

| 参数 | 说明 |
| -- | -- |
| `<str>` | 字符串类型 |
| `<delimiter>` | 分割符 |

## 返回值

返回拆分后的子字符串序列。如果字符串为空或 NULL，不返回任何行。

## 举例

```sql
select * from example1 order by k1;
```

```text
+------+---------+
| k1   | k2      |
+------+---------+
|    1 |         |
|    2 | NULL    |
|    3 | ,       |
|    4 | 1       |
|    5 | 1,2,3   |
|    6 | a, b, c |
+------+---------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 1 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    1 |      |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 2 order by k1, e1;
Empty set
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 3 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    3 |      |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 4 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    4 | 1    |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 5 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    5 | 2    |
|    5 | 3    |
|    5 | 1    |
+------+------+
```

```sql
select k1, e1 from example1 lateral view explode_split(k2, ',') tmp1 as e1 where k1 = 6 order by k1, e1;
```

```text
+------+------+
| k1   | e1   |
+------+------+
|    6 |  b   |
|    6 |  c   |
|    6 |  a   |
+------+------+
```

```sql
CREATE TABLE example2 (
    id INT,
    str string null
)DUPLICATE KEY(id)
DISTRIBUTED BY HASH(`id`) BUCKETS AUTO
PROPERTIES (
"replication_allocation" = "tag.location.default: 1");
```

```sql
insert into example2 values (1,''),(2,NUll),(3,"1"),(4,"1,2,3"),(5,"a,b,c");
```

```sql
select id, e1 from example2 lateral view explode_split(str, ',') tmp1 as e1 where id = 2 order by id, e1;
Empty set (0.02 sec)
```

```sql
select id, e1 from example2 lateral view explode_split_outer(str, ',') tmp1 as e1 where id = 2 order by id, e1;
```

```text
+------+------+
| id   | e1   |
+------+------+
|    2 | NULL |
+------+------+
```