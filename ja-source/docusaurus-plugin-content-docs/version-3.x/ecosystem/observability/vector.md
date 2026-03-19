---
{
  "title": "VectorとDorisの統合",
  "language": "ja"
}
---
# VectorとDorisの統合

## Vectorについて

VectorはRustで書かれた高性能な可観測性データパイプラインで、ログ、メトリクス、トレースの収集、変換、ルーティングに特化して設計されています。Dorisエコシステムをより良くサポートするために、Vector専用のDoris Sinkコンポーネントを開発し、様々なデータソースからDorisへの効率的なデータ取り込みを可能にして分析に活用できるようにしました。

## インストール

### インストールパッケージのダウンロード

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```
### ソースからビルド

```shell
cd ${Vector_HOME}

## Choose the appropriate option based on your deployment environment. Multiple options are available in the Makefile.
make package-x86_64-unknown-linux-gnu
```
## 設定パラメータ

Doris Sinkは、さまざまなシナリオでのデータ書き込み要件を満たすため、幅広い設定オプションをサポートしています：

### 基本設定

| Parameter      | Type          | Default     | Description |
|---------------|-------------|----------|-----|
| `type`        | string      | -        | `doris` に固定 |
| `inputs`      | array       | -        | 上流のデータソース名のリスト |
| `endpoints`   | array\<string> | -     | Doris FE HTTP/HTTPSアドレス、プロトコルとポートを含む必要があります（例：`["https://fe1:8030"]`） |
| `database`    | string/template   | -        | ターゲットデータベース名、[Template](https://vector.dev/docs/reference/configuration/template-syntax/)をサポート |
| `table`       | string/template   | -        | ターゲットテーブル名、templateをサポート |
| `label_prefix` | string    | `"vector"` | Stream Loadラベルのプレフィックス、最終ラベル形式は `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` |

### 認証設定

| Parameter        | Type   | Default    | Description |
|-----------------|------|---------|-----|
| `auth.strategy` | string | `"basic"` | 認証戦略、DorisはBasic Authのみをサポート |
| `auth.user`     | string | -         | Dorisユーザー名 |
| `auth.password` | string | -         | Dorisパスワード、環境変数またはシークレット管理システムと併用可能 |

### リクエストと並行性設定

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `request.concurrency` | string/integer | `"adaptive"` | 並行性戦略を制御、`"adaptive"`、`"none"`（シリアル）、または並行性制限の正の整数をサポート |
| `request.timeout_secs` | integer | `60` | 単一Stream Loadリクエストのタイムアウト（秒） |
| `request.rate_limit_duration_secs` | integer | `1` | レート制限の時間窓（秒） |
| `request.rate_limit_num` | integer | `i64::MAX` | 時間窓あたりの許可リクエスト数、デフォルトは実質的に無制限 |
| `request.retry_attempts` | integer | `usize::MAX` | Towerミドルウェアの最大リトライ回数、デフォルトは無制限リトライ |
| `request.retry_initial_backoff_secs` | integer | `1` | 最初のリトライ前の待機時間（秒）、以降のリトライはFibonacciバックオフを使用 |
| `request.retry_max_duration_secs` | integer | `30` | 単一リトライバックオフの最大待機時間（秒） |
| `request.retry_jitter_mode` | string | `"full"` | リトライジッターモード、`full` または `none` をサポート |

**適応的並行性（`request.adaptive_concurrency`、`request.concurrency = "adaptive"` 時のみ有効）**

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `request.adaptive_concurrency.initial_concurrency` | integer | `1` | 適応的並行性の初期値 |
| `request.adaptive_concurrency.max_concurrency_limit` | integer | `200` | 過負荷を防ぐための適応的並行性の上限 |
| `request.adaptive_concurrency.decrease_ratio` | float | `0.9` | 減速が発生した際に使用される削減比率 |
| `request.adaptive_concurrency.ewma_alpha` | float | `0.4` | RTTメトリクスの指数移動平均重み |
| `request.adaptive_concurrency.rtt_deviation_scale` | float | `2.5` | RTT偏差の増幅因子、正常な変動を無視するために使用 |

### エンコーディングとデータフォーマット

Doris Sinkは`encoding`ブロックを使用してイベントのシリアル化動作を制御し、デフォルトでNDJSON（newline-delimited JSON）を使用します：

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `encoding.codec` | string | `"json"` | シリアル化エンコーディング、`json`、`text`、`csv`などのオプションがあります |
| `encoding.timestamp_format` | string | - | タイムスタンプ出力フォーマットを調整、`rfc3339`、`unix`などをサポート |
| `encoding.only_fields` / `encoding.except_fields` | array\<string> | - | フィールドのホワイトリストまたはブラックリストを制御 |
| `encoding.framing.method` | string | 自動推論 | カスタムフレーミング形式が必要な場合に設定、例：`newline_delimited`、`character_delimited` |

#### Stream Loadヘッダー（`headers`）

`headers`は、Doris Stream LoadのHTTPヘッダーとして直接渡されるキー・バリューペアのマッピングです。Stream Loadヘッダーで利用可能なすべてのパラメータを使用できます。
一般的な設定は以下の通りです（すべての値は文字列である必要があります）：

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `headers.format` | string | `"json"` | データフォーマット、`json`、`csv`、`parquet`などをサポート |
| `headers.read_json_by_line` | string | `"true"` | JSONを行単位で読み込むか（NDJSON） |
| `headers.strip_outer_array` | string | `"false"` | 最外層の配列を削除するか |
| `headers.column_separator` | string | - | CSVカラム区切り文字（`format = csv` 時に有効） |
| `headers.columns` | string | - | CSV/JSONマッピングのカラム順序、例：`timestamp,client_ip,status_code` |
| `headers.where` | string | - | Stream Load `where` フィルター条件 |

### バッチ設定

| Parameter | Type | Default | Description |
|--------|------|------|-----|
| `batch.max_bytes` | integer | `10485760` | バッチあたりの最大バイト数（10 MB） |
| `batch.max_events` | integer/`null` | `null` | バッチあたりの最大イベント数、デフォルトは無制限、主にバイト数で制御 |
| `batch.timeout_secs` | float | `1` | バッチの最大待機時間（秒） |

### 信頼性とセキュリティ設定

| Parameter | Type      | Default     | Description                                         |
|--------|---------|---------|--------------------------------------------|
| `max_retries` | integer | `-1`    | Sinkレベルの最大リトライ回数、`-1`は無制限                  |
| `log_request` | boolean | `false` | 各Stream Loadリクエストとレスポンスを出力するか（本番環境では必要に応じて有効化）       |
| `compression` | -       | `未サポート`   | -                                          |
| `distribution.retry_initial_backoff_secs` | integer | `1`     | エンドポイントヘルスチェック回復の初期バックオフ時間（秒）                         |
| `distribution.retry_max_duration_secs` | integer | `3600`  | 最大ヘルスチェックバックオフ時間（秒）                              |
| `tls.verify_certificate` | boolean | `true`  | 上流の証明書検証を有効/無効にする                                |
| `tls.verify_hostname` | boolean | `true`  | ホスト名検証を有効/無効にする                                 |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name` | various      | -       | カスタムCA、相互認証、またはSNI用の標準VectorTLSクライアント設定オプション    |
| `acknowledgements.enabled` | boolean | `false` | acknowledgementをサポートするSourcesと併用するためのエンドツーエンドacknowledgementを有効にする |

