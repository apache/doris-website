---
{
    "title": "Hive/Iceberg에서 TPC-H 생성",
    "language": "ko",
    "description": "Doris는 Trino Connector 호환 프레임워크를 통해 TPCH Connector로 TPCH 테스트 데이터 세트를 빠르게 구축할 수 있도록 지원합니다."
}
---

Doris는 [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide) 호환 프레임워크를 통해 [TPCH Connector](https://trino.io/docs/current/connector/tpch.html)로 TPCH 테스트 데이터 세트를 빠르게 구축할 수 있도록 지원합니다.

Hive/Iceberg 테이블의 데이터 쓰기 기능을 함께 활용하면 Doris를 통해 Doris, Hive 및 Iceberg 테이블용 TPCH 테스트 데이터 세트를 빠르게 구축할 수 있습니다.

이 문서에서는 TPCH Connector를 배포하고 사용하여 테스트 데이터 세트를 구축하는 방법을 주로 설명합니다.

:::tip
이 기능은 Doris 버전 3.0.0부터 지원됩니다.
:::

## TPCH Connector 컴파일 {#compile-tpch-connector}

> JDK 버전 17이 필요합니다.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpch
mvn clean install -DskipTests
```

컴파일이 완료되면 `trino-tpch-435/` 디렉터리가 `trino/plugin/trino-tpch/target/` 아래에 생성됩니다.

미리 컴파일된 [trino-tpch-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpch-435.tar.gz)를 직접 다운로드하여 압축을 풀 수도 있습니다.

## TPCH Connector 배포 {#deploy-tpch-connector}

`trino-tpch-435/` 디렉터리를 모든 FE 및 BE 배포 경로의 `connectors/` 디렉터리에 배치합니다. (해당 디렉터리가 없으면 직접 생성할 수 있습니다.)

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpch-435
...
```

배포 후에는 Connector를 올바르게 불러올 수 있도록 FE 및 BE 노드를 재시작하는 것이 좋습니다.

## TPCH Catalog 생성 {#create-tpch-catalog}

```sql
CREATE CATALOG `tpch` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpch",
    "trino.tpch.column-naming" = "STANDARD",
    "trino.tpch.splits-per-node" = "32"
);
```

`tpch.splits-per-node`는 동시 실행 수입니다. 최적의 동시 실행 수준을 확보하려면 BE 머신당 코어 수의 2배로 설정하는 것이 좋습니다. 이렇게 하면 데이터 생성 효율이 향상됩니다.

`"tpch.column-naming" = "STANDARD"`이면 TPCH 테이블의 열 이름은 `l_orderkey`와 같이 테이블 이름의 약어로 시작하며, 그렇지 않으면 `orderkey`가 됩니다.

## TPCH Catalog 사용 {#use-tpch-catalog}

TPCH Catalog에는 서로 다른 Scale Factors가 적용된 TPCH 데이터 세트가 미리 구성되어 있으며, `SHOW DATABASES` 및 `SHOW TABLES` 명령으로 확인할 수 있습니다.

```sql
mysql> SWITCH tpch;
Query OK, 0 rows affected (0.00 sec)

mysql> SHOW DATABASES;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| mysql              |
| sf1                |
| sf100              |
| sf1000             |
| sf10000            |
| sf100000           |
| sf300              |
| sf3000             |
| sf30000            |
| tiny               |
+--------------------+

mysql> USE sf1;
mysql> SHOW TABLES;
+---------------+
| Tables_in_sf1 |
+---------------+
| customer      |
| lineitem      |
| nation        |
| orders        |
| part          |
| partsupp      |
| region        |
| supplier      |
+---------------+
```

SELECT 문으로 이 테이블들을 직접 쿼리할 수 있습니다.

:::tip
미리 구성된 이 데이터 세트의 데이터는 실제로 저장되어 있지 않고 쿼리 중에 실시간으로 생성됩니다. 따라서 이 데이터 세트는 직접 Benchmark 테스트를 수행하기에는 적합하지 않습니다. `INSERT INTO SELECT`를 통해 다른 대상 테이블(Doris 내부 테이블, Hive, Iceberg 및 Doris가 쓰기를 지원하는 그 밖의 모든 데이터 소스)에 데이터 세트를 기록한 다음, 해당 대상 테이블에서 성능 테스트를 수행하는 데 적합합니다.
:::

## TPCH 테스트 데이터 세트 구축 {#build-tpch-test-dataset}

다음 예제는 CTAS 문을 사용하여 Hive에 TPCH 테스트 데이터 세트를 빠르게 구축합니다.

```sql
CREATE TABLE hive.tpch100.customer PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.customer  ;
CREATE TABLE hive.tpch100.lineitem PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.lineitem  ;
CREATE TABLE hive.tpch100.nation   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.nation    ;
CREATE TABLE hive.tpch100.orders   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.orders    ;
CREATE TABLE hive.tpch100.part     PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.part      ;
CREATE TABLE hive.tpch100.partsupp PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.partsupp  ;
CREATE TABLE hive.tpch100.region   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.region    ;
CREATE TABLE hive.tpch100.supplier PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpch.sf100.supplier  ;
```

:::tip
3개의 16C BE 노드로 구성된 Doris 클러스터에서 TPCH 1000 Hive 데이터 세트를 생성하는 데는 약 25분이 걸리며, TPCH 10000은 약 4~5시간이 걸립니다.
:::
