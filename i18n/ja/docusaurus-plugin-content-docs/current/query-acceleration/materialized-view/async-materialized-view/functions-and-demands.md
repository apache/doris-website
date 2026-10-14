---
{
    "title": "非同期マテリアライズドビューの管理とクエリ",
    "language": "ja",
    "description": "Doris で非同期マテリアライズドビューを作成し、直接クエリと透過的なクエリ書き換えによってクエリを高速化する方法を説明します。更新ポリシー、パーティション設定、運用操作を扱います。",
    "keywords": ["Doris 非同期マテリアライズドビュー", "CREATE MATERIALIZED VIEW", "透過的なクエリ書き換え", "マテリアライズドビューの更新", "パーティション化されたマテリアライズドビュー", "ネストされたマテリアライズドビュー"]
}
---

<!-- Knowledge type: Operations manual + Reference documentation -->
<!-- Applicable scenarios: Use Doris async materialized views to accelerate queries, build data models, and operate and manage materialized views -->

非同期マテリアライズドビューは、Doris が提供する事前計算に基づく高速化機能です。この記事では、実際の作業の流れに沿って次の内容を順に説明します。

- **マテリアライズドビューの作成**: 構文、更新ポリシー、パーティション設定。
- **マテリアライズドビューへのクエリ**: 直接クエリと透過的なクエリ書き換え。
- **マテリアライズドビューの運用**: 変更、削除、監視、および関連パラメータの設定。

読み進める前に、次の点を確認してください。

- 非同期マテリアライズドビューの基本概念と適用場面を理解していること。
- 新しいオプティマイザが有効になっていること（`enable_nereids_planner = true`）。
- 基本的なテーブル作成と SQL 構文に精通していること。

---

## 1. マテリアライズドビューの作成

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Building an async materialized view for the first time -->

### 1.1 権限

マテリアライズドビューの作成には、次の二種類の権限が必要です。

- **マテリアライズドビューの作成権限**: テーブルの作成権限と同じです。
- **ベーステーブルのクエリ権限**: SELECT 権限と同じです（マテリアライズドビューの定義 SQL が参照するベーステーブルへのクエリ権限）。

### 1.2 作成構文

非同期マテリアライズドビューの作成構文全体を次に示します。

```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ]
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [FALLBACK] [refresh_trigger]]
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

更新設定には、**更新タイミング（build_mode）**、**更新方式（refresh_method）**、**トリガー方式（refresh_trigger）** の三種類のパラメータがあります。

#### 1.3.1 パラメータの概要

| カテゴリ | 値 | 説明 |
| -------- | ------------- | -------------------------------------------------------------------------- |
| 更新タイミング | `IMMEDIATE`   | 作成直後に更新します（デフォルト）。 |
| 更新タイミング | `DEFERRED`    | 作成後の更新を延期します。 |
| 更新方式 | `COMPLETE`    | 全パーティションを更新する完全更新です。 |
| 更新方式 | `PARTITIONS`  | 変更があったマテリアライズドビューのパーティションを再計算します。 |
| 更新方式 | `INCREMENTAL` | Incremental View Maintenance（IVM）を使用して行レベルの変更を処理します。 |
| 更新方式 | `AUTO`        | Doris が IVM、パーティション更新、完全更新から自動的に選択します。 |
| トリガー方式 | `ON MANUAL`   | ユーザーが SQL 文で手動実行します。 |
| トリガー方式 | `ON SCHEDULE` | 指定した間隔で定期的に実行します。 |
| トリガー方式 | `ON COMMIT`   | ベーステーブルのデータ変更時に自動実行します（Apache Doris 2.1.4 以降でサポート）。 |

#### 1.3.2 ON MANUAL: 手動トリガー

SQL 文でマテリアライズドビューの更新を実行する場合、作成時に定義した更新方式を上書きできます。

**方法 1**: IVM を使用して、前回の更新からのベーステーブルの行レベルの変更を処理します。

```sql
REFRESH MATERIALIZED VIEW mvName INCREMENTAL FALLBACK;
```

`FALLBACK` を指定すると、IVM を安全に実行できない場合、Doris はパーティション更新または完全更新に切り替えます。`FALLBACK` を指定しない厳密な増分更新は、そのまま失敗します。IVM の前提条件、サポート範囲、フォールバック規則については、[Incremental View Maintenance（IVM）](incremental-materialized-view)を参照してください。

**方法 2**: 使用可能な更新方式を Doris に自動選択させます。

```sql
REFRESH MATERIALIZED VIEW mvName AUTO;
```

:::tip ヒント
- マテリアライズドビューの定義 SQL が参照するベーステーブルが JDBC テーブルの場合、Doris はデータ変更を検出できません。そのため、更新時には `COMPLETE` を指定する必要があります。指定しないと、ベーステーブルにはデータがあってもマテリアライズドビューにはない状態になる場合があります。
- 現在、Doris がデータ変更を検出できるのは内部テーブルと Hive データソースのテーブルのみです。ほかのデータソースへの対応は順次進められています。
:::

**方法 3**: ベーステーブルのパーティションデータの変更確認を省略し、マテリアライズドビューの全パーティションを直接更新します。

```sql
REFRESH MATERIALIZED VIEW mvName COMPLETE;
```

**方法 4**: 指定したパーティションだけを更新します。

```sql
REFRESH MATERIALIZED VIEW mvName partitions(partitionName1, partitionName2);
```

:::tip ヒント
- `partitionName` は `SHOW PARTITIONS FROM mvName` で取得できます。
- Hive のベーステーブルにおけるパーティションデータの変更検出は、バージョン 2.1.3 以降でサポートされています。ほかの外部テーブルはまだサポートされていませんが、内部テーブルは常にサポートされています。
:::

#### 1.3.3 ON SCHEDULE: 定期トリガー

作成文で更新間隔を指定します。`refreshUnit` には `minute`、`hour`、`day`、`week` などを指定できます。

**例 1**: 完全更新（`REFRESH COMPLETE`）を使用して、10 時間ごとに全パーティションを更新します。

```sql
CREATE MATERIALIZED VIEW mv_6
REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
AS
SELECT * FROM lineitem;
```

**例 2**: 可能な場合は増分更新（`REFRESH AUTO`）を使用し、10 時間ごとに更新します。データが変更されたパーティションだけを更新し、増分更新ができない場合は完全更新に切り替えます。

```sql
CREATE MATERIALIZED VIEW mv_7
REFRESH AUTO ON SCHEDULE EVERY 10 hour
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

