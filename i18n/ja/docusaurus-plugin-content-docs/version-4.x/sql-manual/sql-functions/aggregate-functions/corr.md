---
{
    "title": "CORR",
    "language": "ja",
    "description": "二つの確率変数間のピアソン相関係数を計算します。"
}
---

## 説明

二つの確率変数間のピアソン相関係数を計算します。

## 構文

```sql
CORR(<expr1>, <expr2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | 計算に使用する式。サポートされる型は DOUBLE です。 |
| `<expr2>` | 計算に使用する式。サポートされる型は DOUBLE です。 |

## 戻り値

expr1 と expr2 の共分散を、それぞれの標準偏差の積で割った DOUBLE 型の値を返します。特殊な場合の動作は次のとおりです。

- expr1 または expr2 の標準偏差が 0 の場合、0 を返します。
- expr1 または expr2 に NULL 値が含まれる場合、その行は計算から除外されます。
- グループに有効なデータがない場合、NULL を返します。

## 例

```sql
-- setup
create table test_corr(
    id int,
    k1 double,
    k2 double
) distributed by hash (id) buckets 1
properties ("replication_num"="1");

insert into test_corr values 
    (1, 20, 22),
    (1, 10, 20),
    (2, 36, 21),
    (2, 30, 22),
    (2, 25, 20),
    (3, 25, NULL),
    (4, 25, 21),
    (4, 25, 22),
    (4, 25, 20);
```

```sql
select id,corr(k1,k2) from test_corr group by id;
```

```text
+------+--------------------+
| id   | corr(k1, k2)       |
+------+--------------------+
|    4 |                  0 |
|    1 |                  1 |
|    3 |               NULL |
|    2 | 0.4539206495016019 |
+------+--------------------+
```

```sql
select corr(k1,k2) from test_corr where id=999;
```

対象となる行がない場合、NULL を返します。

```text
+-------------+
| corr(k1,k2) |
+-------------+
|        NULL |
+-------------+
```
