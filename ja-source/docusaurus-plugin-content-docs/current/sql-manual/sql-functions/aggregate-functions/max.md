---
{
  "title": "MAX",
  "language": "ja",
  "description": "MAX関数は、式の最大の非NULL値を返します。"
}
---
## 説明

MAX関数は、式の最大非NULL値を返します。

## 構文

```sql
MAX(<expr>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 値を取得する式。サポートされる型は String、Time、Date、DateTime、Timestamptz、IPv4、IPv6、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array です。 |

## 戻り値

入力式と同じデータ型を返します。
グループ内のすべてのレコードが NULL の場合、関数は NULL を返します。


## 例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2),
        k_array array<int>
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01, [10, 20, 30]),
    (1, 'banana', 20.02, [10, 20]),
    (2, 'orange', 30.03, [10, 20, 40]),
    (2, null, null, [10, 20, null]),
    (3, null, null, null);
```
```sql
select k1, max(k_string) from t1 group by k1;
```
String型の場合：各グループの最大文字列値を返します。

```text
+------+---------------+
| k1   | max(k_string) |
+------+---------------+
|    1 | banana        |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
```sql
select k1, max(k_decimal) from t1 group by k1;
```
Decimal型の場合：最大の高精度decimal値を返します。

```text
+------+----------------+
| k1   | max(k_decimal) |
+------+----------------+
|    1 |          20.02 |
|    2 |          30.03 |
|    3 |           NULL |
+------+----------------+
```
```sql
select k1, max(k_array) from t1 group by k1;
```
Array型の場合：各グループの配列の最大値を返します（要素を1つずつ比較し、nullが最小の要素になります）。

```text
+------+--------------+
| k1   | max(k_array) |
+------+--------------+
|    1 | [10, 20, 30] |
|    2 | [10, 20, 40] |
|    3 | NULL         |
+------+--------------+
```
```sql
select max(k_string) from t1 where k1 = 3;
```
グループ内のすべての値がNULLの場合、NULLを返します。

```text
+---------------+
| max(k_string) |
+---------------+
| NULL          |
+---------------+
```
```sql
select max(k_string) from t1;
```
全データの最大値を返します。

```text
+---------------+
| max(k_string) |
+---------------+
| orange        |
+---------------+
```
