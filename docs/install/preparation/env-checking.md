---
{
"title": "Environment Checking",
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

When deploying Doris, the following checks need to be performed for the hardware and software environment:

- Hardware Environment Check
  
- Recommended Server Configuration
  
- Disk Space Calculation
  
- Java Environment Check

## Hardware Environment Check

During the hardware environment check, the following hardware conditions should be examined:

| Check Item | Expected Result         |
| ---------- | ----------------------- |
| CPU        | Should support AVX2 instruction set. |
| Memory     | Recommended at least 4 times the CPU size. |
| Storage    | SSD recommended.         |
| File System| ext4 or xfs file system.|
| Network Card| 10 Gigabit network card. |

### CPU Check

When installing Doris, it is recommended to choose a machine that supports the AVX2 instruction set to leverage the vectorization capabilities of AVX2 for query acceleration.

Run the following command to check if the machine supports the AVX2 instruction set:

```bash
cat /proc/cpuinfo | grep avx2
```

If the machine does not support the AVX2 instruction set, you can use the no AVX2 Doris installation package for deployment.

### Memory Check

Doris does not have strict memory limits. Generally, for production environments, you can choose the memory size based on the following recommendations:

| Component | Recommended Memory Configuration |
| --------- | --------------------------------- |
| FE        | At least 16GB recommended.        |
| BE        | Memory should be at least 4 times the number of CPU cores (for example, for a 16-core machine, at least 64GB memory is recommended). Better performance can be achieved with memory 8 times the number of CPU cores. |


### Storage Check

Doris allows data to be stored on SSD, HDD, or object storage during deployment.

SSD is recommended for data storage in the following scenarios:

- High-concurrency point query scenarios with large-scale data
  
- High-frequency data update scenarios with large-scale data

### File System Check

Doris recommends using EXT4 or XFS file systems. The EXT4 file system offers good stability, performance, and lower fragmentation issues. The XFS file system performs excellently in handling large-scale data and high-concurrency write operations, making it suitable for high-throughput applications.

### Network Card Check

Doris involves distributing data partitions across different instances for parallel processing, which results in some network resource overhead. To optimize Doris performance and reduce network resource overhead, it is strongly recommended to use a 10 Gigabit Ethernet (10GbE) or faster network during deployment. If multiple network cards are available, it is recommended to use link aggregation to combine multiple network cards into one virtual interface, which improves network bandwidth, redundancy, and complex balancing capabilities.

## Server Configuration Recommendations

Doris can be deployed on x86-64 or ARM64 architecture server platforms.

- Development and Testing Environments

  | Module    | CPU        | Memory  | Disk                         | Network              | Minimum Instance Count |
  | --------- | ---------- | ------- | ---------------------------- | -------------------- | ---------------------- |
  | Frontend  | 8 cores +  | 8 GB+   | SSD or SATA, 10 GB+          | Gigabit/Ten-Gigabit  | 1                      |
  | Backend   | 8 cores +  | 16 GB+  | SSD or SATA, 50 GB+          | Gigabit/Ten-Gigabit  | 1                      |

  :::info

   * In the test validation environment, you can deploy FE and BE on the same server.
   * It is generally recommended to deploy only one BE instance per machine and only one FE instance.
   * If 3 replicas of data are required, at least 3 machines should each deploy one BE instance, instead of deploying 3 instances on a single machine.

  :::

- Production Environments

  | Module    | CPU        | Memory   | Disk                         | Network   | Minimum Instance Count |
  | --------- | ---------- | -------- | ---------------------------- | --------- | ---------------------- |
  | Frontend  | 16 cores + | 64 GB+   | SSD or RAID card, 100 GB+     | 10-Gigabit | 1                      |
  | Backend   | 16 cores + | 64 GB+   | SSD or SATA, 100 GB+          | 10-Gigabit | 3                      |

  :::info

  * In production environments, if FE and BE are mixed, attention should be paid to resource contention. It is recommended to store metadata and data on separate disks.
  * BE nodes can be configured with multiple hard drives, binding multiple HDDs or SSDs on a single BE instance.
  * The performance of the cluster depends on the resources of the BE nodes. The more BE nodes, the better the Doris performance. Typically, Doris can fully perform on clusters with 10 to 100 machines.

  :::

## Disk Space Calculation

In the Doris cluster, FE (Frontend) is mainly used for metadata storage, including metadata edit logs and images. BE (Backend) disk space is primarily used for storing data, and it needs to be calculated based on business requirements. 
| Component | Disk Space Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| FE        | It is recommended to reserve more than 100 GB of storage space, using SSD disks.                                      |
| BE        | Doris uses LZ4 compression by default. The compression ratio is around 0.3 - 0.5. Disk space should be calculated as total data volume * 3 (for 3 replicas), and 40% of the space should be reserved for backend compaction and temporary data storage. |


## Java Environment Check

All Doris processes depend on Java.

- For versions prior to 2.1, use Java 8. Recommended version: `openjdk-8u352-b08-linux-x64`.
  
- For versions 3.0 and later, use Java 17. Recommended version: `jdk-17.0.10_linux-x64_bin.tar.gz`.

