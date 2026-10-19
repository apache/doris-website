---
{
    "title": "LoongCollector",
    "language": "ko",
    "description": "LoongCollector Doris Flusher를 사용하여 Stream Load를 통해 TEXT 또는 JSON 로그를 Apache Doris에 실시간으로 기록합니다. 여러 줄 로그, 실패 시 재시도, 동시 데이터 적재를 지원합니다.",
    "keywords": [
        "LoongCollector",
        "iLogtail",
        "Doris Flusher",
        "Doris Stream Load",
        "로그 수집",
        "Doris에 로그 쓰기"
    ]
}
---

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use LoongCollector to write logs into Apache Doris in real time -->

[LoongCollector (iLogtail)](https://github.com/alibaba/loongcollector)는 Alibaba Cloud에서 시작된 오픈 소스 고성능 로그 수집 및 처리 프레임워크입니다. 버전 3.0 이전에는 Logtail/iLogtail이라는 이름을 사용했습니다. 사용자 정의 출력 플러그인을 통해 스토리지 시스템에 데이터를 기록할 수 있습니다. LoongCollector Doris Flusher는 Apache Doris에 데이터를 기록하기 위한 출력 플러그인으로, 로그 검색 및 분석을 위해 TEXT 또는 JSON 로그를 Doris에 실시간으로 적재하는 데 적합합니다.

Doris Flusher는 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 인터페이스를 호출하여 데이터를 실시간으로 기록하며, 다음 기능을 제공합니다.

- 멀티스레드 동시 쓰기.
- Doris Stream Load 요청 실패 시 재시도.
- Stream Load 형식 및 매개변수 사용자 정의.
- 쓰기 속도 통계 출력.

## 사용 사례 및 작업 흐름 {#use-cases-and-workflow}

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Choose a LoongCollector-based log collection method for writing into Doris -->

로그 형식에 따라 해당 예제를 선택할 수 있습니다.

| 사용자 시나리오 | 적용 대상 데이터 | 권장 문서 |
| --- | --- | --- |
| `stacktrace`가 포함된 Doris FE TEXT 로그 수집 | 하나의 비즈니스 로그 항목이 여러 줄에 걸칠 수 있는 TEXT 로그 | [Doris FE TEXT 로그 수집](#collect-doris-fe-text-logs) |
| 한 줄에 JSON 객체가 하나씩 있는 이벤트 로그 수집 | 각 줄을 필드로 바로 파싱할 수 있는 JSON 라인 로그 | [JSON 라인 로그 수집](#collect-json-line-logs) |

LoongCollector Doris Flusher를 사용하는 전체 작업 흐름은 다음과 같습니다.

1. LoongCollector를 설치합니다.
2. Doris에 대상 데이터베이스와 테이블을 생성합니다.
3. LoongCollector의 입력, 변환 및 Doris 출력 매개변수를 설정합니다.
4. LoongCollector를 시작하여 로그를 Doris에 실시간으로 기록합니다.

## LoongCollector 설치 {#install-loongcollector}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the LoongCollector runtime environment -->

미리 컴파일된 설치 패키지를 직접 다운로드하거나, 소스에서 LoongCollector를 빌드할 수 있습니다.

### 공식 사이트에서 다운로드 {#download-from-the-official-site}

미리 컴파일된 설치 패키지를 다운로드합니다.

```bash
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/loongcollector-linux-amd64.tar.gz
```

### 소스에서 빌드 {#build-from-source}

LoongCollector 저장소를 복제하고 빌드합니다.

```shell
# Clone the repository
git clone https://github.com/alibaba/loongcollector.git
cd loongcollector
git submodule update --init

# Build LoongCollector
make all
cd output
```

## Doris 출력 매개변수 설정 {#configure-doris-output-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the LoongCollector Doris Flusher to write into Doris -->

LoongCollector Doris Flusher 플러그인은 다음 설정 항목을 지원합니다.

| 설정 항목 | 설명 |
| --- | --- |
| `Addresses` | Stream Load HTTP 주소입니다. 하나 이상의 요소를 포함할 수 있는 문자열 배열 형식입니다. 각 요소는 `host:port` 형식이며, 예를 들면 `["http://fe1:8030", "http://fe2:8030"]`입니다. |
| `Database` | 데이터를 기록할 Doris 데이터베이스 이름입니다. |
| `Table` | 데이터를 기록할 Doris 테이블 이름입니다. |
| `Authentication.PlainText.Username` | Doris 사용자 이름입니다. 이 사용자는 해당 Doris 데이터베이스 및 테이블에 대한 데이터 적재 권한이 있어야 합니다. |
| `Authentication.PlainText.Password` | Doris 사용자의 비밀번호입니다. |
| `LoadProperties` | Doris Stream Load의 헤더 매개변수입니다. 맵 형식을 사용하며, 예를 들면 `LoadProperties: {"format": "json", "read_json_by_line": "true"}`입니다. |
| `LogProgressInterval` | 쓰기 속도를 로그에 기록하는 간격입니다. 단위는 초이며, 기본값은 `10`입니다. `0`으로 설정하면 이 로그를 비활성화합니다. |
| `GroupCommit` | group commit 모드입니다. 허용되는 값은 `sync`, `async` 또는 `off`입니다. 기본값은 `off`입니다. |
| `Concurrency` | 데이터를 동시에 전송하는 goroutine 수입니다. 기본값은 `1`(동기 모드)입니다. |
| `QueueCapacity` | 비동기 모드에서의 작업 큐 용량입니다. 기본값은 `1024`입니다. |
| `Convert.Protocol` | 데이터 변환 프로토콜입니다. 기본값은 `custom_single`입니다. |
| `Convert.Encoding` | 데이터 변환 인코딩입니다. 기본값은 `json`입니다. |
| `Convert.TagFieldsRename` | 태그의 필드 하나 이상의 이름을 변경합니다. |
| `Convert.ProtocolFieldsRename` | 프로토콜 필드의 이름을 변경합니다. 허용되는 프로토콜 필드 값은 `contents`, `tags`, `time`입니다. |

## Doris FE TEXT 로그 수집 {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java TEXT logs and write them into Doris -->

이 시나리오에서는 Doris FE 로그를 예로 들어 TEXT 로그를 수집하는 방법을 설명합니다. `stacktrace`가 포함된 여러 줄 예외 로그는 먼저 본문 로그와 `stacktrace`를 하나의 레코드로 합친 다음, 필드를 파싱하여 Doris에 기록해야 합니다.

### 1. 로그 샘플 준비 {#1-prepare-a-log-sample}

FE 로그 파일은 일반적으로 Doris 설치 디렉터리 아래의 `fe/log/fe.log`에 있습니다. FE 로그는 일반적인 Java 애플리케이션 로그로, 타임스탬프, 로그 레벨, 스레드 이름, 코드 위치, 로그 내용 등의 필드를 포함합니다. 로그에는 일반 항목과 `stacktrace`가 포함된 예외 항목이 모두 있습니다. `stacktrace`는 여러 줄에 걸쳐 있으므로, 수집하고 저장할 때 본문 로그와 `stacktrace`를 하나의 로그 항목으로 합쳐야 합니다.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Doris 테이블 생성 {#2-create-the-doris-table}

대상 테이블에는 로그 생성 시간, 수집 시간, 호스트 이름, 로그 파일 경로, 로그 유형, 로그 레벨, 스레드 이름, 코드 위치, 로그 내용 등의 필드가 포함됩니다.

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

### 3. LoongCollector 설정 {#3-configure-loongcollector}

LoongCollector 설정 파일은 크게 세 부분으로 구성됩니다.

1. `inputs`: 원시 데이터를 읽습니다.
2. `processors`: 로그 내용을 변환하고 파싱합니다.
3. `flushers`: 데이터를 Doris로 출력합니다.

설정 파일을 `conf/continuous_pipeline_config/local/` 디렉터리에 배치합니다. 예를 들어 `loongcollector_doris_log.yaml`을 생성합니다.

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

### 4. LoongCollector 시작 {#4-start-loongcollector}

LoongCollector를 시작합니다.

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```

기본적으로 쓰기 속도는 10초마다 로그에 기록됩니다. 여기에는 시작 이후의 데이터 양(MB 및 ROWS), 전체 속도(MB/s 및 R/s), 최근 10초 동안의 속도가 포함됩니다. 로그 예시는 다음과 같습니다.

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## JSON 라인 로그 수집 {#collect-json-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them into Doris -->

이 시나리오에서는 GitHub Events Archive의 데이터를 예로 들어 한 줄에 JSON 객체가 하나씩 있는 이벤트 로그를 수집하는 방법을 설명합니다.

### 1. JSON 데이터 준비 {#1-prepare-json-data}

[GitHub Events Archive](https://www.gharchive.org/)는 GitHub 사용자 활동 이벤트를 JSON 형식으로 보관한 데이터입니다. 2024년 새해 첫날인 1일 15:00의 데이터를 다운로드할 수 있습니다. 아래 설정 예제의 파일 경로는 압축을 해제한 JSON 파일을 가리켜야 합니다.

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

실제 데이터는 한 줄에 JSON 객체가 하나씩 있습니다. 아래 샘플은 읽기 쉽도록 형식을 정리한 것입니다.

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

### 2. Doris 테이블 생성 {#2-create-the-doris-table-1}

GitHub 이벤트 로그를 저장할 대상 데이터베이스와 테이블을 생성합니다.

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

### 3. LoongCollector 설정 {#3-configure-loongcollector-1}

이 설정과 TEXT 로그 수집 예제의 주요 차이점은 다음과 같습니다.

1. `input_file`은 JSON 파싱 모드를 사용하므로 LoongCollector가 각 텍스트 줄을 JSON으로 파싱합니다.
2. JSON 데이터에 이미 구조화된 필드가 포함되어 있으므로 복잡한 프로세서 플러그인이 필요하지 않습니다.

설정 파일을 `conf/continuous_pipeline_config/local/` 디렉터리에 배치합니다. 예를 들어 `loongcollector_doris_log.yaml`을 생성합니다.

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

### 4. LoongCollector 시작 {#4-start-loongcollector-1}

```bash
nohup ./loongcollector > stdout.log 2> stderr.log &
```
