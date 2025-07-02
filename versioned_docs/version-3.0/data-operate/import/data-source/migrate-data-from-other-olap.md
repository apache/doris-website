---
{
    "title": "Migrating Data from Other OLAP",
    "language": "en"
}
---

To migrate data from other OLAP systems to Doris, you have several options:

- For systems like Hive/Iceberg/Hudi, you can use Multi-Catalog to map them as external tables and then use "Insert Into" to load the data

- You can export data from the OLAP system into formats like CSV, and then load these data files into Doris

- You can use systems like Spark/Flink, utilizing the OLAP system's Connector to read data, and then call the Doris Connector to write into Doris

Additionally, the following third-party migration tools are available:

- [X2Doris](https://www.selectdb.com/tools/x2doris)

    X2Doris is a core tool specifically designed for migrating various offline data to Apache Doris. This tool combines `automatic Doris table creation` and `data migration`. Currently, it supports data migration from Apache Doris/Hive/Kudu and StarRocks databases to Doris. The entire process is operated through a visual platform, making it very simple and easy to use, reducing the barrier to synchronizing data to Doris.

:::info NOTE
If you know of other migration tools that could be added to this list, please contact dev@doris.apache.org
:::

## X2Doris Core Features

### Multi-Source Support

As a one-stop data migration tool, X2Doris currently supports Apache Hive, Apache Kudu, StarRocks, and Apache Doris itself as data sources. More data sources such as Greenplum and Druid are under development and will be released subsequently. The Hive version supports both Hive 1.x and 2.x versions, while Doris, StarRocks, Kudu, and other data sources also support multiple different versions.

Users can build complete database migration pipelines from other OLAP systems to Apache Doris using X2Doris, and achieve data backup and recovery between different Doris clusters.

### Automatic Table Creation

One of the biggest pain points in data migration is creating corresponding target tables in Apache Doris for the source tables to be migrated. In real business scenarios, with thousands of tables stored in Hive, manually creating target tables and converting corresponding DDL statements is inefficient and impractical.

X2Doris has been adapted for this scenario. Taking Hive table migration as an example, when migrating Hive tables, X2Doris automatically creates Duplicate Key model tables (which can be manually modified) in Apache Doris and reads the Hive table's metadata information. It automatically identifies partition fields through field names and types, prompts for partition mapping if partitions are detected, and directly generates the corresponding Doris target table DDL.

When the upstream data source is Doris/StarRocks, X2Doris automatically parses the table model based on source table information, maps source field types to corresponding target field types, and processes upstream Properties parameters, converting them into target table attribute parameters. Additionally, X2Doris has enhanced support for complex types, enabling migration of Array, Map, and Bitmap type data.

### High Speed and Stability

In terms of data writing, X2Doris has specifically optimized the data reading process. By optimizing data batching logic, it further reduces memory usage, while making significant improvements and enhancements to Stream Load write requests, optimizing memory usage and release, further improving data migration speed and stability.

Compared to other similar migration tools, X2Doris performs about 2-10 times faster. For example, when synchronizing 50 million records in full with 1GB memory on a single machine, other tools take about 90 seconds, while X2Doris completes it in less than 50 seconds, achieving nearly 100% performance improvement.

In a real-world large-scale log data migration scenario, with individual records of 1KB size, a single table containing nearly 100 million records, and total storage space of about 90 GB, X2Doris completed the full table migration in just 2 minutes, with an average write speed of nearly 800 MB/s.

## Using X2Doris

- Product Introduction: https://www.selectdb.com/tools/x2doris

- Download Now: https://www.selectdb.com/download/tools#x2doris

- Documentation: https://docs.selectdb.com/docs/ecosystem/x2doris/x2doris-deployment-guide
