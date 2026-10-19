---
{
    "title": "다른 TP 시스템에서 데이터 마이그레이션하기",
    "language": "ko",
    "description": "MySQL, SQL Server, Oracle, PostgreSQL과 같은 OLTP 시스템에서 Apache Doris로 데이터를 마이그레이션하는 방법을 설명하며, 오프라인 및 실시간 동기화 방식을 모두 다룹니다.",
    "keywords": [
        "MySQL에서 Doris로 마이그레이션",
        "Oracle에서 Doris로 마이그레이션",
        "SQL Server에서 Doris로 마이그레이션",
        "PostgreSQL에서 Doris로 동기화",
        "OLTP 데이터 마이그레이션",
        "Flink CDC Doris",
        "JDBC Catalog",
        "전체 데이터베이스 동기화"
    ]
}
---

<!-- Knowledge type: Architecture selection decision / Operational steps -->
<!-- Applicable scenario: Migrating or synchronizing data from OLTP databases (MySQL / SQL Server / Oracle / PostgreSQL) to Apache Doris -->

이 문서는 MySQL, SQL Server, Oracle, PostgreSQL과 같은 기존 트랜잭션(OLTP / TP) 데이터베이스에서 Apache Doris로 데이터를 마이그레이션하는 방법을 설명합니다. Doris는 일회성 마이그레이션, 오프라인 일괄 동기화, 실시간 증분 동기화를 지원하는 여러 데이터 수집 방식을 제공합니다.

## 마이그레이션 방식 개요 {#overview-of-migration-options}

다음 표는 Doris가 지원하는 주요 마이그레이션 방식을 요약한 것입니다. 데이터 규모, 동기화 지연 시간 요구 사항, CDC(Change Data Capture) 필요 여부에 따라 적합한 방식을 선택할 수 있습니다.

| 방식 | 적용 시나리오 | 동기화 모드 | 전체 데이터베이스 동기화 지원 | 증분 / CDC 지원 |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | 일회성 마이그레이션, 애드혹 쿼리, CTAS 테이블 생성 | 오프라인 / 온디맨드 | SQL로 구현 | 미지원 |
| Flink Doris Connector (JDBC) | Flink 환경에서 오프라인 일괄 동기화 | 오프라인 | 미지원 | 미지원 |
| Flink Doris Connector (CDC) | 실시간 전체 + 증분 동기화 | 실시간 | 지원 | 지원(INSERT / UPDATE / DELETE) |
| Spark Connector | Spark 환경에서 일괄 데이터 쓰기 | 오프라인 | 미지원 | 미지원 |
| Streaming Job | Doris에 내장된 MySQL / PostgreSQL 연속 동기화 | 스트리밍(연속) | 지원 | 지원 |
| 서드파티 도구(DataX / SeaTunnel / CloudCanal) | 기존 동기화 플랫폼 활용, 시각적 인터페이스를 통한 작업 | 오프라인 / 실시간 | 지원 | 도구에 따라 다름 |

> 참고: 외부 컴퓨팅 엔진을 추가하지 않고 마이그레이션을 완료해야 한다면 **Multi-Catalog** 또는 **Streaming Job**을 사용하세요. 실시간 증분 동기화가 필요하다면 **Flink Doris Connector + CDC** 또는 **Streaming Job**을 사용하세요.

---

## 방법 1: Multi-Catalog(일회성 마이그레이션에 권장) {#option-1-multi-catalog-recommended-for-one-time-migration}

JDBC Catalog를 사용하여 TP 데이터베이스의 테이블을 Doris의 외부 테이블로 매핑한 다음, `INSERT INTO` 또는 `CREATE TABLE AS SELECT (CTAS)`를 사용하여 데이터를 적재합니다.

### 절차 {#steps}

1. 원본 TP 데이터베이스에 연결하는 JDBC Catalog를 생성합니다.
2. `INSERT INTO`를 사용하여 기존 Doris 테이블에 데이터를 쓰거나, `CTAS`를 사용하여 테이블 생성과 데이터 적재를 한 번에 수행합니다.
3. 행 수와 필드의 일관성을 확인합니다.

### 예제: MySQL에서 데이터 마이그레이션하기 {#example-migrating-data-from-mysql}

