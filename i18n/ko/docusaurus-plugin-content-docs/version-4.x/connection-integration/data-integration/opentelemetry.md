---
{
    "title": "OpenTelemetry",
    "language": "ko",
    "description": "OpenTelemetry Collector Doris Exporter를 통해 로그, 트레이스, 메트릭을 Apache Doris에 기록하여 통합 관측 분석을 수행하는 방법을 소개합니다.",
    "keywords": [
        "OpenTelemetry Doris",
        "OpenTelemetry Collector",
        "Doris Exporter",
        "관측 데이터",
        "로그 수집",
        "트레이스 데이터"
    ]
}
---

<!-- Knowledge type: Operation guide / Configuration reference -->
<!-- Applicable scenario: Use OpenTelemetry to write logs, traces, and metrics into Apache Doris -->

OpenTelemetry(약칭 OTel)는 로그, 트레이스, 메트릭과 같은 관측 데이터를 모니터링하고 생성, 수집, 내보내는 데 사용하는 공급업체 중립적인 오픈 소스 관측 가능성 프레임워크입니다. OpenTelemetry는 관측 가능성에 관한 표준과 프로토콜을 정의합니다. 이러한 표준과 프로토콜은 관련 커뮤니티와 공급업체에서 널리 채택되어 점차 관측 가능성 분야의 사실상 표준으로 자리 잡고 있습니다.

OpenTelemetry는 다양한 프로그래밍 언어, 인프라, 런타임 환경에서 애플리케이션과 시스템을 모니터링할 수 있도록 프레임워크와 관측 데이터 수집 SDK를 제공합니다. Doris는 OpenTelemetry의 스토리지 백엔드로 사용하여 고성능, 저비용의 통합 관측 데이터 저장 및 분석 기능을 제공할 수 있습니다. 전체 아키텍처는 다음과 같습니다.

![Doris Opentelemetry 통합](/images/next/connection-integration/data-integration/opentelemetry/opentelemetry.jpg)

## 적용 시나리오 및 통합 절차 {#applicable-scenarios-and-integration-process}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose OpenTelemetry Collector configuration based on observability data type -->

데이터 유형에 따라 적절한 통합 방식을 선택할 수 있습니다.

