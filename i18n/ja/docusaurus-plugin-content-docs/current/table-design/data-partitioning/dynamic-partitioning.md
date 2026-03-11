---
{
  "title": "動的パーティショニング（廃止予定）",
  "language": "ja",
  "description": "動的パーティショニングは、事前定義されたルールに従って、ローリング方式でパーティションの追加と削除を行います。"
}
---
動的パーティショニングは、事前定義されたルールに従ってローリング方式でパーティションを追加・削除し、それによってテーブルパーティションのライフサイクル（TTL）を管理し、データストレージの負荷を軽減します。ログ管理や時系列データ管理などのシナリオでは、動的パーティショニングは通常、期限切れデータのローリング削除に使用できます。

以下の図は、動的パーティショニングを使用したライフサイクル管理を示しており、次のルールが指定されています：

* 動的パーティションスケジューリング単位`dynamic_partition.time_unit`がDAYに設定され、日単位でパーティションを整理します；
* 動的パーティション開始オフセット`dynamic_partition.start`が-1に設定され、1日前からのパーティションを保持します；
* 動的パーティション終了オフセット`dynamic_partition.end`が2に設定され、次の2日間のパーティションを保持します。

上記のルールに従って、時間が経過するにつれて、合計4つのパーティションが常に保持されます：過去の日のパーティション、現在の日のパーティション、および次の2日間のパーティションです。

![dynamic-partition](/images/getting-started/dynamic-partition.png)

## 使用制限

動的パーティショニングを使用する際は、以下のルールに従う必要があります：

* 動的パーティショニングは、Cross-クラスター Replication（CCR）と同時に使用すると失敗します。
* 動的パーティショニングは、DATE/DATETIME列のRangeタイプのパーティションのみをサポートします。
* 動的パーティショニングは、単一のパーティションキーのみをサポートします。

## 動的パーティションの作成

テーブルを作成する際、`dynamic_partition`プロパティを指定することで動的パーティションテーブルを作成できます。

```sql
CREATE TABLE test_dynamic_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 10
PROPERTIES(
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-1",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.create_history_partition" = "true"
);
```
上記の例では、以下の仕様で動的パーティションテーブルが作成されました。

