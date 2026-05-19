---
{
    "title": "Manually Deploying a Storage-Compute Separation Cluster",
    "language": "en",
    "description": "A detailed guide to manually deploying a Doris storage-compute separation cluster on Linux, including FoundationDB, S3/HDFS, Meta Service, and FE/BE deployment steps and FAQs.",
    "keywords": [
        "Doris storage-compute separation deployment",
        "storage-compute separation cluster installation",
        "FoundationDB deployment",
        "Doris cloud deployment",
        "S3 storage configuration",
        "Meta Service deployment"
    ]
}
---

Deploying a storage-compute separation cluster involves eight steps:

1. **Prepare a FoundationDB cluster**: Use an existing FoundationDB cluster, or create a new one.

2. **Deploy an S3 or HDFS service**: Use existing shared storage, or set up new shared storage.

3. **Deploy Meta Service**: Deploy the Meta Service for the Doris cluster.

4. **Deploy the data recycler process**: Deploy a standalone data recycler process for the Doris cluster. This step is optional.

5. **Start the FE Master node**: Start the first FE node as the Master FE node.

6. **Build the FE Master cluster**: Add FE Follower/Observer nodes to form the FE cluster.

7. **Add BE nodes**: Add and register BE nodes to the cluster.

8. **Add Storage Vault**: Create one or more Storage Vaults using shared storage.

