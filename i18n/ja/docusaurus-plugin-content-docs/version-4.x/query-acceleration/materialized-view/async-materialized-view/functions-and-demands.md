---
{
    "title": "非同期マテリアライズドビューの管理とクエリ",
    "language": "ja",
    "description": "Doris で非同期マテリアライズドビューを作成し、直接クエリと透過的なクエリ書き換えによってクエリを高速化する方法。更新ポリシー、パーティション設定、運用について説明します。",
    "keywords": ["Doris 非同期マテリアライズドビュー", "CREATE MATERIALIZED VIEW", "透過的なクエリ書き換え", "マテリアライズドビューの更新", "パーティション化されたマテリアライズドビュー", "ネストされたマテリアライズドビュー"]
}
---

<!-- Knowledge type: Operations manual + Reference documentation -->
<!-- Applicable scenarios: Use Doris async materialized views to accelerate queries, build data models, and operate and manage materialized views -->

非同期マテリアライズドビューは、Doris が提供する事前計算に基づく高速化機能です。この記事では、実際の利用手順に沿って、次のトピックを順に説明します。

- **マテリアライズドビューの作成**: 構文、更新ポリシー、パーティション設定。
- **マテリアライズドビューのクエリ**: 直接クエリと透過的なクエリ書き換え。
- **マテリアライズドビューの運用**: 変更、削除、監視、および関連パラメータの設定。

読み進める前に、次の事項を確認してください。

- 非同期マテリアライズドビューの基本概念と適用シナリオを理解していること。
- 新しいオプティマイザが有効になっていること（`enable_nereids_planner = true`）。
- 基本的なテーブル作成と SQL 構文を理解していること。

---

## 1. マテリアライズドビューの作成

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building an async materialized view for the first time -->

### 1.1 権限

マテリアライズドビューを作成するには、次の二種類の権限が必要です。

- **マテリアライズドビューの作成権限**: テーブルの作成権限と同じです。
- **ベーステーブルのクエリ権限**: SELECT 権限と同じです（マテリアライズドビューの定義 SQL が参照するベーステーブルに対するクエリ権限）。

### 1.2 作成構文

非同期マテリアライズドビューの作成構文全体は次のとおりです。

```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ]
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [refresh_trigger]]
    [ [DUPLICATE] KEY (<key_cols>) ]
    [ COMMENT '<table_comment>' ]
    [ PARTITION BY (
        { <partition_col>
            | DATE_TRUNC(<partition_col>, <partition_unit>) }
                    )]
    [ DISTRIBUTED BY { HASH (<distribute_cols>) | RANDOM }
        [ BUCKETS { <bucket_count> | AUTO } ]
    ]
    [ PROPERTIES (
          -- Table property
          <table_property>
          -- Additional table properties
          [ , ... ])
    ]
    AS <query>
```

### 1.3 更新設定

更新設定には、**更新タイミング（build_mode）**、**更新方式（refresh_method）**、**トリガー方式（refresh_trigger）**の三種類のパラメータがあります。

#### 1.3.1 パラメータの概要

| カテゴリ | 値 | 説明 |
| -------- | ------------- | -------------------------------------------------------------------------- |
| 更新タイミング | `IMMEDIATE`   | 作成直後に更新します（デフォルト）。 |
| 更新タイミング | `DEFERRED`    | 作成後の更新を延期します。 |
| 更新方式 | `COMPLETE`    | 全パーティションを完全更新します。 |
| 更新方式 | `AUTO`        | 可能な場合は増分更新し、変更を検出できない場合は完全更新に切り替えます。 |
| トリガー方式 | `ON MANUAL`   | ユーザーが SQL 文で手動実行します。 |
| トリガー方式 | `ON SCHEDULE` | 指定した間隔で定期的に実行します。 |
| トリガー方式 | `ON COMMIT`   | ベーステーブルのデータが変更されたときに自動実行します（Apache Doris 2.1.4 以降でサポート）。 |

#### 1.3.2 ON MANUAL: 手動トリガー

SQL 文を使用してマテリアライズドビューの更新を実行します。次の三つの方法があります。

**方法 1**: 前回の更新以降にベーステーブルのパーティションデータが変更されたかを検出し、変更されたパーティションのみを更新します。

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip ヒント
- マテリアライズドビューの定義 SQL が参照するベーステーブルが JDBC テーブルの場合、Doris はそのデータの変更を検出できません。そのため、更新時に `COMPLETE` を指定してください。指定しないと、ベーステーブルにデータがあるのにマテリアライズドビューにはない状態になることがあります。
- 現在、Doris がデータの変更を検出できるのは内部テーブルと Hive データソースのテーブルのみです。その他のデータソースへの対応は順次進められています。
:::

**方法 2**: ベーステーブルのパーティションデータの変更確認を省略し、マテリアライズドビューの全パーティションを直接更新します。

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**方法 3**: 指定したパーティションのみを更新します。

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip ヒント
- `partitionName` は `SHOW PARTITIONS FROM mvName` で確認できます。
- Hive のベーステーブルでパーティションデータの変更を検出する機能は、バージョン 2.1.3 以降でサポートされています。その他の外部テーブルはまだサポートされていません。内部テーブルは常にサポートされています。
:::

#### 1.3.3 ON SCHEDULE: 定期トリガー

作成文で更新間隔を指定します。`refreshUnit` には `minute`、`hour`、`day`、`week` などを使用できます。

**例 1**: 完全更新（`REFRESH COMPLETE`）を 10 時間ごとに実行し、全パーティションを更新します。

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**例 2**: 可能な場合は増分更新（`REFRESH AUTO`）を 10 時間ごとに実行します。データが変更されたパーティションのみを更新し、増分更新ができない場合は完全更新に切り替えます。

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip ヒント
バージョン 2.1.3 以降、Doris は Hive テーブルで更新が必要なパーティションを自動的に計算できます。
:::

#### 1.3.4 ON COMMIT: 自動トリガー

:::tip ヒント
この機能は Apache Doris 2.1.4 以降でサポートされています。
:::

ベーステーブルのデータが変更されると、対応するマテリアライズドビューの更新が自動的に実行されます。更新されるパーティションの範囲は、定期トリガーの場合と同じです。

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

`t1` はベーステーブル `lineitem` のパーティションです。そのデータが変更されると、マテリアライズドビューの対応するパーティションの更新が自動的に実行されます。

