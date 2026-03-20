---
{
  "title": "CORR_WELFORD",
  "description": "2つの確率変数のPearson係数をWelfordアルゴリズムを使用して計算します。このアルゴリズムは計算誤差を効果的に減らすことができます。",
  "language": "ja"
}
---
## 説明

2つの確率変数のPearson係数を[Welford](https://en.wikipedia.org/wiki/Algorithms_for_calculating_variance#Welford's_online_algorithm)アルゴリズムを使用して計算します。このアルゴリズムは計算誤差を効果的に削減できます。

## 構文

```sql
CORR_WELFORD(<expr1>, <expr2>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr1>` | Double式（列） |
| `<expr2>` | Double式（列） |

## 戻り値

戻り値の型はDOUBLEで、expr1とexpr2の標準偏差の積を除いたexpr1とexpr2の共分散です。特別なケース：

- expr1またはexpr2の標準偏差が0の場合、0が返されます。
- expr1またはexpr2の列がNULLの場合、その行のデータは最終結果にカウントされません。

## 例

```sql
select * from test_corr;
```
```text
+------+------+------+
| id   | k1   | k2   |
+------+------+------+
|    1 |   20 |   22 |
|    1 |   10 |   20 |
|    2 |   36 |   21 |
|    2 |   30 |   22 |
|    2 |   25 |   20 |
|    3 |   25 | NULL |
|    4 |   25 |   21 |
|    4 |   25 |   22 |
|    4 |   25 |   20 |
+------+------+------+
```
```sql
select id,corr_welford(k1,k2) from test_corr group by id;
```
```text
+------+---------------------+
| id   | corr_welford(k1,k2) |
+------+---------------------+
|    2 |  0.4539206495016017 |
|    4 |                   0 |
|    3 |                NULL |
|    1 |                   1 |
+------+---------------------+
```
