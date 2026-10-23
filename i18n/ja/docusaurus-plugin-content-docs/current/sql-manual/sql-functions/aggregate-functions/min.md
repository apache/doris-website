---
{
    "title": "MIN",
    "language": "ja",
    "description": "MIN 関数は、式の NULL ではない最小値を返します。"
}
---

## 説明 {#description}

MIN 関数は、式の NULL ではない最小値を返します。

## 構文 {#syntax}

```sql
MIN(<expr>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| -- | -- |
| `<expr>` | 最小値を取得する式。サポートされる型は String、Time、Date、DateTime、TimestampNs、Timestamptz、IPv4、IPv6、UUID、TinyInt、SmallInt、Integer、BigInt、LargeInt、Float、Double、Decimal、Array です。 |

## 戻り値 {#return-value}

入力式と同じデータ型の値を返します。
グループ内のすべてのレコードが NULL の場合、NULL を返します。

:::caution 動作の変更 (4.1.5)

Doris 4.1 系では、4.1.5 以降、配列などの複合値に含まれる NULL 要素は、同じ位置にある NULL ではない要素より大きい値として比較されます。たとえば、`[10, 20, NULL]` は `[10, 20, 40]` より大きくなります。式全体が NULL の場合とは異なり、NULL 要素を含む行は無視されません。式全体が NULL の行は引き続き無視されます。4.1.5 より前は、集約時の比較で複合値に含まれる NULL 要素は小さい値として扱われていました。

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

```sql
select k1, min(k_string) from t1 group by k1 order by k1;
```

String 型：各グループの文字列の最小値を返します。

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
select k1, min(k_decimal) from t1 group by k1 order by k1;
```

Decimal 型：高精度の十進数の最小値を返します。

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
select k1, min(k_array) from t1 group by k1 order by k1;
```

Array 型：要素を順に比較し、各グループの配列の最小値を返します。同じ位置にある要素を比較する場合、NULL 要素は NULL ではない要素より大きい値として扱われます。

```text
+------+----------------+
| k1   | min(k_array)   |
+------+----------------+
|    1 | [10, 20]       |
|    2 | [10, 20, 40]   |
|    3 | NULL           |
+------+----------------+
```

```sql
select min(k_string) from t1 where k1 = 3;
```

グループ内のすべての値が NULL の場合、NULL を返します。

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

全データの最小値を返します。

```text
+---------------+
| min(k_string) |
+---------------+
| apple         |
+---------------+
```
