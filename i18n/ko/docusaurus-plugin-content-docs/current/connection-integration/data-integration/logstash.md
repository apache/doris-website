---
{
    "title": "Logstash",
    "language": "ko",
    "description": "Logstash Doris 출력 플러그인을 사용하여 TEXT 또는 JSON 로그를 수집하고 Stream Load를 통해 Apache Doris에 실시간으로 기록합니다. 로그 ETL과 검색 분석에 적합합니다.",
    "keywords": [
        "Logstash",
        "Logstash Doris 출력 플러그인",
        "Doris Stream Load",
        "로그 수집",
        "로그 ETL"
    ]
}
---

# Logstash Doris 출력 플러그인 {#logstash-doris-output-plugin}

<!-- Knowledge type: Capability definition -->
<!-- Applicable scenario: Use Logstash to collect, preprocess, and write logs to Doris in real time -->

Logstash는 데이터를 수집하고 전처리하여 스토리지 시스템으로 전송하는 로그 ETL 프레임워크입니다. Logstash Doris 출력 플러그인은 Logstash에서 Apache Doris로 데이터를 기록할 때 사용하는 출력 플러그인입니다. 로그 검색과 분석을 위해 TEXT 또는 JSON 로그를 Doris에 실시간으로 적재하는 데 적합합니다.

이 플러그인은 [Doris Stream Load](../../data-operate/import/import-way/stream-load-manual) HTTP 인터페이스를 호출하여 데이터를 실시간으로 기록하며, 멀티스레드 동시 처리, 실패 시 재시도, Stream Load 형식 및 매개변수 사용자 지정, 쓰기 속도 로깅을 제공합니다.

## 사용 사례 및 워크플로 {#use-cases-and-workflow}

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Choose Logstash as the log collection method for writing to Doris -->

로그 형식에 따라 적합한 예제를 선택할 수 있습니다.