:::tip ヒント
バージョン 2.1.3 以降、Doris は Hive テーブルで更新が必要なパーティションを自動計算できます。
:::

#### 1.3.4 ON COMMIT: 自動トリガー

:::tip ヒント
この機能は Apache Doris 2.1.4 以降でサポートされています。
:::

ベーステーブルのデータが変更されると、対応するマテリアライズドビューの更新が自動的に実行されます。更新対象のパーティション範囲は、定期トリガーの場合と同じです。

```sql
CREATE MATERIALIZED VIEW mv_8
REFRESH AUTO ON COMMIT
PARTITION BY (l_shipdate)
AS
SELECT * FROM lineitem;
```

ベーステーブルのパーティション `t1`（テーブル `lineitem`）のデータが変更されると、対応するマテリアライズドビューのパーティション更新が自動的に実行されます。

:::caution 注意
ベーステーブルのデータが頻繁に変わる場合、このトリガー方式は推奨されません。更新タスクが頻繁に作成され、過剰なリソースを消費するためです。
:::

詳しくは、[REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)を参照してください。

#### 1.3.5 一連の例

次の一連の例で更新の仕組みを示します。まず、ベーステーブルを作成してデータを初期化します。

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

**例 1: 作成直後の増分更新 + 手動トリガー**

更新タイミングは作成直後（`BUILD IMMEDIATE`）、更新方式は可能な場合に増分更新を行う `REFRESH AUTO`、トリガー方式は手動（`ON MANUAL`）です。パーティション化されていないマテリアライズドビューにはパーティションが一つしかないため、ベーステーブルのデータに変更があれば完全更新が実行されます。

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

**例 2: 更新の延期 + 完全更新 + 定期トリガー**

更新タイミングは延期（`BUILD DEFERRED`）、更新方式は完全更新（`REFRESH COMPLETE`）、初回更新時刻は `2024-12-01 20:30:00` で、その後は一日に一回更新します。

:::tip ヒント
`STARTS` で指定する時刻は現在時刻より後である必要があります。`BUILD IMMEDIATE` を指定した場合は、作成直後に一回更新し、その後は `2024-12-01 20:30:00` から一日に一回更新します。
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

**例 3: 作成直後の完全更新 + 自動トリガー**

更新タイミングは作成直後（`BUILD IMMEDIATE`）、更新方式は完全更新（`REFRESH COMPLETE`）、トリガー方式は自動（`ON COMMIT`）です。`orders` または `lineitem` のデータ変更で、自動的に更新が実行されます。

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

パーティション化されたマテリアライズドビューを作成するには、`PARTITION BY` の指定が必要です。**パーティション列が参照する式に使用できるのは、`date_trunc` 関数と識別子だけです。**

#### 1.4.1 有効なパーティション列の例

パーティション列が参照する式では、`date_trunc` 関数だけを使用しています。パーティション化されたマテリアライズドビューの更新方式には、通常 `AUTO` を使用します。

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

次の文ではパーティション列が `date_add()` 関数を使用しているため、マテリアライズドビューの作成に失敗します。

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

#### 1.4.3 ベーステーブルの複数列パーティション分割

