---
{
    "title": "動的パーティショニング",
    "sidebar_label": "動的パーティショニング",
    "language": "ja",
    "description": "動的パーティショニングは、スケジュールに従ってパーティションを作成・削除し、テーブルのパーティションのライフサイクル管理（TTL）を実現します。期限切れデータの自動削除が必要なログや時系列データなどに適しています。"
}
---

:::info パーティション管理方式の選択
動的パーティショニングは、スケジュールに従ってパーティションを作成・削除します。データの到着に応じてパーティションを作成する場合は、[自動パーティショニング](./auto-partitioning)を使用してください。保持期間を時間の範囲で指定するか、過去のパーティション数で指定するかに応じて、保持方式を選択してください。
:::

<!-- Knowledge type: Feature introduction + Operating procedure + Configuration parameters -->
<!-- Applicable scenarios: Log management / Time-series data / Data lifecycle management -->

動的パーティショニングは、設定されたルールに従ってパーティションを追加・削除し、テーブルのパーティションのライフサイクル管理（TTL）を実現するとともに、データの保存に必要なストレージ容量を抑えます。ログ管理や時系列データ管理では、期限切れデータを順次削除するためによく使用されます。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 説明 |
| --------------------------- | --------------------------------------------------------------------------------- |
| ログデータの管理 | 日単位または時間単位で直近 N 日分のログを保持し、期限切れのパーティションを自動的に削除する |
| 時系列データの管理 | 監視や IoT などのシナリオで、時間軸に沿ったパーティションを自動的に維持する |
| データのライフサイクル管理 | TTL でデータの保持範囲を制御し、ストレージコストを削減する |
| 将来のパーティションの事前作成 | 今後 N 日分のパーティションを事前に作成し、パーティションが存在しないことによる書き込み失敗を防ぐ |

次の図は、動的パーティショニングをライフサイクル管理に使用する例です。この例では、次のルールを指定しています。

- スケジューリングの単位 `dynamic_partition.time_unit` を `DAY` に設定し、日単位でパーティションを構成します。
- 開始オフセット `dynamic_partition.start` を `-1` に設定し、前日のパーティションを保持します。
- 終了オフセット `dynamic_partition.end` を `2` に設定し、今後二日分のパーティションを保持します。

これらのルールにより、時間が進んでも、前日、当日、今後二日分の計四つのパーティションが常に保持されます。

![dynamic-partition](/images/getting-started/dynamic-partition.png)

## 制限事項 {#limitations}

動的パーティショニングには、次の制限があります。

- 動的パーティショニングは、`DATE`、`DATETIME`、または `TIMESTAMP_NS` カラムを使用する Range パーティショニングのみをサポートします。
- 動的パーティショニングで使用できるパーティションキーは一つだけです。

## 動的パーティションテーブルの作成 {#creating-a-dynamic-partitioned-table}

<!-- Knowledge type: Operating procedure -->

テーブルの作成時に `dynamic_partition` プロパティを指定すると、動的パーティションテーブルを作成できます。

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

