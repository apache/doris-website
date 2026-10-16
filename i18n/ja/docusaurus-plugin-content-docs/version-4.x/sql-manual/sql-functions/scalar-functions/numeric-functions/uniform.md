---
{
    "title": "UNIFORM",
    "language": "ja",
    "description": "指定した乱数シードを使用して、特定の範囲内の乱数を一様にサンプリングして生成します。"
}
---

## 説明

指定した乱数シードを使用して、特定の範囲内の乱数を一様にサンプリングして生成します。

## 構文

```sql
UNIFORM( <min> , <max> , <gen> )
```

## パラメータ

| パラメータ | 説明 |
|-----------|------------|
| `<min>` | 乱数の下限。数値型を受け付けます。リテラルである必要があります。 |
| `<max>` | 乱数の上限。数値型を受け付けます。リテラルである必要があります。 |
| `<gen>` | 整数型の乱数シード。通常は [RANDOM](./random.md) 関数でランダムに生成します。 |

## 戻り値

`[<min>, <max>]` の範囲内の乱数を返します。`<min>` と `<max>` が両方とも整数の場合、戻り値の型は `BIGINT` です。それ以外の場合は `DOUBLE` です。

Snowflake での [一般的な使い方](https://docs.snowflake.com/en/sql-reference/functions/uniform) とは異なり、Doris の RANDOM 関数はデフォルトで 0 から 1 の範囲の浮動小数点数を返します。そのため、`RANDOM()` を乱数シードとして使用する場合は、結果が整数の範囲に分布するように乗数を掛ける必要があります。詳しくは例を参照してください。

## 例

<!-- setup-sql
CREATE TABLE it (k0 INT) DISTRIBUTED BY HASH(k0) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO it VALUES (NULL),(1),(2),(3),(4),(5);
CREATE TABLE fn_test (ksint INT) DISTRIBUTED BY HASH(ksint) BUCKETS 1 PROPERTIES("replication_num"="1");
INSERT INTO fn_test VALUES (1);
-->

入力パラメータがすべて整数の場合は、整数を返します。

```sql
select uniform(-100, 100, random() * 10000) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|    -82 |
|    -79 |
|     21 |
|     19 |
|     50 |
|     53 |
|   -100 |
|    -67 |
|     46 |
|     40 |
+--------+
```

入力パラメータがすべて整数ではない場合は、DOUBLE 型を返します。

```sql
select uniform(1, 100., random() * 10000) as result from numbers("number" = "10");
```

```text
+-------------------+
| result            |
+-------------------+
| 84.25057360297031 |
| 63.34296160793329 |
|  81.8770598286311 |
| 26.53334147605743 |
| 17.42787914185705 |
| 2.532901549399078 |
| 63.72223367924216 |
| 78.42165786093118 |
|   18.913688179943 |
| 41.73057334477316 |
+-------------------+
```

パラメータはリテラルである必要があります。

```sql
select uniform(1, unix_timestamp(), random() * 10000) as result from numbers("number" = "10");
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```

パラメータはリテラルである必要があります。

```sql
select uniform(1, ksint, random()) from fn_test;
```

```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```

シードを固定すると、結果も一定になります（`random()` の結果は 0 から 1 の範囲に分布するため、そのまま使用すると `uniform` のシード引数は常に `0` になります）。

```sql
select uniform(-100, 100, random()) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
|    -68 |
+--------+
```

いずれかの入力が NULL の場合、出力も NULL になります。

```sql
select uniform(-100, NULL, random() * 10000) as result from numbers("number" = "10");
```

```text
+--------+
| result |
+--------+
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
|   NULL |
+--------+
```

```sql
select k0, uniform(0, 1000, k0) from it order by k0;
```

```text
+------+----------------------+
| k0   | uniform(0, 1000, k0) |
+------+----------------------+
| NULL |                 NULL |
|    1 |                  134 |
|    2 |                  904 |
|    3 |                  559 |
|    4 |                  786 |
|    5 |                  673 |
+------+----------------------+
```
