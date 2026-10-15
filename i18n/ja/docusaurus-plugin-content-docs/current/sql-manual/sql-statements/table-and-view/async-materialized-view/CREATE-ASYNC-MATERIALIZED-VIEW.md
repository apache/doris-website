---
{
    "title": "CREATE ASYNC MATERIALIZED VIEW",
    "language": "ja",
    "description": "非同期マテリアライズドビューを作成するためのステートメントです。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。"
}
---

## 説明

非同期マテリアライズドビューを作成するためのステートメントです。列名と型はマテリアライズドビューの SQL ステートメントから導出されます。列名はカスタマイズできますが、列の型は定義できません。

## 構文


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

各項目の定義は次のとおりです。


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

## 必須パラメータ

**1. `<materialized_view_name>`**

> マテリアライズドビューの識別子（名前）を指定します。テーブルを作成するデータベース内で一意である必要があります。
>
> 識別子は文字で始まる必要があります（Unicode 名のサポートが有効な場合は、任意の言語の任意の文字で始められます）。識別子全体をバッククォートで囲まない限り、スペースや特殊文字は使用できません（例：`My Object`）。
>
> 識別子に予約キーワードは使用できません。
>
> 詳しくは、識別子と予約キーワードの要件を参照してください。

**2. `<query>`**

> マテリアライズドビューの作成時に必須のパラメータです。データを格納するための SELECT ステートメントを指定します。

## オプションパラメータ

**1. `<key_cols>`**

> テーブルのキー列です。Doris では、キー列はテーブルの先頭 K 列である必要があります。キーに関する制約とキー列の選び方については、「データモデル」の章の該当セクションを参照してください。

**2. `<build_mode>`**

> リフレッシュのタイミングを指定します。マテリアライズドビューを作成した直後にリフレッシュするかどうかを決めます。
>
> IMMEDIATE：直ちにリフレッシュします。デフォルトは IMMEDIATE です。
>
> DEFERRED：リフレッシュを遅延させます。

**3. `<refresh_method>`**

> リフレッシュ方法を指定します。
>
> COMPLETE：すべてのパーティションをリフレッシュします。
>
> PARTITIONS：ベーステーブルのパーティション変更を検出し、影響を受けたマテリアライズドビューのパーティションを再計算します。マテリアライズドビューに `PARTITION BY` を定義する必要があります。
>
> INCREMENTAL：増分ビュー維持（Incremental View Maintenance、IVM）を使用して、二回のリフレッシュ間に発生したベーステーブルの行単位の変更を処理します。Doris 5.0.0 以降で利用でき、現時点では実験的な機能です。
>
> AUTO：Doris が利用可能なリフレッシュ方法を自動的に選択します。IVM の要件を満たすマテリアライズドビューでは、IVM、パーティションのリフレッシュ、完全リフレッシュの順に試行します。

`FALLBACK` を `INCREMENTAL` または `PARTITIONS` の後に指定すると、実行時に、より粗い粒度のリフレッシュ方法にフォールバックできます。`INCREMENTAL FALLBACK` でも、定義が IVM の要件を満たすかどうかは作成時に厳密に検査されます。詳しくは、[増分ビュー維持（IVM）](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view)を参照してください。

:::caution 注意
パーティション化されたマテリアライズドビューで COMPLETE リフレッシュモードを使用すると、すべてのパーティションのデータが完全にリフレッシュされ、実質的にパーティション化されていないマテリアライズドビューと同じになります。
:::

**4. `<refresh_trigger>`**

> リフレッシュのトリガー方式を指定します。
>
> MANUAL：手動でリフレッシュします。
>
> ON SCHEDULE：スケジュールに従ってリフレッシュします。
>
> ON COMMIT：ベーステーブルのデータが変更されると、マテリアライズドビューのリフレッシュがトリガーされます。

**5. `<refresh_unit>`**

> 定期リフレッシュの時間単位です。現在サポートされている単位は MINUTE、HOUR、DAY、WEEK です。

**6. `<partition_col>`**

> PARTITION BY を指定しない場合、デフォルトではパーティションは一つだけです。
>
> パーティション列を指定すると、その列がどのベーステーブルに由来するかを自動的に推定し、ベーステーブルと同期します（現在は内部テーブルと Hive テーブルをサポートしています）。内部テーブルでは、パーティション列を一つだけ指定できます。
>
> マテリアライズドビューでは、パーティションのロールアップによってパーティション数を減らすこともできます。現在、パーティションのロールアップでは `date_trunc` をサポートしています。

**7. `<partition_unit>`**

