---
{
    "title": "데이터베이스 전체 동기화 (Flink CDC)",
    "language": "ko",
    "description": "Flink Doris Connector로 MySQL, Oracle, PostgreSQL, SQLServer, DB2, MongoDB 데이터베이스를 Doris에 동기화합니다. 데이터베이스 전체 동기화 도구, FlinkSQL을 사용한 단일 테이블 동기화, DDL 동기화, 키 컬럼 업데이트를 다룹니다."
}
---

# 데이터베이스 전체 동기화 (Flink CDC) {#full-database-sync-flink-cdc}

Flink Doris Connector는 [Flink CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/overview/)를 통합하여 MySQL과 같은 관계형 데이터베이스를 Doris에 손쉽게 동기화할 수 있으며, 자동 테이블 생성, Schema Change 등을 지원합니다. 현재 지원하는 데이터베이스는 MySQL, Oracle, PostgreSQL, SQLServer, MongoDB, DB2입니다.

사용 방법은 두 가지입니다.

- **데이터베이스 전체 동기화 도구**: Connector에 내장된 `CdcTools` 진입점을 사용합니다. `flink run` 명령 한 번으로 데이터베이스 전체 또는 정규식으로 선택한 테이블을 동기화하고, Doris에 테이블을 생성하며, 업스트림 DDL을 자동으로 동기화합니다. [데이터베이스 전체 동기화 도구](#full-database-sync-tool)를 참조하세요.
- **FlinkSQL을 사용한 단일 테이블 동기화**: Flink CDC 소스 테이블과 Doris sink 테이블을 연결하고 테이블마다 `INSERT INTO`를 작성합니다. 동기화 중에 추가 Flink 처리 로직이 필요한 경우에 적합합니다. [FlinkSQL을 사용한 단일 테이블 동기화](#single-table-sync)를 참조하세요.

## 사전 요구 사항 {#prerequisites}

1. 데이터베이스 전체 동기화를 사용하려면 해당 Flink CDC 의존성(**Fat Jar**)을 `$FLINK_HOME/lib` 아래에 추가해야 합니다. 예를 들어 `flink-sql-connector-mysql-cdc-${version}.jar` 또는 `flink-sql-connector-oracle-cdc-${version}.jar`를 추가합니다. Flink CDC는 3.1부터 이전 버전과 호환되지 않습니다. 다운로드 주소: [Flink CDC 3.x](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/), [Flink CDC 2.x](https://repo.maven.apache.org/maven2/com/ververica/flink-sql-connector-mysql-cdc/).
2. Connector 24.0.0 이후에는 의존하는 Flink CDC 버전이 3.1 이상이어야 합니다. [다운로드 주소](https://repo.maven.apache.org/maven2/org/apache/flink/flink-sql-connector-mysql-cdc/). Flink CDC로 MySQL과 Oracle을 동기화하려면 관련 JDBC 드라이버도 `$FLINK_HOME/lib` 아래에 추가해야 합니다.

## 데이터베이스 전체 동기화 도구 {#full-database-sync-tool}

Flink 클러스터를 시작한 후 데이터 소스에 맞는 명령을 실행합니다. 전체 구문과 매개변수는 [매개변수](#options)에 설명되어 있습니다.

### MySQL {#mysql}

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

:::tip AWS Aurora MySQL / RDS MySQL
AWS Aurora MySQL 또는 RDS MySQL에도 같은 명령을 사용합니다. `hostname`을 인스턴스 엔드포인트(예: `xxx.us-east-1.rds.amazonaws.com`)로 설정하고 `--mysql-conf server-time-zone=UTC`를 추가합니다.
:::

### Oracle {#oracle}

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    oracle-sync-database \
    --database test_db \
    --oracle-conf hostname=127.0.0.1 \
    --oracle-conf port=1521 \
    --oracle-conf username=admin \
    --oracle-conf password="password" \
    --oracle-conf database-name=XE \
    --oracle-conf schema-name=ADMIN \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=\
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### PostgreSQL {#postgresql}

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    postgres-sync-database \
    --database db1 \
    --postgres-conf hostname=127.0.0.1 \
    --postgres-conf port=5432 \
    --postgres-conf username=postgres \
    --postgres-conf password="123456" \
    --postgres-conf database-name=postgres \
    --postgres-conf schema-name=public \
    --postgres-conf slot.name=test \
    --postgres-conf decoding.plugin.name=pgoutput \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=\
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### SQLServer {#sqlserver}

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.16-24.0.1.jar \
    sqlserver-sync-database \
    --database db1 \
    --sqlserver-conf hostname=127.0.0.1 \
    --sqlserver-conf port=1433 \
    --sqlserver-conf username=sa \
    --sqlserver-conf password="123456" \
    --sqlserver-conf database-name=CDC_DB \
    --sqlserver-conf schema-name=dbo \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=\
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### DB2 {#db2}

```shell
<FLINK_HOME>bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-24.0.1.jar \
    db2-sync-database \
    --database db2_test \
    --db2-conf hostname=127.0.0.1 \
    --db2-conf port=50000 \
    --db2-conf username=db2inst1 \
    --db2-conf password=doris123456 \
    --db2-conf database-name=testdb \
    --db2-conf schema-name=DB2INST1 \
    --including-tables "FULL_TYPES|CUSTOMERS" \
    --single-sink true \
    --use-new-schema-change true \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password=123456 \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --table-conf replication_num=1
```

### MongoDB {#mongodb}

```shell
<FLINK_HOME>/bin/flink run \
    -Dexecution.checkpointing.interval=10s \
    -Dparallelism.default=1 \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    ./lib/flink-doris-connector-1.18-24.0.1.jar \
    mongodb-sync-database \
    --database doris_db \
    --schema-change-mode debezium_structure \
    --mongodb-conf hosts=127.0.0.1:27017 \
    --mongodb-conf username=flinkuser \
    --mongodb-conf password=flinkpwd \
    --mongodb-conf database=test \
    --mongodb-conf scan.startup.mode=initial \
    --mongodb-conf schema.sample-percent=0.2 \
    --including-tables "tbl1|tbl2" \
    --sink-conf fenodes=127.0.0.1:8030 \
    --sink-conf username=root \
    --sink-conf password= \
    --sink-conf jdbc-url=jdbc:mysql://127.0.0.1:9030 \
    --sink-conf sink.label-prefix=label \
    --sink-conf sink.enable-2pc=false \
    --table-conf replication_num=1
```

### 매개변수 {#options}

**구문**

```shell
<FLINK_HOME>bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    lib/flink-doris-connector-1.16-1.6.1.jar \
    <mysql-sync-database|oracle-sync-database|postgres-sync-database|sqlserver-sync-database|db2-sync-database|mongodb-sync-database> \
    --database <doris-database-name> \
    [--job-name <flink-job-name>] \
    [--table-prefix <doris-table-prefix>] \
    [--table-suffix <doris-table-suffix>] \
    [--including-tables <mysql-table-name|name-regular-expr>] \
    [--excluding-tables <mysql-table-name|name-regular-expr>] \
    --mysql-conf <mysql-cdc-source-conf> [--mysql-conf <mysql-cdc-source-conf> ...] \
    --oracle-conf <oracle-cdc-source-conf> [--oracle-conf <oracle-cdc-source-conf> ...] \
    --postgres-conf <postgres-cdc-source-conf> [--postgres-conf <postgres-cdc-source-conf> ...] \
    --sqlserver-conf <sqlserver-cdc-source-conf> [--sqlserver-conf <sqlserver-cdc-source-conf> ...] \
    --db2-conf <db2-cdc-source-conf> [--db2-conf <db2-cdc-source-conf> ...] \
    --mongodb-conf <mongodb-cdc-source-conf> [--mongodb-conf <mongodb-cdc-source-conf> ...] \
    --sink-conf <doris-sink-conf> [--sink-conf <doris-sink-conf> ...] \
    [--table-conf <doris-table-conf> [--table-conf <doris-table-conf> ...]]
```

**설정 항목**

| 키 | 설명 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| --job-name | Flink 작업 이름으로, 선택 사항입니다. |
| --database | Doris에 동기화할 데이터베이스의 이름입니다. |
| --table-prefix | Doris 테이블의 접두사입니다. 예: `--table-prefix ods_`. |
| --table-suffix | 위와 마찬가지로 Doris 테이블의 접미사입니다. |
| --including-tables | 동기화할 MySQL 테이블입니다. 여러 테이블을 `\|`로 구분할 수 있으며, 정규식을 지원합니다. 예: `--including-tables table1`. |
| --excluding-tables | 동기화하지 않을 테이블입니다. 사용법은 위와 같습니다. |
| --mysql-conf | MySQL CDCSource 설정입니다. 예: `--mysql-conf hostname=127.0.0.1`. 전체 설정은 [MySQL CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mysql-cdc/)를 참조하세요. hostname/username/password/database-name은 필수입니다. 동기화할 데이터베이스/테이블에 기본 키가 없는 테이블이 포함되어 있으면 `scan.incremental.snapshot.chunk.key-column`을 설정해야 하며, NULL이 아닌 필드 하나만 선택할 수 있습니다. 예: `scan.incremental.snapshot.chunk.key-column=database.table:column,database.table1:column...`. 서로 다른 데이터베이스/테이블의 컬럼은 쉼표로 구분합니다. |
| --oracle-conf | Oracle CDCSource 설정입니다. 예: `--oracle-conf hostname=127.0.0.1`. 전체 설정은 [Oracle CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/oracle-cdc/)를 참조하세요. hostname/username/password/database-name/schema-name은 필수입니다. |
| --postgres-conf | Postgres CDCSource 설정입니다. 예: `--postgres-conf hostname=127.0.0.1`. 전체 설정은 [Postgres CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/postgres-cdc/)를 참조하세요. hostname/username/password/database-name/schema-name/slot.name은 필수입니다. |
| --sqlserver-conf | SQLServer CDCSource 설정입니다. 예: `--sqlserver-conf hostname=127.0.0.1`. 전체 설정은 [SQLServer CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/sqlserver-cdc/)를 참조하세요. hostname/username/password/database-name/schema-name은 필수입니다. |
| --db2-conf | DB2 CDCSource 설정입니다. 예: `--db2-conf hostname=127.0.0.1`. 전체 설정은 [DB2 CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/db2-cdc/)를 참조하세요. hostname/username/password/database-name/schema-name은 필수입니다. |
| --mongodb-conf | MongoDB CDCSource 설정입니다. 예: `--mongodb-conf hosts=127.0.0.1:27017`. 전체 설정은 [Mongo CDC](https://nightlies.apache.org/flink/flink-cdc-docs-release-3.2/docs/connectors/flink-sources/mongodb-cdc/)를 참조하세요. hosts/username/password/database는 필수입니다. `--mongodb-conf schema.sample-percent`는 Doris 테이블을 생성하기 위해 MongoDB 데이터를 자동으로 샘플링하는 설정이며, 기본값은 0.2입니다. |
| --sink-conf | Doris Sink의 모든 설정입니다. 전체 설정 항목은 [Sink 설정](./write.md#options)을 참조하세요. |
| --table-conf | Doris 테이블의 설정 항목으로, properties에 포함되는 내용입니다. 단, table-buckets는 properties 속성이 아닙니다. 예를 들어 `--table-conf replication_num=1`을 사용할 수 있습니다. `--table-conf table-buckets="tbl1:10,tbl2:20,a.*:30,b.*:40,.*:50"`은 정규식 순서에 따라 각 테이블의 버킷 수를 지정합니다. 일치하는 항목이 없으면 `BUCKETS AUTO`를 사용하여 테이블을 생성합니다. |
| --schema-change-mode | 스키마 변경을 파싱하는 모드입니다. `debezium_structure`와 `sql_parser`의 두 가지 파싱 모드를 지원합니다. 기본값은 `debezium_structure`입니다. `debezium_structure`는 업스트림에서 CDC 데이터를 동기화할 때 사용하는 데이터 구조를 파싱하고, 이 구조를 분석하여 DDL 변경 작업을 판단합니다. `sql_parser`는 업스트림에서 CDC 데이터를 동기화할 때 DDL 문을 파싱하여 DDL 변경 작업을 판단하므로 더 정확합니다. 사용 예: `--schema-change-mode debezium_structure`. Connector 24.0.0 이후부터 지원됩니다. |
| --single-sink | 단일 Sink로 모든 테이블을 동기화할지 여부입니다. 활성화하면 업스트림에서 새로 생성된 테이블도 자동으로 감지하고, 테이블을 자동으로 생성합니다. |
| --multi-to-one-origin | 여러 업스트림 테이블을 같은 테이블에 기록할 때 사용하는 소스 테이블 설정입니다. 예: `--multi-to-one-origin "a_.*\|b_.*"`. 자세한 내용은 [#208](https://github.com/apache/doris-flink-connector/pull/208)을 참조하세요. |
| --multi-to-one-target | `--multi-to-one-origin`과 함께 사용하는 대상 테이블 설정입니다. 예: `--multi-to-one-target "a\|b"`. |
| --create-table-only | 테이블 구조만 동기화할지 여부입니다. |

## FlinkSQL을 사용한 단일 테이블 동기화 {#single-table-sync}

Flink CDC `mysql-cdc` 소스 테이블로 MySQL의 변경 사항을 읽고 Doris sink 테이블에 기록합니다. 해당 Flink CDC Fat Jar를 `$FLINK_HOME/lib` 아래에 배치해야 합니다([사전 요구 사항](#prerequisites) 참조). 삭제 이벤트는 `sink.enable-delete`를 통해 동기화됩니다.

```sql
-- Enable checkpoint
SET 'execution.checkpointing.interval' = '10s';

CREATE TABLE cdc_mysql_source (
    id int,
    name VARCHAR,
    PRIMARY KEY (id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = '127.0.0.1',
    'port' = '3306',
    'username' = 'root',
    'password' = 'password',
    'database-name' = 'database',
    'table-name' = 'table'
);

-- Supports synchronizing insert/update/delete events
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

insert into doris_sink select id, name from cdc_mysql_source;
```

업스트림 데이터가 Debezium 형식이면 DataStream API에서 `JsonDebeziumSchemaSerializer`를 사용하여 기록할 수도 있습니다. [Debezium 형식](./datastream-api.md#debezium)을 참조하세요.

## 동기화 동작 {#synchronization-behavior}

### DDL 및 Schema Change 동기화 {#schema-change}

MySQL과 같은 업스트림 데이터 소스를 동기화할 때는 업스트림에서 필드가 추가되거나 삭제될 때마다 Doris에서도 이에 맞춰 Schema Change 작업을 수행해야 합니다.

이 경우 일반적으로 DataStream API 프로그램을 작성하고, DorisSink에서 제공하는 `JsonDebeziumSchemaSerializer`로 직렬화해야 합니다. 그러면 Schema Change가 자동으로 수행됩니다. [Debezium 형식](./datastream-api.md#debezium)을 참조하세요.

Connector에서 제공하는 데이터베이스 전체 동기화 도구는 추가 설정 없이 업스트림 DDL을 자동으로 동기화하고 Doris에서 Schema Change 작업을 수행합니다. DDL 파싱 방식은 `--schema-change-mode`로 제어합니다. [매개변수](#options)를 참조하세요.

### 키 컬럼 업데이트 {#update-key-columns}

업무용 데이터베이스에서는 일반적으로 ID를 테이블의 기본 키로 사용합니다. 예를 들어 Student 테이블은 ID(id)를 기본 키로 사용합니다. 하지만 업무가 변화하면서 특정 데이터에 해당하는 ID가 바뀔 수 있습니다. 이 경우 Flink CDC + Doris Connector로 데이터를 동기화하면 Doris 기본 키 컬럼의 데이터가 자동으로 업데이트됩니다.

**원리**

Flink CDC의 기반 수집 도구는 Debezium입니다. Debezium은 내부적으로 `op` 필드를 사용하여 해당 작업을 식별합니다. `op` 필드의 값은 `c`, `u`, `d`, `r`이며, 각각 생성, 업데이트, 삭제, 읽기에 해당합니다. 기본 키 컬럼이 업데이트되면 Flink CDC는 다운스트림으로 DELETE 및 INSERT 이벤트를 전송합니다. 데이터가 Doris에 동기화되면 기본 키 컬럼의 데이터가 자동으로 업데이트됩니다.

**사용법**

Flink 프로그램은 위의 CDC 동기화 예제를 참고하여 작성할 수 있습니다. 작업이 성공적으로 제출되면 MySQL 측에서 기본 키 컬럼에 Update 문(예: `update student set id = '1002' where id = '1001'`)을 실행하여 Doris의 데이터를 수정합니다.
