---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "非同期マテリアライズドビューを作成するステートメント。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。"
}
---

## 説明 {#description}

非同期マテリアライズドビューを作成するステートメント。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。カスタム列名は指定できますが、列型は定義できません。

## 構文 {#syntax}


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

次のとおりです：


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

## 必須パラメータ {#required-parameters}

**1. `<materialized_view_name>`**

> マテリアライズドビューの識別子（名前）を指定します。テーブルを作成するデータベース内で一意である必要があります。
>
> 識別子は英字で始める必要があります（Unicode 名のサポートが有効な場合は、任意の言語の任意の文字を使用できます）。また、識別子全体をバッククォートで囲まない限り、空白や特殊文字を含めることはできません（例：`My Object`）。
>
> 識別子に予約キーワードを使用することはできません。
>
> 詳細については、識別子と予約キーワードの要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの作成時に必須のパラメータです。データを格納する SELECT ステートメントを指定します。

## オプションパラメータ {#optional-parameters}

**1. `<key_cols>`**

> テーブルの Key 列です。Doris では、Key 列はテーブルの先頭 K 列である必要があります。Key の制限と Key 列の選択方法については、「データモデル」章の該当する節を参照してください。

**2. `<build_mode>`**

> 更新タイミング：マテリアライズドビューを作成直後に更新するかどうかを指定します。
>
> IMMEDIATE：直ちに更新します。デフォルトは IMMEDIATE です。
>
> DEFERRED：遅延更新します。

**3. `<refresh_method>`**

> 更新方法：
>
> COMPLETE：すべてのパーティションを更新します。
>
> AUTO：増分更新を試み、前回のマテリアライズドビュー更新以降に変更されたパーティションだけを更新します。増分更新を実行できない場合は、すべてのパーティションを更新します。

:::caution 注意
パーティション化されたマテリアライズドビューで COMPLETE 更新モードを使用すると、すべてのパーティションデータが完全更新され、実質的に非パーティション化マテリアライズドビューになります。
:::

**4. `<refresh_trigger>`**

> トリガー方法：
>
> MANUAL：手動更新。
>
> ON SCHEDULE：スケジュール更新。
>
> ON COMMIT：トリガーによる更新。基テーブルのデータ変更によってマテリアライズドビューの更新がトリガーされます。

**5. `<refresh_unit>`**

> 定期更新の時間単位です。現在サポートされている単位は MINUTE、HOUR、DAY、WEEK です。

**6. `<partition_col>`**

> PARTITION BY を指定しない場合、デフォルトではパーティションは単一です。
>
> パーティションフィールドを指定すると、そのフィールドがどの基テーブルに由来するかが自動的に推論され、基テーブルと同期されます（現在は内部テーブルと Hive テーブルをサポートしています）。内部テーブルでは、パーティションフィールドは単一しか指定できません。
>
> マテリアライズドビューでは、パーティションロールアップによってパーティション数を減らすこともできます。現在、パーティションロールアップ関数は `date_trunc` をサポートしています。

**7. `<partition_unit>`**

> パーティションロールアップの集約粒度です。現在サポートされている単位は HOUR、DAY、WEEK、QUARTER、MONTH、YEAR です。

**8. `<start_time>`**

> スケジュールの開始時刻は未来の時刻、つまり現在時刻より後である必要があります。

**9. `<table_property>`**

内部テーブルで使用されるプロパティの多くはマテリアライズドビューでも使用できます。これに加えて、マテリアライズドビュー固有のプロパティもあります。以下に示します。

