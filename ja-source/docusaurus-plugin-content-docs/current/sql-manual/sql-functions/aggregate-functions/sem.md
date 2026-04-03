---
{
  "title": "SEM",
  "language": "ja",
  "description": "指定された列または式のすべての非null値について、平均の標準誤差を計算します。"
}
---
## 説明

指定された列または式のすべての非null値に対して、平均の標準誤差を計算します。

標本値を$x_i$、標本サイズを$n$、標本平均を$\bar{x}$とすると：

$
\mathrm{SEM}=\sqrt{\frac{1}{n(n-1)}\sum_{i=1}^{n}\bigl(x_i-\bar{x}\bigr)^2}.
$

## 構文

```text
SEM([DISTINCT] <expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 式または列。通常は数値列またはDouble データ型をサポートする数値に変換可能な式。|
| `[DISTINCT]` | exprの重複値を除去してから平均標準誤差を計算することを示すオプションのキーワード。 |

## 戻り値

Doubleを返します。選択された列または式の平均標準誤差を返します。グループ内のすべてのレコードがNULLの場合、関数はNULLを返します。

## 例

```sql
-- setup
create table t1(
        id int,
        k_double double,
) distributed by hash (id) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 222.222),
    (2, 3.3),
    (3, 3.3),
    (4, null);
```
```sql
select sem(k_double) from t1;
```
Double型の平均標準誤差の計算: [222.222, 3.3, 3.3, null]の平均の標準誤差は72.974です

```text
+---------------+
| sem(k_double) |
+---------------+
|        72.974 |
+---------------+
```
```sql
select sem(id) from t1
```
int型の平均の標準誤差の計算：[1, 2, 3, 4]の平均の標準誤差は0.645497です。

```text
+--------------------+
| sem(id)            |
+--------------------+
| 0.6454972243679028 |
+--------------------+
```
```sql
select sem(cast(null as double)) from t1;
```
すべての値がnullの場合、nullを返します。

```text
+---------------------------+
| sem(cast(null as double)) |
+---------------------------+
|                      NULL |
+---------------------------+
```
```sql
select sem(distinct k_double) from t1;
```
DISTINCT キーワードを重複除去計算に使用すると、重複を削除した後の [222.222, 3.3, 3.3, null] の平均標準誤差は 109.461 です。

```text
+------------------------+
| sem(distinct k_double) |
+------------------------+
|                109.461 |
+------------------------+
```
