---
{
    "title": "Beats",
    "language": "ko",
    "description": "Beats Doris 출력 플러그인을 사용하여 Filebeat 및 기타 Beats 구성 요소가 수집한 데이터를 Stream Load를 통해 실시간으로 Apache Doris에 쓰는 방법을 설명합니다."
}
---

[Beats](https://github.com/elastic/beats)는 사용자 지정 출력 플러그인을 통해 스토리지 시스템에 데이터를 쓸 수 있는 데이터 수집 에이전트입니다. Beats Doris 출력 플러그인은 Beats가 수집한 데이터를 Doris로 출력하는 플러그인입니다.

Filebeat 및 기타 Beats 구성 요소가 수집한 데이터를 실시간으로 Doris에 쓰려면 Beats Doris 출력 플러그인을 사용할 수 있습니다. 이 플러그인은 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 인터페이스를 호출하여 데이터를 쓰며, 멀티스레드 동시 처리, 실패 시 재시도, Stream Load 형식 및 매개변수 사용자 지정, 쓰기 속도 보고 등의 기능을 제공합니다.

Beats Doris 출력 플러그인은 다음 Beats 구성 요소를 지원합니다:

| Beats 구성 요소 | 설명 |
| --- | --- |
| [Filebeat](https://github.com/elastic/beats/tree/master/filebeat) | 로그 파일을 수집합니다 |
| [Metricbeat](https://github.com/elastic/beats/tree/master/metricbeat) | 메트릭 데이터를 수집합니다 |
| [Packetbeat](https://github.com/elastic/beats/tree/master/packetbeat) | 네트워크 데이터를 수집합니다 |
| [Winlogbeat](https://github.com/elastic/beats/tree/master/winlogbeat) | Windows 이벤트 로그를 수집합니다 |
| [Auditbeat](https://github.com/elastic/beats/tree/master/auditbeat) | 감사 데이터를 수집합니다 |
| [Heartbeat](https://github.com/elastic/beats/tree/master/heartbeat) | 가용성 프로브 데이터를 수집합니다 |

Beats Doris 출력 플러그인을 사용하는 과정은 일반적으로 세 단계로 이루어집니다:

1. Doris 출력 플러그인이 포함된 Beats 바이너리를 다운로드하거나 컴파일합니다.
2. Beats 구성 파일에서 Doris 출력 주소와 기타 매개변수를 구성합니다.
3. Beats를 시작하여 데이터를 실시간으로 Doris에 씁니다.

## 설치 {#installation}

Doris 출력 플러그인이 이미 포함된 Beats 바이너리를 다운로드하거나 소스에서 컴파일할 수 있습니다.

### 공식 사이트에서 다운로드 {#download-from-the-official-site}

[filebeat-doris-2.1.1](https://apache-doris-releases.oss-accelerate.aliyuncs.com/extension/filebeat-doris-2.1.1)을 다운로드합니다.

### 소스에서 컴파일 {#compile-from-source}

Doris 소스 코드의 `extension/beats/` 디렉터리에서 다음 명령을 실행합니다:

```bash
cd doris/extension/beats

go build -o filebeat-doris filebeat/filebeat.go
go build -o metricbeat-doris metricbeat/metricbeat.go
go build -o winlogbeat-doris winlogbeat/winlogbeat.go
go build -o packetbeat-doris packetbeat/packetbeat.go
go build -o auditbeat-doris auditbeat/auditbeat.go
go build -o heartbeat-doris heartbeat/heartbeat.go
```

## Doris 출력 구성 {#configure-the-doris-output}

Beats 구성 파일에서 `output.doris`를 통해 Doris 출력을 구성합니다. 주요 구성 항목은 다음과 같습니다:

| 구성 항목 | 기본값 | 설명 |
| --- | --- | --- |
| `fenodes` | 없음 | Stream Load HTTP 주소입니다. 형식은 문자열 배열이며, 하나 이상의 주소를 구성할 수 있습니다. 예: `["http://fe1:8030", "http://fe2:8030"]`. |
| `user` | 없음 | Doris 사용자 이름입니다. 이 사용자는 대상 데이터베이스와 테이블에 대한 데이터 적재 권한이 있어야 합니다. |
| `password` | 없음 | Doris 사용자의 비밀번호입니다. |
| `database` | 없음 | 데이터를 쓸 Doris 데이터베이스의 이름입니다. |
| `table` | 없음 | 데이터를 쓸 Doris 테이블의 이름입니다. |
| `label_prefix` | `beats` | Doris Stream Load Label의 접두사입니다. 최종 Label 형식은 `{label_prefix}_{db}_{table}_{yyyymmdd_hhmmss}_{uuid}`입니다. |
| `headers` | 없음 | Doris Stream Load의 headers 매개변수입니다. 구문은 YAML 맵입니다. |
| `codec_format_string` | 없음 | Doris Stream Load로 출력할 형식 문자열입니다. `%{[a][b]}`를 사용하여 입력의 `a.b` 필드를 참조합니다. |
| `bulk_max_size` | `100000` | Doris Stream Load의 배치 크기입니다. |
| `max_retries` | `-1` | Doris Stream Load 요청 실패 후 재시도 횟수입니다. `-1`은 무제한 재시도를 의미하며, 데이터 신뢰성을 보장하는 데 사용됩니다. |
| `log_request` | `true` | Doris Stream Load 요청 및 응답 메타데이터를 로그에 출력할지 여부이며, 문제 해결에 사용됩니다. |
| `log_progress_interval` | `10` | 로그에 쓰기 속도를 출력하는 시간 간격(초)입니다. `0`으로 설정하면 이 로그를 비활성화합니다. |

## 시나리오 1: TEXT 로그 수집 {#scenario-1-collecting-text-logs}

이 시나리오에서는 Doris FE 로그를 예로 들어 일반 텍스트 로그와 여러 줄에 걸친 스택 트레이스를 수집하여 Doris에 쓰는 방법을 설명합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data}

Doris FE 로그 파일은 일반적으로 Doris 설치 디렉터리 아래의 `fe/log/fe.log`에 있습니다. FE 로그는 타임스탬프, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드를 포함하는 일반적인 Java 프로그램 로그입니다. 로그에는 일반 로그 항목과 스택 트레이스가 있는 예외 항목이 모두 포함됩니다. 스택 트레이스는 여러 줄에 걸쳐 있으므로 수집 시 기본 로그 항목과 해당 스택 트레이스를 하나의 로그 항목으로 병합해야 합니다.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2단계: Doris 테이블 생성 {#step-2-create-a-doris-table}

테이블 스키마에는 로그 생성 시간, 수집 시간, 호스트 이름, 로그 파일 경로, 로그 유형, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드가 포함됩니다.

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

### 3단계: Filebeat 구성 {#step-3-configure-filebeat}

Filebeat 로그 수집 구성 파일(예: `filebeat_doris_log.yml`)은 YAML 형식을 사용하며, 다음과 같은 네 가지 주요 부분으로 구성됩니다:

1. `input`: 원시 로그 파일을 읽습니다.
2. `processors`: 로그 내용을 변환하고 파싱합니다.
3. `queue.mem`: Filebeat 내부 버퍼 큐를 구성합니다.
4. `output`: 데이터를 Doris로 출력합니다.

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

### 4단계: Filebeat 실행 {#step-4-run-filebeat}

다음 명령을 실행하여 Filebeat를 시작합니다:

```bash
./filebeat-doris -f config/filebeat_doris_log.yml
```

`log_request`가 `true`이면 각 Stream Load의 요청 매개변수와 응답 결과가 로그에 출력됩니다.

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

기본적으로 로그에는 10초마다 쓰기 속도 정보가 출력됩니다. 여기에는 시작 이후의 데이터 양(MB 및 ROWS 단위), 전체 속도(MB/s 및 R/s 단위), 최근 10초 동안의 속도가 포함됩니다.

```text
total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## 시나리오 2: JSON 로그 수집 {#scenario-2-collecting-json-logs}

이 시나리오에서는 GitHub Events Archive 데이터를 예로 들어 JSON 로그를 수집하여 Doris에 쓰는 방법을 설명합니다.

### 1단계: 데이터 준비 {#step-1-prepare-the-data-1}

GitHub Events Archive는 GitHub 사용자 활동 이벤트를 JSON 형식으로 보관한 데이터입니다. [GitHub Archive](https://www.gharchive.org/)에서 데이터를 다운로드할 수 있습니다. 예를 들어, 2024년 1월 첫날 15:00의 데이터를 다운로드하려면 다음 명령을 실행합니다:

```bash
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

다음은 레코드 예시입니다. 실제 데이터는 한 줄에 하나의 JSON 레코드로 구성되며, 여기서는 읽기 쉽도록 서식을 적용했습니다.

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

### 2단계: Doris 테이블 생성 {#step-2-create-a-doris-table-1}

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

### 3단계: Filebeat 구성 {#step-3-configure-filebeat-1}

TEXT 로그 수집 구성과 비교하면 JSON 시나리오는 다음 두 가지 점에서 다릅니다:

1. `processors`는 추가 변환이 필요하지 않으므로 사용하지 않습니다.
2. `codec_format_string`은 전체 `message`, 즉 원본 JSON 내용을 직접 출력합니다.

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

### 4단계: Filebeat 실행 {#step-4-run-filebeat-1}

다음 명령을 실행하여 Filebeat를 시작합니다:

```bash
./filebeat-doris -f config/filebeat_github_events.yml
```
