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

:::info NOTE
If you know of other migration tools that could be added to this list, please contact dev@doris.apache.org
:::