現在、Hive 外部テーブルの複数列パーティション分割のみがサポートされています。たとえば、第一階層を日付、第二階層を地域で分割する場合、マテリアライズドビューはどちらの階層のパーティション列も自身のパーティション列として選択できます。

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

**シナリオ 1: `year` をパーティション列に使用します。** マテリアライズドビュー `mv_hive` には、`('2020')`、`('2021')`、`('2022')` の三つのパーティションが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`year`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

**シナリオ 2: `region` をパーティション列に使用します。** マテリアライズドビュー `mv_hive2` には、`('bj')` と `('sh')` の二つのパーティションが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (`region`)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```

#### 1.4.4 ベーステーブルのパーティションの一部だけを使用する

対象シナリオ: ベーステーブルに多数のパーティションがあり、マテリアライズドビューでは最近の「ホット」データだけを扱う場合。

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

マテリアライズドビューは直近一日分のデータだけを同期します。現在時刻が `2024-03-28 xx:xx:xx` の場合、マテリアライズドビューに存在するパーティションは `[("2024-03-28"),("2024-03-29")]` の一つだけです。

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

一日後、時刻が `2024-03-29 xx:xx:xx` になると、`t1` に新しいパーティション `[("2024-03-29"),("2024-03-30")]` が追加されます。マテリアライズドビューを更新すると、そこに存在するパーティションは `[("2024-03-29"),("2024-03-30")]` の一つだけになります。

:::tip ヒント
パーティション列が文字列型の場合、マテリアライズドビューのプロパティ `partition_date_format` に、たとえば `%Y-%m-%d` を設定できます。
:::

#### 1.4.5 パーティションのロールアップ

:::tip ヒント
範囲パーティション分割は Doris 2.1.5 以降でサポートされています。
:::

**対象シナリオ**: ベーステーブルのデータを集計すると、各パーティションのデータ量が大幅に減少します。パーティションのロールアップにより、マテリアライズドビューのパーティション数を減らせます。

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

**月単位のロールアップ**: マテリアライズドビューには、`[("2020-01-01","2020-02-01")]` と `[("2020-02-01","2020-03-01")]` の二つのパーティションが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

**年単位のロールアップ**: マテリアライズドビューには、`[("2020-01-01","2021-01-01")]` の一つだけが作成されます。

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED REFRESH AUTO ON MANUAL
PARTITION BY (date_trunc(`k2`, 'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT * FROM t1;
```

:::tip ヒント
パーティション列が文字列型の場合、`partition_date_format` プロパティに、たとえば `'%Y-%m-%d'` を設定して日付形式を指定できます。
:::

詳しくは、[CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW)を参照してください。

#### 1.4.6 複数ソースのパーティション更新

**定義**: 非同期マテリアライズドビューは複数のパーティション追跡対象テーブルを持てます。つまり、いずれかのテーブルのデータが変わると、完全更新ではなくパーティション更新を実行します。

**制約**:

- `INNER JOIN` または `UNION`（`UNION ALL` を含む）を使って構築したマテリアライズドビューのみをサポートします。
- マテリアライズドビューが `UNION` を使用する場合、結合に参加するすべての部分でパーティション変更追跡（PCT）をサポートする必要があります。たとえば、定義が `q1 union all q2` の場合、`q1` と `q2` はそれぞれ単独でマテリアライズドビューを作成したときにパーティション更新をサポートし、導出されるパーティション列の順序が一致している必要があります。
- 複数の PCT テーブル間で、パーティションの粒度を揃える必要があります。

    **許可される例**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)
    Partitions of base table t2: [2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)
    ```

    複数のベーステーブルのパーティションは完全に同じではありませんが、重なりはありません。

    **許可されない例**:

    ```text
    Partitions of base table t1: [2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)
    Partitions of base table t2: [2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)
    ```

    `[2020-01-01, 2020-01-03)` と `[2020-01-01, 2020-01-02)` は重なりますが、一致しません。

### 1.5 SQL 定義に関する注意事項

非同期マテリアライズドビューは内部ビュー（View）を基に作成できますが、**外部データソースのビューを基に構築することはできません**。

次の点に注意してください。

- マテリアライズドビューが依存する内部ビューを変更または再作成すると、非同期マテリアライズドビューのデータはベーステーブルと一致しなくなります。この場合、マテリアライズドビューのデータは残りますが、透過的なクエリ書き換えには使用できません。
- 構造変更が非同期マテリアライズドビューの依存するパーティション追跡対象テーブルや列に影響する場合、またはそのスキーマを変更する場合、マテリアライズドビューの更新は失敗します。
- 変更が上記の要素に影響しない場合、更新後にマテリアライズドビューを再び通常どおり使用できます。

---

## 2. マテリアライズドビューへのクエリ

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Use materialized views to accelerate queries -->

マテリアライズドビューをクエリする方法には、**直接クエリ**と**透過的なクエリ書き換え**の二つがあります。

| クエリ方法 | 元のクエリの変更が必要か | 対象シナリオ |
| ------------ | ------------------ | ---------------------------------------------- |
| 直接クエリ | はい | マテリアライズドビューが存在することが分かっており、事前計算された結果を明示的に使用する場合。 |
| 透過的な書き換え | いいえ | ユーザーに意識させずにマテリアライズドビューでクエリを高速化したい場合。 |

### 2.1 マテリアライズドビューへの直接クエリ

マテリアライズドビューはテーブルとして扱えます。フィルター条件や集計などを適用して直接クエリできます。

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

**マテリアライズドビューに対する等価な直接クエリ**（ユーザーが手動で書き換える必要があります）:

```sql
SELECT
    l_linenumber,
    o_custkey
