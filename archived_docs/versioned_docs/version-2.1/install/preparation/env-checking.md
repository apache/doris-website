---
{
    "title": "Environment Checking",
    "language": "en",
    "description": "When deploying Doris, the following checks need to be performed for the hardware and software environment:"
}
---

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

Doris recommends using EXT4 or XFS file systems:

- **EXT4**: The EXT4 file system offers good stability, performance, and lower fragmentation issues. 

- **XFS**: The XFS file system performs excellently in handling large-scale data and high-concurrency write operations, making it suitable for high-throughput applications.

### Network Card Check

Doris involves distributing data partitions across different instances for parallel processing, which results in some network resource overhead. To optimize Doris performance and reduce network resource overhead, it is strongly recommended to use a 10 Gigabit Ethernet (10GbE) or faster network during deployment. If multiple network cards are available, it is recommended to use link aggregation to combine multiple network cards into one virtual interface, which improves network bandwidth, redundancy, and complex balancing capabilities.

## Server Configuration Recommendations

Doris can be deployed on x86-64 or ARM64 architecture server platforms.

- **Development and Testing Environments**

  In development and testing environments, FE and BE instances can be deployed in a mixed manner, following these guidelines:

  * In a validation testing environment, one FE and one BE can be deployed on a single server, but it is not recommended to deploy multiple FE and BE instances on the same machine.

  * If 3 replicas of data are required, at least 3 servers are needed, with each server deploying one BE instance.

  | Module    | CPU        | Memory  | Disk                         | Network              | Minimum Instance Count |
  | --------- | ---------- | ------- | ---------------------------- | -------------------- | ---------------------- |
  | Frontend  | 8 cores +  | 8 GB+   | SSD or SATA, 10 GB+          | Gigabit/Ten-Gigabit  | 1                      |
  | Backend   | 8 cores +  | 16 GB+  | SSD or SATA, 50 GB+          | Gigabit/Ten-Gigabit  | 1                      |

- **Production Environments**

  In a production environment, it is recommended to deploy FE and BE instances independently, following these guidelines:

  * If resources are limited and FE and BE need to be co-located on the same server, it is advised to store FE and BE data on separate hard drives.

  * BE nodes can be configured with multiple hard drives, allowing a single BE instance to utilize multiple HDD or SSD disks.

  Recommended server specifications are as follows:

  | Module    | CPU        | Memory   | Disk                         | Network   | Minimum Instance Count |
  | --------- | ---------- | -------- | ---------------------------- | --------- | ---------------------- |
  | Frontend  | 16 cores + | 64 GB+   | SSD or RAID card, 100 GB+     | 10-Gigabit | 1                      |
  | Backend   | 16 cores + | 64 GB+   | SSD or SATA, 100 GB+          | 10-Gigabit | 3                      |

## Disk Space Calculation

In the Doris cluster, FE (Frontend) is mainly used for metadata storage, including metadata edit logs and images. BE (Backend) disk space is primarily used for storing data, and it needs to be calculated based on business requirements. 
| Component | Disk Space Description                                                                                             |
| --------- | ------------------------------------------------------------------------------------------------------------------ |
| FE        | It is recommended to reserve more than 100 GB of storage space, using SSD disks.                                      |
| BE        | Doris uses LZ4 compression by default. The compression ratio is around 0.3 - 0.5. Disk space should be calculated as total data volume * 3 (for 3 replicas), and 40% of the space should be reserved for backend compaction and temporary data storage. |


## Java Environment Check

All Doris processes depend on Java:

- **For versions before 2.1 (inclusive)**: please use Java 8, recommended version: `jdk-8u352` or later.

- **For versions from 3.0 (inclusive) onwards**: please use Java 17, recommended version: `jdk-17.0.10` or later.
