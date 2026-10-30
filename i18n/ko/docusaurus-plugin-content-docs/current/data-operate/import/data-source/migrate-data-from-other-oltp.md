---
{
    "title": "다른 TP 시스템에서 데이터 마이그레이션",
    "language": "ko",
    "description": "MySQL, SQL Server, Oracle, PostgreSQL과 같은 OLTP 시스템에서 Apache Doris로 데이터를 마이그레이션하는 방법을 설명하며, 오프라인 및 실시간 동기화 옵션을 모두 다룹니다.",
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

이 문서는 MySQL, SQL Server, Oracle, PostgreSQL과 같은 기존 트랜잭션(OLTP / TP) 데이터베이스에서 Apache Doris로 데이터를 마이그레이션하는 방법을 설명합니다. Doris는 일회성 마이그레이션, 오프라인 일괄 동기화, 실시간 증분 동기화를 포괄하는 여러 데이터 적재 옵션을 제공합니다.

## 마이그레이션 옵션 개요 {#overview-of-migration-options}

다음 표에는 Doris가 지원하는 주요 마이그레이션 옵션이 요약되어 있습니다. 데이터 볼륨, 동기화 지연 시간 요구 사항, CDC(변경 데이터 캡처) 필요 여부에 따라 옵션을 선택할 수 있습니다.

| 옵션 | 적용 시나리오 | 동기화 모드 | 전체 데이터베이스 지원 | 증분 / CDC 지원 |
|------|----------|----------|--------------|--------------------|
| Multi-Catalog | 일회성 마이그레이션, 임시 쿼리, CTAS 테이블 생성 | 오프라인 / 필요 시 | SQL로 구현 | 아니요 |
| Flink Doris Connector (JDBC) | Flink 스택에서의 오프라인 일괄 동기화 | 오프라인 | 아니요 | 아니요 |
| Flink Doris Connector (CDC) | 실시간 전체 + 증분 동기화 | 실시간 | 지원 | 지원(INSERT / UPDATE / DELETE) |
| Spark Connector | Spark 스택에서의 일괄 데이터 쓰기 | 오프라인 | 아니요 | 아니요 |
| Streaming Job | Doris에 내장된 MySQL / PostgreSQL 지속 동기화 | 스트리밍(지속) | 지원 | 지원 |
| 타사 도구(DataX / SeaTunnel / CloudCanal) | 기존 동기화 플랫폼, 시각적 운영 | 오프라인 / 실시간 | 도구에 따라 다름 | 도구에 따라 다름 |
| NineData(MySQL 호환 소스에서 Doris로) | 전체 및 증분 데이터 복제 | 전체 + 증분(Binlog) | 지원 | 지원 |

> 참고: 외부 컴퓨팅 엔진을 도입하지 않고 마이그레이션을 완료해야 한다면 **Multi-Catalog** 또는 **Streaming Job**을 사용하세요. 실시간 증분 동기화가 필요하다면 **Flink Doris Connector + CDC**, **Streaming Job**, 또는 MySQL 호환 소스에서 Doris로 사용할 수 있는 **NineData**를 사용하세요.

---

## 옵션 1: Multi-Catalog(일회성 마이그레이션에 권장) {#option-1-multi-catalog-recommended-for-one-time-migration}

JDBC Catalog를 사용해 TP 데이터베이스의 테이블을 Doris의 외부 테이블로 매핑한 다음, `INSERT INTO` 또는 `CREATE TABLE AS SELECT (CTAS)`를 사용해 데이터를 적재합니다.

### 단계 {#steps}

1. 원본 TP 데이터베이스를 가리키는 JDBC Catalog를 생성합니다.
2. `INSERT INTO`를 사용해 기존 Doris 테이블에 쓰거나, `CTAS`를 사용해 테이블을 생성하고 데이터를 한 단계로 적재합니다.
3. 행 수와 필드 일관성을 확인합니다.

### 예시: MySQL에서 데이터 마이그레이션 {#example-migrating-data-from-mysql}

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

자세한 내용은 [Catalog 데이터 적재](../../../lakehouse/catalog-overview.md#data-ingestion)를 참조하세요.

---

## 옵션 2: Flink Doris Connector {#option-2-flink-doris-connector}

Flink를 사용하면 TP 시스템 동기화를 오프라인 일괄 모드 또는 실시간 증분 모드로 실행할 수 있습니다.

### 2.1 오프라인 동기화: Flink JDBC Source + Doris Sink {#21-offline-synchronization-flink-jdbc-source--doris-sink}

이 옵션은 Flink 스택에서 오프라인으로 데이터를 이동하는 데 적합합니다. 다음 Flink SQL 예시는 해당 패턴을 보여 줍니다.

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

Flink CDC를 사용하면 하나의 작업에서 전체 데이터를 읽고 증분 변경을 캡처할 수 있으며, INSERT / UPDATE / DELETE 이벤트를 동기화할 수 있습니다.

#### 단일 테이블 실시간 동기화 예시 {#single-table-real-time-synchronization-example}

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

TP 데이터베이스의 전체 데이터베이스 또는 다중 테이블을 동기화할 때 Flink Doris Connector는 스키마 동기화와 데이터 쓰기를 한 단계로 수행하는 즉시 사용 가능한 전체 데이터베이스 동기화 기능을 제공합니다.

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

## 옵션 3: Spark Connector {#option-3-spark-connector}

이 옵션은 이미 Spark를 사용해 일괄 처리를 수행하는 시나리오에 적합합니다. Spark Connector의 JDBC Source를 사용해 TP 데이터베이스에서 읽고 Doris Sink를 사용해 Doris에 쓸 수 있습니다.

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

- [JDBC To Other Databases](https://spark.apache.org/docs/latest/sql-data-sources-jdbc.html)
- [Spark Doris Connector 일괄 쓰기](../../../connection-integration/data-integration/spark-doris-connector.md#scenario-2-batch-write-doris-data)

---

## 옵션 4: Streaming Job(Doris에 내장된 지속 동기화) {#option-4-streaming-job-built-in-continuous-synchronization-in-doris}

Doris는 외부 컴퓨팅 엔진에 의존하지 않고 MySQL 또는 PostgreSQL에서 데이터를 지속적으로 동기화하는 내장 Streaming Job 기능을 제공합니다.

### 다중 테이블 동기화 예시 {#multi-table-synchronization-example}

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

자세한 내용은 [Postgres / MySQL 지속 적재](../import-way/streaming-job/continuous-load-overview.md)를 참조하세요.

---

## 옵션 5: 타사 동기화 도구 {#option-5-third-party-synchronization-tools}

앞서 설명한 기본 제공 옵션 외에도 커뮤니티 프로젝트나 공급업체가 제공하는 타사 동기화 도구를 사용해 데이터를 마이그레이션할 수 있습니다. 특히 이미 동기화 플랫폼을 사용하고 있거나 시각적 인터페이스를 통해 작업을 관리하려는 경우에 적합합니다.

- [DataX](../../../connection-integration/data-integration/datax.md)
- [SeaTunnel](../../../connection-integration/data-integration/seatunnel.md)
- [CloudCanal](../../../connection-integration/data-integration/cloudcanal.md)
- [NineData](https://docs.ninedata.cloud/en/replication/mysql_to_others/mysql_to_doris/)

---

## FAQ {#faq}

**Q1: MySQL 테이블 몇 개를 Doris로 일회성 마이그레이션하려면 어떤 옵션을 선택해야 하나요?**

**Multi-Catalog**을 사용하세요. JDBC Catalog를 생성한 후 `INSERT INTO` 또는 `CTAS`를 실행하면 추가 구성 요소 없이 마이그레이션을 완료할 수 있습니다.

**Q2: MySQL에서 Doris로 증분 데이터(UPDATE / DELETE 포함)를 실시간으로 동기화하려면 어떻게 해야 하나요?**

**Flink Doris Connector + Flink CDC**를 사용하고 Doris Sink에서 `sink.enable-delete = true`를 활성화하거나, Doris에 내장된 **Streaming Job**을 사용해 지속적으로 동기화하세요.

**Q3: 전체 MySQL 데이터베이스를 한 단계로 Doris에 동기화하려면 어떻게 해야 하나요?**

Flink Doris Connector의 `mysql-sync-database` 전체 데이터베이스 동기화 기능 또는 Streaming Job의 다중 테이블 동기화 기능을 사용하세요. 두 옵션 모두 스키마와 데이터를 한 단계로 동기화합니다.

**Q4: Oracle, SQL Server, PostgreSQL도 원본 데이터베이스로 지원되나요?**

예. Multi-Catalog와 Flink / Spark Connector는 각각의 JDBC 드라이버를 통해 Oracle, SQL Server, PostgreSQL과 같은 TP 데이터베이스를 지원합니다. Streaming Job은 현재 MySQL과 PostgreSQL을 지원합니다.

**Q5: 마이그레이션 중 Doris 테이블의 복제본 수를 어떻게 지정하나요?**

`PROPERTIES('replication_num' = 'N')`을 `CTAS` 문에 지정하거나, Flink 전체 데이터베이스 동기화 명령에서 `--table-conf replication_num=N`을 전달하세요.
