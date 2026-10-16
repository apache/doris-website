---
{
    "title": "動的パーティショニング",
    "language": "ja",
    "description": "動的パーティショニングは、スケジュールに従ってパーティションを作成・削除し、テーブルのパーティションを順次更新することで、パーティションのライフサイクル管理（TTL）を実現します。期限切れデータの自動削除が必要なログや時系列データなどの用途に適しています。"
}
---

:::info ヒント
パーティションの自動管理には、[自動パーティショニング](./auto-partitioning)を推奨します。これは動的パーティショニングの後継機能です。
:::

<!-- Knowledge type: Feature introduction + Operating procedure + Configuration parameters -->
<!-- Applicable scenarios: Log management / Time-series data / Data lifecycle management -->

動的パーティショニングは、設定したルールに従ってパーティションを追加・削除し、テーブルのパーティションのライフサイクル管理（TTL）を実現して、データ保存の負担を軽減します。ログ管理や時系列データ管理などでは、期限切れデータを順次削除するためによく使用されます。

## 適用シナリオ

| シナリオ | 説明 |
| --- | --- |
| ログデータ管理 | 日単位または時間単位で直近 N 日分のログを保持し、期限切れのパーティションを自動的に削除します |
| 時系列データ管理 | 監視、IoT などの用途で、時間軸に沿ってパーティションを自動的に管理します |
| データのライフサイクル管理 | TTL でデータの保持範囲を制御し、ストレージコストを削減します |
| 将来のパーティションの事前作成 | 今後 N 日分のパーティションを事前に作成し、パーティションがないことによる書き込み失敗を防ぎます |

次の図は、動的パーティショニングを使ったライフサイクル管理の例です。この例では、次のルールを指定します。

- スケジューリング単位 `dynamic_partition.time_unit` は `DAY` で、日単位でパーティションを編成します。
- 開始オフセット `dynamic_partition.start` は `-1` に設定し、前日のパーティションを保持します。
- 終了オフセット `dynamic_partition.end` は `2` に設定し、翌日と翌々日のパーティションを保持します。

これらのルールに基づき、時間が進んでも、前日、当日、翌日、翌々日の四つのパーティションが常に保持されます。

![動的パーティショニングの例](/images/getting-started/dynamic-partition.png)

## 制限事項

動的パーティショニングには、次の制限があります。

- 動的パーティショニングは、`DATE` / `DATETIME` 列を使用した Range パーティショニングのみをサポートします。
- 動的パーティショニングは、単一のパーティションキーのみをサポートします。

## 動的パーティションテーブルの作成

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

## 動的パーティションの管理

### 動的パーティションのプロパティの変更

:::info ヒント
`ALTER TABLE` 文による動的パーティションの変更は、すぐには反映されません。Doris は `dynamic_partition_check_interval_seconds` で指定した間隔で動的パーティションを確認し、必要なパーティションの作成と削除を行います。
:::

次の例では、`ALTER TABLE` 文を使用して、動的パーティショニングが設定されていないテーブルを動的パーティションテーブルに変更します。

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

### 動的パーティションのスケジューリング状態の確認

[SHOW-DYNAMIC-PARTITION](../../sql-manual/sql-statements/table-and-view/table/SHOW-DYNAMIC-PARTITION-TABLES)を使用すると、現在のデータベースにあるすべての動的パーティションテーブルのスケジューリング状態を確認できます。

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

### 過去のパーティションの管理

`start` プロパティと `end` プロパティで動的パーティションの数を指定した場合、一度にすべてのパーティションを作成すると待ち時間が長くなるため、過去のパーティションはデフォルトでは作成されません。現在以降のパーティションのみが作成されます。一度にすべてのパーティションを作成するには、`create_history_partition` パラメータを有効にします。

たとえば、現在の日付が 2024-10-11 で、`start = -2`、`end = 2` を指定した場合は、次のようになります。

- `create_history_partition = true` の場合、範囲 `[10-09, 10-13]` の 5 つのパーティションがすぐに作成されます。
- `create_history_partition = false` の場合、範囲 `[10-11, 10-13]` の 3 つのパーティションのみが作成されます。

## 動的パーティションのパラメータ

### 動的パーティションのプロパティ {#dynamic-partition-properties}

<!-- Knowledge type: Configuration parameters -->

動的パーティションのルールに関するパラメータには、`dynamic_partition` プレフィックスを使用します。使用できるパラメータは次のとおりです。

