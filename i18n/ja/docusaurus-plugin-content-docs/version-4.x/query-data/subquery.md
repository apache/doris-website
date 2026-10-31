---
{
    "title": "サブクエリ",
    "language": "ja",
    "description": "Doris サブクエリガイド：スカラー、非スカラー、相関、非相関サブクエリの構文、制限、および Mark Join の処理。",
    "keywords": [
        "Doris サブクエリ",
        "サブクエリ",
        "スカラーサブクエリ",
        "相関サブクエリ",
        "IN EXISTS サブクエリ",
        "Mark Join"
    ]
}
---

<!-- Knowledge type: Capability definition + Usage limitations -->
<!-- Applicable scenarios: Writing nested SQL queries / Troubleshooting subquery errors -->

サブクエリは、別のクエリ（通常は SELECT 文）の中にネストされた SQL クエリです。`SELECT`、`FROM`、`WHERE`、`HAVING` 句に記述して、外側のクエリにデータや条件を提供できます。サブクエリを使用すると、単一の SQL 文でより複雑なフィルタリング、集計、結合ロジックを実装できます。

このドキュメントでは、Doris におけるサブクエリのカテゴリ、サポート範囲、制限事項、および特殊なシナリオで使用される Mark Join の仕組みについて説明します。

## 適用シナリオ {#applicable-scenarios}

サブクエリは、一般に次のシナリオで使用されます。

- **複雑なフィルタリング**：`WHERE` または `HAVING` 句でサブクエリを使用し、フィルタ条件を動的に計算します。
- **派生列の計算**：`SELECT` リストでスカラーサブクエリを使用して、追加フィールドを補います。
- **派生テーブル**：`FROM` 句でサブクエリを一時テーブルとして使用し、結合に参加させます。
- **存在チェック**：`EXISTS`/`NOT EXISTS` または `IN`/`NOT IN` を使用して、集合間の関係を評価します。

## サブクエリの基本的な特徴 {#basic-characteristics-of-subqueries}

サブクエリを使用するときは、次の基本的な特徴に注意してください。

| 特徴 | 説明 |
| --- | --- |
| 位置 | `SELECT`、`FROM`、`WHERE`、`HAVING` 句に記述でき、`SELECT`、`UPDATE`、`INSERT`、`DELETE`、および `=`、`>`、`<`、`<=`、`IN`、`EXISTS` などの式演算子と組み合わせて使用できます。 |
| 外側と内側の関係 | 外側のクエリをメインクエリと呼び、その内部にネストされたクエリをサブクエリと呼びます。 |
| 実行順序 | 独立したサブクエリは通常、先に実行されます。相関がある場合、パーサーが必要に応じて実行順序を決定し、サブクエリの結果をメインクエリに返します。 |
| 構文上の制約 | サブクエリは、メインクエリと区別するために括弧で囲む必要があります。 |

以下の例では、すべて `t1` と `t2` の二つのテーブルを使用します。DDL は次のとおりです。

```sql
create table t1
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");

create table t2
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

## サブクエリのカテゴリ {#categories-of-subqueries}

サブクエリは、**返されるデータの特性**と、**外側のクエリの列を参照するかどうか**という二つの観点で分類できます。

### 返されるデータの特性による分類 {#classification-by-returned-data-characteristics}

返されるデータの特性により、サブクエリはスカラーサブクエリと非スカラーサブクエリに分けられます。

| 種類 | 返される結果 | テーブルが空の場合の戻り値 | 記述できる位置 |
| --- | --- | --- | --- |
| スカラーサブクエリ | 単一の値（一行一列のリレーション） | `NULL` | 単一値の式を使用できる任意の場所 |
| 非スカラーサブクエリ | リレーション（複数の行と列を含むことができます） | 空集合（0 行） | リレーション（集合）を使用できる任意の場所 |

例（`t2` が空の場合、二つのサブクエリは異なる結果を返します）：

```sql
-- Scalar subquery. When t2 is empty, the subquery returns the scalar value null.
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- Non-scalar subquery. When t2 is empty, the subquery returns an empty set (0 rows).
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### 外側の列を参照するかどうかによる分類 {#classification-by-whether-outer-columns-are-referenced}

サブクエリが外側のクエリの列を参照するかどうかにより、サブクエリは相関サブクエリと非相関サブクエリに分けられます。

