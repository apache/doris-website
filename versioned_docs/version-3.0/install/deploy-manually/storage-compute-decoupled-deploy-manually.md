---
{
    "title": "Deploy Storage Compute Decoupled Manually",
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
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

After completing the prerequisite checks and planning, such as environment checks, cluster planning, and operating system checks, you can begin deploying the cluster. The deployment process consists of eight steps:

1. Prepare the FoundationDB cluster: You can use an existing FoundationDB cluster or create a new one;
   
2. Deploy S3 or HDFS service: You can use existing shared storage or create new shared storage;
   
3. Deploy Meta Service: Deploy Meta Service for the Doris cluster;
   
4. Deploy data reclamation process: Optionally, deploy a separate data reclamation process for the Doris cluster;
   
5. Start the FE Master node: Start the first FE node as the Master FE node;
   
6. Create the FE Master cluster: Add FE Follower/Observer nodes to form the FE cluster;
   
7. Add BE nodes: Add and register BE nodes to the cluster;
   
8. Add Storage Vault: Create one or more Storage Vaults using shared storage.

## Step 1: Prepare FoundationDB

This section provides step-by-step instructions for configuring, deploying, and starting the FoundationDB (FDB) service using the `fdb_vars.sh` and `fdb_ctl.sh` scripts. You can download the [doris tools](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz) and retrieve the `fdb_vars.sh` and `fdb_ctl.sh` from the `fdb` directory.

1. Machine Requirements

   Typically, at least 3 machines with SSDs are needed to form a FoundationDB cluster with double data replicas, allowing for a single machine failure. If in a testing/development environment, a single machine can be used to set up FoundationDB.

2. Configure the `fdb_vars.sh` script

   When configuring the fdb_vars.sh script, the following configurations must be specified:

   | Parameter         | Description                        | Type                         | Example                                                      | Notes                                                         |
   | ----------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
   | DATA_DIRS         | Specifies the FoundationDB data directory | A comma-separated list of absolute paths | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | - Ensure the directories are created before running the script - SSDs and separate directories are recommended in production |
   | FDB_CLUSTER_IPS   | Defines the cluster IPs            | String (comma-separated IP addresses) | 172.200.0.2,172.200.0.3,172.200.0.4                          | - At least 3 IP addresses are required in production clusters - The first IP will be used as the coordinator - For high availability, place machines in different racks |
   | FDB_HOME          | Defines the FoundationDB home directory | Absolute path                | /fdbhome                                                     | - Default path is /fdbhome - Ensure this path is absolute      |
   | FDB_CLUSTER_ID    | Defines the cluster ID             | String                        | SAQESzbh                                                     | - The ID must be unique for each cluster - Use `mktemp -u XXXXXXXX` to generate it |
   | FDB_CLUSTER_DESC  | Defines the description of the FDB cluster | String                        | dorisfdb                                                     | - It is recommended to change this to something meaningful for the deployment |


   You can also specify the following optional custom configurations:

   | Parameter         | Description                        | Type                         | Example                                                      | Notes                                                         |
   | ----------------- | ---------------------------------- | ---------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
   | MEMORY_LIMIT_GB   | Defines the FDB memory limit       | Integer                       | 32                                                           | - Set the memory limit based on the available system memory    |


3. Deploy FDB Cluster

   After configuring the environment using `fdb_vars.sh`, you can deploy the FDB cluster on each node using the `fdb_ctl.sh` script.

   ```bash
   ./fdb_ctl.sh deploy
   ```
   
   This command initiates the deployment process for the FDB cluster.
   
4. Start FDB Service

   After the FDB cluster is deployed, you can use the `fdb_ctl.sh` script to start the FDB service.

   ```bash
   ./fdb_ctl.sh start
   ```
      This command starts the FDB service, bringing the cluster online and obtaining the FDB cluster connection string, which can be used for configuring MetaService.

## Step 2: Install S3 or HDFS Service (Optional)

Apache Doris in a storage-compute separation mode stores data on S3 or HDFS services. If you already have these services set up, you can directly use them.
If not, this document provides a simple deployment guide for MinIO:

1. Visit the [MinIO download page](https://min.io/download?license=agpl&platform=linux) to select the appropriate version and operating system, and download the corresponding Server and Client binary or installation packages.

2. Start MinIO Server

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, this configuration was MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, this configuration was MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```

3. Configure MinIO Client

   ```bash
   # If you installed the client using the installation package, the client name is mcli. If you downloaded the client binary package, it is named mc  
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```

4. Create a Bucket

   ```bash
   ./mc mb myminio/doris
   ```

5. Verify it's working correctly

   ```bash
   # Upload a file  
   ./mc mv test_file myminio/doris
   # List the file  
   ./mc ls myminio/doris
   ```

## Step 3: Meta Service Deployment

1. Configuration

   In the `./conf/doris_cloud.conf` file, the following two parameters need to be modified:

   - `brpc_listen_port`：The listening port for Meta Service, default is 5000.
   - `fdb_cluster`：The connection information for the FoundationDB cluster, which can be obtained during the FoundationDB deployment. (If you are using the `fdb_ctl.s`h provided by Doris, this value can be found in the `$FDB_HOME/conf/fdb.cluster` file).

   Example configuration:

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   Note: The value of `fdb_cluster` should match the contents of the `/etc/foundationdb/fdb.cluster` file on the FoundationDB deployment machine (if using the fdb_ctl.sh provided by Doris, this value can be obtained from the `$FDB_HOME/conf/fdb.cluster` file).

   Example, the last line of the file is the value to be filled in the `fdb_cluster` field in the doris_cloud.conf file:


   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. Start and Stop

   Before starting, ensure that the `JAVA_HOME` environment variable is correctly set to point to OpenJDK 17, and enter the `ms` directory.

   The start command is as follows:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   A return value of 0 from the start script indicates a successful start; otherwise, the start has failed. If started successfully, the last line of the standard output will display "doris_cloud start successfully".

   The stop command is as follows:

   ```shell
   bin/stop.sh
   ```

   In a production environment, ensure that at least 3 Meta Service nodes are available.

## Step 4: Independent Deployment of Data Recycling Function (Optional)

:::info Information

Meta Service itself has metadata management and recycling functions, and these two functions can be deployed independently. If you want to deploy them independently, refer to this section.

:::

1. Create a new working directory (e.g., `recycler`) and copy the contents of the `ms` directory to the new directory:

   ```shell
   cp -r ms recycler
   ```

2. Modify the BRPC listen port `brpc_listen_port` and `fdb_cluster` values in the configuration file of the new directory.

   To start the data recycling function:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```

   To start only the metadata operation function:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```

## Step 5: Start FE Master Node

1. Configure the `fe.conf` File

   In the `fe.conf` file, the following key parameters need to be configured:

   - `deploy_mode`
     - Description: Specifies the Doris startup mode
     - Format: `cloud` for storage-compute separation mode, other modes for storage-compute integration
     - Example: `cloud`
   - `cluster_id`
     - Description: A unique identifier for the cluster in the storage-compute separation architecture. Different clusters must have different `cluster_id`.
     - Format: Integer type
     - Example: You can use the following shell script `echo $(($((RANDOM << 15)) | $RANDOM))` to generate a random ID.
     - Note: Different clusters must have different `cluster_id`.
   - `meta_service_endpoint`
     - Description: The address and port of the Meta Service
     - Format: `IP address:port`
     - Example: `127.0.0.1:5000`, multiple Meta Services can be configured by separating them with commas.

2. Start FE Master Node

   Example start command:

   ```bash
   bin/start_fe.sh --daemon
   ```

   The first FE process initializes the cluster and works as a FOLLOWER role. Use the MySQL client to connect to FE and use `show frontends` to confirm that the FE you just started is the master.

## Step 6: Register and Add FE Follower/Observer Nodes

Other nodes should also modify their configuration files and start following the same steps. Connect to the Master role FE using the MySQL client and add additional FE nodes with the following SQL command:

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```

Replace `host:port` with the actual address of the FE node and edit the log port. For more information, see [ADD FOLLOWER](../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-FOLLOWER) and [ADD OBSERVER](../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-OBSERVER).

In a production environment, make sure the total number of FE nodes in the FOLLOWER role, including the first FE, remains odd. Typically, three FOLLOWER nodes are sufficient. The number of FE nodes in the OBSERVER role can be arbitrary.

## Step 7: Add BE Nodes

To add Backend nodes to the cluster, perform the following steps for each Backend:

1. Configure `be.conf`

   In the `be.conf` file, you need to configure the following key parameters:
   - deploy_mode
     - Description: Specifies the startup mode of doris
     - Format: cloud indicates separation of storage and computing mode, others indicate integration of storage and computing mode
     - Example: cloud
   - file_cache_path
     - Description: Disk path and other parameters used for file caching, represented in array form, each disk is an item. path specifies the disk path, total_size limits the cache size; -1 or 0 will use the entire disk space.
     - Format: [{"path":"/path/to/file_cache", "total_size":21474836480}, {"path":"/path/to/file_cache2", "total_size":21474836480}]
     - Example: [{"path":"/path/to/file_cache", "total_size":21474836480}, {"path":"/path/to/file_cache2", "total_size":21474836480}] - Default: [{"path":"${DORIS_HOME}/file_cache"}]

3. Start the BE process

   Use the following command to start the Backend:

   ```bash
   bin/start_be.sh --daemon
   ```

4. Add BE to the cluster:

   Connect to any Frontend using MySQL client and execute:

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```

   Replace `<ip>` with the IP address of the new Backend, and `<heartbeat_service_port>` with its configured heartbeat service port (default is 9050).

   You can use PROPERTIES to specify the compute group where the BE is located.

   For more detailed usage, refer to [ADD BACKEND](../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-BACKEND) and [REMOVE BACKEND](../../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-DROP-BACKEND).

5. Verify BE status

   Check the Backend log files (`be.log`) to ensure it has successfully started and joined the cluster.

   You can also check the Backend status using the following SQL command:

   ```sql
   SHOW BACKENDS;
   ```

   This will display all the Backend nodes in the cluster and their current status.

## Step 8: Add Storage Vault

Storage Vault is an important component in Doris' separation of storage and computing architecture. It represents the shared storage layer where data is stored. You can create one or more Storage Vaults using HDFS or S3-compatible object storage. One Storage Vault can be set as the default Storage Vault, and system tables and tables that do not specify a Storage Vault will be stored in this default Storage Vault. The default Storage Vault cannot be deleted. Below are the steps to create a Storage Vault for your Doris cluster:

1. Create HDFS Storage Vault

   To create a Storage Vault using SQL, connect to your Doris cluster using the MySQL client:

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. Create S3 Storage Vault

   To create a Storage Vault using S3-compatible object storage, follow these steps:

   - Connect to your Doris cluster using the MySQL client.
   - Execute the following SQL command to create the S3 Storage Vault:

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS s3_vault
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

   To create a Storage Vault on other object storage, please refer to [Create Storage Vault](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

3. Set Default Storage Vault

   Use the following SQL statement to set a default Storage Vault.

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## Notes

- Only the Meta Service process with metadata operation functionality should be configured as the `meta_service_endpoint` for FE and BE.
- The data recycling function process should not be configured as the `meta_service_endpoint`.
