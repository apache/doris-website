---
{
    "title": "Iceberg JDBC Catalog",
    "language": "zh-CN",
    "description": "本文档用于介绍通过 CREATE CATALOG 语句连接并访问使用 JDBC 接口的 Iceberg Catalog 元数据服务时所支持的参数。"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问使用 JDBC 接口的 Iceberg Catalog 元数据服务时所支持的参数。

:::tip 提示
该功能为试验功能，自 4.1.0 版本支持。
:::

## 参数总览

|属性名称 | 描述 | 默认值 | 是否必须 |
| --- | --- | --- | --- | 
| iceberg.jdbc.uri | 指定 JDBC 连接地址 | - | 是 |
| iceberg.jdbc.user | JDBC 连接用户名 | - | 是 |
| iceberg.jdbc.password | JDBC 连接密码 | - | 是 |
| warehouse | 指定 iceberg warehouse | - | 是 |
| iceberg.jdbc.driver-class | JDBC 驱动类名，如 `org.postgresql.Driver`，`com.mysql.cj.jdbc.Driver` 等 | - | 否 |
| iceberg.jdbc.driver-url | JDBC 驱动 JAR 包的 URL 地址，支持 http/https URL 或本地文件路径 | - | 否 |

> 注：
>
> 1. Iceberg JDBC Catalog 支持多种关系型数据库作为后端存储，包括 PostgreSQL、MySQL、SQLite 等。
>
> 2. 需要确保 JDBC 驱动 JAR 包可访问。可以通过 `iceberg.jdbc.driver-url` 指定驱动位置，或将驱动放置在 Doris FE 和 BE 的 custom_lib 目录下。
>
> 3. 对于 MySQL 数据库，建议使用 MySQL Connector/J 8.0 及以上版本。
>
> 4. 对于 PostgreSQL 数据库，建议使用 PostgreSQL JDBC Driver 42.x 及以上版本。

## 示例配置

### PostgreSQL 作为元数据存储

使用 PostgreSQL 数据库存储 Iceberg 元数据：

```sql
CREATE CATALOG iceberg_jdbc_postgresql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.strict-mode' = 'false',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'http://s3.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### MySQL 作为元数据存储

使用 MySQL 数据库存储 Iceberg 元数据：

```sql
CREATE CATALOG iceberg_jdbc_mysql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/iceberg_db',
    'iceberg.jdbc.user' = 'root',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.strict-mode' = 'false',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'http://s3.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### 使用 HDFS 作为存储

结合 HDFS 存储系统使用 JDBC Catalog：

```sql
CREATE CATALOG iceberg_jdbc_hdfs PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.strict-mode' = 'false',
    'warehouse' = 'hdfs://namenode:8020/user/iceberg/warehouse',
    'fs.defaultFS' = 'hdfs://namenode:8020',
    'hadoop.username' = 'hadoop'
);
```

### 指定 JDBC 驱动

如果需要显式指定 JDBC 驱动类和驱动位置：

```sql
CREATE CATALOG iceberg_jdbc_custom_driver PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.driver-class' = 'org.postgresql.Driver',
    'iceberg.jdbc.driver-url' = 'https://jdbc.postgresql.org/download/postgresql-42.6.0.jar',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'http://s3.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

## 使用说明

1. **初始化数据库**：在使用 JDBC Catalog 之前，需要先在目标数据库中创建相应的 database（如 `iceberg_db`）。Iceberg 会自动创建所需的表结构。

2. **驱动管理**：
   - 如果不指定 `iceberg.jdbc.driver-url`，需要确保 JDBC 驱动 JAR 包已放置在 Doris FE 和 BE 的 `custom_lib` 目录下。
   - 推荐使用 `iceberg.jdbc.driver-url` 指定驱动位置，这样可以动态加载驱动，无需重启服务。

3. **性能考虑**：
   - JDBC Catalog 的性能取决于后端数据库的性能，建议使用高性能的数据库服务器。
   - 对于大规模生产环境，建议使用 PostgreSQL 或 MySQL 的高可用集群。

4. **数据库连接池**：Doris 会自动管理到元数据库的连接池，通常情况下无需额外配置。

5. **安全建议**：
   - 使用专用的数据库用户，并授予最小必要权限。
   - 在生产环境中，建议使用 SSL/TLS 加密数据库连接。
   - 妥善保管数据库密码，避免在配置中明文存储敏感信息。
