---
{
  "title": "Filebeat",
  "language": "ja",
  "description": "Beatsは、データをストレージシステムに書き込むためのカスタム出力プラグインをサポートするデータ収集エージェントです。"
}
---
# Beats Doris output plugin

[Beats](https://github.com/elastic/beats)は、カスタム出力プラグインをサポートしてストレージシステムにデータを書き込むデータ収集エージェントであり、Beats Doris output pluginはDorisに出力するためのプラグインです。

Beats Doris output pluginは、[Filebeat](https://github.com/elastic/beats/tree/master/filebeat)、[Metricbeat](https://github.com/elastic/beats/tree/master/metricbeat)、[Packetbeat](https://github.com/elastic/beats/tree/master/packetbeat)、[Winlogbeat](https://github.com/elastic/beats/tree/master/winlogbeat)、[Auditbeat](https://github.com/elastic/beats/tree/master/auditbeat)、および[Heartbeat](https://github.com/elastic/beats/tree/master/heartbeat)をサポートしています。

[Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTPインターフェースを呼び出すことにより、Beats Doris output pluginはリアルタイムでDorisにデータを書き込み、マルチスレッド並行処理、失敗時の再試行、カスタムStream Load形式とパラメータ、および出力書き込み速度などの機能を提供します。

Beats Doris output pluginを使用するには、主に3つのステップがあります：
1. Doris output pluginを含むBeatsバイナリプログラムをダウンロードまたはコンパイルする。
2. Beats出力アドレスとその他のパラメータを設定する。
3. Beatsを起動してリアルタイムでDorisにデータを書き込む。

## インストール

### 公式ウェブサイトからダウンロード

[https://download.selectdb.com/extension/filebeat-doris-2.1.1](https://download.selectdb.com/extension/filebeat-doris-2.1.1)

### ソースコードからコンパイル

`extension/beats/`ディレクトリで以下のコマンドを実行します：

```
cd doris/extension/beats

go build -o filebeat-doris filebeat/filebeat.go
go build -o metricbeat-doris metricbeat/metricbeat.go
go build -o winlogbeat-doris winlogbeat/winlogbeat.go
go build -o packetbeat-doris packetbeat/packetbeat.go
go build -o auditbeat-doris auditbeat/auditbeat.go
go build -o heartbeat-doris heartbeat/heartbeat.go
```
## 設定

Beats Doris出力プラグインの設定は以下の通りです：

設定 | 説明
--- | ---
`http_hosts` | Stream Load HTTPアドレス、文字列配列として形式化され、1つ以上の要素を持つことができ、各要素はhost:portです。例：["http://fe1:8030", "http://fe2:8030"]
`user` | Dorisユーザー名、このユーザーは対応するDorisデータベースとテーブルに対するインポート権限が必要です
`password` | Dorisユーザーのパスワード
`database` | 書き込み先のDorisデータベース名
`table` | 書き込み先のDorisテーブル名
`label_prefix` | Doris Stream Load Labelプレフィックス、最終的に生成されるLabelは *{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}* で、デフォルト値はbeatsです
`headers` | Doris Stream Loadヘッダーパラメータ、構文形式はYAML mapです
`codec_format_string` | Doris Stream Loadへの出力用フォーマット文字列、%{[a][b]}は入力のa.bフィールドを表します。後続のセクションの使用例を参照してください
`bulk_max_size` | Doris Stream Loadバッチサイズ、デフォルトは100000です
`max_retries` | 失敗時のDoris Stream Load要求のリトライ回数、デフォルトは-1で、データの信頼性を確保するため無限リトライです
`log_request` | トラブルシューティングのためにDoris Stream Load要求とレスポンスメタデータをログに出力するかどうか、デフォルトはtrueです
`log_progress_interval` | ログに速度を出力する時間間隔、単位は秒、デフォルトは10、0に設定するとこのタイプのログを無効にできます


## 使用例

### TEXTログ収集例

この例では、DorisのFEログを例としてTEXTログ収集を説明します。

**1. データ**

FEログファイルは通常、Dorisインストールディレクトリ下のfe/log/fe.logファイルに配置されます。これらは典型的なJavaプログラムログで、タイムスタンプ、ログレベル、スレッド名、コード位置、ログ内容などのフィールドが含まれます。通常のログだけでなく、スタックトレース付きの例外ログも含まれており、これらは複数行にわたります。ログ収集と保存では、メインログとスタックトレースを単一のログエントリに結合する必要があります。

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```
**2. テーブル作成**

テーブル構造には、ログの作成時刻、収集時刻、ホスト名、ログファイルパス、ログタイプ、ログレベル、スレッド名、コードの場所、ログ内容などのフィールドが含まれます。

```
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
**3. 設定**

filebeat_doris_log.yml などの filebeat ログ収集設定ファイルは YAML 形式で、ETL の各段階に対応する主に 4 つの部分で構成されています：
1. Input は生データの読み取りを担当します。
2. Processor はデータ変換を担当します。
3. queue.mem は filebeat の内部バッファキューを設定します。
4. Output は出力先へのデータ送信を担当します。

```
# 1. input is responsible for reading raw data
# type: log is a log input plugin that can be configured to read the path of the log file. It uses the multiline feature to concatenate lines that do not start with a timestamp to the end of the previous line, achieving the effect of merging stacktraces with the main log. The log input saves the log content in the message field, and there are also some metadata fields such as agent.host, log.file.path.

filebeat.inputs:
- type: log
   enabled: true
   paths:
     - /path/to/your/log
   # multiline can concatenate multi-line logs (e.g., Java stacktraces)
   multiline:
     type: pattern
     # Effect: Lines starting with yyyy-mm-dd HH:MM:SS are considered as a new log, others are concatenated to the previous log
     pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}'
     negate: true
     match: after
     skip_newline: true

# 2. processors section is responsible for data transformation
processors:
# Use the js script plugin to replace \t in logs with spaces to avoid JSON parsing errors
- script:
     lang: javascript
     source: >
         function process(event) {
             var msg = event.Get("message");
             msg = msg.replace(/\t/g, "   ");
             event.Put("message", msg);
         }
# Use the dissect plugin for simple log parsing
- dissect:
     # Example log: 2024-06-08 18:26:25,481 INFO (report-thread|199) [ReportHandler.cpuReport():617] begin to handle
     tokenizer: "%{day} %{time} %{log_level} (%{thread}) [%{position}] %{content}"
     target_prefix: ""
     ignore_failure: true
     overwrite_keys: true

# 3. internal buffer Queue total count, flush batch size, flush interval
queue.mem:
   events: 1000000
   flush.min_events: 100000
   flush.timeout: 10s

# 4. output section is responsible for data output
# The doris output sends data to Doris using the Stream Load HTTP interface. The data format for Stream Load is specified as JSON through the headers parameter, and the codec_format_string parameter formats the output to Doris in a printf-like manner. For example, the following example formats a JSON based on filebeat internal fields such as agent.hostname, and fields produced by processors like dissect, such as day, using %{[a][b]} to reference them. Stream Load will automatically write the JSON fields into the corresponding fields of the Doris table.

output.doris:
   fenodes: [ "http://fehost1:http_port", "http://fehost2:http_port", "http://fehost3:http_port" ]
   user: "your_username"
   password: "your_password"
   database: "your_db"
   table: "your_table"
   # Output string format
   ## %{[agent][hostname]} %{[log][file][path]} are filebeat自带的metadata
   ## Common filebeat metadata also includes采集时间戳 %{[@timestamp]}
   ## %{[day]} %{[time]} are fields obtained from the above dissect parsing
   codec_format_string: '{"ts": "%{[day]} %{[time]}", "host": "%{[agent][hostname]}", "path": "%{[log][file][path]}", "message": "%{[message]}" }'
   headers:
     format: "json"
     read_json_by_line: "true"
     load_to_single_tablet: "true"
```
**4. filebeatの実行**

```

./filebeat-doris -f config/filebeat_doris_log.yml

# When log_request is set to true, the log will output the request parameters and response results of each Stream Load.

doris stream load response:
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

# By default, speed information is logged every 10 seconds, including the amount of data since startup (in MB and ROWS), the total speed (in MB/s and R/S), and the speed in the last 10 seconds.

total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```
### JSON ログ収集の例

この例では、GitHub イベントアーカイブのデータを使用した JSON ログ収集を実演します。

**1. データ**

GitHub イベントアーカイブには、JSON 形式でフォーマットされた GitHub ユーザーアクションのアーカイブデータが含まれています。[ここ](https://data.gharchive.org/)からダウンロードできます。例えば、2024年1月1日午後3時のデータです。

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```
以下はデータのサンプルです。通常、各データは1行に記述されますが、表示しやすくするためにここではフォーマットされています。

```
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
**2. テーブル作成**

```
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
"enable_single_replica_compaction" = "true",
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
**3. Filebeat設定**

この設定ファイルは、前回のTEXTログ収集とは以下の点で異なります：

1. 追加の処理や変換が不要なため、Processorは使用されません。
2. 出力のcodec_format_stringはシンプルで、メッセージ全体（生のコンテンツ）を直接出力します。

```
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
  ## Directly outputting the raw message of each line from the original file. Since headers specify format: "json", Stream Load will automatically parse the JSON fields and write them into the corresponding fields of the Doris table.
  codec_format_string: '%{[message]}'
  headers:
    format: "json"
    read_json_by_line: "true"
    load_to_single_tablet: "true"

```
**4. Filebeatの実行**

```
./filebeat-doris -f config/filebeat_github_events.yml
```