## 使用例

### TEXTログ収集例

この例では、Doris FEログを例にしてTEXTログ収集を実演します。

**1. データ**

FEログファイルは通常、Dorisインストールディレクトリのfe/log/fe.logに配置されています。これは、タイムスタンプ、ログレベル、スレッド名、コードポジション、ログメッセージなどのフィールドを含む典型的なJavaアプリケーションログです。通常のログに加えて、複数行にまたがるスタックトレースを持つ例外ログもあります。ログの収集と保存では、メインログとスタックトレースを単一のログエントリに結合する必要があります。

```
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```
**2. テーブル作成**

テーブル構造には、ログ生成時刻、収集時刻、ホスト名、ログファイルパス、ログタイプ、ログレベル、スレッド名、コード位置、およびログメッセージのフィールドが含まれます。

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
**3. ベクター設定**

```toml
# ==================== Sources ====================
[sources.fe_log_input]
  type = "file"
  include = ["/path/fe/log/fe.log"]
  start_at_beginning = true
  max_line_bytes = 102400
  ignore_older_secs = 0
  fingerprint.strategy = "device_and_inode"
  
  # Multi-line log handling - corresponds to Logstash's multiline codec
  # Lines starting with a timestamp are new logs, other lines are merged with the previous line (handling stack traces)
  multiline.start_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
  multiline.mode = "halt_before"
  multiline.condition_pattern = "^\\d{4}-\\d{2}-\\d{2} \\d{2}:\\d{2}:\\d{2},\\d{3}"
  multiline.timeout_ms = 10000

# ==================== Transforms ====================
# Use grok to parse log content
[transforms.parse_log]
  inputs = ["fe_log_input"]
  type = "remap"
  source = '''
    # Add type field (corresponds to Logstash's add_field)
    .type = "fe.log"
    
    # Add collect_time (corresponds to Logstash's @timestamp)
    # Use Asia/Shanghai timezone, consistent with log_time
    .collect_time = format_timestamp!(.timestamp, format: "%Y-%m-%d %H:%M:%S", timezone: "Asia/Shanghai")
    
    # Parse log format: 2024-01-01 12:00:00,123 INFO (thread-name) [position] message
    # Use (?s) to enable DOTALL mode, allowing .* to match newlines (handling multi-line logs)
    parsed, err = parse_regex(.message, r'(?s)^(?P<log_time>\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2},\d{3}) (?P<level>[A-Z]+) \((?P<thread>[^\)]+)\) \[(?P<position>[^\]]+)\] (?P<content>.*)')
    
    # Extract parsed fields
    if err == null {
      .log_time = parsed.log_time
      .level = parsed.level
      .thread = parsed.thread
      .position = parsed.position
      # Keep the complete original message (including multi-line stack traces)
    } else {
      # If parsing fails, set default values to avoid NULL (avoid partition errors)
      .log_time = .collect_time
      .level = "UNKNOWN"
      .thread = ""
      .position = ""
    }
    
    # Extract host and path (Vector automatically adds these metadata)
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
  user = "root"
  password = ""
  strategy = "basic"

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
**4. Vectorの実行**

```