FROM mv_5
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

### 2.2 透過的なクエリ書き換え

**透過的な書き換え**とは、ユーザーが手動でクエリを変更しなくても、システムが処理中にクエリを自動的に最適化して書き換えることです。Doris の非同期マテリアライズドビューは、SPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的な書き換えアルゴリズムを使用します。このアルゴリズムは SQL の構造情報を解析し、適切なマテリアライズドビューを自動的に見つけ、クエリに応答する最適な結果を選択します。

次の表に、Doris がサポートする透過的な書き換えの機能をまとめます。

| 書き換え機能 | 対象シナリオ |
| ------------------ | ------------------------------------------------------------- |
| 述語補完 | クエリとマテリアライズドビューの `WHERE` 条件が完全には一致しない場合。 |
| JOIN 書き換え | クエリとマテリアライズドビューが同じテーブルを、同じ JOIN 種別で使用する場合。 |
| JOIN 導出 | クエリとマテリアライズドビューの JOIN 種別は異なるものの、マテリアライズドビューが十分なデータを提供できる場合。 |
| 集計の書き換え | クエリとマテリアライズドビューのグループ化次元が同じ場合。 |
| 集計の書き換え（ロールアップ） | マテリアライズドビューの次元にクエリの次元が含まれ、クエリの集計関数をマテリアライズドビューの関数で表現できる場合。 |
| 多次元集計の書き換え | マテリアライズドビューは `GROUPING SETS`/`CUBE`/`ROLLUP` を使用せず、クエリが多次元集計を行う場合。 |
| パーティション補完による書き換え | パーティション化されたマテリアライズドビューだけではクエリに必要な全データを提供できない場合に、ベーステーブルと `UNION ALL` で結合します。 |
| ネストされたマテリアライズドビューの書き換え | 別のマテリアライズドビューを基にマテリアライズドビューを構築する場合。 |
| 集計クエリが非集計マテリアライズドビューを使用 | クエリは集計を行い、マテリアライズドビューは集計を含まないものの、必要な列をすべて提供できる場合。 |
| ウィンドウ関数の書き換え | クエリとマテリアライズドビューの両方にウィンドウ関数があり、その定義が完全に一致する場合。 |
| Limit / TopN の書き換え | クエリに `ORDER BY` または `LIMIT` があり、マテリアライズドビューが要件を満たす場合。 |

#### 2.2.1 述語補完

クエリとマテリアライズドビューの条件は同一である必要はありません。マテリアライズドビューに述語を追加してクエリを表現することで、マテリアライズドビューを最大限に再利用できます。

マテリアライズドビューとクエリの `WHERE` 条件が `AND` で結合された式の場合、次の二つのケースがあります。

**ケース 1: クエリ式がマテリアライズドビューの式を含む場合**、述語補完を適用できます。

たとえば、クエリが `a > 5 AND b > 10 AND c = 7`、マテリアライズドビューの条件が `a > 5 AND b > 10` であれば、後者は前者の部分集合なので、`c = 7` 条件だけを補完すれば済みます。

**ケース 2: クエリ式がマテリアライズドビューの式を完全には含まない場合**でも、クエリ条件からマテリアライズドビューの条件を導出できれば（一般に `>`、`<`、`=`、`IN` などの比較式や範囲式）、述語補完を適用できます。補完結果はクエリ条件そのものです。

たとえば、クエリが `a > 5 AND b = 10`、マテリアライズドビューが `a > 1 AND b > 8` の場合、マテリアライズドビューの条件はクエリ条件を包含するため補完でき、補完結果は `a > 5 AND b = 10` になります。

**述語補完の制約**:

- `OR` で結合した式では述語補完はサポートされません。書き換えを成功させるには条件が同一である必要があります。
- `LIKE` など、比較式でも範囲式でもない式では述語補完はサポートされません。書き換えを成功させるには条件が同一である必要があります。

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

次のクエリはマテリアライズドビューを使用できます。透過的な書き換えによって同じマテリアライズドビューを再利用し、書き換え時間と構築コストを削減します。

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

