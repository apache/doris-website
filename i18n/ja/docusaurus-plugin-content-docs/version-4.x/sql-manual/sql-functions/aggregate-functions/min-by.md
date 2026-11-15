---
{
    "title": "MIN_BY",
    "language": "ja",
    "description": "MINBY 関数は、指定した列の最小値に対応する値を返します。"
}
---

## 説明 {#description}

MIN_BY 関数は、指定した列の最小値に対応する値を返します。

`<expr2>` が Array の場合、配列は要素ごとに辞書順で比較されます。NULL 要素は NULL 以外のどの要素よりも大きく、配列全体の値が NULL の場合は無視されます。

バージョンによる違い: Doris 4.1 系列の 4.1.5 以降、および Doris 4.2 以降では、配列内の `NULL` 要素は NULL 以外の要素よりも大きいとみなされます。Doris 4.0 および Doris 4.1 系列の 4.1.5 より前のバージョンでは、配列内の `NULL` 要素は NULL 以外の要素よりも小さいとみなされます。これらすべてのバージョンで、配列全体の値が `NULL` の場合は無視されます。

複数の行で `<expr2>` が同じ最小値になる場合、`MIN_BY` はそれらの行のいずれかから `<expr1>` を返します。どの行が選ばれるかは保証されず、返される値が対応する値の中で最小とは限りません。結果を一意に定めるには、たとえば `<expr2>` が最小の行に絞り、`MIN` を `<expr1>` に適用するなど、同値の場合の処理規則を指定してください。

## 構文 {#syntax}

```sql
MIN_BY(<expr1>, <expr2>)
```

## パラメータ {#parameters}

| パラメータ | 説明 |
| --- | --- |
| `<expr1>` | 対応する値を表す式。対応する型: Bool、TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal、String、Date、Datetime、Array、Map、Struct。 |
| `<expr2>` | 最小値の判定に使用する式。対応する型: Bool、TinyInt、SmallInt、Int、BigInt、LargeInt、Float、Double、Decimal、String、Date、Datetime、Array。 |

## 戻り値 {#return-value}

<expr1> と同じデータ型の値を返します。
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
Table created and data inserted successfully.
```

```sql
select min_by(k1, k2) from tbl;
```

以下は結果の一例です。この例では `3` と `4` のどちらが返されても有効です。

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|              3 |
+----------------+
```

```sql
select min_by(arr, k1), min_by(mp, k1), min_by(st, k1) from tbl;
```

```text
+-----------------+----------------+------------------+
| min_by(arr, k1) | min_by(mp, k1) | min_by(st, k1)   |
+-----------------+----------------+------------------+
| [1, 2, 3]       | {"x":1, "y":4} | {"a":1, "b":"x"} |
+-----------------+----------------+------------------+
```

```sql
select min_by(k1, arr), min_by(mp, arr), min_by(st, arr), min_by(arr, arr) from tbl;
```

```text
+-----------------+-----------------+------------------+------------------+
| min_by(k1, arr) | min_by(mp, arr) | min_by(st, arr)  | min_by(arr, arr) |
+-----------------+-----------------+------------------+------------------+
|               0 | {"x":1, "y":4}  | {"a":1, "b":"x"} | [1, 2, 3]        |
+-----------------+-----------------+------------------+------------------+
```

```sql
select min_by(k1, k2) from tbl where k1 is null;
```

```text
+----------------+
| min_by(k1, k2) |
+----------------+
|           NULL |
+----------------+
```

以下の配列比較の例は、Doris 4.1 系列の 4.1.5 以降、および Doris 4.2 以降に適用されます。

```sql
SELECT min_by(label, sort_key) AS result
FROM (
    SELECT 'null element' AS label, [1, NULL] AS sort_key
    UNION ALL SELECT 'non-null element', [1, 2]
    UNION ALL SELECT 'null array', CAST(NULL AS ARRAY<INT>)
) t;
```

```text
non-null element
```

```sql
SELECT min_by(1, CAST(NULL AS ARRAY<INT>)) AS result;
```

```text
NULL
```

### 最小値が同じ場合に結果を一意に定める方法 {#deterministic-handling-of-tied-minimum-values}

以下の単独で実行できる例では、`k4` が最小となる行の中から、最小の `k1` を返します。最小値 `k4 = 1` に該当する行が複数あっても、結果は常に `3` です。

```sql
WITH data AS (
    SELECT 0 AS k1, 100 AS k4
    UNION ALL SELECT 1, 4
    UNION ALL SELECT 4, 1
    UNION ALL SELECT 3, 1
)
SELECT MIN(k1) AS min_k1
FROM data
WHERE k4 = (SELECT MIN(k4) FROM data);
```

```text
+--------+
| min_k1 |
+--------+
|      3 |
+--------+
```
