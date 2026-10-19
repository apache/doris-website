---
{
    "title": "Routine Load",
    "language": "ko",
    "description": "Apache Doris Routine Load는 Kafka의 데이터를 지속적으로 소비합니다. CSV/JSON 형식, Exactly-Once 시맨틱, SSL/Kerberos 인증, 작업 수명 주기 관리 및 문제 해결을 다룹니다.",
    "keywords": [
        "Routine Load",
        "Kafka 실시간 데이터 적재",
        "Doris 스트리밍 데이터 적재",
        "지속적 데이터 적재",
        "Exactly-Once",
        "Kafka SSL",
        "Kafka Kerberos",
        "Kafka SASL",
        "SASL_PLAINTEXT",
        "SASL_SSL",
        "JSON 데이터 적재",
        "CSV 데이터 적재",
        "동적 테이블 데이터 적재",
        "단일 스트림 다중 테이블",
        "유연한 부분 컬럼 업데이트",
        "UPDATE_FLEXIBLE_COLUMNS",
        "PAUSED",
        "Routine Load PAUSED",
        "out of range",
        "kafka_broker_version_fallback",
        "property.broker.version.fallback",
        "desired_concurrent_number",
        "max_filter_ratio",
        "ErrorLogUrls",
        "ALTER ROUTINE LOAD",
        "PAUSE ROUTINE LOAD",
        "RESUME ROUTINE LOAD",
        "STOP ROUTINE LOAD"
    ]
}
---

<!-- Knowledge type: Procedures + Configuration parameters + Examples + FAQ -->
<!-- Applicable scenarios: Continuously consume data from Kafka into Doris / Real-time data ingestion / CDC streaming sync -->

Routine Load는 Apache Doris에서 제공하는 **스트리밍 데이터 적재** 작업으로, Kafka 토픽의 데이터를 지속적으로 소비하여 Doris 테이블에 기록합니다. Routine Load 작업을 제출하면 Doris는 데이터 적재 작업을 계속 실행하면서 실시간으로 적재 태스크를 생성하여 Kafka 클러스터의 지정된 토픽에서 메시지를 소비합니다. 또한 **Exactly-Once** 시맨틱을 제공하여 데이터가 손실되거나 중복되지 않도록 보장합니다.

## 빠른 탐색 {#quick-navigation}

필요에 따라 해당 섹션으로 바로 이동할 수 있습니다.