`dynamic_partition` パラメータの詳細については、[動的パーティションのプロパティ](#dynamic-partition-properties)を参照してください。

## 動的パーティションの管理 {#managing-dynamic-partitions}

### 動的パーティションのプロパティの変更 {#modifying-dynamic-partition-properties}

:::info ヒント
`ALTER TABLE` 文で動的パーティションのプロパティを変更しても、すぐには反映されません。Doris は `dynamic_partition_check_interval_seconds` で指定された間隔で動的パーティションを確認し、必要なパーティションの作成・削除を実行します。
:::

次の例では、`ALTER TABLE` 文を使用して、動的パーティショニングを使用していないテーブルを動的パーティションテーブルに変更します。

```sql
CREATE TABLE test_partition(
    order_id    BIGINT,
    create_dt   DATE,
    username    VARCHAR(20)
)
DUPLICATE KEY(order_id)
PARTITION BY RANGE(create_dt) ()
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

### 動的パーティションのスケジューリング状態の確認 {#viewing-dynamic-partition-scheduling-status}

[SHOW-DYNAMIC-PARTITION](../../sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES) を使用すると、現在のデータベース内にあるすべての動的パーティションテーブルのスケジューリング状態を確認できます。

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

### 過去のパーティションの管理 {#managing-historical-partitions}

`start` と `end` プロパティで動的パーティションの数を指定した場合、すべてのパーティションを一度に作成することによる長い待ち時間を避けるため、過去のパーティションはデフォルトでは作成されません。現在時刻以降のパーティションのみが作成されます。すべてのパーティションを一度に作成するには、`create_history_partition` パラメータを有効にします。

たとえば、現在の日付が 2024-10-11 で、`start = -2`、`end = 2` を指定した場合は、次のようになります。

- `create_history_partition = true` の場合、範囲 `[10-09, 10-13]` に対して 5 個のパーティションが直ちに作成されます。
- `create_history_partition = false` の場合、範囲 `[10-11, 10-13]` に対して 3 個のパーティションのみが作成されます。

## 動的パーティションのパラメータ {#dynamic-partition-parameters}

### 動的パーティションのプロパティ {#dynamic-partition-properties}

<!-- Knowledge type: Configuration parameters -->

動的パーティションのルールを設定するパラメータには、`dynamic_partition` プレフィックスが付きます。使用できるパラメータは次のとおりです。

| パラメータ | 必須 | 説明 |
| ----------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dynamic_partition.enable` | いいえ | 動的パーティショニングを有効にするかどうかを指定します。`TRUE` または `FALSE` を設定できます。動的パーティショニングに必要なほかのパラメータが指定されている場合、デフォルトは `TRUE` です。 |
| `dynamic_partition.time_unit` | はい | 動的パーティショニングのスケジューリング単位です。`HOUR`、`DAY`、`WEEK`、`MONTH`、または `YEAR` を設定でき、それぞれ時間、日、週、月、年単位でパーティションが作成・削除されます。 |
| `dynamic_partition.start` | いいえ | 動的パーティショニングの開始オフセットで、負の数で指定します。デフォルト値は `-2147483648` で、この値は過去のパーティションを削除しないことを意味します。`time_unit` プロパティに基づき、現在の日（週／月）から見てこのオフセットより前の範囲にあるパーティションが削除されます。このオフセットから現在時刻までの間に存在しない過去のパーティションを作成するかどうかは、`dynamic_partition.create_history_partition` で制御します。 |
| `dynamic_partition.end` | はい | 動的パーティショニングの終了オフセットで、正の数で指定します。`time_unit` プロパティに基づき、現在の日（週／月）から見た対応する範囲のパーティションが事前に作成されます。 |
| `dynamic_partition.prefix` | はい | 動的に作成されるパーティションの名前に付けるプレフィックスです。 |
| `dynamic_partition.buckets` | いいえ | 動的に作成されるパーティションのバケット数です。このパラメータを設定すると、`DISTRIBUTED` で指定したバケット数より優先されます。 |
| `dynamic_partition.replication_num` | いいえ | 動的に作成されるパーティションのレプリカ数です。指定しない場合、テーブルの作成時に指定したレプリカ数がデフォルトになります。 |
| `dynamic_partition.create_history_partition` | いいえ | デフォルトは `false` です。`true` に設定すると、Doris は以下のルールに従ってすべてのパーティションを自動的に作成します。同時に、FE パラメータ `max_dynamic_partition_num` がパーティションの総数を制限し、一度に多くのパーティションが作成されるのを防ぎます。作成するパーティションの数が `max_dynamic_partition_num` を超えると、操作は拒否されます。`start` プロパティが指定されていない場合、このパラメータは効果がありません。 |
| `dynamic_partition.history_partition_num` | いいえ | `create_history_partition` が `true` の場合に、作成する過去のパーティションの数を指定します。デフォルト値は `-1` で、未設定を意味します。この変数は `dynamic_partition.start` と同じ効果を持つため、いずれか一方のみを設定することを推奨します。 |
| `dynamic_partition.start_day_of_week` | いいえ | `time_unit` が `WEEK` の場合に、週の開始曜日を指定します。有効な範囲は 1 から 7 で、1 は月曜日、7 は日曜日を意味します。デフォルトは 1 で、月曜日が週の開始日です。 |
| `dynamic_partition.start_day_of_month` | いいえ | `time_unit` が `MONTH` の場合に、月の開始日を指定します。有効な範囲は 1 から 28 で、1 は月の 1 日、28 は月の 28 日を意味します。デフォルトは 1 で、毎月 1 日が開始日です。閏年や月ごとの日数の違いによる曖昧さを避けるため、29 日、30 日、31 日は開始日としてサポートされません。 |
| `dynamic_partition.reserved_history_periods` | いいえ | 保持する過去のパーティションの時間範囲です。`dynamic_partition.time_unit` が `DAY` / `WEEK` / `MONTH` / `YEAR` の場合は、`[yyyy-MM-dd,yyyy-MM-dd],[...,...]` 形式で値を設定します。`dynamic_partition.time_unit` が `HOUR` の場合は、`[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` 形式で設定します。未設定の場合、デフォルトは `"NULL"` です。 |
| `dynamic_partition.time_zone` | いいえ | 動的パーティショニングに使用するタイムゾーンです。デフォルトは現在のサーバーのシステムタイムゾーン（例：`Asia/Shanghai`）です。タイムゾーンの設定の詳細については、[タイムゾーン管理](../../admin-manual/cluster-management/time-zone)を参照してください。 |

### FE 設定パラメータ {#fe-configuration-parameters}

FE の動的パーティションに関するパラメータは、FE の設定ファイルまたは `ADMIN SET FRONTEND CONFIG` コマンドで変更できます。

| パラメータ | デフォルト | 説明 |
| ------------------------------------------ | ------- | ------------------------------------------------------------------------------------------ |
| `dynamic_partition_enable` | false | Doris で動的パーティショニングを有効にするかどうかを指定します。このパラメータは動的パーティションテーブルのパーティション操作にのみ影響し、通常のテーブルには影響しません。 |
| `dynamic_partition_check_interval_seconds` | 600 | 動的パーティションスレッドの実行間隔です。単位は秒です。 |
| `max_dynamic_partition_num` | 500 | 動的パーティションテーブルの作成時に作成できるパーティションの最大数を制限し、一度に多くのパーティションが作成されるのを防ぎます。 |

## 動的パーティショニングのベストプラクティス {#dynamic-partitioning-best-practices}

### 例 1：ログデータのローリング保持 {#example-1-rolling-retention-of-log-data}

日単位でパーティショニングし、直近 7 日分と当日分だけを保持して、今後 3 日分のパーティションを事前に作成します。

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

### 例 2：月単位のパーティショニングと全履歴の保持 {#example-2-partitioning-by-month-and-retaining-all-history}

月単位でパーティショニングし、過去のパーティションは削除せず、今後 2 か月分のパーティションを事前に作成して、毎月 3 日を開始日に設定します。

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

### 例 3：指定した過去の期間の保持 {#example-3-retaining-specified-historical-time-ranges}

日単位でパーティショニングし、直近 10 日分と今後 10 日分のパーティションを保持します。さらに、期間 `[2020-06-01, 2020-06-20]` と `[2020-10-31, 2020-11-15]` の過去のデータも保持します。

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
    "dynamic_partition.reserved_history_periods" = "[2020-06-01,2020-06-20],[2020-10-31,2020-11-15]"
);
```
