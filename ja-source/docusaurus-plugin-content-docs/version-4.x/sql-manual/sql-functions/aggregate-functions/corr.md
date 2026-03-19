---
{
  "title": "CORR",
  "description": "2つの確率変数間のPearson相関係数を計算します。",
  "language": "ja"
}
---
## デスクリプション

2つの確率変数間のPearson相関係数を計算します。

## Syntax

```sql
CORR(<expr1>, <expr2>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `<expr1>` | 計算用の式。サポートされる型はDoubleです。 |
| `<expr2>` | 計算用の式。サポートされる型はDoubleです。 |

## Return Value

DOUBLE型の値を返します。これはexpr1とexpr2の共分散を、それらの標準偏差の積で割った値です。特殊なケース：

- expr1またはexpr2の標準偏差が0の場合、0を返します。
- expr1またはexpr2にNULL値が含まれている場合、それらの行は計算から除外されます。
- グループ内に有効なデータがない場合、NULLを返します。

## Example

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
クエリ結果が空の場合、NULLを返します。

```text
+-------------+
| corr(k1,k2) |
+-------------+
|        NULL |
+-------------+
```
