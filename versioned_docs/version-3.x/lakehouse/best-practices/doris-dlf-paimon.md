---
{
    "title": "Integrating Alibaba Cloud DLF Rest Catalog",
    "language": "en",
    "description": "This article explains how to integrate Apache Doris with Alibaba Cloud DLF (Data Lake Formation) Rest Catalog for seamless access and analysis of Paimon table data, including guides on creating Catalog, querying data, and incremental reading."
}
---

Alibaba Cloud [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf), as a core component of the cloud-native data lake architecture, helps users quickly build cloud-native data lake solutions. DLF provides unified metadata management on the data lake, enterprise-level permission control, and seamless integration with multiple compute engines, breaking down data silos and enabling business insights.

- Unified Metadata and Storage

    Big data compute engines share a single set of lake metadata and storage, with data flowing seamlessly between lake products.

- Unified Permission Management

    Big data compute engines share a single set of lake table permission configurations, enabling one-time setup with universal effect.

- Storage Optimization

    Provides optimization strategies including small file compaction, expired snapshot cleanup, partition reorganization, and obsolete file cleanup to improve storage efficiency.

- Comprehensive Cloud Ecosystem Support

    Deep integration with Alibaba Cloud products, including streaming and batch compute engines, delivering out-of-the-box functionality and enhanced user experience.

DLF supports Paimon Rest Catalog starting from version 2.5. Doris supports integration with DLF 2.5+ Paimon Rest Catalog starting from version 3.0.3/3.1.0, enabling seamless connection to DLF for accessing and analyzing Paimon table data. This article demonstrates how to connect Apache Doris with DLF 2.5+ and access Paimon table data.

:::tip
This feature is supported starting from Doris version 3.0.3/3.1.0.
:::

## Usage Guide

### 01 Enable DLF Service

Please refer to the DLF official documentation to enable the DLF service and create the corresponding Catalog, Database, and Table.

### 02 Access DLF Using EMR Spark SQL

- Connect

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

    > Replace the corresponding `warehouse` and `uri` addresses.

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

    If you encounter the following error, try removing `paimon-jindo-x.y.z.jar` from `/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3`, then restart the Spark service and retry.

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```

### 03 Connect to DLF Using Doris

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

    - Doris uses the temporary credentials returned by DLF to access OSS object storage, so no additional OSS credentials are required.
    - DLF can only be accessed within the same VPC. Ensure you provide the correct URI address.

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

- Incremental Reading

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
    