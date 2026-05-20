---
{
    "title": "Hardware and Software Environment Check",
    "language": "en",
    "description": "Before deploying Doris, check the hardware configuration, server specifications, disk space, and Java environment."
}
---

<!-- Knowledge type: Reference -->
<!-- Applicable scenarios: Pre-deployment check / Hardware planning / Environment acceptance -->

This document provides a hardware and software environment reference for deploying Doris.

## Hardware environment check

<!-- Knowledge type: Hardware requirements -->

| Check item   | Minimum configuration | Recommended configuration |
| -------- | -------- | -------- |
| CPU      | Supports the AVX2 instruction set | Supports the AVX2 instruction set |
| Memory     | CPU cores x 4 GB | CPU cores x 8 GB |
| Storage     | SSD or HDD | SSD |
| File system | ext4 or xfs | ext4 or xfs |
| Network card     | 1GbE | 10GbE + link aggregation |

### CPU check

Doris uses AVX2 vectorization to accelerate queries. A machine that supports the AVX2 instruction set is recommended.

```bash
cat /proc/cpuinfo | grep avx2
```

If there is output, AVX2 is supported. If it is not supported, you can use the no-AVX2 Doris installation package.

### Memory check

<!-- Knowledge type: Memory configuration reference -->

Doris does not enforce a memory limit. The following is recommended for production environments:

| Component | Minimum memory | Recommended memory |
| ---- | -------- | -------- |
| FE   | 16 GB    | 64 GB+   |
| BE   | CPU cores x 4 GB | CPU cores x 8 GB |

### Storage check

<!-- Knowledge type: Storage selection reference -->

| Scenario | Recommended storage type |
| ---- | ------------ |
| High-concurrency point queries on large-scale data | SSD |
| High-frequency updates on large-scale data | SSD |
| Cold data archiving | HDD / object storage |

### File system check

| File system | Applicable scenario |
| -------- | -------- |
| ext4     | General-purpose, good stability |
| xfs      | Large-scale data, high-concurrency writes |

### Network card check

A 10GbE or faster network is recommended. For machines with multiple network cards, use link aggregation to improve bandwidth and redundancy.

## Recommended server configuration

<!-- Knowledge type: Server specification reference -->

Both x86-64 and ARM64 architectures are supported.

### Development and test environments

FE and BE can be deployed together:

- Deploy 1 FE + 1 BE on a single server (multiple instances are not recommended)
- For 3 replicas of data: deploy 1 BE on each of at least 3 servers

| Module       | Minimum CPU | Minimum memory | Minimum disk          | Network           | Instances |
| -------- | -------- | -------- | ----------------- | -------------- | ------ |
| Frontend | 8 cores     | 8 GB     | SSD/SATA, 10 GB+  | 1GbE/10GbE    | 1      |
| Backend  | 8 cores     | 16 GB    | SSD/SATA, 50 GB+  | 1GbE/10GbE    | 1      |

### Production environment

It is recommended to deploy FE and BE separately. When resources are tight and they must be co-located, place their data on different disks.

| Module       | Recommended CPU | Recommended memory | Recommended disk          | Network    | Instances |
| -------- | -------- | -------- | ----------------- | ------- | ------ |
| Frontend | 16 cores+   | 64 GB+   | SSD, 100 GB+      | 10GbE   | 1      |
| Backend  | 16 cores+   | 64 GB+   | SSD/SATA, 100 GB+ | 10GbE   | 3      |

## Disk space calculation

<!-- Knowledge type: Storage capacity calculation -->

| Component | Recommended space | Description |
| ---- | -------- | ---- |
| FE   | 100 GB+  | SSD, used for metadata storage |
| BE   | Total data volume x 3 x 1.4 | LZ4 compression ratio 0.3-0.5, 3 replicas + 40% reserved space for background compaction |

> The BE storage calculation above is mainly for the **integrated storage and compute** deployment mode. In the **separated storage and compute** deployment mode, all data is stored in shared storage, and the local disk is used only for caching, so the disk size depends on the size of the hot data.

## Java environment check

<!-- Knowledge type: Java version requirements -->

All Doris processes depend on Java.

| Doris version | Java version | Recommended version |
| ---------- | --------- | -------- |
| 2.1 (inclusive) and earlier | Java 8    | jdk-8u352+ |
| 3.0 (inclusive) and later | Java 17   | jdk-17.0.10+ |
