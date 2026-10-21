---
{
    "title": "CREATE STREAMING JOB",
    "language": "ko",
    "description": "CREATE STREAMING JOB을 사용하여 TVF에서 데이터를 지속적으로 적재하거나 MySQL 및 PostgreSQL 테이블을 Doris로 동기화합니다."
}
---

## 설명 {#description}

Doris Streaming Job은 Job 방식에 기반한 연속 데이터 적재 작업입니다. Job을 제출하면 Doris가 데이터 적재 작업을 지속적으로 실행하면서 TVF 또는 업스트림 데이터 소스를 실시간으로 쿼리하고 데이터를 Doris 테이블에 기록합니다.

다음 두 가지 모드를 지원합니다.

- **TVF 모드**: `DO INSERT INTO ... SELECT FROM TVF()` 구문을 사용하여 TVF 데이터를 지정된 단일 Doris 테이블에 지속적으로 기록합니다. [S3 TVF](../../sql-functions/table-valued-functions/s3.md)와 [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md)를 지원합니다.
- **다중 테이블 CDC 모드**: `FROM <sourceType> TO DATABASE` 구문을 사용하여 여러 업스트림 데이터베이스 테이블의 전체 데이터와 증분 데이터를 Doris로 지속적으로 동기화하며, 최초 동기화 시 다운스트림 테이블을 자동으로 생성합니다.

자세한 사용법은 [연속 데이터 적재](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md)를 참조하세요.

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
> 데이터베이스에서 이벤트를 고유하게 식별하는 Job 이름입니다. Job 이름은 전역적으로 고유해야 하며, 같은 이름의 Job이 이미 있으면 오류가 발생합니다.

**2. `<Insert_Command>`** (TVF 모드)
> DO 절은 Job이 트리거될 때 실행할 작업, 즉 INSERT INTO SELECT FROM TVF 문을 지정합니다. [S3 TVF](../../sql-functions/table-valued-functions/s3.md)와 [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md)를 지원합니다.

**3. `<sourceType>`** (다중 테이블 CDC 모드)
> 지원되는 데이터 소스 유형입니다. 현재 `MYSQL`과 `POSTGRES`를 지원합니다.

**4. `<source_property>`** (다중 테이블 CDC 모드)

