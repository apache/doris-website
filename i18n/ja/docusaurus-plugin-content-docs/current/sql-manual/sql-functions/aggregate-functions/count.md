---
{
  "title": "カウント",
  "language": "ja",
  "description": "指定された列のNULL以外のレコード数、または総レコード数を返します。"
}
---
## 説明

指定された列のNULL以外のレコード数、または総レコード数を返します。

## 構文

```sql
COUNT(DISTINCT <expr> [,<expr>,...])
COUNT(*)
COUNT(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 式が指定された場合、非NULLレコードの数をカウントします。そうでない場合は、行の総数をカウントします。 |

## 戻り値

戻り値の型はBigintです。exprがNULLの場合、カウントされません。

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
