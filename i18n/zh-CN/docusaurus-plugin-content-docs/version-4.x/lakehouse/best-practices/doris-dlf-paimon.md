---
{
    "title": "集成阿里云 DLF Rest Catalog",
    "language": "zh-CN",
    "description": "阿里云数据湖构建 Data Lake Formation，DLF 作为云原生数据湖架构核心组成部分，帮助用户快速地构建云原生数据湖架构。数据湖构建提供湖上元数据统一管理、企业级权限控制，并无缝对接多种计算引擎，打破数据孤岛，洞察业务价值。"
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

DLF 2.5 版本开始支持 Paimon Rest Catalog。Doris 自 3.1.0 版本开始，支持集成 DLF 2.5+ 版本的 Paimon Rest Catalog，可以无缝对接 DLF，访问并分析 Paimon 表数据。本文将演示如何使用 Apache Doris 对接 DLF 2.5+ 版本并进行 Paimon 表数据访问。

:::tip
该功能从 Doris 3.1 开始支持
:::

## 使用指南

### 01 开通 DLF 服务

请参考 DLF 官方文档开通 DLF 服务，并创建相应的 Catalog、Database 和 Table。

### 02 使用 EMR Spark SQL 访问 DLF

- 连接

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

    > 替换对应的 `warehouse` 和 `uri` 地址。

- 写入数据

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

    如遇到以下错误，请尝试移除 `/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3` 下的 `paimon-jindo-x.y.z.jar` 后重启 Spark 服务并重试。

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```

### 03 使用 Doris 链接 DLF

- 创建 Paimon Catalog

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

    - Doris 会使用 DLF 返回的临时凭证访问 OSS 对象存储，不需要额外提供 OSS 的凭证信息。
    - 仅支持在同 VPC 内访问 DLF，注意提供正确的 uri 地址。

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

- 查询系统表

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

- 增量读取

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
