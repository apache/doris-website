---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "非同期マテリアライズドビューを作成するステートメントです。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。"
}
---

## 説明

非同期マテリアライズドビューを作成するステートメントです。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。列名はカスタマイズできますが、列の型は定義できません。

## 構文


```sql
CREATE MATERIALIZED VIEW 
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ] 
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [<refresh_trigger>]]
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

各構成要素は次のとおりです。


```sql
columns_definition
  : -- Column definition
    <col_name> 
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
```

## 必須パラメータ

**1. `<materialized_view_name>`**

> マテリアライズドビューの識別子（名前）を指定します。テーブルを作成するデータベース内で一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名のサポートが有効な場合は、任意の言語の文字で始められます）。識別子全体をバッククォートで囲まない限り、空白や特殊文字は使用できません（例: `My Object`）。
>
> 識別子に予約語は使用できません。
>
> 詳細については、識別子と予約語の要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの作成時に必須のパラメータです。データを格納するための SELECT ステートメントを指定します。

## オプションパラメータ

**1. `<key_cols>`**

> テーブルのキー列です。Doris では、キー列はテーブルの先頭から K 列である必要があります。キーの制約とキー列の選び方については、「データモデル」の章の該当するセクションを参照してください。

**2. `<build_mode>`**

> 更新のタイミング、つまりマテリアライズドビューの作成直後に更新するかどうかを指定します。
>
> IMMEDIATE: 直ちに更新します。デフォルトは IMMEDIATE です。
>
> DEFERRED: 更新を遅延させます。

**3. `<refresh_method>`**

> 更新方法を指定します。
>
> COMPLETE: すべてのパーティションを更新します。
>
> AUTO: 増分更新を試み、前回のマテリアライズドビューの更新以降に変更されたパーティションのみを更新します。増分更新ができない場合は、すべてのパーティションを更新します。

:::caution 注意
パーティション分割されたマテリアライズドビューで COMPLETE 更新モードを使用すると、すべてのパーティションデータが全面的に更新され、実質的にパーティション分割されていないマテリアライズドビューと同じになります。
:::

**4. `<refresh_trigger>`**

> 更新のトリガーを指定します。
>
> MANUAL: 手動で更新します。
>
> ON SCHEDULE: スケジュールに従って更新します。
>
> ON COMMIT: ベーステーブルのデータ変更を契機として、マテリアライズドビューを更新します。

**5. `<refresh_unit>`**

> 定期更新の時間単位です。現在サポートされている単位は MINUTE、HOUR、DAY、WEEK です。

**6. `<partition_col>`**

> PARTITION BY を指定しない場合、デフォルトではパーティションは 1 つだけです。
>
> パーティションフィールドを指定すると、そのフィールドがどのベーステーブルに由来するかが自動的に推定され、ベーステーブルのパーティションと同期されます（現在は内部テーブルと Hive テーブルをサポート）。内部テーブルでは、指定できるパーティションフィールドは 1 つだけです。
>
> マテリアライズドビューでは、パーティションのロールアップによってパーティション数を減らすこともできます。現在、パーティションのロールアップでは `date_trunc` をサポートしています。

**7. `<partition_unit>`**

> パーティションのロールアップに使用する集約粒度です。現在サポートされている単位は HOUR、DAY、WEEK、QUARTER、MONTH、YEAR です。

**8. `<start_time>`**

> スケジュールの開始時刻は現在時刻より後に設定する必要があります。

**9. `<table_property>`**

内部テーブルで使用するプロパティの大部分はマテリアライズドビューでも使用できます。マテリアライズドビュー固有のプロパティも含め、以下に示します。

| プロパティ名                     | 説明                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | クエリ書き換え時に許容される、マテリアライズドビューのデータの最大遅延時間（秒）です。マテリアライズドビューのパーティション A とベーステーブルのデータが一致せず、パーティション A の最終更新時刻が 10:15:00、現在のシステム時刻が 10:15:08 の場合、このパーティションは透過的なクエリ書き換えに使用されません。ただし、`grace_period` を 10 に設定すると、透過的な書き換えに使用されます。 |
| excluded_trigger_tables          | データ更新時に無視するテーブル名をカンマで区切って指定します。例: `table1,table2`。 |
| refresh_partition_num            | 1 つの INSERT ステートメントで更新するパーティション数です。デフォルトは 1 です。マテリアライズドビューの更新時には、最初に更新対象のパーティション一覧を計算し、それを複数の INSERT ステートメントに分割して順次実行します。INSERT ステートメントが失敗すると、タスク全体が停止します。マテリアライズドビューは個々の INSERT ステートメントの原子性を保証します。失敗した INSERT は、それまでに正常に更新されたパーティションには影響しません。 |
| workload_group                   | マテリアライズドビューが更新タスクを実行する際に使用する `workload_group` の名前です。データ更新時に使用するリソースを制限し、ほかの業務処理への影響を避けるために使用します。`workload_group` の作成方法と使用方法については、[WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group) のドキュメントを参照してください。 |
| partition_sync_limit             | ベーステーブルのパーティションフィールドが時間型の場合、`partition_sync_time_unit` と併用して、ベーステーブルと同期するパーティションの範囲を設定できます。例えば、これを 2、`partition_sync_time_unit` を `MONTH` に設定すると、ベーステーブルの直近 2 か月分のパーティションとデータのみを同期します。最小値は `1` です。時間の経過に伴い、マテリアライズドビューは更新のたびにパーティションを自動的に追加・削除します。例えば、現在 2 月と 3 月のデータを保持している場合、翌月には 2 月のデータを自動的に削除し、4 月のデータを追加します。 |
| partition_sync_time_unit         | パーティション更新の時間単位です。DAY/MONTH/YEAR をサポートし、デフォルトは DAY です。 |
| partition_date_format            | ベーステーブルのパーティションフィールドが文字列型で、`partition_sync_limit` の機能を使用する場合、`partition_date_format` を設定してパーティションの時刻を解析するための日付形式を指定できます。 |
| enable_nondeterministic_function | マテリアライズドビュー定義の SQL に current_date()、now()、random() などの非決定的関数を含めることを許可するかどうかを指定します。true の場合は許可し、それ以外の場合は許可しません。デフォルトでは許可されません。 |
| use_for_rewrite                  | このマテリアライズドビューを透過的なクエリ書き換えに使用するかどうかを指定します。false の場合は使用しません。デフォルトは true です。データモデリングでマテリアライズドビューを直接クエリする場合にのみ使用するなら、このプロパティを設定して透過的なクエリ書き換えから除外することで、クエリの応答速度を向上できます。 |

:::caution 注意
Apache Doris 2.1.10 より前では、DISTRIBUTED BY 句は必須であり、省略するとエラーになります。
Apache Doris 2.1.10 以降では、省略した場合のデフォルトの分散方式は RANDOM です。
:::

:::caution 注意
Apache Doris 2.1.10/3.0.6 より前では、excluded_trigger_tables プロパティにはベーステーブル名しか指定できませんでした。
これらのバージョン以降では、Catalog と Database を含む完全修飾テーブル名（例: internal.db1.table1）も指定できます。
:::

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限        | オブジェクト | 備考                                                         |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | データベース |                                                              |
| SELECT_PRIV | テーブル、ビュー | `<query>` で参照するテーブルまたはビューに対する SELECT_PRIV 権限が必要です。 |

## 注意事項

- マテリアライズドビューの DML と DDL の制限:

  マテリアライズドビューの列は定義 SQL から導出されるため、列の型の変更や列の追加・削除など、スキーマ変更の操作はサポートされません。

  マテリアライズドビューへの手動 INSERT や INSERT OVERWRITE はサポートされません。

- パーティション分割されたマテリアライズドビューを作成する条件:

  > パーティション単位の増分更新を行うには、マテリアライズドビューの定義 SQL とパーティションフィールドが以下の条件を満たす必要があります。
  >
  > 1. マテリアライズドビューが使用するベーステーブルのうち、少なくとも 1 つはパーティション分割されたテーブルである必要があります。
  > 2. マテリアライズドビューが使用するパーティション分割されたベーステーブルは、List または Range パーティション方式を使用する必要があります。
  > 3. マテリアライズドビュー定義の SQL では、Partition By 句にパーティションフィールドを 1 つだけ指定できます。
  > 4. マテリアライズドビューの SQL で Partition By 句に指定するパーティションフィールドは、Select 句にも含まれている必要があります。
  > 5. マテリアライズドビュー定義の SQL で Group By を使用する場合、パーティションフィールドは Group By 句にも含まれている必要があります。
  > 6. マテリアライズドビュー定義の SQL で Window 関数を使用する場合、パーティションフィールドは Partition By 句にも含まれている必要があります。
  > 7. データの変更はパーティション分割されたテーブルで発生する必要があります。パーティション分割されていないテーブルで変更が発生した場合、マテリアライズドビューを全面的に構築し直す必要があります。
  > 8. JOIN の NULL を生成する側のフィールドをパーティションフィールドとして使用すると、パーティション単位の増分更新はできません。例えば LEFT OUTER JOIN の場合、パーティションフィールドは左側に配置する必要があり、NULL を生成する側には配置できません。


## 例

準備: 以下の例では、標準的な TPC-H 形式のベーステーブル `orders`、`lineitem`、`partsupp` を基にマテリアライズドビューを作成します。これらのテーブルは一度だけ作成してください（`orders` のパーティション分割された形式は例 2 でも再利用します。例 2 にある `CREATE TABLE IF NOT EXISTS orders` は、その時点では何も行いません）。

```sql
CREATE TABLE IF NOT EXISTS orders (
  o_orderkey      INT NOT NULL,
  o_custkey       INT NOT NULL,
  o_orderstatus   CHAR(1) NOT NULL,
  o_totalprice    DECIMALV3(15,2) NOT NULL,
  o_orderdate     DATE NOT NULL,
  o_orderpriority CHAR(15) NOT NULL,
  o_clerk         CHAR(15) NOT NULL,
  o_shippriority  INT NOT NULL,
  o_comment       VARCHAR(79) NOT NULL
)
DUPLICATE KEY (o_orderkey, o_custkey)
PARTITION BY RANGE (o_orderdate) (FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY)
DISTRIBUTED BY HASH (o_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE IF NOT EXISTS lineitem (
  l_orderkey      INT NOT NULL,
  l_partkey       INT NOT NULL,
  l_suppkey       INT NOT NULL,
  l_linenumber    INT NOT NULL,
  l_quantity      DECIMAL(15,2) NOT NULL,
  l_extendedprice DECIMAL(15,2) NOT NULL,
  l_discount      DECIMAL(15,2) NOT NULL,
  l_tax           DECIMAL(15,2) NOT NULL,
  l_returnflag    CHAR(1) NOT NULL,
  l_linestatus    CHAR(1) NOT NULL,
  l_shipdate      DATE NOT NULL,
  l_commitdate    DATE NOT NULL,
  l_receiptdate   DATE NOT NULL,
  l_shipinstruct  CHAR(25) NOT NULL,
  l_shipmode      CHAR(10) NOT NULL,
  l_comment       VARCHAR(44) NOT NULL
)
DUPLICATE KEY (l_orderkey, l_partkey, l_suppkey, l_linenumber)
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");

CREATE TABLE IF NOT EXISTS partsupp (
  ps_partkey    INT NOT NULL,
  ps_suppkey    INT NOT NULL,
  ps_availqty   INT NOT NULL,
  ps_supplycost DECIMAL(15,2) NOT NULL,
  ps_comment    VARCHAR(199) NOT NULL
)
DUPLICATE KEY (ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH (ps_partkey) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

1. パーティション分割されていないマテリアライズドビュー

```sql

CREATE MATERIALIZED VIEW complete_mv (
orderdate COMMENT 'Order date',
orderkey COMMENT 'Order key',
partkey COMMENT 'Part key'
)
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
DISTRIBUTED BY HASH (orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "1")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```

2. パーティション分割されたマテリアライズドビュー

以下のようにパーティション列を指定すると、列の由来となるベーステーブルが自動的に特定され、そのテーブルのパーティションと同期されます。ベーステーブルは日単位でパーティション分割されています（パーティション列: o_orderdate、パーティション方式: RANGE）。マテリアライズドビューは DATE_TRUNC 関数を使用してベーステーブルのパーティションを月単位にロールアップし、月単位でパーティション分割されます。
```sql
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
FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES (
"replication_num" = "3"
);
```

```sql
CREATE MATERIALIZED VIEW partition_mv
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
PARTITION BY (DATE_TRUNC(o_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
o_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey;
```

次の例では、パーティション列に date_trunc 以外の関数を使用しているため、パーティション分割されたマテリアライズドビューを作成できません。エラーメッセージは次のとおりです: because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
PARTITION BY (DATE_TRUNC(min_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
("replication_num" = "3")
AS
SELECT
min(o_orderdate) AS min_orderdate,
l_orderkey,
l_partkey
FROM
orders
LEFT JOIN lineitem ON l_orderkey = o_orderkey
LEFT JOIN partsupp ON ps_partkey = l_partkey
and l_suppkey = ps_suppkey
GROUP BY
o_orderdate,
l_orderkey,
l_partkey;
```

3. マテリアライズドビューのプロパティの変更には、ALTER MATERIALIZED VIEW ステートメントを使用します。

例:
```sql
ALTER MATERIALIZED VIEW partition_mv
SET (
"grace_period" = "10",
"excluded_trigger_tables" = "lineitem,partsupp"
);
```

4. マテリアライズドビューの更新モードの変更には、ALTER MATERIALIZED VIEW ステートメントを使用します。
例:

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```
