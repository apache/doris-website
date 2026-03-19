---
{
  "title": "平均",
  "language": "ja",
  "description": "指定された列または式のすべての非NULL値の平均を計算します。"
}
---
## 説明

指定された列または式のすべての非NULL値の平均を計算します。

## 構文

```sql
AVG([DISTINCT] <expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 式またはカラムで、通常は数値カラムまたは数値に変換できる式です。サポートされる型は TinyInt、SmallInt、Integer、BigInt、LargeInt、Double、Decimal です。 |
| `[DISTINCT]` | expr から重複値を除去した後に平均値を計算することを示すオプションキーワードです。 |

## 戻り値

選択されたカラムまたは式の平均値を返します。グループ内のすべてのレコードが NULL の場合、この関数は NULL を返します。
decimal 型の入力の場合、戻り値も decimal になり、その他の数値型は double 型を返します。

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
TinyInt型の平均計算では、[1,2,3]の平均は2です。

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
SmallInt型の平均計算では、[10,20,30]の平均は20です。

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
整数型の平均計算では、[100,200,300]の平均は200です。

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
BigInt型の平均計算では、[1000,2000,3000]の平均は2000です。

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
LargeInt型の平均計算では、[10000,20000,30000]の平均は20000です。

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
Double型の平均計算では、[1.1,2.2,3.3]の平均は約2.2です。

```text
| avg(k_double)      |
+--------------------+
| 2.1999999999999997 |
```
```sql
select avg(k_decimal) from t1;
```
Decimal型の平均計算において、[222.222,444.444,null]の平均は333.333です。

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
すべての入力データがNULL値の場合、NULL値を返します。

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
DISTINCT キーワードを重複排除計算に使用すると、[1000,2000,3000] は重複排除後の平均が 2000 になります。

```text
+-----------------------+
| avg(distinct k_bigint) |
+-----------------------+
|                  2000 |
+-----------------------+
```
