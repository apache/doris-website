---
{
  "title": "LoongCollector (iLogtail) Doris Flusher",
  "language": "ja",
  "description": "LoongCollector (iLogtail) は、Alibaba Cloudを起源とするオープンソースの高性能ログ収集・処理フレームワークです。"
}
---
# LoongCollector (iLogtail) Doris Flusher 

## 概要

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector)は、Alibaba Cloudを起源とするオープンソースの高性能ログ収集・処理フレームワークです。バージョン3.0以前は、Logtail/iLogtailと呼ばれていました。ストレージシステムにデータを書き込むためのカスタム出力プラグインをサポートしており、LoongCollector Doris FlusherはDorisにデータを出力するためのプラグインです。

Doris FlusherはDoris Stream Load HTTPインターフェースを呼び出してリアルタイムでDorisにデータを書き込み、マルチスレッド並行処理、失敗時の再試行、カスタムStream Load形式とパラメータ、出力書き込み速度の監視などの機能を提供します。

Doris Flusherを使用するには、主に3つのステップがあります：
1. LoongCollectorをインストール
2. Doris出力アドレスとその他のパラメータを設定
3. LoongCollectorを開始してリアルタイムでDorisにデータを書き込み

## インストール

### 公式サイトからダウンロード

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```
### ソースコードからのコンパイル

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```
## 設定

LoongCollector Doris Flusher Pluginの設定は以下の通りです：

設定 | 説明
--- | ---
`Addresses` | Stream Load HTTPアドレス、1つ以上の要素を持つ文字列配列として形式化され、各要素はhost:portです。例：["http://fe1:8030", "http://fe2:8030"]
`Database` | 書き込み先のDorisデータベース名
`Table` | 書き込み先のDorisテーブル名
`Authentication.PlainText.Username` | Dorisユーザー名、このユーザーは対応するDorisデータベースとテーブルに対するインポート権限が必要です
`Authentication.PlainText.Password` | Dorisユーザーのパスワード
`LoadProperties` | Doris Stream Loadヘッダーパラメータ、マップとして形式化されます。例：`LoadProperties: {"format": "json", "read_json_by_line": "true"}`
`LogProgressInterval` | ログでの速度出力の時間間隔、単位は秒、デフォルトは10、0に設定するとこのタイプのログ出力を無効にできます
`GroupCommit` | グループコミットモード、オプション値は"sync"、"async"、または"off"、デフォルトは"off"
`Concurrency` | 並行データ送信用のgoroutine数、デフォルトは1（同期モード）
`QueueCapacity` | 非同期モードでのタスクキュー容量、デフォルトは1024
`Convert.Protocol` | データ変換プロトコル、デフォルトはcustom_single
`Convert.Encoding` | データ変換エンコーディング、デフォルトはjson
`Convert.TagFieldsRename` | tagsから1つ以上のフィールドをリネーム
`Convert.ProtocolFieldsRename` | プロトコルフィールドをリネーム、プロトコルフィールドオプションは：contents、tags、timeのみ可能


## 使用例

### TEXTログ収集例

この例では、Doris FEログを例としてTEXTログ収集を実演します。

**1. データ**

FEログファイルは通常、Dorisインストールディレクトリ下のfe/log/fe.logファイルに配置されています。これらは典型的なJavaプログラムログで、タイムスタンプ、ログレベル、スレッド名、コード位置、ログ内容などのフィールドを含んでいます。通常のログだけでなく、スタックトレース付きの例外ログも含まれており、これらは複数行にわたります。ログ収集と保存では、メインログとスタックトレースを単一のログエントリに結合する必要があります。

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```
**2. テーブル作成**

テーブル構造には、ログの作成時刻、収集時刻、ホスト名、ログファイルパス、ログタイプ、ログレベル、スレッド名、コード位置、およびログ内容などのフィールドが含まれます。

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
**3. LoongCollector 設定**

LoongCollector 設定ファイルは 3 つの主要な部分で構成されています：
1. inputs - 生データの読み取りを担当
2. processors - データ変換を担当
3. flushers - データ出力を担当

設定ファイルの場所：`conf/continuous_pipeline_config/local/`
設定ファイルを作成：`loongcollector_doris_log.yaml`

```yaml
enable: true

