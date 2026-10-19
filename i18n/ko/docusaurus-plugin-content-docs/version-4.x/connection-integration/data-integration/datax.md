---
{
    "title": "DataX Doriswriter",
    "language": "ko",
    "description": "DataX Doriswriter를 사용하여 MySQL, Oracle, SQL Server 등의 소스에서 Apache Doris로 Stream Load를 통해 데이터를 동기화하는 방법을 매개변수 설정 및 데이터 적재 예제와 함께 설명합니다.",
    "keywords": [
        "DataX Doriswriter",
        "DataX에서 Doris로 데이터 적재",
        "Stream Load",
        "MySQL에서 Doris로 동기화"
    ]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Data integration / Offline batch synchronization -->

[DataX](https://github.com/alibaba/DataX) Doriswriter 플러그인은 MySQL, Oracle, SQL Server 등 다양한 소스의 데이터를 Stream Load를 통해 Doris로 동기화합니다.

이미 DataX를 사용하여 오프라인으로 데이터를 동기화하고 있거나, DataX가 지원하는 소스의 데이터를 Doris에 써야 한다면 Doriswriter를 DataX의 Writer 플러그인으로 사용할 수 있습니다. 이 문서는 사용자 설정 순서에 따라 플러그인을 구하고, 매개변수를 설정하고, 작업을 실행하는 방법을 설명하며, JSON 및 CSV 데이터 적재 형식의 주의 사항을 안내합니다.

DataX Doriswriter를 사용하는 주요 단계는 다음과 같습니다.

1. DataX 설치 패키지를 구하거나 Doriswriter 플러그인을 직접 컴파일합니다.
2. Doriswriter가 Doris에 데이터를 쓰는 데 필요한 연결, 배치, Stream Load 매개변수를 설정합니다.
3. DataX 작업 스크립트를 작성하고 동기화 작업을 실행합니다.
4. 구분자 충돌을 방지하도록 데이터 형식에 맞게 `loadProps`를 조정합니다.

## 사전 점검 {#pre-flight-check}

| 항목 | 설명 |
| --- | --- |
| DataX 서비스 | Doriswriter는 DataX 서비스와 함께 사용해야 합니다. |
| 소스 지원 | DataX는 다양한 데이터 소스를 지원합니다. 지원 목록은 [DataX 지원 데이터 채널](https://github.com/alibaba/DataX#support-data-channels)을 참조하세요. |
| Doris 데이터 적재 진입점 | Doriswriter는 Stream Load를 통해 Doris에 데이터를 씁니다. `loadUrl`에는 FE 노드의 `http_port`를 설정해야 합니다. |

## DataX 및 Doriswriter 준비 {#obtain-datax-and-doriswriter}

### DataX 설치 패키지 직접 다운로드 {#download-the-datax-installation-package-directly}

DataX는 바로 사용할 수 있는 설치 패키지를 제공합니다. 다운로드 링크는 [DataX 설치 패키지 다운로드](https://github.com/alibaba/DataX?tab=readme-ov-file#download-datax%E4%B8%8B%E8%BD%BD%E5%9C%B0%E5%9D%80)를 참조하세요.

### Doriswriter 플러그인 직접 컴파일 {#compile-the-doriswriter-plugin-yourself}

Doriswriter 플러그인을 직접 컴파일하려면 먼저 [Doriswriter 플러그인 소스 코드](https://github.com/apache/doris/tree/master/extension/DataX)를 다운로드합니다.

1. `init-env.sh`를 실행합니다.
2. `doriswriter` 플러그인을 별도로 컴파일합니다.

    ```shell
    mvn clean install -pl plugin-rdbms-util,doriswriter -DskipTests
    ```

DataX 프로젝트 전체를 컴파일하려면 [DataX 빠른 시작](https://github.com/alibaba/DataX/blob/master/userGuid.md#quick-start)을 참조하세요.

#### `datax-all` 의존성 오류 해결 {#resolve-the-datax-all-dependency-error}

컴파일 중 다음 오류가 발생하는 경우:

```text
Could not find artifact com.alibaba.datax:datax-all:pom:0.0.1-SNAPSHOT ...
```

다음과 같이 해결합니다.

1. [alibaba-datax-maven-m2-20210928.tar.gz](https://doris-thirdparty-repo.bj.bcebos.com/thirdparty/alibaba-datax-maven-m2-20210928.tar.gz)를 다운로드합니다.
2. 압축을 푼 후 생성된 `alibaba/datax/` 디렉터리를 로컬 Maven이 사용하는 `.m2/repository/com/alibaba/` 디렉터리에 복사한 다음 다시 컴파일합니다.

## Doriswriter 매개변수 설정 {#configure-doriswriter-parameters}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: DataX job configuration -->

Doriswriter 매개변수는 Doris 연결, 대상 데이터베이스 및 테이블, 배치 크기, 실패 시 재시도, Stream Load 요청 속성을 제어합니다.

| 매개변수 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `jdbcUrl` | 예 | 없음 | Doris의 JDBC 연결 문자열로, `preSql` 또는 `postSql`을 실행하는 데 사용합니다. |
| `loadUrl` | 예 | 없음 | Stream Load의 대상 주소입니다. 형식은 `ip:port`이며, `ip`는 FE 노드의 IP, `port`는 FE 노드의 `http_port`입니다. 쉼표(`,`)로 구분하여 여러 주소를 지정할 수 있으며, doriswriter는 라운드 로빈 방식으로 각 주소에 접근합니다. |
| `username` | 예 | 없음 | Doris 데이터베이스에 접근할 때 사용하는 사용자 이름입니다. |
| `password` | 아니요 | 빈 문자열 | Doris 데이터베이스에 접근할 때 사용하는 비밀번호입니다. |
| `connection.selectedDatabase` | 예 | 없음 | 데이터를 쓸 Doris 데이터베이스의 이름입니다. |
| `connection.table` | 예 | 없음 | 데이터를 쓸 Doris 테이블의 이름입니다. |
| `flushInterval` | 아니요 | `30000` ms | 데이터를 쓰는 배치 간 시간 간격입니다. 값을 너무 작게 설정하면 Doris의 쓰기가 차단되고 오류 코드 `-235`가 반환될 수 있습니다. 이 값이 너무 작으면 `maxBatchRows`와 `batchSize`를 크게 설정해도 행 수 또는 크기 임계값에 도달하기 전에 데이터 적재가 시작될 수 있습니다. |
| `column` | 예 | 없음 | 대상 테이블에서 데이터를 쓸 필드입니다. 이 필드 이름은 생성되는 JSON 데이터의 필드 이름으로 사용됩니다. 필드는 쉼표로 구분합니다. 예: `"column": ["id", "name", "age"]`. |
| `preSql` | 아니요 | 없음 | 대상 테이블에 데이터를 쓰기 전에 실행할 표준 SQL 문입니다. |
| `postSql` | 아니요 | 없음 | 대상 테이블에 데이터를 쓴 후 실행할 표준 SQL 문입니다. |
| `maxBatchRows` | 아니요 | `500000` | 데이터 적재 배치당 최대 행 수입니다. 이 매개변수는 `batchSize`와 함께 각 데이터 적재 배치의 크기를 제어하며, 두 임계값 중 하나에 도달하면 즉시 데이터 적재가 시작됩니다. |
| `batchSize` | 아니요 | `94371840` | 데이터 적재 배치당 최대 데이터 용량입니다. 이 매개변수는 `maxBatchRows`와 함께 각 데이터 적재 배치의 크기를 제어하며, 두 임계값 중 하나에 도달하면 즉시 데이터 적재가 시작됩니다. |
| `maxRetries` | 아니요 | `3` | 배치 데이터 적재가 실패한 후 재시도하는 횟수입니다. |
| `labelPrefix` | 아니요 | `datax_doris_writer_` | 각 데이터 적재 작업의 레이블 접두사입니다. 최종 레이블은 `labelPrefix + UUID`로, 전역 고유성을 보장하고 중복 데이터 적재를 방지합니다. |
| `loadProps` | 아니요 | 없음 | Stream Load 요청 매개변수입니다. 데이터 적재 형식, 구분자 및 기타 속성을 설정할 수 있습니다. 기본 데이터 적재 형식은 CSV이며 JSON도 지원합니다. 추가 매개변수는 [Stream Load 문서](../../data-operate/import/import-way/stream-load-manual.md)를 참조하세요. |

## 사용 예제 {#usage-examples}

### 시나리오 1: Stream에서 데이터를 읽어 Doris에 적재 {#scenario-1-read-data-from-a-stream-and-import-it-into-doris}

플러그인을 사용하여 Stream에서 데이터를 읽고 Doris에 적재하는 방법은 [Doriswriter 공식 예제](https://github.com/apache/doris/blob/master/extension/DataX/doriswriter/doc/doriswriter.md)를 참조하세요.

### 시나리오 2: MySQL에서 데이터를 읽어 Doris에 적재 {#scenario-2-read-data-from-mysql-and-import-it-into-doris}

다음 예제는 DataX를 사용하여 MySQL에서 데이터를 읽고 Doriswriter를 통해 Doris에 쓰는 방법을 보여 줍니다.

#### 1. MySQL 소스 테이블 준비 {#1-prepare-the-mysql-source-table}

```sql
CREATE TABLE `t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT '',
    PRIMARY KEY (`id`) USING BTREE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 ROW_FORMAT=DYNAMIC COMMENT='';
```

#### 2. Doris 대상 테이블 준비 {#2-prepare-the-doris-target-table}

```sql
CREATE TABLE `ods_t_test` (
    `id` bigint(30) NOT NULL,
    `order_code` varchar(30) DEFAULT NULL COMMENT '',
    `line_code` varchar(30) DEFAULT NULL COMMENT '',
    `remark` varchar(30) DEFAULT NULL COMMENT '',
    `unit_no` varchar(30) DEFAULT NULL COMMENT '',
    `unit_name` varchar(30) DEFAULT NULL COMMENT '',
    `price` decimal(12,2) DEFAULT NULL COMMENT ''
) ENGINE=OLAP
UNIQUE KEY(`id`, `order_code`)
DISTRIBUTED BY HASH(`order_code`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3",
    "in_memory" = "false",
    "storage_format" = "V2"
);
```

#### 3. DataX 작업 스크립트 작성 {#3-create-the-datax-job-script}

`my_import.json`을 생성합니다. 실제 사용 시에는 `reader`의 소스 데이터베이스와 테이블, 그리고 `writer`의 Doris 대상 데이터베이스와 테이블, 사용자 이름, 비밀번호를 환경에 맞는 값으로 바꿉니다.

```json
{
    "job": {
        "content": [
            {
                "reader": {
                    "name": "mysqlreader",
                    "parameter": {
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "connection": [
                            {
                                "jdbcUrl": ["jdbc:mysql://localhost:3306/demo"],
                                "table": ["employees_1"]
                            }
                        ],
                        "username": "root",
                        "password": "xxxxx",
                        "where": ""
                    }
                },
                "writer": {
                    "name": "doriswriter",
                    "parameter": {
                        "loadUrl": ["127.0.0.1:8030"],
                        "column": ["id", "order_code", "line_code", "remark", "unit_no", "unit_name", "price"],
                        "username": "root",
                        "password": "xxxxxx",
                        "postSql": ["select count(1) from all_employees_info"],
                        "preSql": [],
                        "flushInterval": 30000,
                        "connection": [
                            {
                                "jdbcUrl": "jdbc:mysql://127.0.0.1:9030/demo",
                                "selectedDatabase": "demo",
                                "table": ["all_employees_info"]
                            }
                        ],
                        "loadProps": {
                            "format": "json",
                            "strip_outer_array": "true",
                            "line_delimiter": "\\x02"
                        }
                    }
                }
            }
        ],
        "setting": {
            "speed": {
                "channel": "1"
            }
        }
    }
}
```

#### 4. 데이터 적재 형식 설정 {#4-configure-the-import-data-format}

위 예제는 JSON 형식으로 데이터를 적재합니다.

```json
"loadProps": {
    "format": "json",
    "strip_outer_array": "true",
    "line_delimiter": "\\x02"
}
```

JSON 형식의 주의 사항:

1. `line_delimiter`의 기본값은 줄바꿈 문자이므로 데이터에 포함된 값과 충돌할 수 있습니다. 데이터 적재 오류를 방지하려면 특수 문자나 눈에 보이지 않는 문자를 사용하세요.
2. `strip_outer_array`는 적재할 데이터 배치에 여러 행이 포함되어 있음을 나타냅니다. Doris는 파싱할 때 바깥쪽 배열을 펼치고 그 안의 각 Object를 개별 행으로 파싱합니다.
3. 추가 Stream Load 매개변수는 [Stream Load 문서](../../data-operate/import/import-way/stream-load-manual.md)를 참조하세요.

CSV 형식을 사용하려면 다음과 같이 설정합니다.

```json
"loadProps": {
    "format": "csv",
    "column_separator": "\\x01",
    "line_delimiter": "\\x02"
}
```

CSV 형식에서는 행 및 열 구분자가 데이터의 특수 문자와 충돌하지 않도록 특히 주의해야 합니다. 눈에 보이지 않는 문자를 사용하는 것이 좋습니다. 기본 열 구분자는 `\t`이고, 기본 행 구분자는 `\n`입니다.

#### 5. DataX 작업 실행 {#5-run-the-datax-job}

다음 명령으로 작업을 실행합니다. 다른 작업 실행 방법은 [DataX 사용자 가이드](https://github.com/alibaba/DataX/blob/master/userGuid.md)를 참조하세요.

```shell
python bin/datax.py my_import.json
```

실행에 성공하면 다음과 유사한 로그가 표시됩니다.

```text
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - jobContainer starts to do prepare ...
2022-11-16 14:28:54.012 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do prepare work .
2022-11-16 14:28:54.013 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do prepare work .
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - jobContainer starts to do split ...
2022-11-16 14:28:54.020 [job-0] INFO  JobContainer - Job set Channel-Number to 1 channels.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] splits to [1] tasks.
2022-11-16 14:28:54.023 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] splits to [1] tasks.
2022-11-16 14:28:54.033 [job-0] INFO  JobContainer - jobContainer starts to do schedule ...
2022-11-16 14:28:54.036 [job-0] INFO  JobContainer - Scheduler starts [1] taskGroups.
2022-11-16 14:28:54.037 [job-0] INFO  JobContainer - Running by standalone Mode.
2022-11-16 14:28:54.041 [taskGroup-0] INFO  TaskGroupContainer - taskGroupId=[0] start [1] channels for [1] tasks.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set byte_speed_limit to -1, No bps activated.
2022-11-16 14:28:54.043 [taskGroup-0] INFO  Channel - Channel set record_speed_limit to -1, No tps activated.
2022-11-16 14:28:54.049 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] attemptCount[1] is started
2022-11-16 14:28:54.052 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Begin to read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
Wed Nov 16 14:28:54 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:28:54.071 [0-0-0-reader] INFO  CommonRdbmsReader$Task - Finished read record by Sql: [select taskid,projectid,taskflowid,templateid,template_name,status_task from dwd_universal_tb_task
] jdbcUrl:[jdbc:mysql://localhost:3306/demo?yearIsDateType=false&zeroDateTimeBehavior=convertToNull&tinyInt1isBit=false&rewriteBatchedStatements=true].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Start to join batch data: rows[2] bytes[438] label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.104 [Thread-1] INFO  DorisStreamLoadObserver - Executing stream load to: 'http://127.0.0.1:8030/api/demo/dwd_universal_tb_task/_stream_load', size: '441'
2022-11-16 14:28:54.224 [Thread-1] INFO  DorisStreamLoadObserver - StreamLoad response :{"Status":"Success","BeginTxnTimeMs":0,"Message":"OK","NumberUnselectedRows":0,"CommitAndPublishTimeMs":17,"Label":"datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f","LoadBytes":441,"StreamLoadPutTimeMs":1,"NumberTotalRows":2,"WriteDataTimeMs":11,"TxnId":217056,"LoadTimeMs":31,"TwoPhaseCommit":"false","ReadDataTimeMs":0,"NumberLoadedRows":2,"NumberFilteredRows":0}
2022-11-16 14:28:54.225 [Thread-1] INFO  DorisWriterManager - Async stream load finished: label[datax_doris_writer_c4e08cb9-c157-4689-932f-db34acc45b6f].
2022-11-16 14:28:54.249 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] taskId[0] is successed, used[201]ms
2022-11-16 14:28:54.250 [taskGroup-0] INFO  TaskGroupContainer - taskGroup[0] completed it's tasks.
2022-11-16 14:29:04.048 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.049 [job-0] INFO  AbstractScheduler - Scheduler accomplished all tasks.
2022-11-16 14:29:04.049 [job-0] INFO  JobContainer - DataX Writer.Job [doriswriter] do post work.
Wed Nov 16 14:29:04 GMT+08:00 2022 WARN: Establishing SSL connection without server's identity verification is not recommended. According to MySQL 5.5.45+, 5.6.26+ and 5.7.6+ requirements SSL connection must be established by default if explicit option isn't set. For compliance with existing applications not using SSL the verifyServerCertificate property is set to 'false'. You need either to explicitly disable SSL by setting useSSL=false, or set useSSL=true and provide truststore for server certificate verification.
2022-11-16 14:29:04.187 [job-0] INFO  DorisWriter$Job - Start to execute preSqls:[select count(1) from dwd_universal_tb_task]. context info:jdbc:mysql://172.16.0.13:9030/demo.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX Reader.Job [mysqlreader] do post work.
2022-11-16 14:29:04.204 [job-0] INFO  JobContainer - DataX jobId [0] completed successfully.
2022-11-16 14:29:04.204 [job-0] INFO  HookInvoker - No hook invoked, because base dir not exists or is a file: /data/datax/hook
2022-11-16 14:29:04.205 [job-0] INFO  JobContainer -
         [total cpu info] =>
                averageCpu                     | maxDeltaCpu                    | minDeltaCpu
                -1.00%                         | -1.00%                         | -1.00%


         [total gc info] =>
                 NAME                 | totalGCCount       | maxDeltaGCCount    | minDeltaGCCount    | totalGCTime        | maxDeltaGCTime     | minDeltaGCTime
                 PS MarkSweep         | 1                  | 1                  | 1                  | 0.017s             | 0.017s             | 0.017s
                 PS Scavenge          | 1                  | 1                  | 1                  | 0.007s             | 0.007s

2022-11-16 14:29:04.205 [job-0] INFO  JobContainer - PerfTrace not enable!
2022-11-16 14:29:04.206 [job-0] INFO  StandAloneJobContainerCommunicator - Total 2 records, 214 bytes | Speed 21B/s, 0 records/s | Error 0 records, 0 bytes |  All Task WaitWriterTime 0.000s |  All Task WaitReaderTime 0.000s | Percentage 100.00%
2022-11-16 14:29:04.206 [job-0] INFO  JobContainer -
Job start time                  : 2022-11-16 14:28:53
Job end time                    : 2022-11-16 14:29:04
Total job duration              :                 10s
Average job throughput          :               21B/s
Record write speed              :              0rec/s
Total records read              :                   2
Total read/write failures       :                   0
```

## 데이터 적재 시 주의 사항 및 모범 사례 {#import-considerations-and-best-practices}

- `flushInterval`을 너무 작게 설정하지 마세요. 값이 너무 작으면 Doris의 쓰기가 차단되고 오류 코드 `-235`가 반환될 수 있으며, `maxBatchRows` 또는 `batchSize` 임계값에 도달하기 전에 데이터 적재가 시작될 수도 있습니다.
- CSV 형식을 사용할 때는 `column_separator`와 `line_delimiter`가 데이터의 값과 충돌하는지 주의 깊게 확인하세요. 충돌 가능성을 줄이려면 눈에 보이지 않는 문자를 사용하세요.
- JSON 형식에서 배치가 배열인 경우, `strip_outer_array = true`를 설정하여 Doris가 배열의 각 Object를 행으로 파싱하도록 하세요.
- `labelPrefix`는 UUID와 결합하여 전역적으로 고유한 레이블을 생성하므로 중복 데이터 적재를 방지합니다.
- `loadUrl`에는 쉼표로 구분하여 여러 FE 주소를 지정할 수 있으며, doriswriter는 라운드 로빈 방식으로 각 주소에 접근합니다.

## 자주 묻는 질문 {#faq}

### DataX Doriswriter는 MySQL 데이터만 동기화할 수 있나요? {#can-datax-doriswriter-only-synchronize-mysql-data}

아니요. DataX는 다양한 데이터 소스를 지원합니다. 이 문서의 전체 예제는 MySQL을 사용하지만, DataX가 지원하는 다른 소스의 데이터도 Doriswriter를 통해 Doris에 쓸 수 있습니다.

### `loadUrl`은 어떤 포트를 사용해야 하나요? {#which-port-should-loadurl-use}

`loadUrl`은 FE 노드의 `http_port`를 사용하며, 형식은 `ip:port`입니다. 여러 주소를 지정하면 doriswriter는 라운드 로빈 방식으로 각 주소에 접근합니다.

### JSON 또는 CSV 형식으로 데이터를 적재할 때 구분자에 주의해야 하는 이유는 무엇인가요? {#why-pay-attention-to-delimiters-when-importing-in-json-or-csv-format}

`line_delimiter` 또는 `column_separator`가 데이터에 포함된 문자와 충돌하여 데이터 적재 오류를 일으킬 수 있습니다. 충돌 가능성을 줄이려면 특수 문자나 눈에 보이지 않는 문자를 구분자로 사용하세요.
