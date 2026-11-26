---
{
    "title": "OLake",
    "language": "en",
    "description": "OLake Go is an open-source EL (Extract-Load) platform that replicates operational databases into Apache Iceberg tables or Parquet files on Amazon S3. Apache Doris can query the Iceberg tables that OLake Go produces through an Iceberg Catalog."
}
---

[OLake Go](https://olake.io/) is a high-performance, open-source EL (Extract-Load) platform that bridges operational databases and open lakehouse storage, writing Apache Iceberg tables or Parquet files on Amazon S3. It supports Incremental Sync, Change Data Capture (CDC), and stateful, resumable syncs, and provides a web UI and CLI.

Sources include relational databases such as PostgreSQL and MySQL, document stores such as MongoDB, as well as Kafka and S3. When you choose Iceberg as the destination, OLake Go writes the data to Iceberg tables on object storage and registers the tables in an Iceberg catalog such as AWS Glue, Hive Metastore, or a REST catalog. See the [OLake documentation](https://olake.io/docs/) for the full list of supported sources and catalogs.

## Apache Doris Integration

Apache Doris reads Iceberg tables through an Iceberg Catalog. To query data replicated by OLake Go in Doris, use an Iceberg catalog that both systems support, then create an Iceberg Catalog in Doris that connects to the same metadata service. Doris reads the replicated Iceberg tables directly from object storage without moving or duplicating data.

- Doris 3.x and 4.x can read position delete and equality delete files.
- Deletion vectors require Apache Doris 4.1.0 or later.

For Doris configuration examples, see [Iceberg Catalog](../../lakehouse/catalogs/iceberg-catalog.mdx). For catalogs and delete formats compatible with OLake Go, see the [OLake Go + Apache Doris integration guide](https://olake.io/docs/integrations/doris/).

## Learn More

- [OLake official website](https://olake.io/)
- [OLake Go GitHub repository](https://github.com/datazip-inc/olake-go)
- [OLake documentation](https://olake.io/docs/)
