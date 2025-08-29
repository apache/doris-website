---
{
    "title": "MAX_BY",
    "language": "zh-CN"
}
---

## 描述

MAX_BY 函数用于根据指定列的最大值，返回对应的的关联值。

## 语法

```sql
MAX_BY(<expr1>, <expr2>)
```

## 参数说明

| 参数 | 说明 |
| -- | -- |
| `<expr1>` | 用于指定对应关联的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime。 |
| `<expr2>` | 用于指定最大值统计的表达式，支持类型为 Bool, TinyInt，SmallInt，Int，BigtInt，LargeInt，Float，Double，Decimal, String, Date, Datetime。 |

## 返回值

返回与输入表达式 <expr1> 相同的数据类型。
如果组内没有合法数据，则返回 NULL 。

## 举例

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    k3 int,
    k4 int
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 3, 2, 100),
    (1, 2, 3, 4),
    (4, 3, 2, 1),
    (3, 4, 2, 1);
```

```sql
select max_by(k1, k4) from tbl;
```

```text
+--------------------+
| max_by(`k1`, `k4`) |
+--------------------+
|                  0 |
+--------------------+ 
```

```sql
select max_by(k1, k4) from tbl where k1 is null;
```

```text
+----------------+
| max_by(k1, k4) |
+----------------+
|           NULL |
+----------------+
```