| 매개변수 | 적용 가능한 소스 | 기본값 | 설명 |
| --- | --- | --- | --- |
| `jdbc_url` | MySQL, PostgreSQL | - | 필수. JDBC 연결 문자열입니다. |
| `driver_url` | MySQL, PostgreSQL | - | 필수. JDBC 드라이버 jar 경로입니다. |
| `driver_class` | MySQL, PostgreSQL | - | 필수. JDBC 드라이버 클래스 이름입니다. |
| `user` | MySQL, PostgreSQL | - | 필수. 데이터베이스 사용자 이름입니다. |
| `password` | MySQL, PostgreSQL | - | 필수. 데이터베이스 비밀번호입니다. |
| `database` | MySQL, PostgreSQL | - | 필수. 업스트림 데이터베이스 이름입니다. PostgreSQL의 경우 JDBC URL의 데이터베이스 이름과 일치해야 합니다. |
| `schema` | PostgreSQL | - | 필수. PostgreSQL Schema 이름입니다. |
| `include_tables` | MySQL, PostgreSQL | - | 동기화할 테이블 이름을 쉼표로 구분하여 지정합니다. 설정하지 않으면 데이터베이스 또는 Schema의 모든 테이블을 동기화합니다. |
| `exclude_tables` | MySQL, PostgreSQL | - | 동기화하지 않을 테이블 이름을 쉼표로 구분하여 지정합니다. 이 매개변수는 `include_tables`가 설정되지 않은 경우에만 적용됩니다. |
| `table.<table_name>.target_table` | MySQL, PostgreSQL | 소스 테이블 이름 | 소스 테이블에 대응하는 Doris 대상 테이블 이름을 설정합니다. |
| `table.<table_name>.exclude_columns` | MySQL, PostgreSQL | - | 소스 테이블에서 제외할 비키 컬럼을 쉼표로 구분하여 지정합니다. |
| `offset` | MySQL, PostgreSQL | `latest` | 시작 오프셋입니다. `initial`, `snapshot`, `latest` 및 정확한 JSON 오프셋을 지원합니다. MySQL은 `earliest`도 지원합니다. |
| `snapshot_split_size` | MySQL, PostgreSQL | `40960` (4.1.4 이전에는 `8096`) | 전체 스냅샷의 분할 크기로, 단위는 행입니다. 양의 정수여야 합니다. |
| `snapshot_parallelism` | MySQL, PostgreSQL | `1` | 전체 동기화 단계에서 Task가 한 번에 스케줄링하는 최대 분할 수입니다. 양의 정수여야 합니다. |
| `ssl_mode` | MySQL, PostgreSQL | `disable` | SSL 모드입니다. 유효한 값은 `disable`, `require`, `verify-ca`입니다. |
| `ssl_rootcert` | MySQL, PostgreSQL | - | `FILE:<file_name>` 형식의 CA 인증서 파일입니다. `ssl_mode=verify-ca`인 경우 필수입니다. |
| `server_id` | MySQL | 자동 생성 | MySQL CDC 리더의 서버 ID입니다. `5400`과 같은 단일 값이나 `5400-5408`과 같이 양 끝값을 포함하는 범위를 지원합니다. 범위의 너비는 `snapshot_parallelism` 이상이어야 합니다. |
| `slot_name` | PostgreSQL | `doris_cdc_<job_id>` | 논리 복제 슬롯 이름입니다. 사용자 지정 슬롯은 미리 생성해야 하며 사용자가 관리해야 합니다. |
| `publication_name` | PostgreSQL | `doris_pub_<job_id>` | Publication 이름입니다. 사용자 지정 Publication은 미리 생성하고 동기화할 모든 테이블을 포함해야 하며, 사용자가 관리해야 합니다. |

> 버전 참고: `table.<table_name>.target_table`, `table.<table_name>.exclude_columns`, `offset=snapshot`, `ssl_mode`, `ssl_rootcert`, `server_id`, `slot_name`, `publication_name`은 버전 4.1.0부터 지원됩니다.

`include_tables`와 `exclude_tables`를 모두 설정하면 `include_tables`가 우선합니다. `slot_name`과 `publication_name`에는 소문자, 숫자, 밑줄만 사용할 수 있으며, 숫자로 시작할 수 없고 길이는 63자로 제한됩니다. 소스별 차이점, JSON 오프셋 형식 및 SSL 인증서 설정에 대한 전체 내용은 [테이블 자동 생성을 지원하는 MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md)와 [테이블 자동 생성을 지원하는 PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md)를 참조하세요.

**5. `<target_db>`** (다중 테이블 CDC 모드)
> 데이터를 적재할 Doris 대상 데이터베이스 이름입니다.

**6. `<target_property>`** (다중 테이블 CDC 모드)

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris가 테이블을 생성할 때 테이블 속성을 추가합니다. 예: `table.create.properties.replication_num`. |
| `load.strict_mode` | `false` | Stream Load로 데이터를 기록할 때 엄격 모드를 활성화할지 여부입니다. 유효한 값은 `true`와 `false`입니다. |
| `load.max_filter_ratio` | `0` | 샘플링 구간 내에서 허용되는 최대 필터링 비율이며, 범위는 `[0, 1]`입니다. 샘플링 구간은 `max_interval * 10`초입니다. 구간 내 오류 행 비율이 이 값을 초과하면 Job이 일시 중지됩니다. |

## 선택 매개변수 {#optional-parameters}

**1. `<job_property>`**