| Property Name                    | Description                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | クエリ書き換え時に許容される、マテリアライズドビューデータの最大遅延時間（秒）。マテリアライズドビューのパーティション A と基テーブルのデータが一致せず、パーティション A の最終更新時刻が 10:15:00、現在のシステム時刻が 10:15:08 の場合、そのパーティションは透過的な書き換えに使用されません。ただし、`grace_period` を 10 に設定すると、そのパーティションが透過的な書き換えに使用されます。 |
| excluded_trigger_tables          | データ更新時に無視するテーブル名をカンマ区切りで指定します。例：`table1,table2`。 |
| refresh_partition_num            | 単一の INSERT ステートメントで更新するパーティション数。デフォルトは 1 です。マテリアライズドビューの更新時には、まず更新対象パーティションのリストを計算し、それを複数の INSERT ステートメントに分割して順番に実行します。INSERT ステートメントが失敗すると、タスク全体が停止します。マテリアライズドビューは単一の INSERT ステートメントのアトミック性を保証するため、失敗した INSERT が、すでに正常に更新されたパーティションに影響を与えることはありません。 |
| workload_group                   | マテリアライズドビューが更新タスクを実行するときに使用する `workload_group` の名前。データ更新中にマテリアライズドビューが使用するリソースを制限し、他の業務への影響を避けるために使用します。`workload_group` の作成と使用については、[WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group) のドキュメントを参照してください。 |
| partition_sync_limit             | 基テーブルのパーティションフィールドが時刻型の場合、このプロパティを `partition_sync_time_unit` と組み合わせて使用し、基テーブルと同期するパーティション範囲を設定できます。たとえば、`partition_sync_time_unit` を `MONTH` に設定し、この値を 2 にすると、基テーブルの直近 2 か月のパーティションとデータだけが同期されます。最小値は `1` です。時間の経過に伴い、マテリアライズドビューは各更新時にパーティションを自動的に追加・削除します。たとえば、マテリアライズドビューに現在 2 月と 3 月のデータがある場合、翌月には 2 月のデータが自動的に削除され、4 月のデータが追加されます。 |
| partition_sync_time_unit         | パーティション更新の時間単位。DAY/MONTH/YEAR をサポートします（デフォルトは DAY）。 |
| partition_date_format            | 基テーブルのパーティションフィールドが文字列型の場合に `partition_sync_limit` を使用するには、`partition_date_format` の設定に従ってパーティション時刻を解析する日付形式を設定します。 |
| enable_nondeterministic_function | マテリアライズドビュー定義 SQL に、current_date()、now()、random() などの非決定的関数を含めることを許可するかどうか。true に設定すると含めることができ、それ以外では許可されません。デフォルトでは許可されません。 |
| use_for_rewrite                  | このマテリアライズドビューが透過的な書き換えに参加するかどうかを示します。false に設定すると参加しません。デフォルトは true です。データモデリングのシナリオで、マテリアライズドビューを直接クエリにのみ使用する場合、このプロパティを設定して透過的な書き換えへの参加を無効にすることで、クエリ応答速度を向上できます。 |
| compute_group | 4.1.5 以降でサポートされています。オプションの文字列で、デフォルトでは省略されます。コンピュートとストレージの分離モードでのみサポートされ、更新 Compute Group を明示的にバインドします。セッションまたは手動更新で選択されたグループより優先されます。作成および変更時には操作者の `USAGE` 権限を確認し、更新時にはグループの存在を確認します。更新段階では現在、作成者として権限を再確認しないため、作成者の `USAGE` だけを取り消しても更新は阻止されません。`DEFAULT` は予約語であり、拒否されます。`ALTER MATERIALIZED VIEW ... SET (\"compute_group\" = \"cg_refresh\")` でバインドを変更します。 |

:::caution 注意
DISTRIBUTED BY 句は Apache Doris 2.1.10 より前では必須です。省略するとエラーになります。
Apache Doris 2.1.10 以降では、指定しない場合のデフォルトの分散方式は RANDOM です。
:::

:::caution 注意
Apache Doris 2.1.10/3.0.6 より前では、excluded_trigger_tables プロパティで指定できるのは基テーブル名だけでした。
これらのバージョン以降では、Catalog と Database を含む完全修飾テーブル名（例：internal.db1.table1）も指定できます。
:::

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります。

| Privilege   | Object      | Notes                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | Database    |                                                              |
| SELECT_PRIV | Table, View | `<query>` でクエリされるテーブルまたはビューに対する SELECT_PRIV 権限が必要です。 |

## 注意事項 {#notes}

- マテリアライズドビューの DML および DDL の制限：

  マテリアライズドビューでは、列型の変更、列の追加・削除などのスキーマ変更操作をサポートしていません。列はマテリアライズドビュー定義 SQL から導出されるためです。

  マテリアライズドビューでは、手動の insert into または insert overwrite 操作をサポートしていません。

