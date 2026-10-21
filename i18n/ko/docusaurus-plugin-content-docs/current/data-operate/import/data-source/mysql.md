---
{
    "title": "MySQL",
    "language": "ko",
    "description": "Doris는 JDBC Catalog를 통한 필요에 따른 데이터 적재, Streaming Job을 통한 지속적인 전체 + 증분 동기화, Flink Doris Connector를 통한 CDC 동기화 등 MySQL에서 데이터를 적재하는 다양한 방법을 제공합니다."
}
---

Doris는 MySQL에서 데이터를 적재하는 다음과 같은 방법을 제공합니다:

- **JDBC Catalog를 통한 MySQL 데이터 적재**

Doris는 JDBC Catalog를 사용하여 MySQL을 외부 Catalog로 매핑하므로 MySQL 데이터에 직접 SQL 쿼리를 실행할 수 있습니다. `INSERT INTO` 또는 `CREATE TABLE AS SELECT`와 함께 사용하면 일회성 마이그레이션이나 주기적인 배치 데이터 적재에 적합합니다.

- **Streaming Job을 통한 MySQL 데이터의 지속적인 동기화**

Doris는 Streaming Job을 사용하여 MySQL의 전체 데이터와 증분 데이터를 Doris로 지속적으로 동기화합니다. [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 작업을 계속 실행하면서 MySQL에서 Binlog를 읽고 exactly-once 시맨틱스로 Doris 테이블에 기록합니다. SQL 매핑 동기화와 자동 테이블 생성 동기화의 두 가지 모드를 지원합니다. Doris 4.1.0부터 사용할 수 있습니다.

- **Flink Doris Connector를 통한 MySQL 데이터 적재**

Flink Doris Connector를 Flink MySQL CDC와 함께 사용하면 실시간으로 동기화할 수 있습니다. 추가적인 Flink 스트림 처리 로직이 필요한 시나리오에 적합합니다. 커넥터는 원클릭 전체 데이터베이스 동기화 도구도 제공합니다. 자세한 내용은 [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)를 참조하세요.

- **타사 도구를 통한 MySQL 데이터 적재**

[DataX](../../../connection-integration/data-integration/datax.md), [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md), [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md) 등의 데이터 통합 도구도 MySQL에서 Doris로의 데이터 동기화를 지원합니다.

대부분의 경우 일회성 데이터 마이그레이션에는 JDBC Catalog를 직접 사용할 수 있습니다. 지속적인 전체 + 증분 동기화가 필요하면 Streaming Job을 권장합니다.

## JDBC Catalog를 통한 MySQL 데이터 적재 {#loading-mysql-data-via-jdbc-catalog}

JDBC Catalog를 사용하여 MySQL을 외부 Catalog로 매핑한 다음 `INSERT INTO` 또는 `CREATE TABLE AS SELECT`를 사용하여 데이터를 적재합니다. 자세한 구문은 [JDBC MySQL Catalog](../../../lakehouse/catalogs/jdbc-mysql-catalog.md)를 참조하세요.

### 1단계: MySQL에서 데이터 준비 {#step-1-prepare-data-in-mysql}

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### 2단계: Doris에서 Catalog 생성 {#step-2-create-a-catalog-in-doris}

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "root",
    "password"     = "123456",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306/test",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver"
);
```

### 3단계: Doris에서 대상 테이블 생성 {#step-3-create-the-target-table-in-doris}

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 4단계: INSERT INTO로 데이터 적재 {#step-4-load-data-with-insert-into}

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM mysql_catalog.test.students;
```

