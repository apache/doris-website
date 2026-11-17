---
{
    "title": "OLake",
    "language": "en",
    "description": "OLake Go is an open-source EL (Extract-Load) platform that replicates operational databases into Apache Iceberg tables or Parquet files on Amazon S3. Apache Doris can query the Iceberg tables that OLake Go produces through an Iceberg Catalog."
}
---

[OLake Go](https://olake.io/) is a high-performance, open-source EL (Extract-Load) platform that bridges operational databases and open lakehouse storage, writing Apache Iceberg tables or Parquet files on Amazon S3. It supports Incremental Sync, Change Data Capture (CDC), and stateful, resumable syncs, and provides a web UI and CLI.

Sources include relational databases such as PostgreSQL and MySQL, document stores such as MongoDB, as well as Kafka and S3. Data is written to Apache Iceberg tables on object storage and registered in an Iceberg catalog such as AWS Glue, Hive Metastore, or a REST catalog. See the [OLake documentation](https://olake.io/docs/) for the full list of supported sources and catalogs.

## Apache Doris Integration

Apache Doris reads Iceberg tables through an Iceberg Catalog. To query data replicated by OLake Go in Doris, run OLake Go with one of the supported Iceberg catalogs, then create an Iceberg catalog in Doris that points to it. Doris reads the replicated Iceberg tables directly from object storage without moving or duplicating data.

- Doris 3.x and 4.0 read the positional and equality delete files that OLake Go writes for CDC workloads.
- Deletion vectors require Apache Doris 4.1.0 or later.

For the full Doris setup, including supported catalogs and delete formats, see the [OLake Go + Apache Doris integration guide](https://olake.io/docs/integrations/doris/).

## Learn More

- [OLake official website](https://olake.io/)
- [OLake Go GitHub repository](https://github.com/datazip-inc/olake-go)
- [OLake documentation](https://olake.io/docs/)
