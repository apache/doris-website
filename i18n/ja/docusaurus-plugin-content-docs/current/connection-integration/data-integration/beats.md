---
{
    "title": "Beats",
    "language": "ja",
    "description": "Beats Doris output プラグインを使い、Filebeat などの Beats コンポーネントが収集したデータを Stream Load 経由で Apache Doris にリアルタイムで書き込む方法を説明します。"
}
---

[Beats](https://github.com/elastic/beats) は、カスタム出力プラグインを通じてストレージシステムへのデータ書き込みをサポートするデータ収集エージェントです。Beats Doris output プラグインは、Beats が収集したデータを Doris に出力します。

Filebeat などの Beats コンポーネントが収集したデータを Doris にリアルタイムで書き込むには、Beats Doris output プラグインを使用できます。このプラグインは [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) の HTTP インターフェースを呼び出してデータを書き込みます。また、マルチスレッドによる並列処理、失敗時の再試行、Stream Load の形式とパラメーターのカスタマイズ、書き込み速度の報告などに対応しています。

Beats Doris output プラグインは、次の Beats コンポーネントをサポートします。

| Beats コンポーネント | 説明 |
| --- | --- |
| [Filebeat](https://github.com/elastic/beats/tree/master/filebeat) | ログファイルを収集します |
| [Metricbeat](https://github.com/elastic/beats/tree/master/metricbeat) | メトリクスデータを収集します |
| [Packetbeat](https://github.com/elastic/beats/tree/master/packetbeat) | ネットワークデータを収集します |
| [Winlogbeat](https://github.com/elastic/beats/tree/master/winlogbeat) | Windows イベントログを収集します |
| [Auditbeat](https://github.com/elastic/beats/tree/master/auditbeat) | 監査データを収集します |
| [Heartbeat](https://github.com/elastic/beats/tree/master/heartbeat) | 可用性の監視データを収集します |

Beats Doris output プラグインの使用手順は、通常、次の三つのステップです。

1. Doris output プラグインを含む Beats バイナリをダウンロードするか、コンパイルします。
2. Beats の設定ファイルで Doris の出力先アドレスなどのパラメーターを設定します。
3. Beats を起動し、Doris にデータをリアルタイムで書き込みます。

## インストール {#installation}

Doris output プラグインを含む Beats バイナリをダウンロードするか、ソースコードからコンパイルできます。

### 公式サイトからダウンロードする {#download-from-the-official-site}

[filebeat-doris-2.1.1](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/filebeat-doris-2.1.1) をダウンロードします。

### ソースコードからコンパイルする {#compile-from-source}

Doris のソースコードにある `extension/beats/` ディレクトリで、次のコマンドを実行します。

```bash
cd doris/extension/beats

go build -o filebeat-doris filebeat/filebeat.go
go build -o metricbeat-doris metricbeat/metricbeat.go
go build -o winlogbeat-doris winlogbeat/winlogbeat.go
go build -o packetbeat-doris packetbeat/packetbeat.go
go build -o auditbeat-doris auditbeat/auditbeat.go
go build -o heartbeat-doris heartbeat/heartbeat.go
```

## Doris への出力を設定する {#configure-the-doris-output}

Beats の設定ファイルで `output.doris` を使用して Doris への出力を設定します。主な設定項目は次のとおりです。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `fenodes` | なし | Stream Load の HTTP アドレス。文字列の配列で指定し、一つ以上のアドレスを設定できます。例: `["http://fe1:8030", "http://fe2:8030"]`。 |
| `user` | なし | Doris のユーザー名。このユーザーには、書き込み先のデータベースとテーブルに対するロード権限が必要です。 |
| `password` | なし | Doris ユーザーのパスワード。 |
| `database` | なし | 書き込み先の Doris データベース名。 |
| `table` | なし | 書き込み先の Doris テーブル名。 |
| `label_prefix` | `beats` | Doris Stream Load の Label に付けるプレフィックス。最終的な Label の形式は `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}` です。 |
| `headers` | なし | Doris Stream Load に渡すヘッダー。YAML マップ形式で指定します。 |
| `codec_format_string` | なし | Doris Stream Load に出力するデータのフォーマット文字列。`%{[a][b]}` を使用すると、入力の `a.b` フィールドを参照できます。 |
| `bulk_max_size` | `100000` | Doris Stream Load のバッチサイズ。 |
| `max_retries` | `-1` | Doris Stream Load のリクエストが失敗した後の再試行回数。`-1` は無制限の再試行を意味し、データの信頼性を確保するために使用します。 |
| `log_request` | `true` | トラブルシューティングに使用するため、Doris Stream Load のリクエストとレスポンスのメタデータをログに出力するかどうか。 |
| `log_progress_interval` | `10` | 書き込み速度をログに出力する間隔（秒）。`0` に設定すると、このログ出力を無効にします。 |

## シナリオ 1: TEXT ログを収集する {#scenario-1-collecting-text-logs}

このシナリオでは Doris FE のログを例に、プレーンテキストのログと複数行にわたるスタックトレースを収集し、Doris に書き込む方法を示します。

### ステップ 1: データを準備する {#step-1-prepare-the-data}

Doris FE のログファイルは通常、Doris のインストールディレクトリ内の `fe/log/fe.log` にあります。FE ログは一般的な Java プログラムのログで、タイムスタンプ、ログレベル、スレッド名、コード上の位置、ログ内容などのフィールドを含みます。通常のログエントリと、スタックトレースを伴う例外エントリの両方が含まれます。スタックトレースは複数行にわたるため、収集時にメインのログエントリと対応するスタックトレースを一つのログエントリにまとめる必要があります。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### ステップ 2: Doris テーブルを作成する {#step-2-create-a-doris-table}

テーブルスキーマには、ログの生成時刻、収集時刻、ホスト名、ログファイルのパス、ログの種類、ログレベル、スレッド名、コード上の位置、ログ内容などのフィールドが含まれます。

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

### ステップ 3: Filebeat を設定する {#step-3-configure-filebeat}

Filebeat のログ収集用設定ファイル（例: `filebeat_doris_log.yml`）は YAML 形式で、主に次の四つの部分で構成されます。

1. `input`: 元のログファイルを読み取ります。
2. `processors`: ログの内容を変換・解析します。
3. `queue.mem`: Filebeat の内部バッファーキューを設定します。
4. `output`: データを Doris に出力します。

```yaml
# 1. input is responsible for reading raw data.
# type: log is the log input plugin, which lets you configure the path of the log file to read.
# multiline appends lines that do not start with a timestamp to the previous line, used to merge stack traces with the main log entry.
# The log input stores the log content in the message field, and also generates metadata fields such as agent.host and log.file.path.
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log
  multiline:
    type: pattern
    # A line starting with yyyy-mm-dd HH:MM:SS is recognized as a new log entry; other lines are appended to the previous entry.
    pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
    negate: true
    match: after
    skip_newline: true

# 2. processors handle data transformation.
processors:
# Use the js script plugin to replace \t in the log with spaces, to avoid JSON parsing errors.
- script:
    lang: javascript
    source: >
        function process(event) {
            var msg = event.Get("message");
            msg = msg.replace(/\t/g, "  ");
            event.Put("message", msg);
        }
# Use the dissect plugin for simple log parsing.
- dissect:
    # 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
    tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
    target_prefix: ""
    ignore_failure: true
    overwrite_keys: true

# 3. queue.mem configures the total number of events in the internal buffer queue, the flush batch size, and the flush time interval.
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# 4. output is responsible for sending data to Doris.
# doris output uses the Stream Load HTTP interface to write to Doris.
# headers specifies the Stream Load data format as JSON.
# codec_format_string formats the output content in a printf-like manner.
# In the example, you can reference Filebeat built-in fields (such as agent.hostname) or fields generated by processors (such as day).
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## %{[agent][hostname]} and %{[log][file][path]} are Filebeat built-in metadata.
  ## Other commonly used Filebeat metadata includes the collection timestamp %{[@timestamp]}.
  ## %{[day]} and %{[time]} are fields obtained from the dissect parsing above.
  codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}"}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### ステップ 4: Filebeat を実行する {#step-4-run-filebeat}

次のコマンドを実行して Filebeat を起動します。

```bash
./filebeat-doris -f config/filebeat_doris_log.yml
```

`log_request` が `true` の場合、各 Stream Load のリクエストパラメーターとレスポンス結果がログに出力されます。

```text
doris stream load response:
{
    "TxnId": 45464,
    "Label": "beats_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
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

デフォルトでは、起動後のデータ量（MB および ROWS）、全体の速度（MB/s および R/s）、直近 10 秒間の速度などの書き込み速度情報が、10 秒ごとにログに出力されます。

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## シナリオ 2: JSON ログを収集する {#scenario-2-collecting-json-logs}

このシナリオでは GitHub Events Archive のデータを例に、JSON ログを収集して Doris に書き込む方法を示します。

### ステップ 1: データを準備する {#step-1-prepare-the-data-1}

GitHub Events Archive は、GitHub ユーザーの操作イベントを JSON 形式でアーカイブしたデータです。[GitHub Archive](https://www.gharchive.org/) からダウンロードできます。たとえば、2024 年 1 月の初日 15:00 のデータをダウンロードするには、次のコマンドを実行します。

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

以下はレコードの例です。実際のデータは各行に一件の JSON レコードが記録されていますが、ここでは読みやすいように整形しています。

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

### ステップ 2: Doris テーブルを作成する {#step-2-create-a-doris-table-1}

```sql
CREATE DATABASE log_db;
USE log_db;

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

### ステップ 3: Filebeat を設定する {#step-3-configure-filebeat-1}

TEXT ログの収集設定と比較すると、JSON のシナリオには次の二つの違いがあります。

1. 追加の変換が不要なため、`processors` は使用しません。
2. `codec_format_string` は、`message` 全体、つまり元の JSON コンテンツをそのまま出力します。

```yaml
# input
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /path/to/your/log

# queue and batch
queue.mem:
  events: 1000000
  flush.min_events: 100000
  flush.timeout: 10s

# output
output.doris:
  fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
  user: "your_username"
  password: "your_password"
  database: "your_db"
  table: "your_table"
  # output string format
  ## Output the message of each line in the original file as-is.
  ## headers specifies format: "json", so Stream Load automatically parses JSON fields and writes them into the corresponding fields of the Doris table.
  codec_format_string: '%{[message]}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"
```

### ステップ 4: Filebeat を実行する {#step-4-run-filebeat-1}

次のコマンドを実行して Filebeat を起動します。

```bash
./filebeat-doris -f config/filebeat_github_events.yml
```
