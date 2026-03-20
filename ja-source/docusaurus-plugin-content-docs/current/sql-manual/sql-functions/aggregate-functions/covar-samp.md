---
{
  "title": "COVAR_SAMP",
  "language": "ja",
  "description": "2つの変数間の標本共分散を計算します。いずれかの入力変数がNULLの場合、その行は計算に含まれません。"
}
---
## 説明

2つの変数間の標本共分散を計算します。入力変数のいずれかがNULLの場合、その行は計算に含まれません。

## 構文

```sql
COVAR_SAMP(<expr1>, <expr2>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr1>` | 計算する式の1つで、サポートされる型はDoubleです。 |
| `<expr2>` | 計算する式の1つで、サポートされる型はDoubleです。 |

## 戻り値

expr1とexpr2のサンプル共分散を返し、戻り値の型はDoubleです。
グループに有効なデータがない場合、NULLを返します。

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
select covar_samp(x,y) from baseall;
```
```text
+-----------------+
| covar_samp(x,y) |
+-----------------+
|               1 |
+-----------------+
```
```sql
select id, covar_samp(x, y) from baseall group by id;
```
```text
+------+------------------+
| id   | covar_samp(x, y) |
+------+------------------+
|    1 |                0 |
|    2 |                0 |
|    3 |                0 |
|    4 |             NULL |
|    5 |             NULL |
+------+------------------+
```
|    4 |             NULL |
|    5 |             NULL |
+------+------------------+

```