| 사용자 시나리오 | 권장 구성 | 참고 섹션 |
| --- | --- | --- |
| Doris FE 로그와 같은 일반 TEXT 로그를 수집하고 Java 스택 트레이스와 같은 여러 줄 로그를 처리 | `filelog` 리시버, `multiline`, `regex_parser`를 사용하여 여러 줄 로그를 병합하고 파싱한 후 Doris에 기록 | [Doris FE TEXT 로그 수집](#collect-doris-fe-text-logs) |
| 각 줄에 JSON 객체가 하나씩 있는 구조화된 로그 수집 | `filelog` 리시버와 `json_parser`를 사용하여 각 줄의 JSON 로그를 파싱하고 Doris에 기록 | [GitHub Events JSON 로그 수집](#collect-github-events-json-logs) |
| 애플리케이션 트레이스 데이터 수집 | `otlp` 리시버를 사용하여 OpenTelemetry Java Agent가 전송한 데이터를 수신한 후 Doris Exporter를 통해 Doris에 기록 | [애플리케이션 트레이스 데이터 수집](#collect-application-trace-data) |
| Doris 쓰기 대상, 자동 테이블 생성, 파티션 보존, Stream Load 매개변수 구성 | Doris Exporter에서 `endpoint`, `database`, `table.*`, `create_schema`, `headers` 등의 매개변수 구성 | [Doris Exporter 구성](#configure-doris-exporter) |

OpenTelemetry Collector Doris Exporter를 사용하여 Doris와 통합하는 기본 절차는 다음과 같습니다.

1. OpenTelemetry Collector Contrib를 다운로드하고 압축을 풉니다.
2. Doris FE 주소, 계정, 대상 데이터베이스 및 테이블, Stream Load 매개변수 등을 포함하여 Doris Exporter를 구성합니다.
3. 데이터 유형에 따라 리시버, 프로세서, 파이프라인을 구성합니다.
4. Collector를 시작하고 로그, 트레이스 또는 메트릭 데이터를 Doris에 기록합니다.
5. Stream Load 응답 로그와 쓰기 속도 로그를 통해 데이터 적재 결과를 확인합니다.

## OpenTelemetry Collector Contrib 설치 {#install-opentelemetry-collector-contrib}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the OpenTelemetry Collector runtime environment that includes the Doris Exporter -->

[OpenTelemetry 공식 릴리스 페이지](https://github.com/open-telemetry/opentelemetry-collector-releases/releases)에서 OpenTelemetry Collector Contrib 설치 패키지를 다운로드합니다. Contrib 버전에는 Doris Exporter가 포함되어 있습니다. 예를 들면 다음과 같습니다.

```bash
wget https://github.com/open-telemetry/opentelemetry-collector-releases/releases/download/v0.132.2/otelcol-contrib_0.132.2_linux_amd64.tar.gz
```

다운로드한 후 설치 패키지의 압축을 풀면 `otelcol-contrib` 실행 파일을 얻을 수 있습니다.

## Doris Exporter 구성 {#configure-doris-exporter}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the OpenTelemetry Collector to write observability data into Doris -->

OpenTelemetry Collector Doris Exporter는 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 인터페이스를 통해 데이터를 기록합니다. 주요 구성 항목은 다음과 같습니다.

| 구성 항목 | 기본값 | 설명 |
| --- | --- | --- |
| `endpoint` | 없음 | Doris FE HTTP 주소입니다. 형식은 `host:port`이며, 예를 들면 `127.0.0.1:8030`입니다. |
| `mysql_endpoint` | 없음 | Doris FE MySQL 주소입니다. 형식은 `host:port`이며, 예를 들면 `127.0.0.1:9030`입니다. |
| `username` | 없음 | Doris 사용자 이름입니다. 해당 사용자는 대상 데이터베이스와 테이블에 대한 쓰기 권한이 있어야 합니다. |
| `password` | 없음 | Doris 사용자의 비밀번호입니다. |
| `database` | 없음 | 데이터를 기록할 Doris 데이터베이스 이름입니다. |
| `table.logs` | `otel_logs` | 로그 데이터를 기록할 Doris 테이블 이름입니다. |
| `table.traces` | `otel_traces` | 트레이스 데이터를 기록할 Doris 테이블 이름입니다. |
| `table.metrics` | `otel_metrics` | 메트릭 데이터를 기록할 Doris 테이블 이름입니다. |
| `create_schema` | `true` | Doris 데이터베이스와 테이블을 자동으로 생성할지 여부입니다. |
| `history_days` | `0` | 자동으로 생성되는 Doris 테이블에서 과거 데이터를 보존할 일수입니다. `0`은 영구 보존을 의미합니다. |
| `create_history_days` | `0` | 자동으로 생성되는 Doris 테이블의 초기 파티션 일수입니다. `0`은 파티션을 생성하지 않음을 의미합니다. |
| `label_prefix` | `open_telemetry` | Doris Stream Load Label 접두사입니다. 최종적으로 생성되는 Label 형식은 `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`입니다. |
| `headers` | 없음 | Doris Stream Load의 Headers 매개변수입니다. 구문 형식은 YAML 맵입니다. |
| `log_progress_interval` | `10` | 로그에 쓰기 속도를 출력하는 시간 간격이며, 단위는 초입니다. `0`으로 설정하면 이 로그를 비활성화합니다. |

더 자세한 구성은 [OpenTelemetry Collector Contrib Doris Exporter 문서](https://github.com/open-telemetry/opentelemetry-collector-contrib/tree/main/exporter/dorisexporter)를 참고하세요.

## Doris FE TEXT 로그 수집 {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect general text logs and handle multi-line stacktraces -->

이 시나리오에서는 Doris FE 로그를 예로 들어 TEXT 로그를 수집하고 Doris에 기록하는 방법을 설명합니다.

### 1단계: 로그 파일 준비 {#step-1-prepare-the-log-file}

Doris FE 로그 파일은 일반적으로 Doris 설치 디렉터리 아래의 `fe/log/fe.log`에 있습니다. FE 로그는 타임스탬프, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드를 포함하는 전형적인 Java 프로그램 로그입니다. 로그에는 일반 로그와 스택 트레이스가 포함된 예외 로그가 모두 있습니다. 스택 트레이스는 여러 줄에 걸쳐 있으므로, 수집 시 기본 로그와 해당 스택 트레이스를 하나의 로그 항목으로 병합해야 합니다.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2단계: OpenTelemetry 구성 작성 {#step-2-write-the-opentelemetry-configuration}

로그 수집 구성 파일 `opentelemetry_java_log.yml`은 주로 다음 세 부분으로 구성됩니다.

| 구성 부분 | 기능 |
| --- | --- |
| `receivers` | 원시 데이터를 읽습니다. |
| `processors` | 데이터를 변환하고 배치 처리합니다. |
| `exporters` | 데이터를 Doris로 출력합니다. |

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

### 3단계: OpenTelemetry Collector 실행 {#step-3-run-the-opentelemetry-collector}

```bash
./otelcol-contrib --config config/opentelemetry_java_log.yml
```

### 4단계: 쓰기 결과 확인 {#step-4-view-the-write-results}

`log_response`가 `true`이면 각 Stream Load의 요청 매개변수와 응답 결과가 로그에 출력됩니다.

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

기본적으로 쓰기 속도 정보는 10초마다 출력됩니다. 여기에는 시작 이후의 데이터양(MB 및 ROWS), 전체 속도(MB/s 및 R/s), 최근 10초 동안의 속도가 포함됩니다.

```text
2025-08-18T00:05:00.017+0800    info    dorisexporter@v0.132.0/progress_reporter.go:63    [LOG] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## GitHub Events JSON 로그 수집 {#collect-github-events-json-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect structured logs with one JSON object per line -->

이 시나리오에서는 GitHub Events Archive 데이터를 예로 들어 JSON 로그를 수집하고 Doris에 기록하는 방법을 설명합니다.

### 1단계: JSON 데이터 준비 {#step-1-prepare-the-json-data}

GitHub Events Archive는 GitHub 사용자 활동 이벤트를 JSON 형식으로 보관한 데이터이며, [https://www.gharchive.org/](https://www.gharchive.org/)에서 다운로드할 수 있습니다. 다음 예제는 2024년 일월 1일 15:00의 데이터를 다운로드합니다.

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

다음은 데이터 레코드의 예시입니다. 실제 데이터는 각 줄에 JSON 객체가 하나씩 있으며, 여기서는 읽기 쉽도록 형식을 정리했습니다.

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

### 2단계: OpenTelemetry 구성 작성 {#step-2-write-the-opentelemetry-configuration-1}

TEXT 로그 수집과 달리 JSON 로그 수집에서는 `json_parser`를 `filelog` 리시버에서 사용합니다. `json_parser`는 각 텍스트 줄을 JSON으로 파싱하며, 파싱된 필드는 이후 처리에 사용됩니다.

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

### 3단계: OpenTelemetry Collector 실행 {#step-3-run-the-opentelemetry-collector-1}

```bash
./otelcol-contrib --config config/opentelemetry_json_log.yml
```

## 애플리케이션 트레이스 데이터 수집 {#collect-application-trace-data}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use the OpenTelemetry Java Agent to collect application traces and write them into Doris -->

이 시나리오에서는 OTLP 프로토콜을 통해 애플리케이션 측에서 전송한 트레이스 데이터를 수신하고 Doris에 기록하는 방법을 설명합니다.

### 1단계: OpenTelemetry 구성 작성 {#step-1-write-the-opentelemetry-configuration}

`otel_trace.yaml` 구성 파일을 생성합니다.

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

### 2단계: OpenTelemetry Collector 실행 {#step-2-run-the-opentelemetry-collector}

```bash
./otelcol-contrib --config otel_trace.yaml
```

### 3단계: 애플리케이션 측에 OpenTelemetry SDK 통합 {#step-3-integrate-the-opentelemetry-sdk-on-the-application-side}

다음 예제에서는 Spring Boot 샘플 애플리케이션에 OpenTelemetry Java SDK를 통합합니다. 샘플 애플리케이션은 공식 [데모](https://docs.spring.io/spring-boot/tutorial/first-application/index.html)에서 가져온 것으로, 간단한 문자열 `Hello World!`를 `/` 경로에 대한 응답으로 반환합니다.

[OpenTelemetry Java Agent](https://github.com/open-telemetry/opentelemetry-java-instrumentation/releases)를 다운로드합니다. Java Agent를 사용하면 기존 애플리케이션 코드를 수정할 필요가 없다는 장점이 있습니다. 다른 언어 및 통합 방법은 OpenTelemetry 공식 웹사이트의 [언어별 API 및 SDK](https://opentelemetry.io/docs/languages/) 또는 [코드 수정 없는 계측](https://opentelemetry.io/docs/zero-code/)을 참고하세요.

애플리케이션을 시작하기 전에 다음 환경 변수를 추가합니다.

```bash
export JAVA_TOOL_OPTIONS="${JAVA_TOOL_OPTIONS} -javaagent:/your/path/to/opentelemetry-javaagent.jar" # Path to the OpenTelemetry Java Agent
export OTEL_JAVAAGENT_LOGGING="none" # Disable OTel logs to avoid interfering with the service's own logs
export OTEL_SERVICE_NAME="myproject"
export OTEL_TRACES_EXPORTER="otlp" # Use the OTLP protocol to send trace data
export OTEL_EXPORTER_OTLP_ENDPOINT="http://localhost:4317" # Address of the OpenTelemetry Collector

java -jar myproject-0.0.1-SNAPSHOT.jar
```