| 種類 | 外側の列を参照するか | 実行方法 |
| --- | --- | --- |
| 非相関サブクエリ | いいえ | 通常は独立して評価でき、外側のクエリで使用する結果を一度返します。 |
| 相関サブクエリ | はい（一般にサブクエリの `WHERE` 句で参照します） | 外側のテーブルの各行についてサブクエリを一度実行する必要があり、外側のテーブルに対するフィルタ操作に相当します。 |

例：

```sql
-- Correlated subquery. The subquery uses the outer table column t1.c2.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);

-- Uncorrelated subquery. The subquery does not reference any column of the outer table t1.
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Doris がサポートするサブクエリ {#subqueries-supported-by-doris}

<!-- Knowledge type: Capability support matrix -->

Doris はすべての非相関サブクエリをサポートします。相関サブクエリのサポート範囲は次のとおりです。

- `WHERE` および `HAVING` 句の相関スカラーサブクエリをサポートします。
- `WHERE` および `HAVING` 句の `IN`、`NOT IN`、`EXISTS`、`NOT EXISTS` を使用する相関非スカラーサブクエリをサポートします。
- `SELECT` リストの相関スカラーサブクエリをサポートします。
- ネストされたサブクエリでは、サブクエリ自身の直接の親クエリへの相関のみをサポートします。より外側のクエリへの階層をまたぐ相関はサポートしません。

## 相関サブクエリの制限 {#limitations-of-correlated-subqueries}

<!-- Knowledge type: Usage limitations -->
<!-- Applicable scenarios: SQL error troubleshooting / Rewriting correlated subqueries -->

Doris では、相関サブクエリの形態ごとに異なる制限があります。以下で説明します。

### 相関スカラーサブクエリの制限 {#limitations-of-correlated-scalar-subqueries}

4.1.5 以降、`UNION`、`INTERSECT`、`EXCEPT` などの集合演算を含み、外側の列を参照するサブクエリは、分析時に明示的に拒否されます。たとえば、`Unsupported correlated subquery with set operation` が返されます。非相関の集合演算サブクエリには影響ありません。結果が既知の場合、グループ化されていない集約に対するトップレベルの `EXISTS` または `NOT EXISTS` は、引き続き true または false に簡約できます。これは、集合演算を含むすべてのサブクエリがサポートされないことを意味しません。

次の二つの条件を同時に満たす必要があります。

- 相関条件は等価条件でなければなりません。
- サブクエリの出力は単一の集約関数の結果であり、`group by` 句を含んではなりません。

```sql
-- Single aggregate function and no group by: supported.
select * from t1 where t1.c1 < (select max(t2.c1) from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select t1.* from t1 inner join (select t2.c2 as c2, max(t2.c1) as c1 from t2 group by t2.c2) tx on t1.c1 < tx.c1 and t1.c2 = tx.c2;

-- Non-equality correlation condition: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 > t2.c2);

-- No aggregate function: not supported.
select * from t1 where t1.c1 = (select t2.c1 from t2 where t1.c2 = t2.c2);

-- Aggregate function present but with group by: not supported.
select * from t1 where t1.c1 = (select max(t2.c1) from t2 where t1.c2 = t2.c2 group by t2.c2);
```

### 相関 (NOT) EXISTS サブクエリの制限 {#limitations-of-correlated-not-exists-subqueries}

- サブクエリで `offset` と `limit` を同時に使用することはできません。

```sql
-- With limit but without offset: supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- With both offset and limit: not supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### 相関 (NOT) IN サブクエリの制限 {#limitations-of-correlated-not-in-subqueries}

次の三つの条件を同時に満たす必要があります。

- サブクエリの出力は単一列でなければなりません。
- サブクエリで `limit` を使用することはできません。
- サブクエリで集約関数または `group by` 句を使用することはできません。

```sql
-- Supported subquery.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c1 = t2.c1 and t1.c2 = t2.c2;

-- Multi-column output in the subquery: not supported.
select * from t1 where (t1.a, t1.c) in (select t2.c1, t2.c from t2 where t1.c2 = t2.c2);

-- Subquery with limit: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 limit 3);

-- With a group by clause: not supported.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t1.c2 = t2.c2 group by t2.c1);

-- With an aggregate function: not supported.
select * from t1 where t1.c1 in (select sum(t2.c1) from t2 where t1.c2 = t2.c2);
```

