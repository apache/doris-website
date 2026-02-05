---
{
    "title": "MySQL to Doris",
    "language": "en",
    "description": "Comprehensive guide to migrating data from MySQL to Apache Doris"
}
---

This guide covers migrating data from MySQL to Apache Doris. MySQL is one of the most common migration sources, and Doris provides excellent compatibility with MySQL protocol, making migration straightforward.

## Considerations

1. **Protocol Compatibility**: Doris is MySQL protocol compatible, so existing MySQL clients and tools work with Doris.

2. **Real-time Requirements**: If you need real-time synchronization, Flink CDC is the recommended approach with support for automatic table creation and schema changes.

3. **Full Database Sync**: The Flink Doris Connector supports synchronizing entire MySQL databases including DDL operations.

## Data Type Mapping

| MySQL Type | Doris Type | Notes |
|------------|------------|-------|
| BOOLEAN / TINYINT(1) | BOOLEAN | |
| TINYINT | TINYINT | |
| SMALLINT | SMALLINT | |
| MEDIUMINT | INT | |
| INT / INTEGER | INT | |
| BIGINT | BIGINT | |
| FLOAT | FLOAT | |
| DOUBLE | DOUBLE | |
| DECIMAL(P, S) | DECIMAL(P, S) | |
| DATE | DATE | |
| DATETIME | DATETIME | |
| TIMESTAMP | DATETIME | Stored as UTC, converted on read |
| TIME | STRING | Doris does not support TIME type |
| YEAR | INT | |
| CHAR(N) | CHAR(N) | |
| VARCHAR(N) | VARCHAR(N) | |
| TEXT / MEDIUMTEXT / LONGTEXT | STRING | |
| BINARY / VARBINARY | STRING | |
| BLOB / MEDIUMBLOB / LONGBLOB | STRING | |
| JSON | VARIANT | See [VARIANT type](../data-operate/import/complex-types/variant.md) |
| ENUM | STRING | |
| SET | STRING | |
| BIT | BOOLEAN / BIGINT | BIT(1) maps to BOOLEAN |

## Migration Options

### Option 1: Flink CDC (Recommended for Real-time Sync)

Flink CDC captures MySQL binlog changes and streams them to Doris. This is the recommended method for:

- Real-time data synchronization
- Full database migration with automatic table creation
- Continuous sync with schema evolution support

#### Prerequisites

- MySQL 5.7+ or 8.0+ with binlog enabled
- Flink 1.15+ with Flink CDC 3.x and Flink Doris Connector

#### Step 1: Configure MySQL Binlog

Ensure these settings in MySQL:

```ini
[mysqld]
server-id = 1
log_bin = mysql-bin
binlog_format = ROW
binlog_row_image = FULL
expire_logs_days = 7
```

Create a user for CDC:

```sql
CREATE USER 'flink_cdc'@'%' IDENTIFIED BY 'password';
GRANT SELECT, RELOAD, SHOW DATABASES, REPLICATION SLAVE, REPLICATION CLIENT ON *.* TO 'flink_cdc'@'%';
FLUSH PRIVILEGES;
```

#### Step 2: Single Table Sync with Flink SQL

```sql
-- Source: MySQL CDC
CREATE TABLE mysql_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at TIMESTAMP(3),
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'mysql-cdc',
    'hostname' = 'mysql-host',
    'port' = '3306',
    'username' = 'flink_cdc',
    'password' = 'password',
    'database-name' = 'source_db',
    'table-name' = 'orders',
    'server-time-zone' = 'UTC'
);

-- Sink: Doris
CREATE TABLE doris_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at DATETIME
) WITH (
    'connector' = 'doris',
    'fenodes' = 'doris-fe:8030',
    'table.identifier' = 'target_db.orders',
    'username' = 'doris_user',
    'password' = 'doris_password',
    'sink.enable-2pc' = 'true',
    'sink.label-prefix' = 'mysql_orders_sync'
);

-- Start synchronization
INSERT INTO doris_orders SELECT * FROM mysql_orders;
```

#### Step 3: Full Database Sync with Flink Doris Connector

The Flink Doris Connector provides a powerful whole-database sync feature:

```shell
<FLINK_HOME>/bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    flink-doris-connector-1.18-25.1.0.jar \
    mysql-sync-database \
    --database source_db \
    --mysql-conf hostname=mysql-host \
    --mysql-conf port=3306 \
    --mysql-conf username=flink_cdc \
    --mysql-conf password=password \
    --mysql-conf database-name=source_db \
    --doris-conf fenodes=doris-fe:8030 \
    --doris-conf username=doris_user \
    --doris-conf password=doris_password \
    --doris-conf jdbc-url=jdbc:mysql://doris-fe:9030 \
    --table-conf replication_num=3 \
    --including-tables "orders|customers|products"
```

Key options:

| Parameter | Description |
|-----------|-------------|
| `--including-tables` | Regex pattern for tables to include |
| `--excluding-tables` | Regex pattern for tables to exclude |
| `--multi-to-one-origin` | Map multiple source tables to one target |
| `--create-table-only` | Only create tables without syncing data |

### Option 2: JDBC Catalog

The JDBC Catalog allows direct querying and batch migration from MySQL.

#### Step 1: Download MySQL JDBC Driver

```bash
wget https://repo1.maven.org/maven2/mysql/mysql-connector-java/8.0.33/mysql-connector-java-8.0.33.jar
cp mysql-connector-java-8.0.33.jar $DORIS_HOME/fe/jdbc_drivers/
cp mysql-connector-java-8.0.33.jar $DORIS_HOME/be/jdbc_drivers/
```

#### Step 2: Create MySQL Catalog

