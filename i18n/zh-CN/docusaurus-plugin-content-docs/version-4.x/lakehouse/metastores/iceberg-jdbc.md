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
| iceberg.jdbc.init-catalog-tables | 是否在首次使用时自动初始化 Catalog 相关的表结构 | `true` | 否 |
| iceberg.jdbc.schema-version | JDBC Catalog 使用的 Schema 版本，支持 `V0` 和 `V1` | `V0` | 否 |
| iceberg.jdbc.strict-mode | 是否启用严格模式，严格模式下会对元数据进行更严格的校验 | `false` | 否 |
| iceberg.jdbc.driver_class | JDBC 驱动类名，如 `org.postgresql.Driver`，`com.mysql.cj.jdbc.Driver` 等 | - | 否 |
| iceberg.jdbc.driver_url | JDBC 驱动 JAR 包的路径 | - | 否 |

> 注：
>
> 1. Iceberg JDBC Catalog 支持多种关系型数据库作为后端存储，包括 PostgreSQL、MySQL、SQLite 等。
>
> 2. 需要确保 JDBC 驱动 JAR 包可访问。可以通过 `iceberg.jdbc.driver_url` 指定驱动位置。

## 示例配置

### PostgreSQL 作为元数据存储

使用 PostgreSQL 数据库存储 Iceberg 元数据：

```sql
CREATE CATALOG iceberg_jdbc_postgresql PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/iceberg_db',
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.postgresql.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
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
    'iceberg.jdbc.user' = 'iceberg_user',
    'iceberg.jdbc.password' = 'password',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>'
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### SQLite 作为元数据存储

使用 SQLite 数据库存储 Iceberg 元数据（适用于测试环境）：

```sql
CREATE CATALOG iceberg_jdbc_sqlite PROPERTIES (
    'type' = 'iceberg',
    'iceberg.catalog.type' = 'jdbc',
    'iceberg.jdbc.uri' = 'jdbc:sqlite:/tmp/iceberg_catalog.db',
    'iceberg.jdbc.init-catalog-tables' = 'true',
    'iceberg.jdbc.schema-version' = 'V1',
    'iceberg.jdbc.driver_class' = 'org.sqlite.JDBC',
    'iceberg.jdbc.driver_url' = '<jdbc_driver_jar>'
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