:::caution 注意
ベーステーブルのデータが頻繁に変更される場合、更新タスクが頻繁に作成され、多くのリソースを消費するため、このトリガー方式は推奨されません。
:::

詳細は [REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW) を参照してください。

#### 1.3.5 完全な例

次の一連の例では、更新の仕組みを示します。まず、ベーステーブルを作成してデータを初期化します。

```sql
CREATE TABLE IF NOT EXISTS lineitem (
    l_orderkey    integer not null,
    l_partkey     integer not null,
    l_suppkey     integer not null,
    l_linenumber  integer not null,
    l_quantity    decimalv3(15,2) not null,
    l_extendedprice  decimalv3(15,2) not null,
    l_discount    decimalv3(15,2) not null,
    l_tax         decimalv3(15,2) not null,
    l_returnflag  char(1) not null,
    l_linestatus  char(1) not null,
    l_shipdate    date not null,
    l_commitdate  date not null,
    l_receiptdate date not null,
    l_shipinstruct char(25) not null,
    l_shipmode     char(10) not null,
    l_comment      varchar(44) not null
)
DUPLICATE KEY(l_orderkey, l_partkey, l_suppkey, l_linenumber)
PARTITION BY RANGE(l_shipdate)
(FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(l_orderkey) BUCKETS 3;

INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-17', '2023-10-17', '2023-10-17', 'a', 'b', 'yyyyyyyyy'),
(2, 4, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-18', '2023-10-18', '2023-10-18', 'a', 'b', 'yyyyyyyyy'),
(3, 2, 4, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-19', '2023-10-19', '2023-10-19', 'a', 'b', 'yyyyyyyyy');

CREATE TABLE IF NOT EXISTS orders (
    o_orderkey       integer not null,
    o_custkey        integer not null,
    o_orderstatus    char(1) not null,
    o_totalprice     decimalv3(15,2) not null,
    o_orderdate      date not null,
    o_orderpriority  char(15) not null,
    o_clerk          char(15) not null,
    o_shippriority   integer not null,
    o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
FROM ('2023-10-17') TO ('2023-11-01') INTERVAL 1 DAY)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3;

INSERT INTO orders VALUES
(1, 1, 'o', 9.5, '2023-10-17', 'a', 'b', 1, 'yy'),
(1, 1, 'o', 10.5, '2023-10-18', 'a', 'b', 1, 'yy'),
(2, 1, 'o', 11.5, '2023-10-19', 'a', 'b', 1, 'yy'),
(3, 1, 'o', 12.5, '2023-10-19', 'a', 'b', 1, 'yy');

CREATE TABLE IF NOT EXISTS partsupp (
    ps_partkey     INTEGER NOT NULL,
    ps_suppkey     INTEGER NOT NULL,
    ps_availqty    INTEGER NOT NULL,
    ps_supplycost  DECIMALV3(15,2)  NOT NULL,
    ps_comment     VARCHAR(199) NOT NULL
)
DUPLICATE KEY(ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH(ps_partkey) BUCKETS 3;

INSERT INTO partsupp VALUES
(2, 3, 9, 10.01, 'supply1'),
(4, 3, 10, 11.01, 'supply2'),
(2, 3, 10, 11.01, 'supply3');
```

**例 1: 即時の増分更新 + 手動トリガー**

更新タイミングは作成直後（`BUILD IMMEDIATE`）、更新方式は可能な場合に増分更新（`REFRESH AUTO`）、トリガー方式は手動（`ON MANUAL`）です。パーティション化されていないマテリアライズドビューにはパーティションが一つしかないため、ベーステーブルのデータが変更されると完全更新が実行されます。

