---
{
    "title": "MAX",
    "language": "ja",
    "description": "MAX 関数は、式の NULL ではない値の最大値を返します。"
}
---

## 説明 {#description}

MAX 関数は、式の NULL ではない値の最大値を返します。

バージョンによる違い: Doris 4.1 系列の 4.1.5 以降、および Doris 4.2 以降では、配列内の `NULL` 要素は `NULL` ではない要素より大きい値として比較されます。Doris 4.0 および 4.1.5 より前の Doris 4.1 では、`NULL` 配列要素は小さい値として比較されます。配列値全体が `NULL` の入力は、これらすべてのバージョンで無視されます。

## 構文 {#syntax}

```sql
MAX(<expr>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<expr>` | 値を取得する式。サポートされる型は String、Time、Date、DateTime、Timestamptz、IPv4、IPv6、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array です。 |

## 戻り値 {#return-value}

入力式と同じデータ型を返します。
グループ内のすべてのレコードが NULL の場合、関数は NULL を返します。


:::caution 動作変更（4.1.5）

Doris 4.1 系列では 4.1.5 以降、配列などの複合値内の NULL 要素は、同じ位置にある NULL ではない要素より大きい値として比較されます。たとえば、`[10, 20, NULL]` は `[10, 20, 40]` より大きくなります。これは式全体が NULL である場合とは異なります。該当する行は引き続き無視されます。4.1.5 より前は、集計比較で複合値内の NULL 要素は小さい値として扱われていました。

:::

## 例 {#example}

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

```text
Table created and data inserted successfully.
```

```sql
select k1, max(k_string) from t1 group by k1 order by k1;
```

String 型の場合: グループごとに最大の文字列値を返します。

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
select k1, max(k_decimal) from t1 group by k1 order by k1;
```

Decimal 型の場合: 最大の高精度小数値を返します。

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
select k1, max(k_array) from t1 group by k1 order by k1;
```

Array 型の場合: 要素を順番に比較し、各グループの最大の配列値を返します。同じ位置では、NULL 要素は NULL ではない要素より大きい値として比較されます。

```text
+------+----------------+
| k1   | max(k_array)   |
+------+----------------+
|    1 | [10, 20, 30]   |
|    2 | [10, 20, null] |
|    3 | NULL           |
+------+----------------+
```

```sql
select max(k_string) from t1 where k1 = 3;
```

グループ内のすべての値が NULL の場合、NULL を返します。

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

すべてのデータにおける最大値を返します。

```text
+---------------+
| max(k_string) |
+---------------+
| orange        |
+---------------+
```
