---
{
    "title": "LoongCollector",
    "language": "ja",
    "description": "LoongCollector Doris Flusher を使用し、Stream Load 経由で TEXT または JSON ログを Apache Doris にリアルタイムで書き込みます。複数行ログ、失敗時の再試行、並列取り込みに対応します。",
    "keywords": [
        "LoongCollector",
        "iLogtail",
        "Doris Flusher",
        "Doris Stream Load",
        "ログ収集",
        "Doris へのログ書き込み"
    ]
}
---

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use LoongCollector to write logs into Apache Doris in real time -->

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector) は、Alibaba Cloud を起源とするオープンソースの高性能なログ収集・処理フレームワークです。バージョン 3.0 より前は Logtail/iLogtail という名称でした。カスタム出力プラグインを通じてストレージシステムにデータを書き込めます。LoongCollector Doris Flusher は Apache Doris に書き込むための出力プラグインで、ログの検索や分析に向けて TEXT または JSON ログを Doris にリアルタイムで取り込む場合に適しています。

Doris Flusher は [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) の HTTP インターフェースを呼び出してデータをリアルタイムで書き込み、次の機能を提供します。

- 複数スレッドによる並列書き込み。
- Doris Stream Load リクエストが失敗した場合の再試行。
- Stream Load の形式とパラメータのカスタマイズ。
- 書き込み速度の統計情報の出力。

## ユースケースとワークフロー {#use-cases-and-workflow}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Choose a LoongCollector-based log collection method for writing into Doris -->

ログ形式に応じて、該当する例を選んでください。

