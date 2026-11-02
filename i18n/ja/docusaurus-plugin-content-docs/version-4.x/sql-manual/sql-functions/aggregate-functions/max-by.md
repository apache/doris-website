---
{
    "title": "MAX_BY",
    "language": "ja",
    "description": "MAX_BY 関数は、指定した列の最大値に基づいて関連する値を返します。"
}
---

## 説明 {#description}

MAX_BY 関数は、指定した列の最大値に基づいて関連する値を返します。

`<expr2>` が Array の場合、配列は要素ごとに辞書順で比較されます。NULL 要素は、NULL でない要素より大きい値として扱われます。配列値全体が NULL の場合は無視されます。

バージョンによる違い: Doris 4.1 系列の 4.1.5 以降、および Doris 4.2 以降では、配列内の `NULL` 要素は `NULL` でない要素より大きい値として比較されます。Doris 4.0 および 4.1.5 より前の Doris 4.1 では、配列内の `NULL` 要素は NULL でない要素より小さい値として比較されます。配列値全体が `NULL` の場合は、これらすべてのバージョンで無視されます。

## 構文 {#syntax}

```sql
MAX_BY(<expr1>, <expr2>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<expr1>` | 関連値に使用する式。Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array, Map, Struct 型をサポートします。 |
| `<expr2>` | 最大値に使用する式。Bool, TinyInt, SmallInt, Int, BigInt, LargeInt, Float, Double, Decimal, String, Date, Datetime, Array 型をサポートします。 |

## 戻り値 {#return-value}

<expr1> と同じデータ型を返します。
グループ内に有効なデータがない場合は NULL を返します。

## 例 {#example}

```sql
-- setup
create table tbl(
    k1 int,
    k2 int,
    arr ARRAY<INT>,
    mp MAP<STRING, INT>,
    st STRUCT<a: INT, b: STRING>,
) distributed by hash(k1) buckets 1
properties ("replication_num"="1");
insert into tbl values
    (0, 100, [1,2,3], {"x": 1, "y": 4}, NAMED_STRUCT("a", 1, "b", "x")),
    (1, 4,   [5, 6],  {"x": 2, "y": 3}, NAMED_STRUCT("a", 2, "b", "y")),
    (4, 1,   [7],     {"x": 3, "y": 2}, NAMED_STRUCT("a", 3, "b", "z")),
    (3, 1,   [8],     {"x": 4, "y": 1}, NAMED_STRUCT("a", 4, "b", "r"));
```

```text
テーブルの作成とデータの挿入に成功しました。
```

```sql
select max_by(k1, k2) from tbl;
```

```text
+----------------+
| max_by(k1, k2) |
+----------------+
|              0 |
+----------------+
```

```sql
select max_by(arr, k1), max_by(mp, k1), max_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| max_by(arr, k1) | max_by(mp, k1) | max_by(st, k1)   |
+-----------------+----------------+------------------+
| [7]             | {"x":3, "y":2} | {"a":3, "b":"z"} |
+-----------------+----------------+------------------+
```

```sql
select max_by(k1, arr), max_by(mp, arr), max_by(st, arr), max_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| max_by(k1, arr) | max_by(mp, arr) | max_by(st, arr)  | max_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               3 | {"x":4, "y":1}  | {"a":4, "b":"r"} | [8]              |
+-----------------+-----------------+------------------+------------------+
```

```sql
select max_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| max_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

以下の配列比較例は、Doris 4.1 系列の 4.1.5 以降、および Doris 4.2 以降に適用されます。

```sql
SELECT max_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
null element
```

```sql
SELECT max_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```
