---
{
    "title": "ANY_VALUE",
    "language": "ja",
    "description": "グループ内の式または列から任意の値を返します。NULL 以外の値が存在する場合はそのいずれかを返し、存在しない場合は NULL を返します。"
}
---

## 説明

グループ内の式または列から任意の値を返します。NULL 以外の値が存在する場合はそのいずれかを返し、存在しない場合は NULL を返します。

## 別名

- ANY

## 構文

```sql
ANY_VALUE(<expr>)
ANY(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 集約対象の列または式。サポートされる型は String、Date、DateTime、Timestamptz、IPv4、IPv6、Bool、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array、Map、Struct、AggState、Bitmap、HLL、QuantileState です。 |

## 戻り値

NULL 以外の値が存在する場合はそのいずれかを返し、存在しない場合は NULL を返します。
戻り値の型は入力式の型と同じです。

## 例

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

文字列型: 各グループから NULL 以外の任意の値を返します。

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

Decimal 型: NULL 以外の任意の高精度小数値を返します。

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

グループ内の値がすべて NULL の場合は、NULL を返します。

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

別名 ANY を使用した場合も、ANY_VALUE と同じ動作になります。

```text
+------+---------------+
| k1   | any(k_string) |
+------+---------------+
|    1 | apple         |
|    2 | orange        |
|    3 | NULL          |
+------+---------------+
```
