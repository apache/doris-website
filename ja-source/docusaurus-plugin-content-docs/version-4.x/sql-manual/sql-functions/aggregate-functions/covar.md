---
{
  "title": "COVAR",
  "description": "2つの変数間の標本共分散を計算します。入力変数のいずれかがNULLの場合、その行は計算に含まれません。",
  "language": "ja"
}
---
## 説明

2つの変数間の標本共分散を計算します。入力変数のいずれかがNULLの場合、その行は計算に含まれません。

## エイリアス

- COVAR_POP

## 構文

```sql
COVAR(<expr1>, <expr2>)
COVAR_POP(<expr1>, <expr2>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr1>` | 計算する式の1つで、サポートされる型はDoubleです。 |
| `<expr2>` | 計算する式の1つで、サポートされる型はDoubleです。 |

## Return Value

expr1とexpr2のサンプル共分散を返します。戻り値の型はDoubleです。
グループに有効なデータがない場合は、NULLを返します。

## Example

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
