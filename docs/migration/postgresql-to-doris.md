---
{
    "title": "PostgreSQL to Doris",
    "language": "en",
    "description": "Comprehensive guide to migrating data from PostgreSQL to Apache Doris"
}
---

This guide covers migrating data from PostgreSQL to Apache Doris. You can choose from several migration methods depending on your requirements for real-time sync, data volume, and operational complexity.

## Considerations

1. **Schema Design**: Before migration, select an appropriate Doris [Data Model](../table-design/data-model/overview.md) and plan your [Partitioning](../table-design/data-partitioning/data-distribution.md) and [Bucketing](../table-design/data-partitioning/data-bucketing.md) strategies.

2. **Data Types**: Review the type mapping table below. Some PostgreSQL types require special handling (arrays, timestamps with timezone, JSON).

3. **Primary Keys**: PostgreSQL's serial/identity columns map to Doris INT/BIGINT types. For unique constraints, use Doris's UNIQUE KEY model.

## Data Type Mapping

| PostgreSQL Type | Doris Type | Notes |
|-----------------|------------|-------|
| boolean | BOOLEAN | |
| smallint / int2 | SMALLINT | |
| integer / int4 | INT | |
| bigint / int8 | BIGINT | |
| decimal / numeric | DECIMAL(P,S) | Numeric without precision maps to STRING |
| real / float4 | FLOAT | |
| double precision | DOUBLE | |
| smallserial | SMALLINT | |
| serial | INT | |
| bigserial | BIGINT | |
| char(n) | CHAR(N) | |
| varchar / text | STRING | |
| timestamp | DATETIME | |
| timestamptz | DATETIME | Converted to local timezone; see [Timezone Issues](#handling-timezone-issues) |
| date | DATE | |
| time | STRING | Doris does not support TIME type |
| interval | STRING | |
| json / jsonb | VARIANT | See [VARIANT type](../data-operate/import/complex-types/variant.md) for flexible schema |
| uuid | STRING | |
| bytea | STRING | |
| array | ARRAY | See [Handling Arrays](#handling-arrays) |
| inet / cidr / macaddr | STRING | |
| point / line / polygon | STRING | Geometric types stored as strings |

## Migration Options

### Option 1: JDBC Catalog (Recommended)

The JDBC Catalog provides direct access to PostgreSQL data from Doris. This is the simplest approach for both querying and migrating data.

#### Prerequisites

- PostgreSQL 11.x or higher
- [PostgreSQL JDBC Driver](https://jdbc.postgresql.org/) version 42.5.x or above
- Network connectivity between Doris FE/BE nodes and PostgreSQL (port 5432)

#### Step 1: Download and Deploy JDBC Driver

```bash
# Download the driver
wget https://jdbc.postgresql.org/download/postgresql-42.5.6.jar

# Copy to Doris FE and BE jdbc_drivers directories
cp postgresql-42.5.6.jar $DORIS_HOME/fe/jdbc_drivers/
cp postgresql-42.5.6.jar $DORIS_HOME/be/jdbc_drivers/
```

#### Step 2: Create the PostgreSQL Catalog

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'postgres_user',
    'password' = 'postgres_password',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/database_name',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

For SSL connections:

```sql
CREATE CATALOG pg_catalog PROPERTIES (
    'type' = 'jdbc',
    'user' = 'postgres_user',
    'password' = 'postgres_password',
    'jdbc_url' = 'jdbc:postgresql://pg-host:5432/database_name?ssl=true&sslmode=require',
    'driver_url' = 'postgresql-42.5.6.jar',
    'driver_class' = 'org.postgresql.Driver'
);
```

#### Step 3: Explore Source Data

```sql
-- Switch to the catalog
SWITCH pg_catalog;

-- List available schemas (databases in Doris)
SHOW DATABASES;

-- Use a schema
USE public;

-- List tables
SHOW TABLES;

-- Preview data
SELECT * FROM source_table LIMIT 10;

-- Check row count
SELECT COUNT(*) FROM source_table;
```

#### Step 4: Create Doris Target Table

```sql
-- Switch back to internal catalog
SWITCH internal;
USE target_db;

-- Create table based on source schema
CREATE TABLE orders (
    order_id INT,
    customer_id INT,
    order_date DATE NOT NULL,
    total_amount DECIMAL(10, 2),
    status VARCHAR(32),
    created_at DATETIME
)
UNIQUE KEY(order_id, order_date)
PARTITION BY RANGE(order_date) ()
DISTRIBUTED BY HASH(order_id) BUCKETS 16
PROPERTIES (
    "dynamic_partition.enable" = "true",
    "dynamic_partition.time_unit" = "MONTH",
    "dynamic_partition.start" = "-12",
    "dynamic_partition.end" = "3",
    "dynamic_partition.prefix" = "p",
    "dynamic_partition.buckets" = "16",
    "replication_num" = "3"
);
```

#### Step 5: Migrate Data

For small to medium tables:

```sql
INSERT INTO internal.target_db.orders
SELECT
    order_id,
    customer_id,
    order_date,
    total_amount,
    status,
    created_at
FROM pg_catalog.public.orders;
```

For large tables, migrate in batches:

```sql
-- Batch by date range
INSERT INTO internal.target_db.orders
SELECT * FROM pg_catalog.public.orders
WHERE order_date >= '2024-01-01' AND order_date < '2024-04-01';

INSERT INTO internal.target_db.orders
SELECT * FROM pg_catalog.public.orders
WHERE order_date >= '2024-04-01' AND order_date < '2024-07-01';
```

#### Step 6: Validate Migration

```sql
-- Compare row counts
SELECT 'doris' as source, COUNT(*) as cnt FROM internal.target_db.orders
UNION ALL
SELECT 'postgres' as source, COUNT(*) as cnt FROM pg_catalog.public.orders;

-- Spot check specific records
SELECT * FROM internal.target_db.orders WHERE order_id = 12345;
SELECT * FROM pg_catalog.public.orders WHERE order_id = 12345;
```

### Option 2: Flink CDC (Real-time Sync)

Flink CDC captures changes from PostgreSQL WAL (Write-Ahead Log) and streams them to Doris in real-time. This is ideal for continuous synchronization.

#### Prerequisites

- PostgreSQL with logical replication enabled (`wal_level = logical`)
- Flink 1.15+ with Flink CDC and Flink Doris Connector
- A replication slot in PostgreSQL

#### Step 1: Configure PostgreSQL

Ensure these settings in `postgresql.conf`:

```properties
wal_level = logical
max_replication_slots = 10
max_wal_senders = 10
```

Create a replication user and grant permissions:

```sql
-- Create user with replication privilege
CREATE USER flink_cdc WITH REPLICATION PASSWORD 'password';

-- Grant access to tables
GRANT SELECT ON ALL TABLES IN SCHEMA public TO flink_cdc;
GRANT USAGE ON SCHEMA public TO flink_cdc;
```

#### Step 2: Create Flink CDC Job

Using Flink SQL:

```sql
-- Source: PostgreSQL CDC
CREATE TABLE pg_orders (
    order_id INT,
    customer_id INT,
    order_date DATE,
    total_amount DECIMAL(10, 2),
    status STRING,
    created_at TIMESTAMP(3),
    PRIMARY KEY (order_id) NOT ENFORCED
) WITH (
    'connector' = 'postgres-cdc',
    'hostname' = 'pg-host',
    'port' = '5432',
    'username' = 'flink_cdc',
    'password' = 'password',
    'database-name' = 'source_db',
    'schema-name' = 'public',
    'table-name' = 'orders',
    'slot.name' = 'flink_slot',
    'decoding.plugin.name' = 'pgoutput'
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
    'sink.label-prefix' = 'pg_orders_sync'
);

-- Start sync
INSERT INTO doris_orders SELECT * FROM pg_orders;
```

#### Step 3: Full Database Sync

For synchronizing multiple tables or entire schemas:

```sql
-- Use Flink Doris Connector's database sync feature
CREATE DATABASE IF NOT EXISTS sync_db;

-- FlinkCDC whole database sync configuration
-- See Flink Doris Connector documentation for complete setup
```

### Option 3: Export and Load

For air-gapped environments or when direct connectivity is not possible.

#### Step 1: Export from PostgreSQL

```bash
# Export to CSV
psql -h pg-host -U user -d database -c "\COPY orders TO '/tmp/orders.csv' WITH CSV HEADER"

# Export to Parquet using DuckDB or pandas
duckdb -c "COPY (SELECT * FROM postgres_scan('postgresql://user:pass@host/db', 'public', 'orders')) TO '/tmp/orders.parquet'"
```

#### Step 2: Upload to Object Storage

```bash
# Upload to S3
aws s3 cp /tmp/orders.parquet s3://bucket/migration/orders.parquet

# Or to HDFS
hdfs dfs -put /tmp/orders.parquet /migration/orders.parquet
```

#### Step 3: Load into Doris

```sql
-- Using S3 Load
LOAD LABEL orders_migration
(
    DATA INFILE("s3://bucket/migration/orders.parquet")
    INTO TABLE orders
    FORMAT AS "parquet"
)
WITH S3 (
    "provider" = "AWS",
    "s3.endpoint" = "s3.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "your_ak",
    "s3.secret_key" = "your_sk"
);

-- Check load status
SHOW LOAD WHERE LABEL = "orders_migration"\G
```

## Handling Common Issues

### Handling Timezone Issues

PostgreSQL `timestamptz` stores timestamps in UTC and converts to session timezone on read. Doris `DATETIME` does not carry timezone information.

**Recommendation**: Convert timestamps explicitly during migration:

```sql
-- Convert to specific timezone in PostgreSQL query
INSERT INTO doris_table
SELECT
    id,
    created_at AT TIME ZONE 'UTC' as created_at_utc
FROM pg_catalog.schema.table;
```

Also ensure JVM timezone consistency in Doris BE by setting in `be.conf`:

```properties
JAVA_OPTS="-Duser.timezone=UTC ..."
```

### Handling Arrays

PostgreSQL arrays map to Doris ARRAY type, but dimension detection requires existing data:

```sql
-- PostgreSQL source
CREATE TABLE pg_table (
    id INT,
    tags TEXT[]
);

-- Doris target
CREATE TABLE doris_table (
    id INT,
    tags ARRAY<STRING>
)
DISTRIBUTED BY HASH(id) BUCKETS 8;
```

If array dimension cannot be determined, cast explicitly:

```sql
INSERT INTO doris_table
SELECT
    id,
    CAST(tags AS ARRAY<STRING>)
FROM pg_catalog.schema.pg_table;
```

### Handling JSON/JSONB

PostgreSQL JSON/JSONB maps to Doris VARIANT type, which supports flexible schema and efficient JSON operations:

```sql
-- Query JSON fields
SELECT
    id,
    JSON_EXTRACT(json_col, '$.name') as name,
    JSON_EXTRACT(json_col, '$.address.city') as city
FROM table_name;
```

### Large Table Migration

For tables with hundreds of millions of rows:

1. **Partition the migration**: Migrate by time ranges or ID ranges
2. **Increase parallelism**: Use multiple INSERT statements concurrently
3. **Monitor resources**: Check Doris BE memory and disk usage

```sql
-- Parallel migration script (run concurrently)
-- Session 1
INSERT INTO orders SELECT * FROM pg_catalog.public.orders
WHERE order_id BETWEEN 0 AND 10000000;

-- Session 2
INSERT INTO orders SELECT * FROM pg_catalog.public.orders
WHERE order_id BETWEEN 10000001 AND 20000000;
```

## Validation Checklist

After migration, validate:

- [ ] Row counts match between source and target
- [ ] Sample records are identical
- [ ] Null values are preserved correctly
- [ ] Numeric precision is maintained
- [ ] Date/time values are correct (check timezone)
- [ ] Array and JSON fields are queryable

```sql
-- Comprehensive validation query
SELECT
    'rows' as check_type,
    CASE WHEN s.cnt = t.cnt THEN 'PASS' ELSE 'FAIL' END as result,
    s.cnt as source_count,
    t.cnt as target_count
FROM
    (SELECT COUNT(*) cnt FROM pg_catalog.public.orders) s,
    (SELECT COUNT(*) cnt FROM internal.target_db.orders) t;
```