### ネストされたサブクエリの制限 {#limitations-of-nested-subqueries}

現在、サブクエリとその直接の親クエリの間の相関のみをサポートします。より外側のクエリへの相関はサポートしません。

` t3` テーブルもあると仮定します。定義は次のとおりです。

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- サポート対象：サブクエリが直接の親クエリの列のみを参照する場合。

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2
        ) and t2.c2 = t1.c2
    );
    ```

- サポート対象外：最内側のサブクエリが、直接の親クエリの `t2.c2` と最外側のクエリの `t1.c1` の両方を参照する場合。

    ```sql
    select
        t1.c1
    from
        t1
    where not exists (
        select
            t2.c1
        from
            t2
        where not exists (
            select
                t3.c1
            from
                t3
            where
                t3.c2 = t2.c2 and t3.c1 = t1.c1
        )
    );
    ```

## Mark Join {#mark-join}

<!-- Knowledge type: Execution mechanism -->
<!-- Applicable scenarios: When a subquery has an OR relationship with other filter conditions -->

`WHERE` 句で、`(NOT) IN` または `(NOT) EXISTS` サブクエリが別のフィルタ条件と `OR` 関係で組み合わされている場合、正しい結果を生成するには特別な処理が必要です。例：

```sql
select
    t1.c1,
    t1.c2
from t1
where exists (
    select
        t2.c1
    from t2
    where
        t1.c2 = t2.c2
    ) or t1.c1 > 0;
```

上記の `EXISTS` 句を直接 `LEFT SEMI JOIN` に書き換えると、その意味上、`t1.c2 = t2.c2` を満たす `t1` の行だけが返されます。しかし、`t1.c1 > 0` を満たす行も返す必要があります。これに対応するため、Doris は **Mark Join** の仕組みを導入しています。

:::info 注記
`RIGHT SEMI JOIN` も同様ですが、左テーブルと右テーブルを入れ替えます。ここでは `LEFT SEMI JOIN` を使用します。
:::

例の SQL は次のとおりです。

```sql
-- This SQL cannot actually be executed. It is shown for illustration only.
select
    tx.c1,
    tx.c2
from
    (
        select
            t1.c1,
            t1.c2,
            mark_join_flag
        from
            t1 left (mark) semi join t2 on t1.c2 = t2.c2
    ) tx
where
    tx.mark_join_flag or tx.c1 > 0;
```

Mark Join と通常の `LEFT SEMI JOIN` の違いは次のとおりです。通常の `LEFT SEMI JOIN` は条件を満たす左テーブルの行を直接出力します。一方、Mark Join は元の左テーブルに加えて、値が `TRUE`、`FALSE`、または `NULL` となるフラグ列（例では `mark_join_flag`）を出力します。このフラグの値は `JOIN` 条件式 `t1.c2 = t2.c2` によって決まり、各行に対応するフラグ値が生成されます。対応関係は次のとおりです。

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

このフラグ列を使用すると、元の `WHERE` フィルタ条件を `where mark_join_flag or t1.c1 > 0` と書き換えることができ、正しい結果が得られます。

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting runtime errors of scalar subqueries -->

スカラーサブクエリの出力は単一の値でなければならないため、サブクエリが複数のレコードを返すと実行時エラーが報告されます。

### 相関スカラーサブクエリが複数行を返す場合 {#correlated-scalar-subquery-returns-multiple-rows}

相関スカラーサブクエリを使用する場合、外側のある行について、相関条件に一致する行をサブクエリが複数返すと、実行時エラーが発生します。

```sql
-- Correlated scalar subquery. If more than one row in t2 satisfies t1.c2 = t2.c2, a runtime error is reported.
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### 非相関スカラーサブクエリが複数行を返す場合 {#uncorrelated-scalar-subquery-returns-multiple-rows}

Doris は実行時に `assert num rows` オペレーターを追加します。サブクエリが複数のレコードを返すと、実行時エラーが発生します。

```sql
-- Uncorrelated scalar subquery. If t2 contains more than one row, a runtime error may be reported.
select t1.*, (select t2.c1 from t2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
