---
{
    "title": "CDC_STREAM | 테이블 반환 함수",
    "language": "ko",
    "description": "CDC Stream 테이블 반환 함수(TVF)를 사용하면 CDC를 통해 관계형 데이터베이스(예: MySQL, PostgreSQL)에서 변경 데이터를 읽을 수 있으며, 전체 및 증분 동기화를 지원합니다.",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM {#cdc_stream}

## 설명 {#description}

CDC Stream 테이블 반환 함수(TVF)를 사용하면 CDC를 통해 관계형 데이터베이스(예: MySQL, PostgreSQL)에서 변경 데이터를 읽을 수 있습니다. [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 전체 및 증분 데이터 동기화를 지원합니다.

일반적으로 `CREATE JOB ON STREAMING`과 함께 사용하여 SQL 매핑을 적용한 단일 테이블의 지속적인 데이터 동기화를 구현합니다. 자세한 사용법은 [SQL 매핑을 사용한 MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) 및 [SQL 매핑을 사용한 PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md)를 참조하세요.

## 구문 {#syntax}

```sql
cdc_stream(
    "type" = "<source_type>",
    "jdbc_url" = "<jdbc_url>",
    "driver_url" = "<driver_url>",
    "driver_class" = "<driver_class>",
    "user" = "<user>",
    "password" = "<password>",
    "database" = "<database>",
    "table" = "<table>"
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## 필수 매개변수 {#required-parameters}

| 매개변수      | 설명                                                  |
|----------------|--------------------------------------------------------------|
| `type`         | 데이터 소스 유형. 현재 `mysql` 및 `postgres` 지원  |
| `jdbc_url`     | JDBC 연결 문자열. 예: `jdbc:mysql://127.0.0.1:3306` 또는 `jdbc:postgresql://127.0.0.1:5432/postgres` |
| `driver_url`   | JDBC 드라이버 jar 경로                                         |
| `driver_class` | JDBC 드라이버 클래스 이름. MySQL의 경우 `com.mysql.cj.jdbc.Driver`, PostgreSQL의 경우 `org.postgresql.Driver` |
| `user`         | 데이터베이스 사용자 이름                                            |
| `password`     | 데이터베이스 비밀번호                                            |
| `database`     | 데이터베이스 이름                                                |
| `table`        | 동기화할 테이블 이름                                    |

## 선택적 매개변수 {#optional-parameters}

| 매개변수              | 기본값 | 설명                                                  |
|------------------------|---------|--------------------------------------------------------------|
| `schema`               | -       | 스키마 이름. PostgreSQL에서는 필수                         |
| `offset`               | latest  | `latest`: 증분만 동기화; `initial`: 전체 + 증분 동기화; `snapshot`, `earliest`(MySQL 전용) 또는 JSON 형식의 binlog/LSN 위치도 지원 |
| `snapshot_split_size`  | 40960 (4.1.4 이전에는 8096)    | 분할 크기(행 단위). 전체 동기화 중에는 테이블을 여러 분할로 나눔 |
| `snapshot_parallelism` | 1       | 전체 동기화 단계의 병렬 처리 수준. 즉, 태스크당 최대 분할 수 |

## 참고 사항 {#notes}

1. CDC Stream TVF는 일반적으로 `CREATE JOB ON STREAMING`과 함께 사용하며, 일반 쿼리에서 사용하는 것은 권장하지 않습니다.
2. MySQL 유형을 사용할 때는 MySQL에서 Binlog를 활성화해야 합니다(`binlog_format=ROW`).
3. PostgreSQL 유형을 사용할 때는 논리적 복제를 활성화해야 합니다(`wal_level=logical`).
4. exactly-once 시맨틱을 지원합니다.

4.1.5부터 Streaming Job과 함께 사용하는 경우 CDC 작업은 작업 생성자의 자격으로 Doris 권한을 확인하며, 실패한 태스크는 일반적인 자동 태스크 재시도 절차를 따르지 않습니다. [지속적 데이터 적재의 실행 주체 및 실패 처리](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md#cdc-task-identity-and-failure-handling)를 참조하세요.

## 예제 {#examples}

- MySQL의 단일 테이블을 지속적으로 동기화

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
  )
  ```

- PostgreSQL의 단일 테이블을 지속적으로 동기화

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
  )
  ```

- 증분만 동기화(전체 스냅샷 건너뛰기)

  ```sql
  CREATE JOB mysql_incremental_job
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
      "offset" = "latest"
  )
  ```

- 컬럼 매핑 및 데이터 변환

  ```sql
  CREATE JOB mysql_cdc_transform_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table (id, name, age)
  SELECT id, name, cast(age as INT) as age
  FROM cdc_stream(
      "type" = "mysql",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
      "driver_url" = "mysql-connector-java-8.0.25.jar",
      "driver_class" = "com.mysql.cj.jdbc.Driver",
      "user" = "root",
      "password" = "123456",
      "database" = "source_db",
      "table" = "source_table",
      "offset" = "initial"
  )
  ```