```sql
CREATE MATERIALIZED VIEW mv_1_0
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**例 2: 遅延の完全更新 + スケジュールトリガー**

更新タイミングは遅延（`BUILD DEFERRED`）、更新方式は完全更新（`REFRESH COMPLETE`）です。初回の更新時刻は `2024-12-01 20:30:00` で、その後は一日に一回更新されます。

:::tip ヒント
`STARTS` で指定する時刻は現在時刻より後でなければなりません。`BUILD IMMEDIATE` を指定した場合、作成直後に一回更新され、その後は `2024-12-01 20:30:00` から一日に一回更新されます。
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

**例 3: 即時の完全更新 + 自動トリガー**

更新タイミングは即時（`BUILD IMMEDIATE`）、更新方式は完全更新（`REFRESH COMPLETE`）、トリガー方式は自動（`ON COMMIT`）です。`orders` または `lineitem` のデータが変更されると、更新が自動的に実行されます。

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linestatus,
    to_date(o_orderdate) as date_alias,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

### 1.4 パーティション設定

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building partitioned materialized views and accelerating partition-grained queries -->

パーティション化されたマテリアライズドビューを作成する場合は、`PARTITION BY` を指定する必要があります。**パーティション列が参照する式で使用できるのは、`date_trunc` 関数と識別子のみです。**

#### 1.4.1 有効なパーティション列の例

パーティション列が参照する式では、`date_trunc` 関数のみを使用しています。パーティション化されたマテリアライズドビューの更新方式は通常 `AUTO` です。

```sql
CREATE MATERIALIZED VIEW mv_2_0
BUILD IMMEDIATE
REFRESH AUTO
ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(o_orderdate, 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

#### 1.4.2 無効なパーティション列の例

次の文ではパーティション列に `date_add()` 関数を使用しているため、マテリアライズドビューの作成に失敗します。

```sql
CREATE MATERIALIZED VIEW mv_2_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (order_date_month)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linestatus,
    date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,
    o_shippriority
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```

エラーメッセージ: `because column to check use invalid implicit expression, invalid expression is days_add(o_orderdate#4, 2)`。

#### 1.4.3 ベーステーブルの複数列パーティション

現在、複数列によるパーティション分割がサポートされるのは Hive 外部テーブルのみです。たとえば、第一階層を日付、第二階層を地域でパーティション分割した場合、マテリアライズドビューはどちらの階層のパーティション列も自身のパーティション列として選択できます。

Hive テーブルの作成文:

```sql
CREATE TABLE hive1 (
    `k1` int)
PARTITIONED BY (
    `year` int,
    `region` string)
STORED AS ORC;

ALTER TABLE hive1 ADD IF NOT EXISTS
PARTITION(year=2020, region="bj")
PARTITION(year=2020, region="sh")
PARTITION(year=2021, region="bj")
PARTITION(year=2021, region="sh")
PARTITION(year=2022, region="bj")
PARTITION(year=2022, region="sh");
```

**シナリオ 1: `year` をパーティション列に使用する。** マテリアライズドビュー `mv_hive` には、`('2020')`、`('2021')`、`('2022')` の三つのパーティションが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**シナリオ 2: `region` をパーティション列に使用する。** マテリアライズドビュー `mv_hive2` には、`('bj')` と `('sh')` の二つのパーティションが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 ベーステーブルの一部のパーティションのみを使用する

適用シナリオ: ベーステーブルに多数のパーティションがあるものの、マテリアライズドビューでは最近の「ホット」データのみを対象にする場合。

ベーステーブルの作成文:

```sql
CREATE TABLE t1 (
    `k1` INT,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
    PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
    PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
    PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

マテリアライズドビューは直近一日分のデータのみを同期します。現在時刻が `2024-03-28 xx:xx:xx` の場合、マテリアライズドビューにあるのはパーティション `[("2024-03-28"),("2024-03-29")]` のみです。

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`k2`)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
    'partition_sync_limit' = '1',
    'partition_sync_time_unit' = 'DAY'
)
AS
SELECT * FROM t1;
```

一日後の `2024-03-29 xx:xx:xx` に `t1` に新しいパーティション `[("2024-03-29"),("2024-03-30")]` が追加されます。マテリアライズドビューを更新すると、マテリアライズドビューにあるのはパーティション `[("2024-03-29"),("2024-03-30")]` のみになります。

:::tip ヒント
パーティション列が文字列型の場合は、マテリアライズドビューのプロパティ `partition_date_format` を設定できます。たとえば `%Y-%m-%d` です。
:::

#### 1.4.5 パーティションのロールアップ

:::tip ヒント
範囲パーティション分割は Doris 2.1.5 以降でサポートされています。
:::

**適用シナリオ**: ベーステーブルのデータを集約すると、各パーティションのデータ量が大幅に減少します。パーティションのロールアップにより、マテリアライズドビューのパーティション数を減らせます。

ベーステーブルの作成文:

```sql
CREATE TABLE `t1` (
    `k1` LARGEINT NOT NULL,
    `k2` DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(`k1`)
COMMENT 'OLAP'
PARTITION BY range(`k2`)
(
    PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
    PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
    PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(`k1`) BUCKETS 2;
```

**月単位のロールアップ**: マテリアライズドビューには `[("2020-01-01","2020-02-01")]` と `[("2020-02-01","2020-03-01")]` の二つのパーティションが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**年単位のロールアップ**: マテリアライズドビューには `[("2020-01-01","2021-01-01")]` の一つのパーティションのみが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip ヒント
パーティション列が文字列型の場合は、`partition_date_format` プロパティを設定して日付形式を指定できます。たとえば `'%Y-%m-%d'` です。
:::

詳細は [CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW) を参照してください。

#### 1.4.6 複数ソースに基づくパーティション更新

**定義**: 非同期マテリアライズドビューでは、複数のパーティション追跡テーブルを使用できます。これらのテーブルのいずれかでデータが変更された場合、マテリアライズドビューは完全更新ではなくパーティション更新を実行します。

**制限事項**:

- `INNER JOIN` または `UNION`（`UNION ALL` を含む）に基づくマテリアライズドビューのみをサポートします。
- マテリアライズドビューで `UNION` を使用する場合、結合に参加するすべての部分がパーティション変更追跡（PCT）をサポートしている必要があります。たとえば、マテリアライズドビューを `q1 union all q2` と定義する場合、`q1` と `q2` をそれぞれ単独でマテリアライズドビューにしたときにパーティション更新をサポートし、導出されるパーティション列の順序が一致している必要があります。
- 複数の PCT テーブルでパーティションの粒度を揃える必要があります。

    **許可される例**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    Partitions of base table t2: [2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    複数のベーステーブルのパーティションは完全には一致しませんが、重複していません。

    **許可されない例**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    Partitions of base table t2: [2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    `[2020-01-01, 2020-01-03)` と `[2020-01-01, 2020-01-02)` は重複していますが、同一ではありません。

### 1.5 SQL 定義に関する注意事項

非同期マテリアライズドビューは内部ビュー（View）を基に作成できますが、**外部データソースのビューを基に作成することはできません**。

次の点に注意してください。

- マテリアライズドビューが依存する内部ビューを変更または再作成すると、非同期マテリアライズドビューのデータはベーステーブルと不整合になります。この場合、マテリアライズドビューのデータは残りますが、透過的なクエリ書き換えには使用できません。
- 非同期マテリアライズドビューが依存するパーティション追跡テーブルまたは列に影響する構造変更や、スキーマの変更があると、マテリアライズドビューの更新は失敗します。
- 変更が上記の要素に影響しない場合、マテリアライズドビューは更新後に通常どおり使用できるようになります。

---

## 2. マテリアライズドビューのクエリ

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Use materialized views to accelerate queries -->

マテリアライズドビューをクエリする方法には、**直接クエリ**と**透過的なクエリ書き換え**の二つがあります。

| クエリ方法 | 元のクエリの変更が必要か | 適用シナリオ |
| ------------ | ------------------ | ---------------------------------------------- |
| 直接クエリ | はい | マテリアライズドビューの存在が分かっており、その事前計算結果を明示的に使用したい場合。 |
| 透過的な書き換え | いいえ | ユーザーが意識することなく、マテリアライズドビューを利用してクエリを高速化したい場合。 |

### 2.1 マテリアライズドビューへの直接クエリ

マテリアライズドビューはテーブルと同様に扱えます。フィルター条件や集約などを適用して直接クエリできます。

**マテリアライズドビューの定義**:

```sql
CREATE MATERIALIZED VIEW mv_5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

**元のクエリ**:

```sql
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```

**マテリアライズドビューに対する同等の直接クエリ**（ユーザーによる手動の書き換えが必要）:

```sql
SELECT
    l_linenumber,
    o_custkey
FROM mv_5
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

### 2.2 透過的なクエリ書き換え

**透過的な書き換え**とは、ユーザーがクエリを手動で変更しなくても、システムが処理中にクエリを自動的に最適化・書き換えすることです。Doris の非同期マテリアライズドビューは、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを使用します。このアルゴリズムは SQL の構造情報を解析して適切なマテリアライズドビューを自動的に探し、クエリに応答する最適な結果を選択します。

次の表に、Doris がサポートする透過的な書き換えの機能をまとめます。

| 書き換え機能 | 適用シナリオ |
| ------------------ | ------------------------------------------------------------- |
| 述語の補完 | クエリとマテリアライズドビューの `WHERE` 条件が完全には一致しない場合。 |
| JOIN の書き換え | クエリとマテリアライズドビューが同じテーブルを使用し、JOIN の種類も同じ場合。 |
| JOIN の導出 | クエリとマテリアライズドビューで JOIN の種類が異なるものの、マテリアライズドビューから十分なデータを取得できる場合。 |
| 集約の書き換え | クエリとマテリアライズドビューのグループ化ディメンションが同じ場合。 |
| 集約の書き換え（ロールアップ） | マテリアライズドビューのディメンションがクエリのディメンションを含み、クエリの集約関数をマテリアライズドビューの関数で表現できる場合。 |
| 多次元集約の書き換え | マテリアライズドビューは `GROUPING SETS`/`CUBE`/`ROLLUP` を使用しないが、クエリは多次元集約を行う場合。 |
| パーティション補完の書き換え | パーティション化されたマテリアライズドビューだけではクエリに必要なすべてのデータを提供できず、ベーステーブルと `UNION ALL` で結合する場合。 |
| ネストされたマテリアライズドビューの書き換え | 別のマテリアライズドビューの上にマテリアライズドビューを構築した場合。 |
| 非集約ビューによる集約クエリの処理 | クエリは集約クエリであり、マテリアライズドビューには集約がないものの、必要な列をすべて提供できる場合。 |
| ウィンドウ関数の書き換え | クエリとマテリアライズドビューの両方にウィンドウ関数があり、その定義が完全に一致する場合。 |
| Limit / TopN の書き換え | クエリに `ORDER BY` または `LIMIT` があり、マテリアライズドビューが要件を満たす場合。 |

#### 2.2.1 述語の補完

クエリとマテリアライズドビューの条件は同一である必要はありません。マテリアライズドビューの結果に述語を補完してクエリを表現することで、マテリアライズドビューを最大限に再利用できます。

マテリアライズドビューとクエリの `WHERE` 条件が `AND` で結合された式の場合、次の二つのケースがあります。

**ケース 1: クエリの式がマテリアライズドビューの式を含む場合**、述語を補完できます。

たとえば、クエリが `a > 5 AND b > 10 AND c = 7`、マテリアライズドビューの条件が `a > 5 AND b > 10` の場合、マテリアライズドビューの条件はクエリの条件の部分集合なので、`c = 7` の条件のみを補完します。

**ケース 2: クエリの式がマテリアライズドビューの式を完全には含まない場合**でも、クエリの条件からマテリアライズドビューの条件を導出できれば（通常は `>`、`<`、`=`、`IN` などの比較式や範囲式）、述語を補完できます。補完後の条件はクエリの条件そのものです。

たとえば、クエリが `a > 5 AND b = 10`、マテリアライズドビューの条件が `a > 1 AND b > 8` の場合、マテリアライズドビューの条件はクエリの条件を包含するため補完でき、補完後の条件は `a > 5 AND b = 10` になります。

**述語補完の制限事項**:

- `OR` で結合された式では述語の補完はサポートされません。書き換えを成功させるには条件が同一である必要があります。
- `LIKE` など、比較式でも範囲式でもない式では述語の補完はサポートされません。書き換えを成功させるには条件が同一である必要があります。

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

次のクエリはマテリアライズドビューを利用できます。透過的な書き換えによって同じマテリアライズドビューを再利用できるため、書き換え時間とビューの構築コストを削減できます。

```sql
SELECT l_linenumber,
       o_custkey,
       o_orderdate
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 2;
```

```sql
SELECT l_linenumber,
       o_custkey,
       o_orderdate
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 2 AND o_orderdate = '2023-10-19';
```

#### 2.2.2 JOIN の書き換え

**適用シナリオ**: クエリとマテリアライズドビューが同じテーブルを使用する場合。マテリアライズドビューとクエリの両方で、`WHERE` 句は JOIN の入力側にも JOIN の外側にも配置できます。オプティマイザはこのパターンのクエリに対して透過的な書き換えを試みます。

**サポートされる JOIN の種類**:

- `INNER JOIN`
- `LEFT OUTER JOIN`
- `RIGHT OUTER JOIN`
- `FULL OUTER JOIN`
- `LEFT SEMI JOIN`
- `RIGHT SEMI JOIN`
- `LEFT ANTI JOIN`
- `RIGHT ANTI JOIN`

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderdate
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```

次のクエリは透過的に書き換えられます。条件 `l_linenumber > 1` を引き上げ、マテリアライズドビューの事前計算結果を使用してクエリを表現できます。マテリアライズドビューを利用すると、JOIN の計算を省略できます。

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 JOIN の導出

クエリとマテリアライズドビューで JOIN の種類が異なる場合でも、マテリアライズドビューがクエリに必要なデータをすべて提供できれば、JOIN の外側で述語を補完して透過的な書き換えを適用できます。

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv3
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    l_suppkey,
    o_orderdate;
```

クエリ文:

```sql
SELECT
    l_shipdate, l_suppkey, o_orderdate,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_suppkey = 3
GROUP BY
    l_shipdate,
    l_suppkey,
    o_orderdate;
```

#### 2.2.4 集約の書き換え

**適用条件**: クエリとマテリアライズドビューの定義でグループ化ディメンションが同じであり、クエリで使用する集約関数をマテリアライズドビューの集約関数で表現できること。

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv4
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
GROUP BY
    o_shippriority,
    o_comment;
```

次のクエリは透過的に書き換えられます。集約のディメンションが同じであり、マテリアライズドビューの `o_shippriority` フィールドで結果を絞り込めます。GROUP BY のディメンションと集約関数の両方をマテリアライズドビューで書き換えられます。集約マテリアライズドビューを利用すると、集約の計算を減らせます。

```sql
SELECT
    o_shippriority, o_comment,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS cnt_1,
    count(distinct CASE WHEN O_SHIPPRIORITY > 2 AND o_orderkey IN (2) THEN o_custkey ELSE null END) AS cnt_2,
    sum(o_totalprice),
    max(o_totalprice),
    min(o_totalprice),
    count(*)
FROM orders
WHERE o_shippriority IN (1, 2)
GROUP BY
    o_shippriority,
    o_comment;
```

#### 2.2.5 集約の書き換え（ロールアップ）

集約のディメンションが同一でない場合も書き換えを適用できます。要件は次のとおりです。

- マテリアライズドビューの `GROUP BY` ディメンションが、クエリの `GROUP BY` ディメンションを含むこと。クエリには `GROUP BY` がなくても構いません。
- クエリの集約関数をマテリアライズドビューの集約関数で表現できること。

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT
    l_shipdate, o_orderdate, l_partkey, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    bitmap_union(to_bitmap(CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END)) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

次のクエリは透過的に書き換えられます。マテリアライズドビューのディメンションがクエリのディメンションを含むため、クエリはマテリアライズドビューの `SELECT` に含まれる関数を使用してロールアップを試みます。たとえば、マテリアライズドビューの `bitmap_union` は最終的に `bitmap_union_count` にロールアップされます。これはクエリの `count(distinct)` と意味的に一致します。

集約ロールアップにより、同じマテリアライズドビューを複数のクエリで再利用でき、構築コストを削減できます。

```sql
SELECT
    l_shipdate, l_suppkey,
    sum(o_totalprice) AS sum_total,
    max(o_totalprice) AS max_total,
    min(o_totalprice) AS min_total,
    count(*) AS count_all,
    count(distinct CASE WHEN o_shippriority > 1 AND o_orderkey IN (1, 3) THEN o_custkey ELSE null END) AS bitmap_union_basic
FROM lineitem
LEFT OUTER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
WHERE o_orderdate = '2023-10-18' AND l_partkey = 3
GROUP BY
    l_shipdate,
    l_suppkey;
```

**サポートされるロールアップ集約関数の一覧**:

| クエリ内の関数 | マテリアライズドビュー内の関数 | ロールアップ後の関数 |
| ------------------------------------------------------- | ------------------------------------------- | -------------------- |
| `max`                                                   | `max`                                       | `max`                |
| `min`                                                   | `min`                                       | `min`                |
| `sum`                                                   | `sum`                                       | `sum`                |
| `count`                                                 | `count`                                     | `sum`                |
| `count(distinct)`                                       | `bitmap_union`                              | `bitmap_union_count` |
| `bitmap_union`                                          | `bitmap_union`                              | `bitmap_union`       |
| `bitmap_union_count`                                    | `bitmap_union`                              | `bitmap_union_count` |
| `hll_union_agg`, `approx_count_distinct`, `hll_cardinality` | `hll_union` または `hll_raw_agg` | `hll_union_agg` |
| `any_value` | `any_value` または SELECT 後に `any_value` が参照する列 | `any_value` |

#### 2.2.6 多次元集約の書き換え

透過的な書き換えは多次元集約をサポートします。マテリアライズドビューは `GROUPING SETS`/`CUBE`/`ROLLUP` を使用せず、クエリが多次元集約を行い、マテリアライズドビューの `GROUP BY` 列がクエリの多次元集約で参照するすべての列を含む場合に適用できます。

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) AS sum_total,
       max(o_totalprice) AS max_total,
       min(o_totalprice) AS min_total,
       count(*) AS count_all
FROM orders
GROUP BY
    o_orderstatus, o_orderdate, o_orderpriority;
```

次のクエリはマテリアライズドビューを利用でき、集約結果を再利用して計算を減らせます。

```sql
SELECT o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
FROM orders
GROUP BY
    GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```

#### 2.2.7 パーティション補完の書き換え

**適用シナリオ**: パーティション化されたマテリアライズドビューだけではクエリに必要なすべてのデータを提供できない場合、元のベーステーブルのデータとマテリアライズドビューのデータを `UNION ALL` で結合して最終結果を返します。

**例**:

マテリアライズドビューの定義:

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
PARTITION BY (l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

ベーステーブルに新しいパーティション `2023-10-21` が追加され、マテリアライズドビューがまだ更新されていない場合、マテリアライズドビューと元のテーブルを `UNION ALL` で結合して結果を返せます。

```sql
INSERT INTO lineitem VALUES
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```

クエリ文:

```sql
SELECT l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

クエリでは事前計算済みの結果を部分的に利用できるため、対応する計算を省略できます。

書き換え後の結果の例:

```sql
SELECT *
FROM mv7
UNION ALL
SELECT t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) AS sum_total
FROM (SELECT * FROM lineitem WHERE l_shipdate = '2023-10-21') t1
LEFT JOIN orders ON t1.l_orderkey = orders.o_orderkey AND t1.l_shipdate = o_orderdate
GROUP BY
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;
```

:::caution 注意
現在、パーティション補完はサポートされていますが、条件付きの `UNION ALL` 補完はまだサポートされていません。

たとえば、マテリアライズドビューがフィルター条件 `WHERE l_shipdate > '2023-10-19'` で構築され、クエリが `WHERE l_shipdate > '2023-10-18'` の場合、現時点では `UNION ALL` による補完はできません。今後対応する予定です。
:::

:::info 注記
バージョン 3.1.0 以降、パーティション補完の書き換え機能は、内部テーブル、Hive、Iceberg、Paimon のパーティション化されたテーブルをサポートします。パーティション補完の書き換えは、これらの種類のパーティション化されたテーブルのいずれかを基にマテリアライズドビューを構築した場合にのみ実行されます。
:::

#### 2.2.8 ネストされたマテリアライズドビューの書き換え

**定義**: マテリアライズドビューの定義 SQL で別のマテリアライズドビューを使用できます。これをネストされたマテリアライズドビューと呼びます。ネストできる階層数に理論上の制限はありません。ネストされたマテリアライズドビューには直接クエリでき、透過的な書き換えにも使用できます。

**適用シナリオ**: データモデリングや複雑なクエリでよく使用します。一つのマテリアライズドビューでは透過的な書き換えを実現できない場合、複雑なクエリを分割してネストされたマテリアライズドビューを構築できます。

**例**:

内側のマテリアライズドビュー `mv8_0_inner_mv` を作成します。

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

外側のマテリアライズドビュー `mv8_0` を作成します。

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey,
    ps_availqty
FROM mv8_0_inner_mv
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```

次のクエリでは `mv8_0_inner_mv` と `mv8_0` の両方で書き換えが成功し、最終的にコストモデルが `mv8_0` を選択します。

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution 注意
- マテリアライズドビューのネストが深いほど、透過的な書き換えに時間がかかります。ネストの深さは 3 階層以下を推奨します。
- ネストされたマテリアライズドビューの透過的な書き換えはデフォルトで無効です。有効にする方法は [3.11 関連設定](#311-related-configuration) を参照してください。
:::

#### 2.2.9 非集約マテリアライズドビューによる集約クエリの処理

クエリが集約クエリで、マテリアライズドビューには集約がなくても、クエリで使用するすべての列をマテリアライズドビューが提供できれば、書き換えを適用できます。たとえば、JOIN の後に `GROUP BY` で集約するクエリでは、JOIN を含むマテリアライズドビューの利用が有効です。

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate;
```

次のクエリは `mv10_0` を利用でき、`lineitem JOIN orders` の計算を省略できます。

```sql
SELECT l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) AS sum_total
FROM lineitem
LEFT JOIN orders ON lineitem.l_orderkey = orders.o_orderkey AND l_shipdate = o_orderdate
GROUP BY
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```

#### 2.2.10 ウィンドウ関数の書き換え

クエリとマテリアライズドビューの両方にウィンドウ関数が含まれ、その定義が完全に一致する場合、透過的な書き換えを適用できます。ウィンドウ関数の書き換えでは、マテリアライズドビュー内の事前計算済みのウィンドウ関数の結果を再利用するため、複雑なウィンドウ計算を含むクエリの性能が大幅に向上します。**現在、すべてのウィンドウ関数が透過的な書き換えに対応しています。**

**例 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 1;
```

次のクエリは `mv11_0` を利用でき、ウィンドウ関数の計算を省略できます。クエリの条件 `o_orderkey > 2` がマテリアライズドビューと異なっていても、書き換えは成功します。

```sql
SELECT *
FROM (
    SELECT
        o_orderkey,
        FIRST_VALUE(o_custkey) OVER (
            PARTITION BY o_orderdate
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS first_value,
        RANK() OVER (
            PARTITION BY o_orderdate, o_orderstatus
            ORDER BY o_totalprice NULLS LAST
            RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
        ) AS rank_value
    FROM orders
) t
WHERE o_orderkey > 2;
```

**例 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderkey,
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-09';
```

次のクエリは `mv11_1` を利用でき、ウィンドウ関数の計算を省略できます。`o_orderdate` はウィンドウ関数の `PARTITION BY` フィールドなので、クエリの条件 `o_orderdate > '2023-12-10'` がウィンドウ関数の実行前に評価されても、透過的な書き換えを適用できます。

```sql
SELECT
    o_orderdate,
    FIRST_VALUE(o_custkey) OVER (
        PARTITION BY o_orderdate
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS first_value,
    RANK() OVER (
        PARTITION BY o_orderdate, o_orderstatus
        ORDER BY o_totalprice NULLS LAST
        RANGE BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    ) AS rank_value
FROM orders
WHERE o_orderdate > '2023-12-10';
```

:::tip ヒント
この例では単一のテーブルを使用していますが、ウィンドウ関数の書き換えは複数テーブルの JOIN にも適用できます。
:::

#### 2.2.11 Limit と TopN の書き換え

クエリに `ORDER BY` または `LIMIT` 句が含まれる場合（Top-N クエリ）、マテリアライズドビューがクエリの `ORDER BY` と `LIMIT` の要件を満たす十分なデータを提供できれば、オプティマイザはそのビューを使って透過的に書き換えます。これにより、一般的な Top-N 分析クエリを大幅に高速化できます。

**書き換え条件**:

| 確認項目 | 判定ルール |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | クエリの `ORDER BY` 句がマテリアライズドビューの `ORDER BY` 句と互換性があるか、同一である必要があります。 |
| LIMIT      | マテリアライズドビューに `LIMIT` がない場合、`LIMIT` を含む任意のクエリで書き換えを試せます。<br/>マテリアライズドビューに `LIMIT N` がある場合、クエリの `LIMIT M` は `M <= N` を満たす必要があります。<br/>マテリアライズドビューに `LIMIT N OFFSET L` がある場合、クエリの `LIMIT M OFFSET O` は `O >= L` かつ `M + O <= N + L` を満たす必要があります。 |
| WHERE 条件 | マテリアライズドビューとクエリのその他の `WHERE` 条件が同じである必要があります。 |

**例 1**:

```sql
CREATE MATERIALIZED VIEW mv11_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 8 OFFSET 1;
```

次のクエリは `mv11_0` を利用でき、判定条件を満たします。

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

次のクエリは `mv11_0` を利用できません。追加の条件 `o_orderdate > '2023-12-08'` があるためです。マテリアライズドビュー `mv11_0` にもこの `WHERE` 条件があれば、利用できます。

```sql
SELECT
    o_orderdate,
    count(o_shippriority),
    count(o_comment),
    l_orderkey,
    count(l_partkey)
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
GROUP BY o_orderdate, l_orderkey
LIMIT 4 OFFSET 2;
```

**例 2**:

```sql
CREATE MATERIALIZED VIEW mv11_1
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey,
    o_orderkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 4 OFFSET 2;
```

次のクエリの `ORDER BY + LIMIT` は TopN に変換されます。クエリは `mv11_1` を利用でき、判定条件を満たします。

```sql
SELECT
    o_orderdate,
    o_shippriority,
    o_comment,
    l_orderkey,
    l_partkey
FROM orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey AND l_suppkey = ps_suppkey
WHERE o_orderdate > '2023-12-08'
ORDER BY o_orderkey
LIMIT 2 OFFSET 3;
```

### 2.3 透過的な書き換えの確認（Explain）

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Debugging why a query did not hit the materialized view -->

#### 2.3.1 概要表示: EXPLAIN

マテリアライズドビューの透過的な書き換え処理の概要を表示するには、次を実行します。

```sql
EXPLAIN <query_sql>
```

返される情報（マテリアライズドビューに関連する部分の抜粋）:

```text
| MaterializedView                                                              |
| MaterializedViewRewriteSuccessAndChose:                                       |
|   Names: mv5                                                                  |
| MaterializedViewRewriteSuccessButNotChose:                                    |
|                                                                               |
| MaterializedViewRewriteFail:                                                  |
|   Name: mv4                                                                   |
|   FailSummary: Match mode is invalid, View struct info is invalid             |
|   Name: mv3                                                                   |
|   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid |
|   Name: mv1                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
|   Name: mv2                                                                   |
|   FailSummary: The columns used by query are not in view, View struct info is invalid |
```

フィールドの意味:

- **`MaterializedViewRewriteSuccessAndChose`**: 透過的な書き換えに成功し、CBO（コストベースオプティマイザ）によって選択されたマテリアライズドビュー名の一覧です。
- **`MaterializedViewRewriteSuccessButNotChose`**: 透過的な書き換えに成功したものの、最終的に CBO によって選択されなかったマテリアライズドビュー名の一覧です。
- **`MaterializedViewRewriteFail`**: 透過的な書き換えに失敗したマテリアライズドビューと、その理由の概要です。

#### 2.3.2 詳細表示: EXPLAIN MEMO PLAN

マテリアライズドビューの候補、書き換え、最終選択に至る詳細な処理を確認するには、次を実行します。

```sql
EXPLAIN MEMO PLAN <query_sql>
```

---

## 3. マテリアライズドビューの運用

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Day-to-day operations and management of materialized views -->

### 3.1 権限

| 操作 | 必要な権限 |
| ----------------------------- | ------------------------- |
| マテリアライズドビューの削除 | マテリアライズドビューに対する削除権限（テーブルの削除と同じ）。 |
| マテリアライズドビューの変更 | マテリアライズドビューに対する変更権限（テーブルの変更と同じ）。 |
| マテリアライズドビューの一時停止 / 再開 / キャンセル / 更新 | マテリアライズドビューに対する作成権限。 |

### 3.2 マテリアライズドビューの変更

#### 3.2.1 マテリアライズドビューのプロパティの変更

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
    "grace_period" = "10"
);
```

#### 3.2.2 マテリアライズドビューのアトミックな置換（名前変更）

まず、置換先として使用する新しいマテリアライズドビューを作成します。

```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1')
AS
SELECT
    l_linenumber,
    o_custkey,
    o_orderkey,
    o_orderstatus,
    l_partkey,
    l_suppkey,
    l_orderkey
FROM lineitem
INNER JOIN orders ON lineitem.l_orderkey = orders.o_orderkey;
```

`mv7` を `mv9_0` で置換し、`mv7` を削除します。

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```

### 3.3 マテリアライズドビューの削除

```sql
DROP MATERIALIZED VIEW mv_1;
```

詳細は [DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW) を参照してください。

### 3.4 マテリアライズドビューの作成文の表示

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

詳細は [SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW) を参照してください。

### 3.5 更新の一時停止 / 再開 / キャンセル

| 操作 | 参照ドキュメント |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| マテリアライズドビューの一時停止 | [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB) |
| マテリアライズドビューの再開 | [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB) |
| マテリアライズドビューの更新タスクのキャンセル | [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK) |

### 3.6 マテリアライズドビューの情報のクエリ

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G
```

返される結果の例:

```text
*************************** 1. row ***************************
                Id: 139570
              Name: mv11
           JobName: inner_mtmv_139570
             State: NORMAL
SchemaChangeDetail:
      RefreshState: SUCCESS
       RefreshInfo: BUILD IMMEDIATE REFRESH AUTO ON MANUAL
          QuerySql: SELECT l_shipdate, l_orderkey, O_ORDERDATE, count(*)
FROM lineitem
LEFT OUTER JOIN orders on l_orderkey = o_orderkey
GROUP BY l_shipdate, l_orderkey, O_ORDERDATE
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=lineitem, relatedCol='l_shipdate', partitionCol='l_shipdate'}
SyncWithBaseTables: 1
```

**主要フィールドの説明**:

- **`SyncWithBaseTables`**: マテリアライズドビューのデータがベーステーブルと整合しているかを示します。
    - 全体を構築したマテリアライズドビューでは、値が `1` の場合、透過的な書き換えに使用できます。
    - パーティション単位で増分更新するマテリアライズドビューでは、パーティション単位で判定します。一部のパーティションが利用できなくても、クエリで使用するパーティションが有効なら、透過的な書き換えに使用できます。透過的な書き換えが可能かどうかは、主にクエリが使用するパーティションの `SyncWithBaseTables` フィールドで決まります。`1` は利用可能、`0` は利用不可を意味します。
- **`JobName`**: マテリアライズドビューの構築ジョブ名です。各マテリアライズドビューに一つのジョブがあり、更新のたびに新しいタスクが作成されます。ジョブとタスクの関係は 1:n です。
- **`State`**: `SCHEMA_CHANGE` はベーステーブルのスキーマが変更されたことを示します。この状態では、マテリアライズドビューを透過的な書き換えに使用できません（直接クエリには影響しません）。次の更新が成功すると `NORMAL` に戻ります。
- **`SchemaChangeDetail`**: `SCHEMA_CHANGE` が発生した理由を示します。
- **`RefreshState`**: マテリアライズドビューの直近のタスクの更新状態です。`FAIL` の場合は、`tasks()` コマンドで失敗原因をさらに調べられます（[3.7 更新タスク（TASK）情報のクエリ](#37-query-refresh-task-task-information) を参照）。

**透過的な書き換えの状態**:

- **正常な状態**: 現在、マテリアライズドビューを透過的な書き換えに使用できます。
- **異常 / 利用不可の状態**: マテリアライズドビューを透過的な書き換えに使用できません。ただし、直接クエリは可能です。

詳細は [MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos) を参照してください。

### 3.7 更新タスク（TASK）情報のクエリ {#37-query-refresh-task-task-information}

各マテリアライズドビューに一つのジョブがあり、更新のたびに新しいタスクが作成されます。ジョブとタスクの関係は 1:n です。マテリアライズドビュー名でタスクの状態を確認するには、次を実行します。

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
    MvDatabaseName = 'mv_db_name' AND
    mvName = 'mv_name'
ORDER BY CreateTime DESC \G
```

返される結果の例:

```text
*************************** 1. row ***************************
               TaskId: 167019363907545
                JobId: 139872
              JobName: inner_mtmv_139570
                 MvId: 139570
               MvName: mv11
         MvDatabaseId: 16813
       MvDatabaseName: regression_test_nereids_rules_p0_mv
               Status: SUCCESS
             ErrorMsg:
           CreateTime: 2024-06-21 10:31:43
            StartTime: 2024-06-21 10:31:43
           FinishTime: 2024-06-21 10:31:45
           DurationMs: 2466
          TaskContext: {"triggerMode":"SYSTEM","isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
  CompletedPartitions: ["p_20231023_20231024","p_20231019_20231020","p_20231020_20231021","p_20231027_20231028","p_20231030_20231031","p_20231018_20231019","p_20231024_20231025","p_20231021_20231022","p_20231029_20231030","p_20231028_20231029","p_20231025_20231026","p_20231022_20231023","p_20231031_20231101","p_20231016_20231017","p_20231026_20231027"]
             Progress: 100.00% (15/15)
          LastQueryId: fe700ca3d6504521-bb522fc9ccf615e3
```

**主要フィールドの説明**:

- **`NeedRefreshPartitions` / `CompletedPartitions`**: このタスクで更新が必要なパーティションと、更新済みのパーティションを示します。
- **`Status`**: `FAILED` は実行の失敗を示します。`ErrorMsg` で原因を確認するか、`LastQueryId` を使って Doris のログから詳細を調べられます。現在はタスクが失敗すると、既存のマテリアライズドビューを利用できなくなります。将来的には、タスクが失敗しても既存のマテリアライズドビューを透過的な書き換えに使用できるように変更される予定です。
- **`ErrorMsg`**: 失敗の原因です。
- **`RefreshMode`**:
    - `COMPLETE`: すべてのパーティションを更新しました。
    - `PARTIAL`: 一部のパーティションを更新しました。
    - `NOT_REFRESH`: 更新が必要なパーティションはありません。

:::info 注記
- 現在、保存および表示されるタスク数のデフォルトは 100 です。`max_persistence_task_count` を `fe.conf` で変更できます。この数を超えると古いタスクレコードは破棄され、値が 1 未満の場合は永続化されません。設定を反映するには FE の再起動が必要です。
- マテリアライズドビューの作成時に `grace_period` プロパティを設定すると、`SyncWithBaseTables` が `false` または `0` の場合でも、透過的な書き換えに使用できることがあります。
- `grace_period` の単位は秒で、マテリアライズドビューとベーステーブルのデータ間で許容する不整合の期間を示します。
    - `0` に設定: 透過的な書き換えを適用するには、マテリアライズドビューのデータがベーステーブルのデータと完全に整合している必要があります。
    - `10` に設定: 10 秒の遅延を許容します。マテリアライズドビューは 10 秒以内なら透過的な書き換えに使用できます。
:::

詳細は [TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks) を参照してください。

### 3.8 マテリアライズドビューに対応する JOB のクエリ

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

詳細は [JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs) を参照してください。

### 3.9 マテリアライズドビューのパーティション情報のクエリ

パーティション化されたマテリアライズドビューでは、`SHOW PARTITIONS` を使用して `SyncWithBaseTables` の状態を確認します。

```sql
SHOW PARTITIONS FROM mv_name;
```

返される結果の例:

```Plain
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

主に確認するフィールドは `SyncWithBaseTables` です。`true` はそのパーティションを透過的な書き換えに使用できることを、`false` は使用できないことを示します。

詳細は [SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS) を参照してください。

### 3.10 マテリアライズドビューのスキーマの表示

詳細は [DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE) を参照してください。

### 3.11 関連設定 {#311-related-configuration}

<!-- Knowledge type: Reference documentation -->
<!-- Applicable scenarios: Tuning materialized view transparent rewrite behavior -->

#### 3.11.1 セッション変数のスイッチ

| スイッチ | 説明 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | 非同期マテリアライズドビューは新しいオプティマイザでのみサポートされます。透過的な書き換えが有効にならない場合は、このスイッチを有効にします。 |
| `SET enable_materialized_view_rewrite = true;`                                 | 透過的なクエリ書き換えを有効または無効にします。バージョン 2.1.5 以降はデフォルトで有効です。 |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | 透過的な書き換えに参加するマテリアライズドビューに外部テーブルを含めることを許可するかどうかを指定します。デフォルトでは許可されません。マテリアライズドビューの定義 SQL に外部テーブルがあり、透過的な書き換えに使用したい場合は、このスイッチを有効にします。 |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | CBO の候補として使用できる、書き換えに成功した結果の最大数です。デフォルトは 3 です。透過的な書き換えが遅い場合は、この値を減らします。 |
| `SET enable_materialized_view_union_rewrite = true;`                           | パーティション化されたマテリアライズドビューだけではクエリに必要なすべてのデータを提供できない場合、ベーステーブルとマテリアライズドビューを `UNION ALL` で結合して応答することを許可するかどうかを指定します。デフォルトでは許可されます。マテリアライズドビューの利用時にデータの誤りが見つかった場合は、このスイッチを無効にします。 |
| `SET enable_materialized_view_nest_rewrite = true;`                            | ネストされた書き換えを許可するかどうかを指定します。デフォルトでは許可されません。クエリ SQL が複雑で、ネストされたマテリアライズドビューを構築して利用する必要がある場合は有効にします。 |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | 透過的な書き換えで許可するリレーションマッピングの最大数です。この上限を超えるマッピングは切り捨てられます。リレーションマッピングは通常、自己結合で生成され、その数は直積になります（たとえば 3 テーブルで 8 通りの組み合わせ）。デフォルトは 8 です。透過的な書き換えが遅い場合は、この値を減らします。 |
| `SET enable_dml_materialized_view_rewrite = true;`                             | DML 実行時に構造情報に基づいてマテリアライズドビューを透過的に書き換えるかどうかを指定します。デフォルトで有効です。 |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | データの変更をリアルタイムで検出できない外部テーブルをマテリアライズドビューが含む場合に、DML 実行時に構造情報に基づく透過的な書き換えを有効にするかどうかを指定します。デフォルトで無効です。 |

#### 3.11.2 fe.conf の設定

| 設定項目 | 説明 |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | 同時に実行できるマテリアライズドビュー更新タスクの数を制御します。デフォルトは 10 です。この数を超えるタスクは保留状態になります。値を変更するには FE の再起動が必要です。 |
