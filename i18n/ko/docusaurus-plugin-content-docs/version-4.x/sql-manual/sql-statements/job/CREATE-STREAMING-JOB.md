---
{
    "title": "CREATE STREAMING JOB",
    "language": "ko",
    "description": "Doris Streaming Job은 Job 방식에 기반한 연속 데이터 적재 작업입니다. Job이 제출되면 Doris는 데이터 적재 작업을 계속 실행하면서 TVF 또는 업스트림 데이터 소스를 실시간으로 쿼리하고 데이터를 Doris 테이블에 기록합니다."
}
---

## 설명 {#description}

Doris Streaming Job은 Job 방식에 기반한 연속 데이터 적재 작업입니다. Job이 제출되면 Doris는 데이터 적재 작업을 계속 실행하면서 TVF 또는 업스트림 데이터 소스를 실시간으로 쿼리하고 데이터를 Doris 테이블에 기록합니다.

다음 두 가지 모드를 지원합니다.

- **TVF 모드**: `DO INSERT INTO ... SELECT FROM TVF()` 구문을 사용하여 TVF 데이터를 지정된 단일 Doris 테이블에 지속적으로 기록합니다. [S3 TVF](../../sql-functions/table-valued-functions/s3.md)와 [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md)를 지원합니다.
- **다중 테이블 CDC 모드**: `FROM <sourceType> TO DATABASE` 구문을 사용하여 업스트림 데이터베이스의 여러 테이블에서 전체 데이터와 증분 데이터를 Doris로 지속적으로 동기화하며, 최초 동기화 시 다운스트림 테이블을 자동으로 생성합니다.

자세한 사용 방법은 [연속 데이터 적재](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md)를 참조하세요.

## 구문 {#syntax}

### TVF 모드 {#tvf-mode}

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
DO <Insert_Command> 
```

### 다중 테이블 CDC 모드 {#multi-table-cdc-mode}

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
FROM <sourceType> (
    <source_property>
    [ , ... ]
)
TO DATABASE <target_db> (
    <target_property>
    [ , ... ]
)
```

## 필수 매개변수 {#required-parameters}

**1. `<job_name>`**
> 데이터베이스에서 이벤트를 고유하게 식별하는 작업 이름입니다. 작업 이름은 전역적으로 고유해야 하며, 같은 이름의 작업이 이미 존재하면 오류가 발생합니다.

**2. `<Insert_Command>`** (TVF 모드)
> DO 절은 작업이 트리거될 때 실행할 작업, 즉 INSERT INTO SELECT FROM TVF 문을 지정합니다. [S3 TVF](../../sql-functions/table-valued-functions/s3.md)와 [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md)를 지원합니다.

**3. `<sourceType>`** (다중 테이블 CDC 모드)
> 지원되는 데이터 소스 유형: 현재 `MYSQL`과 `POSTGRES`를 지원합니다.

**4. `<source_property>`** (다중 테이블 CDC 모드)

| 매개변수      | 기본값 | 설명                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC 연결 문자열(MySQL/PostgreSQL)                    |
| driver_url     | -       | JDBC 드라이버 jar 경로                                         |
| driver_class   | -       | JDBC 드라이버 클래스 이름                                       |
| user           | -       | 데이터베이스 사용자 이름                                            |
| password       | -       | 데이터베이스 비밀번호                                            |
| database       | -       | 데이터베이스 이름                                                |
| schema         | -       | 스키마 이름(PostgreSQL)                                     |
| include_tables | -       | 동기화할 테이블을 쉼표로 구분하여 지정합니다. 지정하지 않으면 기본적으로 모든 테이블을 동기화합니다. |
| offset         | latest  | `latest`: 증분 데이터만 동기화(기본값); `initial`: 전체 데이터 + 증분 데이터 동기화   |
| snapshot_split_size | 40960 (4.1.4 이전에는 8096) | 분할 크기(행 단위)입니다. 전체 동기화 중에는 테이블을 여러 분할로 나눕니다. |
| snapshot_parallelism | 1   | 전체 동기화 단계의 병렬 처리 수준, 즉 태스크당 최대 분할 수입니다. |

**5. `<target_db>`** (다중 테이블 CDC 모드)
> 데이터를 적재할 Doris 대상 데이터베이스 이름입니다.

**6. `<target_property>`** (다중 테이블 CDC 모드)

| 매개변수                       | 기본값 | 설명                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | 테이블 생성 시 적용할 속성입니다. 예: replication_num         |
| load.strict_mode                | -       | 엄격 모드를 활성화할지 여부입니다. 기본적으로 비활성화되어 있습니다.          |
| load.max_filter_ratio           | -       | 샘플링 구간 내에서 허용되는 최대 필터링 비율입니다. 0 이상 1 이하여야 합니다. 기본값은 0이며, 오류를 전혀 허용하지 않음을 의미합니다. 샘플링 구간은 max_interval * 10입니다. 이 구간 내에서 전체 행 대비 오류 행의 비율이 max_filter_ratio를 초과하면 예약된 작업이 일시 중지되며, 데이터 품질 문제를 해결하기 위한 수동 개입이 필요합니다. |

