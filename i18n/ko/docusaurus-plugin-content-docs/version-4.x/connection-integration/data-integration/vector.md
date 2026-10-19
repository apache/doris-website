---
{
    "title": "Vector",
    "language": "ko",
    "description": "Vector Doris Sink를 사용하여 로그, 메트릭, 트레이스와 같은 관측성 데이터를 Stream Load를 통해 실시간으로 Apache Doris에 기록하는 방법을 TEXT 및 JSON 로그 수집 예제와 함께 소개합니다.",
    "keywords": [
        "Vector",
        "Vector Doris Sink",
        "Apache Doris 로그 수집",
        "Stream Load",
        "관측성 데이터 파이프라인",
        "JSON 로그 수집",
        "여러 줄 로그 수집"
    ]
}
---

<!-- Knowledge type: Operational steps / Configuration parameters -->
<!-- Applicable scenario: Use Vector to write observability data such as logs, metrics, and traces into Apache Doris -->

[Vector](https://vector.dev/)는 Rust로 작성된 고성능 관측성 데이터 파이프라인으로, 로그, 메트릭, 트레이스 데이터를 수집, 변환, 라우팅하도록 설계되었습니다. Doris 생태계를 더 잘 지원하기 위해 Doris 커뮤니티는 Vector용 **Doris Sink** 컴포넌트를 개발했습니다. 이 컴포넌트는 분석 처리를 위해 다양한 소스의 데이터를 [Stream Load](../../data-operate/import/import-way/stream-load-manual.md)를 통해 Apache Doris에 효율적으로 기록합니다.

### 적용 시나리오 {#applicable-scenarios}

Vector + Doris Sink는 주로 다음과 같은 데이터 수집 시나리오에 사용됩니다:

- **애플리케이션 로그 수집**: 애플리케이션, 웹 서버, 데이터베이스 등에서 생성되는 여러 줄 또는 한 줄 텍스트 로그를 Doris에 실시간으로 기록합니다.
- **JSON 구조화 로그**: GitHub Events나 JSON 형식의 Nginx 액세스 로그와 같은 NDJSON 이벤트 스트림을 수집합니다.
- **메트릭 및 트레이스 데이터**: Prometheus, OpenTelemetry 등의 소스에서 관측성 데이터를 Doris에 저장하여 분석합니다.
- **여러 소스의 데이터 통합**: Vector의 Source 및 Transform 기능을 사용하여 이기종 데이터 소스를 변환하고 결과를 일관된 형식으로 Doris에 기록합니다.

### 데이터 파이프라인 {#data-pipeline}

일반적인 데이터 흐름은 다음과 같습니다:

```text
Data source (Source) -> Vector Transform -> Doris Sink (Stream Load) -> Apache Doris
```

## 설치 및 배포 {#installation-and-deployment}

### 옵션 1: 사전 컴파일된 패키지 다운로드 {#option-1-download-the-pre-compiled-package}

x86_64 Linux 환경에 적합합니다. 다운로드한 패키지의 압축을 풀면 바로 사용할 수 있습니다:

```shell
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/vector-x86_64-unknown-linux-gnu.tar.gz
```

### 옵션 2: 소스에서 컴파일 {#option-2-compile-from-source}

사용자 지정 빌드가 필요하거나 x86_64 이외의 플랫폼을 사용하는 경우에 적합합니다:

```shell
cd ${VECTOR_HOME}

# Choose a target based on the deployment environment. The Makefile provides multiple target platform options.
make package-x86_64-unknown-linux-gnu
```

## 빠른 시작 {#quick-start}

다음 최소 구성 예제는 Vector에서 Doris Sink를 통해 파일 내용을 Doris에 기록하는 방법을 보여줍니다:

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

Vector를 시작합니다:

```shell
${VECTOR_HOME}/bin/vector --config vector_config.toml
```

## 예제 {#examples}

### 예제 1: TEXT 여러 줄 로그 수집(Doris FE 로그) {#example-1-text-multi-line-log-collection-doris-fe-logs}

이 예제는 Doris FE의 Java 애플리케이션 로그를 수집하는 방법을 보여줍니다. FE 로그에는 타임스탬프, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드가 포함되며, 여러 줄로 된 예외 스택 트레이스 정보도 자주 포함됩니다. 기본 로그 줄과 해당 스택 트레이스를 하나의 레코드로 병합해야 합니다.

#### 1. 샘플 데이터 {#1-sample-data}

FE 로그는 일반적으로 Doris 설치 디렉터리 아래의 `fe/log/fe.log`에 있습니다:

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

#### 2. Doris 테이블 생성 {#2-create-the-doris-table}

테이블 스키마에는 로그 생성 시각, 수집 시각, 호스트 이름, 로그 파일 경로, 로그 유형, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드가 포함되며, 자주 쿼리하는 필드에는 역색인을 생성합니다:

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

#### 3. Vector 구성 {#3-vector-configuration}

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

#### 4. Vector 시작 {#4-start-vector}

```shell
${VECTOR_HOME}/bin/vector --config vector_fe_log.toml
```

`log_request = true`인 경우 Vector는 모든 Stream Load 요청의 매개변수와 응답을 출력하므로 디버깅에 도움이 됩니다:

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

### 예제 2: JSON 로그 수집(GitHub Events) {#example-2-json-log-collection-github-events}

이 예제는 [GitHub Events Archive](https://www.gharchive.org/) 데이터를 소스로 사용하여 NDJSON 형식의 구조화 로그를 수집하는 방법을 보여줍니다.

#### 1. 샘플 데이터 {#1-sample-data-1}

GitHub Events Archive에는 GitHub 사용자의 활동 이벤트를 JSON 형식으로 아카이브한 데이터가 포함되어 있습니다. 예를 들어 2024년 첫 달의 1일 15:00 데이터를 다운로드합니다:

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

실제 데이터에서는 각 줄이 완전한 JSON 객체입니다. 아래 예제는 읽기 쉽도록 형식을 정리한 것입니다:

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

#### 2. Doris 테이블 생성 {#2-create-the-doris-table-1}

`VARIANT` 타입을 사용하여 중첩된 JSON 객체를 직접 저장하고, 쿼리 대상 필드에 역색인을 생성합니다:

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

#### 3. Vector 구성 {#3-vector-configuration-1}

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

#### 4. Vector 시작 {#4-start-vector-1}

```shell
vector --config vector_config.toml
```

## 구성 매개변수 참조 {#configuration-parameter-reference}

<!-- Knowledge type: Configuration parameters -->

Doris Sink는 다양한 시나리오의 데이터 기록 요구 사항을 충족하는 폭넓은 구성 옵션을 지원합니다. 아래에서는 구성 항목을 기능별로 분류했습니다.

### 기본 구성 {#basic-configuration}

| 매개변수      | 타입             | 기본값    | 설명                                                                                          |
| -------------- | ---------------- | ---------- | ---------------------------------------------------------------------------------------------------- |
| `type`         | string           | -          | `doris`로 고정                                                                                     |
| `inputs`       | array            | -          | 업스트림 데이터 소스 이름 목록                                                                   |
| `endpoints`    | array\<string\>  | -          | Doris FE HTTP/HTTPS 주소. 프로토콜과 포트를 포함해야 함. 예: `["https://fe1:8030"]` |
| `database`     | string / template | -         | 대상 데이터베이스 이름. [템플릿](https://vector.dev/docs/reference/configuration/template-syntax/) 지원 |
| `table`        | string / template | -         | 대상 테이블 이름. 템플릿 지원                                                                |
| `label_prefix` | string           | `"vector"` | Stream Load 레이블 접두사. 최종 레이블은 `{label_prefix}_{database}_{table}_{timestamp}_{uuid}` 형식 |

### 인증 구성 {#authentication-configuration}

| 매개변수       | 타입   | 기본값   | 설명                                                          |
| --------------- | ------ | --------- | -------------------------------------------------------------------- |
| `auth.strategy` | string | `"basic"` | 인증 전략. Doris는 현재 Basic Auth만 지원    |
| `auth.user`     | string | -         | Doris 사용자 이름                                                       |
| `auth.password` | string | -         | Doris 비밀번호. 환경 변수 또는 비밀 정보 관리 시스템과 함께 사용 가능 |

### 요청 및 동시성 구성 {#request-and-concurrency-configuration}

| 매개변수                             | 타입             | 기본값       | 설명                                                                          |
| ------------------------------------- | ---------------- | ------------- | ------------------------------------------------------------------------------------ |
| `request.concurrency`                 | string / integer | `"adaptive"`  | 동시성 전략. `"adaptive"`, `"none"`(직렬) 또는 양의 정수로 지정한 동시성 제한 지원 |
| `request.timeout_secs`                | integer          | `60`          | 단일 Stream Load 요청의 제한 시간(초)                                  |
| `request.rate_limit_duration_secs`    | integer          | `1`           | 요청 속도 제한의 시간 구간(초)                                                    |
| `request.rate_limit_num`              | integer          | `i64::MAX`    | 시간 구간당 허용되는 요청 수. 기본값은 사실상 무제한    |
| `request.retry_attempts`              | integer          | `usize::MAX`  | Tower 미들웨어의 최대 재시도 횟수. 기본값은 무제한 재시도를 의미 |
| `request.retry_initial_backoff_secs`  | integer          | `1`           | 첫 재시도 전 대기 시간(초). 이후 재시도에는 피보나치 백오프 적용 |
| `request.retry_max_duration_secs`     | integer          | `30`          | 단일 재시도 백오프의 최대 대기 시간(초)                              |
| `request.retry_jitter_mode`           | string           | `"full"`      | 재시도 지터 모드. `full` 또는 `none` 지원                                         |

#### 적응형 동시성 {#adaptive-concurrency}

`request.concurrency = "adaptive"`인 경우에만 적용됩니다.

| 매개변수                                             | 타입    | 기본값 | 설명                                |
| ----------------------------------------------------- | ------- | ------- | ------------------------------------------ |
| `request.adaptive_concurrency.initial_concurrency`    | integer | `1`     | 적응형 동시성의 초기값     |
| `request.adaptive_concurrency.max_concurrency_limit`  | integer | `200`   | 과부하를 방지하기 위한 적응형 동시성의 상한 |
| `request.adaptive_concurrency.decrease_ratio`         | float   | `0.9`   | 속도 감소가 트리거될 때 적용할 감소 비율 |
| `request.adaptive_concurrency.ewma_alpha`             | float   | `0.4`   | RTT 메트릭에 적용할 지수 이동 평균 가중치 |
| `request.adaptive_concurrency.rtt_deviation_scale`    | float   | `2.5`   | 일반적인 변동을 무시하는 데 사용하는 RTT 편차 배율 |

### 인코딩 및 데이터 형식 {#encoding-and-data-format}

Doris Sink는 `encoding` 섹션으로 이벤트 직렬화를 제어합니다. 기본 출력 형식은 NDJSON(줄바꿈으로 구분된 JSON)입니다:

| 매개변수                                         | 타입             | 기본값    | 설명                                                                  |
| ------------------------------------------------- | ---------------- | ---------- | ---------------------------------------------------------------------------- |
| `encoding.codec`                                  | string           | `"json"`   | 직렬화 인코딩. `json`, `text`, `csv` 등의 값 사용 가능 |
| `encoding.timestamp_format`                       | string           | -          | 타임스탬프 출력 형식. `rfc3339`, `unix` 등 지원              |
| `encoding.only_fields` / `encoding.except_fields` | array\<string\>  | -          | 필드 허용 목록 또는 차단 목록 제어                                     |
| `encoding.framing.method`                         | string           | 추론됨   | 사용자 지정 프레이밍 형식. 예: `newline_delimited` 또는 `character_delimited`  |

#### Stream Load 헤더 (`headers`) {#stream-load-headers-headers}

`headers`는 Doris Stream Load 요청의 HTTP 헤더로 그대로 전달되는 키-값 맵입니다. Stream Load에서 지원하는 모든 헤더 매개변수를 사용할 수 있습니다(모든 값은 문자열이어야 함). 일반적으로 사용하는 설정은 다음과 같습니다:

| 매개변수                      | 타입   | 기본값  | 설명                                                          |
| ------------------------------ | ------ | -------- | -------------------------------------------------------------------- |
| `headers.format`               | string | `"json"` | 데이터 형식. `json`, `csv`, `parquet` 등 지원           |
| `headers.read_json_by_line`    | string | `"true"` | JSON을 줄 단위로 읽을지 여부(NDJSON)                           |
| `headers.strip_outer_array`    | string | `"false"`| 가장 바깥쪽 배열을 제거할지 여부                                 |
| `headers.column_separator`     | string | -        | CSV 열 구분자(`format = csv`일 때 적용)                 |
| `headers.columns`              | string | -        | CSV/JSON 매핑에 사용할 열 순서. 예: `timestamp,client_ip,status_code` |
| `headers.where`                | string | -        | Stream Load의 `where` 필터 조건                                 |

### 배치 구성 {#batch-configuration}

| 매개변수             | 타입             | 기본값     | 설명                                                  |
| --------------------- | ---------------- | ----------- | ------------------------------------------------------------ |
| `batch.max_bytes`     | integer          | `10485760`  | 배치당 최대 바이트 수(10 MB)                              |
| `batch.max_events`    | integer / `null` | `null`      | 배치당 최대 이벤트 수. 기본값은 무제한이며, 바이트 수를 기준으로 배치 구성 |
| `batch.timeout_secs`  | float            | `1`         | 배치의 최대 대기 시간(초)                     |

### 안정성 및 보안 구성 {#reliability-and-security-configuration}

| 매개변수                                                                                                       | 타입     | 기본값       | 설명                                                                          |
| --------------------------------------------------------------------------------------------------------------- | -------- | ------------- | ------------------------------------------------------------------------------------ |
| `max_retries`                                                                                                   | integer  | `-1`          | Sink 수준의 최대 재시도 횟수. `-1`은 무제한을 의미                       |
| `log_request`                                                                                                   | boolean  | `false`       | 모든 Stream Load 요청과 응답을 출력할지 여부(운영 환경에서는 필요에 따라 활성화) |
| `compression`                                                                                                   | -        | 지원하지 않음 | -                                                                                    |
| `distribution.retry_initial_backoff_secs`                                                                       | integer  | `1`           | 엔드포인트 상태 확인 복구를 위한 초기 백오프 시간(초)                   |
| `distribution.retry_max_duration_secs`                                                                          | integer  | `3600`        | 상태 확인의 최대 백오프 시간(초)                                |
| `tls.verify_certificate`                                                                                        | boolean  | `true`        | 업스트림 인증서 검증 활성화 또는 비활성화                                    |
| `tls.verify_hostname`                                                                                           | boolean  | `true`        | 호스트 이름 검증 활성화 또는 비활성화                                                |
| `tls.ca_file` / `tls.crt_file` / `tls.key_file` / `tls.key_pass` / `tls.alpn_protocols` / `tls.server_name`     | 다양함  | -             | 사용자 지정 CA, 상호 인증 또는 SNI에 사용하는 표준 Vector TLS 클라이언트 구성 항목 |
| `acknowledgements.enabled`                                                                                      | boolean  | `false`       | 종단 간 확인 응답 활성화. 확인 응답을 지원하는 Sources와 함께 사용 |

## 모범 사례 {#best-practices}

- **배치 크기**: 처리량이 높은 로그 시나리오에서는 `batch.max_bytes`를 약 100 MB로 설정하고 `batch.timeout_secs`를 그에 맞게 늘려 Stream Load 요청 수를 줄입니다.
- **동시성 전략**: 업스트림 트래픽이 안정적인 경우 `request.concurrency`를 고정된 정수로 명시적으로 설정합니다. 트래픽 변동이 큰 경우에는 `"adaptive"`를 사용하여 Vector가 동시성을 자동으로 조정하도록 합니다.
- **단일 tablet 쓰기**: `load_to_single_tablet = "true"`를 `headers`에 설정하면 작은 파일을 대규모 배치로 많이 기록할 때 BE 측의 리소스 오버헤드를 줄일 수 있습니다.
- **동적 파티셔닝 + 시계열 컴팩션**: 로그 테이블에 `dynamic_partition`을 활성화하고 `compaction_policy = "time_series"`를 설정하면 스토리지 및 병합 오버헤드를 크게 줄일 수 있습니다.
- **운영 환경 디버깅**: 로그가 과도하게 늘어나지 않도록 `log_request`는 기본적으로 비활성화하고 문제를 해결할 때만 활성화합니다.
- **TLS 및 인증**: `tls.*` 구성으로 HTTPS 검증을 활성화합니다. 자격 증명을 평문으로 저장하지 않도록 `auth.password`를 환경 변수 또는 비밀 정보 관리 시스템을 통해 주입합니다.
