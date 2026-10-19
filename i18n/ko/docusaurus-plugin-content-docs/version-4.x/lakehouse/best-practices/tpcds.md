---
{
    "title": "Hive/Iceberg에서 TPC-DS 생성하기",
    "language": "ko",
    "description": "Doris에서는 Trino Connector 호환 프레임워크를 통해 TPCDS Connector를 사용하여 TPCDS 테스트 데이터 세트를 빠르게 구축할 수 있습니다."
}
---

Doris에서는 [TPCDS Connector](https://trino.io/docs/current/connector/tpcds.html)를 사용하여 [Trino Connector](https://doris.apache.org/community/developer-guide/data-source-extension/trino-connector-developer-guide) 호환 프레임워크를 통해 TPCDS 테스트 데이터 세트를 빠르게 구축할 수 있습니다.

Hive/Iceberg 테이블의 데이터 쓰기 기능을 함께 활용하면 Doris를 통해 Doris, Hive, Iceberg 테이블에 TPCDS 테스트 데이터 세트를 빠르게 구축할 수 있습니다.

이 문서에서는 TPCDS Connector를 배포하고 사용하여 테스트 데이터 세트를 구축하는 방법을 주로 설명합니다.

:::tip
이 기능은 Doris 버전 3.0.0부터 지원됩니다.
:::

## TPCDS Connector 컴파일 {#compile-tpcds-connector}

> JDK 버전 17이 필요합니다.

```shell
git clone https://github.com/trinodb/trino.git
git checkout 435
cd trino/plugin/trino-tpcds
mvn clean install -DskipTests
```

컴파일이 완료되면 `trino-tpcds-435/` 디렉터리가 `trino/plugin/trino-tpcds/target/` 아래에 생성됩니다.

미리 컴파일된 [trino-tpcds-435.tar.gz](https://github.com/morningman/trino-connectors/releases/download/trino-connectors/trino-tpcds-435.tar.gz)를 직접 다운로드하여 압축을 풀어도 됩니다.

## TPCDS Connector 배포 {#deploy-tpcds-connector}

모든 FE 및 BE 배포 경로의 `trino-tpcds-435/` 디렉터리를 `connectors/` 디렉터리 아래에 배치합니다. (해당 디렉터리가 없으면 직접 생성할 수 있습니다.)

```text
├── bin
├── conf
├── connectors
│   ├── trino-tpcds-435
...
```

배포 후에는 Connector를 올바르게 불러올 수 있도록 FE 및 BE 노드를 다시 시작하는 것이 좋습니다.

## TPCDS Catalog 생성 {#create-tpcds-catalog}

```sql
CREATE CATALOG `tpcds` PROPERTIES (
    "type" = "trino-connector",
    "trino.connector.name" = "tpcds",
    "trino.tpcds.split-count" = "32"
);
```

`tpcds.split-count`는 동시 실행 수를 지정합니다. 최적의 동시성을 확보하고 데이터 생성 효율을 높이려면 BE 머신당 코어 수의 2배로 설정하는 것이 좋습니다.

## TPCDS Catalog 사용 {#use-tpcds-catalog}

TPCDS Catalog에는 다양한 Scale Factor의 TPCDS 데이터 세트가 미리 구성되어 있으며, `SHOW DATABASES` 및 `SHOW TABLES` 명령으로 확인할 수 있습니다.

```sql
mysql> SWITCH tpcds;
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
+------------------------+
| Tables_in_sf1          |
+------------------------+
| call_center            |
| catalog_page           |
| catalog_returns        |
| catalog_sales          |
| customer               |
| customer_address       |
| customer_demographics  |
| date_dim               |
| dbgen_version          |
| household_demographics |
| income_band            |
| inventory              |
| item                   |
| promotion              |
| reason                 |
| ship_mode              |
| store                  |
| store_returns          |
| store_sales            |
| time_dim               |
| warehouse              |
| web_page               |
| web_returns            |
| web_sales              |
| web_site               |
+------------------------+
```

SELECT 문을 사용하여 이러한 테이블을 직접 쿼리할 수 있습니다.

:::tip
미리 구성된 이 데이터 세트의 데이터는 실제로 저장되어 있지 않으며 쿼리 시 실시간으로 생성됩니다. 따라서 이 데이터 세트를 직접 Benchmark 테스트에 사용하는 것은 적합하지 않습니다. `INSERT INTO SELECT`를 통해 다른 대상 테이블(Doris 내부 테이블, Hive, Iceberg 및 Doris가 쓰기를 지원하는 기타 데이터 소스)에 데이터 세트를 기록한 다음, 대상 테이블에서 성능 테스트를 수행하는 용도로 적합합니다.
:::

## TPCDS 테스트 데이터 세트 구축 {#build-tpcds-test-data-set}

다음 예제에서는 CTAS 문을 사용하여 Hive에 TPCDS 테스트 데이터 세트를 빠르게 구축합니다.

```sql
CREATE TABLE hive.tpcds100.call_center            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.call_center           ;
CREATE TABLE hive.tpcds100.catalog_page           PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_page          ;
CREATE TABLE hive.tpcds100.catalog_returns        PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_returns       ;
CREATE TABLE hive.tpcds100.catalog_sales          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.catalog_sales         ;
CREATE TABLE hive.tpcds100.customer               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer              ;
CREATE TABLE hive.tpcds100.customer_address       PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer_address      ;
CREATE TABLE hive.tpcds100.customer_demographics  PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.customer_demographics ;
CREATE TABLE hive.tpcds100.date_dim               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.date_dim              ;
CREATE TABLE hive.tpcds100.dbgen_version          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.dbgen_version         ;
CREATE TABLE hive.tpcds100.household_demographics PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.household_demographics;
CREATE TABLE hive.tpcds100.income_band            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.income_band           ;
CREATE TABLE hive.tpcds100.inventory              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.inventory             ;
CREATE TABLE hive.tpcds100.item                   PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.item                  ;
CREATE TABLE hive.tpcds100.promotion              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.promotion             ;
CREATE TABLE hive.tpcds100.reason                 PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.reason                ;
CREATE TABLE hive.tpcds100.ship_mode              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.ship_mode             ;
CREATE TABLE hive.tpcds100.store                  PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store                 ;
CREATE TABLE hive.tpcds100.store_returns          PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store_returns         ;
CREATE TABLE hive.tpcds100.store_sales            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.store_sales           ;
CREATE TABLE hive.tpcds100.time_dim               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.time_dim              ;
CREATE TABLE hive.tpcds100.warehouse              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.warehouse             ;
CREATE TABLE hive.tpcds100.web_page               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_page              ;
CREATE TABLE hive.tpcds100.web_returns            PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_returns           ;
CREATE TABLE hive.tpcds100.web_sales              PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_sales             ;
CREATE TABLE hive.tpcds100.web_site               PROPERTIES("file_format" = "parquet") AS SELECT * FROM tpcds.sf100.web_site              ;
```

:::tip
16C BE 노드 3개로 구성된 Doris 클러스터에서 TPCDS 1000 Hive 데이터 세트를 생성하는 데 약 3~4시간이 걸립니다.
:::
