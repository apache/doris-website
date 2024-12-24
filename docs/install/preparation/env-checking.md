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
  
- Production Environments

## Disk Space Calculation

In the Doris cluster, FE (Frontend) is mainly used for metadata storage, including metadata edit logs and images. BE (Backend) disk space is primarily used for storing data, and it needs to be calculated based on business requirements. Starting from version 2.0, the use of the Broker component for data import is no longer recommended.

## Java Environment Check

All Doris processes depend on Java.

- For versions prior to 2.1, use Java 8. Recommended version: `openjdk-8u352-b08-linux-x64`.
  
- For versions 3.0 and later, use Java 17. Recommended version: `jdk-17.0.10_linux-x64_bin.tar.gz`.

