---
{
    "title": "Alibaba Cloud DLF Rest Catalog 통합",
    "language": "ko",
    "description": "이 문서에서는 Apache Doris를 Alibaba Cloud DLF(Data Lake Formation) Rest Catalog와 통합하여 Paimon 테이블 데이터에 원활하게 액세스하고 분석하는 방법을 설명합니다. Catalog 생성, 데이터 쿼리, 증분 읽기 방법도 안내합니다."
}
---

클라우드 네이티브 데이터 레이크 아키텍처의 핵심 구성 요소인 Alibaba Cloud [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf)는 사용자가 클라우드 네이티브 데이터 레이크 솔루션을 빠르게 구축할 수 있도록 지원합니다. DLF는 데이터 레이크의 통합 메타데이터 관리, 엔터프라이즈급 권한 제어, 다양한 컴퓨팅 엔진과의 원활한 통합을 제공하여 데이터 사일로를 해소하고 비즈니스 인사이트를 도출할 수 있도록 합니다.

- 메타데이터 및 스토리지 통합

    빅데이터 컴퓨팅 엔진이 단일 데이터 레이크 메타데이터와 스토리지를 공유하므로 데이터 레이크 제품 간에 데이터가 원활하게 이동합니다.

- 권한 관리 통합

    빅데이터 컴퓨팅 엔진이 단일 데이터 레이크 테이블 권한 설정을 공유하므로 한 번만 설정하면 모든 엔진에 적용됩니다.

- 스토리지 최적화

    작은 파일 압축 병합, 만료된 스냅샷 정리, 파티션 재구성, 더 이상 사용하지 않는 파일 정리 등의 최적화 전략을 제공하여 스토리지 효율을 높입니다.

- 폭넓은 클라우드 생태계 지원

    스트리밍 및 배치 컴퓨팅 엔진을 비롯한 Alibaba Cloud 제품과 긴밀하게 통합되어 즉시 사용할 수 있는 기능과 향상된 사용자 경험을 제공합니다.

DLF는 버전 2.5부터 Paimon Rest Catalog를 지원합니다. Doris는 버전 3.0.3/3.1.0부터 DLF 2.5+ Paimon Rest Catalog와의 통합을 지원하므로 DLF에 원활하게 연결하여 Paimon 테이블 데이터에 액세스하고 분석할 수 있습니다. 이 문서에서는 Apache Doris를 DLF 2.5+에 연결하고 Paimon 테이블 데이터에 액세스하는 방법을 설명합니다.

:::tip
이 기능은 Doris 버전 3.0.3/3.1.0부터 지원됩니다.
:::

## 사용 가이드 {#usage-guide}

### 01 DLF 서비스 활성화 {#01-enable-dlf-service}

DLF 공식 문서를 참고하여 DLF 서비스를 활성화하고 해당 Catalog, 데이터베이스, 테이블을 생성하세요.

### 02 EMR Spark SQL을 사용하여 DLF에 액세스 {#02-access-dlf-using-emr-spark-sql}

- 연결

    ```sql
    spark-sql --master yarn \
        --conf spark.driver.memory=5g \
        --conf spark.sql.defaultCatalog=paimon \
        --conf spark.sql.catalog.paimon=org.apache.paimon.spark.SparkCatalog \
        --conf spark.sql.catalog.paimon.metastore=rest \
        --conf spark.sql.extensions=org.apache.paimon.spark.extensions.PaimonSparkSessionExtensions \
        --conf spark.sql.catalog.paimon.uri=http://<region>-vpc.dlf.aliyuncs.com \
        --conf spark.sql.catalog.paimon.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.paimon.token.provider=dlf \
        --conf spark.sql.catalog.paimon.dlf.token-loader=ecs
    ```

    > `warehouse`와 `uri`를 각각 알맞은 값과 주소로 바꾸세요.

- 데이터 쓰기

    ```sql
    USE <your-catalog-name>;

    CREATE TABLE users_samples
    (
        user_id INT,             
        age_level STRING,           
        final_gender_code STRING,    
        clk BOOLEAN
    );

    INSERT INTO users_samples VALUES
    (1, '25-34', 'M', true),
    (2, '18-24', 'F', false);

    INSERT INTO users_samples VALUES
    (3, '25-34', 'M', true),
    (4, '18-24', 'F', false);

    INSERT INTO users_samples VALUES
    (5, '25-34', 'M', true),
    (6, '18-24', 'F', false);
    ```

    다음 오류가 발생하면 `paimon-jindo-x.y.z.jar` 파일을 `/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3`에서 제거한 다음 Spark 서비스를 다시 시작하고 재시도하세요.

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```

### 03 Doris를 사용하여 DLF에 연결 {#03-connect-to-dlf-using-doris}

- Paimon Catalog 생성

    ```sql
    CREATE CATALOG paimon_dlf_test PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'rest',
        'uri' = 'http://<region>-vpc.dlf.aliyuncs.com',
        'warehouse' = '<your-catalog-name>',
        'paimon.rest.token.provider' = 'dlf',
        'paimon.rest.dlf.access-key-id' = '<ak>',
        'paimon.rest.dlf.access-key-secret' = '<sk>'
    );
    ```

    - Doris는 DLF가 반환하는 임시 자격 증명을 사용하여 OSS 객체 스토리지에 액세스하므로 별도의 OSS 자격 증명이 필요하지 않습니다.
    - DLF는 동일한 VPC 내에서만 액세스할 수 있습니다. 올바른 URI 주소를 입력하세요.

- 데이터 쿼리

    ```sql
    SELECT * FROM users_samples ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       1 | 25-34     | M                 |    1 |
    |       2 | 18-24     | F                 |    0 |
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    |       5 | 25-34     | M                 |    1 |
    |       6 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```

- 시스템 테이블 쿼리

    ```sql
    SELECT snapshot_id, commit_time, total_record_count FROM users_samples$snapshots;
    +-------------+-------------------------+--------------------+
    | snapshot_id | commit_time             | total_record_count |
    +-------------+-------------------------+--------------------+
    |           1 | 2025-08-09 05:56:02.906 |                  2 |
    |           2 | 2025-08-13 03:41:32.732 |                  4 |
    |           3 | 2025-08-13 03:41:35.218 |                  6 |
    +-------------+-------------------------+--------------------+
    ```

- 증분 읽기

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
    
