---
{
    "title": "CloudCanal",
    "language": "en",
    "description": "CloudCanal is a fully self-developed, visual, and automated data migration and synchronization tool. It supports data interchange between 30+ popular relational databases, real-time data warehouses, message middleware, cache databases, and search engines. It offers real-time efficiency, precise interconnection, stability and scalability, one-stop operation, hybrid deployment, and complex data transformation."
}
---

CloudCanal is a fully self-developed, visual, and automated data migration and synchronization tool. It supports data interchange between 30+ popular relational databases, real-time data warehouses, message middleware, cache databases, and search engines. It offers real-time efficiency, precise interconnection, stability and scalability, one-stop operation, hybrid deployment, and complex data transformation.

## Feature Description
CloudCanal provides a visual interface that makes it easy to perform schema migration, full data migration, incremental synchronization, and verification and correction. In addition, you can configure parameters to achieve more fine-grained, customized data synchronization. The following data sources are currently supported for integration into Doris.

| Source Data Source            | Schema Migration | Full Migration | Incremental Sync | Verification and Correction |
|------------------------------|------------------|----------------|------------------|------------------------------|
| MySQL/MariaDB/AuroraMySQL    | Supported        | Supported      | Supported        | Supported                    |
| Oracle                       | Supported        | Supported      | Supported        | Supported                    |
| PostgreSQL/AuroraPostgreSQL | Supported        | Supported      | Supported        | Supported                    |
| SQL Server                   | Supported        | Supported      | Supported        | Supported                    |
| Kafka                        | Not supported    | Not supported  | Supported        | Not supported                |
| AutoMQ                       | Not supported    | Not supported  | Supported        | Not supported                |
| TiDB                         | Supported        | Supported      | Supported        | Supported                    |
| Hana                         | Supported        | Supported      | Supported        | Supported                    |
| PolarDB-X                    | Supported        | Supported      | Supported        | Supported                    |

:::info
For more features and parameter settings, refer to [CloudCanal Data Link Documentation](https://www.clougence.com/cc-doc/dataMigrationAndSync/connection/mysql2?target=Doris).
:::


## Download and Installation
Refer to [Fresh Install (Docker Linux/MacOS)](https://www.clougence.com/cc-doc/productOP/docker/install_linux_macos) and visit the [CloudCanal official website](https://www.clougence.com/) to download and install the private deployment edition.

## Usage Example
The following uses MySQL as an example to demonstrate how to migrate and synchronize data from MySQL to Doris.

### Add a Data Source
1. Log in to the CloudCanal console and click **Data Source Management** > **Add Data Source**.
2. Select MySQL and Doris data sources separately, and fill in the corresponding information.
   ![Add data source -1](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-1.png)

3. Click **Test Connection**. After the connection succeeds, click **Add Data Source** to complete the data source addition.
   ![Add data source -2](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-2.png)

### Create a Task
1. Click **Sync Task** > **Create Task**.
2. Select the source and target data sources, and click **Test Connection** for each.
   ![Create task -1](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-3.png)

3. Select **Data Sync** and check **Full Initialization**.
   ![Create task -2](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-4.png)

4. Select the tables to synchronize.
   ![Create task -3](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-5.png)

5. Select the columns to synchronize.
   ![Create task -4](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-6.png)

6. Confirm task creation.
7. The task runs automatically. CloudCanal automatically handles the task flow, which includes the following steps:
  - Schema migration: The source-side table schema is migrated to the target. If a table with the same name already exists on the target, it is ignored.
  - Full data migration: Existing data is fully migrated to the target, with support for resumable transfer.
  - Incremental data synchronization: Incremental data is continuously synchronized to the target database in real time (with second-level latency).
  ![Create task -5](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-8.png)
