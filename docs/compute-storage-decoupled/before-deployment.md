---
{
    "title": "Doris Compute-Storage Decoupled Deployment Preparation",
    "language": "en"
}
---

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

This section provides a step-by-step guide to configure, deploy, and start the FoundationDB (FDB) service using the provided scripts `fdb_vars.sh` and `fdb_ctl.sh`. You can download [doris tools](http://apache-doris-releases.oss-accelerate.aliyuncs.com/apache-doris-3.0.2-tools.tar.gz) and get `fdb_vars.sh` and `fdb_ctl.sh` from `fdb` directory.

#### 5.1.1 Machine Requirements

Typically, at least 3 machines equipped with SSDs are required to form a FoundationDB cluster with dual data replicas and allow for single machine failures.
If SSDs are not available, at least standard cloud disks or local disks with a standard POSIX-compliant file system must be used for data storage. Otherwise, FoundationDB may fail to operate properly - for instance, storage solutions like JuiceFS should not be used as the underlying storage for FoundationDB.

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

Once the FDB cluster is deployed, you can start the FDB service on each node using the `fdb_ctl.sh` script.

```bash
./fdb_ctl.sh start
```

This command starts the FDB service, making the cluster operational and obtaining the FDB cluster connection string, which can be used for configuring the MetaService.

### 5.2 Install OpenJDK 17

1. Download [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)
2. Extract and set the environment variable JAVA_HOME.

## 6. Next Steps

After completing the above preparations, please refer to the following documents to continue the deployment:

1. [Deployment](./compilation-and-deployment.md)
2. [Managing Compute Group](./managing-compute-cluster.md)
3. [Managing Storage Vault](./managing-storage-vault.md)

## 7. Notes

- Ensure time synchronization across all nodes
- Regularly back up FoundationDB data
- Adjust FoundationDB and Doris configuration parameters based on actual load
- Use standard cloud disks or local disks with a POSIX-compliant file system for data storage; otherwise, FoundationDB may not function properly.
	* For example, storage solutions like JuiceFS should not be used as FoundationDB's storage backend.

## 8. References

- [FoundationDB Official Documentation](https://apple.github.io/foundationdb/index.html)
- [Apache Doris Official Website](https://doris.apache.org/)