- パーティション化されたマテリアライズドビューの作成条件：

  > マテリアライズドビューの SQL 定義とパーティションフィールドが次の条件を満たす場合に、パーティション単位の増分更新を実行できます。
  >
  > 1. マテリアライズドビューで使用する基テーブルの少なくとも 1 つがパーティションテーブルであること。
  > 2. マテリアライズドビューで使用するパーティション基テーブルが、List または Range パーティション戦略を使用していること。
  > 3. マテリアライズドビュー定義 SQL の Partition By 句には、パーティションフィールドを 1 つだけ指定できること。
  > 4. マテリアライズドビュー SQL の Partition By 句のパーティションフィールドが、Select 句の後に現れること。
  > 5. マテリアライズドビュー定義 SQL で Group By を使用する場合、パーティションフィールドが Group By 句の後に現れること。
  > 6. マテリアライズドビュー定義 SQL で Window 関数を使用する場合、パーティションフィールドが Partition By 句の後に現れること。
  > 7. データ変更はパーティションテーブル上で発生すること。非パーティションテーブル上で発生した場合、マテリアライズドビューには完全ビルドが必要です。
  > 8. マテリアライズドビューで、Join の NULL 生成側のフィールドをパーティションフィールドとして使用する場合、パーティション単位の増分更新は実行できません。たとえば LEFT OUTER JOIN では、パーティションフィールドは左側にある必要があり、右側では実行できません。

## 例 {#examples}

準備作業 — 以下の例では、標準的な TPC-H 形式の `orders`、`lineitem`、`partsupp` 基テーブル上にマテリアライズドビューを作成します。最初にこれらを一度作成してください（パーティション化された `orders` は例 2 でも再利用されるため、例 2 の後続の `CREATE TABLE IF NOT EXISTS orders` は何も行いません）。

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
PROPERTIES (\"replication_num\" = \"1\");

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
PROPERTIES (\"replication_num\" = \"1\");

CREATE TABLE IF NOT EXISTS partsupp (
  ps_partkey    INT NOT NULL,
  ps_suppkey    INT NOT NULL,
  ps_availqty   INT NOT NULL,
  ps_supplycost DECIMAL(15,2) NOT NULL,
  ps_comment    VARCHAR(199) NOT NULL
)
DUPLICATE KEY (ps_partkey, ps_suppkey)
DISTRIBUTED BY HASH (ps_partkey) BUCKETS 1
PROPERTIES (\"replication_num\" = \"1\");
```

1. 非パーティション化マテリアライズドビュー

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
(\"replication_num\" = \"1\")
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

2. パーティション化マテリアライズドビュー

以下に示すように、パーティション列を指定すると、その列がどの基テーブルに由来するかをシステムが自動的に識別し、基テーブルのパーティションを同期します。基テーブルは日単位でパーティション化されています（パーティション列：o_orderdate、パーティション型：RANGE）。マテリアライズドビューは月単位でパーティション化され、DATE_TRUNC 関数を使用して基テーブルのパーティションを月単位にロールアップします。
```sql
CREATE TABLE IF NOT EXISTS orders  (
o_orderkey       integer not null,
o_custkey        integer not null,
o_orderstatus    char(1) not null,
o_totalprice     decimalv3(15,2) not null,
o_orderdate      date not null,
o_orderpriority  char(15) not null,  \no_clerk          char(15) not null,
o_shippriority   integer not null,
o_comment        varchar(79) not null
)
DUPLICATE KEY(o_orderkey, o_custkey)
PARTITION BY RANGE(o_orderdate)(
FROM ('2023-10-16') TO ('2023-11-30') INTERVAL 1 DAY
)
DISTRIBUTED BY HASH(o_orderkey) BUCKETS 3
PROPERTIES (
\"replication_num\" = \"3\"
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
(\"replication_num\" = \"3\")
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

次の例では、パーティション列が date_trunc 以外の関数を使用しているため、パーティション化マテリアライズドビューを作成できません。エラーメッセージは次のとおりです：because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2099-01-01 20:30:00'
PARTITION BY (DATE_TRUNC(min_orderdate, 'MONTH'))
DISTRIBUTED BY HASH (l_orderkey) BUCKETS 2
PROPERTIES
(\"replication_num\" = \"3\")
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

3. マテリアライズドビューのプロパティの変更には ALTER MATERIALIZED VIEW ステートメントを使用します。

例：
```sql
ALTER MATERIALIZED VIEW partition_mv
SET (
\"grace_period\" = \"10\",
\"excluded_trigger_tables\" = \"lineitem,partsupp\"
);
```

4. マテリアライズドビューの更新モードの変更には ALTER MATERIALIZED VIEW ステートメントを使用します。
たとえば：

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```