| パラメータ | 必須 | 説明 |
| --- | --- | --- |
| `dynamic_partition.enable` | いいえ | 動的パーティショニング機能を有効にするかどうかを指定します。`TRUE` または `FALSE` を設定できます。ほかの必須の動的パーティションパラメータが指定されている場合、デフォルトは `TRUE` です。 |
| `dynamic_partition.time_unit` | はい | 動的パーティショニングのスケジューリング単位です。`HOUR`、`DAY`、`WEEK`、`MONTH`、`YEAR` のいずれかを設定でき、それぞれ時間、日、週、月、年単位でパーティションが作成または削除されます。 |
| `dynamic_partition.start` | いいえ | 動的パーティショニングの開始オフセットです。負の数で指定します。デフォルト値は `-2147483648` で、この場合、過去のパーティションは削除されません。`time_unit` プロパティに応じて、当日（当週／当月）を基準としたこのオフセットより前の範囲にあるパーティションが削除されます。このオフセットから現在までの過去のパーティションが存在しない場合に作成するかどうかは、`dynamic_partition.create_history_partition` で制御します。 |
| `dynamic_partition.end` | はい | 動的パーティショニングの終了オフセットです。正の数で指定します。`time_unit` プロパティに応じて、当日（当週／当月）を基準とした該当範囲のパーティションが事前に作成されます。 |
| `dynamic_partition.prefix` | はい | 動的に作成されるパーティション名のプレフィックスです。 |
| `dynamic_partition.buckets` | いいえ | 動的に作成されるパーティションのバケット数です。このパラメータを設定すると、`DISTRIBUTED` で指定したバケット数より優先されます。 |
| `dynamic_partition.replication_num` | いいえ | 動的に作成されるパーティションのレプリカ数です。指定しない場合、テーブル作成時に指定したレプリカ数がデフォルトになります。 |
| `dynamic_partition.create_history_partition` | いいえ | デフォルトは `false` です。`true` に設定すると、Doris は以下のルールに従ってすべてのパーティションを自動的に作成します。同時に、FE パラメータ `max_dynamic_partition_num` により、一度に作成するパーティションが多すぎないように、パーティションの総数が制限されます。作成するパーティションの数が `max_dynamic_partition_num` を超えると、操作は拒否されます。`start` プロパティを指定していない場合、このパラメータは効果がありません。 |
| `dynamic_partition.history_partition_num` | いいえ | `create_history_partition` が `true` の場合に、作成する過去のパーティション数を指定します。デフォルト値は `-1` で、未設定を意味します。この変数の効果は `dynamic_partition.start` と同じため、いずれか一方のみを設定することを推奨します。 |
| `dynamic_partition.start_day_of_week` | いいえ | `time_unit` が `WEEK` の場合、週の開始曜日を指定します。有効な範囲は 1～7 で、1 は月曜日、7 は日曜日です。デフォルトは 1 で、週は月曜日に始まります。 |
| `dynamic_partition.start_day_of_month` | いいえ | `time_unit` が `MONTH` の場合、月の開始日を指定します。有効な範囲は 1～28 で、1 は 1 日、28 は 28 日を意味します。デフォルトは 1 で、月は 1 日に始まります。閏年や月ごとの日数の違いによる曖昧さを避けるため、29 日、30 日、31 日は開始日としてサポートされません。 |
| `dynamic_partition.reserved_history_periods` | いいえ | 保持する過去のパーティションの期間です。`dynamic_partition.time_unit` が `DAY` / `WEEK` / `MONTH` / `YEAR` の場合、値を `[yyyy-MM-dd,yyyy-MM-dd],[...,...]` 形式で設定します。`dynamic_partition.time_unit` が `HOUR` の場合は、`[yyyy-MM-dd HH:mm:ss,yyyy-MM-dd HH:mm:ss],[...,...]` 形式で設定します。設定しない場合のデフォルトは `"NULL"` です。 |
| `dynamic_partition.time_zone` | いいえ | 動的パーティショニングのタイムゾーンです。デフォルトは現在のサーバーのシステムタイムゾーンで、たとえば `Asia/Shanghai` です。タイムゾーンの設定について詳しくは、[タイムゾーン管理](../../admin-manual/cluster-management/time-zone)を参照してください。 |

### FE の設定パラメータ

FE の設定ファイルまたは `ADMIN SET FRONTEND CONFIG` コマンドを使用して、FE の動的パーティションパラメータを変更できます。

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `dynamic_partition_enable` | false | Doris で動的パーティショニング機能を有効にするかどうかを指定します。このパラメータが影響するのは動的パーティションテーブルのパーティション操作のみで、通常のテーブルには影響しません。 |
| `dynamic_partition_check_interval_seconds` | 600 | 動的パーティションスレッドの実行間隔です。単位は秒です。 |
| `max_dynamic_partition_num` | 500 | 一度に作成するパーティションが多くなりすぎないように、動的パーティションテーブルの作成時に作成できるパーティションの最大数を制限します。 |

## 動的パーティショニングのベストプラクティス

### 例 1：ログデータのローリング保持

日単位でパーティションを作成し、直近 7 日分と当日分のみを保持して、今後 3 日分のパーティションを事前に作成します。

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

### 例 2：月単位でパーティションを作成し、すべての履歴を保持する

月単位でパーティションを作成し、過去のパーティションを削除せず、今後 2 か月分のパーティションを事前に作成します。また、毎月 3 日を開始日として設定します。

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

### 例 3：指定した過去の期間を保持する

日単位でパーティションを作成し、直近 10 日分と今後 10 日分のパーティションを保持します。さらに、期間 `[2020-06-01, 2020-06-20]` と `[2020-10-31, 2020-11-15]` の過去のデータも保持します。

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
