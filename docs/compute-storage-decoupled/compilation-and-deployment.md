---
{
    "title": "Compilation and Deployment",
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

## 1. Overview

This document details the compilation and deployment process of Doris in a decoupled storage-compute model, highlighting the differences from the integrated storage-compute model, especially the compilation, configuration, and management of the newly added Meta Service (MS) module.

## 2. Obtaining Binaries

### 2.1 Direct Download

Compiled binaries (including all Doris modules) can be obtained from the [Doris Download Page](https://doris.apache.org/download/) (select version 3.0.2 or higher).

### 2.2 Compilation Output (Optional)

Compile using the `build.sh` script provided in the codebase. The new MS module is compiled with the `--cloud` parameter.

```shell
sh build.sh --fe --be --cloud 
```

After compilation, a new `ms` directory will be added in the `output` directory:

```
output
├── be
├── fe
└── ms
    ├── bin
    ├── conf
    └── lib
```

## 3. Meta Service Deployment

### 3.1 Configuration

In the `./conf/doris_cloud.conf` file, you mainly need to modify the following two parameters:

1. `brpc_listen_port`: The listening port for the Meta Service, default is 5000.
2. `fdb_cluster`: Connection information for the FoundationDB cluster, which can be obtained when deploying FoundationDB. (If using the `fdb_ctl.sh` provided by Doris for deployment, this value can be found in the `$FDB_HOME/conf/fdb.cluster` file.)

Example configuration:

```Shell
brpc_listen_port = 5000
fdb_cluster = xxx:yyy@127.0.0.1:4500
```

Note: The value of `fdb_cluster` should match the content of the `/etc/foundationdb/fdb.cluster` file on the FoundationDB deployment machine. (If using the `fdb_ctl.sh` provided by Doris for deployment, this value can be found in the `$FDB_HOME/conf/fdb.cluster` file.)

**Example: The last line of the file is the value to fill in the doris_cloud.conf for the fdb_cluster field**

```shell
cat /etc/foundationdb/fdb.cluster

# DO NOT EDIT!
# This file is auto-generated, it is not to be edited by hand.
cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
```

### 3.2 Start and Stop

*Environment Requirements*

Ensure that the `JAVA_HOME` environment variable is correctly set to point to OpenJDK 17, and navigate to the `ms` directory.

*Start Command*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --daemon
```

*Stop Command*

``` shell
bin/stop.sh
```

*Verify Start*

Check the `doris_cloud.out` file for the output message `successfully started`.

For production environment, please ensure that the total number of Meta Service is at least three.

## 4. Independent Deployment of Data Recycling Function (Optional)

:::info
The Meta Service itself has metadata management and recycling functions, which can be deployed independently. If you want to deploy them independently, you can refer to this section.
:::

*Preparation Work*

1. Create a new working directory (e.g., `recycler`).
2. Copy the contents of the `ms` directory to the new directory:

   ```shell
   cp -r ms recycler
   ```

*Configuration*

Modify the BRPC listening port `brpc_listen_port` and the value of `fdb_cluster` in the configuration file of the new directory.

*Start Data Recycling Function*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --recycler --daemon
```

*Start Only Metadata Operation Function*

```Shell
export JAVA_HOME=${path_to_jdk_17}
bin/start.sh --meta-service --daemon
```

## 5. Startup Process for FE and BE

This section details the steps to start FE (Frontend) and BE (Backend) in a decoupled storage-compute architecture.

### 5.1 Startup Order

1. Start the first FE instance with the MASTER role.
2. Add other FE and BE instances to the cluster.
3. Add the first Storage Vault.

### 5.2 Start the MASTER Role FE

#### 5.2.1 Configure fe.conf

In the `fe.conf` file, the following key parameters need to be configured:

1. `deploy_mode`
   - Description: Specifies the Doris startup mode.
   - Format: `cloud` indicates the decoupled storage-compute mode; others indicate the integrated storage-compute mode.
   - Example: `cloud`

2. `cluster_id`
   - Description: A unique identifier for the cluster in the decoupled storage-compute architecture; different clusters must set different cluster_ids.
   - Format: int type.
   - Example: `12345678`

3. `meta_service_endpoint`
   - Description: The address and port of the Meta Service.
   - Format: `IP address:port number`.
   - Example: `127.0.0.1:5000`, multiple meta services can be configured separated by commas.

#### 5.2.2 Start FE

Example start command:

```bash
bin/start_fe.sh --daemon
```

The first FE process initializes the cluster and operates in the FOLLOWER role. Use a MySQL client to connect to the FE and use `show frontends` to confirm that the recently started FE is the master.

### 5.3 Add Other FE Nodes

Other nodes should also modify the configuration file and start according to the above steps. Use a MySQL client to connect to the FE with the MASTER role and use the following SQL command to add additional FE nodes:

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```

Replace `host:port` with the actual address and editlog port of the FE node. More information refer to [ADD FOLLOWER](../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-FOLLOWER.md) and [ADD OBSERVER](../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-OBSERVER.md).

For production environment, please ensure that the total number of Frontend (FE) nodes in the FOLLOWER role, including the first FE, remains an odd number. In general, three FOLLOWERS are sufficient. Frontend nodes in the OBSERVER role can be any number.

### 5.4 Add BE Nodes

To add Backend nodes to the cluster, perform the following steps for each Backend:

#### 5.4.1 Configure be.conf

In the `be.conf` file, the following key parameters need to be configured:

1. `deploy_mode`
   - Description: Specifies the Doris startup mode.
   - Format: `cloud` indicates the decoupled storage-compute mode; others indicate the integrated storage-compute mode.
   - Example: `cloud`

2. `file_cache_path`
   - Description: The disk paths and other parameters used for file cache, represented as an array, with one entry for each disk. The `path` specifies the disk path, and `total_size` limits the size of the cache; -1 or 0 will use the entire disk space.
   - format: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
   - Example: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
   - Default: [{"path":"${DORIS_HOME}/file_cache"}]

#### 5.4.1 Start and Add BE

1. Start the Backend:

   Use the following command to start the Backend:

   ```bash
   bin/start_be.sh --daemon
   ```

2. Add the Backend to the cluster:

   Connect to any Frontend using a MySQL client and execute:

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROPERTIES properties];
   ```

   Replace `<ip>` with the IP address of the new Backend and `<heartbeat_service_port>` with its configured heartbeat service port (default is 9050).

   You can set the computing group for the BE using PROPERTIES.

   For more detailed usage, please refer to [ADD BACKEND](../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-ADD-BACKEND.md) and [REMOVE BACKEND](../sql-manual/sql-statements/Cluster-Management-Statements/ALTER-SYSTEM-DROP-BACKEND.md).

3. Verify Backend Status:

   Check the Backend log file (`be.log`) to ensure it has successfully started and joined the cluster.

   You can also use the following SQL command to check the Backend status:

   ```sql
   SHOW BACKENDS;
   ```

   This will display all Backends in the cluster and their current status.

## 6. Create Storage Vault

Storage Vault is an important component in the Doris decoupled storage and computing architecture. They represent a shared storage layer for storing data. You can create one or more Storage Vaults using HDFS or S3-compatible object storage. One Storage Vault can be set as the default Storage Vault, and system tables and tables without a specified Storage Vault will be stored in this default Storage Vault. The default Storage Vault cannot be deleted. Here are the methods to create a Storage Vault for your Doris cluster:

### 6.1 Create HDFS Storage Vault 

To create a Storage Vault using SQL, connect to your Doris cluster using a MySQL client.

```sql
CREATE STORAGE VAULT IF NOT EXISTS hdfs_vault
    PROPERTIES (
    "type"="hdfs",
    "fs.defaultFS"="hdfs://127.0.0.1:8020"
    );
```

### 6.2 Create S3 Storage Vault 

To create a Storage Vault using S3-compatible object storage, follow these steps:

1. Connect to your Doris cluster using a MySQL client.

2. Execute the following SQL command to create an S3 Storage Vault:

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

To create a Storage Vault on other object storage, please refer to [Create Storage Vault](../sql-manual/sql-statements/Data-Definition-Statements/Create/CREATE-STORAGE-VAULT.md).

### 6.3 Set Default Storage Vault 

Use the following SQL statement to set a default Storage Vault.

```sql
SET <storage_vault_name> AS DEFAULT STORAGE VAULT
```

## 7. Notes

- Only the Meta Service process for metadata operations should be configured as the `meta_service_endpoint` target for FE and BE.
- The data recycling function process should not be configured as the `meta_service_endpoint` target.