아직 대상 테이블이 없다면 `CREATE TABLE AS SELECT`를 사용하여 한 번에 테이블을 생성하고 데이터를 적재할 수도 있습니다:

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM mysql_catalog.test.students;
```

### 5단계: 적재된 데이터 확인 {#step-5-verify-loaded-data}

```sql
SELECT * FROM doris_db.students;
+----+-------+------+
| id | name  | age  |
+----+-------+------+
|  1 | Emily |   25 |
|  2 | Bob   |   30 |
+----+-------+------+
```

## Streaming Job을 통한 MySQL 데이터의 지속적인 동기화 {#continuously-syncing-mysql-data-via-streaming-job}

Streaming Job은 Flink CDC를 통해 MySQL Binlog를 지속적으로 읽어 Doris에 기록합니다. 두 가지 모드를 지원합니다:

- [자동 테이블 생성을 사용하는 MySQL CDC](../import-way/streaming-job/continuous-load-mysql-database.md): Doris가 첫 동기화 시 다운스트림 테이블을 자동으로 생성합니다(`include_tables`를 사용하여 하나, 여러 개 또는 모든 테이블을 동기화할 수 있습니다). at-least-once 시맨틱스를 제공합니다.
- [SQL 매핑을 사용하는 MySQL CDC](../import-way/streaming-job/continuous-load-mysql-table.md): Doris에 대상 테이블을 미리 생성해야 합니다. 유연한 컬럼 매핑, 데이터 변환, exactly-once 시맨틱스를 지원합니다.

### 제한 사항 {#limitations}

1. 기본 키 테이블(Unique Key)만 지원합니다.
2. Load 권한이 필요합니다. 자동 테이블 생성 동기화에서는 처음 실행할 때 다운스트림 테이블을 자동으로 생성하려면 Create 권한도 필요합니다.
3. Doris 4.1.0부터 사용할 수 있습니다.

### 사전 요구 사항 {#prerequisites}

Streaming Job을 제출하기 전에 MySQL 측에서 Binlog를 활성화하고 사용자에게 해당 REPLICATION 권한을 부여해야 합니다. 환경별 설정 절차는 다음을 참조하세요:

- [Amazon RDS MySQL 설정 가이드](../import-way/streaming-job/prerequisites/amazon-rds-mysql.md)
- [Amazon Aurora MySQL 설정 가이드](../import-way/streaming-job/prerequisites/amazon-aurora-mysql.md)
- 각 모드의 참고 사항과 필요한 권한은 [연속 데이터 적재 개요](../import-way/streaming-job/continuous-load-overview.md)를 참조하세요.

### 작업 예제: 자동 테이블 생성 동기화 {#operation-example-auto-table-creation-sync}

자동 테이블 생성 동기화는 `FROM MYSQL ... TO DATABASE ...` 구문을 사용합니다. 대상은 Doris 데이터베이스이며, 첫 동기화 시 다운스트림 테이블이 자동으로 생성됩니다.

#### 1단계: MySQL에서 데이터 준비 {#step-1-prepare-data-in-mysql-1}

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### 2단계: Doris에서 대상 데이터베이스 생성 {#step-2-create-the-target-database-in-doris}

자동 테이블 생성 동기화에서는 **테이블을 미리 생성할 필요가 없지만**, 해당 테이블을 저장할 대상 데이터베이스는 존재해야 합니다:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### 3단계: Streaming Job 생성 {#step-3-create-a-streaming-job}

아래 예제는 `include_tables`를 사용하여 `students` 테이블만 동기화합니다(여러 테이블은 쉼표로 구분할 수 있으며, 비워 두면 전체 데이터베이스를 동기화합니다):

```sql
CREATE JOB mysql_db_sync
ON STREAMING
FROM MYSQL (
    "jdbc_url"       = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"     = "mysql-connector-java-8.0.25.jar",
    "driver_class"   = "com.mysql.cj.jdbc.Driver",
    "user"           = "root",
    "password"       = "123456",
    "database"       = "test",
    "include_tables" = "students",
    "offset"         = "initial"
)
TO DATABASE doris_db (
    "table.create.properties.replication_num" = "1"  -- set to 1 in single-BE deployments
);
```

#### 4단계: 작업 상태 확인 {#step-4-check-job-status}

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### 5단계: 자동 생성된 Doris 테이블과 적재된 데이터 확인 {#step-5-inspect-auto-created-doris-tables-and-loaded-data}

```sql
SHOW TABLES FROM doris_db;
SELECT * FROM doris_db.students;
```

그 밖의 일반적인 작업과 전체 매개변수 설명은 [자동 테이블 생성을 사용하는 MySQL CDC](../import-way/streaming-job/continuous-load-mysql-database.md)를 참조하세요.

### 작업 예제: SQL 매핑 동기화 {#operation-example-sql-mapping-sync}

#### 1단계: MySQL에서 데이터 준비 {#step-1-prepare-data-in-mysql-2}

```sql
CREATE TABLE test.students (
    id     INT PRIMARY KEY,
    name   VARCHAR(64),
    age    INT
);

INSERT INTO test.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### 2단계: Doris에서 대상 테이블 생성 {#step-2-create-the-target-table-in-doris}

SQL 매핑 동기화를 사용하려면 대상 테이블이 미리 생성되어 있어야 합니다:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id     INT,
    name   VARCHAR(64),
    age    INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### 3단계: Streaming Job 생성 {#step-3-create-a-streaming-job-1}

[CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)을 `INSERT INTO ... SELECT * FROM cdc_stream(...)` 구문과 함께 사용합니다:

```sql
CREATE JOB mysql_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "mysql",
    "jdbc_url"     = "jdbc:mysql://127.0.0.1:3306",
    "driver_url"   = "mysql-connector-java-8.0.25.jar",
    "driver_class" = "com.mysql.cj.jdbc.Driver",
    "user"         = "root",
    "password"     = "123456",
    "database"     = "test",
    "table"        = "students",
    "offset"       = "initial"
);
```

#### 4단계: 작업 상태 확인 {#step-4-check-job-status-1}

```sql
SELECT * FROM jobs("type"="insert") WHERE ExecuteType = "STREAMING";
```

#### 5단계: 적재된 데이터 확인 {#step-5-verify-loaded-data-1}

```sql
SELECT * FROM doris_db.students;
```

그 밖의 일반적인 작업(일시 중지, 재개, 삭제, 태스크 확인 등)과 전체 매개변수 설명은 [SQL 매핑을 사용하는 MySQL CDC](../import-way/streaming-job/continuous-load-mysql-table.md)를 참조하세요.
