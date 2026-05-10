---
{
    "title": "Tiered Storage Overview",
    "language": "en",
    "description": "Apache Doris tiered storage overview: reduce storage cost significantly by tiering cold data to object storage, HDFS, or HDD through three modes: storage-compute separation, local tiering, and remote tiering.",
    "keywords": [
        "Doris tiered storage",
        "tiered cold and hot data",
        "tiered storage",
        "storage-compute separation",
        "local tiering",
        "remote tiering",
        "object storage cold data",
        "HDFS cold data",
        "SSD HDD cooldown",
        "storage cost optimization"
    ]
}
---

<!-- Knowledge type: Architecture selection decision -->
<!-- Applicable scenario: Storage cost optimization / Cold-hot data separation solution selection -->

**Tiered Storage** is a storage optimization capability provided by Apache Doris. It tiers infrequently accessed cold data down to lower-cost storage media (HDD, object storage, HDFS) while keeping hot data on high-performance storage. This significantly reduces storage cost without sacrificing query efficiency.

## Applicable Scenarios

- High storage cost pressure, where you want to reduce the cost of historical data.
- Data has clear hot and cold access patterns (for example, the last 7 days are hot data and earlier data is cold data).
- Existing object storage (S3/OSS/COS, etc.) or HDFS resources can be reused.
- Different deployment modes (integrated storage-compute or storage-compute separation) require different cold data storage solutions.

## Quick Decision

Choose the appropriate tiering mode based on your deployment conditions and cost goals:

| User Scenario | Recommended Mode | Key Benefit |
| --- | --- | --- |
| Have the conditions for storage-compute separation deployment and pursue extreme elastic scaling | **Storage-Compute Separation** | Single-replica storage with independent scaling of compute and storage |
| Integrated storage-compute mode, want to optimize local SSD resources | **Local Tiering** | Cool down cold data from SSD to HDD, saving high-performance storage |
| Integrated storage-compute mode, want to use object storage or HDFS to reduce cost | **Remote Tiering** | Store cold data as a single replica on object storage or HDFS for deep cost reduction |

## Three Tiering Modes Explained

Doris provides three cold data tiering solutions for different deployment conditions. You can choose flexibly based on your actual situation.

### Mode Comparison Table

The following table summarizes the applicable conditions and core characteristics of the three modes for quick comparison:

| Cold Data Option | Applicable Condition | Core Characteristics |
| --- | --- | --- |
| **Storage-Compute Separation** | You have the conditions to deploy storage-compute separation | - Data is fully stored in object storage as a single replica<br /> - Local cache accelerates hot data access<br /> - Storage and compute resources scale independently, significantly reducing storage cost |
| **Local Tiering** | In integrated storage-compute mode, you want to further optimize local storage resources | - Supports cooling cold data from SSD to HDD<br /> - Fully uses the local storage hierarchy to save high-performance storage cost |
| **Remote Tiering** | In integrated storage-compute mode, use cheap object storage or HDFS to further reduce cost | - Cold data is saved as a single replica to object storage or HDFS<br /> - Hot data continues to use local storage<br /> - Cannot be used together with local tiering on the same table |

### 1. Storage-Compute Separation

<!-- Knowledge type: Architecture selection decision -->

**Applicable scenario**: You have the conditions to deploy storage-compute separation and pursue elastic scaling and extreme cost reduction.

**Core characteristics**:

- Data is fully stored in object storage as a **single replica**.
- **Local cache** accelerates hot data access.
- **Storage and compute resources scale independently**, significantly reducing storage cost.

### 2. Local Tiering

<!-- Knowledge type: Architecture selection decision -->

**Applicable scenario**: In integrated storage-compute mode, you want to further optimize local storage resources.

**Core characteristics**:

- Supports cooling cold data from **SSD to HDD**.
- Fully uses the local storage hierarchy to save high-performance storage cost.

For detailed configuration and usage, see [Local Disk Tiered Storage](./tiered-ssd-hdd.md).

### 3. Remote Tiering

<!-- Knowledge type: Architecture selection decision -->

**Applicable scenario**: In integrated storage-compute mode, use cheap object storage or HDFS to further reduce cost.

**Core characteristics**:

- Cold data is saved as a **single replica** to object storage or HDFS.
- Hot data continues to use local storage.
- **Cannot be used together with local tiering on the same table**.

For detailed configuration and usage, see [Local-Remote Tiered Storage](./remote-storage.md).

## Design Goals

Through the three modes above, Doris flexibly adapts to user deployment conditions and achieves the following goals:

- **Balance between query efficiency and storage cost**: Hot data keeps high-performance access, while cold data benefits from low-cost storage.
- **Flexible adaptation to multiple deployment forms**: Compatible with both integrated storage-compute and storage-compute separation modes.
- **Reuse of existing infrastructure**: Supports object storage, HDFS, local HDD, and other cold storage media.

## FAQ

**Q1: What is the essential difference between storage-compute separation and remote tiering?**

- **Storage-Compute Separation**: All data (including hot data) is stored as a single replica in object storage, with the local disk used only as a cache for acceleration.
- **Remote Tiering**: Only cold data is tiered down to object storage/HDFS, while hot data remains on local storage. It is an optimization within the integrated storage-compute architecture.

**Q2: Can local tiering and remote tiering be used at the same time?**

No. The same table **cannot mix** local tiering with remote tiering.

**Q3: How do I decide which mode to choose?**

- If you have the conditions to deploy storage-compute separation, prefer **storage-compute separation**.
- If you use integrated storage-compute and only want to optimize local disk cost, choose **local tiering**.
- If you use integrated storage-compute and want to use object storage or HDFS to reduce cost, choose **remote tiering**.

**Q4: Does cold data tiering affect query performance?**

Cold data queries may be slightly slower because of the performance differences between media (HDD/object storage have higher latency than SSD), but Doris minimizes the performance loss through mechanisms such as local cache.

## Related Documentation

- [Local Tiering (SSD to HDD)](./tiered-ssd-hdd.md)
- [Remote Tiering (Object Storage / HDFS)](./remote-storage.md)