詳細な`dynamic_partition`パラメータについては、[Dynamic Partition Parameter Description](#dynamic-partition-property-parameters)を参照してください。

## 動的パーティションの管理

### 動的パーティションプロパティの変更

:::info Tip:

ALTER TABLE文を使用して動的パーティションを変更する場合、変更は即座には有効になりません。動的パーティションは`dynamic_partition_check_interval_seconds`パラメータで指定された間隔でポーリングされ、チェックされて、必要なパーティションの作成と削除操作が完了します。

:::

以下の例では、ALTER TABLE文を使用して非動的パーティションテーブルを動的パーティションテーブルに変更しています：

```sql
CREATE TABLE test_dynamic_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
DISTRIBUTED BY HASH(order_id) BUCKETS 10;

ALTER TABLE test_partition SET (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-1",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.create_history_partition" = "true"
);

```
### 動的パーティション調度状況の確認

[SHOW-DYNAMIC-PARTITION](../../sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES.md) により、現在のデータベース下にあるすべての動的パーティションテーブルの調度状況を確認できます：

```sql
SHOW DYNAMIC PARTITION TABLES;
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| TableName | Enable | TimeUnit | Start       | End  | Prefix | Buckets | StartOf   | LastUpdateTime | LastSchedulerTime   | State  | LastCreatePartitionMsg | LastDropPartitionMsg | ReservedHistoryPeriods  |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
| d3        | true   | WEEK     | -3          | 3    | p      | 1       | MONDAY    | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | [2021-12-01,2021-12-31] |
| d5        | true   | DAY      | -7          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d4        | true   | WEEK     | -3          | 3    | p      | 1       | WEDNESDAY | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    | 
| d6        | true   | MONTH    | -2147483648 | 2    | p      | 8       | 3rd       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d2        | true   | DAY      | -3          | 3    | p      | 32      | N/A       | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
| d7        | true   | MONTH    | -2147483648 | 5    | p      | 8       | 24th      | N/A            | 2020-05-25 14:29:24 | NORMAL | N/A                    | N/A                  | NULL                    |
+-----------+--------+----------+-------------+------+--------+---------+-----------+----------------+---------------------+--------+------------------------+----------------------+-------------------------+
7 rows in set (0.02 sec)
```
### 履歴パーティション管理

`start`と`end`属性を使用して動的パーティションの数を指定する場合、長い待機時間を避けるために履歴パーティションは一度に作成されません。現在時刻以降のパーティションのみが作成されます。すべてのパーティションを一度に作成する必要がある場合は、`create_history_partition`パラメータを有効にする必要があります。

例えば、現在の日付が2024-10-11で、`start = -2`と`end = 2`を設定した場合：

* `create_history_partition = true`が指定された場合、すべてのパーティションが即座に作成され、5つのパーティション[10-09, 10-13]が作成されます。
* `create_history_partition = false`が指定された場合、10-11以降のパーティションのみが作成され、3つのパーティション[10-11, 10-13]が作成されます。

## 動的パーティションパラメータの説明

### 動的パーティションプロパティパラメータ

動的パーティションルールパラメータには`dynamic_partition`というプレフィックスが付けられ、以下のルールパラメータを設定できます：

| パラメータ                                        | 必須 | 説明                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamic_partition.enable`                       | いいえ       | 動的パーティション機能を有効にするかどうか。TRUEまたはFALSEに設定できます。他の必須動的パーティションパラメータが指定されている場合、デフォルトでTRUEになります。                                                                                                                                                                                                                                                                                                                                        |
| `dynamic_partition.time_unit`                   | はい      | 動的パーティションスケジューリングの単位。`HOUR`、`DAY`、`WEEK`、`MONTH`、または`YEAR`に設定でき、それぞれ時間、日、週、月、年単位でのパーティション作成または削除を示します。                                                                                                                                                                                                                                                                                                                                  |
| `dynamic_partition.start`                        | いいえ       | 動的パーティションの開始オフセットで、負の数です。デフォルト値は-2147483648で、履歴パーティションが削除されないことを意味します。`time_unit`属性に応じて、現在の日（週/月）からこのオフセット以前のパーティションが削除されます。このオフセット以降から現在時刻までの履歴パーティションが作成されるかどうかは、`dynamic_partition.create_history_partition`に依存します。                                                                                                     |
| `dynamic_partition.end`                          | はい      | 動的パーティションの終了オフセットで、正の数です。`time_unit`属性に応じて、現在の日（週/月）より先の指定範囲内のパーティションが事前に作成されます。                                                                                                                                                                                                                                                                                                                                                                                  |
| `dynamic_partition.prefix`                       | はい      | 動的に作成されるパーティション名のプレフィックス。                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `dynamic_partition.buckets`                      | いいえ       | 動的に作成されるパーティションに対応するバケット数。このパラメータを設定すると、`DISTRIBUTED`で指定されたバケット数が上書きされます。                                                                                                                                                                                                                                                                                                                                                                                                                              |
| `dynamic_partition.replication_num`              | いいえ       | 動的に作成されるパーティションに対応するレプリカ数。指定されていない場合、テーブル作成時に指定されたレプリカ数がデフォルトになります。                                                                                                                                                                                                                                                                                                                                                 |
| `dynamic_partition.create_history_partition`     | いいえ       | デフォルトはfalseです。trueに設定すると、Dorisは以下のルールに従ってすべてのパーティションを自動的に作成します。また、FEパラメータ`max_dynamic_partition_num`は、一度に多くのパーティションを作成することを避けるため、パーティションの総数を制限します。作成するパーティション数が`max_dynamic_partition_num`の値を超える場合、操作は禁止されます。`start`属性が指定されていない場合、このパラメータは効果を発揮しません。                                               |
| `dynamic_partition.history_partition_num`        | いいえ       | `create_history_partition`が`true`に設定されている場合、このパラメータは作成する履歴パーティション数を指定します。デフォルト値は-1で、設定されていないことを意味します。この変数は`dynamic_partition.start`と同じ機能を持ち、同時にはどちらか一方のみを設定することが推奨されます。                                                                                                                                                                                                                 |
| `dynamic_partition.start_day_of_week`            | いいえ       | `time_unit`が`WEEK`に設定されている場合、このパラメータは週の開始日を指定します。値の範囲は1から7で、1は月曜日、7は日曜日を表します。デフォルトは1で、週が月曜日から始まることを意味します。                                                                                                                                                                                                                                                                                                                    |
| `dynamic_partition.start_day_of_month`           | いいえ       | `time_unit`が`MONTH`に設定されている場合、このパラメータは月の開始日を指定します。値の範囲は1から28で、1は月の最初の日、28は月の28日目を表します。デフォルトは1で、月が最初の日から始まることを意味します。うるう年やうるう月による曖昧さを避けるため、29日、30日、または31日からの開始はサポートされていません。                                                                                                                         |
| `dynamic_partition.reserved_history_periods`      | いいえ       | 保持する必要がある履歴パーティションの時間範囲。`dynamic_partition.time_unit`が"DAY/WEEK/MONTH/YEAR"に設定されている場合、`[yyyy-MM-dd,yyyy-MM-dd],[...,...]`の形式で設定する必要があります。`dynamic_partition.time_unit`が"HOUR"に設定されている場合、`[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]`の形式で設定する必要があります。設定されていない場合、デフォルトで`"NULL"`になります。                                                                                                                        |
| `dynamic_partition.time_zone`                     | いいえ       | 動的パーティショニングのタイムゾーンで、デフォルトはサーバーのシステムタイムゾーン（例：`Asia/Shanghai`）です。タイムゾーン設定の詳細については、[時間ゾーン管理](../../admin-manual/cluster-management/time-zone)を参照してください。                                                                                                                                                                                                                                                                                |

### FE設定パラメータ

FEの動的パーティションパラメータ設定は、FE設定ファイルまたは`ADMIN SET FRONTEND CONFIG`コマンドで変更できます：

| パラメータ                               | デフォルト値 | 説明                                                                                                  |
| --------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------------ |
| `dynamic_partition_enable`              | false         | Dorisの動的パーティション機能を有効にするかどうか。このパラメータは動的パーティションテーブルのパーティション操作にのみ影響し、通常のテーブルには影響しません。 |
| `dynamic_partition_check_interval_seconds` | 600           | 動的パーティションスレッドの実行頻度（秒単位）。                                       |
| `max_dynamic_partition_num`            | 500           | 動的パーティションテーブル作成時に一度に作成できるパーティションの最大数を制限し、一度に多くのパーティションを作成することを避けます。 |

## 動的パーティションのベストプラクティス

例1：日単位でパーティショニングし、過去7日間と当日のパーティションを保持し、今後3日間のパーティションを事前に作成する。

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-7",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "32"
);
```
例2: 月ごとにパーティション分割し、履歴パーティションは削除せず、次の2ヶ月分のパーティションを事前作成する。さらに、各月の開始日を3日に設定する。

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "MONTH",
    "dynamic_partition.end" = "2",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8",
    "dynamic_partition.start_day_of_month" = "3"
);
```
例3：日別でパーティション分割し、過去10日間と次の10日間のパーティションを保持し、期間[2020-06-01, 2020-06-20]と[2020-10-31, 2020-11-15]の履歴データを保持する。

```sql
CREATE TABLE tbl1 (
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
PARTITION BY RANGE(create_dt) ()
DISTRIBUTED BY HASH(create_dt)
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-10",
    "dynamic_partition.end" = "10",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "8",
    "dynamic_partition.reserved_history_periods"="[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"
);
```
