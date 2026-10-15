---
{
    "title": "Vector",
    "language": "ja",
    "description": "Vector Doris Sink を使用し、ログ、メトリクス、トレースなどの可観測性データを Stream Load 経由で Apache Doris にリアルタイムで書き込む方法を、TEXT および JSON ログ収集の例とともに説明します。",
    "keywords": [
        "Vector",
        "Vector Doris Sink",
        "Apache Doris ログ収集",
        "Stream Load",
        "可観測性データパイプライン",
        "JSON ログ収集",
        "複数行ログ収集"
    ]
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Use Vector to write observability data such as logs, metrics, and traces into Apache Doris -->

[Vector](https://vector.dev/) は Rust で書かれた高性能な可観測性データパイプラインで、ログ、メトリクス、トレースデータの収集、変換、ルーティングに使用します。Doris エコシステムをより適切にサポートするため、Doris コミュニティは Vector 向けの **Doris Sink** コンポーネントを開発しました。このコンポーネントは、さまざまなソースのデータを [Stream Load](../../data-operate/import/import-way/stream-load-manual.md) 経由で Apache Doris に効率的に書き込み、分析に利用できるようにします。

### 適用シナリオ

Vector + Doris Sink は主に次のデータ取り込みシナリオに適しています。

- **アプリケーションログの収集**: アプリケーション、Web サーバー、データベースなどが出力する複数行または単一行のテキストログを、リアルタイムで Doris に書き込みます。
- **JSON 形式の構造化ログ**: GitHub Events や JSON 形式の Nginx アクセスログなど、NDJSON イベントストリームを収集します。
- **メトリクスとトレースデータ**: Prometheus や OpenTelemetry などのソースから取得した可観測性データを Doris に取り込み、分析します。
- **複数ソースのデータ集約**: Vector の Source と Transform の機能で異種データソースを変換し、結果を統一的に Doris に書き込みます。

### データパイプライン

一般的なデータフローは次のとおりです。

```text
Data source (Source) -> Vector Transform -> Doris Sink (Stream Load) -> Apache Doris
```

## インストールとデプロイ

### 方法 1: ビルド済みパッケージをダウンロードする

x86_64 Linux 環境に適しています。ダウンロード後にパッケージを展開して、そのまま使用できます。

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```

### 方法 2: ソースからビルドする

カスタムビルドが必要な場合や、x86_64 以外のプラットフォームに適しています。

```shell
cd ${VECTOR_HOME}

# Choose a target based on the deployment environment. The Makefile provides multiple target platform options.
make package-x86_64-unknown-linux-gnu
```

## クイックスタート

次の最小構成の例では、Doris Sink を使ってファイルの内容を Vector から Doris に書き込む方法を示します。

```toml
[sources.demo]
    type = "file"
    include = ["/path/to/input.json"]

[sinks.doris]
    type = "doris"
    inputs = ["demo"]
    endpoints = ["http://fe_ip:8030"]
    database = "log_db"
    table = "demo_table"

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"
```

Vector を起動します。

```shell
${VECTOR_HOME}/bin/vector --config vector_config.toml
```

## 例

### 例 1: TEXT の複数行ログ収集（Doris FE ログ）

この例では、Doris FE の Java アプリケーションログを収集する方法を示します。FE ログにはタイムスタンプ、ログレベル、スレッド名、コード位置、ログ内容などのフィールドがあり、複数行にわたる例外のスタックトレースが含まれることもよくあります。ログの先頭行とスタックトレースを単一のレコードにまとめる必要があります。

#### 1. サンプルデータ

FE ログは通常、Doris のインストールディレクトリ内の `fe/log/fe.log` にあります。

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

#### 2. Doris テーブルの作成

テーブルスキーマには、ログの生成時刻、収集時刻、ホスト名、ログファイルのパス、ログ種別、ログレベル、スレッド名、コード位置、ログ内容などのフィールドを含め、よく検索するフィールドに転置インデックスを設定します。

```sql
CREATE TABLE `doris_log` (
    `log_time`     datetime NULL COMMENT 'log content time',
    `collect_time` datetime NULL COMMENT 'log agent collect time',
    `host`         text     NULL COMMENT 'hostname or ip',
    `path`         text     NULL COMMENT 'log file path',
    `type`         text     NULL COMMENT 'log type',
    `level`        text     NULL COMMENT 'log level',
    `thread`       text     NULL COMMENT 'log thread',
    `position`     text     NULL COMMENT 'log code position',
    `message`      text     NULL COMMENT 'log message',
    INDEX idx_host     (`host`)     USING INVERTED,
    INDEX idx_path     (`path`)     USING INVERTED,
    INDEX idx_type     (`type`)     USING INVERTED,
    INDEX idx_level    (`level`)    USING INVERTED,
    INDEX idx_thread   (`thread`)   USING INVERTED,
    INDEX idx_position (`position`) USING INVERTED,
    INDEX idx_message  (`message`)  USING INVERTED PROPERTIES("parser" = "unicode", "support_phrase" = "true")
) ENGINE=OLAP
DUPLICATE KEY(`log_time`)
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

#### 3. Vector の設定

```toml
# ==================== Sources ====================
[sources.fe_log_input]
    type = "file"
    include = ["/path/fe/log/fe.log"]
    start_at_beginning = true
    max_line_bytes = 102400
    ignore_older_secs = 0
    fingerprint.strategy = "device_and_inode"

    # Multi-line log handling: lines that start with a timestamp are treated as a new log; other lines are merged into the previous line (handles stacktraces).
    multiline.start_pattern     = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
    multiline.mode              = "halt_before"
    multiline.condition_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
    multiline.timeout_ms        = 10000

# ==================== Transforms ====================
# Use VRL to parse log content
[transforms.parse_log]
    inputs = ["fe_log_input"]
    type = "remap"
    source = '''
        # Add the type field
        .type = "fe.log"

        # Add collect_time (use the Asia/Shanghai time zone, consistent with log_time)
        .collect_time = format_timestamp!(.timestamp, format: "%Y-%m-%d %H:%M:%S", timezone: "Asia/Shanghai")

        # Parse the log format: 2024-01-01 12:00:00,123 INFO (thread-name) [position] message
        # Use (?s) to enable DOTALL mode so that .* matches newlines (handles multi-line logs)
        parsed, err = parse_regex(.message, r'(?s)^(?P<log_time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>[A-Z]+) \((?P<thread>[^\)]+)\) \[(?P<position>[^\]]+)\] (?P<content>.*)')

        if err == null {
            .log_time = parsed.log_time
            .level    = parsed.level
            .thread   = parsed.thread
            .position = parsed.position
            # Keep the full original message (including multi-line stacktrace information)
        } else {
            # On parse failure, set default values to avoid NULL causing partition errors
            .log_time = .collect_time
            .level    = "UNKNOWN"
            .thread   = ""
            .position = ""
        }

        # Extract host and path (Vector adds these metadata automatically)
        .host = .host
        .path = .file
    '''

# ==================== Sinks ====================
[sinks.doris]
    inputs = ["parse_log"]
    type = "doris"
    endpoints = ["http://fe_ip:http_port"]
    database = "log_db"
    table = "doris_log"
    label_prefix = "vector_fe_log"
    log_request = true

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"

[sinks.doris.framing]
    method = "newline_delimited"

[sinks.doris.request]
    concurrency = 10

[sinks.doris.headers]
    format = "json"
    read_json_by_line = "true"
    load_to_single_tablet = "true"

[sinks.doris.batch]
    max_events = 10000
    timeout_secs = 3
    max_bytes = 100000000
```

#### 4. Vector の起動

```shell
${VECTOR_HOME}/bin/vector --config vector_fe_log.toml
```

`log_request = true` を設定すると、Vector は各 Stream Load リクエストのパラメータとレスポンスを出力するため、デバッグに役立ちます。

```text
2025-11-19T10:14:40.822071Z  INFO sink{component_kind="sink" component_id=doris component_type=doris}:request{request_id=82}: vector::sinks::doris::service: Doris stream load response received. status_code=200 OK stream_load_status=Successful response={
  "TxnId": 169721,
  "Label": "vector_fe_log_log_db_doris_log_1763547280791_e2e619ee-4067-4fe8-974e-9f35f0d4e48e",
  "Comment": "",
  "TwoPhaseCommit": "false",
  "Status": "Success",
  "Message": "OK",
  "NumberTotalRows": 10,
  "NumberLoadedRows": 10,
  "NumberFilteredRows": 0,
  "NumberUnselectedRows": 0,
  "LoadBytes": 7301,
  "LoadTimeMs": 30,
  "BeginTxnTimeMs": 0,
  "StreamLoadPutTimeMs": 1,
  "ReadDataTimeMs": 0,
  "WriteDataTimeMs": 8,
  "ReceiveDataTimeMs": 2,
  "CommitAndPublishTimeMs": 18
} internal_log_rate_limit=true
```

### 例 2: JSON ログの収集（GitHub Events）

この例では、[GitHub Events Archive](https://www.gharchive.org/) のデータをソースとして、NDJSON 形式の構造化ログを収集する方法を示します。

#### 1. サンプルデータ

GitHub Events Archive には、GitHub ユーザーの操作イベントが JSON 形式でアーカイブされています。たとえば、2024 年 1 月の初日、15:00 のデータをダウンロードします。

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

実際のデータでは、各行が完全な JSON オブジェクトです。次の例は読みやすいように整形しています。

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

#### 2. Doris テーブルの作成

`VARIANT` 型を使ってネストされた JSON オブジェクトを直接格納し、検索対象のフィールドに転置インデックスを作成します。

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id`         BIGINT,
    `type`       TEXT,
    `public`     BOOLEAN,
    `actor`      VARIANT,
    `repo`       VARIANT,
    `payload`    TEXT,
    INDEX `idx_id`      (`id`)      USING INVERTED,
    INDEX `idx_type`    (`type`)    USING INVERTED,
    INDEX `idx_actor`   (`actor`)   USING INVERTED,
    INDEX `idx_host`    (`repo`)    USING INVERTED,
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

#### 3. Vector の設定

```toml
# ==================== Sources ====================
[sources.github_events_reload]
    type = "file"
    include = ["/path/2024-01-01-15.json"]
    read_from = "beginning"
    ignore_checkpoints = true
    max_line_bytes = 10485760
    ignore_older_secs = 0
    line_delimiter = "\n"
    fingerprint.strategy = "device_and_inode"

# ==================== Transforms ====================
# Parse the JSON-formatted GitHub Events data. The VARIANT type can store nested objects directly.
[transforms.parse_json]
    inputs = ["github_events_reload"]
    type = "remap"
    source = '''
        # Parse the JSON data (each line is a complete JSON object)
        . = parse_json!(.message)

        # Convert the payload field to a JSON string (TEXT type)
        .payload = encode_json(.payload)

        # Keep only the fields required by the table
        . = {
            "created_at": .created_at,
            "id":         .id,
            "type":       .type,
            "public":     .public,
            "actor":      .actor,
            "repo":       .repo,
            "payload":    .payload
        }
    '''

# ==================== Sinks ====================
[sinks.doris]
    inputs = ["parse_json"]
    type = "doris"
    endpoints = ["http://fe_ip:http_port"]
    database = "log_db"
    table = "github_events"
    label_prefix = "vector_github_events"
    log_request = true

[sinks.doris.auth]
    strategy = "basic"
    user = "root"
    password = ""

[sinks.doris.encoding]
    codec = "json"

[sinks.doris.framing]
    method = "newline_delimited"

[sinks.doris.request]
    concurrency = 10

[sinks.doris.headers]
    format = "json"
    read_json_by_line = "true"
    load_to_single_tablet = "true"

[sinks.doris.batch]
    max_events = 10000
    timeout_secs = 3
    max_bytes = 100000000
```

#### 4. Vector の起動

```shell
vector --config vector_config.toml
```

## 設定パラメータ一覧

<!-- Knowledge type: Configuration parameters -->

Doris Sink は、さまざまなシナリオのデータ書き込み要件に対応する豊富な設定項目を備えています。以下では、設定項目を機能別に分類します。

### 基本設定

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `type` | string | - | `doris` に固定 |
| `inputs` | array | - | 上流データソース名の一覧 |
| `endpoints` | array\<string\> | - | Doris FE の HTTP/HTTPS アドレス。プロトコルとポートを含める必要があります。例: `["https://fe1:8030"]` |
| `database` | string / template | - | 書き込み先データベース名。[テンプレート](https://vector.dev/docs/reference/configuration/template-syntax/)を使用できます |
| `table` | string / template | - | 書き込み先テーブル名。テンプレートを使用できます |
| `label_prefix` | string | `"vector"` | Stream Load のラベル接頭辞。最終的なラベルの形式は `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` です |

### 認証設定

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `auth.strategy` | string | `"basic"` | 認証方式。現在 Doris がサポートするのは Basic Auth のみです |
| `auth.user` | string | - | Doris のユーザー名 |
| `auth.password` | string | - | Doris のパスワード。環境変数やシークレット管理システムと組み合わせて使用できます |

### リクエストと並行処理の設定

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `request.concurrency` | string / integer | `"adaptive"` | 並行処理の方式。`"adaptive"`、`"none"`（逐次処理）、または並行処理数の上限を示す正の整数を指定できます |
| `request.timeout_secs` | integer | `60` | 単一の Stream Load リクエストのタイムアウト（秒） |
| `request.rate_limit_duration_secs` | integer | `1` | レート制限の時間枠（秒） |
| `request.rate_limit_num` | integer | `i64::MAX` | 時間枠内で許可するリクエスト数。デフォルトは実質的に無制限です |
| `request.retry_attempts` | integer | `usize::MAX` | Tower ミドルウェアの最大リトライ回数。デフォルトは無制限です |
| `request.retry_initial_backoff_secs` | integer | `1` | 最初のリトライまでの待機時間（秒）。以降のリトライにはフィボナッチバックオフを使用します |
| `request.retry_max_duration_secs` | integer | `30` | 単一のリトライにおけるバックオフの最大待機時間（秒） |
| `request.retry_jitter_mode` | string | `"full"` | リトライ時のジッター方式。`full` または `none` を指定できます |

#### 適応的な並行処理

`request.concurrency = "adaptive"` の場合にのみ有効です。

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `request.adaptive_concurrency.initial_concurrency` | integer | `1` | 適応的な並行処理の初期値 |
| `request.adaptive_concurrency.max_concurrency_limit` | integer | `200` | 過負荷を防ぐための並行処理数の上限 |
| `request.adaptive_concurrency.decrease_ratio` | float | `0.9` | 処理速度の低下を検知したときに適用する減少率 |
| `request.adaptive_concurrency.ewma_alpha` | float | `0.4` | RTT 指標に対する指数移動平均の重み |
| `request.adaptive_concurrency.rtt_deviation_scale` | float | `2.5` | 通常の変動を無視するための RTT 偏差の倍率 |

### エンコーディングとデータ形式

Doris Sink は `encoding` セクションでイベントのシリアライズを制御します。デフォルトの出力は NDJSON（改行区切り JSON）です。

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `encoding.codec` | string | `"json"` | シリアライズのエンコーディング。`json`、`text`、`csv` などを指定できます |
| `encoding.timestamp_format` | string | - | タイムスタンプの出力形式。`rfc3339`、`unix` などに対応します |
| `encoding.only_fields` / `encoding.except_fields` | array\<string\> | - | フィールドの許可リストまたは拒否リストを制御します |
| `encoding.framing.method` | string | 自動推定 | `newline_delimited` や `character_delimited` などのカスタムフレーミング形式 |

#### Stream Load ヘッダー（`headers`）

`headers` はキーと値のマップで、Doris Stream Load リクエストの HTTP ヘッダーとしてそのまま渡されます。Stream Load がサポートするすべてのヘッダーパラメータを指定できます（値はすべて文字列にする必要があります）。一般的な設定は次のとおりです。

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `headers.format` | string | `"json"` | データ形式。`json`、`csv`、`parquet` などに対応します |
| `headers.read_json_by_line` | string | `"true"` | JSON を行単位（NDJSON）で読み込むかどうか |
| `headers.strip_outer_array` | string | `"false"` | 最外側の配列を取り除くかどうか |
| `headers.column_separator` | string | - | CSV の列区切り文字（`format = csv` の場合に有効） |
| `headers.columns` | string | - | CSV/JSON マッピングの列順。例: `timestamp,client_ip,status_code` |
| `headers.where` | string | - | Stream Load の `where` フィルター条件 |

### バッチ設定

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `batch.max_bytes` | integer | `10485760` | バッチあたりの最大バイト数（10 MB） |
| `batch.max_events` | integer / `null` | `null` | バッチあたりの最大イベント数。デフォルトでは無制限で、バイト数に基づいてバッチ化します |
| `batch.timeout_secs` | float | `1` | バッチの最大待機時間（秒） |

### 信頼性とセキュリティの設定

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `max_retries` | integer | `-1` | Sink レベルの最大リトライ回数。`-1` は無制限を意味します |
| `log_request` | boolean | `false` | 各 Stream Load リクエストとレスポンスを出力するかどうか（本番環境では必要に応じて有効にします） |
| `compression` | - | 非対応 | - |
| `distribution.retry_initial_backoff_secs` | integer | `1` | エンドポイントのヘルスチェック復旧時の初期バックオフ時間（秒） |
| `distribution.retry_max_duration_secs` | integer | `3600` | ヘルスチェックの最大バックオフ時間（秒） |
| `tls.verify_certificate` | boolean | `true` | 接続先証明書の検証を有効または無効にします |
| `tls.verify_hostname` | boolean | `true` | ホスト名の検証を有効または無効にします |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name` | various | - | カスタム CA、相互認証、SNI に使用する標準の Vector TLS クライアント設定項目 |
| `acknowledgements.enabled` | boolean | `false` | エンドツーエンドの確認応答を有効にします。確認応答をサポートする Source と組み合わせて使用します |

## ベストプラクティス

- **バッチサイズ**: スループットが高いログ処理では、`batch.max_bytes` を約 100 MB に設定し、`batch.timeout_secs` も適宜増やして Stream Load リクエスト数を減らします。
- **並行処理の方式**: 上流のトラフィックが安定している場合は、`request.concurrency` に固定の整数を明示的に指定します。トラフィックの変動が大きい場合は、`"adaptive"` を使って Vector に並行度を自動調整させます。
- **単一タブレットへの書き込み**: 大きなバッチで多数の小さなファイルを書き込む場合は、`load_to_single_tablet = "true"` を `headers` に設定して BE 側のリソース負荷を減らします。
- **動的パーティションと時系列コンパクション**: ログテーブルで `dynamic_partition` を有効にし、`compaction_policy = "time_series"` を設定すると、ストレージとマージ処理の負荷を大幅に減らせます。
- **本番環境でのデバッグ**: ログ量の増大を避けるため、通常は `log_request` を無効のままにし、問題の調査時にのみ有効にします。
- **TLS と認証**: `tls.*` 設定で HTTPS の検証を有効にします。認証情報を平文で保存しないように、`auth.password` は環境変数またはシークレット管理システムから注入します。