**対象シナリオ**: クエリとマテリアライズドビューが同じテーブルを使用する場合。マテリアライズドビューとクエリの両方で、`WHERE` 句は JOIN の入力側にも JOIN の外側にも置けます。オプティマイザは、このパターンのクエリに透過的な書き換えを試みます。

**サポートされる JOIN 種別**:

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

次のクエリは透過的に書き換えられます。条件 `l_linenumber > 1` を上位に移動し、マテリアライズドビューの事前計算結果でクエリを表現できます。マテリアライズドビューを使用すると、JOIN の計算を省けます。

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 AND o_orderdate = '2023-10-18';
```

#### 2.2.3 JOIN の導出

クエリとマテリアライズドビューの JOIN 種別が異なっていても、マテリアライズドビューがクエリに必要な全データを提供できれば、JOIN の外側で述語を補完して透過的な書き換えを適用できます。

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

#### 2.2.4 集計の書き換え

**適用条件**: クエリとマテリアライズドビューの定義でグループ化次元が同じであり、クエリで使う集計関数をマテリアライズドビューの集計関数で表現できること。

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

次のクエリは透過的に書き換えられます。集計の次元が同じであり、マテリアライズドビューの `o_shippriority` フィールドで結果をフィルターし、GROUP BY の次元と集計関数をマテリアライズドビューを使って書き換えられます。集計マテリアライズドビューを使用することで、集計の計算を削減できます。

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

#### 2.2.5 集計の書き換え（ロールアップ）

集計の次元が一致しない場合でも、次の要件を満たせば書き換えを適用できます。

- マテリアライズドビューの `GROUP BY` の次元が、クエリの `GROUP BY` の次元を含むこと。クエリに `GROUP BY` がなくても構いません。
- クエリの集計関数をマテリアライズドビューの集計関数で表現できること。

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

次のクエリは透過的に書き換えられます。マテリアライズドビューの次元がクエリの次元を含むため、クエリはマテリアライズドビューの `SELECT` にある関数を使用したロールアップを試みます。たとえば、マテリアライズドビューの `bitmap_union` は最終的に `bitmap_union_count` にロールアップされ、クエリの `count(distinct)` と意味的に一致します。

集計のロールアップにより、複数のクエリで同じマテリアライズドビューを再利用し、構築コストを削減できます。

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

**サポートされるロールアップ集計関数の一覧**:

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

#### 2.2.6 多次元集計の書き換え

透過的な書き換えは多次元集計をサポートします。マテリアライズドビューが `GROUPING SETS`/`CUBE`/`ROLLUP` を使用せず、クエリが多次元集計を行い、マテリアライズドビューの `GROUP BY` 列がクエリの多次元集計で参照するすべての列を含む場合に適用できます。

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

次のクエリはマテリアライズドビューを使用して集計結果を再利用し、計算を削減できます。

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

#### 2.2.7 パーティション補完による書き換え

**対象シナリオ**: パーティション化されたマテリアライズドビューがクエリに必要な全データを提供できない場合、元のベーステーブルのデータとマテリアライズドビューのデータを `UNION ALL` で結合し、最終結果を得ます。

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

クエリは事前計算されたマテリアライズドビューの結果を一部利用でき、それに対応する計算を省けます。

書き換え結果の例:

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
パーティション補完は現在サポートされていますが、条件付きの `UNION ALL` 補完はまだサポートされていません。

たとえば、マテリアライズドビューをフィルター条件 `WHERE l_shipdate > '2023-10-19'` で構築し、クエリが `WHERE l_shipdate > '2023-10-18'` を使用する場合、現在は `UNION ALL` で補完できません。対応が予定されています。
:::

:::info 注記
バージョン 3.1.0 以降、パーティション補完による書き換えは、内部テーブル、Hive、Iceberg、Paimon のパーティション化されたテーブルをサポートします。パーティション補完による書き換えが実行されるのは、これらの種類のパーティション化されたテーブルのいずれかを基にパーティション化されたマテリアライズドビューを構築した場合だけです。
:::

#### 2.2.8 ネストされたマテリアライズドビューの書き換え

**定義**: マテリアライズドビューの定義 SQL で別のマテリアライズドビューを使用できます。これをネストされたマテリアライズドビューと呼びます。理論上、ネストの階層数に制限はありません。ネストされたマテリアライズドビューは直接クエリでき、透過的な書き換えにも参加できます。

**対象シナリオ**: データモデリングや複雑なクエリでよく使用します。単一のマテリアライズドビューでは透過的な書き換えができない場合、複雑なクエリを分割してネストされたマテリアライズドビューを構築できます。

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

次のクエリでは、`mv8_0_inner_mv` と `mv8_0` の両方で書き換えが成功し、コストモデルが最終的に `mv8_0` を選択します。

```sql
SELECT lineitem.l_linenumber
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
INNER JOIN partsupp ON l_partkey = ps_partkey AND l_suppkey = ps_suppkey
WHERE o_orderstatus = 'o';
```

:::caution 注意
- マテリアライズドビューのネスト階層が深いほど、透過的な書き換えに時間がかかります。ネストの深さは 3 階層以下を推奨します。
- ネストされたマテリアライズドビューの透過的な書き換えは、デフォルトで無効です。有効にする方法は、[3.11 関連設定](#311-related-configuration)を参照してください。
:::

#### 2.2.9 集計クエリで非集計マテリアライズドビューを使用する

クエリが集計を行い、マテリアライズドビューに集計がなくても、マテリアライズドビューがクエリで使用するすべての列を提供できれば、書き換えを適用できます。たとえば、最初に JOIN し、その後 `GROUP BY` で集計するクエリでは、JOIN を含むマテリアライズドビューを使用すると効果的です。

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

次のクエリは `mv10_0` を使用し、`lineitem JOIN orders` の計算を省けます。

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

クエリとマテリアライズドビューの両方にウィンドウ関数があり、その定義が完全に一致する場合、透過的な書き換えを適用できます。マテリアライズドビューに事前計算されたウィンドウ関数の結果を再利用することで、複雑なウィンドウ計算を含むクエリの性能を大幅に改善できます。**現在、すべてのウィンドウ関数が透過的な書き換えをサポートしています。**

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

次のクエリは `mv11_0` を使用し、ウィンドウ関数の計算を省けます。クエリ条件 `o_orderkey > 2` がマテリアライズドビューと異なっていても、書き換えに成功します。

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

次のクエリは `mv11_1` を使用し、ウィンドウ関数の計算を省けます。`o_orderdate` はウィンドウ関数の `PARTITION BY` フィールドなので、クエリ条件 `o_orderdate > '2023-12-10'` がウィンドウ関数の実行前に評価されても、透過的な書き換えを適用できます。

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
この例では単一テーブルを使用していますが、ウィンドウ関数の書き換えは複数テーブルの JOIN にも適用できます。
:::

#### 2.2.11 Limit と TopN の書き換え

クエリに `ORDER BY` または `LIMIT` 句が含まれる場合（Top-N クエリ）、マテリアライズドビューがその `ORDER BY` と `LIMIT` の要件を満たすだけのデータを提供できれば、オプティマイザはマテリアライズドビューを使用して透過的に書き換えられます。これにより、一般的な Top-N 分析のクエリを大幅に高速化できます。

**書き換え条件**:

| 確認項目 | 判定規則 |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ORDER BY   | クエリの `ORDER BY` 句が、マテリアライズドビューの `ORDER BY` 句と互換であるか同一であること。 |
| LIMIT      | マテリアライズドビューに `LIMIT` がなければ、`LIMIT` 付きのクエリは書き換えを試みられます。<br/>マテリアライズドビューに `LIMIT N` があれば、クエリの `LIMIT M` は `M <= N` を満たす必要があります。<br/>マテリアライズドビューに `LIMIT N OFFSET L` があれば、クエリの `LIMIT M OFFSET O` は `O >= L` かつ `M + O <= N + L` を満たす必要があります。 |
| WHERE 条件 | マテリアライズドビューとクエリのその他の `WHERE` 条件が同一であること。 |

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

次のクエリは判定条件を満たし、`mv11_0` を使用できます。

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

次のクエリは `mv11_0` を使用できません。追加の条件 `o_orderdate > '2023-12-08'` があるためです。マテリアライズドビュー `mv11_0` にもこの `WHERE` 条件があれば、使用できます。

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

次のクエリの `ORDER BY + LIMIT` は TopN に変換され、判定条件を満たすため `mv11_1` を使用できます。

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

#### 2.3.1 簡易表示: EXPLAIN

マテリアライズドビューの透過的な書き換え処理の概要を確認するには、次を実行します。

```sql
EXPLAIN <query_sql>
```

返される情報（マテリアライズドビューに関する部分の抜粋）:

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

- **`MaterializedViewRewriteSuccessAndChose`**: 透過的な書き換えに成功し、CBO（コストベースオプティマイザ）に選択されたマテリアライズドビュー名の一覧。
- **`MaterializedViewRewriteSuccessButNotChose`**: 透過的な書き換えに成功したものの、最終的に CBO に選択されなかったマテリアライズドビュー名の一覧。
- **`MaterializedViewRewriteFail`**: 透過的な書き換えに失敗したマテリアライズドビューと、その理由の概要。

#### 2.3.2 詳細表示: EXPLAIN MEMO PLAN

マテリアライズドビューの候補、書き換え、最終選択の詳細な処理を確認するには、次を実行します。

```sql
EXPLAIN MEMO PLAN <query_sql>
```

---

## 3. マテリアライズドビューの保守

<!-- Knowledge type: Operations manual -->
<!-- Applicable scenarios: Day-to-day operations and management of materialized views -->

### 3.1 権限

| 操作 | 必要な権限 |
| ----------------------------- | ------------------------- |
| マテリアライズドビューの削除 | マテリアライズドビューに対する削除権限（テーブルの削除と同じ）。 |
| マテリアライズドビューの変更 | マテリアライズドビューに対する変更権限（テーブルの変更と同じ）。 |
| マテリアライズドビューの一時停止 / 再開 / キャンセル / 更新 | マテリアライズドビューの作成権限。 |

### 3.2 マテリアライズドビューの変更

#### 3.2.1 マテリアライズドビューのプロパティの変更

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
    "grace_period" = "10"
);
```

