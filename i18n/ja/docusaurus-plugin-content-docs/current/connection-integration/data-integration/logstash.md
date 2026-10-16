---
{
    "title": "Logstash",
    "language": "ja",
    "description": "Logstash Doris 出力プラグインを使用して TEXT または JSON のログを収集し、Stream Load を介して Apache Doris にリアルタイムで書き込みます。ログの ETL や検索分析に適しています。",
    "keywords": [
        "Logstash",
        "Logstash Doris 出力プラグイン",
        "Doris Stream Load",
        "ログ収集",
        "ログ ETL"
    ]
}
---

# Logstash Doris 出力プラグイン {#logstash-doris-output-plugin}

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use Logstash to collect, preprocess, and write logs to Doris in real time -->

Logstash は、データの収集、前処理、ストレージシステムへの送信を担うログ ETL フレームワークです。Logstash Doris 出力プラグインは、Logstash から Apache Doris へデータを書き込むための出力プラグインです。TEXT または JSON のログを Doris にリアルタイムで取り込み、ログの検索や分析に使用できます。

このプラグインは [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) の HTTP インターフェースを呼び出してデータをリアルタイムで書き込みます。また、複数スレッドによる並列処理、失敗時の再試行、Stream Load の形式とパラメータのカスタマイズ、書き込み速度のログ出力に対応します。

## ユースケースとワークフロー {#use-cases-and-workflow}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose Logstash as the log collection method for writing to Doris -->

ログの形式に応じて、適切な例を選択してください。

