---
{
    "title": "Migrating Data from Other AP Systems",
    "language": "en",
    "description": "A guide to the available approaches and selection criteria for migrating data from other OLAP/AP systems (such as Hive, Iceberg, and Hudi) to Apache Doris.",
    "keywords": [
        "Doris data migration",
        "OLAP data migration",
        "AP system migration",
        "Hive to Doris",
        "Iceberg to Doris",
        "Hudi to Doris",
        "Multi-Catalog",
        "Insert Into",
        "Doris Connector",
        "Spark Doris Connector",
        "Flink Doris Connector"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Migrating data from other AP/OLAP systems to Doris -->

This document describes common approaches to migrating data from other AP (analytical) systems to Apache Doris, helping you choose a migration path that fits your source system and existing technology stack.

## Migration Approaches Overview

Depending on the source system and the tools available, there are three main approaches to migrating data from other AP systems to Doris:

| Migration Approach | Applicable Scenario | Key Components |
| --- | --- | --- |
| Multi-Catalog + Insert Into | The source system is Hive, Iceberg, Hudi, or another system that supports external catalog mapping | Multi-Catalog, Insert Into |
| Intermediate file transfer | The source system supports exporting to common data formats such as CSV | Data export tools, Doris file import |
| Connector integration | An existing Spark or Flink job is in place, or programmatic migration is required | Spark/Flink AP Connector, Doris Connector |

## Detailed Migration Approaches

### Approach 1: Map as an external table via Multi-Catalog and then import

This approach applies to systems that Doris Multi-Catalog can recognize, such as Hive, Iceberg, and Hudi.

- In Doris, use Multi-Catalog to map the source system as an external table.
- Use `Insert Into` to write the data from the external table into a Doris internal table.

### Approach 2: Transfer through intermediate files

This approach applies when the source system is not convenient to integrate with directly but supports data export.

- Export the data from the original AP system to a common data format such as CSV.
- Import the exported data files into Doris.

### Approach 3: Write data through a Spark or Flink Connector

This approach applies when a Spark or Flink data processing pipeline is already in place, or when data needs to be cleaned or transformed during migration.

- Use the Spark or Flink Connector that corresponds to the AP system to read the source data.
- Use the Doris Connector to write the data into Doris.

## FAQ

**Q: What if the AP system I am using is not in the list above?**

If you have other migration tools or approaches that could be added to this list, please contact dev@doris.apache.org.

:::info NOTE
If you have other migration tools that could be added to this list, please contact dev@doris.apache.org.
:::
