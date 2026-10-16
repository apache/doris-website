---
{
    "title": "AVG",
    "language": "ja",
    "description": "指定した列または式の NULL 以外のすべての値の平均を計算します。"
}
---

## 説明

指定した列または式の NULL 以外のすべての値の平均を計算します。

## 構文

```sql
AVG([DISTINCT] <expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 平均を計算する式または列。通常は数値型の列、または数値に変換できる式を指定します。サポートされる型は TinyInt、SmallInt、Integer、BigInt、LargeInt、Double、Decimal です。 |
| `[DISTINCT]` | 省略可能なキーワード。指定すると、expr の重複する値を除いてから平均を計算します。 |

## 戻り値

指定した列または式の値の平均を返します。グループ内の値がすべて NULL の場合は NULL を返します。
Decimal 型の入力に対しては Decimal 型、それ以外の数値型の入力に対しては Double 型の値を返します。

## 例

```sql
-- setup
create table t1(
        k_tinyint tinyint,
        k_smallint smallint,
        k_int int,
        k_bigint bigint,
        k_largeint largeint,
        k_double double,
        k_decimal decimalv3(10, 5),
        k_null_int int
) distributed by hash (k_int) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 10, 100, 1000, 10000, 1.1, 222.222, null),
    (2, 20, 200, 2000, 20000, 2.2, 444.444, null),
    (3, 30, 300, 3000, 30000, 3.3, null, null);
```

```sql
select avg(k_tinyint) from t1;
```

TinyInt 型の平均を計算します。[1,2,3] の平均は 2 です。

```text
+----------------+
| avg(k_tinyint) |
+----------------+
|              2 |
+----------------+
```

```sql
select avg(k_smallint) from t1;
```

SmallInt 型の平均を計算します。[10,20,30] の平均は 20 です。

```text
+-----------------+
| avg(k_smallint) |
+-----------------+
|              20 |
+-----------------+
```

```sql
select avg(k_int) from t1;
```

Integer 型の平均を計算します。[100,200,300] の平均は 200 です。

```text
+------------+
| avg(k_int) |
+------------+
|        200 |
+------------+
```

```sql
select avg(k_bigint) from t1;
```

BigInt 型の平均を計算します。[1000,2000,3000] の平均は 2000 です。

```text
+---------------+
| avg(k_bigint) |
+---------------+
|          2000 |
+---------------+
```

```sql
select avg(k_largeint) from t1;
```

LargeInt 型の平均を計算します。[10000,20000,30000] の平均は 20000 です。

```text
+-----------------+
| avg(k_largeint) |
+-----------------+
|           20000 |
+-----------------+
```

```sql
select avg(k_double) from t1;
```

Double 型の平均を計算します。[1.1,2.2,3.3] の平均は約 2.2 です。

```text
| avg(k_double)      |
+--------------------+
| 2.1999999999999997 |
```

```sql
select avg(k_decimal) from t1;
```

Decimal 型の平均を計算します。[222.222,444.444,null] の平均は 333.333 です。

```text
+----------------+
| avg(k_decimal) |
+----------------+
|      333.33300 |
+----------------+
```

```sql
select avg(k_null_int) from t1;
```

入力値がすべて NULL の場合は NULL を返します。

```text
+-----------------+
| avg(k_null_int) |
+-----------------+
|            NULL |
+-----------------+
```

```sql
select avg(distinct k_bigint) from t1;
```

DISTINCT キーワードを指定して重複を除いてから計算します。[1000,2000,3000] の重複を除いた後の平均は 2000 です。

```text
+-----------------------+
| avg(distinct k_bigint) |
+-----------------------+
|                  2000 |
+-----------------------+
```