| ユーザーのシナリオ | 対象データ | 参照先 |
| --- | --- | --- |
| `stacktrace` を含む Doris FE の TEXT ログを収集する | 一件の業務ログが複数行にわたることがある TEXT ログ | [Doris FE の TEXT ログを収集する](#collect-doris-fe-text-logs) |
| 一行に一個の JSON オブジェクトがあるイベントログを収集する | 各行を直接フィールドに解析できる JSON 行ログ | [JSON 行ログを収集する](#collect-json-line-logs) |

LoongCollector Doris Flusher を使用する際の全体的な流れは次のとおりです。

1. LoongCollector をインストールします。
2. Doris に対象のデータベースとテーブルを作成します。
3. LoongCollector の入力、変換、Doris への出力のパラメータを設定します。
4. LoongCollector を起動し、ログを Doris にリアルタイムで書き込みます。

## LoongCollector をインストールする {#install-loongcollector}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the LoongCollector runtime environment -->

コンパイル済みのインストールパッケージを直接ダウンロードするか、ソースから LoongCollector をビルドできます。

### 公式サイトからダウンロードする {#download-from-the-official-site}

コンパイル済みのインストールパッケージをダウンロードします。

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### ソースからビルドする {#build-from-source}

LoongCollector のリポジトリをクローンしてビルドします。

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## Doris 出力パラメータを設定する {#configure-doris-output-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the LoongCollector Doris Flusher to write into Doris -->

LoongCollector Doris Flusher プラグインは、次の設定項目に対応しています。

| 設定項目 | 説明 |
| --- | --- |
| `Addresses` | Stream Load の HTTP アドレス。一個以上の要素を含む文字列配列で指定します。各要素の形式は `host:port` です。例: `["http://fe1:8030", "http://fe2:8030"]`。 |
| `Database` | 書き込み先の Doris データベース名。 |
| `Table` | 書き込み先の Doris テーブル名。 |
| `Authentication.PlainText.Username` | Doris のユーザー名。このユーザーには、該当する Doris データベースとテーブルへのインポート権限が必要です。 |
| `Authentication.PlainText.Password` | Doris ユーザーのパスワード。 |
| `LoadProperties` | Doris Stream Load のヘッダーパラメータ。マップ形式で指定します。例: `LoadProperties: {"format": "json", "read_json_by_line": "true"}`。 |
| `LogProgressInterval` | 書き込み速度をログに記録する間隔（秒）。デフォルト値は `10` です。`0` に設定すると、このログは無効になります。 |
| `GroupCommit` | グループコミットモード。指定できる値は `sync`、`async`、`off` です。デフォルト値は `off` です。 |
| `Concurrency` | データを並列送信する goroutine の数。デフォルト値は `1`（同期モード）です。 |
| `QueueCapacity` | 非同期モードでのタスクキューの容量。デフォルト値は `1024` です。 |
| `Convert.Protocol` | データ変換プロトコル。デフォルト値は `custom_single` です。 |
| `Convert.Encoding` | データ変換時のエンコーディング。デフォルト値は `json` です。 |
| `Convert.TagFieldsRename` | タグ由来の一個以上のフィールドの名前を変更します。 |
| `Convert.ProtocolFieldsRename` | プロトコルフィールドの名前を変更します。対象にできるプロトコルフィールドは `contents`、`tags`、`time` です。 |

## Doris FE の TEXT ログを収集する {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java TEXT logs and write them into Doris -->

このシナリオでは、Doris FE のログを例に TEXT ログの収集方法を示します。`stacktrace` を含む複数行の例外ログでは、まずメインのログと `stacktrace` を一件のレコードにまとめてから、フィールドを解析して Doris に書き込む必要があります。

### 1. ログのサンプルを用意する {#1-prepare-a-log-sample}

FE のログファイルは通常、Doris のインストールディレクトリ内の `fe/log/fe.log` にあります。FE ログは一般的な Java アプリケーションログで、タイムスタンプ、ログレベル、スレッド名、コード位置、ログ内容などのフィールドを含みます。通常のログエントリに加え、`stacktrace` を含む例外エントリもあります。`stacktrace` は複数行にわたるため、収集・保存時にはメインのログと `stacktrace` を一件のログエントリに結合する必要があります。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Doris テーブルを作成する {#2-create-the-doris-table}

対象テーブルには、ログの生成時刻、収集時刻、ホスト名、ログファイルのパス、ログの種類、ログレベル、スレッド名、コード位置、ログ内容などのフィールドを格納します。

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

### 3. LoongCollector を設定する {#3-configure-loongcollector}

LoongCollector の設定ファイルは、主に次の三つの部分で構成されます。

1. `inputs`: 元データを読み込みます。
2. `processors`: ログ内容を変換・解析します。
3. `flushers`: データを Doris に出力します。

設定ファイルを `conf/continuous_pipeline_config/local/` ディレクトリに配置します。たとえば、`loongcollector_doris_log.yaml` を作成します。

```yaml
enable: true

inputs:
  # 1. inputs are responsible for reading raw data
  # input_file is an input plugin where you can configure the log file path to read
  # The multiline configuration appends lines that do not start with a timestamp to the previous line, so the stacktrace is merged with the main log
  - Type: input_file
    FilePaths:
      - /path/fe.log
    Multiline:
      Mode: custom
      StartPattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}'

processors:
  # 2. processors are responsible for data transformation
  # processor_regex is a commonly used data transformation plugin that extracts fields with regular expressions
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
  # 3. flushers are responsible for data output
  # flusher_doris outputs data to Doris through the Stream Load HTTP interface
  # The LoadProperties parameter sets the Stream Load data format to JSON
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

### 4. LoongCollector を起動する {#4-start-loongcollector}

LoongCollector を起動します。

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```

デフォルトでは、書き込み速度が 10 秒ごとにログに記録されます。これには、起動後のデータ量（MB および ROWS）、全体の速度（MB/s および R/s）、直近 10 秒間の速度が含まれます。ログ行の例を次に示します。

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## JSON 行ログを収集する {#collect-json-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them into Doris -->

このシナリオでは、GitHub Events Archive のデータを例に、一行に一個の JSON オブジェクトがあるイベントログの収集方法を示します。

### 1. JSON データを用意する {#1-prepare-json-data}

[GitHub Events Archive](https://www.gharchive.org/) は、GitHub ユーザーの操作イベントを JSON 形式で保存したアーカイブです。2024 年一月 1 日 15:00 のデータをダウンロードできます。以下の設定例では、ファイルパスに展開済みの JSON ファイルを指定してください。

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

実際のデータは一行に一個の JSON オブジェクトを含みます。次のサンプルは読みやすいように整形しています。

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

### 2. Doris テーブルを作成する {#2-create-the-doris-table-1}

GitHub のイベントログを保存する対象データベースとテーブルを作成します。

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
    "inverted_index_storage_format" = "v2",
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

### 3. LoongCollector を設定する {#3-configure-loongcollector-1}

この設定と TEXT ログ収集の例との主な違いは次のとおりです。

1. `input_file` は JSON 解析モードを使用するため、LoongCollector はテキストの各行を JSON として解析します。
2. JSON データにはすでに構造化されたフィールドが含まれるため、複雑な processor プラグインは不要です。

設定ファイルを `conf/continuous_pipeline_config/local/` ディレクトリに配置します。たとえば、`loongcollector_doris_log.yaml` を作成します。

```yaml
enable: true

inputs:
  # input_file reads JSON-format log files
  - Type: input_file
    FilePaths:
      - /path/2024-01-01-15.json

processors:
  # Parse content and expand only the first level (actor and repo remain as JSON strings for the VARIANT type)
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

### 4. LoongCollector を起動する {#4-start-loongcollector-1}

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
