---
{
    "title": "PostgreSQL",
    "language": "ko",
    "description": "Doris는 JDBC Catalog를 통한 일회성 데이터 적재, Streaming Job을 통한 전체 데이터와 증분 데이터의 지속적인 동기화, Flink Doris Connector를 통한 CDC 동기화 등 PostgreSQL의 데이터를 적재하는 다양한 방법을 제공합니다."
}
---

Doris는 PostgreSQL의 데이터를 적재하는 다음과 같은 방법을 제공합니다:

- **JDBC Catalog를 통한 PostgreSQL 데이터 적재**

Doris는 JDBC Catalog를 사용하여 PostgreSQL을 외부 Catalog로 매핑하므로, SQL로 PostgreSQL 데이터를 직접 쿼리할 수 있습니다. `INSERT INTO` 또는 `CREATE TABLE AS SELECT`와 함께 사용하면 일회성 마이그레이션이나 주기적인 배치 데이터 적재에 적합합니다.

- **Streaming Job을 통한 PostgreSQL 데이터의 지속적인 동기화**

Doris는 Streaming Job을 사용하여 PostgreSQL의 전체 데이터와 증분 데이터를 Doris로 지속적으로 동기화합니다. [Flink CDC](https://github.com/apache/flink-cdc)의 읽기 기능을 통합하여 작업을 계속 실행하면서 PostgreSQL의 WAL을 읽고 exactly-once 시맨틱으로 Doris 테이블에 기록합니다. SQL 매핑 동기화와 자동 테이블 생성 동기화의 두 가지 모드를 지원합니다. Doris 4.1.0부터 사용할 수 있습니다.

- **Flink Doris Connector를 통한 PostgreSQL 데이터 적재**

실시간 동기화에는 Flink Doris Connector와 Flink Postgres CDC를 함께 사용합니다. 이 방식은 추가적인 Flink 스트림 처리 로직이 필요한 경우에 적합합니다. 커넥터는 클릭 한 번으로 데이터베이스 전체를 동기화하는 도구도 제공합니다. 자세한 내용은 [Flink Doris Connector](../../../connection-integration/data-integration/flink-doris-connector.md)를 참조하세요.

- **타사 도구를 통한 PostgreSQL 데이터 적재**

[DataX](../../../connection-integration/data-integration/datax.md), [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md), [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md) 등의 데이터 통합 도구도 PostgreSQL에서 Doris로의 데이터 동기화를 지원합니다.

대부분의 경우 일회성 데이터 마이그레이션에는 JDBC Catalog를 바로 사용할 수 있습니다. 전체 데이터와 증분 데이터를 지속적으로 동기화해야 하는 경우에는 Streaming Job을 권장합니다.

## JDBC Catalog를 통한 PostgreSQL 데이터 적재 {#loading-postgresql-data-via-jdbc-catalog}

JDBC Catalog를 사용하여 PostgreSQL을 외부 Catalog로 매핑한 다음, `INSERT INTO` 또는 `CREATE TABLE AS SELECT`를 사용하여 데이터를 적재합니다. 자세한 구문은 [JDBC PostgreSQL Catalog](../../../lakehouse/catalogs/jdbc-pg-catalog.md)를 참조하세요.

### 1단계: PostgreSQL에서 데이터 준비 {#step-1-prepare-data-in-postgresql}

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

### 2단계: Doris에서 Catalog 생성 {#step-2-create-a-catalog-in-doris}

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    "type"         = "jdbc",
    "user"         = "postgres",
    "password"     = "postgres",
    "jdbc_url"     = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"   = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver"
);
```

### 3단계: Doris에서 대상 테이블 생성 {#step-3-create-the-target-table-in-doris}

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id    INT,
    name  VARCHAR(64),
    age   INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 4단계: INSERT INTO로 데이터 적재 {#step-4-load-data-with-insert-into}

```sql
INSERT INTO doris_db.students
SELECT id, name, age FROM pg_catalog.postgres.public.students;
```

대상 테이블이 아직 없으면 `CREATE TABLE AS SELECT`를 사용하여 테이블 생성과 데이터 적재를 한 번에 수행할 수도 있습니다:

```sql
CREATE TABLE doris_db.students
PROPERTIES ("replication_num" = "1")
AS
SELECT * FROM pg_catalog.postgres.public.students;
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

## Streaming Job을 통한 PostgreSQL 데이터의 지속적인 동기화 {#continuously-syncing-postgresql-data-via-streaming-job}

Streaming Job은 Flink CDC를 통해 PostgreSQL WAL을 지속적으로 읽어 Doris에 기록합니다. 다음 두 가지 모드를 지원합니다:

