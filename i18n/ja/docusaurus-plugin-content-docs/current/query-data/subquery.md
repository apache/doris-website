---
{
    "title": "サブクエリ",
    "language": "ja",
    "description": "Doris のサブクエリガイド。スカラー、非スカラー、相関、非相関サブクエリの構文、制限事項、Mark Join による処理について説明します。",
    "keywords": [
        "Doris Subquery",
        "Subquery",
        "Scalar Subquery",
        "Correlated Subquery",
        "IN EXISTS Subquery",
        "Mark Join"
    ]
}
---

<!-- Knowledge type: Capability definition + Usage limitations -->
<!-- Applicable scenarios: Writing nested SQL queries / Troubleshooting subquery errors -->

サブクエリとは、別のクエリ（通常は SELECT 文）の中に入れ子になった SQL クエリです。外側のクエリにデータや条件を提供するため、SELECT、FROM、WHERE、HAVING 句に記述できます。サブクエリを使うと、複雑な絞り込み、集約、結合のロジックを単一の SQL 文で実装できます。

このドキュメントでは、Doris におけるサブクエリの種類、サポート範囲、制限事項、および特定の状況で使用される Mark Join の仕組みを説明します。

## 適用シナリオ {#applicable-scenarios}

サブクエリは、一般に次のような場合に使用します。

- **複雑な絞り込み**：`WHERE` または `HAVING` 句でサブクエリを使い、絞り込み条件を動的に計算します。
- **派生列の計算**：`SELECT` リストでスカラーサブクエリを使い、フィールドを追加します。
- **派生テーブル**：`FROM` 句でサブクエリを一時的なテーブルとして使い、結合に参加させます。
- **存在確認**：`EXISTS`/`NOT EXISTS` または `IN`/`NOT IN` を使い、集合間の関係を評価します。

## サブクエリの基本的な特徴 {#basic-characteristics-of-subqueries}

サブクエリを使用する際は、次の基本的な特徴を押さえてください。

| 特徴 | 説明 |
| --- | --- |
| 記述位置 | `SELECT`、`FROM`、`WHERE`、`HAVING` 句に記述できます。また、`SELECT`、`UPDATE`、`INSERT`、`DELETE` や、`=`、`>`、`<`、`<=`、`IN`、`EXISTS` などの式演算子と組み合わせて使用できます。 |
| 外側と内側の関係 | 外側のクエリをメインクエリ、その中に入れ子になったクエリをサブクエリと呼びます。 |
| 実行順序 | 独立したサブクエリは通常、先に実行されます。相関がある場合は、パーサーが必要に応じて実行順序を決定し、サブクエリの結果をメインクエリに渡します。 |
| 構文上の制約 | メインクエリと区別するため、サブクエリは括弧で囲む必要があります。 |

以下の例では、いずれも `t1` と `t2` という二つのテーブルを使用します。DDL は次のとおりです。

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

## サブクエリの分類 {#categories-of-subqueries}

サブクエリは、**返されるデータの特徴**と**外側のクエリの列を参照するかどうか**という二つの観点から分類できます。

### 返されるデータの特徴による分類 {#classification-by-returned-data-characteristics}

返されるデータの特徴に基づき、サブクエリはスカラーサブクエリと非スカラーサブクエリに分けられます。

| 種類 | 返される結果 | テーブルが空の場合の戻り値 | 記述可能な位置 |
| --- | --- | --- | --- |
| スカラーサブクエリ | 単一の値（一行一列のリレーション） | `NULL` | 単一値の式を使用できる場所 |
| 非スカラーサブクエリ | リレーション（複数の行や列を含む場合があります） | 空集合（0 行） | リレーション（集合）を使用できる場所 |

例（`t2` が空の場合、二つのサブクエリは異なる結果を返します）：

