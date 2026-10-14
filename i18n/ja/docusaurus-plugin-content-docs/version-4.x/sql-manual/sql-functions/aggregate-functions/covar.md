---
{
    "title": "COVAR",
    "language": "ja",
    "description": "二つの変数間の標本共分散を計算します。いずれかの入力変数が NULL の場合、その行は計算に含まれません。"
}
---

## 説明

二つの変数間の標本共分散を計算します。いずれかの入力変数が NULL の場合、その行は計算に含まれません。

## 別名

- COVAR_POP

## 構文

```sql
COVAR(<expr1>, <expr2>)
COVAR_POP(<expr1>, <expr2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | 計算に使用する式の一つ。サポートされる型は DOUBLE です。 |
| `<expr2>` | 計算に使用する式の一つ。サポートされる型は DOUBLE です。 |

## 戻り値

expr1 と expr2 の標本共分散を DOUBLE 型で返します。
グループに有効なデータがない場合は NULL を返します。

## 例

```sql
-- setup
create table baseall(
    id int,
    x double,
    y double
) distributed by hash(id) buckets 1
properties ("replication_num"="1");

insert into baseall values
    (1, 1.0, 2.0),
    (2, 2.0, 3.0),
    (3, 3.0, 4.0),
    (4, 4.0, NULL),
    (5, NULL, 5.0);
```

```sql
select covar(x,y) from baseall;
```

```text
+-------------------+
| covar(x,y)        |
+-------------------+
| 0.666666666666667 |
+-------------------+
```

```sql
select id, covar(x, y) from baseall group by id;
```

```text
+------+-------------+
| id   | covar(x, y) |
+------+-------------+
|    1 |           0 |
|    2 |           0 |
|    3 |           0 |
|    4 |        NULL |
|    5 |        NULL |
+------+-------------+
```
