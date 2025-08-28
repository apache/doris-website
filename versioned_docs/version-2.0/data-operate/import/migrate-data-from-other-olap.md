---
{
    "title": "Migrating Data from Other OLAP",
    "language": "en"
}
---

To migrate data from other OLAP systems to Doris, you have a variety of options:

- For systems like Hive/Iceberg/Hudi, you can leverage Multi-Catalog to map them as external tables and then use "Insert Into" to import the data into Doris.

- You can export data from the OLAP system into formats like CSV, and then import the data files into Doris.

- You can also leverage the connectors of the OLAP systems, use tools like Spark / Flink, and then call the corresponding Doris Connector to write data into Doris.

