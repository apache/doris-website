---
{
  "title": "BladePipe",
  "language": "en"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

BladePipe is a **real-time end-to-end data replication** tool, moving data between **30+** databases, message queues, search engines, caching, real-time data warehouses, data lakes and more, with **ultra-low latency less than 3 seconds**. It features efficiency, stability and scalability, compatibility with diverse database engines, one-stop management, enhanced security, and complex data transformation.

## Functions
BladePipe presents a visual management interface, allowing you to easily create DataJobs to realize **schema migration, data migration, synchronization, verification and correction**, etc. In addition, more refined and customized configurations are supported by setting parameters. Now BladePipe supports data movement from the following source DataSources to Doris:

| Source DataSource            | Schema Migration | Data Migration | Data Sync | Verification & Correction |
|------------------------------|------------------|----------------|-----------|---------------------------|
| MySQL/MariaDB/AuroraMySQL    | Yes              | Yes            | Yes       | Yes                       |
| Oracle                       | Yes              | Yes            | Yes       | Yes                       |
| PostgreSQL/AuroraPostgreSQL | Yes              | Yes            | Yes       | Yes                       |
| SQL Server                   | Yes              | Yes            | Yes       | Yes                       |
| Kafka                        | No               | No             | Yes       | No                        |
| AutoMQ                       | No               | No             | Yes       | No                        |
| TiDB                         | Yes              | Yes            | Yes       | Yes                       |
| Hana                         | Yes              | Yes            | Yes       | Yes                       |
| PolarDB-X                    | Yes              | Yes            | Yes       | Yes                       |

:::info
For more functions and parameter settings, please refer to [BladePipe Connections](https://doc.bladepipe.com/dataMigrationAndSync/connection/mysql2?target=Doris).
:::

## Installation
Follow the instructions in [Install Worker (Docker)](https://doc.bladepipe.com/productOP/docker/install_worker_docker) or [Install Worker (Binary)](https://doc.bladepipe.com/productOP/binary/install_worker_binary) to download and install a BladePipe Worker.

## Example
Taking a MySQL instance as an example, the following part describes how to move data from MySQL to Doris. 

### Add DataSources
1. Log in to the [BladePipe Cloud](https://cloud.bladepipe.com/). Click **DataSource** > **Add DataSource**.
2. Select MySQL and Doris as the Type respectively, and fill in the setup form accordingly. 
   ![Add DataSources-1](/images/bp-doris-1.png)

3. Click **Test Connection**. After successful connection, click **Add DataSource** to add the DataSource. 
   ![Add DataSources-2](/images/bp-doris-2.png)


### Create a DataJob
1. Click DataJob > [Create DataJob](https://doc.bladepipe.com/operation/job_manage/create_job/create_full_incre_task).
2. Select the source and target DataSources, and click **Test Connection** to ensure the connection to the source and target DataSources are both successful.
  ![Create a DataJob-1](/images/bp-doris-3.png)

1. Select **Incremental** for DataJob Type, together with the **Full Data** option.
  ![Create a DataJob-2](/images/bp-doris-4.png)

1. Select the tables to be replicated.
  ![Create a DataJob-3](/images/bp-doris-5.png)

1. Select the columns to be replicated.
  ![Create a DataJob-4](/images/bp-doris-6.png)

1. Confirm the DataJob creation.
2. The DataJob runs automatically. BladePipe will automatically run the following DataTasks:   
  - **Schema Migration**: The schemas of the source tables will be migrated to the target instance.   
  - **Full Data**: All existing data of the source tables will be fully migrated to the target instance.   
  - **Incremental**: Ongoing data changes will be continuously synchronized to the target instance. 
  ![Create a DataJob-5](/images/bp-doris-8.png)