- [자동 테이블 생성을 통한 PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-database.md): Doris가 최초 동기화 시 다운스트림 테이블을 자동으로 생성합니다(`include_tables`를 사용하여 테이블 하나, 여러 개 또는 모든 테이블을 동기화할 수 있습니다). at-least-once 시맨틱을 제공합니다.
- [SQL 매핑을 통한 PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-table.md): 대상 테이블을 Doris에 미리 생성해야 합니다. 유연한 컬럼 매핑, 데이터 변환 및 exactly-once 시맨틱을 지원합니다.

### 제한 사항 {#limitations}

1. 기본 키 테이블(Unique Key)만 지원합니다.
2. Load 권한이 필요합니다. 자동 테이블 생성 동기화는 최초 실행 시 다운스트림 테이블을 자동으로 생성할 때 Create 권한도 필요합니다.
3. Doris 4.1.0부터 사용할 수 있습니다.

### 사전 요구 사항 {#prerequisites}

Streaming Job을 제출하기 전에 PostgreSQL 측에서 논리 복제(`wal_level=logical`)를 활성화하고 사용자에게 해당 REPLICATION 권한을 부여해야 합니다. 환경별 설정 절차는 다음을 참조하세요:

- [Amazon RDS PostgreSQL 설정 가이드](../import-way/streaming-job/prerequisites/amazon-rds-postgresql.md)
- [Amazon Aurora PostgreSQL 설정 가이드](../import-way/streaming-job/prerequisites/amazon-aurora-postgresql.md)
- 각 모드의 유의 사항과 필수 권한은 [연속 데이터 적재 개요](../import-way/streaming-job/continuous-load-overview.md)를 참조하세요.

### 실행 예제: 자동 테이블 생성 동기화 {#operation-example-auto-table-creation-sync}

자동 테이블 생성 동기화는 `FROM POSTGRES ... TO DATABASE ...` 구문을 사용합니다. 대상은 Doris 데이터베이스이며, 다운스트림 테이블은 최초 동기화 시 자동으로 생성됩니다.

#### 1단계: PostgreSQL에서 데이터 준비 {#step-1-prepare-data-in-postgresql-1}

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### 2단계: Doris에서 대상 데이터베이스 생성 {#step-2-create-the-target-database-in-doris}

자동 테이블 생성 동기화는 **테이블을 미리 생성할 필요가 없지만**, 해당 테이블을 저장할 대상 데이터베이스는 존재해야 합니다:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;
```

#### 3단계: Streaming Job 생성 {#step-3-create-a-streaming-job}

아래 예제에서는 `include_tables`를 사용하여 `students` 테이블만 동기화합니다(여러 테이블은 쉼표로 구분할 수 있으며, 비워 두면 전체 데이터베이스를 동기화합니다):

```sql
CREATE JOB pg_db_sync
ON STREAMING
FROM POSTGRES (
    "jdbc_url"       = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"     = "postgresql-42.5.1.jar",
    "driver_class"   = "org.postgresql.Driver",
    "user"           = "postgres",
    "password"       = "postgres",
    "database"       = "postgres",
    "schema"         = "public",
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

그 밖의 일반적인 작업과 전체 매개변수에 대한 자세한 내용은 [자동 테이블 생성을 통한 PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-database.md)를 참조하세요.

### 실행 예제: SQL 매핑 동기화 {#operation-example-sql-mapping-sync}

#### 1단계: PostgreSQL에서 데이터 준비 {#step-1-prepare-data-in-postgresql-2}

```sql
CREATE TABLE public.students (
    id    INT PRIMARY KEY,
    name  VARCHAR(64),
    age   INT
);

INSERT INTO public.students VALUES (1, 'Emily', 25), (2, 'Bob', 30);
```

#### 2단계: Doris에서 대상 테이블 생성 {#step-2-create-the-target-table-in-doris}

SQL 매핑 동기화를 사용하려면 대상 테이블이 미리 생성되어 있어야 합니다:

```sql
CREATE DATABASE IF NOT EXISTS doris_db;

CREATE TABLE doris_db.students (
    id    INT,
    name  VARCHAR(64),
    age   INT
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

#### 3단계: Streaming Job 생성 {#step-3-create-a-streaming-job-1}

[CREATE STREAMING JOB](../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)에서 `INSERT INTO ... SELECT * FROM cdc_stream(...)` 구문을 사용합니다:

```sql
CREATE JOB pg_students_sync
ON STREAMING
DO
INSERT INTO doris_db.students
SELECT * FROM cdc_stream(
    "type"         = "postgres",
    "jdbc_url"     = "jdbc:postgresql://127.0.0.1:5432/postgres",
    "driver_url"   = "postgresql-42.5.1.jar",
    "driver_class" = "org.postgresql.Driver",
    "user"         = "postgres",
    "password"     = "postgres",
    "database"     = "postgres",
    "schema"       = "public",
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

그 밖의 일반적인 작업(일시 중지, 재개, 삭제, 태스크 확인 등)과 전체 매개변수에 대한 자세한 내용은 [SQL 매핑을 통한 PostgreSQL CDC](../import-way/streaming-job/continuous-load-postgresql-table.md)를 참조하세요.
