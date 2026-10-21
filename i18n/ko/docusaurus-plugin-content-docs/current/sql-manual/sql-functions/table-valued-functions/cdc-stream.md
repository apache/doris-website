---
{
    "title": "CDC_STREAM | 테이블 반환 함수",
    "language": "ko",
    "description": "CDC Stream TVF를 사용하여 MySQL 및 PostgreSQL의 변경 사항을 읽고 증분 쿼리 또는 Streaming Job을 통한 전체 및 증분 동기화에 활용합니다.",
    "sidebar_label": "CDC_STREAM"
}
---

# CDC_STREAM {#cdc_stream}

## 설명 {#description}

CDC Stream 테이블 반환 함수(TVF)는 CDC를 통해 MySQL 및 PostgreSQL과 같은 관계형 데이터베이스의 변경 데이터를 읽습니다. 이 함수는 [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 데이터베이스 변경 로그(Binlog/WAL)를 지속적으로 읽고, 결과를 Streaming Job의 INSERT 문에 전달하여 Doris에 기록합니다.

> 이 함수는 4.1.0 버전부터 지원됩니다.

일반적으로 `CREATE JOB ON STREAMING`과 함께 사용하여 SQL 매핑으로 단일 테이블을 지속적으로 전체 및 증분 동기화합니다. 자세한 사용법은 [SQL 매핑을 사용하는 MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-table.md) 및 [SQL 매핑을 사용하는 PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-table.md)를 참조하세요.

:::note
CDC Stream TVF를 단독으로 사용하면 증분 데이터 동기화만 지원하며 전체 스냅샷 읽기는 지원하지 않습니다. [CREATE STREAMING JOB](../../sql-statements/job/CREATE-STREAMING-JOB.md)과 함께 사용하면 전체 및 증분 동기화를 지원합니다.
:::

## 사용 시 참고 사항 {#usage-notes}

1. CDC Stream TVF를 단독으로 사용하면 증분 동기화만 지원하며, `CREATE JOB ON STREAMING`과 함께 사용하면 전체 및 증분 동기화를 지원합니다.
2. 일반적으로 `CREATE JOB ON STREAMING`과 함께 사용하며, 일반 쿼리에서는 사용을 권장하지 않습니다.
3. `skip_snapshot_backfill`을 `true`로 설정하면 at-least-once 시맨틱을 사용합니다.
4. MySQL을 사용할 때는 Binlog를 활성화해야 합니다(`binlog_format=ROW`). `server_id` 범위를 명시적으로 설정하는 경우, 범위 내 ID 수는 `snapshot_parallelism`보다 작을 수 없습니다.
5. PostgreSQL을 사용할 때는 논리 복제를 활성화해야 합니다(`wal_level=logical`). 사용자가 지정한 복제 슬롯과 publication은 미리 생성해야 하며, 정리도 사용자가 직접 수행해야 합니다.
6. `ssl_mode=verify-ca`인 경우 `ssl_rootcert`도 설정해야 합니다.
7. `include_delete_sign=true`인 경우 대상 테이블은 Merge-on-Write Unique Key 테이블이어야 하며, INSERT 대상 컬럼 목록과 SELECT 목록 모두에 `__DORIS_DELETE_SIGN__`을 명시적으로 매핑해야 합니다.

## 구문 {#syntax}

```sql
cdc_stream(
    "type" = "<source_type>",
    "jdbc_url" = "<jdbc_url>",
    "driver_url" = "<driver_url>",
    "driver_class" = "<driver_class>",
    "user" = "<user>",
    "password" = "<password>",
    "table" = "<table>",
    "offset" = "<offset>"
    [, "database" = "<database>"]
    [, "schema" = "<schema>"]
    [, "<optional_property_key>" = "<optional_property_value>" [, ...] ]
)
```

## 매개변수 {#parameters}

| 매개변수 | 적용 가능한 소스 | 필수 여부 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| `type` | MySQL, PostgreSQL | 예 | - | 데이터 소스 유형입니다. MySQL의 경우 `mysql`, PostgreSQL의 경우 `postgres`로 설정합니다. |
| `jdbc_url` | MySQL, PostgreSQL | 예 | - | JDBC 연결 문자열입니다. 예: `jdbc:mysql://127.0.0.1:3306` 또는 `jdbc:postgresql://127.0.0.1:5432/postgres`. |
| `driver_url` | MySQL, PostgreSQL | 예 | - | JDBC 드라이버 jar의 경로입니다. 파일 이름, 로컬 절대 경로 또는 HTTP URL을 지원합니다. |
| `driver_class` | MySQL, PostgreSQL | 예 | - | JDBC 드라이버 클래스 이름입니다. MySQL의 경우 `com.mysql.cj.jdbc.Driver`, PostgreSQL의 경우 `org.postgresql.Driver`를 사용합니다. |
| `user` | MySQL, PostgreSQL | 예 | - | 데이터베이스 사용자 이름입니다. |
| `password` | MySQL, PostgreSQL | 예 | - | 데이터베이스 비밀번호입니다. |
| `database` | MySQL, PostgreSQL | MySQL의 경우 필수 | PostgreSQL JDBC URL의 데이터베이스 이름 | 데이터베이스 이름입니다. PostgreSQL의 경우 명시적으로 설정한 값이 JDBC URL의 데이터베이스 이름보다 우선하며, UTF-8로 인코딩한 후의 길이는 63바이트를 초과할 수 없습니다. |
| `schema` | PostgreSQL | 예 | - | PostgreSQL Schema 이름입니다. |
| `table` | MySQL, PostgreSQL | 예 | - | 동기화할 테이블의 이름입니다. 각 CDC Stream TVF는 소스 테이블 하나를 지원합니다. |
| `offset` | MySQL, PostgreSQL | 예 | - | 시작 오프셋입니다. `initial`: 전체 및 증분 동기화, `snapshot`: 전체 동기화만 수행, `latest`: 시작 이후의 변경 사항만 동기화합니다. MySQL은 `earliest`도 지원합니다. 정확한 JSON 오프셋의 예로, MySQL은 `{"file":"binlog.000001","pos":"154"}` 또는 `{"gtids":"<gtid_set>"}`를 사용하고 PostgreSQL은 `{"lsn":"12345678"}`를 사용합니다. |
| `snapshot_split_size` | MySQL, PostgreSQL | 아니요 | `40960` | 행 수로 지정하는 분할 크기입니다. 전체 동기화 시 테이블을 여러 분할로 나눕니다. 양의 정수여야 합니다. 4.1.4 이전의 기본값은 `8096`이었습니다. |
| `snapshot_parallelism` | MySQL, PostgreSQL | 아니요 | `1` | 전체 동기화 단계의 병렬 처리 수로, Task가 한 번에 스케줄링하는 최대 분할 수입니다. 양의 정수여야 합니다. |
| `skip_snapshot_backfill` | MySQL, PostgreSQL | 아니요 | `false` | 스냅샷 중 증분 백필을 건너뛸지 여부입니다. `true`로 설정하면 at-least-once 시맨틱을 사용합니다. |
| `ssl_mode` | MySQL, PostgreSQL | 아니요 | `disable` | SSL 모드입니다. 유효한 값은 `disable`, `require`, `verify-ca`입니다. |
| `ssl_rootcert` | MySQL, PostgreSQL | 조건에 따라 필수 | - | `FILE:<file_name>` 형식의 CA 인증서 파일입니다. `ssl_mode`가 `verify-ca`인 경우 필수입니다. 먼저 [CREATE FILE](../../sql-statements/security/CREATE-FILE.md)을 사용하여 파일을 업로드하세요. |
| `server_id` | MySQL | 아니요 | 자동 생성 | MySQL CDC 리더의 서버 ID입니다. `5400`과 같은 단일 값 또는 `5400-5408`과 같이 양 끝값을 포함하는 범위를 지원합니다. 범위의 크기는 `snapshot_parallelism` 이상이어야 합니다. |
| `slot_name` | PostgreSQL | 아니요 | `doris_cdc_<job_id>` | 논리 복제 슬롯 이름입니다. 이름에는 소문자, 숫자, 밑줄만 사용할 수 있으며, 숫자로 시작할 수 없고 길이는 63자로 제한됩니다. 사용자 지정 슬롯은 미리 생성해야 하며 Doris가 삭제하지 않습니다. |
| `publication_name` | PostgreSQL | 아니요 | `doris_pub_<job_id>` | publication 이름입니다. 명명 규칙은 `slot_name`과 같습니다. 사용자 지정 publication은 미리 생성하고 소스 테이블을 포함해야 하며, Doris가 삭제하지 않습니다. |
| `include_delete_sign` | MySQL, PostgreSQL | 아니요 | `false` | `__DORIS_DELETE_SIGN__` 컬럼을 추가로 출력할지 여부입니다. `true`로 설정하면 업스트림 DELETE 작업을 Doris 기본 키 테이블의 삭제 작업으로 동기화합니다. |

## 반환 값 {#return-value}

소스 테이블의 컬럼을 반환합니다. 컬럼 이름과 유형은 소스 테이블의 Schema에서 가져오며, 소스의 NULL 값은 해당 컬럼 유형으로 반환됩니다. `include_delete_sign=true`인 경우 결과에 `TINYINT` 유형의 `__DORIS_DELETE_SIGN__` 컬럼이 추가됩니다. 일반 레코드의 값은 `0`이고, 삭제 레코드의 값은 `1`입니다. 데이터 소스에 연결할 수 없거나, 소스 테이블을 찾을 수 없거나, 매개변수가 유효하지 않으면 함수 분석 또는 실행이 실패하며 데이터가 반환되지 않습니다.

4.1.5부터 Streaming Job과 함께 사용하는 경우, CDC 작업은 Job 생성자의 자격으로 Doris 권한을 확인하며 실패한 태스크에는 일반적인 자동 태스크 재시도 절차가 적용되지 않습니다. [지속적 데이터 적재의 실행 주체 및 실패 처리](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md#cdc-task-identity-and-failure-handling)를 참조하세요.

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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent Binlog changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; the source table's initial data and subsequent WAL changes are continuously written to db1.target_table.
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
  );
  ```

  ```text
  The Job is created successfully; after age is converted to INT, the selected columns are continuously written to db1.target_table.
  ```

- 업스트림 DELETE 작업 동기화

  ```sql
  CREATE JOB mysql_cdc_delete_job
  ON STREAMING
  DO
  INSERT INTO db1.target_table (id, name, __DORIS_DELETE_SIGN__)
  SELECT id, name, __DORIS_DELETE_SIGN__
  FROM cdc_stream(
      "type" = "mysql",
      "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
      "driver_url" = "mysql-connector-java-8.0.25.jar",
      "driver_class" = "com.mysql.cj.jdbc.Driver",
      "user" = "root",
      "password" = "123456",
      "database" = "source_db",
      "table" = "source_table",
      "offset" = "initial",
      "include_delete_sign" = "true"
  );
  ```

  ```text
  The Job is created successfully; regular records carry delete sign 0, and DELETE records carry delete sign 1.
  ```
