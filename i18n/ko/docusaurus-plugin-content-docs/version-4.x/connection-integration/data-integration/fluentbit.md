---
{
    "title": "Fluent Bit",
    "language": "ko",
    "description": "Fluent Bit Doris Output Plugin을 사용하여 Stream Load를 통해 TEXT 및 JSON 로그를 Apache Doris에 실시간으로 기록하는 방법을 소개합니다.",
    "keywords": [
        "Fluent Bit",
        "Doris Stream Load",
        "로그 수집",
        "Doris에 로그 기록",
        "Fluent Bit Doris Output Plugin"
    ]
}
---

<!-- Knowledge type: One-sentence definition -->
<!-- Applicable scenario: Use Fluent Bit to write logs into Apache Doris in real time -->

[Fluent Bit](https://fluentbit.io/)은 사용자 정의 출력 플러그인을 통해 스토리지 시스템에 데이터를 기록할 수 있는 고속 로그 처리 및 전달 도구입니다. Fluent Bit Doris Output Plugin은 Fluent Bit에서 Doris로 데이터를 기록하는 출력 플러그인입니다. [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 인터페이스를 호출하여 Doris에 데이터를 실시간으로 기록합니다.

주요 기능은 다음과 같습니다:

- 멀티스레드 동시 쓰기.
- Doris Stream Load 요청 실패 시 재시도.
- Stream Load 형식 및 매개변수 사용자 정의.
- 출력 쓰기 속도 통계.

## 적용 시나리오 및 시작 절차 {#applicable-scenarios-and-onboarding-flow}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choosing a log collection solution -->

로그 유형에 따라 적절한 연동 방식을 선택할 수 있습니다:

| 사용자 시나리오 | 권장 방식 | 이 문서의 예제 |
| --- | --- | --- |
| `stacktrace`가 포함된 TEXT 로그 수집 | `tail` 입력, 여러 줄 파서 및 로그 필드 파서를 사용하여 여러 줄 로그를 하나의 레코드로 병합한 후 Doris에 기록 | [Doris FE TEXT 로그 수집](#collect-doris-fe-text-logs) |
| 한 줄로 된 JSON 이벤트 로그 수집 | `tail` 입력과 JSON Parser를 사용하여 JSON 레코드를 Doris에 직접 기록 | [JSON 로그 수집](#collect-json-logs) |

Fluent Bit Doris Output Plugin을 사용하여 Doris와 연동하는 기본 절차는 다음과 같습니다:

1. Doris Output Plugin이 포함된 Fluent Bit 바이너리를 다운로드하거나 컴파일합니다.
2. 로그 유형에 맞게 Fluent Bit 입력, 파서 및 Doris 출력 매개변수를 설정합니다.
3. Fluent Bit을 시작하여 Doris에 로그를 실시간으로 기록합니다.

## Fluent Bit Doris Output Plugin 설치(알파 버전) {#install-the-fluent-bit-doris-output-plugin-alpha-version}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Prepare the runtime environment for the Fluent Bit Doris Output Plugin -->

미리 컴파일된 바이너리를 직접 다운로드하거나 소스에서 빌드할 수 있습니다.

### 공식 사이트에서 다운로드 {#download-from-the-official-site}

[fluent-bit-doris-3.1.9](https://apache-doris-releases.oss-accelerate.aliyuncs.com/integrations/fluent-bit-doris-3.1.9)를 다운로드합니다.

### 소스에서 빌드 {#build-from-source}

`dev` 브랜치를 [fluent-bit](https://github.com/joker-star-l/fluent-bit) 저장소에서 복제한 다음, `build/` 디렉터리에서 다음 명령을 실행합니다:

```shell
cmake -DFLB_RELEASE=ON ..
make
```

빌드 산출물은 `build/bin/fluent-bit`입니다.

## Doris 출력 매개변수 설정 {#configure-doris-output-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure Fluent Bit to write to Doris -->

Fluent Bit Doris Output Plugin의 설정 항목은 다음과 같습니다:

| 설정 항목 | 설명 |
| --- | --- |
| `host` | Stream Load HTTP 호스트입니다. |
| `port` | Stream Load HTTP 포트입니다. |
| `user` | Doris 사용자 이름입니다. 이 사용자는 해당 데이터베이스와 테이블에 대한 데이터 적재 권한이 있어야 합니다. |
| `password` | Doris 사용자의 비밀번호입니다. |
| `database` | 데이터를 기록할 Doris 데이터베이스의 이름입니다. |
| `table` | 데이터를 기록할 Doris 테이블의 이름입니다. |
| `label_prefix` | Doris Stream Load Label 접두사입니다. 최종 생성되는 Label은 `{label_prefix}_{timestamp}_{uuid}`입니다. 기본값은 `fluentbit`입니다. `false`로 설정하면 Label을 추가하지 않습니다. |
| `time_key` | 데이터에 추가할 타임스탬프 열의 이름입니다. 기본값은 `date`입니다. `false`로 설정하면 이 열을 추가하지 않습니다. |
| `header` | Doris Stream Load의 헤더 매개변수입니다. 여러 값을 설정할 수 있습니다. |
| `log_request` | 문제 해결을 위해 Doris Stream Load 요청 및 응답 메타데이터를 로그에 출력할지 여부입니다. 기본값은 `true`입니다. |
| `log_progress_interval` | 로그에 쓰기 속도를 출력하는 시간 간격(초)입니다. 기본값은 `10`입니다. `0`으로 설정하면 이 로그가 비활성화됩니다. |
| `retry_limit` | Doris Stream Load 요청 실패 후 재시도하는 횟수입니다. 기본값은 `1`입니다. `false`로 설정하면 재시도 횟수가 무제한이 됩니다. |
| `workers` | Doris Stream Load를 실행하는 워커 수입니다. 기본값은 `2`입니다. |

## Doris FE TEXT 로그 수집 {#collect-doris-fe-text-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect multi-line Java logs and write them to Doris -->

이 시나리오에서는 Doris FE 로그를 예로 들어 TEXT 로그를 수집하는 방법을 설명합니다. `stacktrace`가 포함된 여러 줄 예외 로그는 먼저 기본 로그와 `stacktrace`를 하나의 레코드로 병합한 후 필드를 파싱하여 Doris에 기록해야 합니다.

### 1. 로그 샘플 준비 {#1-prepare-a-log-sample}

FE 로그 파일은 일반적으로 Doris 설치 디렉터리의 `fe/log/fe.log`에 있습니다. 타임스탬프, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드를 포함하는 전형적인 Java 프로그램 로그입니다. 로그에는 일반 항목과 `stacktrace`가 있는 예외 항목이 모두 포함됩니다. `stacktrace`는 여러 줄에 걸쳐 있으므로 로그 수집 시 기본 로그와 `stacktrace`를 하나의 로그 항목으로 합쳐야 합니다.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### 2. Doris 테이블 생성 {#2-create-a-doris-table}

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

### 3. Fluent Bit 설정 {#3-configure-fluent-bit}

이 시나리오에는 두 개의 설정 파일이 필요합니다:

| 설정 파일 | 용도 |
| --- | --- |
| `doris_log.conf` | Fluent Bit Service, 입력, 필터 및 Doris 출력을 정의합니다. |
| `parsers.conf` | 여러 줄 로그 파서와 FE 로그 필드 파서를 정의합니다. |

`doris_log.conf`:

```ini
# config for Fluent Bit service
[SERVICE]
    log_level info
    # parsers file
    parsers_file parsers.conf

# use input tail
[INPUT]
    name tail
    path /path/to/your/log
    # add log file name to the record, key is 'path'
    path_key path
    # set multiline parser
    multiline.parser multiline_java

# parse log
[FILTER]
    match *
    name parser
    key_name log
    parser fe_log
    reserve_data true

# add host info
[FILTER]
    name sysinfo
    match *
    # add hostname to the record, key is 'host'
    hostname_key host

# output to doris
[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    # add 'collect_time' to the record
    time_key collect_time
    # 'collect_time' is timestamp, change it to datatime
    header columns collect_time=from_unixtime(collect_time)
    log_request true
    log_progress_interval 10
```

`parsers.conf`:

```ini
[MULTILINE_PARSER]
    name          multiline_java
    type          regex
    flush_timeout 1000
    # Regex rules for multiline parsing
    # ---------------------------------
    #
    # configuration hints:
    #
    #  - first state always has the name: start_state
    #  - every field in the rule must be inside double quotes
    #
    # rules   |   state name   | regex pattern | next state name
    # --------|----------------|---------------|-----------------
    rule         "start_state"   "/(^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2})(.*)/"  "cont"
    rule         "cont"          "/(^(?![0-9]{4}-[0-9]{2}-[0-9]{2}))(.*)/"     "cont"


[PARSER]
    name        fe_log
    format      regex
    # parse and add 'log_time', 'level', 'thread', 'position', 'message' to the record
    regex       ^(?<log_time>[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}) (?<level>[^ ]+) \((?<thread>[^\)]+)\) \[(?<position>[^\]]+)\] (?<message>(\n|.)*)\n$
```

### 4. Fluent Bit 시작 및 쓰기 결과 확인 {#4-start-fluent-bit-and-check-the-write-results}

```shell
fluent-bit -c doris_log.conf
```

로그에 Stream Load 응답 메타데이터가 출력됩니다:

```text
[2024/10/31 18:39:55] [ info] [output:doris:doris.1] 127.0.0.1:8040, HTTP status=200
{
    "TxnId": 32155,
    "Label": "fluentbit_1730371195_91cca1aa-c15f-45d2-b503-fe7d2e839c2a",
    "Comment": "",
    "TwoPhaseCommit": "false",
    "Status": "Success",
    "Message": "OK",
    "NumberTotalRows": 1,
    "NumberLoadedRows": 1,
    "NumberFilteredRows": 0,
    "NumberUnselectedRows": 0,
    "LoadBytes": 836,
    "LoadTimeMs": 298,
    "BeginTxnTimeMs": 0,
    "StreamLoadPutTimeMs": 3,
    "ReadDataTimeMs": 0,
    "WriteDataTimeMs": 268,
    "CommitAndPublishTimeMs": 25
}
```

로그에는 쓰기 속도도 출력됩니다:

```text
[2024/10/31 18:40:13] [ info] [output:doris:doris.1] total 0 MB 2 ROWS, total speed 0 MB/s 0 R/s, last 10 seconds speed 0 MB/s 0 R/s
```

## JSON 로그 수집 {#collect-json-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Collect single-line JSON event logs and write them to Doris -->

이 시나리오에서는 GitHub Events Archive 데이터를 예로 들어 JSON 로그를 수집하는 방법을 설명합니다. TEXT 로그 수집과 달리 JSON 로그에는 처리 및 변환을 위한 추가 `FILTER`가 필요하지 않습니다.

### 1. 데이터 준비 {#1-prepare-data}

[GitHub Events Archive](https://www.gharchive.org/)는 GitHub 사용자 활동 이벤트를 JSON 형식으로 보관한 데이터입니다. 다음 예에서는 2024년 첫 달 1일 15:00의 데이터를 다운로드합니다:

```shell
wget https://data.gharchive.org/2024-01-01-15.json.gz
```

실제 데이터는 한 줄에 하나의 JSON 객체로 구성됩니다. 다음은 읽기 쉽게 서식을 적용한 데이터 샘플입니다:

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

### 2. Doris 테이블 생성 {#2-create-a-doris-table-1}

```sql
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

### 3. Fluent Bit 설정 {#3-configure-fluent-bit-1}

이 시나리오에는 두 개의 설정 파일이 필요합니다:

| 설정 파일 | 용도 |
| --- | --- |
| `github_events.conf` | Fluent Bit Service, 입력 및 Doris 출력을 정의합니다. |
| `github_parsers.conf` | JSON Parser를 정의합니다. |

`github_events.conf`:

```ini
[SERVICE]
    log_level info
    parsers_file github_parsers.conf

[INPUT]
    name tail
    parser github
    path /path/to/your/log

[OUTPUT]
    name doris
    match *
    host fehost
    port feport
    user your_username
    password your_password
    database your_db
    table your_table
    time_key false
    log_request true
    log_progress_interval 10
```

`github_parsers.conf`:

```ini
[PARSER]
    name github
    format json
```

### 4. Fluent Bit 시작 {#4-start-fluent-bit}

```shell
fluent-bit -c github_events.conf
```