```sql
CREATE CATALOG mysql_catalog properties(
    'type' = 'jdbc',
    'user' = 'root',
    'password' = '123456',
    'jdbc_url' = 'jdbc:mysql://host:3306/mysql_db',
    'driver_url' = 'mysql-connector-java-8.0.25.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);

-- Load into an existing table with INSERT INTO
INSERT INTO internal.doris_db.tbl1
SELECT * FROM mysql_catalog.mysql_db.table1;

-- Create the table and load data in one step with CTAS
CREATE TABLE internal.doris_db.tbl1
PROPERTIES('replication_num' = '1')
AS
SELECT * FROM mysql_catalog.mysql_db.table1;
```

자세한 내용은 [Catalog 데이터 가져오기](../../../lakehouse/catalog-overview.md#data-ingestion)를 참조하세요.

---

## 방법 2: Flink Doris Connector {#option-2-flink-doris-connector}

Flink를 사용하면 TP 시스템의 데이터를 오프라인 일괄 모드 또는 실시간 증분 모드로 동기화할 수 있습니다.

### 2.1 오프라인 동기화: Flink JDBC Source + Doris Sink {#21-offline-synchronization-flink-jdbc-source--doris-sink}

이 방식은 Flink 환경에서 오프라인으로 데이터를 이동하는 데 적합합니다. 다음 Flink SQL 예제는 기본적인 사용 방법을 보여 줍니다.

```sql
CREATE TABLE student_source (
    id INT,
    name STRING,
    age INT,
  PRIMARY KEY (id) NOT ENFORCED
) WITH (
  'connector' = 'jdbc',
  'url' = 'jdbc:mysql://localhost:3306/mydatabase',
  'table-name' = 'students',
  'username' = 'username',
  'password' = 'password'
);

CREATE TABLE student_sink (
    id INT,
    name STRING,
    age INT
    )
    WITH (
      'connector' = 'doris',
      'fenodes' = '127.0.0.1:8030',
      'table.identifier' = 'test.students',
      'username' = 'root',
      'password' = 'password',
      'sink.label-prefix' = 'doris_label'
);

INSERT into student_sink select * from student_source;
```

자세한 내용은 [Flink JDBC](https://nightlies.apache.org/flink/flink-docs-master/zh/docs/connectors/table/jdbc/#%e5%a6%82%e4%bd%95%e5%88%9b%e5%bb%ba-jdbc-%e8%a1%a8)를 참조하세요.

### 2.2 실시간 동기화: Flink CDC {#22-real-time-synchronization-flink-cdc}

Flink CDC를 사용하면 하나의 작업에서 전체 데이터 읽기와 증분 변경 캡처를 수행하고, INSERT / UPDATE / DELETE 이벤트를 동기화할 수 있습니다.

#### 단일 테이블 실시간 동기화 예제 {#single-table-real-time-synchronization-example}

```sql
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
  id int
  ,name VARCHAR
  ,PRIMARY KEY (id) NOT ENFORCED
) WITH (
'connector' = 'mysql-cdc',
'hostname' = '127.0.0.1',
'port' = '3306',
'username' = 'root',
'password' = 'password',
'database-name' = 'database',
'table-name' = 'table'
);

-- Supports synchronization of INSERT / UPDATE / DELETE events
CREATE TABLE doris_sink (
id INT,
name STRING
)
WITH (
  'connector' = 'doris',
  'fenodes' = '127.0.0.1:8030',
  'table.identifier' = 'database.table',
  'username' = 'root',
  'password' = '',
  'sink.properties.format' = 'json',
  'sink.properties.read_json_by_line' = 'true',
  'sink.enable-delete' = 'true',  -- Synchronize delete events
  'sink.label-prefix' = 'doris_label'
);

insert into doris_sink select id,name from cdc_mysql_source;
```

#### 전체 데이터베이스 / 다중 테이블 동기화 {#whole-database--multi-table-synchronization}

TP 데이터베이스의 전체 데이터베이스 또는 여러 테이블을 동기화할 수 있도록, Flink Doris Connector는 스키마 동기화와 데이터 쓰기를 한 번에 수행하는 전체 데이터베이스 동기화 기능을 기본 제공합니다.

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-24.0.1.jar \
    mysql-sync-database \
    --database test_db \
    --mysql-conf hostname=127.0.0.1 \
    --mysql-conf port=3306 \
    --mysql-conf username=root \
    --mysql-conf password=123456 \
    --mysql-conf database-name=mysql_db \
    --including-tables "tbl1|test.*" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

자세한 내용은 [전체 데이터베이스 동기화](../../../connection-integration/data-integration/flink-doris-connector/cdc-sync.md)를 참조하세요.

---

## 방법 3: Spark Connector {#option-3-spark-connector}

이 방식은 이미 Spark를 사용하여 일괄 처리를 수행하는 경우에 적합합니다. Spark Connector의 JDBC Source로 TP 데이터베이스에서 데이터를 읽고, Doris Sink로 Doris에 데이터를 쓸 수 있습니다.

```java
val jdbcDF = spark.read
  .format("jdbc")
  .option("url", "jdbc:postgresql:dbserver")
  .option("dbtable", "schema.tablename")
  .option("user", "username")
  .option("password", "password")
  .load()

 jdbcDF.write.format("doris")
  .option("doris.table.identifier", "db.table")
  .option("doris.fenodes", "127.0.0.1:8030")
  .option("user", "root")
  .option("password", "")
  .save()
```

관련 문서:

- [JDBC를 통한 다른 데이터베이스 연결](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector 일괄 쓰기](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## 방법 4: Streaming Job(Doris 내장 연속 동기화) {#option-4-streaming-job-built-in-continuous-synchronization-in-doris}

Doris는 외부 컴퓨팅 엔진에 의존하지 않고 MySQL 또는 PostgreSQL의 데이터를 지속적으로 동기화하는 Streaming Job 기능을 기본 제공합니다.

### 다중 테이블 동기화 예제 {#multi-table-synchronization-example}

```sql
CREATE JOB multi_table_sync
ON STREAMING
FROM MYSQL (
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-j-8.0.31.jar",
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

자세한 내용은 [Postgres / MySQL 연속 데이터 적재](../import-way/streaming-job/continuous-load-overview.md)를 참조하세요.

---

## 방법 5: 서드파티 동기화 도구 {#option-5-third-party-synchronization-tools}

앞서 설명한 기본 제공 방식 외에도 커뮤니티에서 널리 사용되는 서드파티 동기화 도구를 활용할 수 있습니다. 이러한 도구는 이미 동기화 플랫폼을 사용하고 있거나 시각적 인터페이스로 작업을 관리하려는 경우에 적합합니다.

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)

---

## 자주 묻는 질문 {#faq}

**질문 1: MySQL 테이블 몇 개를 Doris로 일회성 마이그레이션하려면 어떤 방식을 선택해야 하나요?**

**Multi-Catalog**를 사용하세요. JDBC Catalog를 생성한 후 `INSERT INTO` 또는 `CTAS`를 실행하면 추가 구성 요소 없이 마이그레이션을 완료할 수 있습니다.

**질문 2: MySQL의 증분 데이터(UPDATE / DELETE 포함)를 Doris로 실시간 동기화하려면 어떻게 해야 하나요?**

**Flink Doris Connector + Flink CDC**를 사용하고 Doris Sink에서 `sink.enable-delete = true`를 활성화하거나, Doris에 내장된 **Streaming Job**을 사용하여 지속적으로 동기화하세요.

**질문 3: MySQL 데이터베이스 전체를 Doris로 한 번에 동기화하려면 어떻게 해야 하나요?**

Flink Doris Connector의 `mysql-sync-database` 전체 데이터베이스 동기화 기능이나 Streaming Job의 다중 테이블 동기화 기능을 사용하세요. 두 방식 모두 스키마와 데이터를 한 번에 동기화합니다.

**질문 4: Oracle, SQL Server, PostgreSQL도 원본 데이터베이스로 지원되나요?**

네. Multi-Catalog와 Flink / Spark Connector는 각 데이터베이스의 JDBC 드라이버를 통해 Oracle, SQL Server, PostgreSQL과 같은 TP 데이터베이스를 지원합니다. Streaming Job은 현재 MySQL과 PostgreSQL을 지원합니다.

**질문 5: 마이그레이션 중 Doris 테이블의 복제본 수를 지정하려면 어떻게 해야 하나요?**

`PROPERTIES('replication_num' = 'N')`을 `CTAS` 문에 지정하거나, Flink 전체 데이터베이스 동기화 명령에 `--table-conf replication_num=N`을 전달하세요.
