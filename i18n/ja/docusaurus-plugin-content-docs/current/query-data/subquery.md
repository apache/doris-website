---
{
    "title": "サブクエリ",
    "language": "ja",
    "description": "Doris のサブクエリガイド。スカラー、非スカラー、相関、非相関サブクエリの構文、制約、および Mark Join による処理を説明します。",
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

サブクエリは、別のクエリ（通常は SELECT 文）の中に入れ子になった SQL クエリです。SELECT、FROM、WHERE、HAVING 句に記述でき、外側のクエリにデータや条件を提供します。サブクエリを使うと、より複雑な絞り込み、集計、結合のロジックを一つの SQL 文で実現できます。

このドキュメントでは、Doris におけるサブクエリの分類、サポート範囲、制約、および特殊なケースで使用する Mark Join の仕組みを説明します。

## 利用シーン

サブクエリは、主に次のような場合に使用します。

- **複雑な絞り込み**: `WHERE` 句または `HAVING` 句でサブクエリを使い、絞り込み条件を動的に計算します。
- **派生列の計算**: `SELECT` リストでスカラーサブクエリを使い、列を追加します。
- **派生テーブル**: `FROM` 句でサブクエリを、結合に参加する一時的なテーブルとして使用します。
- **存在チェック**: `EXISTS`/`NOT EXISTS` または `IN`/`NOT IN` を使い、集合間の関係を評価します。

## サブクエリの基本的な特徴

サブクエリを使う際は、次の基本的な特徴に注意してください。

| 特徴 | 説明 |
| --- | --- |
| 記述位置 | `SELECT`、`FROM`、`WHERE`、`HAVING` 句に記述でき、`SELECT`、`UPDATE`、`INSERT`、`DELETE`、および `=`、`>`、`<`、`<=`、`IN`、`EXISTS` などの式演算子と組み合わせて使用できます。 |
| 外側と内側の関係 | 外側のクエリをメインクエリ、その中に入れ子になったクエリをサブクエリと呼びます。 |
| 実行順序 | 独立したサブクエリは通常先に実行されます。相関がある場合は、必要に応じてパーサーが実行順序を決定し、サブクエリの結果をメインクエリに渡します。 |
| 構文上の制約 | メインクエリと区別するため、サブクエリは括弧で囲む必要があります。 |

以下の例では、いずれも `t1` と `t2` の二つのテーブルを使用します。DDL は次のとおりです。

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

## サブクエリの分類

サブクエリは、**返すデータの特徴**と**外側のクエリの列を参照するかどうか**という二つの観点で分類できます。

### 返すデータの特徴による分類

返すデータの特徴によって、サブクエリはスカラーサブクエリと非スカラーサブクエリに分けられます。

| 種類 | 返す結果 | テーブルが空の場合の戻り値 | 使用できる場所 |
| --- | --- | --- | --- |
| スカラーサブクエリ | 単一の値（一行一列の関係） | `NULL` | 単一値の式を使用できる場所 |
| 非スカラーサブクエリ | 関係（複数の行や列を含むことが可能） | 空集合（0 行） | 関係（集合）を使用できる場所 |

例（`t2` が空の場合、二つのサブクエリは異なる結果を返します）。

```sql
-- Scalar subquery. When t2 is empty, the subquery returns the scalar value null.
select * from t1 where t1.c1 > (select sum(t2.c1) from t2);

-- Non-scalar subquery. When t2 is empty, the subquery returns an empty set (0 rows).
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

### 外側のクエリの列を参照するかどうかによる分類

サブクエリが外側のクエリの列を参照するかどうかによって、相関サブクエリと非相関サブクエリに分けられます。

| 種類 | 外側のクエリの列を参照するか | 実行方法 |
| --- | --- | --- |
| 非相関サブクエリ | いいえ | 通常は独立して一度だけ評価でき、その結果を外側のクエリで使用します。 |
| 相関サブクエリ | はい（一般にサブクエリの `WHERE` 句で参照） | 外側のテーブルの各行に対してサブクエリを一回実行する必要があり、外側のテーブルに対するフィルター操作に相当します。 |

例：

```sql
-- Correlated subquery. The subquery uses the outer table column t1.c2.
select * from t1 where t1.c1 in (select t2.c1 from t2 where t2.c2 = t1.c2);

-- Uncorrelated subquery. The subquery does not reference any column of the outer table t1.
select * from t1 where t1.c1 in (select t2.c1 from t2);
```

## Doris がサポートするサブクエリ

<!-- Knowledge type: Capability support matrix -->

Doris は、すべての非相関サブクエリをサポートします。相関サブクエリのサポート範囲は次のとおりです。

- `WHERE` 句と `HAVING` 句の相関スカラーサブクエリをサポートします。
- `IN`、`NOT IN`、`EXISTS`、`NOT EXISTS` を使用した、`WHERE` 句と `HAVING` 句の相関非スカラーサブクエリをサポートします。
- `SELECT` リストの相関スカラーサブクエリをサポートします。
- 入れ子になったサブクエリでは、直近の親クエリとの相関のみをサポートします。さらに外側のクエリとの、階層をまたぐ相関はサポートしません。

## 相関サブクエリの制約

<!-- Knowledge type: Usage limitations -->
<!-- Applicable scenarios: SQL error troubleshooting / Rewriting correlated subqueries -->

Doris では、相関サブクエリの形式によって制約が異なります。以下でそれぞれ説明します。

### 相関スカラーサブクエリの制約

次の二つの条件を両方満たす必要があります。

- 相関条件は等値条件でなければなりません。
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

### 相関 (NOT) EXISTS サブクエリの制約

- サブクエリでは `offset` と `limit` を同時に使用できません。

```sql
-- With limit but without offset: supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2);

