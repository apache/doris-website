---
{
  "title": "非同期マテリアライズドビューの作成、クエリ、およびメンテナンス",
  "description": "この文書では、マテリアライズドビューの作成、マテリアライズドビューの直接クエリ、クエリリライト",
  "language": "ja"
}
---
この文書では、マテリアライズドビューの作成、マテリアライズドビューへの直接クエリ、クエリリライト、および一般的なメンテナンス操作について詳細な情報を提供します。

## マテリアライズドビューの作成

### 権限要件

- マテリアライズドビューの作成: マテリアライズドビューの作成権限（table作成権限と同じ）とマテリアライズドビュー作成文に対するクエリ権限（SELECT権限と同じ）の両方が必要です。

### 作成構文

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
### Refresh設定

#### build_mode Refreshタイミング
マテリアライズドビュー作成後に即座にリフレッシュするかどうかを決定します。
- IMMEDIATE: 即座にリフレッシュ（デフォルトモード）
- DEFERRED: 遅延リフレッシュ

#### refresh_method Refreshメソッド
- COMPLETE: すべてのパーティションをリフレッシュ
- AUTO: 増分リフレッシュを試行し、前回のマテリアライゼーション以降にデータ変更があったパーティションのみをリフレッシュします。データ変更を検出できない場合は、すべてのパーティションの完全リフレッシュにフォールバックします。

#### refresh_trigger トリガーメソッド
- **`ON MANUAL` 手動トリガー**

  ユーザーは以下の戦略でSQL文を使用してマテリアライズドビューのリフレッシュをトリガーできます：

  前回のリフレッシュ以降のベースTableパーティションデータの変更をチェックし、変更されたパーティションのみをリフレッシュします：

  ```sql
  REFRESH MATERIALIZED VIEW mvName AUTO;
  ```
:::tip
SQLのマテリアライズドビュー定義で使用されるベースTableがJDBCTableの場合、DorisはTableデータの変更を感知することができません。マテリアライズドビューを更新する際は、COMPLETEを指定する必要があります。AUTOを指定した場合、ベースTableにデータがあるにもかかわらず、更新後にマテリアライズドビューが空になる可能性があります。現在、マテリアライズドビューの更新時において、Dorisは内部TableとHiveデータソースTableのデータ変更のみを感知することができます。その他のデータソースのサポートは段階的に実装されています。
:::

ベースTableの変更をチェックせずに、すべてのマテリアライズドビューパーティションを更新：

  ```sql
  REFRESH MATERIALIZED VIEW mvName COMPLETE;
  ```
指定されたパーティションのみを更新する：

  ```sql
  REFRESH MATERIALIZED VIEW mvName partitions(partitionName1,partitionName2);
  ```
:::tip
   `partitionName` は `SHOW PARTITIONS FROM mvName` を使用して取得できます。
   バージョン2.1.3以降、Hiveは前回のリフレッシュ以降のベースTableパーティション変更の検出をサポートしています。他の外部Tableはまだこの機能をサポートしていません。内部Tableは常にこの機能をサポートしています。
   :::

- **`ON SCHEDULE` スケジュールトリガー**

  マテリアライズドビュー作成文でリフレッシュ間隔を指定します。refreshUnitを使用してマテリアライズドビュー作成文でデータリフレッシュ間隔を指定でき、リフレッシュ時間間隔の単位はminute、hour、day、weekなどを指定できます。

  10時間ごとに全リフレッシュ（`REFRESH COMPLETE`）を行い、全パーティションをリフレッシュする例：

  ```sql
  CREATE MATERIALIZED VIEW mv_6
  REFRESH COMPLETE ON SCHEDULE EVERY 10 hour
  AS
  SELECT FROM lineitem;
  ```
`REFRESH AUTO`による10時間ごとの増分リフレッシュの例。
変更されたパーティションのみをリフレッシュし、必要に応じて完全リフレッシュにフォールバックします
（自動Hiveパーティション計算はバージョン2.1.3からサポート）：

  ```sql
  CREATE MATERIALIZED VIEW mv_7
  REFRESH AUTO ON SCHEDULE EVERY 10 hour
  PARTITION by(l_shipdate)
  AS
  SELECT FROM lineitem;
  ```
- **`ON COMMIT` 自動トリガー**

  :::tip
  この機能はApache Dorisバージョン2.1.4以降で利用可能です。
  :::

  ベースTableのデータが変更された際にマテリアライズドビューの更新を自動的にトリガーし、更新パーティションの範囲は「スケジュールトリガー」と一致します。

  例：ベースTable`lineitem`でパーティション`t1`のデータが変更された場合、対応するマテリアライズドビューのパーティション更新が自動的にトリガーされます：

    ```sql
    CREATE MATERIALIZED VIEW mv_8
    REFRESH AUTO ON COMMIT
    PARTITION by(l_shipdate)
    AS
    SELECT FROM lineitem;
    ```
:::caution
頻繁に変更されるベースTableには推奨されません。頻繁なマテリアライズド更新タスクが作成され、過剰なリソースを消費するためです。
:::

詳細については、[REFRESH MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/REFRESH-MATERIALIZED-VIEW)を参照してください。

#### 例
Table作成文

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

