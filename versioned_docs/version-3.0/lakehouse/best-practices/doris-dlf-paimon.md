---
{
    "title": "Integration with Alibaba DLF",
    "language": "en"
}

---

Alibaba Cloud [Data Lake Formation (DLF)](https://www.alibabacloud.com/en/product/datalake-formation) serves as a core component of cloud-native data lake architecture, helping users quickly build cloud-native data lake architectures. Data Lake Formation provides unified metadata management on the lake, enterprise-level permission control, and seamlessly integrates with multiple computing engines to break data silos and uncover business value.

- Unified Metadata and Storage

    Computing engines share a unified set of lake metadata and storage, enabling data flow between lake ecosystem products.

- Unified Permission Management

    Computing engines share a unified set of lake table permission configurations, achieving one-time configuration with multi-location effectiveness.

- Storage Optimization

    Provides optimization strategies including small file merging, expired snapshot cleanup, partition organization, and obsolete file cleanup to improve storage efficiency.

- Comprehensive Cloud Ecosystem Support

    Deep integration with Alibaba Cloud products, including streaming and batch computing engines, enabling out-of-the-box functionality and enhancing user experience and operational convenience.

Starting from DLF version 2.5, Paimon Rest Catalog is supported. Doris, beginning from version 3.1.0, supports integration with DLF 2.5+ Paimon Rest Catalog, enabling seamless connection to DLF for accessing and analyzing Paimon table data. This document demonstrates how to use Apache Doris to connect to DLF 2.5+ and access Paimon table data.

:::tip
This feature is supported since Doris 3.1
:::

## Usage Guide

### 01 Enable DLF Service

Please refer to the DLF official documentation to enable the DLF service and create corresponding Catalog, Database, and Table.

### 02 Access DLF Using EMR Spark SQL

- Connection

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

    > Replace the corresponding `warehouse` and `uri` address.

- Write Data

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

    If you encounter the following error, please try removing `paimon-jindo-x.y.z.jar` from `/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3` and restart the Spark service before retrying.

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```

### 03 Connect Doris to DLF

- Create Paimon Catalog

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

    - Doris will use temporary credentials returned by DLF to access OSS object storage, without requiring additional OSS credential information.
    - Only supports accessing DLF within the same VPC, ensure you provide the correct uri address.

- Query Data

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

- Query System Tables

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

- Batch Incremental Reading

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
