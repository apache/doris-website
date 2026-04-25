---
{
    "title": "集成阿里云 DLF Rest Catalog",
    "language": "zh-CN",
    "description": "本文介绍如何使用 Apache Doris 集成阿里云 DLF（Data Lake Formation）Rest Catalog，实现 Iceberg 表数据的无缝访问与分析，包括创建 Catalog、查询数据等操作指南。"
}
---

阿里云数据湖构建 [Data Lake Formation，DLF](https://cn.aliyun.com/product/bigdata/dlf) 作为云原生数据湖架构核心组成部分，帮助用户快速地构建云原生数据湖架构。数据湖构建提供湖上元数据统一管理、企业级权限控制，并无缝对接多种计算引擎，打破数据孤岛，洞察业务价值。

- 统一元数据与存储

    大数据计算引擎共享一套湖上元数据和存储，且数据可在环湖产品间流动。

- 统一权限管理

    大数据计算引擎共享一套湖表权限配置，实现一次配置，多处生效。

- 存储优化

    提供小文件合并、过期快照清理、分区整理及废弃文件清理等优化策略，提升存储效率。

- 完善的云生态支持体系

    深度整合阿里云产品，包括流批计算引擎，实现开箱即用，提升用户体验与操作便捷性。

Doris 自 3.0.5/4.1.0 版本开始，支持集成 DLF Iceberg Rest Catalog，可以无缝对接 DLF，访问并分析 Iceberg 表数据。本文将演示如何使用 Apache Doris 对接 DLF 并进行 Iceberg 表数据访问。

:::tip
该功能从 Doris 4.1.0 版本开始支持。
:::

## 使用指南

### 01 开通 DLF 服务

请参考 DLF 官方文档开通 DLF 服务，并创建相应的 Catalog、Database 和 Table。

### 02 使用 EMR Spark SQL 访问 DLF

- 连接

    ```shell
    spark-sql --master yarn \
        --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
        --conf spark.sql.catalog.iceberg=org.apache.iceberg.spark.SparkCatalog \
        --conf spark.sql.catalog.iceberg.catalog-impl=org.apache.iceberg.rest.RESTCatalog \
        --conf spark.sql.catalog.iceberg.uri=http://<region>-vpc.dlf.aliyuncs.com/iceberg \
        --conf spark.sql.catalog.iceberg.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.iceberg.credential=<ak>:<sk>
    ```

    > 替换对应的 `<region>`, `warehouse`, `<ak>`, 和 `<sk>`。

- 写入数据

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

### 03 使用 Doris 连接 DLF

- 创建 Iceberg Catalog

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

    - Doris 会使用 DLF 返回的临时凭证访问 OSS 对象存储，不需要额外提供 OSS 的凭证信息。
    - 仅支持在同 VPC 内访问 DLF，注意提供正确的 uri 地址。
    - 访问 DLF Iceberg REST Catalog 需要启用 SigV4 签名机制，并填写专用的 API 签名名称 `DlfNext` 以及正确的 Region。

- 查询数据

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