CREATE TABLE IF NOT EXISTS orders  (
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
#### Refresh mechanism example 1

次の例では、リフレッシュタイミングが`BUILD IMMEDIATE`（作成後すぐにリフレッシュ）に設定され、リフレッシュ方法が`REFRESH AUTO`（増分リフレッシュを試行）に設定されており、最後のマテリアライゼーション以降に変更されたパーティションのみをリフレッシュします。増分リフレッシュが不可能な場合は、すべてのパーティションの完全リフレッシュを実行します。
トリガー方法は`ON MANUAL`に設定されています。パーティションが1つしかない非パーティション化完全マテリアライズドビューの場合、ベースTableのデータが変更されると、完全リフレッシュが必要になります。

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
FROM   
  orders   
  LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
#### リフレッシュメカニズムの例2
次の例では、リフレッシュのタイミングが遅延リフレッシュ（`BUILD DEFERRED`）に設定され、リフレッシュ方法が完全リフレッシュ（`REFRESH COMPLETE`）に設定され、トリガータイミングがスケジュールリフレッシュ（`ON SCHEDULE`）に設定されています。最初のリフレッシュ時刻は`2024-12-01 20:30:00`で、その後毎日リフレッシュされます。`BUILD DEFERRED`を`BUILD IMMEDIATE`として指定した場合、マテリアライズドビューは作成と同時に即座にリフレッシュされます。その後、`2024-12-01 20:30:00`から開始して毎日リフレッシュされます。

:::tip
STARTSで指定する時刻は現在時刻より後である必要があります。
:::

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD DEFERRED
REFRESH COMPLETE
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'  
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
#### Refresh mechanism example 3
この例では、リフレッシュタイミングは作成時の即座リフレッシュ（`BUILD IMMEDIATE`）に設定され、リフレッシュ方法は完全リフレッシュ（`REFRESH COMPLETE`）に設定され、トリガー方法はトリガーリフレッシュ（`ON COMMIT`）に設定されています。`orders`または`lineitem`Tableのデータが変更されると、マテリアライズドビューのリフレッシュが自動的にトリガーされます。

```sql
CREATE MATERIALIZED VIEW mv_1_1
BUILD IMMEDIATE
REFRESH COMPLETE
ON COMMIT
AS   
SELECT   
l_linestatus,   
to_date(o_orderdate) as date_alias,   
o_shippriority   
FROM   
orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
### パーティション 構成
以下の例では、パーティション化されたマテリアライズドビューを作成する際、`PARTITION BY`を指定する必要があります。パーティションフィールドを参照する式では、`date_trunc`関数と識別子のみが許可されています。以下のステートメントは要件を満たしています：パーティションフィールドは`date_trunc`関数のみを参照しています。パーティション化されたマテリアライズドビューのリフレッシュ方法は通常`AUTO`に設定され、これは増分リフレッシュを試行し、前回のマテリアライズドリフレッシュ以降に変更されたパーティションのみをリフレッシュします。増分リフレッシュが不可能な場合は、すべてのパーティションをリフレッシュします。

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
FROM   
  orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
以下のステートメントは、パーティションフィールド`order_date_month`が`date_add()`関数を使用しているため、パーティション化されたマテリアライズドビューの作成に失敗し、エラー`because column to check use invalid implicit expression, invalid expression is date_add(o_orderdate#4, 2)`が発生します。

```sql
CREATE MATERIALIZED VIEW mv_2_1 BUILD IMMEDIATE REFRESH AUTO ON MANUAL   
PARTITION BY (order_date_month)   
DISTRIBUTED BY RANDOM BUCKETS 2   
AS   
SELECT   
  l_linestatus,
  date_trunc(date_add(o_orderdate, INTERVAL 2 DAY), 'month') as order_date_month,   
  o_shippriority   
FROM   
  orders   
LEFT JOIN lineitem ON l_orderkey = o_orderkey;
```
#### 複数のパーティションカラムを持つベースTable

現在、複数のパーティションカラムをサポートしているのはHive外部Tableのみです。Hive外部Tableには、多くの場合、日付による第1レベルのパーティションと地域による第2レベルのパーティションなど、多くの多階層パーティションがあります。マテリアライズドビューは、Hiveのパーティションカラムの1つをマテリアライズドビューのパーティションカラムとして選択できます。

例えば、HiveTableの作成文は以下のとおりです：

```sql
CREATE TABLE hive1 (
`k1` int)
PARTITIONED BY (
`year` int,
`region` string)
STORED AS ORC;

alter table hive1 add if not exists
partition(year=2020,region="bj")
partition(year=2020,region="sh")
partition(year=2021,region="bj")
partition(year=2021,region="sh")
partition(year=2022,region="bj")
partition(year=2022,region="sh")
```
マテリアライズドビューの作成文が以下の場合、マテリアライズドビュー`mv_hive`は3つのパーティション`('2020')`、`('2021')`、`('2022')`を持ちます。

```sql
CREATE MATERIALIZED VIEW mv_hive
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (year)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```
マテリアライズドビューの作成文が以下の場合、マテリアライズドビュー `mv_hive2` は次の2つのパーティション `('bj')` と `('sh')` を持ちます：

```sql
CREATE MATERIALIZED VIEW mv_hive2
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (region)
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT k1, year, region FROM hive1;
```
#### ベースTableからの部分パーティションの使用

一部のベースTableには多くのパーティションがありますが、マテリアライズドビューは最近の期間の「ホット」なデータにのみ焦点を当てます。この機能はそれを可能にします。

ベースTableの作成文は以下の通りです：

```sql
CREATE TABLE t1 (
k1 INT,
k2 DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(k1)
COMMENT 'OLAP'
PARTITION BY range(k2)
(
PARTITION p26 VALUES [("2024-03-26"),("2024-03-27")),
PARTITION p27 VALUES [("2024-03-27"),("2024-03-28")),
PARTITION p28 VALUES [("2024-03-28"),("2024-03-29"))
)
DISTRIBUTED BY HASH(k1) BUCKETS 2;
```
マテリアライズドビューの作成文は以下の通りで、マテリアライズドビューが最新日のデータのみに焦点を当てていることを示しています。現在時刻が `2024-03-28 xx:xx:xx` の場合、マテリアライズドビューには `[("2024-03-28"),("2024-03-29")]` という1つのパーティションのみが存在します：

```sql
CREATE MATERIALIZED VIEW mv1
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (k2)
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES (
'partition_sync_limit'='1',
'partition_sync_time_unit'='DAY'
)
AS
SELECT FROM t1;
```
さらに時間が1日経過し、現在時刻が `2024-03-29 xx:xx:xx` の場合、`t1` は新しいパーティション `[("2024-03-29"),("2024-03-30")]` を追加します。この時点でマテリアライズドビューがリフレッシュされると、リフレッシュ完了後、マテリアライズドビューには1つのパーティション `[("2024-03-29"),("2024-03-30")]` のみが存在することになります。

さらに、パーティションフィールドがstring型の場合、マテリアライズドビューのプロパティ `partition_date_format` を設定できます。例：`%Y-%m-%d`。

#### パーティション Aggregation
:::tip
Range partitioning は Doris 2.1.5 からサポートされています
:::

ベースTable内のデータが集約される際、各パーティション内のデータ量が大幅に減少する可能性があります。この場合、パーティション集約戦略を採用して、マテリアライズドビューのパーティション数を削減できます。

ベースTableの作成文が以下の通りであると仮定します：

```sql
CREATE TABLE t1 (
k1 LARGEINT NOT NULL,
k2 DATE NOT NULL
) ENGINE=OLAP
DUPLICATE KEY(k1)
COMMENT 'OLAP'
PARTITION BY range(k2)
(
PARTITION p_20200101 VALUES [("2020-01-01"),("2020-01-02")),
PARTITION p_20200102 VALUES [("2020-01-02"),("2020-01-03")),
PARTITION p_20200201 VALUES [("2020-02-01"),("2020-02-02"))
)
DISTRIBUTED BY HASH(k1) BUCKETS 2;
```
マテリアライズドビューの作成文が以下の場合、マテリアライズドビューには2つのパーティション `[("2020-01-01","2020-02-01")]` と `[("2020-02-01","2020-03-01")]` が含まれます。

```sql
CREATE MATERIALIZED VIEW mv_3
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (date_trunc(k2,'month'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT FROM t1;
```
マテリアライズドビューの作成文が以下の場合、マテリアライズドビューには1つのパーティションのみが含まれます：`[("2020-01-01","2021-01-01")]`。

```sql
CREATE MATERIALIZED VIEW mv_4
BUILD DEFERRED
REFRESH AUTO
ON MANUAL
PARTITION BY (date_trunc(k2,'year'))
DISTRIBUTED BY RANDOM BUCKETS 2
AS
SELECT FROM t1;
```
さらに、パーティションフィールドがstring型の場合、マテリアライズドビューの`partition_date_format`プロパティを設定することで日付フォーマットを指定できます。例：`'%Y-%m-%d'`。

詳細については、[CREATE ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CREATE-ASYNC-MATERIALIZED-VIEW)を参照してください。

#### Multi-PCT Refresh
「Multi-PCT Refresh」により、非同期マテリアライズドビューは複数のパーティション変更追跡（PCT）Tableを持つことができます。つまり、複数のベースTableでデータ変更が発生した場合、フルリフレッシュではなく、パーティションレベルのリフレッシュのみが実行されます。

この機能の使用には以下の制限があります：
- INNER JOINまたはUNION（UNION ALLを含む）に基づいて構築されたマテリアライズドビューのみサポートされます。
- マテリアライズドビューがUNION操作を使用する場合、参加するすべてのunionコンポーネントがPartition Change Tracking（PCT）をサポートする必要があります。例えば、マテリアライズドビューのSQL定義がq1 UNION ALL q2の場合、q1とq2の両方が単独でマテリアライズドビューを作成する際にパーティションリフレッシュを個別にサポートし、派生するパーティションカラムの順序が一致している必要があります。
- 複数のPCTTable間でパーティション粒度が一致している必要があります：
    - **許可される例**：

      ベースTablet1のパーティション：[2020-01-01, 2020-01-02), [2020-01-02, 2020-01-03)

      ベースTablet2のパーティション：[2020-01-02, 2020-01-03), [2020-01-03, 2020-01-04)

      複数のベースTableのパーティションは完全に同一ではありませんが、重複していません。

    - **許可されない例**：

      ベースTablet1のパーティション：[2020-01-01, 2020-01-03), [2020-01-03, 2020-01-05)

      ベースTablet2のパーティション：[2020-01-01, 2020-01-02), [2020-01-03, 2020-01-05)

      パーティション[2020-01-01, 2020-01-03)と[2020-01-01, 2020-01-02)は重複していますが同一ではありません。

### SQL定義

非同期マテリアライズドビューは内部ビューに基づいて作成できますが、外部データソースからのビューに基づく構築はサポートされていません。

重要な点として、基盤となる内部ビューが変更または再構築された場合、非同期マテリアライズドビューとベースTable間でデータの不整合が生じる可能性があることに注意してください。このような場合、マテリアライズドビューのデータは依然として存在しますが、透過的なクエリリライトをサポートできません。

さらに、構造的な変更が非同期マテリアライズドビューが依存するパーティション追跡Tableやカラムに影響を与えるか、スキーマの変更を引き起こす場合、マテリアライズドビューのリフレッシュは失敗します。変更がこれらの要素に影響しない場合、マテリアライズドビューはリフレッシュ後に正常な動作を再開できます。

## マテリアライズドビューの直接クエリ

マテリアライズドビューはTableのように扱うことができ、フィルタ条件と集計を追加して直接クエリできます。

**マテリアライズドビューの定義：**

```sql
CREATE MATERIALIZED VIEW mv_5
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
o_custkey,
o_orderdate
FROM (SELECT FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey;
```
**Original Query:**
```sql
SELECT t1.l_linenumber,
o_custkey,
o_orderdate
FROM (SELECT FROM lineitem WHERE l_linenumber > 1) t1
LEFT OUTER JOIN orders
ON l_orderkey = o_orderkey
WHERE o_orderdate = '2023-10-18';
```
**Materialized View上の等価な直接クエリ:**
ユーザーは手動でクエリを修正する必要があります。

```sql
SELECT l_linenumber,
o_custkey,
o_orderdate
FROM mv_5
WHERE o_orderdate = '2023-10-18';

```
## Transparent Query Rewriting

透過的書き換えとは、クエリを処理する際に、ユーザーがクエリを手動で変更する必要がなく、システムが自動的にクエリを最適化して書き換えることを意味します。
DorisのAsynchronous Materialized ViewはSPJG（SELECT-PROJECT-JOIN-GROUP-BY）パターンに基づく透過的書き換えアルゴリズムを使用します。
このアルゴリズムはSQL構造情報を解析し、透過的書き換えに適したMaterialized Viewを自動的に見つけ、クエリSQLに応答する最適なMaterialized Viewを選択できます。
Dorisは豊富で包括的な透過的書き換え機能を提供します。例えば、以下のような機能があります：

### Condition Compensation

クエリとMaterialized Viewの条件は完全に同じである必要はありません。Materialized Viewに条件を補償してクエリを表現することで、Materialized Viewを最大限に再利用でき、Materialized Viewを繰り返し構築する必要を避けることができます。

Materialized ViewとクエリのwHERE条件がandで接続された式の場合：

1. **クエリの式がMaterialized Viewの式を含む場合：**

   条件補償を実行できます。

   例えば、クエリ条件がa > 5 and b > 10 and c = 7で、Materialized View条件がa > 5 and b > 10の場合、Materialized View条件はクエリ条件のサブセットであるため、c = 7条件のみを補償する必要があります。

2. **クエリの式がMaterialized Viewの式を完全に含まない場合：**

   クエリ条件がMaterialized View条件から導出できる場合（>、<、=、inなどの比較および範囲式でよくある）、条件補償も実行できます。補償結果はクエリ条件そのものです。

   例えば、クエリ条件がa > 5 and b = 10で、Materialized View条件がa > 1 and b > 8の場合、Materialized View条件がクエリ条件を含み、クエリ条件がMaterialized View条件から導出できることがわかるため、補償を実行でき、補償結果はa > 5 and b = 10となります。

   条件補償使用制限：

1. orで接続された式の場合、条件補償は実行できません。書き換えを成功させるには完全に同じである必要があります。

2. likeなどの比較および範囲以外の式の場合、条件補償は実行できません。書き換えを成功させるには完全に同じである必要があります。

例：

**Materialized View定義：**

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
以下のクエリはすべてmaterialized viewにヒットします。複数のクエリは透過的な書き換えによって1つのmaterialized viewを再利用でき、クエリ書き換え時間を短縮し、materialized view構築コストを節約できます。

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
 WHERE l_linenumber > 2 and o_orderdate = '2023-10-19';
 
 ```
### JOIN書き換え

JOIN書き換えとは、クエリとマテリアライズドビューが同じTableを使用し、条件がマテリアライズドビュー、JOIN入力、またはJOIN外部で記述できる場合を指します。オプティマイザーは、このパターンのクエリに対して透過的な書き換えを試行します。

複数TableのJOINがサポートされており、以下のJOINタイプがサポートされています：

- INNER JOIN
- LEFT OUTER JOIN
- RIGHT OUTER JOIN
- FULL OUTER JOIN
- LEFT SEMI JOIN
- RIGHT SEMI JOIN
- LEFT ANTI JOIN
- RIGHT ANTI JOIN

例：

**マテリアライズドビュー定義：**

```sql
CREATE MATERIALIZED VIEW mv2
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
SELECT t1.l_linenumber,
       o_custkey,
       o_orderkey,
       o_orderstatus,
       l_partkey,
       l_suppkey,
       l_orderkey
FROM (SELECT * FROM lineitem WHERE l_linenumber > 1) t1
INNER JOIN orders ON t1.l_orderkey = orders.o_orderkey;
```
以下のクエリは透過的に書き換えることができます。条件`l_linenumber > 1`を引き上げることで、透過的な書き換えが可能になり、マテリアライズドビューの事前計算された結果を使用してクエリを表現できます。
マテリアライズドビューにヒットした後、JOINの計算を省略できます。

**Query Statement:**

```sql
SELECT l_linenumber,
       o_custkey
FROM lineitem
INNER JOIN orders ON l_orderkey = o_orderkey
WHERE l_linenumber > 1 and o_orderdate = '2023-10-18';
```
### JOIN導出

クエリとマテリアライズドビューのJOINタイプが一致しない場合でも、マテリアライズドビューがクエリに必要なすべてのデータを提供できるなら、JOINの外側で補償述語を適用することで透過的な書き換えを実行できます。

例：

**マテリアライズドビューの定義:**

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
**クエリ文:**

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
### Aggregate Rewriting

クエリとマテリアライズドビュー定義のgroup dimensionsが一致している場合、マテリアライズドビューがクエリと同じgroup by dimensionsを使用し、クエリで使用される集約関数がマテリアライズドビューの集約関数を使って表現できる場合、透過的な書き換えを実行できます。

例：

**Materialized View Definition:**

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
次のクエリはマテリアライズドビューと同じ集約次元を使用するため、マテリアライズドビューにヒットできます。クエリはマテリアライズドビューの`o_shippriority`フィールドを使用して結果をフィルタリングできます。クエリのgroup by次元と集約関数は、マテリアライズドビューのgroup by次元と集約関数を使用して書き換えることができます。
集約マテリアライズドビューにヒットした後、集約計算を削減できます。

**Query Statement:**

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
WHERE o_shippriority in (1, 2)
GROUP BY
o_shippriority,
o_comment;
```
### Aggregate Rewriting (Roll-up)

クエリとマテリアライズドビューの定義における集約次元が一致しない場合でも、リライトを実行することができます。マテリアライズドビューの`group by`次元は、クエリの`group by`次元を含む必要があり、クエリには`group by`がない場合もあります。さらに、クエリで使用される集約関数は、マテリアライズドビューの集約関数を使用して表現可能でなければなりません。

例：

**Materialized View Definition:**

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
以下のクエリは透過的に書き換えることができます。クエリとマテリアライズドビューは異なる集約ディメンションを使用していますが、マテリアライズドビューのディメンションにはクエリのディメンションが含まれています。クエリはディメンションのフィールドを使用して結果をフィルタリングできます。クエリは、マテリアライズドビューの`SELECT`の後の関数を使用してロールアップを試行します。
例えば、マテリアライズドビューの`bitmap_union`は最終的に`bitmap_union_count`にロールアップされ、これはクエリの`count(distinct)`と同じセマンティクスを維持します。

集約ロールアップにより、同一のマテリアライズドビューを複数のクエリで再利用でき、マテリアライズドビューの構築コストを節約できます。

**Query Statement:**

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
現在サポートされている集約ロールアップ関数は以下のとおりです:

| Query ファンクション | Materialized View ファンクション | ファンクション After Roll-up |
|----------------|---------------------------|----------------------|
| max | max | max |
| min | min | min |
| sum | sum | sum |
| count | count | sum |
| count(distinct) | bitmap_union | bitmap_union_count |
| bitmap_union | bitmap_union | bitmap_union |
| bitmap_union_count | bitmap_union | bitmap_union_count |
| hll_union_agg, approx_count_distinct, hll_cardinality | hll_union or hll_raw_agg | hll_union_agg |
| any_value | any_value or column used after any_value in select | any_value |

### 多次元集約リライト

多次元集約の透過的リライトがサポートされています。これは、マテリアライズドビューが `GROUPING SETS`、`CUBE`、または `ROLLUP` を使用していなくても、クエリに多次元集約があり、マテリアライズドビューの `group by` フィールドがクエリの多次元集約のすべてのフィールドを含んでいる場合、透過的リライトを実行できることを意味します。

例:

**マテリアライズドビューの定義:**

```sql
CREATE MATERIALIZED VIEW mv5_1
BUILD IMMEDIATE REFRESH AUTO ON SCHEDULE EVERY 1 hour
DISTRIBUTED BY RANDOM BUCKETS 3
AS
select o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice) as sum_total,
       max(o_totalprice) as max_total,
       min(o_totalprice) as min_total,
       count(*) as count_all
from orders
group by
o_orderstatus, o_orderdate, o_orderpriority;
```
次のクエリは、マテリアライズドビューにヒットし、マテリアライズドビューの集約結果を再利用して計算を節約できます：

**Query Statement:**

```sql
select o_orderstatus, o_orderdate, o_orderpriority,
       sum(o_totalprice),
       max(o_totalprice),
       min(o_totalprice),
       count(*)
from orders
group by
GROUPING SETS ((o_orderstatus, o_orderdate), (o_orderpriority), (o_orderstatus), ());
```
### パーティション Compensation Rewriting

パーティション化されたマテリアライズドビューがクエリに必要なすべてのデータを提供できない場合、`union all`アプローチを使用して、元のTableとマテリアライズドビューからのデータを組み合わせて最終結果とすることができます。

例：

**Materialized View Definition:**

```sql
CREATE MATERIALIZED VIEW mv7
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
partition by(l_shipdate)
DISTRIBUTED BY RANDOM BUCKETS 2
as
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```
ベースTableがパーティション`2023-10-21`を追加し、マテリアライズドビューがまだリフレッシュされていない場合、マテリアライズドビューと元のTableの間で`union all`を使用することで結果を返すことができます。

```sql
insert into lineitem values
(1, 2, 3, 4, 5.5, 6.5, 7.5, 8.5, 'o', 'k', '2023-10-21', '2023-10-21', '2023-10-21', 'a', 'b', 'yyyyyyyyy');
```
**Query Statement:**

```sql
select l_shipdate, o_orderdate, l_partkey, l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```
クエリはマテリアライズドビューの事前計算された結果を部分的に使用でき、この部分の計算を節約します。

**Rewrite Result Illustration:**

```sql
SELECT *
FROM mv7
union all
select t1.l_shipdate, o_orderdate, t1.l_partkey, t1.l_suppkey, sum(o_totalprice) as sum_total
from (select * from lineitem where l_shipdate = '2023-10-21') t1
left join orders on t1.l_orderkey = orders.o_orderkey and t1.l_shipdate = o_orderdate
group by
    t1.l_shipdate,
    o_orderdate,
    t1.l_partkey,
    t1.l_suppkey;

```
### ネストされたマテリアライズドビューの書き換え

マテリアライズドビューのSQL定義では別のマテリアライズドビューを使用できます。これはネストされたマテリアライズドビューと呼ばれます。
理論的にはネストの深度に制限はなく、このマテリアライズドビューは直接クエリすることも透過的に書き換えることも可能です。ネストされたマテリアライズドビューは透過的な書き換えにも参加できます。

例：

**内部マテリアライズドビュー `mv8_0_inner_mv` を作成：**

```sql
CREATE MATERIALIZED VIEW mv8_0_inner_mv
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
select
l_linenumber,
o_custkey,
o_orderkey,
o_orderstatus,
l_partkey,
l_suppkey,
l_orderkey
from lineitem
inner join orders on lineitem.l_orderkey = orders.o_orderkey;
```
**外部マテリアライズドビュー`mv8_0`を作成:**

```sql
CREATE MATERIALIZED VIEW mv8_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
AS
select
l_linenumber,
o_custkey,
o_orderkey,
o_orderstatus,
l_partkey,
l_suppkey,
l_orderkey,
ps_availqty
from mv8_0_inner_mv
inner join partsupp on l_partkey = ps_partkey AND l_suppkey = ps_suppkey;
```
以下のクエリでは、`mv8_0_inner_mv`と`mv8_0`の両方が正常に書き換えられ、コストモデルが最終的に`mv8_0`を選択します。

ネストしたマテリアライズドビューは、データモデリングや特に複雑なクエリで一般的に使用されます。単一のマテリアライズドビューで透過的な書き換えができない場合は、複雑なクエリを分割してネストしたマテリアライズドビューを構築できます。
透過的な書き換えプロセスは、書き換えにネストしたマテリアライズドビューを使用することを試みます。書き換えが成功すると、計算を節約し、クエリパフォーマンスを向上させます。

```sql
select lineitem.l_linenumber
from lineitem
inner join orders on l_orderkey = o_orderkey
inner join partsupp on  l_partkey = ps_partkey AND l_suppkey = ps_suppkey
where o_orderstatus = 'o'
```
注意:

1. ネストしたマテリアライズドビューの階層が多いほど、透明な書き換えに時間がかかります。ネストしたマテリアライズドビューは3階層を超えないことを推奨します。

2. ネストしたマテリアライズドビューの透明な書き換えは、デフォルトでは無効になっています。有効にする方法については、以下の関連設定を参照してください。


### 非集約マテリアライズドビューを使用した集約クエリの書き換え
クエリが集約クエリで、マテリアライズドビューに集約が含まれていないが、マテリアライズドビューがクエリで使用されるすべての列を提供できる場合、書き換えることも可能です。
例えば、クエリが最初にjoinを実行してから group by 集約を行う場合、joinを含むマテリアライズドビューにヒットすることでも効果が得られます。

```sql
CREATE MATERIALIZED VIEW mv10_0
BUILD IMMEDIATE REFRESH AUTO ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
as
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, o_totalprice
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate;
```
次のクエリはmv10_0マテリアライズドビューにヒットし、lineitem join orders joinの計算を節約できます：

```sql
select l_shipdate, o_orderdate, l_partkey,
       l_suppkey, sum(o_totalprice) as sum_total
from lineitem
left join orders on lineitem.l_orderkey = orders.o_orderkey and l_shipdate = o_orderdate
group by
    l_shipdate,
    o_orderdate,
    l_partkey,
    l_suppkey;
```
### Explain Query Transparent Rewriting Status

透明リライトのヒット状況を確認するために使用され、表示とデバッグに利用されます。

1. **マテリアライズドビューの透明リライトヒット状況を表示するには、このステートメントでクエリ透明リライトに関する簡潔なプロセス情報が表示されます。**

    ```sql
    explain <query_sql> 
    ```
返される情報は以下の通りで、ここではマテリアライズドビュー関連の情報を抜粋しています：

    ```sql
    | MaterializedView                                                                                                                                                                                                                                      |
    | MaterializedViewRewriteSuccessAndChose:                                                                                                                                                                                                               |
    |   Names: mv5                                                                                                                                                                                                                                          |
    | MaterializedViewRewriteSuccessButNotChose:                                                                                                                                                                                                            |
    |                                                                                                                                                                                                                                                       |
    | MaterializedViewRewriteFail:                                                                                                                                                                                                                          |
    |   Name: mv4                                                                                                                                                                                                                                           |
    |   FailSummary: Match mode is invalid, View struct info is invalid                                                                                                                                                                                     |
    |   Name: mv3                                                                                                                                                                                                                                           |
    |   FailSummary: Match mode is invalid, Rewrite compensate predicate by view fail, View struct info is invalid                                                                                                                                          |
    |   Name: mv1                                                                                                                                                                                                                                           |
    |   FailSummary: The columns used by query are not in view, View struct info is invalid                                                                                                                                                                 |
    |   Name: mv2                                                                                                                                                                                                                                           |
    |   FailSummary: The columns used by query are not in view, View struct info is invalid
    ```
- MaterializedViewRewriteSuccessAndChose: CBO（Cost-Based Optimizer）によって透過的に書き換えが成功し、選択されたマテリアライズドビュー名のリストを示します。
- MaterializedViewRewriteSuccessButNotChose: 透過的に書き換えが成功したものの、最終的にCBOによって選択されなかったマテリアライズドビュー名のリストを示します。
- MaterializedViewRewriteFail: 失敗したケースと概要理由をリストします。

2. **マテリアライズドビューの候補、書き換え、および最終選択に関する詳細なプロセス情報を理解するには、次のステートメントを実行してください:**

    ```sql
    explain memo plan <query_sql>
    ```
## Materialized Viewの維持

### 権限要件

- Materialized Viewの削除: Materialized View削除権限が必要（Table削除権限と同じ）
- Materialized Viewの変更: Materialized View変更権限が必要（Table変更権限と同じ）
- Materialized Viewの一時停止/再開/キャンセル/更新: Materialized View作成権限が必要

### Materialized Viewの変更

#### Materialized Viewプロパティの変更

```sql
ALTER MATERIALIZED VIEW mv_1
SET(
  "grace_period" = "10"
);
```
詳細については、[ALTER ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/ALTER-ASYNC-MATERIALIZED-VIEW)を参照してください。

#### Materialized Viewの名前変更、すなわちMaterialized Viewのアトミック置換

```sql
CREATE MATERIALIZED VIEW mv9_0
BUILD IMMEDIATE REFRESH COMPLETE ON MANUAL
DISTRIBUTED BY RANDOM BUCKETS 2
PROPERTIES ('replication_num' = '1') 
AS
select
  l_linenumber,
  o_custkey,
  o_orderkey,
  o_orderstatus,
  l_partkey,
  l_suppkey,
  l_orderkey
from lineitem
inner join orders on lineitem.l_orderkey = orders.o_orderkey;
```
マテリアライズドビューmv7をmv9_0に置き換えて、mv7を削除します：

```sql
ALTER MATERIALIZED VIEW mv7
REPLACE WITH MATERIALIZED VIEW mv9_0
PROPERTIES('swap' = 'false');
```
### マテリアライズドビューの削除

```sql
DROP MATERIALIZED VIEW mv_1;
```
詳細については、[DROP ASYNC MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/DROP-ASYNC-MATERIALIZED-VIEW)を参照してください。

### Materialized Viewの作成文の表示

```sql
SHOW CREATE MATERIALIZED VIEW mv_1;
```
詳細については、[SHOW CREATE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/sync-materialized-view/SHOW-CREATE-MATERIALIZED-VIEW)を参照してください。

### Materialized Viewの一時停止

詳細については、[PAUSE MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/PAUSE-MATERIALIZED-VIEW-JOB)を参照してください。

### Materialized Viewの再開

詳細については、[RESUME MATERIALIZED VIEW](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/RESUME-MATERIALIZED-VIEW-JOB)を参照してください。

### Materialized Viewのリフレッシュタスクのキャンセル

詳細については、[CANCEL MATERIALIZED VIEW TASK](../../../sql-manual/sql-statements/table-and-view/async-materialized-view/CANCEL-MATERIALIZED-VIEW-TASK)を参照してください。


### Materialized View情報の照会

```sql
SELECT * 
FROM mv_infos('database'='db_name')
WHERE Name = 'mv_name' \G 
```
Example output:
```sql
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
- **SyncWithBaseTables:** マテリアライズドビューがベースTableと同期されているかどうかを示します。
    - 完全にビルドされたマテリアライズドビューの場合、値が1の場合、ビューは透過的な書き換えに利用できることを示します。
    - 増分パーティション化されたマテリアライズドビューの場合、利用可能性はパーティションレベルで決定されます。一部のパーティションが利用できない場合でも、クエリされるパーティションが有効であれば、ビューは透過的な書き換えに使用できます。透過的な書き換えを使用する能力は、クエリされるパーティションの`SyncWithBaseTables`値に依存します - 1は利用可能、0は利用不可を意味します。

- **JobName:** マテリアライズドビューのビルドジョブの名前。各マテリアライズドビューには1つのJobがあり、各リフレッシュは新しいTaskを作成し、JobとTaskの間には1:nの関係があります。

- **State:** SCHEMA_CHANGEに変更された場合、ベースTableのスキーマが変更されたことを示します。マテリアライズドビューは透過的な書き換えに使用できません（ただし、直接クエリすることは可能です）。次回の成功したリフレッシュタスク後にNORMALに戻ります。

- **SchemaChangeDetail:** SCHEMA_CHANGEの理由を説明します。

- **RefreshState:** 最後のリフレッシュタスクのステータス。FAILの場合、実行が失敗したことを示します - `tasks()`コマンドを使用して原因を特定してください。[マテリアライズドビュータスクステータスの表示](### Querying Refresh Task Information)セクションを参照してください。

- **SyncWithBaseTables:** ベースTableと同期されているかどうか。1は同期済み、0は未同期を意味します。同期されていない場合、`show partitions`を使用してどのパーティションが同期外れかを確認してください。パーティション化されたマテリアライズドビューのSyncWithBaseTablesステータスの確認については、以下のセクションを参照してください。

透過的な書き換えにおいて、マテリアライズドビューは通常2つの状態を持ちます：

- **Normal:** マテリアライズドビューは透過的な書き換えに利用できます。
- **Unavailable/Abnormal:** マテリアライズドビューは透過的な書き換えに使用できません。ただし、直接クエリすることは可能です。

詳細については、[MV_INFOS](../../../sql-manual/sql-functions/table-valued-functions/mv-infos)を参照してください。

### リフレッシュタスク情報のクエリ

各マテリアライズドビューには1つのJobがあり、各リフレッシュは新しいTaskを作成し、JobとTaskの間には1:nの関係があります。
マテリアライズドビューのTask状態を名前で表示するには、以下のクエリを実行してリフレッシュタスクのステータスと進行状況を確認します：

```sql
SELECT *
FROM tasks("type"="mv")
WHERE
  MvDatabaseName = 'mv_db_name' and
  mvName = 'mv_name'
ORDER BY  CreateTime DESC \G
```
サンプル出力:

```sql
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
- NeedRefreshPartitionsとCompletedPartitionsは、このTaskで更新されたパーティションを記録します。

- Status: FAILEDの場合、実行が失敗したことを示します。失敗理由についてはErrorMsgを確認するか、LastQueryIdを使用してDorisログで詳細なエラー情報を検索してください。現在、タスクの失敗により既存のマテリアライズドビューが使用不可になります。これは変更される予定で、タスクが失敗しても既存のマテリアライズドビューは透過的なリライティングで使用可能なままになります。

- ErrorMsg: 失敗理由。

- RefreshMode: COMPLETEはすべてのパーティションが更新されたことを意味し、PARTIALは一部のパーティションが更新されたことを意味し、NOT_REFRESHは更新が必要なパーティションがなかったことを意味します。

:::info Note

- 現在、タスクのデフォルトの保存・表示数は100です。これはfe.confファイルでmax_persistence_task_countを設定することで変更できます。この制限を超えると、古いタスクレコードは破棄されます。値が1未満に設定された場合、タスクの永続化は無効になります。設定変更後、変更を有効にするにはFEサービスの再起動が必要です。

- マテリアライズドビューを作成する際に`grace_period`プロパティが設定されていた場合、`SyncWithBaseTables`がfalseまたは0であっても、一部のケースでは透過的なリライティングで使用可能な場合があります。

- `grace_period`は秒単位で測定され、マテリアライズドビューとベースTable間のデータ不整合に許可される時間を指定します。

- 0に設定すると、透過的なリライティングにはマテリアライズドビューとベースTableのデータ間で正確な整合性が必要です。

- 10に設定すると、マテリアライズドビューとベースTableのデータ間で最大10秒の遅延が許可されます。この10秒の時間枠内では、マテリアライズドビューは透過的なリライティングに使用できます。
  :::

詳細については、[TASKS](../../../sql-manual/sql-functions/table-valued-functions/tasks)を参照してください。

### マテリアライズドビュージョブのクエリ

```sql
SELECT * 
FROM jobs("type"="mv") 
WHERE Name="inner_mtmv_75043";
```
詳細については、[JOBS](../../../sql-manual/sql-functions/table-valued-functions/jobs)を参照してください。

### Materialized Viewパーティション情報のクエリ

パーティション化されたMaterialized ViewのSyncWithBaseTablesステータスの確認

`show partitions from mv_name`を実行して、クエリ対象のパーティションが有効かどうかを確認します。出力例：

```Plain
show partitions from mv11;
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| PartitionId | PartitionName       | VisibleVersion | VisibleVersionTime  | State  | PartitionKey | Range                                                                          | DistributionKey | Buckets | ReplicationNum | StorageMedium | CooldownTime        | RemoteStoragePolicy | LastConsistencyCheckTime | DataSize  | IsInMemory | ReplicaAllocation       | IsMutable | SyncWithBaseTables | UnsyncTables |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
| 140189      | p_20231016_20231017 | 1              | 2024-06-21 10:31:45 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-16]; ..types: [DATEV2]; keys: [2023-10-17]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 0.000     | false      | tag.location.default: 1 | true      | true               | []           |
| 139995      | p_20231018_20231019 | 2              | 2024-06-21 10:31:44 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-18]; ..types: [DATEV2]; keys: [2023-10-19]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 880.000 B | false      | tag.location.default: 1 | true      | true               | []           |
| 139898      | p_20231019_20231020 | 2              | 2024-06-21 10:31:43 | NORMAL | l_shipdate   | [types: [DATEV2]; keys: [2023-10-19]; ..types: [DATEV2]; keys: [2023-10-20]; ) | l_orderkey      | 10      | 1              | HDD           | 9999-12-31 23:59:59 |                     | NULL                     | 878.000 B | false      | tag.location.default: 1 | true      | true               | []           |
+-------------+---------------------+----------------+---------------------+--------+--------------+--------------------------------------------------------------------------------+-----------------+---------+----------------+---------------+---------------------+---------------------+--------------------------+-----------+------------+-------------------------+-----------+--------------------+--------------+
```
`SyncWithBaseTables` フィールドを確認してください - false はパーティションが透明な書き換えに利用できないことを示します。

詳細については、[SHOW PARTITIONS](../../../sql-manual/sql-statements/table-and-view/table/SHOW-PARTITIONS) を参照してください。

### マテリアライズドビューTable構造の表示

詳細については、[DESCRIBE](../../../sql-manual/sql-statements/table-and-view/table/DESC-TABLE) を参照してください。

### 関連設定
#### セッション変数

| 変数 | 説明 |
|----------|-------------|
| SET enable_nereids_planner = true; | 非同期マテリアライズドビューは新しいオプティマイザーでのみ動作します。マテリアライズドビューの透明な書き換えが動作しない場合は、これを有効にしてください |
| SET enable_materialized_view_rewrite = true; | クエリの透明な書き換えを有効/無効にします（バージョン 2.1.5 からデフォルトで有効） |
| SET materialized_view_rewrite_enable_contain_external_table = true; | 外部Tableを含むマテリアライズドビューが透明な書き換えに参加することを許可します（デフォルトで無効） |
| SET materialized_view_rewrite_success_candidate_num = 3; | CBO 候補で許可される成功した書き換え結果の最大数（デフォルト 3）。透明な書き換えが遅い場合は減らしてください |
| SET enable_materialized_view_union_rewrite = true; | パーティション化されたビューが必要なデータをすべて提供しない場合に、ベースTableとマテリアライズドビュー間での UNION ALL を許可します（デフォルトで有効） |
| SET enable_materialized_view_nest_rewrite = true; | ネストした書き換えを許可します（デフォルトで無効）。複雑なクエリでネストしたマテリアライズドビューが必要な場合は有効にしてください |
| SET materialized_view_relation_mapping_max_count = 8; | 透明な書き換え中に許可されるリレーションマッピングの最大数（デフォルト 8）。書き換えが遅い場合は減らしてください |
| SET enable_dml_materialized_view_rewrite = true; | DML 中の構造ベースのマテリアライズドビュー透明書き換えを有効にします（デフォルトで有効） |
| SET enable_dml_materialized_view_rewrite_when_base_table_unawareness = true; | ビューがリアルタイムで追跡できない外部Tableを含む場合の DML 中の構造ベースのマテリアライズドビュー透明書き換えを有効にします（デフォルトで無効） |

#### fe.conf 設定
- **job_mtmv_task_consumer_thread_num:** 同時実行されるマテリアライズドビューリフレッシュタスクの数を制御します（デフォルト 10）。この制限を超えるタスクは保留状態になります。有効にするには FE の再起動が必要です。
