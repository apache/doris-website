---
{
    "title": "APPROX_COUNT_DISTINCT",
    "language": "ja",
    "description": "NULL 以外の重複しない要素の数を返します。この関数は HyperLogLog アルゴリズムに基づいて実装されています。",
}
---

## 説明

NULL 以外の重複しない要素の数を返します。
この関数は HyperLogLog アルゴリズムに基づいて実装されており、固定サイズのメモリを使用して列のカーディナリティを推定します。このアルゴリズムは、分布の裾がヌル分布に従うという仮定に基づいており、精度はデータの分布に依存します。Doris で使用される固定のバケットサイズでは、このアルゴリズムの相対標準誤差は 0.8125% です。
より詳細で具体的な分析については、[関連論文](https://algo.inria.fr/flajolet/Publications/FlFuGaMe07.pdf)を参照してください。

## 構文

```sql
APPROX_COUNT_DISTINCT(<expr>)
NDV(<expr>)
```

## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 値を取得する式。サポートされる型は String、Date、DateTime、TimestampNs、Timestamptz、IPv4、IPv6、UUID、TinyInt、Bool、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal です。 |

## 戻り値

BIGINT 型の値を返します。

## 例

```sql
-- setup
create table t1(
        k1 int,
        k_string varchar(100),
        k_tinyint tinyint
) distributed by hash (k1) buckets 1
properties ("replication_num"="1");
insert into t1 values 
    (1, 'apple', 10),
    (1, 'banana', 20),
    (1, 'apple', 10),
    (2, 'orange', 30),
    (2, 'orange', 40),
    (2, 'grape', 50),
    (3, null, null);
```

```sql
select approx_count_distinct(k_string) from t1;
```

String 型：すべての k_string 値の重複しない要素数を概算します。NULL 値は計算に含まれません。

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               4 |
+---------------------------------+
```

```sql
select approx_count_distinct(k_tinyint) from t1;
```

TinyInt 型：すべての k_tinyint 値の重複しない要素数を概算します。

```text
+----------------------------------+
| approx_count_distinct(k_tinyint) |
+----------------------------------+
|                                5 |
+----------------------------------+
```

```sql
select approx_count_distinct(k1) from t1;
```

Integer 型：すべての k1 値の重複しない要素数を概算します。

```text
+---------------------------+
| approx_count_distinct(k1) |
+---------------------------+
|                         3 |
+---------------------------+
```

```sql
select k1, approx_count_distinct(k_string) from t1 group by k1;
```

k1 でグループ化し、各グループの k_string の重複しない要素数を概算します。グループ内の k_string 値がすべて NULL の場合は、0 を返します。

```text
+------+---------------------------------+
| k1   | approx_count_distinct(k_string) |
+------+---------------------------------+
|    1 |                               2 |
|    2 |                               2 |
|    3 |                               0 |
+------+---------------------------------+
```

```sql
select ndv(k_string) from t1;
```

別名の NDV を使用した場合も、APPROX_COUNT_DISTINCT と同じ結果になります。

```text
+---------------+
| ndv(k_string) |
+---------------+
|             4 |
+---------------+
```

```sql
select approx_count_distinct(k_string) from t1 where k1 = 999;
```

クエリ結果が空の場合は、0 を返します。

```text
+---------------------------------+
| approx_count_distinct(k_string) |
+---------------------------------+
|                               0 |
+---------------------------------+
```
