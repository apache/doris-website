---
{
  "title": "UNIFORM",
  "description": "指定されたランダムシードを使用して、特定の範囲内で一様にサンプリングし、乱数を生成します。",
  "language": "ja"
}
---
## 説明

与えられたランダムシードを使用して、特定の範囲内で均等にサンプリングし、乱数を生成します。

## 構文

```sql
UNIFORM( <min> , <max> , <gen> )
```
## パラメータ

| パラメータ | 説明 |
|-----------|------------|
| `<min>` | 乱数の下限値、数値型を受け入れる、リテラルである必要がある |
| `<max>` | 乱数の上限値、数値型を受け入れる、リテラルである必要がある |
| `<gen>` | 整数、ランダムシード、通常は[RANDOM](./random.md)関数によってランダムに生成される |

## 戻り値

`[<min>, <max>]`の範囲内の乱数を返す。`<min>`と`<max>`の両方が整数の場合、戻り値の型は`BIGINT`となり、そうでない場合は`DOUBLE`となる。

Snowflakeの[一般的な使用方法](https://docs.snowflake.com/en/sql-reference/functions/uniform)とは異なり、DorisのRANDOM関数はデフォルトで0から1までの浮動小数点数を返すため、`RANDOM()`をランダムシードとして使用する場合は、結果を整数範囲内に分布させるために乗数を付加する必要があることに注意してください。詳細は例を参照してください。

## 例

すべての入力パラメータが整数の場合、整数を返す：

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
入力パラメータがすべて整数でない場合は、double型を返します：

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
リテラルパラメータである必要があります：

```sql
select uniform(1, unix_timestamp(), random() * 10000) as result from numbers("number" = "10");
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```
リテラルパラメータである必要があります:

```sql
select uniform(1, ksint, random()) from fn_test;
```
```text
ERROR 1105 (HY000): errCode = 2, detailMessage = The second parameter (max) of uniform function must be literal
```
固定されたシードは固定された結果を生成します（`random()`の結果は0から1の間に分布し、直接使用された場合、`uniform`のseedパラメータは常に`0`です）：

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
任意の入力がNULLの場合、出力もNULLになります：

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
