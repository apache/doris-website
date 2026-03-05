---
{
    "title": "Iceberg JDBC Catalog",
    "language": "en",
    "description": "This document describes the supported parameters when connecting to and accessing Iceberg Catalog metadata services using the JDBC interface."
}
---

This document describes the supported parameters when connecting to and accessing Iceberg Catalog metadata services using the JDBC interface through the `CREATE CATALOG` statement.

:::tip Note
This is an experimental feature, supported since version 4.1.0.
:::

## Parameter Overview

| Property Name | Description | Default Value | Required |
| --- | --- | --- | --- | 
| iceberg.jdbc.uri | Specifies the JDBC connection URI | - | Yes |
| iceberg.jdbc.user | JDBC connection username | - | Yes |
| iceberg.jdbc.password | JDBC connection password | - | Yes |
| warehouse | Specifies the iceberg warehouse | - | Yes |
| iceberg.jdbc.init-catalog-tables | Whether to automatically initialize Catalog-related table structures on first use | `true` | No |
| iceberg.jdbc.schema-version | Schema version used by JDBC Catalog, supports `V0` and `V1` | `V0` | No |
| iceberg.jdbc.strict-mode | Whether to enable strict mode, which performs stricter validation of metadata | `false` | No |
| iceberg.jdbc.driver_class | JDBC driver class name, such as `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver`, etc. | - | No |
| iceberg.jdbc.driver_url | Path to JDBC driver JAR file | - | No |

> Note:
>
> 1. Iceberg JDBC Catalog supports various relational databases as backend storage, including PostgreSQL, MySQL, SQLite, etc.
>
> 2. Ensure the JDBC driver JAR file is accessible. You can specify the driver location via `iceberg.jdbc.driver_url`.

## Example Configurations

### PostgreSQL as Metadata Storage

Using PostgreSQL database to store Iceberg metadata:

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

### MySQL as Metadata Storage

Using MySQL database to store Iceberg metadata:

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

### SQLite as Metadata Storage

Using SQLite database to store Iceberg metadata (suitable for testing environments):

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
