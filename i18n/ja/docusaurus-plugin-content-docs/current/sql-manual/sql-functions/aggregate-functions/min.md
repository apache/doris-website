---
{
    "title": "MIN",
    "language": "ja",
    "description": "MIN 関数は式の NULL 以外の最小値を返します。"
}
---

## 説明

MIN 関数は式の NULL 以外の最小値を返します。

## 構文

```sql
MIN(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 値を取得する式。String、Time、Date、DateTime、TimestampNs、Timestamptz、IPv4、IPv6、UUID、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array 型をサポートします。 |

## 戻り値

入力式と同じデータ型を返します。
グループ内のすべてのレコードが NULL の場合、関数は NULL を返します。

## 使用例

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

文字列型: グループごとに文字列の最小値を返します。

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

Decimal 型: 高精度の小数値の最小値を返します。

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

Array 型: グループごとに最小の配列値を返します (要素を順に比較し、NULL を最小の要素とみなします)。

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

グループ内のすべての値が NULL の場合は NULL を返します。

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
