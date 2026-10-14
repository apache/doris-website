---
{
    "title": "OpenTelemetry",
    "language": "ja",
    "description": "OpenTelemetry Collector の Doris Exporter を使用して、ログ、トレース、メトリクスを Apache Doris に書き込み、オブザーバビリティデータを統合的に分析する方法を説明します。",
    "keywords": [
        "OpenTelemetry Doris",
        "OpenTelemetry Collector",
        "Doris Exporter",
        "オブザーバビリティデータ",
        "ログ収集",
        "トレースデータ"
    ]
}
---

<!-- Knowledge type: Operation guide / Configuration reference -->
<!-- Applicable scenario: Use OpenTelemetry to write logs, traces, and metrics into Apache Doris -->

OpenTelemetry（略称 OTel）は、ログ、トレース、メトリクスなどのオブザーバビリティデータを監視、生成、収集、エクスポートするための、ベンダーに依存しないオープンソースのフレームワークです。OpenTelemetry が定義する一連の標準とプロトコルは、オブザーバビリティ分野のコミュニティやベンダーに広く採用され、事実上の標準になりつつあります。

OpenTelemetry は、異なるプログラミング言語、インフラストラクチャ、実行環境にまたがってアプリケーションやシステムを監視するためのフレームワークとデータ収集 SDK を提供します。Doris は OpenTelemetry のストレージバックエンドとして、高性能かつ低コストで、オブザーバビリティデータを統合的に保存・分析できます。全体のアーキテクチャは次のとおりです。

![Doris と OpenTelemetry の連携構成](/images/next/connection-integration/data-integration/opentelemetry/opentelemetry.jpg)

## 適用シナリオと連携手順 {#applicable-scenarios-and-integration-process}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose OpenTelemetry Collector configuration based on observability data type -->

データの種類に応じて、連携方法を選択できます。

