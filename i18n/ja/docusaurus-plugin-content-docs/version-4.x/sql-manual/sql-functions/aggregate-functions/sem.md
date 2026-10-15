---
{
    "title": "SEM",
    "language": "ja",
    "description": "指定した列または式に含まれる NULL 以外のすべての値について、平均値の標準誤差を計算します。"
}
---

## 説明

指定した列または式に含まれる NULL 以外のすべての値について、平均値の標準誤差を計算します。

標本値を $x_i$、標本サイズを $n$、標本平均を $\bar{x}$ とすると、次のようになります。

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
| `<expr>` | 通常は数値型の列、または数値に変換できる式。Double データ型をサポートします。 |
| `[DISTINCT]` | 省略可能なキーワード。指定すると、式の重複する値を除いてから平均値の標準誤差を計算します。 |

## 戻り値

指定した列または式の平均値の標準誤差を Double 型で返します。グループ内のすべてのレコードが NULL の場合は、NULL を返します。

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

Double 型に対する平均値の標準誤差の計算: [222.222, 3.3, 3.3, null] の平均値の標準誤差は 72.974 です。

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

int 型に対する平均値の標準誤差の計算: [1, 2, 3, 4] の平均値の標準誤差は 0.645497 です。

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

すべての値が NULL の場合は、NULL を返します。

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

DISTINCT キーワードを使用して重複を除いて計算します。[222.222, 3.3, 3.3, null] から重複を除いた後の平均値の標準誤差は 109.461 です。

```text
+------------------------+
| sem(distinct k_double) |
+------------------------+
|                109.461 |
+------------------------+
```