## 선택적 매개변수 {#optional-parameters}

**1. `<job_property>`**

| 매개변수          | 기본값 | 설명                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | job_properties에서 모든 세션 변수를 설정할 수 있습니다(TVF 모드만 해당). |
| s3.max_batch_files | 256     | 누적 파일 수가 이 값에 도달하면 데이터 적재 쓰기를 트리거합니다(S3 TVF만 해당). |
| s3.max_batch_bytes | 10737418240 | 누적 데이터 크기(바이트 단위)가 이 값에 도달하면 데이터 적재 쓰기를 트리거합니다. `10737418240`과 같은 정수 바이트 수만 허용하며, `10G`와 같은 단위 접미사는 지원하지 않습니다. 유효 범위는 100MB–10GB, 즉 104857600–10737418240입니다. (S3 TVF만 해당) |
| max_interval       | 10      | 업스트림에 새 파일이나 데이터가 없을 때의 유휴 스케줄링 간격(초)입니다. `10`과 같은 정수(초 단위)만 허용하며, `10s`와 같은 단위 접미사는 지원하지 않습니다. 1 이상이어야 합니다. |

## 권한 제어 {#privilege-control}

이 SQL 명령을 실행하는 사용자에게는 최소한 다음 권한이 있어야 합니다.

| 권한   | 객체      | 참고 사항                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | 데이터베이스    | 현재 이 작업에는 **LOAD** 권한만 지원됩니다. |

## 참고 사항 {#notes}

- TASK는 최신 100개의 레코드만 유지합니다.

## 예제 {#examples}

### TVF 모드 {#tvf-mode-1}

- S3의 지정된 디렉터리에 있는 파일을 지속적으로 모니터링하고 CSV 파일의 데이터를 db1.tbl1에 적재하는 작업을 생성합니다.

    ```sql
    CREATE JOB my_job
    ON STREAMING
    DO 
    INSERT INTO db1.`tbl1`
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/s3/demo/*.csv",
        "format" = "csv",
        "column_separator" = ",",
        "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```

- CDC Stream TVF를 사용하여 단일 MySQL 테이블을 Doris로 지속적으로 동기화하는 작업을 생성합니다.

    ```sql
    CREATE JOB mysql_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
    SELECT * FROM cdc_stream(
        "type" = "mysql",
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-java-8.0.25.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "source_db",
        "table" = "source_table",
        "offset" = "initial"
    );
    ```

- CDC Stream TVF를 사용하여 단일 PostgreSQL 테이블을 Doris로 지속적으로 동기화하는 작업을 생성합니다.

    ```sql
    CREATE JOB pg_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
    SELECT * FROM cdc_stream(
        "type" = "postgres",
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
        "driver_class" = "org.postgresql.Driver",
        "user" = "postgres",
        "password" = "postgres",
        "database" = "postgres",
        "schema" = "public",
        "table" = "source_table",
        "offset" = "initial"
    );
    ```

### 다중 테이블 CDC 모드 {#multi-table-cdc-mode-1}

- MySQL 업스트림의 user_info 및 order_info 테이블을 처음부터 target_test_db 데이터베이스로 동기화하는 작업을 생성합니다.

    ```sql
    CREATE JOB multi_table_sync
    ON STREAMING
    FROM MYSQL (
            "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
            "driver_url" = "mysql-connector-java-8.0.25.jar",
            "driver_class" = "com.mysql.cj.jdbc.Driver",
            "user" = "root",
            "password" = "123456",
            "database" = "test",
            "include_tables" = "user_info,order_info",
            "offset" = "initial"
    )
    TO DATABASE target_test_db (
        "table.create.properties.replication_num" = "1"
    )
    ```

- PostgreSQL 업스트림의 test_tbls 테이블에서 증분 데이터를 target_test_db 데이터베이스로 지속적으로 동기화하는 작업을 생성합니다.

    ```sql
    CREATE JOB test_postgres_job
    ON STREAMING
    FROM POSTGRES (
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
        "driver_class" = "org.postgresql.Driver",
        "user" = "postgres",
        "password" = "postgres",
        "database" = "postgres",
        "schema" = "public",
        "include_tables" = "test_tbls", 
        "offset" = "latest"
    )
    TO DATABASE target_test_db (
        "table.create.properties.replication_num" = "1"
    )
    ```

## 설정 {#config}

**fe.conf**

| 매개변수                             | 기본값 | 설명                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streaming 작업의 최대 수            |
| job_streaming_task_exec_thread_num     | 10      | StreamingTask의 스레드 수         |
| max_streaming_task_show_count          | 100     | 메모리에 유지할 StreamingTask 레코드의 최대 수|
