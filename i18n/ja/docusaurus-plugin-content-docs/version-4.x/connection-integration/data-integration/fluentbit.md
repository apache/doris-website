---
{
    "title": "Fluent Bit",
    "language": "ja",
    "description": "Fluent Bit Doris Output Plugin を使用し、Stream Load 経由で TEXT および JSON ログを Apache Doris にリアルタイムで書き込む方法を説明します。",
    "keywords": [
        "Fluent Bit",
        "Doris Stream Load",
        "ログ収集",
        "Doris へのログ書き込み",
        "Fluent Bit Doris Output Plugin"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Applicable scenario: Use Fluent Bit to write logs into Apache Doris in real time -->

[Fluent Bit](https://fluentbit.io/) は、高速なログ処理・転送ツールです。カスタム出力プラグインを通じてストレージシステムにデータを書き込めます。Fluent Bit Doris Output Plugin は、Fluent Bit から Doris にデータを書き込む出力プラグインです。[Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) の HTTP インターフェースを呼び出し、Doris にデータをリアルタイムで書き込みます。

主な機能は次のとおりです。

- 複数スレッドによる並行書き込み。
- Doris Stream Load リクエストが失敗した場合の再試行。
- Stream Load のフォーマットとパラメータのカスタマイズ。
- 書き込み速度の統計情報の出力。

## 適用シナリオと導入手順 {#applicable-scenarios-and-onboarding-flow}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choosing a log collection solution -->

ログの種類に応じて、次の連携方法を選択できます。

| ユーザーのシナリオ | 推奨方法 | このドキュメントの例 |
| --- | --- | --- |
| `stacktrace` を含む TEXT ログを収集する | `tail` 入力、マルチラインパーサー、ログフィールドパーサーを使用し、複数行のログを単一のレコードにまとめてから Doris に書き込む | [Doris FE の TEXT ログを収集する](#collect-doris-fe-text-logs) |
| 単一行の JSON イベントログを収集する | `tail` 入力と JSON パーサーを使用し、JSON レコードを Doris に直接書き込む | [JSON ログを収集する](#collect-json-logs) |

Fluent Bit Doris Output Plugin を使用して Doris と連携する基本的な手順は次のとおりです。

1. Doris Output Plugin を含む Fluent Bit のバイナリをダウンロードするか、コンパイルします。
2. ログの種類に応じて、Fluent Bit の入力、パーサー、Doris 出力のパラメータを設定します。
3. Fluent Bit を起動し、ログを Doris にリアルタイムで書き込みます。

## Fluent Bit Doris Output Plugin のインストール（アルファ版） {#install-the-fluent-bit-doris-output-plugin-alpha-version}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the runtime environment for the Fluent Bit Doris Output Plugin -->

ビルド済みのバイナリを直接ダウンロードするか、ソースからビルドできます。

### 公式サイトからダウンロードする {#download-from-the-official-site}

[fluent-bit-doris-3.1.9](https://apache-doris-releases.oss-accelerate.aliyuncs.com/integrations/fluent-bit-doris-3.1.9) をダウンロードします。

### ソースからビルドする {#build-from-source}

`dev` ブランチの [fluent-bit](https://github.com/joker-star-l/fluent-bit) リポジトリをクローンし、`build/` ディレクトリで次のコマンドを実行します。

```shell
cmake -DFLB_RELEASE=ON ..
make
```

ビルド成果物は `build/bin/fluent-bit` です。

## Doris 出力パラメータの設定 {#configure-doris-output-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure Fluent Bit to write to Doris -->

Fluent Bit Doris Output Plugin の設定項目は次のとおりです。

| 設定項目 | 説明 |
| --- | --- |
| `host` | Stream Load の HTTP ホスト。 |
| `port` | Stream Load の HTTP ポート。 |
| `user` | Doris のユーザー名。このユーザーには、対象のデータベースとテーブルに対するインポート権限が必要です。 |
| `password` | Doris ユーザーのパスワード。 |
| `database` | 書き込み先の Doris データベース名。 |
| `table` | 書き込み先の Doris テーブル名。 |
| `label_prefix` | Doris Stream Load のラベルのプレフィックス。最終的に生成されるラベルは `{label_prefix}_{timestamp}_{uuid}` です。デフォルト値は `fluentbit` です。`false` に設定すると、ラベルは付加されません。 |
| `time_key` | データに追加するタイムスタンプ列の名前。デフォルト値は `date` です。`false` に設定すると、この列は追加されません。 |
| `header` | Doris Stream Load のヘッダーパラメータ。複数の値を設定できます。 |
| `log_request` | トラブルシューティングに使用する Doris Stream Load リクエストとレスポンスのメタデータをログに出力するかどうか。デフォルト値は `true` です。 |
| `log_progress_interval` | 書き込み速度をログに出力する間隔（秒）。デフォルト値は `10` です。`0` に設定すると、このログ出力は無効になります。 |
| `retry_limit` | Doris Stream Load リクエストの失敗後に再試行する回数。デフォルト値は `1` です。`false` に設定すると、再試行回数は無制限になります。 |
| `workers` | Doris Stream Load を実行するワーカーの数。デフォルト値は `2` です。 |

## Doris FE の TEXT ログを収集する {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java logs and write them to Doris -->

このシナリオでは、Doris FE のログを例に TEXT ログの収集方法を示します。`stacktrace` を含む複数行の例外ログでは、まずメインのログと `stacktrace` を単一のレコードにまとめ、次にフィールドを解析して Doris に書き込む必要があります。

### 1. ログのサンプルを準備する {#1-prepare-a-log-sample}

FE のログファイルは通常、Doris のインストールディレクトリ内の `fe/log/fe.log` にあります。これは一般的な Java プログラムのログで、タイムスタンプ、ログレベル、スレッド名、コードの位置、ログの内容などのフィールドを含みます。通常のログエントリに加え、`stacktrace` を含む例外エントリもあります。`stacktrace` は複数行にまたがるため、ログ収集時にメインのログと `stacktrace` を単一のログエントリにまとめる必要があります。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Doris テーブルを作成する {#2-create-a-doris-table}

テーブルのスキーマには、ログの生成時刻、収集時刻、ホスト名、ログファイルのパス、ログの種類、ログレベル、スレッド名、コードの位置、ログの内容などのフィールドが含まれます。

```sql
CREATE TABLE `doris_log` (
    `log_time` datetime NULL COMMENT 'log content time',
    `collect_time` datetime NULL COMMENT 'log agent collect time',
    `host` text NULL COMMENT 'hostname or ip',
    `path` text NULL COMMENT 'log file path',
    `type` text NULL COMMENT 'log type',
    `level` text NULL COMMENT 'log level',
    `thread` text NULL COMMENT 'log thread',
    `position` text NULL COMMENT 'log code position',
    `message` text NULL COMMENT 'log message',
    INDEX idx_host (`host`) USING INVERTED COMMENT '',
    INDEX idx_path (`path`) USING INVERTED COMMENT '',
    INDEX idx_type (`type`) USING INVERTED COMMENT '',
    INDEX idx_level (`level`) USING INVERTED COMMENT '',
    INDEX idx_thread (`thread`) USING INVERTED COMMENT '',
    INDEX idx_position (`position`) USING INVERTED COMMENT '',
    INDEX idx_message (`message`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true") COMMENT ''
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
COMMENT 'OLAP'
PARTITION BY RANGE(`log_time`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-7",
    "dynamic_partition.end" = "1",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "10",
    "dynamic_partition.create_history_partition" = "true",
    "compaction_policy" = "time_series"
);
```

### 3. Fluent Bit を設定する {#3-configure-fluent-bit}

このシナリオでは、次の二つの設定ファイルが必要です。

| 設定ファイル | 用途 |
| --- | --- |
| `doris_log.conf` | Fluent Bit の Service、入力、フィルター、Doris 出力を定義します。 |
| `parsers.conf` | マルチラインログパーサーと FE ログのフィールドパーサーを定義します。 |

`doris_log.conf`:

```ini
# config for Fluent Bit service
[SERVICE]
    log_level info
    # parsers file
    parsers_file parsers.conf

# use input tail
[INPUT]
    name tail
    path /path/to/your/log
    # add log file name to the record, key is 'path'
    path_key path
    # set multiline parser
    multiline.parser multiline_java

# parse log
[FILTER]
    match *
    name parser
    key_name log
    parser fe_log
    reserve_data true

# add host info
[FILTER]
    name sysinfo
    match *
    # add hostname to the record, key is 'host'
    hostname_key host

# output to doris
[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    # add 'collect_time' to the record
    time_key collect_time
    # 'collect_time' is timestamp, change it to datatime
    header columns collect_time=from_unixtime(collect_time)
    log_request true
    log_progress_interval 10
```

`parsers.conf`:

```ini
[MULTILINE_PARSER]
    name          multiline_java
    type          regex
    flush_timeout 1000
    # Regex rules for multiline parsing
    # ---------------------------------
    #
    # configuration hints:
    #
    #  - first state always has the name: start_state
    #  - every field in the rule must be inside double quotes
    #
    # rules   |   state name   | regex pattern | next state name
    # --------|----------------|---------------|-----------------
    rule         "start_state"   "/(^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})(.*)/"  "cont"
    rule         "cont"          "/(^(?![0-9]{4}-[0-9]{2}-[0-9]{2}))(.*)/"     "cont"


[PARSER]
    name        fe_log
    format      regex
    # parse and add 'log_time', 'level', 'thread', 'position', 'message' to the record
    regex       ^(?<log_time>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) (?<level>[^ ]+) \((?<thread>[^\)]+)\) \[(?<position>[^\]]+)\] (?<message>(\n|.)*)\n$
```

### 4. Fluent Bit を起動して書き込み結果を確認する {#4-start-fluent-bit-and-check-the-write-results}

```shell
fluent-bit -c doris_log.conf
```

ログには Stream Load のレスポンスメタデータが出力されます。

```text
[2024/10/31 18:39:55] [ info] [output:doris:doris.1] 127.0.0.1:8040, HTTP status=200
{
    "TxnId": 32155,
    "Label": "fluentbit_1730371195_91cca1aa-c15f-45d2-b503-fe7d2e839c2a",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 836,
    "LoadTimeMs": 298,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 268,
    "CommitAndPublishTimeMs": 25
}
```

ログには書き込み速度も出力されます。

```text
[2024/10/31 18:40:13] [ info] [output:doris:doris.1] total 0 MB 2 ROWS, total speed 0 MB/s 0 R/s, last 10 seconds speed 0 MB/s 0 R/s
```

## JSON ログを収集する {#collect-json-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them to Doris -->

このシナリオでは、GitHub Events Archive のデータを例に JSON ログの収集方法を示します。TEXT ログの収集とは異なり、JSON ログでは処理や変換のための追加の `FILTER` は必要ありません。

### 1. データを準備する {#1-prepare-data}

[GitHub Events Archive](https://www.gharchive.org/) は、GitHub ユーザーのアクションイベントを JSON 形式で保存したアーカイブデータです。次の例では、2024 年 1 月の初日、15:00 のデータをダウンロードします。

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

実際のデータは、各行に JSON オブジェクトが一つずつ記録されています。次に、整形したデータのサンプルを示します。

```json
{
    "id": "37066529221",
    "type": "PushEvent",
    "actor": {
        "id": 46139131,
        "login": "Bard89",
        "display_login": "Bard89",
        "gravatar_id": "",
        "url": "https://api.github.com/users/Bard89",
        "avatar_url": "https://avatars.githubusercontent.com/u/46139131?"
    },
    "repo": {
        "id": 780125623,
        "name": "Bard89/talk-to-me",
        "url": "https://api.github.com/repos/Bard89/talk-to-me"
    },
    "payload": {
        "repository_id": 780125623,
        "push_id": 17799451992,
        "size": 1,
        "distinct_size": 1,
        "ref": "refs/heads/add_mvcs",
        "head": "f03baa2de66f88f5f1754ce3fa30972667f87e81",
        "before": "85e6544ede4ae3f132fe2f5f1ce0ce35a3169d21"
    },
    "public": true,
    "created_at": "2024-04-01T23:00:00Z"
}
```

### 2. Doris テーブルを作成する {#2-create-a-doris-table-1}

```sql
CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor` VARIANT,
    `repo` VARIANT,
    `payload` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor` (`actor`) USING INVERTED,
    INDEX `idx_host` (`repo`) USING INVERTED,
    INDEX `idx_payload` (`payload`) USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
)
ENGINE = OLAP
DUPLICATE KEY(`created_at`)
PARTITION BY RANGE(`created_at`) ()
DISTRIBUTED BY RANDOM BUCKETS 10
PROPERTIES (
    "replication_num" = "1",
    "compaction_policy" = "time_series",
    "dynamic_partition.enable" = "true",
    "dynamic_partition.create_history_partition" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.start" = "-30",
    "dynamic_partition.end" = "1",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "10",
    "dynamic_partition.replication_num" = "1"
);
```

### 3. Fluent Bit を設定する {#3-configure-fluent-bit-1}

このシナリオでは、次の二つの設定ファイルが必要です。

| 設定ファイル | 用途 |
| --- | --- |
| `github_events.conf` | Fluent Bit の Service、入力、Doris 出力を定義します。 |
| `github_parsers.conf` | JSON パーサーを定義します。 |

`github_events.conf`:

```ini
[SERVICE]
    log_level info
    parsers_file github_parsers.conf

[INPUT]
    name tail
    parser github
    path /path/to/your/log

[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    time_key false
    log_request true
    log_progress_interval 10
```

`github_parsers.conf`:

```ini
[PARSER]
    name github
    format json
```

### 4. Fluent Bit を起動する {#4-start-fluent-bit}

```shell
fluent-bit -c github_events.conf
```
