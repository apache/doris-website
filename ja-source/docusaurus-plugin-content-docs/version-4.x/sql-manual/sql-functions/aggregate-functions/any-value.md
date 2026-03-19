---
{
  "title": "ANY_VALUE",
  "description": "グループ内の式または列から任意の値を返します。NULL以外の値が存在する場合は、任意のNULL以外の値を返します。それ以外の場合はNULLを返します。",
  "language": "ja"
}
---
## 説明

グループ内の式または列から任意の値を返します。NULL以外の値が存在する場合は任意のNULL以外の値を返し、それ以外の場合はNULLを返します。

## エイリアス

- ANY

## 構文

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```
## パラメータ

| Parameter | デスクリプション |
| -- | -- |
| `<expr>` | 集約される列または式。サポートされる型は String、Date、DateTime、IPv4、IPv6、Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array、Map、Struct、AggState、Bitmap、HLL、QuantileState です。 |

## Return Value

非NULL値が存在する場合は任意の非NULL値を返し、そうでなければNULLを返します。
戻り値の型は入力exprの型と一致します。

## Example

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_decimal decimal(10, 2)
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10.01),
    (1, 'banana', 20.02),
    (2, 'orange', 30.03),
    (2, null, null),
    (3, null, null);
```
```sql
select k1, any_value(k_string) from t1 group by k1;
```
String型: 各グループについて、NULL以外の値を返します。

```text
+------+---------------------+
| k1   | any_value(k_string) |
+------+---------------------+
|    1 | apple               |
|    2 | orange              |
|    3 | NULL                |
+------+---------------------+
```
```sql
select k1, any_value(k_decimal) from t1 group by k1;
```
Decimal型：NULL以外の任意の高精度decimal値を返します。

```text
+------+----------------------+
| k1   | any_value(k_decimal) |
+------+----------------------+
|    1 |                10.01 |
|    2 |                30.03 |
|    3 |                 NULL |
+------+----------------------+
```
```sql
select any_value(k_string) from t1 where k1 = 3;
```
グループ内のすべての値がNULLの場合、NULLを返します。

```text
+---------------------+
| any_value(k_string) |
+---------------------+
| NULL                |
+---------------------+
```
```sql
select k1, any(k_string) from t1 group by k1;
```
エイリアス ANY を使用すると、ANY_VALUE と同じ効果が得られます。

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