-- The equivalent rewritten SQL:
select * from t1 left semi join t2 on t1.c2 = t2.c2;

-- With both offset and limit: not supported.
select * from t1 where exists (select t2.c1 from t2 where t1.c2 = t2.c2 limit 2, 3);
```

### 相関 (NOT) IN サブクエリの制約

次の三つの条件をすべて満たす必要があります。

- サブクエリの出力は一列でなければなりません。
- サブクエリでは `limit` を使用できません。
- サブクエリでは集約関数や `group by` 句を使用できません。

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

### 入れ子になったサブクエリの制約

現在、サブクエリとその直近の親クエリの間の相関のみをサポートします。さらに外側のクエリとの相関はサポートしません。

以下のように定義した `t3` テーブルもあるとします。

```sql
create table t3
(
    c1 bigint,
    c2 bigint
)
DISTRIBUTED BY HASH(c1) BUCKETS 3
PROPERTIES ("replication_num" = "1");
```

- サポート対象：サブクエリは直近の親クエリの列のみを参照します。

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

- サポート対象外：最も内側のサブクエリが、直近の親クエリの `t2.c2` と、最も外側のクエリの `t1.c1` の両方を参照します。

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

## Mark Join

<!-- Knowledge type: Execution mechanism -->
<!-- Applicable scenarios: When a subquery has an OR relationship with other filter conditions -->

`WHERE` 句で `(NOT) IN` または `(NOT) EXISTS` サブクエリが別の絞り込み条件と `OR` で結ばれている場合、正しい結果を得るには特別な処理が必要です。例：

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

上記の `EXISTS` 句をそのまま `LEFT SEMI JOIN` に書き換えると、その意味上、`t1` の行のうち `t1.c2 = t2.c2` を満たす行しか返されません。しかし、`t1.c1 > 0` を満たす行も返す必要があります。このために、Doris は **Mark Join** という仕組みを導入しています。

:::info 注記
`RIGHT SEMI JOIN` も同様で、左右のテーブルが入れ替わるだけです。ここでは `LEFT SEMI JOIN` を例にします。
:::

例として、次の SQL を示します。

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

Mark Join と通常の `LEFT SEMI JOIN` の違いは次のとおりです。通常の `LEFT SEMI JOIN` は条件を満たす左側のテーブルの行を直接出力します。一方、Mark Join は左側のテーブルの元の行に加え、値が `TRUE`、`FALSE`、または `NULL` のフラグ列（この例では `mark_join_flag`）を出力します。このフラグの値は `JOIN` 条件式 `t1.c2 = t2.c2` によって決まります。各行に対応するフラグ値は次のとおりです。

| t1.c2 | t2.c2 | mark_join_flag |
| ----- | ----- | -------------- |
| 1     | 1     | TRUE           |
| 1     | 2     | FALSE          |
| 1     | NULL  | NULL           |
| NULL  | 1     | NULL           |
| NULL  | NULL  | NULL           |

このフラグ列を使うと、元の `WHERE` 句の絞り込み条件を `where mark_join_flag or t1.c1 > 0` と書き換えられ、正しい結果が得られます。

## FAQ

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting runtime errors of scalar subqueries -->

スカラーサブクエリの出力は単一の値でなければならないため、サブクエリが複数のレコードを返すと実行時エラーになります。

### 相関スカラーサブクエリが複数行を返す場合

相関スカラーサブクエリを使用するとき、外側のクエリのある行に対し、相関条件に一致する行をサブクエリが複数返すと、実行時エラーが発生します。

```sql
-- Correlated scalar subquery. If more than one row in t2 satisfies t1.c2 = t2.c2, a runtime error is reported.
select t1.*, (select t2.c1 from t2 where t1.c2 = t2.c2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT][E33] correlate scalar subquery must return only 1 row
```

### 非相関スカラーサブクエリが複数行を返す場合

Doris は実行時に `assert num rows` 演算子を追加します。サブクエリが複数のレコードを返すと、実行時エラーが発生します。

```sql
-- Uncorrelated scalar subquery. If t2 contains more than one row, a runtime error may be reported.
select t1.*, (select t2.c1 from t2) from t1;

-- Example error message:
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[CANCELLED]Expected EQ 1 to be returned by expression
```
