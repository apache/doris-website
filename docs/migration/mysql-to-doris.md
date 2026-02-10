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

2. **Real-time Requirements**: If you need real-time synchronization, Flink CDC supports automatic table creation and schema changes.

3. **Full Database Sync**: The Flink Doris Connector supports synchronizing entire MySQL databases including DDL operations.

4. **Auto Increment Columns**: MySQL AUTO_INCREMENT columns can map to Doris's auto-increment feature. When migrating, you can preserve original IDs by explicitly specifying column values.

5. **ENUM and SET Types**: MySQL ENUM and SET types are migrated as STRING in Doris.

6. **Binary Data**: Binary data (BLOB, BINARY) is typically stored as STRING. Consider using HEX encoding for binary data during migration.

7. **Large Table Performance**: For tables with billions of rows, consider increasing Flink parallelism, tuning Doris write buffer, and using batch mode for initial load.

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

### Option 1: Flink CDC (Real-time Sync)

Flink CDC captures MySQL binlog changes and streams them to Doris. This method is suited for:

- Real-time data synchronization
- Full database migration with automatic table creation
- Continuous sync with schema evolution support

**Prerequisites**: MySQL 5.7+ or 8.0+ with binlog enabled; Flink 1.15+ with Flink CDC 3.x and Flink Doris Connector.

For detailed setup, see the [Flink Doris Connector](../ecosystem/flink-doris-connector.md) documentation.

### Option 2: JDBC Catalog

The [JDBC Catalog](../lakehouse/catalogs/jdbc-catalog.md) allows direct querying and batch migration from MySQL. This is the simplest approach for one-time or periodic batch migrations.

### Option 3: Streaming Job (Continuous File Loading)

Doris's built-in [Streaming Job](../data-operate/import/streaming-job.md) (`CREATE JOB ON STREAMING`) provides continuous file-based loading without external tools. Export MySQL data to S3/object storage, and the Streaming Job automatically picks up new files and loads them into Doris.

This option is suited for:

- Continuous incremental migration via file export pipelines
- Environments where you prefer Doris-native features over external tools like Flink
- Scenarios where MySQL data is periodically exported to object storage

**Prerequisites**: Data exported to S3-compatible object storage; Doris 2.1+ with Job Scheduler enabled.

For detailed setup, see the [Streaming Job](../data-operate/import/streaming-job.md) and [CREATE STREAMING JOB](../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) documentation.

### Option 4: DataX

[DataX](https://github.com/alibaba/DataX) is a widely-used data synchronization tool that supports MySQL to Doris migration via the `mysqlreader` and `doriswriter` plugins.

## Next Steps

- [Flink Doris Connector](../ecosystem/flink-doris-connector.md) - Detailed connector documentation
- [Loading Data](../data-operate/import/load-manual.md) - Alternative import methods
- [Data Model](../table-design/data-model/overview.md) - Choose the right table model
