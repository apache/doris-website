---
{
    "title": "Paimon JDBC Catalog",
    "language": "en",
    "description": "This document describes the supported parameters when connecting to and accessing Paimon Catalog metadata services using the JDBC interface."
}
---

This document describes the supported parameters when connecting to and accessing Paimon Catalog metadata services using the JDBC interface through the `CREATE CATALOG` statement.

:::tip Note
This is an experimental feature, supported since version 4.1.0.
:::

## Parameter Overview

| Property Name | Description | Default Value | Required |
| --- | --- | --- | --- | 
| paimon.jdbc.uri | Specifies the JDBC connection URI | - | Yes |
| paimon.jdbc.user | JDBC connection username | - | Yes |
| paimon.jdbc.password | JDBC connection password | - | Yes |
| warehouse | Specifies the Paimon warehouse | - | Yes |
| paimon.jdbc.driver_class | JDBC driver class name, such as `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver`, etc. | - | No |
| paimon.jdbc.driver_url | Path to JDBC driver JAR file | - | No |

> Note:
>
> 1. Paimon JDBC Catalog supports various relational databases as backend storage, including PostgreSQL, MySQL, etc.
>
> 2. Ensure the JDBC driver JAR file is accessible. You can specify the driver location via `paimon.jdbc.driver_url`.

## Example Configurations

### PostgreSQL as Metadata Storage

Using PostgreSQL database to store Paimon metadata:

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

### MySQL as Metadata Storage

Using MySQL database to store Paimon metadata:

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
