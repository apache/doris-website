---
{
    "title": "Alibaba Cloud DLF Rest Catalog 연동",
    "language": "ko",
    "description": "이 문서에서는 Apache Doris를 Alibaba Cloud DLF(Data Lake Formation) Rest Catalog와 연동하여 Iceberg 테이블 데이터에 원활하게 접근하고 분석하는 방법을 설명합니다. Catalog 생성, 데이터 쿼리, 증분 읽기에 대한 안내도 포함합니다."
}
---

Alibaba Cloud의 [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf)은 클라우드 네이티브 데이터 레이크 아키텍처의 핵심 구성 요소로, 사용자가 클라우드 네이티브 데이터 레이크 솔루션을 빠르게 구축하도록 지원합니다. DLF는 데이터 레이크의 통합 메타데이터 관리, 엔터프라이즈 수준의 권한 제어, 여러 컴퓨팅 엔진과의 원활한 연동을 제공하여 데이터 사일로를 해소하고 비즈니스 인사이트를 얻을 수 있도록 합니다.

- 메타데이터 및 스토리지 통합

    빅데이터 컴퓨팅 엔진이 동일한 레이크 메타데이터와 스토리지를 공유하므로 레이크 제품 간에 데이터가 원활하게 흐릅니다.

- 권한 관리 통합

    빅데이터 컴퓨팅 엔진이 동일한 레이크 테이블 권한 설정을 공유하므로 한 번 설정하면 모든 엔진에 적용됩니다.

- 스토리지 최적화

    작은 파일 컴팩션, 만료된 스냅샷 정리, 파티션 재구성, 더 이상 사용하지 않는 파일 정리 등의 최적화 전략을 제공하여 스토리지 효율을 높입니다.

- 포괄적인 클라우드 생태계 지원

    스트리밍 및 배치 컴퓨팅 엔진을 비롯한 Alibaba Cloud 제품과 긴밀하게 연동되어 즉시 사용할 수 있는 기능과 향상된 사용자 경험을 제공합니다.

Doris는 4.1.0 버전부터 DLF Iceberg Rest Catalog 연동을 지원하며, DLF에 원활하게 연결하여 Iceberg 테이블 데이터에 접근하고 분석할 수 있습니다. 이 문서에서는 Apache Doris를 DLF에 연결하고 Iceberg 테이블 데이터에 접근하는 방법을 설명합니다.

:::tip
이 기능은 Doris 4.1.0 버전부터 지원됩니다.
:::

## 사용 가이드 {#usage-guide}

### 01 DLF 서비스 활성화 {#01-enable-dlf-service}

DLF 공식 문서를 참고하여 DLF 서비스를 활성화하고 해당 Catalog, 데이터베이스, 테이블을 생성하세요.

### 02 EMR Spark SQL로 DLF에 접근 {#02-access-dlf-using-emr-spark-sql}

- 연결

    ```shell
    spark-sql --master yarn \
        --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
        --conf spark.sql.catalog.iceberg=org.apache.iceberg.spark.SparkCatalog \
        --conf spark.sql.catalog.iceberg.catalog-impl=org.apache.iceberg.rest.RESTCatalog \
        --conf spark.sql.catalog.iceberg.uri=http://<region>-vpc.dlf.aliyuncs.com/iceberg \
        --conf spark.sql.catalog.iceberg.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.iceberg.credential=<ak>:<sk>
    ```

    > `<region>`, `warehouse`, `<ak>`, `<sk>`를 각각 알맞은 값으로 바꾸세요.

- 데이터 쓰기

    ```sql
    USE iceberg.<your-catalog-name>;

    CREATE TABLE users_samples
    (
        user_id INT,             
        age_level STRING,           
        final_gender_code STRING,    
        clk BOOLEAN
    ) USING iceberg;

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

### 03 Doris로 DLF에 연결 {#03-connect-to-dlf-using-doris}

- Iceberg Catalog 생성

    ```sql
    CREATE CATALOG ice PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://<region>-vpc.dlf.aliyuncs.com/iceberg',
        'warehouse' = '<your-catalog-name>',
        'iceberg.rest.sigv4-enabled' = 'true',
        'iceberg.rest.signing-name' = 'DlfNext',
        'iceberg.rest.access-key-id' = '<ak>',
        'iceberg.rest.secret-access-key' = '<sk>',
        'iceberg.rest.signing-region' = '<region>',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        'io-impl' = 'org.apache.iceberg.rest.DlfFileIO',
        'fs.oss.support' = 'true'
    );
    ```

    - Doris는 DLF가 반환한 임시 자격 증명으로 OSS 객체 스토리지에 접근하므로 별도의 OSS 자격 증명이 필요하지 않습니다.
    - DLF는 동일한 VPC 내에서만 접근할 수 있습니다. 올바른 URI 주소를 입력하세요.
    - DLF Iceberg REST Catalog를 사용하려면 SigV4 서명을 활성화하고 DLF 전용 서명 이름인 `DlfNext`를 사용해야 합니다.

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
