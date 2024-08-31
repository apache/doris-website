---
{
    "title": "Before Deployment",
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

The diagram below visualizes the deployment architecture of Doris in the compute-storage mode. It involves three modules: 

- **FE**: Responsible for receiving user requests and storing the meta data of databases and tables. It is currently stateful, but will evolve to be stateless like BE.
- **BE**: Stateless BE nodes, responsible for computation. The BE will cache a portion of the Tablet metadata and data to improve query performance.
- **Meta Service**: A new module added in the compute-storage decoupled mode, with the program name `doris_cloud`, which can be specified as one of the following two roles by starting with different parameters:
  - **Meta Service**: Responsible for metadata management. It provides services for metadata operations, such as creating Tablets, adding Rowsets, and querying metadata of Tablets and Rowsets.
  - **Recycler**: Responsible for data recycling. It implements periodic asynchronous forward recycling of data by regularly scanning the metadata of the data marked for deletion (the data files are stored on S3 or HDFS), without the need to list the data objects for metadata comparison.

![apache-doris-in-compute-storage-decoupled-mode](/images/apache-doris-in-compute-storage-decoupled-mode.png)

The Meta Service is a stateless service that relies on [FoundationDB](https://github.com/apple/foundationdb), a high-performance distributed transactional KV store, to store metadata. This greatly simplifies the metadata management process and provides high horizontal scalability.

![deployment-of-compute-storage-decoupled-mode](/images/deployment-of-compute-storage-decoupled-mode.png)

Deploying Doris in the compute-storage decoupled mode relies on two open-source projects. Please install the following dependencies before proceeding:

- **FoundationDB (FDB)**
- **OpenJDK17**: Needs to be installed on all nodes where the Meta Service is deployed.

## Deployment steps

Given the modules and their functionalities, it is recommended to deploy Doris in the compute-storage decoupled mode from bottom up:

1. Machine planning: Follow the instructions on [this page](./before-deployment.md).
2. Deployment of FoundationDB and the required runtime dependencies: This step can be completed without the need for any Doris compilation outputs. Follow the instructions on [this page](./before-deployment.md).
3. [Deploy Meta Service and Recycler](./compilation-and-deployment.md)
4. [Deploy FE and BE](./creating-cluster.md)

:::info
Note: A single FoundationDB + Meta Service + Recycler infrastructure can support multiple Doris instances (i.e., multiple FE + BE setups) running in the compute-storage decoupled mode.
:::

## Deployment planning

To avoid inter-module interference as much as possible, the recommended deployment is to deploy module by module.

- The Meta Service, Recycler, and FoundationDB modules use the same set of machines, with a minimum requirement of 3 machines.
  - To enable the compute-storage decoupled mode, at least one Meta Service process and one Recycler process must be deployed. These stateless processes can be scaled as needed, typically with 3 instances for each.
  - To ensure the performance, reliability, and scalability of FoundationDB, a multi-replica deployment is required.
- FE is deployed independently, with a minimum of 1 machine, and can be scaled out based on the actual query demands.
- BE is deployed independently, with a minimum of 1 machine, and can be scaled out based on the actual query demands.


```
               Host1                  Host2
       .------------------.   .------------------.
       |                  |   |                  |
       |        FE        |   |        BE        |
       |                  |   |                  |
       '------------------'   '------------------'

        Host3                 Host4                 Host5
.------------------.  .------------------.  .------------------.
|     Recycler     |  |     Recycler     |  |     Recycler     |
|   Meta Service   |  |   Meta Service   |  |   Meta Service   |
|   FoundationDB   |  |   FoundationDB   |  |   FoundationDB   |
'------------------'  '------------------'  '------------------'

```

If machine resources are limited, a hybrid deployment approach can be used, where all the modules are deployed on the same set of machines. This approach requires a minimum of 3 machines.

One feasible planning is as follows:

```
        Host1                  Host2                  Host3
.------------------.   .------------------.   .------------------.
|                  |   |                  |   |                  |
|        FE        |   |                  |   |                  |
|                  |   |        BE        |   |        BE        |
|     Recycler     |   |                  |   |                  |
|   Meta Servcie   |   |                  |   |                  |
|   FoundationDB   |   |   FoundationDB   |   |   FoundationDB   |
|                  |   |                  |   |                  |
'------------------'   '------------------'   '------------------'
```

## Install FoundationDB

This document provides a step-by-step guide on how to configure, deploy, and start an FDB (FoundationDB) service using the provided scripts fdb_vars.sh and fdb_ctl.sh.

`fdb_vars.sh`: This script is used to configure the working directory for FDB, setting up necessary environment variables.
`fdb_ctl.sh`: This script is used to manage the FDB service, including deploying and starting the FDB cluster.`

* Prerequisites *

Before running these scripts, ensure that you are logged into the machine with the user that runs FDB.

### Machine requirements

Typically, at least 3 machines with SSDs are required to form a FoundationDB cluster having double data replicas and allowing for failure of a single machine.

:::tip

If this is only for development/testing purposes, a single machine will be enough.

:::

### `fdb_vars.sh` Configuration Documentation

This section describes the variables used in the `fdb_vars.sh` script, which are essential for configuring and deploying a FoundationDB (FDB) cluster. Ensure these variables are correctly set according to your environment before running any deployment or management scripts.

#### MUST CUSTOMIZATION

These variables must be customized to match your specific environment and requirements.

##### **`DATA_DIRS`**

- **Description**: Specifies the data directories for FoundationDB storage.
- **Type**: Comma-separated list of absolute paths.
- **Example**: 
  ```bash
  DATA_DIRS="/mnt/foundationdb/data1,/mnt/foundationdb/data2,/mnt/foundationdb/data3"
- **Note**: Ensure these directories are created before running the script. For production environments, it is recommended to use SSDs and separate directories.

##### **`FDB_CLUSTER_IPS`**

- **Description**: Defines the cluster IPs, a comma-separated list of IP addresses.
- **Type**: String (comma-separated IP addresses).
- **Example**: 
  ```bash
  FDB_CLUSTER_IPS="172.200.0.2,172.200.0.3,172.200.0.4"
- **Note**:
  * You should have at least 3 IP addresses for a production cluster.
  * The first IP addresses will be used as the coordinator.
  * For high availability, place the machines in different racks.

##### **`FDB_HOME`**

- **Description**: Defines the FoundationDB home directory, which contains the FDB binaries and logs.
- **Type**: Absolute path.
- **Example**: 
  ```bash
  FDB_HOME="/fdbhome"
- **Note**: The default path is /fdbhome. Ensure that this path is an absolute path.

##### **`FDB_CLUSTER_ID`**

- **Description**: Defines the cluster ID, which should be a randomly generated unique identifier.
- **Type**: String.
- **Example**: 
  ```bash
  FDB_CLUSTER_ID="SAQESzbh"
-**Note**: This ID must be unique for each cluster. It can be generated using a command like mktemp -u XXXXXXXX.

##### **`FDB_CLUSTER_DESC`**

- **Description**: Defines the description for the FDB cluster.
- **Type**: String.
- **Example**: 
  ```bash
  FDB_CLUSTER_ID="SAQESzbh"
- **Note**: It's recommended to change this description to something meaningful for your deployment.

#### OPTIONAL CUSTOMIZATION

##### **`MEMORY_LIMIT_GB`**

- **Description**: Defines the memory limit for FDB processes, in gigabytes.
- **Type**: Integer.
- **Example**: 
  ```bash
  MEMORY_LIMIT_GB=16
- **Note**: Adjust this value based on the available memory resources and requirements for your FDB processes.

#### **`CPU_CORES_LIMIT`**

- **Description**: Defines the CPU cores limit for FDB processes.
- **Type**: Integer.
- **Example**: 
  ```bash
  CPU_CORES_LIMIT=8
- **Note**: Set this value according to the number of CPU cores available and the requirements of your FDB processes.

### Deploying the FDB Cluster

After configuring the environment using `fdb_vars.sh`, you can deploy the FDB cluster using the `fdb_ctl.sh` script.

  ```bash
  ./fdb_ctl.sh deploy
  ```

This command initiates the deployment process of the FDB cluster. The deploy option typically involves tasks like initializing the cluster and configuring FDB nodes.

### Starting the FDB Service

Once the FDB cluster is deployed, you can start the FDB service using the `fdb_ctl.sh` script.

  ```bash
  ./fdb_ctl.sh start
  ```
This command starts the FDB service, bringing the cluster online and print the FDB cluster connection string.

e.g.


## Install OpenJDK17

All nodes must have OpenJDK 17 installed. You can download the installation package from the following link: [OpenJDK 17](https://download.java.net/java/GA/jdk17.0.1/2a2082e5a09d4267845be086888add4f/12/GPL/openjdk-17.0.1_linux-x64_bin.tar.gz)

Then, simply extract the downloaded OpenJDK package directly to the installation path:

```Bash
tar xf openjdk-17.0.1_linux-x64_bin.tar.gz  -C /opt/

# Before starting Meta Service or Recycler
export JAVA_HOME=/opt/jdk-17.0.1
```

## Note

The machines deployed with FoundationDB can also be deployed with Meta Service and Recycler, which is also the recommended deployment method to save on machine resources.