> パーティションのロールアップに使用する集約粒度です。現在サポートされている単位は HOUR、DAY、WEEK、QUARTER、MONTH、YEAR です。

**8. `<start_time>`**

> スケジュールの開始時刻は、現在時刻より後の時刻である必要があります。

**9. `<table_property>`**

内部テーブルで使用するプロパティの多くはマテリアライズドビューでも使用できます。さらに、マテリアライズドビュー固有のプロパティもあります。以下に示します。

| プロパティ名                    | 説明                                                  |
| -------------------------------- | ------------------------------------------------------------ |
| grace_period                     | クエリ書き換え時に許容されるマテリアライズドビューのデータの最大遅延時間（秒）です。マテリアライズドビューのパーティション A とベーステーブルのデータが一致せず、パーティション A の最終リフレッシュ時刻が 10:15:00、現在のシステム時刻が 10:15:08 の場合、そのパーティションは透過的な書き換えに使用されません。ただし、`grace_period` を 10 に設定すると、そのパーティションが透過的な書き換えに使用されます。 |
| excluded_trigger_tables          | データのリフレッシュ時に無視するテーブル名をカンマ区切りで指定します。例：`table1,table2`。 |
| refresh_partition_num            | 一つの INSERT ステートメントでリフレッシュするパーティション数です。デフォルトは 1 です。マテリアライズドビューのリフレッシュ時には、まずリフレッシュ対象のパーティション一覧を計算し、それを複数の INSERT ステートメントに分けて順番に実行します。INSERT ステートメントが失敗すると、タスク全体が停止します。マテリアライズドビューは一つの INSERT ステートメントの原子性を保証しており、失敗した INSERT は、すでに正常にリフレッシュされたパーティションには影響しません。 |
| workload_group                   | マテリアライズドビューがリフレッシュタスクを実行するときに使用する `workload_group` の名前です。リフレッシュ時のリソース使用量を制限し、ほかの業務処理への影響を避けるために使用します。`workload_group` の作成方法と使用方法については、[WORKLOAD-GROUP](https://doris.apache.org/zh-CN/docs/dev/admin-manual/workload-management/workload-group)のドキュメントを参照してください。 |
| ivm_use_full_keys                | ソース行の行識別キーを IVM の Unique Key に追加するかどうかを指定します。デフォルトは `false` です。複合行識別子のハッシュ衝突リスクを減らしますが、キー幅とストレージのオーバーヘッドが増加します。IVM の作成時にのみ設定できます。 |
| ivm_partition_window_limit       | 指定したベーステーブルの直近 N 個のパーティションのみを IVM の維持対象とします。形式は `table:N` で、複数のテーブルはカンマで区切ります。対象範囲外の増分変更は無視されるため、データが欠落する可能性がある設定です。`COMPLETE` は引き続きベーステーブル全体を読み取ります。 |
| partition_sync_limit             | ベーステーブルのパーティション列が時刻型の場合、`partition_sync_time_unit` と組み合わせて、ベーステーブルと同期するパーティションの範囲を設定できます。たとえば、この値を 2 に設定し、`partition_sync_time_unit` を `MONTH` にすると、ベーステーブルの直近 2 か月のパーティションとデータだけが同期されます。最小値は `1` です。時間が経過すると、マテリアライズドビューは各リフレッシュ時にパーティションを自動的に追加、削除します。たとえば、現在 2 月と 3 月のデータがある場合、翌月には 2 月のデータを削除し、4 月のデータを追加します。 |
| partition_sync_time_unit         | パーティションのリフレッシュに使用する時間単位です。DAY/MONTH/YEAR をサポートします（デフォルトは DAY）。 |
| partition_date_format            | ベーステーブルのパーティション列が文字列型の場合、`partition_sync_limit` を使用するには、`partition_date_format` を設定してパーティションの時刻を解析できます。 |
| enable_nondeterministic_function | マテリアライズドビューの定義 SQL に、current_date()、now()、random() などの非決定的関数を含められるかどうかを指定します。true に設定すると含められます。それ以外の場合は含められません。デフォルトでは許可されません。 |
| use_for_rewrite                  | このマテリアライズドビューが透過的な書き換えに参加するかどうかを指定します。false に設定すると、透過的な書き換えに参加しません。デフォルトは true です。データモデリングでマテリアライズドビューを直接クエリする場合にのみ使用するなら、このプロパティを設定して透過的な書き換えへの参加を無効にすることで、クエリの応答速度を向上できます。 |

:::caution 注意
Apache Doris 2.1.10 より前では DISTRIBUTED BY 句が必須であり、省略するとエラーになります。
Apache Doris 2.1.10 以降では、省略した場合のデフォルトの分散方式は RANDOM です。
:::

:::caution 注意
Apache Doris 2.1.10/3.0.6 より前では、excluded_trigger_tables プロパティにはベーステーブル名のみ指定できました。
これらのバージョン以降では、Catalog と Database を含む完全修飾テーブル名（例：internal.db1.table1）も指定できます。
:::

## アクセス制御の要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限   | オブジェクト      | 備考                                                        |
| ----------- | ----------- | ------------------------------------------------------------ |
| CREATE_PRIV | データベース    |                                                              |
| SELECT_PRIV | テーブル、ビュー | `<query>` で参照するテーブルまたはビューに対する SELECT_PRIV 権限が必要です |

## 注意事項

- マテリアライズドビューの DML および DDL に関する制限：

  マテリアライズドビューの列は定義 SQL から導出されるため、列型の変更や列の追加、削除などのスキーマ変更操作はサポートされません。

  マテリアライズドビューへの手動 INSERT および INSERT OVERWRITE 操作はサポートされません。

- パーティション化されたマテリアライズドビューを作成するための条件：

  > パーティション単位の増分更新を行うには、マテリアライズドビューの定義 SQL とパーティション列が次の条件を満たす必要があります。
  >
  > 1. マテリアライズドビューが使用するベーステーブルの少なくとも一つが、パーティション化されたテーブルであること。
  > 2. マテリアライズドビューが使用するパーティション化されたベーステーブルで、List または Range パーティショニング方式を使用していること。
  > 3. マテリアライズドビューの定義 SQL の Partition By 句で指定できるパーティション列は一つだけであること。
  > 4. マテリアライズドビューの SQL の Partition By 句で指定するパーティション列が Select 句の後に現れること。
  > 5. マテリアライズドビューの定義 SQL で Group By を使用する場合、パーティション列が Group By 句の後に現れること。
  > 6. マテリアライズドビューの定義 SQL で Window 関数を使用する場合、パーティション列が Partition By 句の後に現れること。
  > 7. データ変更はパーティション化されたテーブルで発生すること。パーティション化されていないテーブルで変更が発生した場合、マテリアライズドビューの全体ビルドが必要です。
  > 8. Join の NULL を生成する側の列をマテリアライズドビューのパーティション列に使用すると、パーティション単位の増分更新はできません。たとえば、LEFT OUTER JOIN では、パーティション列は左側にある必要があり、

- IVM の作成条件

  `REFRESH INCREMENTAL` を使用するには、ベーステーブルで Row Binlog を有効にし、マテリアライズドビューの定義 SQL が IVM のサポート範囲内にある必要があります。`INCREMENTAL` を明示的に指定した場合、サポートされていない定義では作成に失敗します。ベーステーブルのモデルと FE スイッチについては[IVM の前提条件](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#prerequisites)、クエリ演算子と集約関数については[IVM でサポートされるクエリ](../../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#supported-queries)を参照してください。

## 例

### IVM の作成

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

    Run `REFRESH MATERIALIZED VIEW orders_by_status COMPLETE` once after creation to build the full baseline, then run incremental refreshes.

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

以下のようにパーティション列を指定すると、システムはその列の由来となるベーステーブルを自動的に特定し、ベーステーブルのパーティションと同期します。ベーステーブルは日単位でパーティション化されています（パーティション列：o_orderdate、パーティション方式：RANGE）。マテリアライズドビューは DATE_TRUNC 関数を使用してベーステーブルのパーティションを月単位にロールアップし、月単位でパーティション化されます。
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

次の例では、パーティション列に date_trunc 以外の関数を使用しているため、パーティション化されたマテリアライズドビューを作成できません。エラーメッセージは次のとおりです：because column to check use invalid implicit expression, invalid expression is min(o_orderdate#4)

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

例：
```sql
ALTER MATERIALIZED VIEW partition_mv
SET (
"grace_period" = "10",
"excluded_trigger_tables" = "lineitem,partsupp"
);
```

4. マテリアライズドビューのリフレッシュモードの変更には、ALTER MATERIALIZED VIEW ステートメントを使用します。
例：

```sql
ALTER MATERIALIZED VIEW partition_mv REFRESH COMPLETE;
After running SHOW CREATE MATERIALIZED VIEW partition_mv;, you can see that the refresh mode has been changed to COMPLETE.
```

SHOW CREATE MATERIALIZED VIEW partition_mv; を実行すると、リフレッシュモードが COMPLETE に変更されたことを確認できます。
