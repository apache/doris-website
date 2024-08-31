---
{
    "title": "Creating Cluster",
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

Creating a Doris cluster in the compute-storage decoupled mode is to create the entire distributed system that contains both FE and BE nodes. Then, in such a cluster, users can create compute clusters. Each compute cluster is a group of computing resources consisting of one or more BE nodes.

A single FoundationDB + Meta Service + Recycler infrastructure can support multiple compute-storage decoupled clusters, where each compute-storage decoupled cluster is considered a data warehouse instance (instance).

The steps to create a compute-storage separation cluster can be summarized as follows:

1. Starting a Frontend with role `MASTER`
2. Adding Frontends and Backends with SQL.
3. Creating storage vaults.

:::info

- **`127.0.0.1:5000`** **in the examples of this page refers to the address of Meta Service. Please replace it with the actual IP address and bRPC listening port for your own use case.**
- Please modify the configuration items in the following examples as needed.

:::

## Starting Master Frontend

To start a Frontend with the MASTER role in compute-storage decoupled mode, follow these steps:

1. Configure the Frontend:

   Edit the `fe.conf` file and add/modify the following parameters:

   ```
   meta_service_endpoints = 127.0.0.1:5000
   instance_id = sample_instance_id
   ```

   Make sure to replace `127.0.0.1:5000` with the actual Meta Service address and port, and `sample_instance_id` with your actual instance ID.

2. Start the Frontend:

   Use the following command to start the Frontend:

   ```bash
   bin/start_fe.sh --daemon
   ```

3. Verify the Frontend status:

   Check the Frontend log file (`fe.log`) to ensure it has started successfully and connected to the Meta Service. Look for messages indicating a successful start and connection.

4. Connect to the Frontend:

   Use the MySQL client to connect to the Frontend:

   ```bash
   mysql -h <fe_host> -P <query_port> -u root
   ```

   Replace `<fe_host>` with the Frontend's hostname or IP address, and `<query_port>` with the configured query port (default is 9030).


After completing these steps, you will have a running Frontend with the MASTER role in compute-storage decoupled mode, ready to manage your Doris cluster.


## Adding Additional Frontends

To add more Frontends to your cluster, follow these steps for each additional Frontend:

1. Configure the Frontend:

   Edit the `fe.conf` file on the new Frontend node and add/modify the following parameters:

   ```
   meta_service_endpoints = 127.0.0.1:5000
   instance_id = sample_instance_id
   ```

   Ensure you use the same `meta_service_endpoints` and `instance_id` as the master Frontend.

2. Start the Frontend:

   Use the following command to start the additional Frontend:

   ```bash
   bin/start_fe.sh --daemon
   ```

3. Add the Frontend to the cluster:

   Connect to the master Frontend using the MySQL client and execute:

   ```sql
   ALTER SYSTEM ADD FRONTEND "<ip>:<edit_log_port>";
   ```

   Replace `<ip>` with the IP address of the new Frontend and `<edit_log_port>` with its configured edit log port (default is 9010).

4. Verify the Frontend status:

   Check the Frontend log file (`fe.log`) to ensure it has started successfully and joined the cluster.

## Adding Backends

To add Backend nodes to your cluster, follow these steps for each Backend:

1. Start the Backend:

   Use the following command to start the Backend:

   ```bash
   bin/start_be.sh --daemon
   ```

2. Add the Backend to the cluster:

   Connect to any Frontend using the MySQL client and execute:

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROTERTIES propertires];
   ```

   Replace `<ip>` with the IP address of the new Backend and `<heartbeat_service_port>` with its configured heartbeat service port (default is 9050).

   More detailed usage refer to [ADD BACKEND](../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-BACKEND.md) and [REMOVE BACKEND](../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-DROP-BACKEND.md).

3. Verify the Backend status:

   Check the Backend log file (`be.log`) to ensure it has started successfully and joined the cluster.

   You can also check the Backend status using the following SQL command:

   ```sql
   SHOW BACKENDS;
   ```

   This will display all Backends in the cluster and their current status.

By following these steps, you can add multiple Frontends and Backends to your Doris cluster in compute-storage decoupled mode, expanding its capacity and improving its fault tolerance.


## Creating Storage Vaults

Storage vaults are essential components in the compute-storage decoupled architecture of Doris. They represent the shared storage layer where data is stored. You can create one or more storage vaults using either HDFS or S3-compatible object storage. The first storage vault created becomes the default storage vault. System tables and tables created without specifying a vault are stored in this default storage vault. The default storage vault cannot be removed. Here's how to create storage vaults for your Doris cluster:


### Creating an HDFS Storage Vault

To create storage vaults using SQL, connect to your Doris cluster using a MySQL client and execute the appropriate commands based on your storage type:

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
    PROPERTIES (
    "type"="hdfs",
    "fs.defaultFS"="hdfs://127.0.0.1:8020"
    );
```


### Creating an S3 Storage Vault

To create a storage vault using S3-compatible object storage, follow these steps:

1. Connect to your Doris cluster using a MySQL client.

2. Execute the following SQL command to create an S3 storage vault:

```sql
CREATE STORAGE VAULT IF NOT EXISTS s3_vault
    PROPERTIES (
    "type"="S3",
    "s3.endpoint"="s3.us-east-1.amazonaws.com",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "s3.region" = "us-east-1",
    "s3.root.path" = "ssb_sf1_p2_s3",
    "s3.bucket" = "doris-build-1308700295",
    "provider" = "S3"
    );
```

Create storage vaults on other object storage, please refer to [Create Storage Vaults](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-STORAGE-VAULT.md).

### Set Default Storage Vault

