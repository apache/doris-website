---
{
    "title": "Paimon JDBC Catalog",
    "language": "zh-CN",
    "description": "本文档用于介绍通过 CREATE CATALOG 语句连接并访问使用 JDBC 接口的 Paimon Catalog 元数据服务时所支持的参数。"
}
---

本文档用于介绍通过 `CREATE CATALOG` 语句连接并访问使用 JDBC 接口的 Paimon Catalog 元数据服务时所支持的参数。

:::tip 提示
该功能为试验功能，自 4.1.0 版本支持。
:::

## 参数总览

|属性名称 | 描述 | 默认值 | 是否必须 |
| --- | --- | --- | --- | 
| `paimon.jdbc.uri` | 指定 JDBC 连接地址 | - | 是 |
| `paimon.jdbc.user` | JDBC 连接用户名 | - | 是 |
| `paimon.jdbc.password` | JDBC 连接密码 | - | 是 |
| `warehouse` | 指定 Paimon warehouse | - | 是 |
| `paimon.jdbc.driver_class` | JDBC 驱动类名，如 `org.postgresql.Driver`，`com.mysql.cj.jdbc.Driver` 等 | - | 否 |
| `paimon.jdbc.driver_url` | JDBC 驱动 JAR 包的路径 | - | 否 |

> 注：
>
> 1. Paimon JDBC Catalog 支持多种关系型数据库作为后端存储，包括 PostgreSQL、MySQL 等。
>
> 2. 需要确保 JDBC 驱动 JAR 包可访问。可以通过 `paimon.jdbc.driver_url` 指定驱动位置。

## 示例配置

### PostgreSQL 作为元数据存储

使用 PostgreSQL 数据库存储 Paimon 元数据：

```sql
CREATE CATALOG paimon_jdbc_postgresql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:postgresql://127.0.0.1:5432/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'org.postgresql.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```

### MySQL 作为元数据存储

使用 MySQL 数据库存储 Paimon 元数据：

```sql
CREATE CATALOG paimon_jdbc_mysql PROPERTIES (
    'type' = 'paimon',
    'paimon.catalog.type' = 'jdbc',
    'paimon.jdbc.uri' = 'jdbc:mysql://127.0.0.1:3306/paimon_db',
    'paimon.jdbc.user' = 'paimon_user',
    'paimon.jdbc.password' = 'password',
    'paimon.jdbc.driver_class' = 'com.mysql.cj.jdbc.Driver',
    'paimon.jdbc.driver_url' = '<jdbc_driver_jar>',
    'warehouse' = 's3://bucket/warehouse',
    's3.access_key' = '<ak>',
    's3.secret_key' = '<sk>',
    's3.endpoint' = 'https://s3.us-east-1.amazonaws.com',
    's3.region' = 'us-east-1'
);
```