| 利用シナリオ | 推奨設定 | 参照セクション |
| --- | --- | --- |
| Doris FE のログなど一般的な TEXT ログを収集し、Java のスタックトレースのような複数行のログを処理する | `filelog` レシーバー、`multiline`、`regex_parser` を使用し、複数行のログを結合して解析してから Doris に書き込む | [Doris FE の TEXT ログを収集する](#collect-doris-fe-text-logs) |
| 各行に単一の JSON オブジェクトを含む構造化ログを収集する | `filelog` レシーバーと `json_parser` で JSON 行ログを解析し、Doris に書き込む | [GitHub Events の JSON ログを収集する](#collect-github-events-json-logs) |
| アプリケーションのトレースデータを収集する | `otlp` レシーバーで OpenTelemetry Java Agent から送信されたデータを受信し、Doris Exporter を介して Doris に書き込む | [アプリケーションのトレースデータを収集する](#collect-application-trace-data) |
| Doris の書き込み先、テーブルの自動作成、パーティションの保持期間、Stream Load のパラメーターを設定する | Doris Exporter で `endpoint`、`database`、`table.*`、`create_schema`、`headers` などを設定する | [Doris Exporter を設定する](#configure-doris-exporter) |

OpenTelemetry Collector の Doris Exporter を使用して Doris と連携する基本的な手順は次のとおりです。

1. OpenTelemetry Collector Contrib をダウンロードして展開します。
2. Doris FE のアドレス、アカウント、書き込み先のデータベースとテーブル、Stream Load のパラメーターを含め、Doris Exporter を設定します。
3. データの種類に応じてレシーバー、プロセッサー、パイプラインを設定します。
4. Collector を起動し、ログ、トレース、またはメトリクスのデータを Doris に書き込みます。
5. Stream Load のレスポンスログと書き込み速度のログでインポート結果を確認します。

## OpenTelemetry Collector Contrib をインストールする {#install-opentelemetry-collector-contrib}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the OpenTelemetry Collector runtime environment that includes the Doris Exporter -->

[OpenTelemetry の公式リリースページ](https://github.com/open-telemetry/opentelemetry-collector-releases/releases)から OpenTelemetry Collector Contrib のインストールパッケージをダウンロードします。Contrib 版には Doris Exporter が含まれています。ダウンロード例を次に示します。

```bash
wget https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.132.2/otelcol-contrib_0.132.2_linux_amd64.tar.gz
```

ダウンロードしたパッケージを展開すると、実行ファイル `otelcol-contrib` が得られます。

## Doris Exporter を設定する {#configure-doris-exporter}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the OpenTelemetry Collector to write observability data into Doris -->

OpenTelemetry Collector の Doris Exporter は、[Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) の HTTP インターフェースを介してデータを書き込みます。主な設定項目は次のとおりです。

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `endpoint` | なし | Doris FE の HTTP アドレス。形式は `host:port` です（例: `127.0.0.1:8030`）。 |
| `mysql_endpoint` | なし | Doris FE の MySQL アドレス。形式は `host:port` です（例: `127.0.0.1:9030`）。 |
| `username` | なし | Doris のユーザー名。該当するデータベースとテーブルへの書き込み権限が必要です。 |
| `password` | なし | Doris ユーザーのパスワード。 |
| `database` | なし | 書き込み先の Doris データベース名。 |
| `table.logs` | `otel_logs` | ログデータの書き込み先となる Doris テーブル名。 |
| `table.traces` | `otel_traces` | トレースデータの書き込み先となる Doris テーブル名。 |
| `table.metrics` | `otel_metrics` | メトリクスデータの書き込み先となる Doris テーブル名。 |
| `create_schema` | `true` | Doris データベースとテーブルを自動作成するかどうか。 |
| `history_days` | `0` | 自動作成される Doris テーブルで履歴データを保持する日数。`0` は無期限の保持を意味します。 |
| `create_history_days` | `0` | 自動作成される Doris テーブルの初期パーティション日数。`0` はパーティションを作成しないことを意味します。 |
| `label_prefix` | `open_telemetry` | Doris Stream Load の Label のプレフィックス。最終的な Label の形式は `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}` です。 |
| `headers` | なし | Doris Stream Load の Headers パラメーター。YAML マップ形式で指定します。 |
| `log_progress_interval` | `10` | 書き込み速度をログに出力する間隔（秒）。`0` に設定すると、このログは無効になります。 |

その他の設定については、[OpenTelemetry Collector Contrib の Doris Exporter ドキュメント](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter)を参照してください。

## Doris FE の TEXT ログを収集する {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect general text logs and handle multi-line stacktraces -->

ここでは Doris FE のログを例に、TEXT ログを収集して Doris に書き込む方法を示します。

### ステップ 1: ログファイルを準備する {#step-1-prepare-the-log-file}

Doris FE のログファイルは通常、Doris のインストールディレクトリ内の `fe/log/fe.log` にあります。FE のログは一般的な Java プログラムのログで、タイムスタンプ、ログレベル、スレッド名、コード位置、ログ本文などのフィールドを含みます。通常のログに加え、スタックトレースを伴う例外ログも含まれます。スタックトレースは複数行にわたるため、収集時に元のログ行と対応するスタックトレースを単一のログエントリに結合する必要があります。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### ステップ 2: OpenTelemetry の設定を記述する {#step-2-write-the-opentelemetry-configuration}

ログ収集用の設定ファイル `opentelemetry_java_log.yml` は、主に次の三つの部分で構成されます。

| 設定部分 | 役割 |
| --- | --- |
| `receivers` | 元データを読み込みます。 |
| `processors` | データを変換し、バッチ処理します。 |
| `exporters` | データを Doris に出力します。 |

```yaml
# 1. receivers are responsible for reading raw data.
# filelog is a local receiver that can read log files from the local file system.
# multiline appends lines that do not start with a timestamp to the previous line, used to merge stacktraces with the main log.
receivers:
  filelog:
    include:
      - /path/to/fe.log
    start_at: beginning
    multiline:
      line_start_pattern: '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}' # Match the timestamp as the start of a new log
    operators:
      - type: regex_parser
        regex: '^(?P<time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<severity>INFO|WARN|ERROR) (?P<message>.*)'
        timestamp:
          parse_from: attributes.time
          layout: '%Y-%m-%d %H:%M:%S,%f'
        severity:
          parse_from: attributes.severity
          trace: TRACE
          debug: DEBUG
          info: INFO
          warn: WARN
          error: ERROR
          fatal: FATAL

# 2. processors are responsible for data transformation.
# The batch processor accumulates data into batches before sending.
processors:
  batch:
    send_batch_size: 100000 # Number of data entries per batch. It is recommended that the batch data size be between 100M and 1G.
    timeout: 10s

# 3. exporters are responsible for outputting data.
# The doris exporter writes to Doris through the Stream Load HTTP interface.
# The default Stream Load data format is JSON. Stream Load parses JSON fields and writes them to the corresponding fields in the Doris table.
exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    mysql_endpoint: localhost:9030 # FE MySQL address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # Whether to automatically create the schema. If set to false, the table must be created manually.
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load client timeout
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [doris]
```

### ステップ 3: OpenTelemetry Collector を実行する {#step-3-run-the-opentelemetry-collector}

```bash
./otelcol-contrib --config config/opentelemetry_java_log.yml
```

### ステップ 4: 書き込み結果を確認する {#step-4-view-the-write-results}

`log_response` が `true` の場合、各 Stream Load のリクエストパラメーターとレスポンス結果がログに出力されます。

```text
2025-08-18T00:33:22.543+0800    info    dorisexporter@v0.132.0/exporter_logs.go:181    log response:
{
    "TxnId": 52,
    "Label": "open_telemetry_otel_otel_logs_20250818003321_498bb8ec-040c-4982-9eb4-452b15129782",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 50355,
    "NumberLoadedRows": 50355,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 31130235,
    "LoadTimeMs": 680,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 106,
    "WriteDataTimeMs": 653,
    "ReceiveDataTimeMs": 11,
    "CommitAndPublishTimeMs": 23
}
```

デフォルトでは、起動後のデータ量（MB と ROWS）、全体の速度（MB/s と R/s）、直近 10 秒間の速度を含む書き込み速度の情報が、10 秒ごとに出力されます。

```text
2025-08-18T00:05:00.017+0800    info    dorisexporter@v0.132.0/progress_reporter.go:63    [LOG] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## GitHub Events の JSON ログを収集する {#collect-github-events-json-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect structured logs with one JSON object per line -->

ここでは GitHub Events Archive のデータを例に、JSON ログを収集して Doris に書き込む方法を示します。

### ステップ 1: JSON データを準備する {#step-1-prepare-the-json-data}

GitHub Events Archive は、GitHub ユーザーの操作イベントを JSON 形式で保存したアーカイブデータで、[https://www.gharchive.org/](https://www.gharchive.org/) からダウンロードできます。次の例では、2024 年 1 月初日の 15:00 のデータをダウンロードします。

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

次に示すのはデータレコードの例です。実際のデータは各行に単一の JSON オブジェクトを含みますが、ここでは読みやすいように整形しています。

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

### ステップ 2: OpenTelemetry の設定を記述する {#step-2-write-the-opentelemetry-configuration-1}

TEXT ログの収集とは異なり、JSON ログの収集では `json_parser` を `filelog` レシーバー内で使用します。`json_parser` はテキストの各行を JSON として解析し、解析したフィールドを後続の処理で使用します。

```yaml
receivers:
  filelog:
    include:
      - /path/to/2024-01-01-15.json
    start_at: beginning
    operators:
      - type: json_parser
        timestamp:
          parse_from: attributes.created_at
          layout: '%Y-%m-%dT%H:%M:%SZ'

processors:
  batch:
    send_batch_size: 100000 # Number of data entries per batch. It is recommended that the batch data size be between 100M and 1G.
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    mysql_endpoint: localhost:9030 # FE MySQL address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      logs: otel_logs
    create_schema: true # Whether to automatically create the schema. If set to false, the table must be created manually.
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load client timeout
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    logs:
      receivers: [filelog]
      processors: [batch]
      exporters: [doris]
```

### ステップ 3: OpenTelemetry Collector を実行する {#step-3-run-the-opentelemetry-collector-1}

```bash
./otelcol-contrib --config config/opentelemetry_json_log.yml
```

## アプリケーションのトレースデータを収集する {#collect-application-trace-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use the OpenTelemetry Java Agent to collect application traces and write them into Doris -->

ここでは、アプリケーション側から OTLP プロトコルで送信されたトレースデータを受信し、Doris に書き込む方法を示します。

### ステップ 1: OpenTelemetry の設定を記述する {#step-1-write-the-opentelemetry-configuration}

設定ファイル `otel_trace.yaml` を作成します。

```yaml
receivers:
  otlp: # OTLP protocol, receives data sent by the OpenTelemetry Java Agent
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

processors:
  batch:
    send_batch_size: 100000 # Number of data entries per batch. It is recommended that the batch data size be between 100M and 1G.
    timeout: 10s

exporters:
  doris:
    endpoint: http://localhost:8030 # FE HTTP address
    database: doris_db_name
    username: doris_username
    password: doris_password
    table:
      traces: doris_table_name
    create_schema: true # Whether to automatically create the schema. If set to false, the table must be created manually.
    mysql_endpoint: localhost:9030 # FE MySQL address
    history_days: 10
    create_history_days: 10
    timezone: Asia/Shanghai
    timeout: 60s # HTTP Stream Load client timeout
    log_response: true
    sending_queue:
      enabled: true
      num_consumers: 20
      queue_size: 1000
    retry_on_failure:
      enabled: true
      initial_interval: 5s
      max_interval: 30s
    headers:
      load_to_single_tablet: "true"

service:
  pipelines:
    traces:
      receivers: [otlp]
      processors: [batch]
      exporters: [doris]
```

### ステップ 2: OpenTelemetry Collector を実行する {#step-2-run-the-opentelemetry-collector}

```bash
./otelcol-contrib --config otel_trace.yaml
```

### ステップ 3: アプリケーション側に OpenTelemetry SDK を導入する {#step-3-integrate-the-opentelemetry-sdk-on-the-application-side}

次の例では、Spring Boot のサンプルアプリケーションを使用して OpenTelemetry Java SDK を導入します。このサンプルアプリケーションは公式の[デモ](https://docs.spring.io/spring-boot/tutorial/first-application/index.html)に基づくもので、文字列 `Hello World!` をパス `/` に対して返します。

[OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases) をダウンロードします。Java Agent を使用すると、既存のアプリケーションコードを変更する必要がありません。その他の言語や導入方法については、OpenTelemetry 公式サイトの[言語別の API と SDK](https://opentelemetry.io/docs/languages/)または[ゼロコード計装](https://opentelemetry.io/docs/zero-code/)を参照してください。

アプリケーションを起動する前に、次の環境変数を設定します。

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # Path to the OpenTelemetry Java Agent
export OTEL_JAVAAGENT_LOGGING="none" # Disable OTel logs to avoid interfering with the service's own logs
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # Use the OTLP protocol to send trace data
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # Address of the OpenTelemetry Collector

java -jar myproject-0.0.1-SNAPSHOT.jar
```