Before starting deployment, you can [download](https://doris.apache.org/download) the appropriate version of Doris.

## Prerequisites

<!-- Knowledge type: Hardware and software requirements -->
<!-- Applicable scenario: Pre-deployment checks -->

| Type | Requirement |
|------|------|
| **Operating System** | Linux (CentOS 7+, Ubuntu 20.04+) |
| **JDK** | OpenJDK 17 (JAVA_HOME must be set) |
| **FoundationDB** | Version 7.1.x series |
| **Network** | Ports must be reachable between nodes (defaults: FE 8030, BE 9050, Meta Service 5000) |
| **Disk** | SSD recommended (especially for the FDB data directory) |

## Step 1: Prepare FoundationDB

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

This section provides a step-by-step guide to configuring, deploying, and starting the FDB (FoundationDB) service using the `fdb_vars.sh` and `fdb_ctl.sh` scripts. You can download [doris tools](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz) and obtain `fdb_vars.sh` and `fdb_ctl.sh` from the `fdb` directory.

:::tip
Doris depends on the FDB 7.1.x series by default. If FDB is already installed, confirm that its version is in the 7.1.x series; otherwise, Meta Service will fail to start.
:::

### Machine Requirements

In general, at least three machines equipped with SSDs are required to form a FoundationDB cluster with double replicas and single-machine fault tolerance. For testing or development environments, a single machine is also sufficient to set up FoundationDB.

### Configuring the fdb_vars.sh Script

When configuring the `fdb_vars.sh` script, you must specify the following parameters:

   | Parameter         | Description                                  | Type                                       | Example                                                      | Notes                                                        |
   | ---------------- | -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
   | DATA_DIRS        | The data directories used by FoundationDB    | A comma-separated list of absolute paths   | /mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3 | Make sure the directories exist before running the script. For production environments, SSDs and dedicated directories are recommended. |
   | FDB_CLUSTER_IPS  | The cluster IPs                              | A string of comma-separated IP addresses   | 172.200.0.2,172.200.0.3,172.200.0.4                          | A production cluster should have at least 3 IP addresses. The first IP address is used as the coordinator. For high availability, place the machines in different racks. |
   | FDB_HOME         | The FoundationDB home directory              | An absolute path                           | /fdbhome                                                     | The default path is /fdbhome. Make sure this path is absolute. |
   | FDB_CLUSTER_ID   | The cluster ID                               | A string                                   | SAQESzbh                                                     | The ID of each cluster must be unique. You can use mktemp -u XXXXXXXX to generate one. |
   | FDB_CLUSTER_DESC | The description of the FDB cluster           | A string                                   | dorisfdb                                                     | It is recommended to change this to something meaningful for your deployment. |


   You can optionally specify the following custom parameters:

   | Parameter        | Description                                          | Type    | Example            | Notes                                                                       |
   | --------------- | ---------------------------------------------------- | ------- | ------------------ | --------------------------------------------------------------------------- |
   | MEMORY_LIMIT_GB | The memory limit for the FDB process, in GB          | Integer | MEMORY_LIMIT_GB=16 | Adjust this value based on available memory and the requirements of the FDB process. |
   | CPU_CORES_LIMIT | The CPU core limit for the FDB process               | Integer | CPU_CORES_LIMIT=8  | Set this value based on the number of available CPU cores and the requirements of the FDB process. |

### Deploying the FDB Cluster

After configuring the environment with `fdb_vars.sh`, you can use the `fdb_ctl.sh` script on each node to deploy the FDB cluster.

```bash
./fdb_ctl.sh deploy
```

### Starting the FDB Service

Once the FDB cluster is deployed, you can use the `fdb_ctl.sh` script to start the FDB service.

   ```bash
   ./fdb_ctl.sh start
   ```

   The command above starts the FDB service, brings the cluster online, and obtains the FDB cluster connection string, which can later be used to configure MetaService.

   :::warning
   The clean command in the fdb_ctl.sh script removes all FDB metadata, which may cause data loss. Never use it in a production environment.
   :::

## Step 2: Install S3 or HDFS Service (Optional)

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

The storage-compute separation mode in Doris relies on an S3 or HDFS service to store data. If you already have such a service, you can use it directly.
If not, this document provides a simple deployment tutorial for MinIO:

1. On the MinIO [download page](https://min.io/download?license=agpl&platform=linux), choose an appropriate version and operating system, and download the corresponding Server and Client binary or installation packages.
2. Start the MinIO Server.

   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, this setting is MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, this setting is MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```

3. Configure the MinIO Client.

   ```bash
   # If you installed the client from an installation package, the client is named mcli. If you downloaded the client binary directly, it is named mc.
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```

4. Create a bucket.

   ```bash
   ./mc mb myminio/doris
   ```

5. Verify that it works.

   ```bash
   # Upload a file
   ./mc mv test_file myminio/doris
   # View the file
   ./mc ls myminio/doris
   ```

## Step 3: Deploy Meta Service

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. Configuration

   In the `./conf/doris_cloud.conf` file, the following two parameters are the main ones you need to modify:

   - `brpc_listen_port`: The listening port of Meta Service. The default is 5000.
   - `fdb_cluster`: The connection information for the FoundationDB cluster, which is obtained when FoundationDB is deployed. (If you deployed FDB using the `fdb_ctl.sh` script provided by Doris, you can find this value in the `$FDB_HOME/conf/fdb.cluster` file.)

   Example configuration:

   ```shell
   brpc_listen_port = 5000
   fdb_cluster = xxx:yyy@127.0.0.1:4500
   ```

   Note: The value of `fdb_cluster` should match the contents of the `/etc/foundationdb/fdb.cluster` file on the FoundationDB machine. (If you deployed FDB using the `fdb_ctl.sh` script provided by Doris, you can find this value in the `$FDB_HOME/conf/fdb.cluster` file.)

   In the following example, the last line of the file is the value to fill in for the `fdb_cluster` field in `doris_cloud.conf`:

   ```shell
   cat /etc/foundationdb/fdb.cluster
   
   DO NOT EDIT!
   This file is auto-generated, it is not to be edited by hand.
   cloud_ssb:A83c8Y1S3ZbqHLL4P4HHNTTw0A83CuHj@127.0.0.1:4500
   ```

2. Start and Stop

   Before starting, make sure the `JAVA_HOME` environment variable is set correctly and points to OpenJDK 17. Then enter the `ms` directory.

   The start command is as follows:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --daemon
   ```

   A return value of 0 from the start script indicates a successful start; otherwise, the start has failed. On a successful start, the last line of standard output is "doris_cloud start successfully".

   The stop command is as follows:

   ```shell
   bin/stop.sh
   ```

   In production environments, make sure there are at least 3 Meta Service nodes.



## Step 4: Standalone Deployment of the Data Recycler (Optional)

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

:::tip

Meta Service itself provides both metadata management and data recycling functions. These two functions can be deployed separately. If you need to deploy the data recycler separately, refer to the following steps.

:::

1. Create a new working directory (for example, `recycler`) and copy the contents of the `ms` directory into it:

   ```shell
   cp -r ms recycler
   ```

2. In the configuration file of the new directory, modify the BRPC listening port `brpc_listen_port` and the value of `fdb_cluster`.

   Start the data recycler:
   
   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --recycler --daemon
   ```

   Start only the metadata operation function:

   ```shell
   export JAVA_HOME=${path_to_jdk_17}
   bin/start.sh --meta-service --daemon
   ```

## Step 5: Start the FE Master Node

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Deployment and installation -->

1. Configure the fe.conf file

   In the `fe.conf` file, you need to configure the following key parameters:

   - `deploy_mode`
     - Description: Specifies the Doris startup mode.
     - Format: `cloud` indicates the storage-compute separation mode; any other value indicates the integrated storage-compute mode.
     - Example: `cloud`
   - `cluster_id`
     - Description: The unique identifier of the cluster under the storage-compute separation architecture. Different clusters must use different `cluster_id` values.
     - Format: int
     - Example: You can use the following shell script `echo $(($((RANDOM << 15)) | $RANDOM))` to generate a random ID.
     - Note: Different clusters must use different `cluster_id` values.
   - `meta_service_endpoint`
     - Description: The address and port of Meta Service.
     - Format: `IP:Port`
     - Example: `127.0.0.1:5000`. You can configure multiple Meta Service endpoints, separated by commas.

2. Start the FE Master Node

   Start command:

   ```bash
   bin/start_fe.sh --daemon
   ```

   The first FE process initializes the cluster and runs as the FOLLOWER role. Use a MySQL client to connect to the FE and run `show frontends` to confirm that the FE you just started is the master.

## Step 6: Register FE Follower/Observer Nodes

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

For other nodes, modify the configuration files and start them following the same steps. Then use a MySQL client to connect to the FE in the Master role, and use the following SQL command to add additional FE nodes:

```sql
ALTER SYSTEM ADD FOLLOWER "host:port";
```


Replace `host:port` with the actual address and edit-log port of the FE node. For more information, see [ADD FOLLOWER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-FOLLOWER) and [ADD OBSERVER](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-OBSERVER).

In production environments, make sure that the total number of FE nodes in the FOLLOWER role, including the first FE, remains an odd number. In general, three FOLLOWERs are sufficient. The number of FE nodes in the Observer role can be any value.

## Step 7: Add BE Nodes

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

To add Backend nodes to the cluster, perform the following steps for each Backend:

1. Configure be.conf

   In the `be.conf` file, you need to configure the following key parameters:
    - deploy_mode
      - Description: Specifies the Doris startup mode.
      - Format: `cloud` indicates the storage-compute separation mode; any other value indicates the integrated storage-compute mode.
      - Example: cloud
    - file_cache_path
      - Description: The disk paths and other parameters used for file caching, expressed as an array with one entry per disk. `path` specifies the disk path, and `total_size` limits the cache size; -1 or 0 means using the entire disk space.
      - Format: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - Example: [{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
      - Default: [{"path":"${DORIS_HOME}/file_cache"}]

3. Start the BE Process

   Use the following command to start the Backend:

   ```bash
   bin/start_be.sh --daemon
   ```

4. Add the BE to the Cluster

   Use a MySQL client to connect to any FE node:

   ```sql
   ALTER SYSTEM ADD BACKEND "<ip>:<heartbeat_service_port>" [PROTERTIES propertires];
   ```

   Replace `<ip>` with the IP address of the new Backend, and `<heartbeat_service_port>` with the configured heartbeat service port (the default is 9050).

   You can use PROPERTIES to set the compute group that the BE belongs to.

   For more detailed usage, see [ADD BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/ADD-BACKEND) and [REMOVE BACKEND](../../sql-manual/sql-statements/cluster-management/instance-management/DROP-BACKEND).

5. Verify the BE Status

   Check the Backend log file (`be.log`) to make sure it has started successfully and joined the cluster.

   You can also use the following SQL command to check the Backend status:

   ```sql
   SHOW BACKENDS;
   ```

   This shows all Backends in the cluster and their current status.

## Step 8: Add Storage Vault

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenario: Deployment and installation -->

Storage Vaults are an important component of the Doris storage-compute separation architecture. They represent the shared storage layer where data is stored. You can create one or more Storage Vaults using HDFS or S3-compatible object storage. You can set one Storage Vault as the default Storage Vault. System tables and tables that do not specify a Storage Vault are stored in this default Storage Vault. The default Storage Vault cannot be deleted. The following describes how to create a Storage Vault for your Doris cluster:

1. Create an HDFS Storage Vault

   To create a Storage Vault using SQL, connect to your Doris cluster with a MySQL client.

   ```sql
   CREATE STORAGE VAULT IF_NOT_EXISTS hdfs_vault
       PROPERTIES (
       "type"="hdfs",
       "fs.defaultFS"="hdfs://127.0.0.1:8020"
   );
   ```

2. Create an S3 Storage Vault

   To create a Storage Vault using S3-compatible object storage, follow these steps:

   - Connect to your Doris cluster with a MySQL client.
   - Run the following SQL command to create an S3 Storage Vault:

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

   To create a Storage Vault on other object storage services, see [Create Storage Vault](../../sql-manual/sql-statements/cluster-management/storage-management/CREATE-STORAGE-VAULT).

3. Set the Default Storage Vault

   Use the following SQL statement to set a default Storage Vault.

   ```sql
   SET <storage_vault_name> AS DEFAULT STORAGE VAULT
   ```

## FAQ

### Q: Meta Service fails to start with the error "FDB version mismatch"?

Doris depends on the FDB 7.1.x series by default. Run `fdbserver --version` to confirm the installed FoundationDB version. If the version does not match, reinstall the correct version of FDB.

### Q: How do I confirm that an FE node has started successfully and become the Master?

Run the following command to confirm:
```bash
mysql -h <fe_host> -P 9030 -u root -e "SHOW FRONTENDS;"
```
Check whether the `Role` column for the corresponding FE in the output is `MASTER`.

### Q: How do I troubleshoot a BE node that stays in the "Starting" state after startup?

Follow these steps to troubleshoot:
1. Check the BE log `be.log` for error messages.
2. Confirm that `meta_service_endpoint` is configured correctly and that Meta Service is reachable.
3. Confirm that `deploy_mode` is set to `cloud`.
4. Run `SHOW BACKENDS;` to view the detailed error description.

### Q: How do I confirm that a Storage Vault was created successfully?

Run the following SQL to check:
```sql
SHOW STORAGE VAULT;
```
Confirm that the status of the created vault is `OK`.

### Q: Adding a BE node returns the error "backend already exists"?

The BE node may already exist, or a previous record was not fully cleaned up. Run the following command to remove the old record and try again:
```sql
ALTER SYSTEM DROP BACKEND "<ip>:<port>";
```

## Troubleshooting

### FE Cannot Connect to Meta Service

- **Symptom**: The FE log shows "connect to meta service failed".
- **Troubleshooting steps**:
  1. Confirm that the Meta Service process is running: `ps aux | grep doris_cloud`.
  2. Check whether the format of `meta_service_endpoint` is correct (it should be `IP:Port`).
  3. Confirm that the network is reachable between nodes (default port 5000).

### BE Fails to Start with "Too many open files"

- **Troubleshooting steps**:
  1. Run `ulimit -n` to check the current limit.
  2. Add `max_open_files = 65535` to `be.conf`.
  3. Or run `ulimit -n 65535` and then restart the BE.

### FDB Cluster Fails to Start

- **Troubleshooting steps**:
  1. Check whether the directories specified in `DATA_DIRS` in `fdb_vars.sh` exist and have the correct permissions.
  2. Confirm that `FDB_CLUSTER_IPS` is configured consistently across all nodes.
  3. Check the FDB log at `/var/log/foundationdb/fdbserver.log`.

## Notes

- Only the Meta Service process responsible for metadata operations should be used as the `meta_service_endpoint` configuration target for FE and BE.
- The data recycler process should not be used as a `meta_service_endpoint` configuration target.
