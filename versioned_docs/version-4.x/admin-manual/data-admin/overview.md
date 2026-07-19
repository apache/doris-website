---
{
    "title": "Disaster Recovery Overview",
    "language": "en",
    "description": "Doris disaster recovery combines cross-cluster replication, backup and restore, and the recycle bin to handle data loss risks from hardware failures and human errors.",
    "keywords": [
        "Doris disaster recovery",
        "disaster recovery management",
        "cross-cluster replication",
        "CCR",
        "backup and restore",
        "Backup Restore",
        "recycle bin",
        "Recycle Bin",
        "data high availability",
        "accidental deletion recovery",
        "regional disaster recovery",
        "data snapshot"
    ]
}
---

<!-- Knowledge type: Capability overview / Architecture selection decision -->
<!-- Applicable scenarios: Disaster recovery planning / Data protection selection -->

Doris provides complete disaster recovery capabilities that help you handle data loss risks caused by **hardware failures, software errors, and human operation mistakes**. By combining **cross-cluster data replication**, **backup and restore**, and **recycle bin recovery**, you can ensure high availability and reliability of data across different failure granularities.

## Applicable Scenarios

Different disaster recovery capabilities apply to different failure scenarios. Combine them based on your business needs:

| Capability | Applicable Scenario | Recovery Granularity | Recovery Speed | Typical Use Case |
| --- | --- | --- | --- | --- |
| Cross-cluster data replication | Cluster-level, data-center-level, or region-level failures | Cluster, database, table | Seconds to minutes (near real-time) | Multi-region active-active, region-level disaster recovery, read-write separation |
| Backup and restore | Data corruption, long-term archiving, migration | Database, table, partition | Minutes to hours (depending on data volume) | Periodic snapshots, cross-cluster migration, compliance archiving |
| Recycle bin recovery | Short-term human errors such as accidentally dropping tables or databases | Table, database | Seconds | Accidental deletion recovery, short-term retention |

## Capability Comparison

The three capabilities differ in data protection strength, operational cost, and dependencies:

| Dimension | Cross-cluster Data Replication | Backup and Restore | Recycle Bin Recovery |
| --- | --- | --- | --- |
| Data timeliness | Real-time (full + incremental) | Periodic snapshots | Retained at the moment of deletion |
| External dependencies | Requires an additional target Doris cluster | Requires remote storage such as object storage or HDFS | None (retained locally within the cluster) |
| Retention period | Continuous replication | Retained according to backup policy | Configurable retention period, automatically cleaned up on expiration |
| Operational cost | High (operating two clusters) | Medium (periodic jobs + storage cost) | Low (enabled by default) |

## 1. Cross-cluster Data Replication

Doris Cross-Cluster Replication (CCR) supports real-time data replication between different Doris clusters. It ensures that critical data is distributed across multiple physically isolated clusters, enabling **region-level disaster recovery**.

<!-- Knowledge type: Feature capability definition -->
<!-- Applicable scenarios: Remote disaster recovery / Active-active clusters / Read-write separation -->

### Key Features

- **Real-time replication**: Supports both full and incremental replication. Full replication copies all data during the initial stage; incremental replication continuously captures and synchronizes data changes, including data changes (inserts, updates, deletes) and schema changes (DDL).
- **Data consistency**: Records data changes through a log mechanism (such as Binlog) to ensure the target cluster is fully consistent with the source cluster.
- **Region-level disaster recovery**: Supports replication between clusters in different geographic locations. When one cluster fails, other clusters can quickly take over the workload.
- **Multi-scenario application**: Applicable to disaster recovery backup, workload separation (such as read-write separation), and active-active cluster scenarios.

### Example Scenario

A company deploys two Doris clusters in different cities, with cluster A as the primary and cluster B as the backup. With cross-cluster data replication, when cluster A is interrupted by a natural disaster, cluster B can take over the workload and minimize downtime.

For detailed usage, see [Cross-Cluster Replication Overview](./ccr/overview), [Quick Start](./ccr/quickstart), and [User Manual](./ccr/manual).

## 2. Backup and Restore

Doris provides backup and restore functionality for periodically saving data snapshots, preventing data loss caused by unexpected events, and supporting data migration and long-term archiving.

<!-- Knowledge type: Feature capability definition -->
<!-- Applicable scenarios: Periodic data protection / Cross-cluster migration / Compliance archiving -->

### Key Features

- **Backup**: Supports full backup of specified databases, tables, or partitions, saving complete data snapshots.
- **Restore**: Supports restoring databases, tables, or partitions from snapshots.

### Example Scenario

A company periodically backs up its data and stores the backup files in an object storage service (such as Amazon S3). When an important table is dropped by mistake, the backup feature quickly restores the lost data and ensures normal business operations.

For detailed usage, see [Data Backup](./backup-restore/backup) and [Data Restore](./backup-restore/restore).

## 3. Recycle Bin Recovery

Doris provides a recycle bin feature that offers a quick way to recover recently deleted data and reduce the impact of operational mistakes.

<!-- Knowledge type: Feature capability definition -->
<!-- Applicable scenarios: Accidental deletion recovery / Short-term data retention -->

### Key Features

- **Temporary deletion**: Tables or databases that are dropped are moved to the recycle bin first instead of being permanently deleted immediately.
- **Retention period**: Deleted data is kept in the recycle bin for a configurable period, during which you can choose to restore it.
- **Quick recovery**: Easily recover mistakenly deleted data from the recycle bin without going through a full backup and restore process.
- **Data safety**: If recovery is not needed, data in the recycle bin is automatically cleaned up after the retention period.

### Example Scenario

A team accidentally drops an important table during routine operations. With the recycle bin feature, they quickly recover the deleted data, avoid a complex backup and restore process, and keep the business running.

For detailed usage, see [Recycle Bin](./recyclebin).

## FAQ

<!-- Knowledge type: FAQ -->
<!-- Applicable scenarios: Disaster recovery solution selection / Data recovery operations -->

### Q: I accidentally dropped a table. Which feature should I use to recover it?

Use **recycle bin recovery** first. It completes in seconds and does not depend on external storage. If the retention period has passed, use **backup and restore** to recover from the most recent snapshot.

### Q: Can cross-cluster replication and backup and restore replace each other?

No. Cross-cluster replication targets real-time disaster recovery and high availability, while backup and restore targets periodic snapshots and long-term archiving. Combine them to cover different failure scenarios.

### Q: Does data in the recycle bin stay there forever?

No. Deleted data is only kept during the configurable retention period and is automatically cleaned up after expiration. For long-term retention, use backup and restore.

### Q: How do I achieve region-level disaster recovery?

Use **cross-cluster data replication** to deploy primary and standby Doris clusters in different regions. When the primary cluster fails, the standby cluster takes over the workload.

### Q: Where can backup files be stored?

Backup files support remote storage such as object storage (for example, Amazon S3) and HDFS, which avoids single-point failures shared with the source cluster.
