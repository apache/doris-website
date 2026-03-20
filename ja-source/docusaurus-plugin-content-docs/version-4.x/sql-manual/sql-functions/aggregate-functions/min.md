---
{
  "title": "MIN",
  "description": "MIN関数は、式の最小のnon-NULL値を返します。",
  "language": "ja"
}
---
## デスクリプション

MIN関数は、式の最小のnon-NULL値を返します。

## Syntax

```sql
MIN(<expr>)
```
## パラメータ

| パラメータ | デスクリプション |
| -- | -- |
| `<expr>` | 値を取得する式。サポートされる型は String、Time、Date、DateTime、IPv4、IPv6、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array です。 |

## Return Value

入力式と同じデータ型を返します。
グループ内のすべてのレコードが NULL の場合、この関数は NULL を返します。

## Example

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
select k1, min(k_string) from t1 group by k1;
```
String型：各グループについて、最小の文字列値を返します。

```text
+------+---------------+
| k1   | min(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
```sql
select k1, min(k_decimal) from t1 group by k1;
```
Decimal型：最小の高精度decimal値を返します。

```text
+------+----------------+
| k1   | min(k_decimal) |
+------+----------------+
|    1 |          10.01 |
|    2 |          30.03 |
|    3 |           NULL |
+------+----------------+
```
```sql
select k1, min(k_array) from t1 group by k1;
```
Array型の場合：各グループの配列の最小値を返します（要素を1つずつ比較します。nullが最も小さい要素です。）。

```text
+------+----------------+
| k1   | min(k_array)   |
+------+----------------+
|    1 | [10, 20]       |
|    2 | [10, 20, null] |
|    3 | NULL           |
+------+----------------+
```
```sql
select min(k_string) from t1 where k1 = 3;
```
グループ内のすべての値がNULLの場合、NULLを返します。

```text
+---------------+
| min(k_string) |
+---------------+
| NULL          |
+---------------+
```
```sql
select min(k_string) from t1;
```
全データの最小値。

```text
+---------------+
| min(k_string) |
+---------------+
| apple         |
+---------------+
```