| 필요한 작업 | 섹션 |
| ------- | ------- |
| 최소 예제를 바로 실행하기 | [빠른 시작](#quick-start) |
| 원리, 상태 머신 및 자동 복구 메커니즘 이해하기 | [기본 원리](#basic-principles) |
| 설정 가능한 모든 매개변수(FE/BE/작업/Kafka) 찾아보기 | [참조 매뉴얼](#reference-manual) |
| 시나리오별 예제 찾기(내결함성, 필터링, JSON, Kerberos 등) | [데이터 적재 예제](#import-examples) |
| 작업이 `PAUSED` 상태가 되거나, `out of range` 또는 SSL 오류가 발생하는 경우 | [자주 묻는 질문(FAQ)](#frequently-asked-questions-faq) |

## 사용 사례 {#use-cases}

<!-- Knowledge type: Scenario description -->

Routine Load는 다음과 같은 시나리오에 적합합니다.

- Kafka 토픽의 실시간 데이터를 Doris에 지속적으로 동기화합니다.
- 데이터 손실이나 중복을 방지하기 위해 **Exactly-Once** 시맨틱이 필요합니다.
- 적재하는 데이터에 컬럼 매핑, 필터링, 파생 컬럼 계산 및 기타 변환을 수행해야 합니다.
- 단일 Kafka 토픽의 데이터를 여러 Doris 테이블에 동적으로 분배해야 합니다(단일 스트림, 다중 테이블).

### 지원하는 데이터 소스 및 형식 {#supported-data-sources-and-formats}

Routine Load는 **Kafka 클러스터**의 데이터 소비만 지원하며, 다음 두 가지 메시지 형식을 지원합니다.

| 형식 | 설명 |
| ---- | ---- |
| CSV  | 각 메시지는 한 줄이며, 줄 끝에 줄바꿈 문자가 **포함되지 않습니다**. |
| JSON | 단일 JSON 객체 또는 여러 객체가 포함된 JSON 배열입니다. |

CSV 형식으로 데이터를 적재할 때는 null 값과 빈 문자열을 명확히 구분해야 합니다.

- null 값은 `\n`으로 표현합니다. 예를 들어 `a,\n,b`는 가운데 컬럼이 null 값임을 나타냅니다.
- 빈 문자열은 데이터를 그대로 비워 둡니다. 예를 들어 `a,,b`는 가운데 컬럼이 빈 문자열(`''`)임을 나타냅니다.

### 제한 사항 {#limitations}

Routine Load를 사용하여 Kafka 데이터를 소비할 때는 다음 제한 사항이 적용됩니다.

| 제한 사항 | 설명 |
| ------ | ---- |
| 메시지 형식 | CSV 및 JSON 텍스트 형식만 지원합니다. 각 CSV 메시지는 한 줄이며, 줄 끝에 줄바꿈 문자가 **포함되지 않습니다**. |
| Kafka 버전 | 기본적으로 Kafka 0.10.0.0 이상을 지원합니다. 0.10.0.0 미만의 Kafka 버전(0.9.0, 0.8.2, 0.8.1, 0.8.0)을 사용하려면 BE 설정 `kafka_broker_version_fallback`을 호환하려는 이전 버전으로 변경하거나, 작업을 생성할 때 `property.broker.version.fallback`을 직접 설정합니다. 이전 버전을 사용하면 시간으로 Kafka 파티션 오프셋을 설정하는 기능 등 Routine Load의 일부 새 기능을 사용하지 못할 수 있습니다. |

## 기본 원리 {#basic-principles}

Routine Load는 Kafka 토픽의 데이터를 지속적으로 소비하여 Doris에 기록합니다. Doris에서 Routine Load 작업을 생성하면 여러 적재 태스크로 구성된 장기 실행 데이터 적재 작업이 생성됩니다.

- **데이터 적재 작업(Load Job)**: Routine Load Job은 데이터 소스의 데이터를 지속적으로 소비하는 장기 실행 데이터 적재 작업입니다.
- **데이터 적재 태스크(Load Task)**: 데이터 적재 작업은 실제 소비를 수행하는 여러 적재 태스크로 나뉩니다. 각 태스크는 독립적인 트랜잭션입니다.

Routine Load의 상세 흐름은 다음 그림과 같습니다.

![Routine Load](/images/routine-load.png)

전체 흐름은 다음과 같습니다.

1. 클라이언트가 FE에 Routine Load 작업 생성 요청을 제출합니다. FE는 Routine Load Manager를 통해 장기 실행 데이터 적재 작업(Routine Load Job)을 생성합니다.
2. FE는 Job Scheduler를 통해 Routine Load Job을 여러 Routine Load Task로 나눕니다. 그런 다음 Task Scheduler가 이를 BE 노드에 배정합니다.
3. BE에서 Routine Load Task의 데이터 적재가 완료되면 FE에 트랜잭션을 커밋하고 작업의 메타데이터를 업데이트합니다.
4. Routine Load Task가 커밋되면 새 태스크를 생성하거나 시간 초과된 태스크를 재시도합니다.
5. 새로 생성된 Routine Load Task는 Task Scheduler에 의해 반복적으로 스케줄링됩니다.

### 자동 복구 메커니즘 {#auto-recovery-mechanism}

<!-- Knowledge type: State machine / Operations rules -->

작업의 고가용성을 보장하기 위해 Routine Load는 자동 복구 메커니즘을 제공합니다. 작업이 예기치 않게 일시 중지되면 Routine Load Scheduler 스레드가 작업의 자동 복구를 시도합니다. Kafka 측의 예기치 않은 장애나 기타 실행 불가 상황이 발생했을 때, 이 메커니즘은 Kafka가 복구되면 수동 개입 없이 데이터 적재 작업을 정상적으로 계속 실행할 수 있도록 합니다.

다음 표는 자동으로 복구되는 경우와 수동 개입이 필요한 경우를 보여 줍니다.

| 일시 중지 원인 | 자동 복구 | 권장 조치 |
| -------------- | ------------ | -------- |
| Kafka 브로커에 일시적으로 연결할 수 없거나 네트워크가 불안정한 경우 | 예 | Scheduler가 `period_of_auto_resume_min` 간격으로 자동 재시도합니다. |
| 사용자가 `PAUSE ROUTINE LOAD`를 직접 실행한 경우 | 아니요 | `RESUME ROUTINE LOAD`를 직접 실행합니다. |
| 데이터 품질 문제(`max_filter_ratio` 또는 `max_error_number` 초과) | 아니요 | `ErrorLogUrls`를 확인하고 데이터나 매개변수를 조정한 다음 `RESUME`을 실행합니다. |
| 데이터베이스나 테이블 삭제 등 복구할 수 없는 메타데이터 예외 | 아니요 | 테이블을 다시 생성하거나 작업을 다시 구성합니다. |

## 빠른 시작 {#quick-start}

<!-- Knowledge type: Procedures -->

이 섹션에서는 실행 가능한 최소 예제를 통해 Kafka의 데이터를 적재하는 Routine Load 작업을 생성하는 방법과 작업 조회, 일시 중지, 재개, 수정 및 중지의 기본 작업을 설명합니다.

### 데이터 적재 작업 생성 {#create-an-import-job}

[CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD) 명령으로 장기 실행 Routine Load 데이터 적재 태스크를 생성할 수 있습니다. Routine Load는 CSV 및 JSON 데이터를 소비할 수 있습니다.

#### CSV 데이터 적재 {#import-csv-data}

1. Kafka 샘플 데이터를 준비합니다.

    ```bash
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-csv --from-beginning
    1,Emily,25
    2,Benjamin,35
    3,Olivia,28
    4,Alexander,60
    5,Ava,17
    6,William,69
    7,Sophia,32
    8,James,64
    9,Emma,37
    10,Liam,64
    ```

2. 데이터를 적재할 대상 테이블을 생성합니다.

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "user id",
        name               VARCHAR(20)           COMMENT "name",
        age                INT                   COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Routine Load 데이터 적재 작업을 생성합니다.

    ```sql
    CREATE ROUTINE LOAD testdb.example_routine_load_csv ON test_routineload_tbl
    COLUMNS TERMINATED BY ",",
    COLUMNS(user_id, name, age)
    FROM KAFKA(
        "kafka_broker_list" = "192.168.88.62:9092",
        "kafka_topic" = "test-routine-load-csv",
        "property.kafka_default_offsets" = "OFFSET_BEGINNING"
    );
    ```

#### JSON 데이터 적재 {#import-json-data}

1. Kafka 샘플 데이터를 준비합니다.

    ```bash
    kafka-console-consumer.sh --bootstrap-server localhost:9092 --topic test-routine-load-json --from-beginning
    {"user_id":1,"name":"Emily","age":25}
    {"user_id":2,"name":"Benjamin","age":35}
    {"user_id":3,"name":"Olivia","age":28}
    {"user_id":4,"name":"Alexander","age":60}
    {"user_id":5,"name":"Ava","age":17}
    {"user_id":6,"name":"William","age":69}
    {"user_id":7,"name":"Sophia","age":32}
    {"user_id":8,"name":"James","age":64}
    {"user_id":9,"name":"Emma","age":37}
    {"user_id":10,"name":"Liam","age":64}
    ```

2. 데이터를 적재할 대상 테이블을 생성합니다.

    ```sql
    CREATE TABLE testdb.test_routineload_tbl(
        user_id            BIGINT       NOT NULL COMMENT "user id",
        name               VARCHAR(20)           COMMENT "name",
        age                INT                   COMMENT "age"
    )
    DUPLICATE KEY(user_id)
    DISTRIBUTED BY HASH(user_id) BUCKETS 10;
    ```

3. Routine Load 데이터 적재 작업을 생성합니다.

    ```sql
    CREATE ROUTINE LOAD testdb.example_routine_load_json ON test_routineload_tbl
    COLUMNS(user_id,name,age)
    PROPERTIES(
        "format"="json",
        "jsonpaths"="[\"$.user_id\",\"$.name\",\"$.age\"]"
    )
    FROM KAFKA(
        "kafka_broker_list" = "192.168.88.62:9092",
        "kafka_topic" = "test-routine-load-json",
        "property.kafka_default_offsets" = "OFFSET_BEGINNING"
    );
    ```

:::info 참고
JSON 파일의 루트에 있는 JSON 객체를 적재하려면 `jsonpaths`를 `$.`로 설정합니다. 예: `PROPERTIES("jsonpaths"="$.")`.
:::

### 데이터 적재 상태 조회 {#view-import-status}

Routine Load의 상태는 다음 두 가지 관점에서 확인할 수 있습니다.

- **데이터 적재 작업**: 데이터 적재 작업의 대상 테이블, 하위 태스크 수, 적재 지연 상태, 적재 설정 및 적재 결과를 조회합니다.
- **데이터 적재 태스크**: 하위 적재 태스크의 상태, 소비 진행 상황 및 태스크가 배정된 BE 노드를 조회합니다.

#### 데이터 적재 작업 조회 {#view-the-load-job}

[SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) 명령으로 데이터 적재 작업을 조회합니다. 이 명령은 적재 대상 테이블, 적재 지연 상태, 적재 설정 및 오류 정보 등 현재 작업의 기본 상태를 보여 줍니다.

다음 명령은 `testdb.example_routine_load_csv`의 작업 상태를 보여 줍니다.

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

#### 하위 적재 태스크 조회 {#view-the-load-subtasks}

[SHOW ROUTINE LOAD TASK](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD-TASK) 명령으로 하위 적재 태스크를 조회합니다. 이 명령은 하위 태스크의 상태 및 태스크가 배정된 BE id 등 현재 작업에 속한 하위 태스크 정보를 보여 줍니다.

다음 명령은 `testdb.example_routine_load_csv`의 하위 태스크 정보를 보여 줍니다.

```sql
mysql> SHOW ROUTINE LOAD TASK WHERE jobname = 'example_routine_load_csv';
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| TaskId                            | TxnId | TxnStatus | JobId | CreateTime          | ExecuteStartTime    | Timeout | BeId  | DataSourceProperties |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
| 8cf47e6a68ed4da3-8f45b431db50e466 | 195   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 10429 | {"4":1231,"9":2603}  |
| f2d4525c54074aa2-b6478cf8daaeb393 | 196   | PREPARE   | 12177 | 2024-01-15 12:20:41 | 2024-01-15 12:21:01 | 20      | 12109 | {"1":1225,"6":1216}  |
| cb870f1553864250-975279875a25fab6 | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"2":7234,"7":4865}  |
| 68771fd8a1824637-90a9dac2a7a0075e | -1    | NULL      | 12177 | 2024-01-15 12:20:52 | NULL                | 20      | -1    | {"3":1769,"8":2982}  |
| 77112dfea5e54b0a-a10eab3d5b19e565 | 197   | PREPARE   | 12177 | 2024-01-15 12:21:02 | 2024-01-15 12:21:02 | 20      | 12098 | {"0":3000,"5":2622}  |
+-----------------------------------+-------+-----------+-------+---------------------+---------------------+---------+-------+----------------------+
```

### 데이터 적재 작업 일시 중지 {#pause-an-import-job}

[PAUSE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/PAUSE-ROUTINE-LOAD) 명령으로 데이터 적재 작업을 일시 중지할 수 있습니다. 일시 중지된 작업은 `PAUSED` 상태가 되지만 종료되지는 않습니다. `RESUME ROUTINE LOAD` 명령으로 다시 시작할 수 있습니다.

```sql
PAUSE ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### 데이터 적재 작업 재개 {#resume-an-import-job}

`PAUSED` 상태의 데이터 적재 작업은 [RESUME ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/RESUME-ROUTINE-LOAD) 명령으로 재개할 수 있습니다.

```sql
RESUME ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### 데이터 적재 작업 수정 {#modify-an-import-job}

[ALTER ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/ALTER-ROUTINE-LOAD) 명령으로 생성된 데이터 적재 작업을 수정할 수 있습니다. 수정하기 전에 먼저 `PAUSE ROUTINE LOAD`로 작업을 일시 중지합니다. 수정이 완료되면 `RESUME ROUTINE LOAD`로 재개합니다.

예를 들어 목표 동시 실행 수 매개변수 `desired_concurrent_number`와 Kafka 토픽 정보를 수정하려면 다음과 같이 실행합니다.

```sql
ALTER ROUTINE LOAD FOR testdb.example_routine_load_csv
PROPERTIES(
    "desired_concurrent_number" = "3"
)
FROM KAFKA(
    "kafka_broker_list" = "192.168.88.60:9092",
    "kafka_topic" = "test-topic"
);
```

### 데이터 적재 작업 취소 {#cancel-an-import-job}

[STOP ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/STOP-ROUTINE-LOAD) 명령으로 Routine Load 데이터 적재 작업을 중지하고 삭제할 수 있습니다. **삭제된 데이터 적재 작업은 복구할 수 없으며**, `SHOW ROUTINE LOAD` 명령으로 조회할 수도 없습니다.

```sql
STOP ROUTINE LOAD FOR testdb.example_routine_load_csv;
```

### Compute Group 바인딩 {#bind-a-compute-group}

**스토리지와 컴퓨팅이 분리된 모드**에서 Routine Load의 Compute Group 선택은 다음 우선순위를 따릅니다.

1. 4.1.5부터는 작업 속성 `"compute_group" = "<compute_group_name>"`으로 명시적으로 바인딩한 Compute Group을 우선 선택합니다.
2. 이 속성을 생략하면 `use db@cluster`로 지정한 Compute Group을 선택합니다.
3. 사용자 속성 `default_compute_group`으로 지정한 Compute Group을 선택합니다.
4. 현재 사용자가 접근 권한을 가진 Compute Group 중 하나를 선택합니다.

`compute_group`은 선택적 문자열 속성이며, 기본 바인딩은 없습니다. 컴퓨팅과 스토리지가 분리된 모드에서만 지원합니다. 해당 그룹이 존재해야 하며, 작업 생성자에게 해당 그룹의 `USAGE` 권한이 있어야 합니다. `DEFAULT`는 대소문자를 구분하지 않는 예약 값이므로 바인딩할 수 없습니다. 명시적 바인딩은 세션 선택보다 우선합니다. 각 태스크는 실행 전에 그룹의 존재 여부와 작업 소유자의 권한을 다시 확인합니다. 그룹이 없으면 복구될 때까지 작업이 일시 중지될 수 있습니다. 권한이 취소된 경우에는 권한을 복원한 후 작업을 직접 재개해야 합니다.

아래와 같이 `PROPERTIES`에 속성을 추가하여 `CREATE ROUTINE LOAD` 예제에 적용합니다.

```sql
PROPERTIES (
    "compute_group" = "cg_ingest",
    "desired_concurrent_number" = "3"
)
```

**스토리지와 컴퓨팅이 통합된 모드**에서는 사용자 속성 `resource_tags.location`으로 지정한 Compute Group을 선택합니다. 사용자 속성에 Compute Group을 지정하지 않으면 이름이 `default`인 Compute Group을 사용합니다.

:::caution 참고
Routine Load 작업의 Compute Group은 **생성 시에만 지정할 수 있습니다**. 작업을 생성한 후에는 바인딩된 Compute Group을 변경할 수 없습니다.
:::

## 참조 매뉴얼 {#reference-manual}

<!-- Knowledge type: Configuration parameters + Syntax reference -->

### 데이터 적재 명령 구문 {#import-command-syntax}

장기 실행 Routine Load 데이터 적재 작업을 생성하는 구문은 다음과 같습니다.

```sql
CREATE ROUTINE LOAD [<db_name>.]<job_name> [ON <tbl_name>]
[merge_type]
[load_properties]
[job_properties]
FROM KAFKA [data_source_properties]
[COMMENT "<comment>"]
```

각 모듈은 다음과 같습니다.

| 모듈                  | 설명                                                  |
| ---------------------- | ------------------------------------------------------------ |
| db_name                | 데이터 적재 태스크를 생성할 데이터베이스를 지정합니다.   |
| job_name               | 생성할 데이터 적재 태스크의 이름을 지정합니다. 같은 데이터베이스 내에 이름이 같은 태스크가 존재할 수 없습니다. |
| tbl_name               | 데이터를 적재할 테이블의 이름을 지정합니다. 선택 사항입니다. 지정하지 않으면 동적 테이블 방식을 사용하며, 이 경우 Kafka 데이터에 테이블 이름이 포함되어야 합니다. |
| merge_type             | 데이터 병합 유형입니다. 기본값은 APPEND입니다.<p>다음 세 가지 옵션이 있습니다.</p><p>- APPEND: 데이터를 추가하여 적재합니다.</p><p>- MERGE: 데이터를 병합하여 적재합니다.</p><p>- DELETE: 적재되는 모든 데이터를 삭제합니다.</p> |
| load_properties        | 데이터 적재 설명 모듈로, 다음 구성 요소를 포함합니다.<p>- column_separator 절</p><p>- columns_mapping 절</p><p>- preceding_filter 절</p><p>- where_predicates 절</p><p>- partitions 절</p><p>- delete_on 절</p><p>- order_by 절</p> |
| job_properties         | Routine Load의 공통 데이터 적재 매개변수를 지정합니다.      |
| data_source_properties | Kafka 데이터 소스의 속성을 설명합니다.           |
| comment                | 데이터 적재 작업의 주석을 설명합니다.                    |

### 데이터 적재 매개변수 설명 {#import-parameter-description}

#### FE 설정 매개변수 {#fe-configuration-parameters}

| 매개변수 | 기본값 | 동적 변경 | FE Master 전용 | 설명 |
| -------- | ------ | -------- | ------------------ | -------- |
| max_routine_load_task_concurrent_num | 256 | 예 | 예 | Routine Load 데이터 적재 작업의 최대 하위 태스크 동시 실행 수를 제한합니다. 기본값을 유지하는 것이 좋습니다. 너무 크게 설정하면 동시 실행 태스크가 과도하게 많아져 클러스터 리소스를 소모할 수 있습니다. |
| max_routine_load_task_num_per_be | 1024 | 예 | 예 | BE별로 동시에 실행할 수 있는 Routine Load 태스크의 최대 수입니다. `max_routine_load_task_num_per_be`는 `routine_load_thread_pool_size`보다 작아야 합니다. |
| max_routine_load_job_num | 100 | 예 | 예 | NEED_SCHEDULED, RUNNING 및 PAUSE 상태의 작업을 포함하여 Routine Load 작업의 최대 수를 제한합니다. |
| max_tolerable_backend_down_num | 0 | 예 | 예 | BE가 하나라도 중단되면 Routine Load는 자동으로 복구할 수 없습니다. 특정 조건이 충족되면 Doris는 PAUSED 태스크를 다시 스케줄링하여 RUNNING 상태로 전환할 수 있습니다. 값이 0이면 모든 BE 노드가 살아 있을 때만 다시 스케줄링할 수 있습니다. |
| period_of_auto_resume_min | 5(분) | 예 | 예 | Routine Load의 자동 복구가 수행되는 간격입니다. |

#### BE 설정 매개변수 {#be-configuration-parameters}

| 매개변수 | 기본값 | 동적 변경 | 설명 |
| -------- | ------ | -------- | ---- |
| max_consumer_num_per_group | 3 | 예 | 단일 하위 태스크가 데이터 소비를 위해 생성할 수 있는 컨슈머의 최대 수입니다. |

#### 데이터 적재 설정 매개변수 {#import-configuration-parameters}

Routine Load 작업을 생성할 때 `CREATE ROUTINE LOAD` 명령으로 각 모듈의 데이터 적재 설정 매개변수를 지정할 수 있습니다.

##### tbl_name 절 {#tbl_name-clause}

데이터를 적재할 테이블의 이름을 지정합니다. 선택 사항입니다.

지정하지 않으면 **동적 테이블** 방식을 사용하며, 이 경우 Kafka 데이터에 테이블 이름이 포함되어야 합니다. 현재 동적 테이블 이름은 Kafka Value에서 추출하는 방식만 지원하며, 데이터는 다음 형식을 따라야 합니다. JSON의 경우 `table_name|{"col1": "val1", "col2": "val2"}` 형식이며, 여기서 `tbl_name`은 테이블 이름이고 `|`는 테이블 이름과 테이블 데이터 사이의 구분자입니다. CSV 형식 데이터도 유사합니다. 예: `table_name|val1,val2,val3`.

:::caution 참고
여기서 `table_name`은 Doris의 테이블 이름과 정확히 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다. 동적 테이블은 `column_mapping`을 지원하지 않습니다.
:::

##### merge_type 절 {#merge_type-clause}

`merge_type` 모듈로 데이터 병합 유형을 지정할 수 있습니다. 다음 세 가지 옵션이 있습니다.

- **APPEND**: 데이터를 추가하여 적재합니다.
- **MERGE**: 데이터를 병합하여 적재합니다. Unique Key 모델에만 적용됩니다. Delete Flag 컬럼을 표시하려면 반드시 `[DELETE ON]` 모듈과 함께 사용해야 합니다.
- **DELETE**: 적재되는 모든 데이터를 삭제합니다.

##### load_properties 절 {#load_properties-clause}

`load_properties` 모듈로 적재 데이터의 속성을 설명할 수 있습니다. 구문은 다음과 같습니다.

```sql
[COLUMNS TERMINATED BY <column_separator>,]
[COLUMNS (<column1_name>[, <column2_name>, <column_mapping>, ...]),]
[WHERE <where_expr>,]
[PARTITION(<partition1_name>, [<partition2_name>, <partition3_name>, ...]),]
[DELETE ON <delete_expr>,]
[ORDER BY <order_by_column1>[, <order_by_column2>, <order_by_column3>, ...]]
```

각 모듈에 해당하는 매개변수는 다음과 같습니다.

| 하위 모듈            | 매개변수          | 설명                                                  |
| --------------------- | ------------------ | ------------------------------------------------------------ |
| COLUMNS TERMINATED BY | `<column_separator>` | 컬럼 구분자를 지정합니다. 기본값은 `\t`입니다. 예를 들어 쉼표를 구분자로 지정하려면 `COLUMN TERMINATED BY ","`를 사용합니다. null 처리 시 주의 사항:<p>- null 값은 `\n`으로 표현합니다. `a,\n,b`는 가운데 컬럼이 null 값임을 나타냅니다.</p><p>- 빈 문자열은 데이터를 그대로 비워 둡니다. `a,,b`는 가운데 컬럼이 빈 문자열(`''`)임을 나타냅니다.</p> |
| COLUMNS               | `<column_name>`    | 해당 컬럼 이름을 지정합니다. 예를 들어 적재 컬럼 `(k1, k2, k3)`을 지정하려면 `COLUMNS(k1, k2, k3)`을 사용합니다. 다음 경우에는 COLUMNS 절을 생략할 수 있습니다.<p>- CSV의 컬럼과 테이블의 컬럼이 일대일로 대응하는 경우.</p><p>- JSON의 키 이름이 테이블의 컬럼 이름과 같은 경우.</p> |
| &nbsp;                | `<column_mapping>` | 데이터 적재 중 컬럼 매핑을 통해 컬럼을 필터링하고 변환할 수 있습니다. 예를 들어 대상 컬럼 k4를 k3 컬럼에서 k3+1 수식으로 계산하려면 `COLUMNS(k1, k2, k3, k4 = k3 + 1)`을 사용합니다. 자세한 내용은 [데이터 변환](../../import/load-data-convert)을 참조하세요. |
| WHERE                 | `<where_expr>`     | 조건에 따라 적재 데이터 소스를 필터링합니다. 예를 들어 age > 30인 데이터만 적재하려면 `WHERE age > 30`을 사용합니다. |
| PARTITION             | `<partition_name>` | 대상 테이블에서 데이터를 적재할 파티션을 지정합니다. 지정하지 않으면 데이터가 해당 파티션에 자동으로 적재됩니다. 예를 들어 파티션 p1과 p2에 적재하려면 `PARTITION(p1, p2)`를 사용합니다. |
| DELETE ON             | `<delete_expr>`    | MERGE 데이터 적재 모드에서는 `delete_expr`로 삭제할 컬럼을 표시합니다. 예를 들어 MERGE 중 age > 30인 컬럼을 삭제하려면 `DELETE ON age > 30`을 사용합니다. |
| ORDER BY              | `<order_by_column>` | Unique Key 모델에서만 유효합니다. 데이터 순서를 보장하기 위해 적재 데이터의 Sequence Column을 지정합니다. 예를 들어 `create_time`을 Sequence Column으로 지정하려면 `ORDER BY create_time`을 사용합니다. 자세한 내용은 [데이터 업데이트 / Sequence Column](../../../data-operate/update/update-of-unique-model)을 참조하세요. |

##### job_properties 절 {#job_properties-clause}

Routine Load 데이터 적재 작업을 생성할 때 `job_properties` 절로 데이터 적재 작업의 속성을 지정할 수 있습니다. 구문은 다음과 같습니다.

```sql
PROPERTIES ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

`job_properties` 절의 구체적인 매개변수 옵션은 다음과 같습니다.

| 매개변수 | 설명 |
| ---- | ---- |
| desired_concurrent_number | <p>기본값: 256</p><p>단일 데이터 적재 태스크의 목표 동시 실행 수입니다. 데이터 적재 중 목표 하위 태스크 동시 실행 수는 실제 동시 실행 수와 다를 수 있습니다. 실제 동시 실행 수는 다음과 같이 계산합니다.</p><p>`min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)`, 각 항목의 의미는 다음과 같습니다.</p><p>- `topic_partition_num`: Kafka 토픽의 파티션 수.</p><p>- `desired_concurrent_number`: 이 매개변수의 값.</p><p>- `max_routine_load_task_concurrent_num`: FE에 설정된 Routine Load의 최대 태스크 병렬 처리 수.</p> |
| max_batch_interval | 각 하위 태스크의 최대 실행 시간으로, 단위는 초입니다. 0보다 커야 합니다. 기본값은 60입니다. `max_batch_interval`, `max_batch_rows`, `max_batch_size`는 함께 하위 태스크의 실행 임계값을 구성합니다. 이 중 하나라도 임계값에 도달하면 하위 적재 태스크가 종료되고 새 하위 태스크가 생성됩니다. |
| max_batch_rows | 각 하위 태스크가 읽을 수 있는 최대 행 수입니다. 200000 이상이어야 합니다. 기본값은 20000000입니다. `max_batch_interval`, `max_batch_rows`, `max_batch_size`는 함께 하위 태스크의 실행 임계값을 구성합니다. 이 중 하나라도 임계값에 도달하면 하위 적재 태스크가 종료되고 새 하위 태스크가 생성됩니다. |
| max_batch_size | 각 하위 태스크가 읽을 수 있는 최대 바이트 수입니다. 단위는 바이트이고, 범위는 100 MB에서 1 GB이며, 기본값은 1 GB입니다. `max_batch_interval`, `max_batch_rows`, `max_batch_size`는 함께 하위 태스크의 실행 임계값을 구성합니다. 이 중 하나라도 임계값에 도달하면 하위 적재 태스크가 종료되고 새 하위 태스크가 생성됩니다. |
| max_error_number | 샘플링 구간 내에서 허용되는 최대 오류 행 수입니다. 0 이상이어야 합니다. 기본값은 0이며, 오류 행을 허용하지 않습니다. 샘플링 구간은 `max_batch_rows * 10`입니다. 샘플링 구간 내 오류 행 수가 `max_error_number`를 초과하면 Routine Load 작업이 일시 중지됩니다. 데이터 품질 문제를 확인하려면 수동 개입이 필요합니다. 데이터 품질 문제는 `ErrorLogUrls` 필드에서 확인할 수 있으며, 이 필드는 [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) 명령 결과에 표시됩니다. where 조건으로 필터링된 행은 오류 행으로 계산하지 않습니다. |
| strict_mode | 엄격 모드의 활성화 여부입니다. 기본적으로 비활성화되어 있습니다. 엄격 모드는 데이터 적재 중 컬럼 타입 변환을 엄격하게 필터링합니다. 활성화하면 null이 아닌 원본 데이터 값이 컬럼 타입 변환 후 NULL이 되는 경우 해당 데이터를 필터링합니다.<p>필터링 정책:</p><p>- 엄격 모드는 파생 컬럼(함수 변환으로 생성된 컬럼)에 영향을 주지 않습니다.</p><p>- 컬럼 타입을 변환해야 하는 경우 잘못된 타입의 데이터는 필터링됩니다. 해당 데이터는 `ErrorLogUrls`에서 확인할 수 있으며, 이 필드는 [SHOW ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/SHOW-ROUTINE-LOAD) 결과에 표시됩니다.</p><p>- 적재할 컬럼 타입에 범위 제한이 있는 경우, 원본 데이터가 타입 변환은 통과하지만 범위 제한을 통과하지 못하는 상황에는 엄격 모드가 영향을 주지 않습니다. 예를 들어 타입이 `decimal(1,0)`이고 원본 데이터가 10이면 타입 변환은 통과하지만 컬럼에 선언된 범위에는 속하지 않습니다. 자세한 내용은 [엄격 모드](../../../data-operate/import/handling-messy-data#strict-mode-strict_mode)를 참조하세요.</p> |
| timezone | 데이터 적재 작업에서 사용할 시간대를 지정합니다. 기본값은 세션의 timezone 매개변수입니다. 이 매개변수는 데이터 적재에 사용되는 모든 시간대 관련 함수의 결과에 영향을 줍니다. |
| format | 적재 데이터의 형식을 지정합니다. 기본값은 CSV입니다. JSON 형식을 지원합니다. |
| compute_group | 4.1.5부터 지원합니다. 선택적 문자열이며 기본적으로 생략됩니다. 컴퓨팅과 스토리지가 분리된 모드에서만 지원하며, 실행할 Compute Group을 명시적으로 바인딩합니다. 해당 그룹의 `USAGE` 권한이 필요하며 예약 값인 `DEFAULT`는 허용하지 않습니다. |
| jsonpaths | 적재 데이터 형식이 JSON인 경우 `jsonpaths`로 JSON 데이터에서 추출할 필드를 지정할 수 있습니다. 예: `"jsonpaths" = "[\"$.userid\",\"$.username\",\"$.age\",\"$.city\"]"` |
| json_root | 적재 데이터 형식이 JSON인 경우 `json_root`로 JSON 데이터의 루트 노드를 지정할 수 있습니다. Doris는 `json_root`로 지정한 루트 노드에서 요소를 추출하고 파싱합니다. 기본값은 비어 있습니다. 예: `"json_root" = "$.RECORDS"` |
| strip_outer_array | 적재 데이터 형식이 JSON일 때 `strip_outer_array`를 true로 설정하면 JSON 데이터가 배열로 제공되며, 데이터의 각 요소를 하나의 행으로 처리합니다. 기본값은 false입니다. Kafka의 JSON 데이터는 배열 형태로 제공되는 경우가 많으며, 가장 바깥쪽이 대괄호 `[]`로 둘러싸여 있습니다. 이 경우 `"strip_outer_array" = "true"`를 지정할 수 있습니다. 예를 들어 다음 데이터는 두 행으로 파싱됩니다. `[{"user_id":1,"name":"Emily","age":25},{"user_id":2,"name":"Benjamin","age":35}]` |
| send_batch_parallelism | 배치 데이터를 전송할 때의 병렬 처리 수를 설정합니다. 병렬 처리 수가 BE 설정 `max_send_batch_parallelism_per_job`을 초과하면 코디네이터 역할을 하는 BE는 `max_send_batch_parallelism_per_job`의 값을 사용합니다. |
| load_to_single_tablet | 태스크의 데이터를 해당 파티션의 단일 tablet에만 적재할 수 있도록 합니다. 기본값은 false입니다. 이 매개변수는 랜덤 버킷팅을 사용하는 OLAP 테이블에 데이터를 적재할 때만 설정할 수 있습니다. |
| partial_columns | 부분 컬럼 업데이트의 활성화 여부를 지정합니다. 기본값은 false입니다. 테이블 모델이 Unique이고 Merge on Write를 사용하는 경우에만 설정할 수 있습니다. 단일 스트림 다중 테이블 데이터 적재는 이 매개변수를 지원하지 않습니다. 자세한 내용은 [부분 컬럼 업데이트](../../../data-operate/update/partial-column-update.md)를 참조하세요. |
| unique_key_update_mode | Unique Key 테이블의 업데이트 모드를 지정합니다. 옵션:<ul><li>`UPSERT`(기본값): 표준 전체 행 삽입 또는 업데이트.</li><li>`UPDATE_FIXED_COLUMNS`: 모든 행이 동일한 컬럼을 업데이트하는 부분 컬럼 업데이트. `partial_columns=true`와 동일합니다.</li><li>`UPDATE_FLEXIBLE_COLUMNS`: 각 행이 서로 다른 컬럼을 업데이트할 수 있는 유연한 부분 컬럼 업데이트. JSON 형식이 필요하며 테이블에 `enable_unique_key_skip_bitmap_column=true`가 설정되어 있어야 합니다. `jsonpaths`, `fuzzy_parse`, `COLUMNS` 절 또는 `WHERE` 절과 함께 사용할 수 없습니다.</li></ul>자세한 내용은 [부분 컬럼 업데이트](../../../data-operate/update/partial-column-update#flexible-column-update)를 참조하세요. |
| partial_update_new_key_behavior | Unique Merge on Write 테이블에서 부분 컬럼 업데이트를 수행할 때 새로 삽입되는 행의 처리 방식입니다. `APPEND`와 `ERROR`의 두 가지 유형이 있습니다.<br/>- `APPEND`: 새 행 삽입을 허용합니다.<br/>- `ERROR`: 새 행을 삽입하면 데이터 적재가 실패하고 오류가 보고됩니다. |
| max_filter_ratio | 샘플링 구간 내에서 허용되는 최대 필터링 비율입니다. 0 이상 1 이하여야 합니다. 기본값은 1.0이며, 모든 오류 행을 허용한다는 의미입니다. 샘플링 구간은 `max_batch_rows * 10`입니다. 샘플링 구간 내 오류 행 수 / 전체 행 수가 `max_filter_ratio`를 초과하면 Routine Load 작업이 일시 중지됩니다. 데이터 품질 문제를 확인하려면 수동 개입이 필요합니다. where 조건으로 필터링된 행은 오류 행으로 계산하지 않습니다. |
| enclose | 감싸는 문자를 지정합니다. CSV 데이터 필드에 행 구분자나 컬럼 구분자가 포함된 경우, 단일 바이트 문자를 감싸는 문자로 지정하여 의도치 않게 데이터가 잘리는 것을 방지할 수 있습니다. 예를 들어 컬럼 구분자가 `,`이고 감싸는 문자가 `'`이면, 데이터 `a,'b,c'`에서 `b,c`는 단일 필드로 파싱됩니다. |
| escape | 이스케이프 문자를 지정합니다. 필드 내에서 감싸는 문자와 동일한 문자를 이스케이프하는 데 사용합니다. 예를 들어 데이터 `a,'b,'c'`에서 감싸는 문자가 `'`일 때, `b,'c`를 단일 필드로 파싱하려면 단일 바이트 이스케이프 문자(예: `\`)를 지정하고 데이터를 `a,'b,\'c'`로 수정해야 합니다. |

#### data_source_properties 절 {#data_source_properties-clause}

Routine Load 데이터 적재 작업을 생성할 때 `data_source_properties` 절로 Kafka 데이터 소스의 속성을 지정할 수 있습니다. 구문은 다음과 같습니다.

```sql
FROM KAFKA ("<key1>" = "<value1>"[, "<key2>" = "<value2>" ...])
```

`data_source_properties` 절의 구체적인 매개변수 옵션은 다음과 같습니다.

| 매개변수 | 설명 |
| ---- | ---- |
| kafka_broker_list | Kafka 브로커 연결 정보를 지정합니다. 형식은 `<kafka_broker_ip>:<kafka port>`입니다. 여러 브로커는 쉼표로 구분합니다. 예: `"kafka_broker_list" = "<broker1_ip>:9092,<broker2_ip>:9092"` |
| kafka_topic | 구독할 Kafka 토픽을 지정합니다. 단일 데이터 적재 작업은 하나의 Kafka 토픽만 소비할 수 있습니다. |
| kafka_partitions | 구독할 Kafka 파티션을 지정합니다. 지정하지 않으면 기본적으로 모든 파티션을 소비합니다. |
| kafka_offsets | 소비할 Kafka 파티션의 소비 시작 오프셋입니다. 시간을 지정하면 지정한 시간 이상인 가장 최근 오프셋부터 소비를 시작합니다. 오프셋은 0 이상의 구체적인 오프셋 값이나 다음 형식 중 하나로 지정할 수 있습니다.<p>- `OFFSET_BEGINNING`: 데이터가 존재하는 위치부터 구독합니다.</p><p>- `OFFSET_END`: 끝부터 구독합니다.</p><p>- 시간 형식. 예: `"2021-05-22 11:00:00"`.</p><p>지정하지 않으면 기본적으로 토픽의 모든 파티션을 `OFFSET_END`부터 구독합니다. 여러 소비 시작 오프셋을 쉼표로 구분하여 지정할 수 있습니다. 예: `"kafka_offsets" = "101,0,OFFSET_BEGINNING,OFFSET_END"` 또는 `"kafka_offsets" = "2021-05-22 11:00:00,2021-05-22 11:00:00"`.</p><p>참고: 시간 형식과 OFFSET 형식은 혼합하여 사용할 수 없습니다.</p> |
| property | 사용자 정의 Kafka 매개변수를 지정하며, kafka 셸의 `--property` 매개변수와 동일합니다. 매개변수 값이 파일인 경우 값 앞에 `FILE:` 키워드를 붙입니다. 파일 생성 방법은 [CREATE FILE](../../../sql-manual/sql-statements/security/CREATE-FILE) 명령을 참조하세요. 그 밖에 지원하는 사용자 정의 매개변수는 공식 librdkafka [CONFIGURATION](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md) 문서의 클라이언트 측 설정을 참조하세요. 예: `"property.client.id" = "12345"`, `"property.group.id" = "group_id_0"`, `"property.ssl.ca.location" = "FILE:ca.pem"`. |

kafka 속성 매개변수를 `data_source_properties`에 설정하여 보안 접근 옵션을 구성할 수 있습니다. Doris는 현재 plaintext(기본값), SSL, PLAIN, Kerberos 등 여러 Kafka 보안 프로토콜을 지원합니다.

### 데이터 적재 상태 {#import-status}

`SHOW ROUTINE LOAD` 명령으로 데이터 적재 작업의 상태를 조회할 수 있습니다.

```sql
SHOW [ALL] ROUTINE LOAD [FOR jobName];
```

결과 예시:

```sql
mysql> SHOW ROUTINE LOAD FOR testdb.example_routine_load\G
*************************** 1. row ***************************
                  Id: 12025
                Name: example_routine_load
          CreateTime: 2024-01-15 08:12:42
           PauseTime: NULL
             EndTime: NULL
              DbName: default_cluster:testdb
           TableName: test_routineload_tbl
        IsMultiTable: false
               State: RUNNING
      DataSourceType: KAFKA
      CurrentTaskNum: 1
       JobProperties: {"max_batch_rows":"200000","timezone":"America/New_York","send_batch_parallelism":"1","load_to_single_tablet":"false","column_separator":"','","line_delimiter":"\n","current_concurrent_number":"1","delete":"*","partial_columns":"false","merge_type":"APPEND","exec_mem_limit":"2147483648","strict_mode":"false","jsonpaths":"","max_batch_interval":"10","max_batch_size":"104857600","fuzzy_parse":"false","partitions":"*","columnToColumnExpr":"user_id,name,age","whereExpr":"*","desired_concurrent_number":"5","precedingFilter":"*","format":"csv","max_error_number":"0","max_filter_ratio":"1.0","json_root":"","strip_outer_array":"false","num_as_string":"false"}
DataSourceProperties: {"topic":"test-topic","currentKafkaPartitions":"0","brokerList":"192.168.88.62:9092"}
    CustomProperties: {"kafka_default_offsets":"OFFSET_BEGINNING","group.id":"example_routine_load_73daf600-884e-46c0-a02b-4e49fdf3b4dc"}
           Statistic: {"receivedBytes":28,"runningTxns":[],"errorRows":0,"committedTaskNum":3,"loadedRows":3,"loadRowsRate":0,"abortedTaskNum":0,"errorRowsAfterResumed":0,"totalRows":3,"unselectedRows":0,"receivedBytesRate":0,"taskExecuteTimeMs":30069}
            Progress: {"0":"2"}
                 Lag: {"0":0}
ReasonOfStateChanged:
        ErrorLogUrls:
            OtherMsg:
                User: root
             Comment:
1 row in set (0.00 sec)
```

결과 컬럼은 다음과 같습니다.

| 결과 컬럼        | 설명                                                  |
| -------------------- | ------------------------------------------------------------ |
| Id                   | Doris가 자동으로 생성하는 작업 ID입니다.                |
| Name                 | 작업 이름입니다.                                                |
| CreateTime           | 작업 생성 시간입니다.                                       |
| PauseTime            | 작업이 가장 최근에 일시 중지된 시간입니다.                              |
| EndTime              | 작업 종료 시간입니다.                                            |
| DbName               | 해당 데이터베이스 이름입니다.                             |
| TableName            | 해당 테이블 이름입니다. 다중 테이블 작업(동적 테이블)의 경우 구체적인 테이블 이름 대신 `multi-table`이 표시됩니다. |
| IsMultiTable         | 다중 테이블 작업(단일 스트림, 다중 테이블)인지 여부입니다. |
| State                | 작업 실행 상태입니다. 상태는 5가지입니다. 아래의 [작업 상태 머신](#job-state-machine)을 참조하세요. |
| DataSourceType       | 데이터 소스 유형으로, KAFKA입니다.                                 |
| CurrentTaskNum       | 현재 하위 태스크 수입니다.                              |
| JobProperties        | 작업 설정 세부 정보입니다.                                   |
| DataSourceProperties | 데이터 소스 설정 세부 정보입니다.                           |
| CustomProperties     | 사용자 정의 설정입니다.                                        |
| Statistic            | 작업 실행 상태에 대한 통계입니다.                         |
| Progress             | 작업 실행 진행 상황입니다. Kafka 데이터 소스의 경우 각 파티션에서 현재 소비한 오프셋을 표시합니다. 예를 들어 `{"0":"2"}`는 Kafka 파티션 0의 소비 진행 오프셋이 2임을 의미합니다. |
| Lag                  | 작업 지연 상태입니다. Kafka 데이터 소스의 경우 각 파티션의 소비 지연을 표시합니다. 예를 들어 `{"0":10}`은 Kafka 파티션 0의 소비 지연이 10임을 의미합니다. |
| ReasonOfStateChanged | 작업 상태가 변경된 이유입니다.                         |
| ErrorLogUrls         | 필터링된 저품질 데이터를 확인할 수 있는 URL입니다.    |
| OtherMsg             | 기타 오류 정보입니다.                                     |

### 작업 상태 머신 {#job-state-machine}

<!-- Knowledge type: State machine -->

Routine Load 작업에는 5가지 상태가 있습니다. 상태 간 전환은 다음과 같습니다.

| 상태 | 의미 | 전환 조건 | 다음에 가능한 상태 |
| ---- | ---- | -------- | -------------- |
| `NEED_SCHEDULE` | 작업이 스케줄링을 기다리고 있습니다. | `CREATE ROUTINE LOAD` 또는 `RESUME ROUTINE LOAD` 실행 후의 초기 상태입니다. | `RUNNING` |
| `RUNNING` | 작업이 실행 중이며 Kafka 데이터를 지속적으로 소비합니다. | 스케줄링에 성공하면 진입합니다. | `PAUSED` / `STOPPED` |
| `PAUSED` | 작업이 일시 중지되었지만 종료되지는 않았습니다. | `PAUSE ROUTINE LOAD`를 직접 실행하거나 예외로 인해 자동 일시 중지됩니다. | `NEED_SCHEDULE`(수동 `RESUME` 또는 자동 복구) / `CANCELLED` |
| `STOPPED` | 작업이 중지되었으며 **다시 시작할 수 없습니다**. | `STOP ROUTINE LOAD`. | 최종 상태입니다. |
| `CANCELLED` | 작업이 취소되었습니다. | 데이터베이스나 테이블이 삭제되었거나 기타 예외가 발생했습니다. | 최종 상태입니다. |

## 데이터 적재 예제 {#import-examples}

<!-- Knowledge type: Procedures + Examples -->

원하는 예제로 빠르게 이동할 수 있도록 이 섹션의 대표적인 예제를 사용 사례별로 정리했습니다.

| 범주 | 시나리오 | 해당 문제 |
| ---- | ---- | -------- |
| 데이터 품질 및 필터링 | [데이터 적재의 최대 오류 허용 범위 설정](#set-maximum-import-fault-tolerance) | 데이터 품질이 불안정하여 더티 데이터를 허용해야 합니다. |
| 데이터 품질 및 필터링 | [데이터 적재 필터 조건 설정](#set-import-filter-conditions) | 조건을 충족하는 데이터만 적재합니다. |
| 데이터 품질 및 필터링 | [엄격 모드 데이터 적재](#strict-mode-import) | 타입 변환 오류를 엄격하게 필터링합니다. |
| 소비 제어 | [지정한 오프셋부터 데이터 소비](#consume-data-from-a-specified-offset) | Kafka 오프셋을 정밀하게 제어해야 합니다. |
| 소비 제어 | [컨슈머 그룹의 group.id 및 client.id 지정](#specify-the-groupid-and-clientid-of-the-consumer-group) | Kafka 컨슈머 식별자를 직접 지정해야 합니다. |
| 데이터 쓰기 제어 | [지정한 파티션에 데이터 적재](#import-data-into-a-specified-partition) | 대상 테이블의 지정된 파티션에만 기록합니다. |
| 데이터 쓰기 제어 | [데이터 적재 시간대 설정](#set-the-import-timezone) | 서로 다른 시간대의 시간 필드를 처리합니다. |
| 데이터 쓰기 제어 | [merge_type 설정](#set-merge_type) | Unique Key 테이블에서 삭제 또는 병합 쓰기를 수행합니다. |
| 데이터 변환 | [데이터 적재 중 컬럼 매핑 및 파생 컬럼 계산](#column-mapping-and-derived-column-computation-in-import) | 데이터 적재 중 필드를 계산합니다. |
| 데이터 변환 | [감싸는 문자가 있는 데이터 적재](#import-data-with-enclosing-characters) | CSV 필드에 구분자가 포함되어 있습니다. |
| 복잡한 형식 | [JSON 형식 데이터 적재](#json-format-import) | Kafka 데이터가 JSON 형식입니다. |
| 복잡한 형식 | [복합 타입 데이터 적재](#import-complex-types) | Array, Map, Bitmap, HLL 등의 타입을 처리합니다. |
| 보안 및 다중 테이블 | [Kafka 보안 인증](#kafka-security-authentication) | SSL/Kerberos/PLAIN 및 기타 인증 시나리오입니다. |
| 보안 및 다중 테이블 | [단일 스트림 다중 테이블 데이터 적재](#single-stream-multi-table-import) | 하나의 토픽에서 여러 Doris 테이블로 데이터를 기록합니다. |

### 데이터 적재의 최대 오류 허용 범위 설정 {#set-maximum-import-fault-tolerance}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,dirty_data
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test01 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job01 ON routine_test01
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "max_filter_ratio"="0.5",
                "max_error_number" = "100",
                "strict_mode" = "true"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test01;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    +------+------------+------+
    2 rows in set (0.01 sec)
    ```

### 지정한 오프셋부터 데이터 소비 {#consume-data-from-a-specified-offset}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test02 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job02 ON routine_test02
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad02",
                "kafka_partitions" = "0",
                "kafka_offsets" = "3"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test02;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### 컨슈머 그룹의 group.id 및 client.id 지정 {#specify-the-groupid-and-clientid-of-the-consumer-group}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test03 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job03 ON routine_test03
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad01",
                "property.group.id" = "kafka_job03",
                "property.client.id" = "kafka_client_03",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test03;
    +------+------------+------+
    | id   | name       | age  |
    +------+------------+------+
    |    1 | Benjamin   |   18 |
    |    2 | Emily      |   20 |
    |    3 | Alexander  |   22 |
    +------+------------+------+
    3 rows in set (0.01 sec)
    ```

### 데이터 적재 필터 조건 설정 {#set-import-filter-conditions}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    4,Sophia,24
    5,William,26
    6,Charlotte,28
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test04 (
        id       INT             NOT NULL   COMMENT "User ID",
        name     VARCHAR(30)     NOT NULL   COMMENT "Name",
        age      INT                        COMMENT "Age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job04 ON routine_test04
            COLUMNS TERMINATED BY ",",
            WHERE id >= 3
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad04",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test04;
    +------+--------------+------+
    | id   | name         | age  |
    +------+--------------+------+
    |    4 | Sophia       |   24 |
    |    5 | William      |   26 |
    |    6 | Charlotte    |   28 |
    +------+--------------+------+
    3 rows in set (0.01 sec)
    ```

### 지정한 파티션에 데이터 적재 {#import-data-into-a-specified-partition}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test05 (
        id      INT            NOT NULL  COMMENT "ID",
        name    VARCHAR(30)    NOT NULL  COMMENT "Name",
        age     INT                      COMMENT "Age",
        date    DATETIME                 COMMENT "Date"
    )
    DUPLICATE KEY(`id`)
    PARTITION BY RANGE(`id`)
    (PARTITION partition_a VALUES [("0"), ("1")),
    PARTITION partition_b VALUES [("1"), ("2")),
    PARTITION partition_c VALUES [("2"), ("3")))
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job05 ON routine_test05
            COLUMNS TERMINATED BY ",",
            PARTITION(partition_b)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad05",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test05;
    +------+----------+------+---------------------+
    | id   | name     | age  | date                |
    +------+----------+------+---------------------+
    |    1 | Benjamin |   18 | 2024-02-04 10:00:00 |
    +------+----------+------+---------------------+
    1 rows in set (0.01 sec)
    ```

### 데이터 적재 시간대 설정 {#set-the-import-timezone}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18,2024-02-04 10:00:00
    2,Emily,20,2024-02-05 11:00:00
    3,Alexander,22,2024-02-06 12:00:00
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test06 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        date    DATETIME                 COMMENT "date"
    )
    DUPLICATE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job06 ON routine_test06
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "timezone" = "Asia/Shanghai"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad06",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test06;
    +------+-------------+------+---------------------+
    | id   | name        | age  | date                |
    +------+-------------+------+---------------------+
    |    1 | Benjamin    |   18 | 2024-02-04 10:00:00 |
    |    2 | Emily       |   20 | 2024-02-05 11:00:00 |
    |    3 | Alexander   |   22 | 2024-02-06 12:00:00 |
    +------+-------------+------+---------------------+
    3 rows in set (0.00 sec)
    ```

### merge_type 설정 {#set-merge_type}

#### merge_type을 지정하여 삭제 수행 {#specify-merge_type-to-perform-delete}

1. 적재할 샘플 데이터:

    ```sql
    3,Alexander,22
    5,William,26
    ```

    데이터 적재 전 테이블의 데이터:

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test07 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job07 ON routine_test07
            WITH DELETE
            COLUMNS TERMINATED BY ","
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad07",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> SELECT * FROM routine_test07;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    4 | Sophia         |   24 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    ```

#### merge_type을 지정하여 병합 수행 {#specify-merge_type-to-perform-merge}

1. 적재할 샘플 데이터:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    데이터 적재 전 테이블의 데이터:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job08 ON routine_test08
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            DELETE ON id = 2
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad08",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> SELECT * FROM routine_test08;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

#### 병합 데이터 적재를 위한 Sequence Column 지정 {#specify-the-sequence-column-for-merge-imports}

1. 적재할 샘플 데이터:

    ```sql
    1,xiaoxiaoli,28
    2,xiaoxiaowang,30
    3,xiaoxiaoliu,32
    4,dadali,34
    5,dadawang,36
    6,dadaliu,38
    ```

    데이터 적재 전 테이블의 데이터:

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    |    4 | Sophia         |   24 |
    |    5 | William        |   26 |
    |    6 | Charlotte      |   28 |
    +------+----------------+------+
    6 rows in set (0.01 sec)
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test08 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    UNIQUE KEY(id)
    DISTRIBUTED BY HASH(id) BUCKETS 1
    PROPERTIES (
        "function_column.sequence_col" = "age"
    );
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job09 ON routine_test09
            WITH MERGE
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age),
            DELETE ON id = 2,
            ORDER BY age
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "strict_mode" = "false"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad09",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> SELECT * FROM routine_test09;
    +------+-------------+------+
    | id   | name        | age  |
    +------+-------------+------+
    |    1 | xiaoxiaoli  |   28 |
    |    3 | xiaoxiaoliu |   32 |
    |    4 | dadali      |   34 |
    |    5 | dadawang    |   36 |
    |    6 | dadaliu     |   38 |
    +------+-------------+------+
    5 rows in set (0.00 sec)
    ```

### 데이터 적재 중 컬럼 매핑 및 파생 컬럼 계산 {#column-mapping-and-derived-column-computation-in-import}

1. 적재할 샘플 데이터:

    ```sql
    1,Benjamin,18
    2,Emily,20
    3,Alexander,22
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test10 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job10 ON routine_test10
            COLUMNS TERMINATED BY ",",
            COLUMNS(id, name, age, num=age*10)
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad10",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> SELECT * FROM routine_test10;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

### 감싸는 문자가 있는 데이터 적재 {#import-data-with-enclosing-characters}

1. 적재할 샘플 데이터:

    ```sql
    1,"Benjamin",18
    2,"Emily",20
    3,"Alexander",22
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test11 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "number"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job11 ON routine_test11
            COLUMNS TERMINATED BY ","
            PROPERTIES
            (
                "desired_concurrent_number"="1",
                "enclose" = "\""
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> SELECT * FROM routine_test11;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.02 sec)
    ```

### JSON 형식 데이터 적재 {#json-format-import}

#### 단순 모드로 JSON 데이터 적재 {#import-json-data-in-simple-mode}

1. 적재할 샘플 데이터:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test12 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job12 ON routine_test12
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad12",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test12;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.02 sec)
    ```

#### 매칭 모드로 복잡한 JSON 데이터 적재 {#import-complex-json-data-in-match-mode}

1. 적재할 샘플 데이터:

    ```sql
    { "name" : "Benjamin", "id" : 1, "num":180 , "age":18 }
    { "name" : "Emily", "id" : 2, "num":200 , "age":20 }
    { "name" : "Alexander", "id" : 3, "num":220 , "age":22 }
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test13 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job13 ON routine_test13
            COLUMNS(name, id, num, age)
            PROPERTIES
            (
                "format" = "json",
                "jsonpaths" = "[\"$.name\",\"$.id\",\"$.num\",\"$.age\"]"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad13",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test13;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

#### JSON 루트 노드를 지정하여 데이터 적재 {#import-data-with-a-specified-json-root-node}

1. 적재할 샘플 데이터:

    ```sql
    {"id": 1231, "source" :{ "id" : 1, "name" : "Benjamin", "age":18 }}
    {"id": 1232, "source" :{ "id" : 2, "name" : "Emily", "age":20 }}
    {"id": 1233, "source" :{ "id" : 3, "name" : "Alexander", "age":22 }}
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test14 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job14 ON routine_test14
            PROPERTIES
            (
                "format" = "json",
                "json_root" = "$.source"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad14",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test14;
    +------+----------------+------+
    | id   | name           | age  |
    +------+----------------+------+
    |    1 | Benjamin       |   18 |
    |    2 | Emily          |   20 |
    |    3 | Alexander      |   22 |
    +------+----------------+------+
    3 rows in set (0.01 sec)
    ```

#### 데이터 적재 중 컬럼 매핑 및 파생 컬럼 계산(JSON) {#column-mapping-and-derived-column-computation-in-import-json}

1. 적재할 샘플 데이터:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18 }
    { "id" : 2, "name" : "Emily", "age":20 }
    { "id" : 3, "name" : "Alexander", "age":22 }
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test15 (
        id      INT            NOT NULL  COMMENT "id",
        name    VARCHAR(30)    NOT NULL  COMMENT "name",
        age     INT                      COMMENT "age",
        num     INT                      COMMENT "num"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job15 ON routine_test15
            COLUMNS(id, name, age, num=age*10)
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad15",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test15;
    +------+----------------+------+------+
    | id   | name           | age  | num  |
    +------+----------------+------+------+
    |    1 | Benjamin       |   18 |  180 |
    |    2 | Emily          |   20 |  200 |
    |    3 | Alexander      |   22 |  220 |
    +------+----------------+------+------+
    3 rows in set (0.01 sec)
    ```

#### 유연한 부분 컬럼 업데이트 {#flexible-partial-column-update}

이 예제에서는 각 행이 서로 다른 컬럼을 업데이트할 수 있는 유연한 부분 컬럼 업데이트의 사용 방법을 설명합니다. 변경 레코드마다 서로 다른 필드가 포함될 수 있으므로 **CDC 시나리오**에서 매우 유용합니다.

1. 적재할 샘플 데이터(각 JSON 레코드가 서로 다른 컬럼을 업데이트함):

    ```json
    {"id": 1, "balance": 150.00, "last_active": "2024-01-15 10:30:00"}
    {"id": 2, "city": "Shanghai", "age": 28}
    {"id": 3, "name": "Alice", "balance": 500.00, "city": "Beijing"}
    {"id": 1, "age": 30}
    {"id": 4, "__DORIS_DELETE_SIGN__": 1}
    ```

2. 테이블을 생성합니다(Merge-on-Write 및 skip bitmap 컬럼을 활성화해야 함).

    ```sql
    CREATE TABLE demo.routine_test_flexible (
        id           INT            NOT NULL  COMMENT "id",
        name         VARCHAR(30)              COMMENT "name",
        age          INT                      COMMENT "age",
        city         VARCHAR(50)              COMMENT "city",
        balance      DECIMAL(10,2)            COMMENT "balance",
        last_active  DATETIME                 COMMENT "last active time"
    )
    UNIQUE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1
    PROPERTIES (
        "replication_num" = "1",
        "enable_unique_key_merge_on_write" = "true",
        "enable_unique_key_skip_bitmap_column" = "true"
    );
    ```

3. 초기 데이터를 삽입합니다.

    ```sql
    INSERT INTO demo.routine_test_flexible VALUES
    (1, 'John', 25, 'Shenzhen', 100.00, '2024-01-01 08:00:00'),
    (2, 'Jane', 30, 'Guangzhou', 200.00, '2024-01-02 09:00:00'),
    (3, 'Bob', 35, 'Hangzhou', 300.00, '2024-01-03 10:00:00'),
    (4, 'Tom', 40, 'Nanjing', 400.00, '2024-01-04 11:00:00');
    ```

4. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job_flexible ON routine_test_flexible
            PROPERTIES
            (
                "format" = "json",
                "unique_key_update_mode" = "UPDATE_FLEXIBLE_COLUMNS"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoadFlexible",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

5. 데이터 적재 결과:

    ```sql
    mysql> SELECT * FROM demo.routine_test_flexible ORDER BY id;
    +------+-------+------+-----------+---------+---------------------+
    | id   | name  | age  | city      | balance | last_active         |
    +------+-------+------+-----------+---------+---------------------+
    |    1 | John  |   30 | Shenzhen  |  150.00 | 2024-01-15 10:30:00 |
    |    2 | Jane  |   28 | Shanghai  |  200.00 | 2024-01-02 09:00:00 |
    |    3 | Alice |   35 | Beijing   |  500.00 | 2024-01-03 10:00:00 |
    +------+-------+------+-----------+---------+---------------------+
    3 rows in set (0.01 sec)
    ```

    :::info 참고
    `id=4`인 행은 `__DORIS_DELETE_SIGN__`으로 인해 삭제됩니다. 각 행은 해당 JSON 레코드에 포함된 컬럼만 업데이트합니다.
    :::

### 복합 타입 데이터 적재 {#import-complex-types}

#### Array 데이터 타입 적재 {#import-array-data-type}

1. 적재할 샘플 데이터:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "array":[1,2,3,4,5]}
    { "id" : 2, "name" : "Emily", "age":20, "array":[6,7,8,9,10]}
    { "id" : 3, "name" : "Alexander", "age":22, "array":[11,12,13,14,15]}
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test16
    (
        id      INT             NOT NULL  COMMENT "id",
        name    VARCHAR(30)     NOT NULL  COMMENT "name",
        age     INT                       COMMENT "age",
        array   ARRAY<int(11)>  NULL      COMMENT "test array column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job16 ON routine_test16
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad16",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test16;
    +------+----------------+------+----------------------+
    | id   | name           | age  | array                |
    +------+----------------+------+----------------------+
    |    1 | Benjamin       |   18 | [1, 2, 3, 4, 5]      |
    |    2 | Emily          |   20 | [6, 7, 8, 9, 10]     |
    |    3 | Alexander      |   22 | [11, 12, 13, 14, 15] |
    +------+----------------+------+----------------------+
    3 rows in set (0.00 sec)
    ```

#### Map 데이터 타입 적재 {#import-map-data-type}

1. 적재할 샘플 데이터:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "map":{"a": 100, "b": 200}}
    { "id" : 2, "name" : "Emily", "age":20, "map":{"c": 300, "d": 400}}
    { "id" : 3, "name" : "Alexander", "age":22, "map":{"e": 500, "f": 600}}
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test17 (
        id      INT                 NOT NULL  COMMENT "id",
        name    VARCHAR(30)         NOT NULL  COMMENT "name",
        age     INT                           COMMENT "age",
        map     Map<STRING, INT>    NULL      COMMENT "test column"
    )
    DUPLICATE KEY(`id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job17 ON routine_test17
        PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad17",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test17;
    +------+----------------+------+--------------------+
    | id   | name           | age  | map                |
    +------+----------------+------+--------------------+
    |    1 | Benjamin       |   18 | {"a":100, "b":200} |
    |    2 | Emily          |   20 | {"c":300, "d":400} |
    |    3 | Alexander      |   22 | {"e":500, "f":600} |
    +------+----------------+------+--------------------+
    3 rows in set (0.01 sec)
    ```

#### Bitmap 데이터 타입 적재 {#import-bitmap-data-type}

1. 적재할 샘플 데이터:

    ```sql
    { "id" : 1, "name" : "Benjamin", "age":18, "bitmap_id":243}
    { "id" : 2, "name" : "Emily", "age":20, "bitmap_id":28574}
    { "id" : 3, "name" : "Alexander", "age":22, "bitmap_id":8573}
    ```

2. 테이블 스키마:

    ```sql
    CREATE TABLE demo.routine_test18 (
        id        INT            NOT NULL      COMMENT "id",
        name      VARCHAR(30)    NOT NULL      COMMENT "name",
        age       INT                          COMMENT "age",
        bitmap_id INT                          COMMENT "test",
        device_id BITMAP         BITMAP_UNION  COMMENT "test column"
    )
    AGGREGATE KEY (`id`,`name`,`age`,`bitmap_id`)
    DISTRIBUTED BY HASH(`id`) BUCKETS 1;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job18 ON routine_test18
            COLUMNS(id, name, age, bitmap_id, device_id=to_bitmap(bitmap_id))
            PROPERTIES
            (
                "format" = "json"
            )
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad18",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select id, BITMAP_UNION_COUNT(pv) over(order by id) uv from(
        ->    select id, BITMAP_UNION(device_id) as pv
        ->    from routine_test18
        -> group by id
        -> ) final;
    +------+------+
    | id   | uv   |
    +------+------+
    |    1 |    1 |
    |    2 |    2 |
    |    3 |    3 |
    +------+------+
    3 rows in set (0.00 sec)
    ```

#### HLL 데이터 타입 적재 {#import-hll-data-type}

1. 적재할 샘플 데이터:

    ```sql
    2022-05-05,10001,Test01,Beijing,windows
    2022-05-05,10002,Test01,Beijing,linux
    2022-05-05,10003,Test01,Beijing,macos
    2022-05-05,10004,Test01,Hebei,windows
    2022-05-06,10001,Test01,Shanghai,windows
    2022-05-06,10002,Test01,Shanghai,linux
    2022-05-06,10003,Test01,Jiangsu,macos
    2022-05-06,10004,Test01,Shaanxi,windows
    ```

2. 테이블 스키마:

    ```sql
    create table demo.routine_test19 (
        dt        DATE,
        id        INT,
        name      VARCHAR(10),
        province  VARCHAR(10),
        os        VARCHAR(10),
        pv        hll hll_union
    )
    Aggregate KEY (dt,id,name,province,os)
    distributed by hash(id) buckets 10;
    ```

3. 데이터 적재 명령:

    ```sql
    CREATE ROUTINE LOAD demo.kafka_job19 ON routine_test19
            COLUMNS TERMINATED BY ",",
            COLUMNS(dt, id, name, province, os, pv=hll_hash(id))
            FROM KAFKA
            (
                "kafka_broker_list" = "10.16.10.6:9092",
                "kafka_topic" = "routineLoad19",
                "property.kafka_default_offsets" = "OFFSET_BEGINNING"
            );
    ```

4. 데이터 적재 결과:

    ```sql
    mysql> select * from routine_test19;
    +------------+-------+----------+----------+---------+------+
    | dt         | id    | name     | province | os      | pv   |
    +------------+-------+----------+----------+---------+------+
    | 2022-05-05 | 10001 | Test01   | Beijing     | windows | NULL |
    | 2022-05-06 | 10001 | Test01   | Shanghai    | windows | NULL |
    | 2022-05-05 | 10002 | Test01   | Beijing     | linux   | NULL |
    | 2022-05-06 | 10002 | Test01   | Shanghai    | linux   | NULL |
    | 2022-05-05 | 10004 | Test01   | Heibei      | windows | NULL |
    | 2022-05-06 | 10004 | Test01   | Shanxi      | windows | NULL |
    | 2022-05-05 | 10003 | Test01   | Beijing     | macos   | NULL |
    | 2022-05-06 | 10003 | Test01   | Jiangsu     | macos   | NULL |
    +------------+-------+----------+----------+---------+------+
    8 rows in set (0.01 sec)

    mysql> SELECT HLL_UNION_AGG(pv) FROM routine_test19;
    +-------------------+
    | hll_union_agg(pv) |
    +-------------------+
    |                 4 |
    +-------------------+
    1 row in set (0.01 sec)
    ```

### Kafka 보안 인증 {#kafka-security-authentication}

Doris는 다음과 같은 Kafka 보안 프로토콜 접근 방식을 지원합니다. 아래에 데이터 적재 예제와 매개변수 설명을 제공합니다.

#### SSL 인증을 사용하여 Kafka 데이터 적재 {#import-kafka-data-with-ssl-authentication}

데이터 적재 명령 예시:

```sql
CREATE ROUTINE LOAD demo.kafka_job20 ON routine_test20
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad21",
            "property.security.protocol" = "ssl",
            "property.ssl.ca.location" = "FILE:ca.pem",
            "property.ssl.certificate.location" = "FILE:client.pem",
            "property.ssl.key.location" = "FILE:client.key",
            "property.ssl.key.password" = "ssl_passwd"
        );
```

매개변수 설명:

| 매개변수                         | 설명                                                  |
| --------------------------------- | ------------------------------------------------------------ |
| property.security.protocol        | 사용하는 보안 프로토콜입니다. 위 예제에서는 SSL을 사용합니다. |
| property.ssl.ca.location          | CA(인증 기관) 인증서의 위치입니다.  |
| property.ssl.certificate.location | (Kafka 서버에서 클라이언트 인증이 활성화된 경우에만 필수) 클라이언트 공개 키의 위치입니다. |
| property.ssl.key.location         | (Kafka 서버에서 클라이언트 인증이 활성화된 경우에만 필수) 클라이언트 개인 키의 위치입니다. |
| property.ssl.key.password         | (Kafka 서버에서 클라이언트 인증이 활성화된 경우에만 필수) 클라이언트 개인 키의 비밀번호입니다. |

#### Kerberos 인증을 사용하여 Kafka 데이터 적재 {#import-kafka-data-with-kerberos-authentication}

데이터 적재 명령 예시:

```sql
CREATE ROUTINE LOAD demo.kafka_job21 ON routine_test21
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad21",
            "property.security.protocol" = "SASL_PLAINTEXT",
            "property.sasl.kerberos.service.name" = "kafka",
            "property.sasl.kerberos.keytab"="/opt/third/kafka/kerberos/kafka_client.keytab",
            "property.sasl.kerberos.principal" = "clients/stream.dt.local@EXAMPLE.COM"
        );
```

매개변수 설명:

| 매개변수                           | 설명                                         |
| ----------------------------------- | --------------------------------------------------- |
| property.security.protocol          | 사용하는 보안 프로토콜입니다. 위 예제에서는 SASL_PLAINTEXT를 사용합니다. |
| property.sasl.kerberos.service.name | 브로커 서비스 이름을 지정합니다. 기본값은 Kafka입니다. |
| property.sasl.kerberos.keytab       | keytab 파일의 위치입니다.                    |
| property.sasl.kerberos.principal    | Kerberos principal을 지정합니다.                   |

:::tip 팁
`rdnbs=true`를 `krb5.conf`에 설정하는 것이 좋습니다. 그렇지 않으면 다음 오류가 발생할 수 있습니다. `Server kafka/15.5.4.68@EXAMPLE.COM not found in Kerberos database`
:::

#### PLAIN 인증을 사용하여 Kafka 클러스터 데이터 적재 {#import-a-kafka-cluster-with-plain-authentication}

데이터 적재 명령 예시:

```sql
CREATE ROUTINE LOAD demo.kafka_job22 ON routine_test22
        PROPERTIES
        (
            "format" = "json"
        )
        FROM KAFKA
        (
            "kafka_broker_list" = "192.168.100.129:9092",
            "kafka_topic" = "routineLoad22",
            "property.security.protocol"="SASL_PLAINTEXT",
            "property.sasl.mechanism"="PLAIN",
            "property.sasl.username"="admin",
            "property.sasl.password"="admin"
        );
```

매개변수 설명:

| 매개변수                  | 설명                                         |
| -------------------------- | --------------------------------------------------- |
| property.security.protocol | 사용하는 보안 프로토콜입니다. 위 예제에서는 SASL_PLAINTEXT를 사용합니다. |
| property.sasl.mechanism    | SASL 인증 메커니즘을 PLAIN으로 지정합니다. |
| property.sasl.username     | SASL 사용자 이름입니다.                                  |
| property.sasl.password     | SASL 비밀번호입니다.                                  |

#### 암호화 인증을 사용하는 Kafka 서비스에 연결(StreamNative 예제) {#connect-to-a-kafka-service-with-encrypted-authentication-streamnative-example}

StreamNative 메시징 서비스에 접근하는 경우를 예로 들면 다음과 같습니다.

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(user_id, name, age)
FROM KAFKA (
    "kafka_broker_list" = "pc-xxxx.aws-mec1-test-xwiqv.aws.snio.cloud:9093",
    "kafka_topic" = "my_topic",
    "property.security.protocol" = "SASL_SSL",
    "property.sasl.mechanism" = "PLAIN",
    "property.sasl.username" = "user",
    "property.sasl.password" = "token:eyJhbxxx",
    "property.group.id" = "my_group_id_1",
    "property.client.id" = "my_client_id_1",
    "property.enable.ssl.certificate.verification" = "false"
);
```

:::caution 참고
- BE 측에 신뢰할 수 있는 CA 인증서 경로가 설정되어 있지 않으면 `"property.enable.ssl.certificate.verification" = "false"`로 설정하여 서버 인증서 검증을 건너뜁니다.
- 그렇지 않은 경우 신뢰할 수 있는 CA 인증서 경로를 설정합니다. `"property.ssl.ca.location" = "/path/to/ca-cert.pem"`.
:::

### 단일 스트림 다중 테이블 데이터 적재 {#single-stream-multi-table-import}

`test1`이라는 이름의 Kafka Routine Load 동적 다중 테이블 데이터 적재 태스크를 `example_db`에 생성합니다. `group.id`와 `client.id`를 지정하고, 기본적으로 모든 파티션을 자동으로 소비하며, 데이터가 존재하는 위치(`OFFSET_BEGINNING`)부터 구독합니다.

Kafka의 데이터를 `tbl1`과 `tbl2` 테이블에 적재해야 하며, 이 테이블들이 `example_db`에 있다고 가정해 보겠습니다. `test1`이라는 이름의 Routine Load 태스크를 생성하여 Kafka 토픽 `my_topic`의 데이터를 `tbl1`과 `tbl2`에 모두 적재할 수 있습니다.

```sql
CREATE ROUTINE LOAD example_db.test1
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic",
    "property.kafka_default_offsets" = "OFFSET_BEGINNING"
);
```

이 경우 Kafka 데이터에 테이블 이름이 포함되어야 합니다. 현재 동적 테이블 이름은 Kafka Value에서 추출하는 방식만 지원하며, 데이터는 다음 형식을 따라야 합니다. JSON의 경우 `table_name|{"col1": "val1", "col2": "val2"}` 형식이며, 여기서 `tbl_name`은 테이블 이름이고 `|`는 테이블 이름과 테이블 데이터 사이의 구분자입니다. CSV 형식 데이터도 유사합니다. 예: `table_name|val1,val2,val3`.

:::caution 참고
여기서 `table_name`은 Doris의 테이블 이름과 정확히 일치해야 합니다. 그렇지 않으면 데이터 적재가 실패합니다. 동적 테이블은 `column_mapping`을 지원하지 않습니다.
:::

### 엄격 모드 데이터 적재 {#strict-mode-import}

`test1`이라는 이름의 Kafka Routine Load 태스크를 생성합니다. 대상은 `example_tbl`이며, 해당 테이블은 `example_db`에 있고 엄격 모드를 활성화합니다.

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl
COLUMNS(k1, k2, k3, v1, v2, v3 = k1 * 100),
PRECEDING FILTER k1 = 1,
WHERE k1 < 100 and k2 like "%doris%"
PROPERTIES
(
    "strict_mode" = "true"
)
FROM KAFKA
(
    "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
    "kafka_topic" = "my_topic"
);
```

## 자주 묻는 질문(FAQ) {#frequently-asked-questions-faq}

<!-- Knowledge type: FAQ / Troubleshooting -->
<!-- Applicable scenarios: Troubleshooting / Error diagnosis -->

### Routine Load 작업이 자동으로 PAUSED 상태가 되면 어떻게 해야 하나요? {#what-should-i-do-if-a-routine-load-job-automatically-enters-the-paused-state}

일반적으로 데이터 품질 문제나 Kafka 측 예외가 원인입니다.

1. `SHOW ROUTINE LOAD FOR <job_name>`을 실행하여 `ReasonOfStateChanged`와 `ErrorLogUrls`를 확인합니다.
2. 더티 데이터가 원인이라면 `max_filter_ratio`와 `max_error_number`를 적절히 늘립니다.
3. Kafka 예외가 원인이라면 브로커와 토픽에 접근할 수 있는지 확인한 후 `RESUME ROUTINE LOAD`를 실행하여 복구합니다.

### `Offset out of range` 또는 `out of range` 오류는 어떻게 처리하나요? {#how-to-handle-the-offset-out-of-range-or-out-of-range-error}

일반적으로 기록된 오프셋이 이미 Kafka에서 삭제되었음을 의미합니다(보존 정책에 따라 정리됨).

1. 작업을 일시 중지합니다. `PAUSE ROUTINE LOAD FOR <job_name>`.
2. `ALTER ROUTINE LOAD`를 사용하여 `kafka_offsets`를 유효한 위치(예: `OFFSET_BEGINNING` 또는 특정 오프셋)로 재설정합니다.
3. `RESUME ROUTINE LOAD`를 실행하여 작업을 복구합니다.

### `Server kafka/xxx@EXAMPLE.COM not found in Kerberos database` 오류가 발생하나요? {#server-kafkaxxxexamplecom-not-found-in-kerberos-database}

Kerberos 인증을 사용하는 경우 `rdnbs=true`를 `krb5.conf`에 설정합니다.

### `Server certificate verification failed` 또는 기타 SSL 오류가 발생하나요? {#server-certificate-verification-failed-or-other-ssl-errors}

BE 측에 신뢰할 수 있는 CA 인증서가 설정되어 있지 않으면 `"property.enable.ssl.certificate.verification" = "false"`로 설정하거나, `"property.ssl.ca.location" = "/path/to/ca-cert.pem"`을 명시적으로 지정합니다.

### 목표 동시 실행 수(`desired_concurrent_number`)가 적용되지 않나요? {#the-desired-concurrency-desired_concurrent_number-does-not-take-effect}

실제 동시 실행 수는 다음 세 값 중 최솟값으로 결정됩니다.

```text
min(topic_partition_num, desired_concurrent_number, max_routine_load_task_concurrent_num)
```

Kafka 토픽의 파티션 수와 FE 설정 `max_routine_load_task_concurrent_num`을 확인합니다.

### 이전 Kafka 버전(< 0.10.0.0)은 어떻게 사용하나요? {#how-to-use-an-older-kafka-version--01000}

BE 설정에서 `kafka_broker_version_fallback`을 설정하거나, 작업 생성 시 `property.broker.version.fallback`으로 호환할 버전을 지정합니다.

### 단일 스트림 다중 테이블 데이터 적재의 대상 테이블은 어떻게 지정하나요? {#how-to-specify-the-target-table-for-single-stream-multi-table-import}

Kafka 메시지의 Value에 `table_name|<data>` 형식으로 테이블 이름을 포함해야 하며, 테이블 이름은 Doris의 테이블 이름과 정확히 일치해야 합니다. 동적 테이블은 `column_mapping`을 지원하지 않습니다.

### 적재에 실패한 더티 데이터는 어떻게 확인하나요? {#how-to-view-the-dirty-data-that-failed-to-import}

`SHOW ROUTINE LOAD FOR <job_name>`을 실행하고 결과의 `ErrorLogUrls` 필드를 확인합니다. 브라우저나 `wget`으로 해당 URL에 접근하여 필터링된 오류 데이터 샘플과 오류 원인을 확인할 수 있습니다.

### Routine Load 작업을 수정하기 전에 반드시 일시 중지해야 하나요? {#must-i-pause-a-routine-load-job-before-modifying-it}

예. `ALTER ROUTINE LOAD` 명령을 사용하려면 작업이 `PAUSED` 상태여야 합니다. 수정 절차는 다음과 같습니다. `PAUSE ROUTINE LOAD` -> `ALTER ROUTINE LOAD` -> `RESUME ROUTINE LOAD`.

## 추가 도움말 {#more-help}

- SQL 매뉴얼 참조: [CREATE ROUTINE LOAD](../../../sql-manual/sql-statements/data-modification/load-and-export/CREATE-ROUTINE-LOAD)
- 클라이언트 명령줄에서 `HELP ROUTINE LOAD`를 실행하면 더 많은 도움말을 확인할 수 있습니다.