#### 3.2.2 マテリアライズドビューのアトミックな置換（名前の変更）

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

`mv7` を `mv9_0` に置き換え、`mv7` を削除します。

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```

### 3.3 マテリアライズドビューの削除

```sql
DROP MATERIALIZED VIEW mv_1;
```

詳しくは、[DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW)を参照してください。

### 3.4 マテリアライズドビューの作成文の表示

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```

詳しくは、[SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW)を参照してください。

### 3.5 更新の一時停止 / 再開 / キャンセル

| 操作 | リファレンスドキュメント |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| マテリアライズドビューの一時停止 | [PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB) |
| マテリアライズドビューの再開 | [RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB) |
| マテリアライズドビューの更新タスクのキャンセル | [CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK) |

### 3.6 マテリアライズドビュー情報の照会

```sql
SELECT *
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G
```

戻り値の例:

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

**主なフィールドの説明**:

- **`SyncWithBaseTables`**: マテリアライズドビューのデータがベーステーブルと一致しているかどうか。
    - 完全に構築されたマテリアライズドビューでは、値 `1` は透過的な書き換えに使用できることを示します。
    - パーティション単位で増分更新されるマテリアライズドビューでは、パーティション単位で判定します。一部のパーティションが使用できなくても、クエリ対象のパーティションが有効なら、透過的な書き換えに使用できます。透過的な書き換えが可能かどうかは、主にクエリが使用するパーティションの `SyncWithBaseTables` フィールドによって決まります。`1` は使用可能、`0` は使用不可を意味します。
