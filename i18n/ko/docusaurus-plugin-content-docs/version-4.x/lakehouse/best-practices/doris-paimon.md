---
{
    "title": "Doris와 Paimon 사용하기",
    "language": "ko",
    "description": "새로운 개방형 데이터 관리 아키텍처인 Data Lakehouse는 데이터 웨어하우스의 높은 성능과 실시간 처리 기능을 결합하여 "
}
---

새로운 개방형 데이터 관리 아키텍처인 Data Lakehouse는 데이터 웨어하우스의 높은 성능과 실시간 처리 기능을 데이터 레이크의 낮은 비용 및 유연성과 결합하여, 사용자가 다양한 데이터 처리 및 분석 요구를 더욱 편리하게 충족할 수 있도록 돕습니다. 기업의 빅데이터 시스템에서도 점점 더 널리 활용되고 있습니다.

최근 버전에서 Apache Doris는 데이터 레이크와의 통합을 강화하며 성숙한 Data Lakehouse 솔루션으로 발전했습니다.

- Apache Doris는 0.15 버전부터 Hive 및 Iceberg 외부 테이블을 도입하여, 데이터 레이크에서 Apache Iceberg와 결합해 활용할 수 있는 가능성을 탐색했습니다.
- Apache Doris는 1.2 버전부터 Multi-Catalog 기능을 공식 도입하여 다양한 데이터 소스의 메타데이터 자동 매핑과 데이터 접근을 지원하고, 외부 데이터 읽기 및 쿼리 실행 성능도 다양하게 최적화했습니다. 이제 빠르고 사용하기 쉬운 Lakehouse 아키텍처를 구축하는 데 필요한 역량을 충분히 갖추었습니다.
- Apache Doris 2.1 버전에서는 Data Lakehouse 아키텍처가 크게 개선되었습니다. 주요 데이터 레이크 형식(Hudi, Iceberg, Paimon 등)의 읽기 및 쓰기 기능을 강화하고, 여러 SQL 방언과의 호환성을 도입했으며, 기존 시스템에서 Apache Doris로 원활하게 마이그레이션할 수 있도록 했습니다. 데이터 과학과 대규모 데이터 읽기 시나리오를 위해 Doris는 Arrow Flight 고속 읽기 인터페이스를 통합하여 데이터 전송 효율을 100배 향상했습니다.

![Doris와 Paimon을 사용한 Lakehouse 구축](/images/lakehouse-architecture-for-doris-and-paimon.png)

## Apache Doris와 Paimon {#apache-doris--paimon}

Apache Paimon은 데이터 레이크 형식과 LSM 구조의 장점을 혁신적으로 결합한 데이터 레이크 형식으로, 데이터 레이크 아키텍처에 효율적인 실시간 스트리밍 업데이트 기능을 도입했습니다. 이를 통해 Paimon은 데이터를 효율적으로 관리하고 실시간 분석을 수행할 수 있으며, 실시간 Data Lakehouse 아키텍처 구축을 강력하게 지원합니다.

Apache Doris는 Paimon의 기능을 충분히 활용하고 Paimon 데이터의 쿼리 효율을 높이기 위해 Paimon의 여러 최신 기능을 네이티브로 지원합니다.

- Hive Metastore, FileSystem 등 다양한 유형의 Paimon Catalog를 지원합니다.
- Paimon 0.6의 Primary Key Table Read Optimized 기능을 네이티브로 지원합니다.
- Paimon 0.8의 Primary Key Table Deletion Vector 기능을 네이티브로 지원합니다.

Apache Doris의 고성능 쿼리 엔진과 Apache Paimon의 효율적인 실시간 스트리밍 업데이트 기능을 통해 사용자는 다음을 구현할 수 있습니다.

- 데이터 레이크에 실시간 데이터 적재: Paimon의 LSM-Tree 모델을 활용하면 데이터 레이크 적재 지연 시간을 분 단위로 줄일 수 있습니다. 또한 Paimon은 집계, 중복 제거, 일부 열 업데이트 등 다양한 데이터 업데이트 기능을 지원하여 데이터 흐름을 더욱 유연하고 효율적으로 처리할 수 있습니다.
- 고성능 데이터 처리 및 분석: Paimon의 Append Only Table, Read Optimized, Deletion Vector 등의 기술을 Doris의 강력한 쿼리 엔진과 원활하게 통합하여 데이터 레이크의 데이터에 대한 쿼리와 분석에 빠르게 응답할 수 있습니다.

