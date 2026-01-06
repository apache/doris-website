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
| iceberg.jdbc.driver-class | JDBC driver class name, such as `org.postgresql.Driver`, `com.mysql.cj.jdbc.Driver`, etc. | - | No |
| iceberg.jdbc.driver-url | URL of JDBC driver JAR file, supports http/https URL or local file path | - | No |

> Note:
>
> 1. Iceberg JDBC Catalog supports various relational databases as backend storage, including PostgreSQL, MySQL, SQLite, etc.
>
> 2. Ensure the JDBC driver JAR file is accessible. You can specify the driver location via `iceberg.jdbc.driver-url`, or place the driver in the custom_lib directory of Doris FE and BE.
>
> 3. For MySQL databases, it is recommended to use MySQL Connector/J 8.0 or later.
>
> 4. For PostgreSQL databases, it is recommended to use PostgreSQL JDBC Driver 42.x or later.

## Example Configurations

### PostgreSQL as Metadata Storage

Using PostgreSQL database to store Iceberg metadata:

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

### MySQL as Metadata Storage

Using MySQL database to store Iceberg metadata:

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

### Using HDFS as Storage

Combining HDFS storage system with JDBC Catalog:

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

### Specifying JDBC Driver

If you need to explicitly specify the JDBC driver class and driver location:

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

## Usage Notes

1. **Database Initialization**: Before using JDBC Catalog, you need to create the corresponding database (e.g., `iceberg_db`) in the target database. Iceberg will automatically create the required table structures.

2. **Driver Management**:
   - If `iceberg.jdbc.driver-url` is not specified, ensure the JDBC driver JAR file is placed in the `custom_lib` directory of Doris FE and BE.
   - It is recommended to use `iceberg.jdbc.driver-url` to specify the driver location, which allows dynamic driver loading without restarting services.

3. **Performance Considerations**:
   - The performance of JDBC Catalog depends on the performance of the backend database. It is recommended to use high-performance database servers.
   - For large-scale production environments, it is recommended to use high-availability clusters of PostgreSQL or MySQL.

4. **Database Connection Pool**: Doris automatically manages the connection pool to the metadata database, usually no additional configuration is required.

5. **Security Recommendations**:
   - Use a dedicated database user with minimal necessary privileges.
   - In production environments, it is recommended to use SSL/TLS to encrypt database connections.
   - Properly manage database passwords and avoid storing sensitive information in plain text in configurations.