${VECTOR_HOME}/bin/vector --config vector_fe_log.toml

# When log_request is true, the log will output the request parameters and response results of each Stream Load
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
### JSON ログ収集の例

この例では、GitHubイベントアーカイブデータを使用したJSONログ収集を実演します。

**1. データ**

GitHubイベントアーカイブには、GitHubユーザー操作イベントのアーカイブデータがJSON形式で含まれています。https://www.gharchive.org/ からダウンロードできます。例えば、2024年1月1日の15:00のデータをダウンロードします。

```
wget https://data.gharchive.org/2024-01-01-15.json.gz

```
以下はサンプルデータエントリです。実際のデータは1行につき1エントリです。ここでは表示目的でフォーマットが追加されています。

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
**2. Dorisテーブルの作成**

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
**3. Vectorの設定**

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
# Parse JSON format GitHub Events data, VARIANT type can directly store nested objects
[transforms.parse_json]
inputs = ["github_events_reload"]
type = "remap"
source = '''
    # Parse JSON data (each line is a complete JSON object)
    . = parse_json!(.message)
    
    # Convert payload field to JSON string (TEXT type)
    .payload = encode_json(.payload)
    
    # Keep only the fields needed for the table
    . = {
      "created_at": .created_at,
      "id": .id,
      "type": .type,
      "public": .public,
      "actor": .actor,
      "repo": .repo,
      "payload": .payload
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
user = "root"
password = ""
strategy = "basic"

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
#### Start Vector

次のコマンドを使用してVectorサービスを開始します：

```bash
vector --config vector_config.toml
```