inputs:
  # 1. inputs section is responsible for reading raw data
  # file_log input is an input plugin that can configure the log file path to read
  # Using multiline configuration to append lines not starting with timestamp to the previous line,
  # achieving the effect of merging stacktrace with the main log
  - Type: input_file
    FilePaths:
      - /path/fe.log
    Multiline:
      Mode: custom
      StartPattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'

processors:
  # 2. processors section is responsible for data transformation
  # processor_regex is a commonly used data transformation plugin that extracts fields using regular expressions
  - Type: processor_regex
    SourceKey: content
    Regex: '(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) ([A-Z]+) \(([^\)]*)\) \[([^\]]*)\] (.*)'
    Keys:
      - log_time
      - level
      - thread
      - position
      - message
  # Add extra fields
  - Type: processor_add_fields
    Fields:
      type: fe.log
    IgnoreIfExist: false

flushers:
  # 3. flushers section is responsible for data output
  # flusher_doris outputs data to Doris using the Stream Load HTTP interface
  # The LoadProperties parameter specifies the Stream Load data format as JSON
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: doris_log
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
      columns: "log_time,collect_time,host,path,type,level,thread,position,message,log_time=replace(log_time,',','.'),collect_time=from_unixtime(collect_time)"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
      TagFieldsRename:
        host.ip: host
        log.file.path: path
      ProtocolFieldsRename:
        time: collect_time
    LogProgressInterval: 10
```
**4. LoongCollectorの実行**

```
nohup ./loongcollector > stdout.log 2> stderr.log &

# By default, speed information is logged every 10 seconds, including data volume since startup (MB and ROWS), total speed (MB/s and R/s), and speed for the last 10 seconds
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```
### JSON ログ収集の例

この例では、GitHub イベントアーカイブのデータを使用した JSON ログ収集を実演します。

**1. データ**

GitHub イベントアーカイブには、GitHub ユーザーアクションのアーカイブされたデータが JSON 形式で含まれています。https://www.gharchive.org/ からダウンロードできます。例えば、2024年1月1日午後3時のデータなどです。

```
wget https://data.gharchive.org/2024-01-01-15.json.gz

```
以下はデータのサンプルです。通常、各データは1行に記述されますが、表示を見やすくするためにここではフォーマットしています。

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
"inverted_index_storage_format"= "v2",
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
**3. LoongCollector設定**

この設定は、以前のTEXTログ収集と以下の点で異なります：

1. input_fileは解析にJSONモードを使用し、LoongCollectorは各行のテキストをJSON形式として解析します
2. JSONデータには既に構造化されたフィールドがあるため、複雑なprocessorプラグインは使用されません

設定ファイルの場所：`conf/continuous_pipeline_config/local/`
設定ファイルの作成：`loongcollector_doris_log.yaml`

```yaml
enable: true

inputs:
  # file_log input reads JSON format log files
  - Type: input_file
    FilePaths:
      - /path/2024-01-01-15.json

processors:
  # Parse content, only expand the first level (actor, repo remain as JSON strings for VARIANT type usage)
  - Type: processor_json
    SourceKey: content
    KeepSource: false
    ExpandDepth: 1
    ExpandConnector: ""

flushers:
  # flusher_doris outputs data to Doris
  - Type: flusher_doris
    Addresses:
      - "http://fe_ip:http_port"
    Database: log_db
    Table: github_events
    Authentication:
      PlainText:
        Username: root
        Password: ""
    LoadProperties:
      format: json
      read_json_by_line: "true"
      load_to_single_tablet: "true"
    Convert:
      Protocol: custom_single_flatten
      Encoding: json
    LogProgressInterval: 10
    Concurrency: 3
```
**4. LoongCollectorの実行**

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