- **`JobName`**: マテリアライズドビューの構築ジョブ名。各マテリアライズドビューには一つのジョブがあり、更新ごとに新しいタスクが作成されます。ジョブとタスクは 1:n の関係です。
- **`State`**: `SCHEMA_CHANGE` はベーステーブルのスキーマが変更されたことを示します。この場合、マテリアライズドビューは透過的な書き換えに使用できません（直接クエリには影響しません）。次の更新が成功すると `NORMAL` に戻ります。
- **`SchemaChangeDetail`**: `SCHEMA_CHANGE` が発生した理由を示します。
- **`RefreshState`**: マテリアライズドビューの直近のタスクの更新状態。`FAIL` の場合は `tasks()` コマンドで失敗原因をさらに調査できます（[3.7 更新タスク（TASK）情報の照会](#37-query-refresh-task-task-information)を参照）。

**透過的な書き換えの状態**:

- **正常**: マテリアライズドビューは現在、透過的な書き換えに使用できます。
- **異常 / 使用不可**: マテリアライズドビューは透過的な書き換えには使用できませんが、直接クエリは可能です。

詳しくは、[MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv_infos)を参照してください。

### 3.7 更新タスク（TASK）情報の照会

各マテリアライズドビューには一つのジョブがあり、更新ごとに新しいタスクが作成されます。ジョブとタスクは 1:n の関係です。マテリアライズドビュー名でタスクの状態を確認するには、次を実行します。

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
    MvDatabaseName = 'mv_db_name' AND
    mvName = 'mv_name'
ORDER BY CreateTime DESC \G
```

戻り値の例:

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

**主なフィールドの説明**:

- **`NeedRefreshPartitions` / `CompletedPartitions`**: このタスクで更新が必要なパーティションと、更新済みのパーティション。
- **`Status`**: `FAILED` は実行の失敗を示します。`ErrorMsg` で原因を確認するか、`LastQueryId` を使って Doris のログを検索すると詳細を調べられます。現在、タスクが失敗すると既存のマテリアライズドビューは使用できなくなります。将来は、タスクが失敗しても既存のマテリアライズドビューを透過的な書き換えに引き続き使用できるよう変更される予定です。
- **`ErrorMsg`**: 失敗原因。
- **`RefreshMode`**:
    - `COMPLETE`: 全パーティションを更新しました。
    - `PARTIAL`: 一部のパーティションを更新しました。
    - `NOT_REFRESH`: 更新が必要なパーティションはありません。

:::info 注記
- 現在、保存および表示されるタスクのデフォルト件数は 100 です。`max_persistence_task_count` を `fe.conf` で変更できます。この件数を超えると古いタスクの記録は破棄されます。値が 1 未満の場合は永続化しません。設定は FE の再起動後に有効になります。
- マテリアライズドビューの作成時に `grace_period` プロパティを設定している場合、`SyncWithBaseTables` が `false` または `0` でも、透過的な書き換えに使用できる場合があります。
- `grace_period` の単位は秒で、マテリアライズドビューとベーステーブルのデータ間で許容する不一致の期間を示します。
    - `0` に設定: 透過的な書き換えを適用するには、マテリアライズドビューのデータがベーステーブルのデータと完全に一致している必要があります。
    - `10` に設定: 10 秒の遅延を許容します。10 秒以内なら、マテリアライズドビューを透過的な書き換えに使用できます。
:::

詳しくは、[TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)を参照してください。

### 3.8 マテリアライズドビューに対応する JOB の照会

```sql
SELECT *
FROM jobs("type"="mv")
WHERE Name = "inner_mtmv_75043";
```

詳しくは、[JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)を参照してください。

### 3.9 マテリアライズドビューのパーティション情報の照会

パーティション化されたマテリアライズドビューでは、`SHOW PARTITIONS` を使用して `SyncWithBaseTables` の状態を確認します。

```sql
SHOW PARTITIONS FROM mv_name;
```

戻り値の例:

```Plain
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```

主に確認するフィールドは `SyncWithBaseTables` です。`true` ならそのパーティションを透過的な書き換えに使用でき、`false` なら使用できません。

詳しくは、[SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS)を参照してください。

### 3.10 マテリアライズドビューのスキーマの表示

詳しくは、[DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE)を参照してください。

### 3.11 関連設定

<!-- Knowledge type: Reference documentation -->
<!-- Applicable scenarios: Tuning materialized view transparent rewrite behavior -->

#### 3.11.1 セッション変数のスイッチ

| スイッチ | 説明 |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| `SET enable_nereids_planner = true;`                                           | 非同期マテリアライズドビューは新しいオプティマイザでのみサポートされます。透過的な書き換えが機能しない場合は、このスイッチを有効にします。 |
| `SET enable_materialized_view_rewrite = true;`                                 | 透過的なクエリ書き換えを有効または無効にします。バージョン 2.1.5 以降、デフォルトで有効です。 |
| `SET materialized_view_rewrite_enable_contain_external_table = true;`          | 透過的な書き換えに参加するマテリアライズドビューに外部テーブルを含められるかどうかを設定します。デフォルトでは許可されません。定義 SQL に外部テーブルが含まれ、透過的な書き換えに参加させたい場合は、このスイッチを有効にします。 |
| `SET materialized_view_rewrite_success_candidate_num = 3;`                     | CBO の候補に参加できる書き換え成功結果の最大数です。デフォルトは 3 です。透過的な書き換えの処理が遅い場合は、この値を小さくします。 |
| `SET enable_materialized_view_union_rewrite = true;`                           | パーティション化されたマテリアライズドビューだけではクエリに必要な全データを提供できない場合、ベーステーブルとマテリアライズドビューを `UNION ALL` で結合してクエリに応答できるかどうかを設定します。デフォルトで許可されます。マテリアライズドビューを使用した際にデータの誤りが見られる場合は、このスイッチを無効にします。 |
| `SET enable_materialized_view_nest_rewrite = true;`                            | ネストされた書き換えを許可するかどうかを設定します。デフォルトでは許可されません。クエリ SQL が複雑で、ネストされたマテリアライズドビューを構築して使用する必要がある場合は、有効にします。 |
| `SET materialized_view_relation_mapping_max_count = 8;`                        | 透過的な書き換え中に許可される関係マッピングの最大数です。上限を超えるマッピングは切り捨てられます。関係マッピングは通常、自己 JOIN により生成され、その数は直積になります（たとえば、3 つのテーブルでは 8 通りの組み合わせが生じる場合があります）。デフォルトは 8 です。透過的な書き換えが遅い場合は、この値を小さくします。 |
| `SET enable_dml_materialized_view_rewrite = true;`                             | DML 実行中に、構造情報に基づくマテリアライズドビューの透過的な書き換えを有効にするかどうかを設定します。デフォルトで有効です。 |
| `SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true;` | リアルタイムでデータ変更を検出できない外部テーブルをマテリアライズドビューが含む場合、DML 実行中に構造情報に基づく透過的な書き換えを有効にするかどうかを設定します。デフォルトでは無効です。 |

#### 3.11.2 fe.conf の設定

| 設定項目 | 説明 |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| `job_mtmv_task_consumer_thread_num` | 同時実行できるマテリアライズドビューの更新タスク数を制御します。デフォルトは 10 です。これを超えるタスクは待機状態になります。この値を変更した場合、FE の再起動が必要です。 |