| 사용자 시나리오 | 적용 가능한 데이터 | 권장 참고 내용 |
| --- | --- | --- |
| 일반 텍스트 로그를 수집하고 Java 스택 트레이스와 같은 여러 줄 로그 처리 | 하나의 업무 로그 항목이 여러 줄에 걸쳐 있을 수 있는 TEXT 로그 | [TEXT 여러 줄 로그 수집](#collect-text-multi-line-logs) |
| 각 줄에 JSON 객체가 하나씩 있는 구조화된 로그 수집 | 각 줄을 필드로 직접 파싱할 수 있는 JSON 행 단위 로그 | [JSON 행 단위 로그 수집](#collect-json-line-logs) |

Logstash Doris 출력 플러그인을 사용하는 전체 워크플로는 다음과 같습니다.

1. Logstash Doris 출력 플러그인을 확보하고 설치합니다.
2. Doris에 대상 데이터베이스와 테이블을 생성합니다.
3. Logstash의 입력, 변환 및 Doris 출력 매개변수를 설정합니다.
4. Logstash를 시작하여 로그를 Doris에 실시간으로 기록합니다.
5. Stream Load 응답과 쓰기 속도 로그를 통해 데이터 적재 결과를 확인합니다.

## 플러그인 설치 {#install-the-plugin}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Deploy the Logstash Doris output plugin -->

### 플러그인 확보 {#obtain-the-plugin}

설치 패키지를 다운로드하거나 소스에서 빌드하여 Logstash Doris 출력 플러그인을 확보할 수 있습니다.

| 방법 | 적용 시나리오 | 작업 |
| --- | --- | --- |
| 공식 사이트에서 다운로드 | 종속성이 포함된 설치 패키지를 바로 확보해야 하는 경우 | `logstash-output-doris-1.2.0-java.gem` 다운로드 |
| 소스에서 빌드 | 플러그인 소스가 이미 있으며 직접 패키지를 빌드해야 하는 경우 | `gem build`를 `extension/logstash/` 디렉터리에서 실행 |

공식 사이트에서 다운로드:

```shell
# Installation package that includes dependencies
wget https://apache-doris-releases.oss-cn-beijing.aliyuncs.com/extension/logstash-output-doris-1.2.0-java.gem
```

소스에서 빌드:

```shell
cd extension/logstash/
gem build logstash-output-doris.gemspec
```

### 표준 설치 {#standard-installation}

`${LOGSTASH_HOME}`은 Logstash 설치 디렉터리입니다. `${LOGSTASH_HOME}/bin/logstash-plugin` 명령을 실행하여 플러그인을 설치합니다. 이때 `<plugin_file>.gem`을 실제 플러그인 패키지 파일 이름으로 바꿉니다.

```shell
${LOGSTASH_HOME}/bin/logstash-plugin install <plugin_file>.gem
```

설치가 성공하면 Logstash는 다음과 유사한 결과를 출력합니다.

```text
Validating logstash-output-doris-1.2.0.gem
Installing logstash-output-doris
Installation successful
```

표준 설치 모드에서는 플러그인이 의존하는 Ruby 모듈을 자동으로 설치합니다. 네트워크를 사용할 수 없으면 설치가 멈추거나 완료되지 않을 수 있습니다. 이 경우 종속성이 포함된 설치 패키지를 다운로드하여 오프라인으로 설치할 수 있습니다.

### 오프라인 설치 {#offline-installation}

오프라인으로 설치하려면 먼저 JAR 종속성 처리를 건너뛴 다음, 로컬 파일 시스템의 플러그인 설치 패키지를 사용합니다. 로컬 경로를 사용할 때는 Logstash의 요구 사항에 따라 `file://`로 패키지 위치를 지정합니다.

```shell
export JARS_SKIP="true"
${LOGSTASH_HOME}/bin/logstash-plugin install file:///path/to/<plugin_file>.gem
```

## 설정 매개변수 {#configuration-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Configure the Logstash Doris output plugin to write to Doris -->

Logstash Doris 출력 플러그인은 다음 설정 항목을 지원합니다.

| 설정 항목 | 설명 |
| --- | --- |
| `http_hosts` | Stream Load HTTP 주소입니다. 하나 이상의 요소를 포함할 수 있는 문자열 배열 형식입니다. 각 요소는 `host:port` 형식이며, 예를 들면 `["http://fe1:8030", "http://fe2:8030"]`입니다. |
| `user` | Doris 사용자 이름입니다. 이 사용자는 대상 Doris 데이터베이스와 테이블에 대한 데이터 적재 권한이 있어야 합니다. |
| `password` | Doris 사용자의 비밀번호입니다. |
| `db` | 데이터를 기록할 Doris 데이터베이스입니다. |
| `table` | 데이터를 기록할 Doris 테이블입니다. |
| `label_prefix` | Doris Stream Load Label의 접두사입니다. 최종 생성되는 Label은 `<label_prefix>_<db>_<table>_<yyyymmdd_hhmmss>_<uuid>` 형식입니다. 기본값은 `logstash`입니다. |
| `headers` | Doris Stream Load의 headers 매개변수입니다. 구문은 Ruby 맵 형식이며, 예를 들면 `headers => { "format" => "json" "read_json_by_line" => "true" }`입니다. |
| `mapping` | Logstash 필드와 Doris 테이블 필드 간의 매핑입니다. 사용 방법은 아래 예제를 참고하세요. |
| `message_only` | 특수한 형태의 `mapping`으로, Logstash의 `@message` 필드만 Doris로 출력합니다. 기본값은 `false`입니다. |
| `max_retries` | Doris Stream Load 요청이 실패한 후 재시도하는 횟수입니다. 기본값은 `-1`이며, 데이터 신뢰성을 보장하기 위해 무한히 재시도함을 의미합니다. |
| `log_request` | 문제 해결을 위해 Doris Stream Load 요청 및 응답 메타데이터를 로그에 출력할지 여부입니다. 기본값은 `false`입니다. |
| `log_speed_interval` | 쓰기 속도를 로그에 출력하는 간격으로, 단위는 초입니다. 기본값은 `10`입니다. 속도 로깅을 비활성화하려면 `0`으로 설정합니다. |

## TEXT 여러 줄 로그 수집 {#collect-text-multi-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect Java TEXT logs and write them to Doris -->

이 예제에서는 Doris FE 로그를 사용하여 TEXT 로그를 수집하고 Doris에 기록하는 방법을 설명합니다.

### 시나리오 설명 {#scenario-description}

FE 로그 파일은 일반적으로 Doris 설치 디렉터리 아래의 `fe/log/fe.log`에 있습니다. 이러한 Java 애플리케이션 로그에는 타임스탬프, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드가 포함됩니다.

FE 로그에는 한 줄로 된 항목과 스택 트레이스가 포함된 예외 로그가 모두 있습니다. 스택 트레이스는 여러 줄에 걸쳐 있으므로 수집 시 주 로그 항목과 스택 트레이스를 하나의 로그로 병합해야 합니다.

로그 샘플은 다음과 같습니다.

```text
2024-07-08 21:18:01,432 INFO (Statistics Job Appender|61) [StatisticsJobAppender.runAfterCatalogReady():70] Stats table not available, skip
2024-07-08 21:18:53,710 WARN (STATS_FETCH-0|208) [StmtExecutor.executeInternalQuery():3332] Failed to run internal SQL: OriginStatement{originStmt='SELECT * FROM __internal_schema.column_statistics WHERE part_id is NULL  ORDER BY update_time DESC LIMIT 500000', idx=0}
org.apache.doris.common.UserException: errCode = 2, detailMessage = tablet 10031 has no queryable replicas. err: replica 10032's backend 10008 does not exist or not alive
        at org.apache.doris.planner.OlapScanNode.addScanRangeLocations(OlapScanNode.java:931) ~[doris-fe.jar:1.2-SNAPSHOT]
        at org.apache.doris.planner.OlapScanNode.computeTabletInfo(OlapScanNode.java:1197) ~[doris-fe.jar:1.2-SNAPSHOT]
```

### Doris에 테이블 생성 {#create-the-table-in-doris}

대상 테이블에는 로그 생성 시간, 수집 시간, 호스트 이름, 로그 파일 경로, 로그 유형, 로그 수준, 스레드 이름, 코드 위치, 로그 내용 등의 필드가 포함됩니다.

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

### Logstash 설정 {#configure-logstash}

Logstash는 주로 두 가지 유형의 설정 파일을 사용합니다.

| 설정 파일 | 용도 |
| --- | --- |
| `config/logstash.yml` | Logstash 전역 설정 파일입니다. 배치 크기와 배치 지연을 설정하여 Doris에 대한 쓰기 성능을 개선할 수 있습니다. |
| `logstash_doris_log.conf` | 개별 로그 수집 작업의 설정 파일입니다. 일반적으로 `input`, `filter`, `output`의 세 섹션으로 구성됩니다. |

로그 항목당 평균 크기가 수백 바이트인 경우 배치 크기를 1,000,000행으로, 배치 지연을 10초로 설정합니다. 이러한 설정은 `config/logstash.yml`에서 지정할 수 있습니다.

```yaml
pipeline.batch.size: 1000000
pipeline.batch.delay: 10000
```

`logstash_doris_log.conf`에는 다음 세 섹션이 포함됩니다.

| 섹션 | 용도 | 이 예제의 주요 설정 |
| --- | --- | --- |
| `input` | 원시 데이터를 읽습니다. | `file` 입력으로 FE 로그를 읽고, `multiline` 코덱으로 타임스탬프로 시작하지 않는 줄을 이전 줄에 덧붙입니다. |
| `filter` | 데이터를 변환합니다. | `grok`을 사용하여 `log_time`, `level`, `thread`, `position`을 `message` 필드에서 추출합니다. |
| `output` | Doris로 출력합니다. | `doris` 출력으로 Stream Load를 통해 Doris에 데이터를 기록하고, `mapping`으로 필드를 매핑합니다. |

설정 예제는 다음과 같습니다.

```text
# 1. input: read FE logs and merge stacktraces using the multiline codec
input {
    file {
        path => "/mnt/disk2/xiaokang/opt/doris_master/fe/log/fe.log"
        add_field => {"type" => "fe.log"}
        codec => multiline {
            # valid line starts with timestamp
            pattern => "^%{TIMESTAMP_ISO8601} "
            # any line not starting with a timestamp should be merged with the previous line
            negate => true
            what => "previous"
        }
    }
}

# 2. filter: extract log fields from the message using grok
filter {
    grok {
        match => {
            # parse log_time, level, thread, position fields from message
            "message" => "%{TIMESTAMP_ISO8601:log_time} (?<level>[A-Z]+) \((?<thread>[^\[]*)\) \[(?<position>[^\]]*)\]"
        }
    }
}

# 3. output: write to Doris through Doris Stream Load
output {
    doris {
        http_hosts => ["http://localhost:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "doris_log"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "log_time" => "%{log_time}"
            "collect_time" => "%{@timestamp}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
            "type" => "%{type}"
            "level" => "%{level}"
            "thread" => "%{thread}"
            "position" => "%{position}"
            "message" => "%{message}"
        }
        log_request => true
    }
}
```

`output` 설정에서 `headers`는 Stream Load 데이터 형식을 JSON으로 지정하고, `mapping`은 Logstash 필드와 JSON 필드 간의 매핑을 지정합니다. `headers`에서 `"format" => "json"`으로 설정하므로 Stream Load는 JSON 필드를 자동으로 파싱하여 Doris 테이블의 해당 필드에 기록합니다.

### Logstash 실행 {#run-logstash}

다음 명령을 실행하여 Logstash를 시작합니다.

```shell
${LOGSTASH_HOME}/bin/logstash -f config/logstash_doris_log.conf
```

`log_request`가 `true`이면 각 Stream Load의 요청 매개변수와 응답 결과가 로그에 출력됩니다. 응답 예제는 다음과 같습니다.

```json
{
    "TxnId": 45464,
    "Label": "logstash_log_db_doris_log_20240708_223532_539_6c20a0d1-dcab-4b8e-9bc0-76b46a929bd1",
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

기본적으로 Logstash는 10초마다 쓰기 속도 정보를 로그에 출력합니다. 이 정보에는 시작 이후의 누적 데이터양(MB 및 ROWS), 전체 속도(MB/s 및 R/s), 최근 10초 동안의 속도가 포함됩니다.

```text
[2024-07-08T22:35:38,285][INFO ][logstash.outputs.doris   ][main] total 11 MB 18978 ROWS, total speed 0 MB/s 632 R/s, last 10 seconds speed 1 MB/s 1897 R/s
```

## JSON 행 단위 로그 수집 {#collect-json-line-logs}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use Logstash to collect JSON line logs and write them to Doris -->

이 예제에서는 GitHub Events Archive 데이터를 사용하여 JSON 행 단위 로그를 수집하고 Doris에 기록하는 방법을 설명합니다.

### 시나리오 설명 {#scenario-description-1}

GitHub Events Archive는 GitHub 사용자 활동 이벤트를 보관한 데이터입니다. 형식은 JSON이며 <https://www.gharchive.org/>에서 다운로드할 수 있습니다. 각 이벤트가 한 줄을 차지하므로 Logstash의 `json` 코덱으로 파싱하기에 적합합니다.

2024년 사월 1일 23:00의 데이터를 다운로드하고, Logstash가 읽을 수 있는 `.json` 파일로 압축을 해제합니다.

```shell
mkdir -p /tmp/github_events
cd /tmp/github_events
wget https://data.gharchive.org/2024-04-01-23.json.gz
gunzip 2024-04-01-23.json.gz
```

다음은 데이터 샘플입니다. 실제 파일에서는 각 항목이 한 줄을 차지하지만, 여기서는 읽기 쉽도록 서식을 적용했습니다.

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

### Doris에 테이블 생성 {#create-the-table-in-doris-1}

GitHub 이벤트 필드, 수집 호스트, 파일 경로를 저장할 `github_events` 테이블을 생성합니다.

```sql
CREATE DATABASE log_db;
USE log_db;

CREATE TABLE github_events
(
    `created_at` DATETIME,
    `id` BIGINT,
    `type` TEXT,
    `public` BOOLEAN,
    `actor.id` BIGINT,
    `actor.login` TEXT,
    `actor.display_login` TEXT,
    `actor.gravatar_id` TEXT,
    `actor.url` TEXT,
    `actor.avatar_url` TEXT,
    `repo.id` BIGINT,
    `repo.name` TEXT,
    `repo.url` TEXT,
    `payload` TEXT,
    `host` TEXT,
    `path` TEXT,
    INDEX `idx_id` (`id`) USING INVERTED,
    INDEX `idx_type` (`type`) USING INVERTED,
    INDEX `idx_actor.id` (`actor.id`) USING INVERTED,
    INDEX `idx_actor.login` (`actor.login`) USING INVERTED,
    INDEX `idx_repo.id` (`repo.id`) USING INVERTED,
    INDEX `idx_repo.name` (`repo.name`) USING INVERTED,
    INDEX `idx_host` (`host`) USING INVERTED,
    INDEX `idx_path` (`path`) USING INVERTED,
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

### Logstash 설정 {#configure-logstash-1}

JSON 행 단위 로그의 설정은 TEXT 여러 줄 로그의 설정과 크게 두 가지 차이가 있습니다.

1. `codec` 매개변수는 `file` 입력에서 `json`으로 설정합니다. Logstash는 각 텍스트 줄을 JSON으로 파싱하며, 파싱된 필드는 이후 처리에 사용됩니다.
2. `filter` 플러그인이 필요하지 않습니다. JSON 데이터는 필드로 직접 파싱할 수 있기 때문입니다.

설정 예제는 다음과 같습니다.

```text
input {
    file {
        path => "/tmp/github_events/2024-04-01-23.json"
        codec => json
    }
}

output {
    doris {
        http_hosts => ["http://fe1:8630", "http://fe2:8630", "http://fe3:8630"]
        user => "root"
        password => ""
        db => "log_db"
        table => "github_events"
        headers => {
            "format" => "json"
            "read_json_by_line" => "true"
            "load_to_single_tablet" => "true"
        }
        mapping => {
            "created_at" => "%{created_at}"
            "id" => "%{id}"
            "type" => "%{type}"
            "public" => "%{public}"
            "actor.id" => "%{[actor][id]}"
            "actor.login" => "%{[actor][login]}"
            "actor.display_login" => "%{[actor][display_login]}"
            "actor.gravatar_id" => "%{[actor][gravatar_id]}"
            "actor.url" => "%{[actor][url]}"
            "actor.avatar_url" => "%{[actor][avatar_url]}"
            "repo.id" => "%{[repo][id]}"
            "repo.name" => "%{[repo][name]}"
            "repo.url" => "%{[repo][url]}"
            "payload" => "%{[payload]}"
            "host" => "%{[host][name]}"
            "path" => "%{[log][file][path]}"
        }
        log_request => true
    }
}
```

### Logstash 실행 {#run-logstash-1}

다음 명령을 실행하여 Logstash를 시작합니다.

```shell
${LOGSTASH_HOME}/bin/logstash -f logstash_github_events.conf
```

## 자주 발생하는 문제 및 문제 해결 {#common-issues-and-troubleshooting}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Check the installation, import, and runtime status of Logstash writing to Doris -->

| 문제 | 해결 방법 |
| --- | --- |
| 네트워크 장애로 표준 설치가 멈춤 | 오프라인 설치를 위해 종속성이 포함된 설치 패키지를 사용하고, `file://`로 로컬 파일 시스템 경로를 지정합니다. |
| Doris에 데이터를 기록하는 각 요청과 응답을 확인해야 함 | `log_request => true`를 `doris` 출력에 설정합니다. 그러면 Stream Load 요청 매개변수와 응답 결과가 로그에 출력됩니다. |
| 쓰기 속도를 확인해야 함 | 기본 `log_speed_interval`을 사용합니다. Logstash는 누적 데이터양, 전체 속도, 최근 10초 동안의 속도를 10초마다 출력합니다. |
| 쓰기 속도 로그를 비활성화해야 함 | `log_speed_interval`을 `0`으로 설정합니다. |
| TEXT 로그의 스택 트레이스가 여러 로그 항목으로 분리됨 | `multiline` 코덱을 `file` 입력에서 사용하여 타임스탬프로 시작하지 않는 줄을 이전 줄에 병합합니다. |
