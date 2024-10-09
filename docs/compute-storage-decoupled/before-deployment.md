---
{
    "title": "Doris Compute-Storage Decoupled Deployment Preparation",
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

This document describes the deployment preparation work for the Apache Doris compute-storage decoupled mode. The decoupled architecture aims to improve system scalability and performance, suitable for large-scale data processing scenarios.

## 2. Architecture Components

The Doris compute-storage decoupled architecture consists of three main modules:

1. **Frontend (FE)**: Handles user requests and manages metadata.
2. **Backend (BE)**: Stateless compute nodes that execute query tasks.
3. **Meta Service (MS)**: Manages metadata operations and data recovery.

## 3. System Requirements

### 3.1 Hardware Requirements

- Minimum configuration: 3 servers
- Recommended configuration: 5 or more servers

### 3.2 Software Dependencies

- FoundationDB (FDB) version 7.1.38 or higher
- OpenJDK 17

## 4. Deployment Planning

### 4.1 Testing Environment Deployment

Deploy all modules on a single machine, not suitable for production environments.

### 4.2 Production Deployment

- Deploy FDB on 3 or more machines
- Deploy FE and Meta Service on 3 or more machines
- Deploy BE on 3 or more machines

When machine configurations are high, consider mixing FDB, FE, and Meta Service, but do not mix disks.

## 5. Installation Steps

### 5.1 Install FoundationDB

This section provides a step-by-step guide to configure, deploy, and start the FoundationDB (FDB) service using the provided scripts `fdb_vars.sh` and `fdb_ctl.sh`.

#### 5.1.1 Machine Requirements

Typically, at least 3 machines equipped with SSDs are required to form a FoundationDB cluster with dual data replicas and allow for single machine failures.

:::tip
If only for development/testing purposes, a single machine is sufficient.
:::

#### 5.1.2 `fdb_vars.sh` Configuration

##### Required Custom Settings

| Parameter | Description | Type | Example | Notes |
|-----------|-------------|------|---------|-------|
| `DATA_DIRS` | Specify the data directory for FoundationDB storage | Comma-separated list of absolute paths | `/mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3` | - Ensure directories are created before running the script<br/>- SSD and separate directories are recommended for production environments |
| `FDB_CLUSTER_IPS` | Define cluster IPs | String (comma-separated IP addresses) | `172.200.0.2,172.200.0.3,172.200.0.4` | - At least 3 IP addresses for production clusters<br/>- The first IP will be used as the coordinator<br/>- For high availability, place machines in different racks |
| `FDB_HOME` | Define the main directory for FoundationDB | Absolute path | `/fdbhome` | - Default path is /fdbhome<br/>- Ensure this path is absolute |
| `FDB_CLUSTER_ID` | Define the cluster ID | String | `SAQESzbh` | - Each cluster ID must be unique<br/>- Can be generated using `mktemp -u XXXXXXXX` |
| `FDB_CLUSTER_DESC` | Define the description of the FDB cluster | String | `dorisfdb` | - It is recommended to change this to something meaningful for the deployment |

##### Optional Custom Settings

| Parameter | Description | Type | Example | Notes |
|-----------|-------------|------|---------|-------|
| `MEMORY_LIMIT_GB` | Define the memory limit for FDB processes in GB | Integer | `MEMORY_LIMIT_GB=16` | Adjust this value based on available memory resources and FDB process requirements |
| `CPU_CORES_LIMIT` | Define the CPU core limit for FDB processes | Integer | `CPU_CORES_LIMIT=8` | Set this value based on the number of available CPU cores and FDB process requirements |

#### 5.1.3 Deploy FDB Cluster

After configuring the environment with `fdb_vars.sh`, you can deploy the FDB cluster on each node using the `fdb_ctl.sh` script.

```bash
./fdb_ctl.sh deploy
```

This command initiates the deployment process of the FDB cluster.

### 5.1.4 Start FDB Service

Once the FDB cluster is deployed, you can start the FDB service using the `fdb_ctl.sh` script.

```bash
./fdb_ctl.sh start
```

This command starts the FDB service, making the cluster operational and obtaining the FDB cluster connection string, which can be used for configuring the MetaService.

### 5.2 Install OpenJDK 17

1. Download [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)
2. Extract and set the environment variable JAVA_HOME.

### 5.3 Install S3 or HDFS (Optional)

The Apache Doris (cloud mode) stores data on S3 or HDFS services. If you already have the relevant services, you can use them directly. If not, this document provides a simple deployment tutorial for MinIO:

1. Choose the appropriate version and operating system on 在 MinIO MinIO's [download page](https://min.io/download?license=agpl&platform=linux) and download the corresponding binary or installation packages for the server and client.
2. start MinIO Server
   ```bash
   export MINIO_REGION_NAME=us-east-1
   export MINIO_ROOT_USER=minio # In older versions, the configuration is MINIO_ACCESS_KEY=minio
   export MINIO_ROOT_PASSWORD=minioadmin # In older versions, the configuration is MINIO_SECRET_KEY=minioadmin
   nohup ./minio server /mnt/data 2>&1 &
   ```
3. config MinIO Client
   ```bash
   # If you are using a client installed with an installation package, the client name is mcli. If you directly download the client binary package, its name is mc
   ./mc config host add myminio http://127.0.0.1:9000 minio minioadmin
   ```
4. create a bucket
   ```bash
   ./mc mb myminio/doris
   ```
5. verify if it is working properly
   ```bash
   # 上传一个文件
   ./mc mv test_file myminio/doris
   # 查看这个文件
   ./mc ls myminio/doris
   ```

## 6. Next Steps

After completing the above preparations, please refer to the following documents to continue the deployment:

1. [Deployment](./compilation-and-deployment.md)
2. [Managing Compute Group](./managing-compute-cluster.md)
3. [Managing Storage Vault](./managing-storage-vault.md)

## 7. Notes

- Ensure time synchronization across all nodes
- Regularly back up FoundationDB data
- Adjust FoundationDB and Doris configuration parameters based on actual load

## 8. References

- [FoundationDB Official Documentation](https://apple.github.io/foundationdb/index.html)
- [Apache Doris Official Website](https://doris.apache.org/)