| ユースケース | 対象データ | 参照する例 |
| --- | --- | --- |
| プレーンテキストのログや、Java のスタックトレースなどの複数行のログを収集する | 一件の業務ログが複数行にわたることがある TEXT ログ | [複数行の TEXT ログを収集する](#collect-text-multi-line-logs) |
| 各行に一つの JSON オブジェクトを含む構造化ログを収集する | 各行を直接フィールドに解析できる JSON Lines 形式のログ | [JSON Lines 形式のログを収集する](#collect-json-line-logs) |

Logstash Doris 出力プラグインを使用する際のワークフローは次のとおりです。

1. Logstash Doris 出力プラグインを入手してインストールします。
2. Doris に書き込み先のデータベースとテーブルを作成します。
3. Logstash の入力、変換、Doris への出力のパラメータを設定します。
4. Logstash を起動して、ログを Doris にリアルタイムで書き込みます。
5. Stream Load の応答と書き込み速度のログで、取り込み結果を確認します。

## プラグインのインストール {#install-the-plugin}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Deploy the Logstash Doris output plugin -->

### プラグインの入手 {#obtain-the-plugin}

Logstash Doris 出力プラグインは、インストールパッケージをダウンロードするか、ソースからビルドして入手できます。

| 方法 | 適したケース | 操作 |
| --- | --- | --- |
| 公式サイトからダウンロード | 依存関係を含むインストールパッケージを直接入手する場合 | `logstash-output-doris-1.2.0-java.gem` をダウンロードします。 |
| ソースからビルド | プラグインのソースを入手済みで、パッケージを自分でビルドする場合 | `gem build` を `extension/logstash/` ディレクトリで実行します。 |

公式サイトからダウンロードする場合:

```shell
# Installation package that includes dependencies
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/logstash-output-doris-1.2.0-java.gem
```

ソースからビルドする場合:

```shell
cd extension/logstash/
gem build logstash-output-doris.gemspec
```

### 標準インストール {#standard-installation}

`${LOGSTASH_HOME}` は Logstash のインストールディレクトリです。`${LOGSTASH_HOME}/bin/logstash-plugin` コマンドを実行してプラグインをインストールします。その際、`<plugin_file>.gem` を実際のプラグインパッケージのファイル名に置き換えてください。

```shell
${LOGSTASH_HOME}/bin/logstash-plugin install <plugin_file>.gem
```

インストールに成功すると、Logstash は次のような結果を出力します。

```text
Validating logstash-output-doris-1.2.0.gem
Installing logstash-output-doris
Installation successful
```

標準インストールでは、プラグインが依存する Ruby モジュールも自動的にインストールされます。ネットワークを利用できない場合、インストールが途中で停止したり、完了しなかったりすることがあります。その場合は、依存関係を含むインストールパッケージをダウンロードして、オフラインでインストールできます。

### オフラインインストール {#offline-installation}

オフラインでインストールするには、まず JAR の依存関係の処理をスキップし、ローカルファイルシステム上のプラグインパッケージを使用します。ローカルパスを指定する際は、Logstash の要件に従って `file://` を使用します。

```shell
export JARS_SKIP="true"
${LOGSTASH_HOME}/bin/logstash-plugin install file:///path/to/<plugin_file>.gem
```

## 設定パラメータ {#configuration-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the Logstash Doris output plugin to write to Doris -->

Logstash Doris 出力プラグインは、次の設定項目に対応しています。

| 設定項目 | 説明 |
| --- | --- |
| `http_hosts` | Stream Load の HTTP アドレス。一つ以上の要素を持つ文字列配列で指定します。各要素は `host:port` の形式です。例: `["http://fe1:8030", "http://fe2:8030"]`。 |
| `user` | Doris のユーザー名。このユーザーには、書き込み先の Doris データベースとテーブルに対するインポート権限が必要です。 |
| `password` | Doris ユーザーのパスワード。 |
| `db` | 書き込み先の Doris データベース。 |
| `table` | 書き込み先の Doris テーブル。 |
| `label_prefix` | Doris Stream Load の Label のプレフィックス。生成される Label の形式は `<label_prefix>_<db>_<table>_<yyyymmdd_hhmmss>_<uuid>` です。デフォルト値は `logstash` です。 |
| `headers` | Doris Stream Load の headers パラメータ。Ruby のマップ構文を使用します。例: `headers => { "format" => "json" "read_json_by_line" => "true" }`。 |
| `mapping` | Logstash のフィールドから Doris テーブルのフィールドへのマッピング。使用方法は以下の例を参照してください。 |
| `message_only` | `mapping` の特殊な形式で、Logstash の `@message` フィールドだけを Doris に出力します。デフォルト値は `false` です。 |
| `max_retries` | Doris Stream Load リクエストが失敗した後の再試行回数。デフォルト値は `-1` で、データの信頼性を確保するために無制限に再試行します。 |
| `log_request` | トラブルシューティングのために、Doris Stream Load のリクエストとレスポンスのメタデータをログに出力するかどうかを指定します。デフォルト値は `false` です。 |
| `log_speed_interval` | 書き込み速度をログに出力する間隔。単位は秒です。デフォルト値は `10` です。`0` に設定すると、速度のログ出力を無効にします。 |

## 複数行の TEXT ログを収集する {#collect-text-multi-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect Java TEXT logs and write them to Doris -->

この例では、Doris FE のログを使用して、TEXT ログを収集し Doris に書き込む方法を示します。

### シナリオの説明 {#scenario-description}

FE のログファイルは通常、Doris のインストールディレクトリ内の `fe/log/fe.log` にあります。この種の Java アプリケーションログには、タイムスタンプ、ログレベル、スレッド名、コードの位置、ログ内容などのフィールドが含まれます。

FE のログには、単一行のエントリと、スタックトレースを含む例外ログの両方があります。スタックトレースは複数行にわたるため、収集時に主となるログエントリとスタックトレースを一件のログにまとめる必要があります。

ログの例を次に示します。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Doris にテーブルを作成する {#create-the-table-in-doris}

書き込み先のテーブルには、ログの生成時刻、収集時刻、ホスト名、ログファイルのパス、ログの種類、ログレベル、スレッド名、コードの位置、ログ内容などのフィールドを含めます。

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

### Logstash を設定する {#configure-logstash}

Logstash では、主に次の二種類の設定ファイルを使用します。

| 設定ファイル | 用途 |
| --- | --- |
| `config/logstash.yml` | Logstash のグローバル設定ファイル。バッチサイズとバッチ遅延を設定して、Doris への書き込み性能を向上できます。 |
| `logstash_doris_log.conf` | 一つのログ収集タスクの設定ファイル。通常、`input`、`filter`、`output` の三つのセクションで構成されます。 |

各エントリが平均で数百バイトのログでは、バッチサイズを 1,000,000 行、バッチ遅延を 10 秒に設定します。`config/logstash.yml` で次のように指定できます。

```yaml
pipeline.batch.size: 1000000
pipeline.batch.delay: 10000
```

`logstash_doris_log.conf` は、次の三つのセクションで構成されます。

| セクション | 用途 | この例の主な設定 |
| --- | --- | --- |
| `input` | 生データを読み取ります。 | `file` 入力で FE のログを読み取り、タイムスタンプで始まらない行を `multiline` コーデックで前の行に追加します。 |
| `filter` | データを変換します。 | `grok` を使用して、`log_time`、`level`、`thread`、`position` を `message` フィールドから抽出します。 |
| `output` | Doris に出力します。 | `doris` 出力で Stream Load を介して Doris に書き込み、`mapping` でフィールドを対応付けます。 |

設定例を次に示します。

```text
# 1. input: read FE logs and merge stacktraces using the multiline codec
input {
    file {
        path => "/mnt/disk2/xiaokang/opt/doris_master/fe/log/fe.log"
        add_field => {"type" => "fe.log"}
        codec => multiline {
            # valid line starts with timestamp
            pattern => "^%{TIMESTAMP_ISO8601} "
            # any line not starting with a timestamp should be merged with the previous line
            negate => true
            what => "previous"
        }
    }
}

# 2. filter: extract log fields from the message using grok
filter {
    grok {
        match => {
            # parse log_time, level, thread, position fields from message
            "message" => "%{TIMESTAMP_ISO8601:log_time} (?<level>[A-Z]+) \((?<thread>[^\[]*)\) \[(?<position>[^\]]*)\]"
        }
    }
}

# 3. output: write to Doris through Doris Stream Load
output {
    doris {
        http_hosts => ["http://localhost:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "doris_log"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "log_time" => "%{log_time}"
            "collect_time" => "%{@timestamp}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
            "type" => "%{type}"
            "level" => "%{level}"
            "thread" => "%{thread}"
            "position" => "%{position}"
            "message" => "%{message}"
        }
        log_request => true
    }
}
```

`output` の設定では、`headers` で Stream Load のデータ形式を JSON に指定し、`mapping` で Logstash のフィールドと JSON のフィールドの対応関係を指定します。`headers` に `"format" => "json"` が設定されているため、Stream Load は JSON のフィールドを自動的に解析し、Doris テーブルの対応するフィールドに書き込みます。

### Logstash を実行する {#run-logstash}

次のコマンドで Logstash を起動します。

```shell
${LOGSTASH_HOME}/bin/logstash -f config/logstash_doris_log.conf
```

`log_request` が `true` の場合、各 Stream Load のリクエストパラメータとレスポンス結果がログに出力されます。レスポンスの例を次に示します。

```json
{
    "TxnId": 45464,
    "Label": "logstash_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 452,
    "NumberLoadedRows": 452,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 277230,
    "LoadTimeMs": 1797,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 18,
    "ReadDataTimeMs": 9,
    "WriteDataTimeMs": 1758,
    "CommitAndPublishTimeMs": 18
}
```

デフォルトでは、Logstash は 10 秒ごとに書き込み速度の情報をログに出力します。これには、起動後の累積データ量（MB と ROWS）、全期間の平均速度（MB/s と R/s）、直近 10 秒間の速度が含まれます。

```text
[2024-07-08T22:35:38,285][INFO ][logstash.outputs.doris   ][main] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## JSON Lines 形式のログを収集する {#collect-json-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect JSON line logs and write them to Doris -->

この例では、GitHub Events Archive のデータを使用して、JSON Lines 形式のログを収集し Doris に書き込む方法を示します。

### シナリオの説明 {#scenario-description-1}

GitHub Events Archive は、GitHub ユーザーのアクティビティイベントを保存したアーカイブデータです。形式は JSON で、<https://www.gharchive.org/> からダウンロードできます。各行に一件のイベントが記録されているため、Logstash の `json` コーデックでの解析に適しています。

2024 年四月 1 日 23:00 のデータをダウンロードし、Logstash が読み取れる `.json` ファイルに展開します。

```shell
mkdir -p /tmp/github_events
cd /tmp/github_events
wget https://data.gharchive.org/2024-04-01-23.json.gz
gunzip 2024-04-01-23.json.gz
```

以下はデータの例です。実際のファイルでは各エントリが一行ですが、ここでは読みやすいように整形しています。

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

### Doris にテーブルを作成する {#create-the-table-in-doris-1}

GitHub イベントのフィールド、収集元のホスト、ファイルパスを保存する `github_events` テーブルを作成します。

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor.id` BIGINT,
    `actor.login` TEXT,
    `actor.display_login` TEXT,
    `actor.gravatar_id` TEXT,
    `actor.url` TEXT,
    `actor.avatar_url` TEXT,
    `repo.id` BIGINT,
    `repo.name` TEXT,
    `repo.url` TEXT,
    `payload` TEXT,
    `host` TEXT,
    `path` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor.id` (`actor.id`) USING INVERTED,
    INDEX `idx_actor.login` (`actor.login`) USING INVERTED,
    INDEX `idx_repo.id` (`repo.id`) USING INVERTED,
    INDEX `idx_repo.name` (`repo.name`) USING INVERTED,
    INDEX `idx_host` (`host`) USING INVERTED,
    INDEX `idx_path` (`path`) USING INVERTED,
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

### Logstash を設定する {#configure-logstash-1}

JSON Lines 形式のログの設定は、主に次の二点で複数行の TEXT ログの設定と異なります。

1. `codec` パラメータを `file` 入力で `json` に設定します。Logstash は各行のテキストを JSON として解析し、解析したフィールドを後続の処理で使用します。
2. JSON データは直接フィールドに解析できるため、`filter` プラグインは不要です。

設定例を次に示します。

```text
input {
    file {
        path => "/tmp/github_events/2024-04-01-23.json"
        codec => json
    }
}

output {
    doris {
        http_hosts => ["http://fe1:8630", "http://fe2:8630", "http://fe3:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "github_events"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "created_at" => "%{created_at}"
            "id" => "%{id}"
            "type" => "%{type}"
            "public" => "%{public}"
            "actor.id" => "%{[actor][id]}"
            "actor.login" => "%{[actor][login]}"
            "actor.display_login" => "%{[actor][display_login]}"
            "actor.gravatar_id" => "%{[actor][gravatar_id]}"
            "actor.url" => "%{[actor][url]}"
            "actor.avatar_url" => "%{[actor][avatar_url]}"
            "repo.id" => "%{[repo][id]}"
            "repo.name" => "%{[repo][name]}"
            "repo.url" => "%{[repo][url]}"
            "payload" => "%{[payload]}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
        }
        log_request => true
    }
}
```

### Logstash を実行する {#run-logstash-1}

次のコマンドで Logstash を起動します。

```shell
${LOGSTASH_HOME}/bin/logstash -f logstash_github_events.conf
```

## よくある問題とトラブルシューティング {#common-issues-and-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Check the installation, import, and runtime status of Logstash writing to Doris -->

| 問題 | 対処方法 |
| --- | --- |
| ネットワーク障害で標準インストールが途中で停止する | 依存関係を含むインストールパッケージを使用してオフラインでインストールし、`file://` でローカルファイルシステム上のパスを指定します。 |
| Doris への各リクエストとレスポンスを確認したい | `log_request => true` を `doris` 出力で設定します。Stream Load のリクエストパラメータとレスポンス結果がログに出力されます。 |
| 書き込み速度を確認したい | `log_speed_interval` のデフォルト値を使用します。Logstash は 10 秒ごとに、累積データ量、全期間の平均速度、直近 10 秒間の速度を出力します。 |
| 書き込み速度のログを無効にしたい | `log_speed_interval` を `0` に設定します。 |
| TEXT ログのスタックトレースが複数のログエントリに分かれる | `multiline` コーデックを `file` 入力で使用し、タイムスタンプで始まらない行を前の行にまとめます。 |