앞으로 Apache Doris는 Time Travel과 증분 데이터 읽기 등 Apache Paimon의 고급 기능을 점진적으로 추가 지원하여, 통합된 고성능 실시간 Lakehouse 플랫폼을 함께 구축해 나갈 예정입니다.

이 문서에서는 Docker 환경에서 Apache Doris + Apache Paimon 테스트 및 데모 환경을 빠르게 구성하는 방법을 설명하고, 다양한 기능의 사용법을 보여줍니다.

자세한 내용은 [Paimon Catalog](../catalogs/paimon-catalog.mdx)를 참조하세요.

## 사용자 가이드 {#user-guide}

이 문서에 나오는 모든 스크립트와 코드는 다음 주소에서 확인할 수 있습니다. [https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon](https://github.com/apache/doris/tree/master/samples/datalake/iceberg_and_paimon)

### 01 환경 준비 {#01-environment-preparation}

이 문서에서는 Docker Compose로 배포하며, 구성 요소와 버전은 다음과 같습니다.

| 구성 요소 | 버전 |
| --- | --- |
| Apache Doris | 기본값 2.1.5, 변경 가능 |
| Apache Paimon | 0.8 |
| Apache Flink | 1.18 |
| MinIO | RELEASE.2024-04-29T09-56-05Z |

### 02 환경 배포 {#02-environment-deployment}

1. 모든 구성 요소 시작

	`bash ./start_all.sh`

2. 시작한 후 다음 스크립트로 Flink 명령줄 또는 Doris 명령줄에 로그인할 수 있습니다.

	```
	-- login flink
	bash ./start_flink_client.sh
	
	-- login doris
	bash ./start_doris_client.sh
	```

### 03 데이터 준비 {#03-data-preparation}

Flink 명령줄에 로그인하면 미리 생성된 테이블을 확인할 수 있습니다. 이 테이블에는 이미 일부 데이터가 들어 있으며, Flink SQL로 조회할 수 있습니다.

```
Flink SQL> use paimon.db_paimon;
[INFO] Execute statement succeed.

Flink SQL> show tables;
+------------+
| table name |
+------------+
|   customer |
+------------+
1 row in set

Flink SQL> show create table customer;
+------------------------------------------------------------------------+
|                                                                 result |
+------------------------------------------------------------------------+
| CREATE TABLE `paimon`.`db_paimon`.`customer` (
  `c_custkey` INT NOT NULL,
  `c_name` VARCHAR(25),
  `c_address` VARCHAR(40),
  `c_nationkey` INT NOT NULL,
  `c_phone` CHAR(15),
  `c_acctbal` DECIMAL(12, 2),
  `c_mktsegment` CHAR(10),
  `c_comment` VARCHAR(117),
  CONSTRAINT `PK_c_custkey_c_nationkey` PRIMARY KEY (`c_custkey`, `c_nationkey`) NOT ENFORCED
) PARTITIONED BY (`c_nationkey`)
WITH (
  'bucket' = '1',
  'path' = 's3://warehouse/wh/db_paimon.db/customer',
  'deletion-vectors.enabled' = 'true'
)
 |
+-------------------------------------------------------------------------+
1 row in set

Flink SQL> desc customer;
+--------------+----------------+-------+-----------------------------+--------+-----------+
|         name |           type |  null |                         key | extras | watermark |
+--------------+----------------+-------+-----------------------------+--------+-----------+
|    c_custkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|       c_name |    VARCHAR(25) |  TRUE |                             |        |           |
|    c_address |    VARCHAR(40) |  TRUE |                             |        |           |
|  c_nationkey |            INT | FALSE | PRI(c_custkey, c_nationkey) |        |           |
|      c_phone |       CHAR(15) |  TRUE |                             |        |           |
|    c_acctbal | DECIMAL(12, 2) |  TRUE |                             |        |           |
| c_mktsegment |       CHAR(10) |  TRUE |                             |        |           |
|    c_comment |   VARCHAR(117) |  TRUE |                             |        |           |
+--------------+----------------+-------+-----------------------------+--------+-----------+
8 rows in set

Flink SQL> select * from customer order by c_custkey limit 4;
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
| c_custkey |             c_name |                      c_address | c_nationkey |         c_phone | c_acctbal | c_mktsegment |                      c_comment |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
|         1 | Customer#000000001 |              IVhzIApeRb ot,c,E |          15 | 25-989-741-2988 |    711.56 |     BUILDING | to the even, regular platel... |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak |          13 | 23-768-687-3665 |    121.65 |   AUTOMOBILE | l accounts. blithely ironic... |
|         3 | Customer#000000003 |                   MG9kdTD2WBHm |           1 | 11-719-748-3364 |   7498.12 |   AUTOMOBILE |  deposits eat slyly ironic,... |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tl... |          15 | 25-430-914-2194 |   3471.53 |     BUILDING | cial ideas. final, furious ... |
+-----------+--------------------+--------------------------------+-------------+-----------------+-----------+--------------+--------------------------------+
4 rows in set
```

### 04 데이터 쿼리 {#04-data-query}

아래와 같이 Doris 클러스터에는 `paimon`이라는 Catalog가 이미 생성되어 있습니다(SHOW CATALOGS로 확인 가능). 이 Catalog를 생성하는 문은 다음과 같습니다.

```
-- Already created, no need to run
CREATE CATALOG `paimon` PROPERTIES (
    "type" = "paimon",
    "warehouse" = "s3://warehouse/wh/",
    "s3.endpoint"="http://minio:9000",
    "s3.access_key"="admin",
    "s3.secret_key"="password",
    "s3.region"="us-east-1"
);
```

Doris에서 Paimon의 데이터를 쿼리할 수 있습니다.

```
mysql> use paimon.db_paimon;
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
+---------------------+
| Tables_in_db_paimon |
+---------------------+
| customer            |
+---------------------+
1 row in set (0.00 sec)

mysql> select * from customer order by c_custkey limit 4;
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address                             | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         1 | Customer#000000001 | IVhzIApeRb ot,c,E                     |          15 | 25-989-741-2988 |    711.56 | BUILDING     | to the even, regular platelets. regular, ironic epitaphs nag e                                         |
|         2 | Customer#000000002 | XSTf4,NCwDVaWNe6tEgvwfmRchLXak        |          13 | 23-768-687-3665 |    121.65 | AUTOMOBILE   | l accounts. blithely ironic theodolites integrate boldly: caref                                        |
|         3 | Customer#000000003 | MG9kdTD2WBHm                          |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|        32 | Customer#000000032 | jD2xZzi UmId,DCtNBLXKj9q0Tlp2iQ6ZcO3J |          15 | 25-430-914-2194 |   3471.53 | BUILDING     | cial ideas. final, furious requests across the e                                                       |
+-----------+--------------------+---------------------------------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
4 rows in set (1.89 sec)
```

### 05 증분 데이터 읽기 {#05-read-incremental-data}

Flink SQL로 Paimon 테이블의 데이터를 업데이트할 수 있습니다.

```
Flink SQL> update customer set c_address='c_address_update' where c_nationkey = 1;
[INFO] Submitting SQL update statement to the cluster...
[INFO] SQL update statement has been successfully submitted to the cluster:
Job ID: ff838b7b778a94396b332b0d93c8f7ac
```

Flink SQL 실행이 완료되면 Doris에서 최신 데이터를 바로 확인할 수 있습니다.

```
mysql> select * from customer where c_nationkey=1 limit 2;
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
| c_custkey | c_name             | c_address       | c_nationkey | c_phone         | c_acctbal | c_mktsegment | c_comment                                                                                              |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
|         3 | Customer#000000003 | c_address_update |           1 | 11-719-748-3364 |   7498.12 | AUTOMOBILE   |  deposits eat slyly ironic, even instructions. express foxes detect slyly. blithely even accounts abov |
|       513 | Customer#000000513 | c_address_update |           1 | 11-861-303-6887 |    955.37 | HOUSEHOLD    | press along the quickly regular instructions. regular requests against the carefully ironic s          |
+-----------+--------------------+-----------------+-------------+-----------------+-----------+--------------+--------------------------------------------------------------------------------------------------------+
2 rows in set (0.19 sec)
```

### 벤치마크 {#benchmark}

Paimon(0.8) 버전의 TPCDS 1000 데이터 세트를 대상으로 Apache Doris 2.1.5 버전과 Trino 422 버전을 사용하여 간단한 테스트를 진행했습니다. 두 엔진 모두 Primary Key Table Read Optimized 기능을 활성화했습니다.

![](/images/quick-start/lakehouse-paimon-benchmark.PNG)

테스트 결과, 표준 정적 테스트 세트에서 Doris의 평균 쿼리 성능은 Trino의 3-5배인 것으로 나타났습니다. 앞으로 Deletion Vector를 최적화하여 실제 비즈니스 시나리오의 쿼리 효율을 더욱 높일 예정입니다.

## 쿼리 최적화 {#query-optimization}

Apache Paimon 0.6 버전에 Primary Key Table Read Optimized 기능이 도입된 이후, 쿼리 엔진은 기준 데이터의 하위 Parquet/ORC 파일에 직접 접근할 수 있게 되어 기준 데이터의 읽기 효율이 크게 향상되었습니다. 아직 병합되지 않은 증분 데이터(INSERT, UPDATE 또는 DELETE로 생성된 증분 데이터)는 Merge-on-Read를 통해 읽을 수 있습니다. 또한 Paimon은 0.8 버전에서 Deletion Vector 기능을 도입하여 쿼리 엔진의 증분 데이터 읽기 효율을 더욱 높였습니다.
Apache Doris는 네이티브 Reader를 통해 Deletion Vector를 읽고 Merge on Read를 수행할 수 있습니다. Doris의 EXPLAIN 문을 사용하여 쿼리에서 기준 데이터와 증분 데이터를 읽는 방식을 살펴보겠습니다.

```
mysql> explain verbose select * from customer where c_nationkey < 3;
+------------------------------------------------------------------------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                                                                                |
+------------------------------------------------------------------------------------------------------------------------------------------------+
| ...............                                                                                                                                |
|                                                                                                                                                |
|   0:VPAIMON_SCAN_NODE(68)                                                                                                                      |
|      table: customer                                                                                                                           |
|      predicates: (c_nationkey[#3] < 3)                                                                                                         |
|      inputSplitNum=4, totalFileSize=238324, scanRanges=4                                                                                       |
|      partition=3/0                                                                                                                             |
|      backends:                                                                                                                                 |
|        10002                                                                                                                                   |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-15cee5b7-1bd7-42ca-9314-56d92c62c03b-0.orc start: 0 length: 66600 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=1/bucket-0/data-5d50255a-2215-4010-b976-d5dc656f3444-0.orc start: 0 length: 44501 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=2/bucket-0/data-e98fb7ef-ec2b-4ad5-a496-713cb9481d56-0.orc start: 0 length: 64059 |
|          s3://warehouse/wh/db_paimon.db/customer/c_nationkey=0/bucket-0/data-431be05d-50fa-401f-9680-d646757d0f95-0.orc start: 0 length: 63164 |
|      cardinality=18751, numNodes=1                                                                                                             |
|      pushdown agg=NONE                                                                                                                         |
|      paimonNativeReadSplits=4/4                                                                                                                |
|      PaimonSplitStats:                                                                                                                         |
|        SplitStat [type=NATIVE, rowCount=1542, rawFileConvertable=true, hasDeletionVector=true]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|        SplitStat [type=NATIVE, rowCount=750, rawFileConvertable=true, hasDeletionVector=false]                                                 |
|      tuple ids: 0
| ...............                                                                                                           |                                                                                                  |
+------------------------------------------------------------------------------------------------------------------------------------------------+
67 rows in set (0.23 sec)
```

Flink SQL로 방금 업데이트한 테이블에는 4개의 샤드가 있으며, 모든 샤드에 Native Reader로 접근할 수 있음을 확인할 수 있습니다(paimonNativeReadSplits=4/4). 또한 첫 번째 샤드의 hasDeletionVector 속성이 true이므로 해당 샤드에 대응하는 Deletion Vector가 있으며, 읽을 때 Deletion Vector에 따라 데이터가 필터링됩니다.