```sql
-- Scalar subquery. When t2 is empty, the subquery returns the scalar value null.
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- Non-scalar subquery. When t2 is empty, the subquery returns an empty set (0 rows).
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### 外側の列を参照するかどうかによる分類 {#classification-by-whether-outer-columns-are-referenced}

サブクエリが外側のクエリの列を参照するかどうかに基づき、相関サブクエリと非相関サブクエリに分けられます。

| 種類 | 外側の列の参照 | 実行方法 |
| --- | --- | --- |
| 非相関サブクエリ | なし | 通常は独立して評価でき、得られた結果を外側のクエリで使用します。 |
| 相関サブクエリ | あり（一般にサブクエリの `WHERE` 句内） | 外側のテーブルの各行に対してサブクエリを実行する必要があり、外側のテーブルに対する絞り込み処理に相当します。 |

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

- `WHERE` 句と `HAVING` 句内の相関スカラーサブクエリをサポートします。
- `WHERE` 句と `HAVING` 句内で `IN`、`NOT IN`、`EXISTS`、`NOT EXISTS` を使用する相関非スカラーサブクエリをサポートします。
- `SELECT` リスト内の相関スカラーサブクエリをサポートします。
- 入れ子になったサブクエリでは、直上の親クエリとの相関のみをサポートします。さらに外側のクエリとの階層をまたぐ相関はサポートしません。

## 相関サブクエリの制限事項 {#limitations-of-correlated-subqueries}

<!-- Knowledge type: Usage limitations -->
<!-- Applicable scenarios: SQL error troubleshooting / Rewriting correlated subqueries -->

Doris では、相関サブクエリの形式によって制限事項が異なります。以下でそれぞれ説明します。

### 相関スカラーサブクエリの制限事項 {#limitations-of-correlated-scalar-subqueries}

4.1.5 以降、`UNION`、`INTERSECT`、`EXCEPT` などの集合演算を含み、外側の列を参照するサブクエリは、解析時に明示的に拒否されます。たとえば、`Unsupported correlated subquery with set operation` というエラーが発生します。集合演算を含む非相関サブクエリは影響を受けません。グループ化されていない集約に対する最上位の `EXISTS` または `NOT EXISTS` は、結果が判明している場合、引き続き true または false に簡約できます。この制限は、集合演算を含むすべてのサブクエリがサポートされないことを意味するものではありません。

次の二つの条件を同時に満たす必要があります。

- 相関条件は等価条件である必要があります。
- サブクエリの出力は単一の集約関数の結果である必要があり、`group by` 句を含めることはできません。

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

### 相関 (NOT) EXISTS サブクエリの制限事項 {#limitations-of-correlated-not-exists-subqueries}

- サブクエリで `offset` と `limit` を併用することはできません。

```sql
-- With limit but without offset: supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- With both offset and limit: not supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### 相関 (NOT) IN サブクエリの制限事項 {#limitations-of-correlated-not-in-subqueries}

次の三つの条件を同時に満たす必要があります。

- サブクエリの出力は単一の列である必要があります。
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

### 入れ子になったサブクエリの制限事項 {#limitations-of-nested-subqueries}

現在、サブクエリとその直上の親クエリとの相関のみをサポートします。さらに外側のクエリとの相関はサポートしません。

次のように定義された `t3` テーブルもあると仮定します。

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- サポート対象：サブクエリが直上の親クエリの列のみを参照します。

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

- サポート対象外：最も内側のサブクエリが、直上の親クエリの `t2.c2` と、最も外側のクエリの `t1.c1` の両方を参照します。

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

`WHERE` 句で、`(NOT) IN` または `(NOT) EXISTS` のサブクエリを別の絞り込み条件と `OR` で組み合わせる場合、正しい結果を得るには特別な処理が必要です。次に例を示します。

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

上記の `EXISTS` 句をそのまま `LEFT SEMI JOIN` に書き換えると、その意味上、`t1.c2 = t2.c2` を満たす `t1` の行しか返されません。しかし、`t1.c1 > 0` を満たす行も返す必要があります。これに対応するため、Doris は **Mark Join** という仕組みを導入しています。

:::info 注
`RIGHT SEMI JOIN` も同様で、左右のテーブルが入れ替わるだけです。ここでは `LEFT SEMI JOIN` を例に使用します。
:::

この SQL を模式的に表すと、次のようになります。

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

Mark Join と通常の `LEFT SEMI JOIN` の違いは次のとおりです。通常の `LEFT SEMI JOIN` は条件を満たす左側のテーブルの行を直接出力します。一方、Mark Join は元の左側のテーブルに、値が `TRUE`、`FALSE`、`NULL` のいずれかとなるフラグ列（この例では `mark_join_flag`）を追加して出力します。このフラグの値は `JOIN` 条件式 `t1.c2 = t2.c2` によって決まります。各行に対応するフラグの値を以下に示します。

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

このフラグ列を使うと、元の `WHERE` の絞り込み条件を `where mark_join_flag or t1.c1 > 0` に書き換えられ、正しい結果が得られます。

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting runtime errors of scalar subqueries -->

スカラーサブクエリの出力は単一の値でなければならないため、サブクエリが複数のレコードを返すと実行時エラーが報告されます。

### 相関スカラーサブクエリが複数行を返す場合 {#correlated-scalar-subquery-returns-multiple-rows}

相関スカラーサブクエリを使用する際、外側のある行に対して、相関条件に一致する行をサブクエリが複数返すと、実行時エラーが発生します。

```sql
-- Correlated scalar subquery. If more than one row in t2 satisfies t1.c2 = t2.c2, a runtime error is reported.
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### 非相関スカラーサブクエリが複数行を返す場合 {#uncorrelated-scalar-subquery-returns-multiple-rows}

Doris は実行時に `assert num rows` 演算子を追加します。サブクエリが複数のレコードを返すと、実行時エラーが発生します。

```sql
-- Uncorrelated scalar subquery. If t2 contains more than one row, a runtime error may be reported.
select t1.*, (select t2.c1 from t2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
