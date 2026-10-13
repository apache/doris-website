---
{
    "title": "COUNT",
    "language": "ja",
    "description": "指定した列の NULL ではない値の件数、または全行数を返します。"
}
---

## 説明

指定した列の NULL ではない値の件数、または全行数を返します。

## 構文

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 式を指定した場合は NULL ではない値の件数を数えます。COUNT(*) の場合は全行数を数えます。 |

## 戻り値

戻り値の型は Bigint です。expr が NULL の場合、その行はカウントされません。

## 例

```sql
-- setup
create table test_count(
    id int,
    name varchar(20),
    sex int
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into test_count values
    (1, '1', 1),
    (2, '2', 1),
    (3, '3', 1),
    (4, '0', 1),
    (4, '4', 1),
    (5, NULL, 1);

create table test_insert(
    id int,
    name varchar(20),
    sex int
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into test_insert values
    (1, '1', 1),
    (2, '2', 1),
    (3, '3', 1),
    (4, '0', 1),
    (4, '4', 1),
    (5, NULL, 1);
```

```sql
select count(*) from test_count;
```

```text
+----------+
| count(*) |
+----------+
|        6 |
+----------+
```

```sql
select count(name) from test_insert;
```

```text
+-------------+
| count(name) |
+-------------+
|           5 |
+-------------+
```

```sql
select count(distinct sex) from test_insert;
```

```text
+---------------------+
| count(DISTINCT sex) |
+---------------------+
|                   1 |
+---------------------+
```

```sql
select count(distinct id,sex) from test_insert;
```

```text
+-------------------------+
| count(DISTINCT id, sex) |
+-------------------------+
|                       5 |
+-------------------------+
```
