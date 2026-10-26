---
{
    "title": "非同期マテリアライズドビューの作成",
    "language": "ja",
    "description": "非同期マテリアライズドビューを作成するステートメント。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。"
}
---

## 説明 {#description}

非同期マテリアライズドビューを作成するステートメントです。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。列名は指定できますが、列の型は定義できません。

## 構文 {#syntax}


```sql
CREATE MATERIALIZED VIEW
[ IF NOT EXISTS ] <materialized_view_name>
    [ (<columns_definition>) ]
    [ BUILD <build_mode> ]
    [ REFRESH <refresh_method> [FALLBACK] [<refresh_trigger>]]
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

各要素の定義は次のとおりです。


```sql
columns_definition
  : -- Column definition
    <col_name>
      [ COMMENT '<col_comment>' ]
refresh_trigger
  : ON MANUAL
  | ON SCHEDULE EVERY <int_value> <refresh_unit> [ STARTS '<start_time>']
  | ON COMMIT
refresh_method
  : COMPLETE
  | AUTO
  | INCREMENTAL
  | PARTITIONS
```

## 必須パラメータ {#required-parameters}

**1. `<materialized_view_name>`**

> マテリアライズドビューの識別子（名前）を指定します。マテリアライズドビューを作成するデータベース内で一意である必要があります。
>
> 識別子は英字で始める必要があります。Unicode 名のサポートが有効な場合は、任意の言語の文字で始められます。識別子全体をバッククォートで囲む場合（例: `My Object`）を除き、スペースや特殊文字は使用できません。
>
> 予約語は識別子に使用できません。
>
> 詳細については、識別子と予約語の要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの作成時に必須のパラメータです。データを格納するための SELECT ステートメントを指定します。

## オプションパラメータ {#optional-parameters}

**1. `<key_cols>`**

> テーブルのキー列です。Doris では、キー列はテーブルの先頭から K 列である必要があります。キーの制約とキー列の選び方については、「データモデル」の章の該当セクションを参照してください。

**2. `<build_mode>`**

> リフレッシュのタイミング。作成直後にマテリアライズドビューをリフレッシュするかどうかを指定します。
>
> IMMEDIATE: 直ちにリフレッシュします。デフォルトは IMMEDIATE です。
>
> DEFERRED: リフレッシュを遅らせます。

**3. `<refresh_method>`**

> リフレッシュ方法:
>
> COMPLETE: すべてのパーティションをリフレッシュします。
>
> PARTITIONS: ベーステーブルのパーティションの変更を検出し、影響を受けるマテリアライズドビューのパーティションを再計算します。マテリアライズドビューで `PARTITION BY` を定義する必要があります。
>
> INCREMENTAL: Incremental View Maintenance (IVM) を使用し、リフレッシュ間にベーステーブルで発生した行単位の変更を処理します。Doris 5.0.0 以降で利用でき、現在は実験的な機能です。
>
> AUTO: Doris が利用可能なリフレッシュ方法を自動的に選択します。IVM の要件を満たすマテリアライズドビューでは、IVM、パーティションリフレッシュ、完全リフレッシュの順に試します。

`INCREMENTAL` または `PARTITIONS` の後に `FALLBACK` を指定すると、実行時に、より大きな単位のリフレッシュ方法への切り替えを許可できます。`INCREMENTAL FALLBACK` を指定した場合も、定義が IVM の要件を満たすかどうかは作成時に厳密に検査されます。詳細は [Incremental View Maintenance (IVM)](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view) を参照してください。

:::caution 注意
パーティション化されたマテリアライズドビューで COMPLETE リフレッシュモードを使用すると、すべてのパーティションデータが完全にリフレッシュされ、実質的にパーティション化されていないマテリアライズドビューと同じになります。
:::

**4. `<refresh_trigger>`**

> トリガー方法:
>
> MANUAL: 手動でリフレッシュします。
>
> ON SCHEDULE: スケジュールに従ってリフレッシュします。
>
> ON COMMIT: ベーステーブルのデータが変更されると、マテリアライズドビューのリフレッシュを開始します。

**5. `<refresh_unit>`**

> 定期リフレッシュの時間単位です。現在サポートされている単位は MINUTE、HOUR、DAY、WEEK です。

**6. `<partition_col>`**

> PARTITION BY を指定しない場合、デフォルトではパーティションは一つだけになります。
>
> パーティション列を指定すると、その列がどのベーステーブルに由来するかが自動的に推定され、ベーステーブルと同期されます。現在、内部テーブルと Hive テーブルがサポートされています。内部テーブルでは、指定できるパーティション列は一つだけです。
>
> マテリアライズドビューでは、パーティションのロールアップによってパーティション数を減らすこともできます。現在、パーティションのロールアップでは `date_trunc` 関数がサポートされています。

**7. `<partition_unit>`**

> パーティションのロールアップで使用する集約粒度です。現在サポートされている単位は HOUR、DAY、WEEK、QUARTER、MONTH、YEAR です。

**8. `<start_time>`**

> スケジュールの開始時刻には、現在時刻より後の時刻を指定する必要があります。

**9. `<table_property>`**

内部テーブルで使用するプロパティの大半はマテリアライズドビューでも使用できます。また、マテリアライズドビュー固有のプロパティもあります。以下に示します。

| プロパティ名 | 説明 |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period | クエリの透過的な書き換え時に許容される、マテリアライズドビューのデータの最大遅延秒数です。マテリアライズドビューのパーティション A とベーステーブルのデータが一致せず、パーティション A の最終リフレッシュ時刻が 10:15:00、現在のシステム時刻が 10:15:08 の場合、そのパーティションは透過的な書き換えに使用されません。ただし、`grace_period` を 10 に設定すると、そのパーティションが透過的な書き換えに使用されます。 |
| excluded_trigger_tables | データのリフレッシュ時に無視するテーブル名をコンマ区切りで指定します。例: `table1,table2`。 |
| refresh_partition_num | 単一の INSERT ステートメントでリフレッシュするパーティション数です。デフォルトは 1 です。マテリアライズドビューをリフレッシュする際は、まず対象パーティションのリストを計算し、それを複数の INSERT ステートメントに分割して順番に実行します。INSERT ステートメントが失敗すると、タスク全体が停止します。マテリアライズドビューでは単一の INSERT ステートメントの原子性が保証されるため、INSERT が失敗しても、すでに正常にリフレッシュされたパーティションには影響しません。 |
| workload_group | マテリアライズドビューのリフレッシュタスクの実行時に使用する `workload_group` の名前です。リフレッシュ中に使用するリソースを制限し、ほかの業務処理への影響を避けるために使用します。`workload_group` の作成と使用については、[WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group) のドキュメントを参照してください。 |
| ivm_use_full_keys | ソース行の行識別キーを IVM の Unique Key に追加するかどうかを指定します。デフォルトは `false` です。複合行識別子でのハッシュ衝突のリスクを減らせますが、キーの幅とストレージのオーバーヘッドが増えます。設定できるのは IVM の作成時のみです。 |
| ivm_partition_window_limit | 指定したベーステーブルについて、IVM が最後の N 個のパーティションのみを維持するよう制限します。形式は `table:N` で、複数のテーブルはコンマで区切ります。対象範囲外の増分変更は無視されるため、データが欠落し得る設定です。`COMPLETE` は引き続きベーステーブル全体を読み取ります。 |
| partition_sync_limit | ベーステーブルのパーティション列が時刻型の場合、`partition_sync_time_unit` と組み合わせて、ベーステーブルと同期するパーティションの範囲を設定できます。たとえば、`partition_sync_time_unit` を `MONTH`、このプロパティを 2 に設定すると、ベーステーブルの直近 2 か月分のパーティションとデータのみが同期されます。最小値は `1` です。時間の経過に合わせて、マテリアライズドビューはリフレッシュのたびにパーティションを自動的に追加および削除します。たとえば、現在マテリアライズドビューに月 2 と月 3 のデータがある場合、翌月には月 2 のデータが自動的に削除され、月 4 のデータが追加されます。 |
| partition_sync_time_unit | パーティションリフレッシュの時間単位です。DAY/MONTH/YEAR をサポートし、デフォルトは DAY です。 |
| partition_date_format | ベーステーブルのパーティション列が文字列型で、`partition_sync_limit` を使用する場合、`partition_date_format` に日付形式を設定することで、パーティションの時刻を解析できます。 |
| enable_nondeterministic_function | マテリアライズドビューの定義 SQL に current_date()、now()、random() などの非決定的関数を含めることを許可するかどうかを指定します。true に設定すると許可され、それ以外の場合は許可されません。デフォルトでは許可されません。 |
| use_for_rewrite | このマテリアライズドビューを透過的な書き換えに使用するかどうかを指定します。false に設定すると使用されません。デフォルトは true です。データモデリングにおいてマテリアライズドビューを直接クエリするだけの場合は、このプロパティを設定して透過的な書き換えの対象から外すことで、クエリの応答速度を向上できます。 |

:::caution 注意
Apache Doris 2.1.10 より前のバージョンでは DISTRIBUTED BY 句が必須であり、省略するとエラーになります。
Apache Doris 2.1.10 以降では、省略した場合のデフォルトの分散方式は RANDOM になります。
:::

:::caution 注意
Apache Doris 2.1.10/3.0.6 より前のバージョンでは、excluded_trigger_tables プロパティに指定できるのはベーステーブル名のみでした。
これらのバージョン以降では、Catalog と Database を含む完全修飾テーブル名（例: internal.db1.table1）も指定できます。
:::

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限 | オブジェクト | 備考 |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | データベース |                                                              |
| SELECT_PRIV | テーブル、ビュー | `<query>` で参照するテーブルまたはビューに対する SELECT_PRIV 権限が必要です |

## 注意事項 {#notes}

- マテリアライズドビューにおける DML と DDL の制限:

  列はマテリアライズドビューの定義 SQL から導出されるため、列の型の変更や列の追加・削除といったスキーマ変更操作はサポートされません。

  マテリアライズドビューへの手動での insert into 操作や insert overwrite 操作はサポートされません。

- パーティション化されたマテリアライズドビューの作成条件:

  > パーティション単位の増分更新を行うには、マテリアライズドビューの定義 SQL とパーティション列が以下の条件を満たす必要があります。
  >
  > 1. マテリアライズドビューで使用するベーステーブルの少なくとも一つが、パーティション化されたテーブルであること。
  > 2. マテリアライズドビューで使用するパーティション化されたベーステーブルが、List または Range パーティション方式を使用していること。
  > 3. マテリアライズドビューの定義 SQL の Partition By 句に含められるパーティション列は一つだけであること。
  > 4. マテリアライズドビューの SQL の Partition By 句に指定するパーティション列が、Select 句の後にも現れること。
  > 5. マテリアライズドビューの定義 SQL で Group By を使用する場合、パーティション列が Group By 句の後にも現れること。
  > 6. マテリアライズドビューの定義 SQL で Window 関数を使用する場合、パーティション列が Partition By 句の後にも現れること。
  > 7. データの変更はパーティション化されたテーブルで発生すること。パーティション化されていないテーブルで変更が発生した場合、マテリアライズドビューの全体的な構築が必要になります。
  > 8. マテリアライズドビューで Join の NULL を生成する側の列をパーティション列として使用すると、パーティション単位の増分更新は実行できません。たとえば LEFT OUTER JOIN では、パーティション列は右側ではなく左側にある必要がありますが、

- IVM の作成条件

  `REFRESH INCREMENTAL` を使用するには、ベーステーブルで changelog を有効にし、マテリアライズドビューの定義 SQL が IVM のサポート範囲内に収まっている必要があります。`INCREMENTAL` を明示的に指定した場合、サポートされていない定義では作成に失敗します。ベーステーブルのモデルと FE のスイッチについては [IVM の前提条件](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#prerequisites)、クエリ演算子と集約関数については [IVM でサポートされるクエリ](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#supported-queries) を参照してください。

## 例 {#examples}

### IVM の作成 {#creating-an-ivm}

    ```sql
    CREATE MATERIALIZED VIEW orders_by_status
    BUILD DEFERRED
    REFRESH INCREMENTAL FALLBACK ON MANUAL
    DISTRIBUTED BY RANDOM BUCKETS 1
    AS
    SELECT order_status, COUNT(*) AS order_count, SUM(amount) AS total_amount
    FROM orders
    GROUP BY order_status;
    ```

    作成後に `REFRESH MATERIALIZED VIEW orders_by_status COMPLETE` を一度実行して全体の初期データを構築し、その後は増分リフレッシュを実行します。

1. パーティション化されていないマテリアライズドビュー

```sql

CREATE MATERIALIZED VIEW complete_mv (
orderdate COMMENT 'Order date',
orderkey COMMENT 'Order key',
partkey COMMENT 'Part key'
)
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
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

2. パーティション化されたマテリアライズドビュー

以下のようにパーティション列を指定すると、その列がどのベーステーブルに由来するかをシステムが自動的に特定し、ベーステーブルのパーティションと同期します。ベーステーブルは日単位でパーティション化されています（パーティション列: o_orderdate、パーティション方式: RANGE）。マテリアライズドビューは、DATE_TRUNC 関数でベーステーブルのパーティションを月単位にロールアップしてパーティション化します。
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
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
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

次の例では、パーティション列に date_trunc 以外の関数を使用しているため、パーティション化されたマテリアライズドビューを作成できません。エラーメッセージは次のとおりです: because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

```sql
CREATE MATERIALIZED VIEW partition_mv_2
BUILD IMMEDIATE
REFRESH AUTO
ON SCHEDULE EVERY 1 DAY STARTS '2024-12-01 20:30:00'
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

4. マテリアライズドビューのリフレッシュモードの変更には、ALTER MATERIALIZED VIEW ステートメントを使用します。
例:

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```