```sql
CREATE CATALOG mysql_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'mysql_user',
    'password' = 'mysql_password',
    'jdbc_url' = 'jdbc:mysql://mysql-host:3306/source_db',
    'driver_url' = 'mysql-connector-java-8.0.33.jar',
    'driver_class' = 'com.mysql.cj.jdbc.Driver'
);
```

#### Step 3: Query and Migrate

```sql
-- Explore source data
SWITCH mysql_catalog;
SHOW DATABASES;
USE source_db;
SHOW TABLES;
SELECT * FROM orders LIMIT 10;

-- Create target table in Doris
SWITCH internal;
CREATE TABLE target_db.orders (
    order_id INT,
    customer_id INT,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(32)
)
UNIQUE KEY(order_id, order_date)
PARTITION BY RANGE(order_date) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "DAY",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "replication_num" = "3"
);

-- Migrate data
INSERT INTO internal.target_db.orders
SELECT order_id, customer_id, order_date, total_amount, status
FROM mysql_catalog.source_db.orders;
```

### Option 3: DataX

[DataX](https://github.com/alibaba/DataX) is a widely-used data synchronization tool that supports MySQL to Doris migration.

#### DataX Job Configuration

```json
{
    "job": {
        "setting": {
            "speed": {
                "channel": 4
            }
        },
        "content": [{
            "reader": {
                "name": "mysqlreader",
                "parameter": {
                    "username": "mysql_user",
                    "password": "mysql_password",
                    "connection": [{
                        "querySql": ["SELECT order_id, customer_id, order_date, total_amount, status FROM orders"],
                        "jdbcUrl": ["jdbc:mysql://mysql-host:3306/source_db"]
                    }]
                }
            },
            "writer": {
                "name": "doriswriter",
                "parameter": {
                    "feLoadUrl": ["doris-fe:8030"],
                    "jdbcUrl": "jdbc:mysql://doris-fe:9030/",
                    "database": "target_db",
                    "table": "orders",
                    "username": "doris_user",
                    "password": "doris_password",
                    "loadProps": {
                        "format": "json",
                        "strip_outer_array": true
                    }
                }
            }
        }]
    }
}
```

Run the job:

```bash
python datax.py mysql_to_doris.json
```

## Handling Common Issues

### Auto Increment Columns

MySQL AUTO_INCREMENT columns should map to Doris's auto-increment feature:

```sql
-- Doris table with auto increment
CREATE TABLE users (
    user_id BIGINT AUTO_INCREMENT,
    username VARCHAR(64),
    email VARCHAR(128)
)
UNIQUE KEY(user_id)
DISTRIBUTED BY HASH(user_id) BUCKETS 8;
```

For migration, you may want to preserve original IDs:

```sql
-- Disable auto increment during migration
INSERT INTO users (user_id, username, email)
SELECT user_id, username, email
FROM mysql_catalog.source_db.users;
```

### Handling ENUM and SET Types

MySQL ENUM and SET types are migrated as STRING in Doris:

```sql
-- MySQL source
CREATE TABLE products (
    id INT,
    status ENUM('active', 'inactive', 'pending'),
    tags SET('featured', 'sale', 'new')
);

-- Doris target
CREATE TABLE products (
    id INT,
    status VARCHAR(32),
    tags VARCHAR(128)
)
DISTRIBUTED BY HASH(id) BUCKETS 8;
```

### Handling Binary Data

Binary data (BLOB, BINARY) is typically stored as base64-encoded STRING:

```sql
-- Use HEX encoding for binary data
INSERT INTO doris_table
SELECT
    id,
    HEX(binary_col) as binary_hex
FROM mysql_catalog.source_db.table_with_binary;
```

### Large Table Migration Performance

For tables with billions of rows:

1. **Increase Flink parallelism**:
```sql
SET 'parallelism.default' = '8';
```

2. **Tune Doris write buffer**:
```sql
-- In Flink sink configuration
'sink.buffer-size' = '1048576',
'sink.buffer-count' = '3'
```

3. **Use batch mode for initial load**:
```sql
-- Flink sink batch configuration
'sink.enable-2pc' = 'false',
'sink.properties.format' = 'json'
```

## Multi-Tenant Migration

For MySQL instances with multiple databases:

```shell
# Sync multiple databases
<FLINK_HOME>/bin/flink run \
    -c org.apache.doris.flink.tools.cdc.CdcTools \
    flink-doris-connector.jar \
    mysql-sync-database \
    --database "db1|db2|db3" \
    --mysql-conf hostname=mysql-host \
    --mysql-conf database-name="db1|db2|db3" \
    --doris-conf fenodes=doris-fe:8030 \
    --including-tables ".*"
```

## Validation

After migration, validate data integrity:

```sql
-- Row count comparison
SELECT
    'mysql' as source,
    COUNT(*) as cnt
FROM mysql_catalog.source_db.orders
UNION ALL
SELECT
    'doris' as source,
    COUNT(*) as cnt
FROM internal.target_db.orders;

-- Checksum validation (sample)
SELECT
    SUM(order_id) as id_sum,
    SUM(total_amount) as amount_sum,
    COUNT(DISTINCT customer_id) as unique_customers
FROM internal.target_db.orders;

-- Compare with MySQL
SELECT
    SUM(order_id) as id_sum,
    SUM(total_amount) as amount_sum,
    COUNT(DISTINCT customer_id) as unique_customers
FROM mysql_catalog.source_db.orders;
```

## Next Steps

- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Detailed connector documentation
- [Loading Data](../data-operate/import/load-manual.md) - Alternative import methods
- [Data Model](../table-design/data-model/overview.md) - Choose the right table model
