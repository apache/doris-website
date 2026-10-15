---
{
    "title": "CORR_WELFORD",
    "language": "ja",
    "description": "Welford アルゴリズムを使用して二つの確率変数間のピアソン相関係数を計算し、計算誤差を効果的に低減します。"
}
---

## 説明

二つの確率変数間のピアソン相関係数を、[Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm) アルゴリズムを使用して計算し、計算誤差を効果的に低減します。

## 構文

```sql
CORR_WELFORD(<expr1>, <expr2>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | DOUBLE 型の式（列） |
| `<expr2>` | DOUBLE 型の式（列） |

## 戻り値

DOUBLE 型の値を返します。値は expr1 と expr2 の共分散を、それぞれの標準偏差の積で割ったものです。特別な場合の動作は次のとおりです。

- expr1 または expr2 の標準偏差が 0 の場合、0 を返します。
- expr1 または expr2 に NULL 値が含まれる場合、その行は最終結果から除外されます。
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
select * from test_corr order by id, k1, k2;
```

```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   10 |   20 |
|    1 |   20 |   22 |
|    2 |   25 |   20 |
|    2 |   30 |   22 |
|    2 |   36 |   21 |
|    3 |   25 | NULL |
|    4 |   25 |   20 |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
+------+------+------+
```

```sql
select id, corr_welford(k1, k2) from test_corr group by id order by id;
```

```text
+------+----------------------+
| id   | corr_welford(k1, k2) |
+------+----------------------+
|    1 |                    1 |
|    2 |   0.4539206495016017 |
|    3 |                 NULL |
|    4 |                    0 |
+------+----------------------+
```

グループに有効な `(k1, k2)` の組がない場合（ここでは `id = 999` に一致する行がない場合）、集約関数は NULL を返します。

```sql
select corr_welford(k1, k2) from test_corr where id = 999;
```

```text
+----------------------+
| corr_welford(k1, k2) |
+----------------------+
|                 NULL |
+----------------------+
```
