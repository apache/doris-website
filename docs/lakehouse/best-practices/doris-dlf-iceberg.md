---
{
    "title": "Integrating Alibaba Cloud DLF Rest Catalog",
    "language": "en",
    "description": "This article explains how to integrate Apache Doris with Alibaba Cloud DLF (Data Lake Formation) Rest Catalog for seamless access and analysis of Iceberg table data, including guides on creating Catalog, querying data, and incremental reading."
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

Doris supports integration with DLF Iceberg Rest Catalog starting from version 4.1.0, enabling seamless connection to DLF for accessing and analyzing Iceberg table data. This article demonstrates how to connect Apache Doris with DLF and access Iceberg table data.

:::tip
This feature is supported starting from Doris version 4.1.0.
:::

## Usage Guide

### 01 Enable DLF Service

Please refer to the DLF official documentation to enable the DLF service and create the corresponding Catalog, Database, and Table.

### 02 Access DLF Using EMR Spark SQL

- Connect

    ```shell
    spark-sql --master yarn \
        --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
        --conf spark.sql.catalog.iceberg=org.apache.iceberg.spark.SparkCatalog \
        --conf spark.sql.catalog.iceberg.catalog-impl=org.apache.iceberg.rest.RESTCatalog \
        --conf spark.sql.catalog.iceberg.uri=http://<region>-vpc.dlf.aliyuncs.com/iceberg \
        --conf spark.sql.catalog.iceberg.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.iceberg.credential=<ak>:<sk>
    ```

    > Replace the corresponding `<region>`, `warehouse`, `<ak>`, and `<sk>`.

- Write Data

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

### 03 Connect to DLF Using Doris

- Create Iceberg Catalog

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

    - Doris uses the temporary credentials returned by DLF to access OSS object storage, so no additional OSS credentials are required.
    - DLF can only be accessed within the same VPC. Ensure you provide the correct URI address.
    - DLF Iceberg REST catalog requires SigV4 signature enabled, with specific signing name for DLF `DlfNext`.

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