| 매개변수 | 기본값 | 설명 |
| --- | --- | --- |
| `max_interval` | `10` | 업스트림에 새 파일이나 데이터가 없을 때의 유휴 스케줄링 간격으로, 단위는 초입니다. 1 이상의 정수여야 합니다. |
| `compute_group` | 현재 세션 또는 사용자의 기본 컴퓨트 그룹 | 컴퓨팅과 스토리지가 분리된 모드에서만 지원됩니다. Job이 실행될 컴퓨트 그룹을 지정합니다. 사용자는 해당 컴퓨트 그룹에 대한 USAGE 권한이 있어야 합니다. |
| `session.<variable_name>` | 해당 세션 변수의 기본값 | TVF 모드에서만 지원됩니다. INSERT 작업에 사용할 유효한 Doris 세션 변수를 설정합니다. |
| `s3.max_batch_files` | `256` | 누적 파일 수가 이 값에 도달하면 데이터 적재를 트리거합니다. S3 TVF에서만 사용합니다. |
| `s3.max_batch_bytes` | `10737418240` | 누적 데이터 크기가 이 값에 도달하면 데이터 적재를 트리거합니다. S3 TVF에서만 사용합니다. 단위는 바이트이며, 유효한 범위는 104857600에서 10737418240까지입니다. |
| `offset` | - | S3 Streaming Job을 생성할 때 소스의 시작 위치를 설정합니다. MySQL/PostgreSQL의 초기 위치는 소스 매개변수에서 설정해야 합니다. 정확한 JSON 오프셋을 지정한 경우에만 `ALTER JOB`을 통해 CDC 진행 위치를 재설정할 수 있습니다. |

`type`, `table`, `include_delete_sign`을 비롯한 모든 CDC Stream TVF 매개변수는 [CDC Stream](../../sql-functions/table-valued-functions/cdc-stream.md)을 참조하세요.

## 권한 제어 {#privilege-control}

이 SQL 명령을 실행하는 사용자는 최소한 다음 권한이 있어야 합니다.

| 권한        | 객체        | 참고                                  |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | 데이터베이스 | 현재 이 작업에는 **LOAD** 권한만 지원됩니다 |

## 참고 사항 {#notes}

- TASK는 최신 100개의 레코드만 보관합니다.

### PROPERTIES 사용법 {#properties-usage}

`PROPERTIES`를 사용하여 스케줄링 간격 변경이나 세션 변수 설정과 같은 Job 런타임 매개변수를 구성합니다.

```sql
CREATE JOB my_job
PROPERTIES (
    "max_interval" = "30",
    "session.insert_max_filter_ratio" = "0.5"
)
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
);
```

## 예시 {#examples}

### TVF 모드 {#tvf-mode-1}

- S3의 지정된 디렉터리에 있는 파일을 지속적으로 모니터링하고 CSV 파일의 데이터를 db1.tbl1에 적재하는 Job을 생성합니다.

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

- CDC Stream TVF를 사용하여 단일 MySQL 테이블을 Doris로 지속적으로 동기화하는 Job을 생성합니다.

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

- CDC Stream TVF를 사용하여 단일 PostgreSQL 테이블을 Doris로 지속적으로 동기화하는 Job을 생성합니다.

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

- MySQL 업스트림의 user_info 및 order_info 테이블을 처음부터 target_test_db 데이터베이스로 동기화하는 Job을 생성합니다.

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

- PostgreSQL 업스트림의 test_tbls 테이블에서 증분 데이터를 target_test_db 데이터베이스로 지속적으로 동기화하는 Job을 생성합니다.

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

| 매개변수                              | 기본값  | 설명                                        |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streaming Job의 최대 수                      |
| job_streaming_task_exec_thread_num     | 10      | StreamingTask의 스레드 수                    |
| max_streaming_task_show_count          | 100     | 메모리에 보관하는 StreamingTask 레코드의 최대 수 |
