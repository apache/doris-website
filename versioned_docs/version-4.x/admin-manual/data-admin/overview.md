---
{
    "title": "Disaster Recovery Management Overview",
    "language": "en",
    "description": "Doris provides disaster recovery capabilities, helping users effectively respond to data loss issues caused by hardware failures, software errors,"
}
---

Doris provides disaster recovery capabilities, helping users effectively respond to data loss issues caused by hardware failures, software errors, or human mistakes through three main functions: cross-cluster data synchronization, backup and recovery, and recycle bin recovery, ensuring high availability and reliability of data.

## 1. Cross-Cluster Data Synchronization

Doris's cross-cluster data synchronization feature supports real-time data replication between different Doris clusters, ensuring that important data is distributed across multiple physically isolated clusters, achieving regional disaster recovery.

### Key Features:

- **Real-time Synchronization**: Supports full and incremental synchronization. Full synchronization replicates all data in the initial phase; incremental synchronization continuously captures and synchronizes data changes, including data (addition, modification, deletion) and table structure changes (DDL).
- **Data Consistency**: Records data changes through a logging mechanism (such as Binlog), ensuring that the target cluster's data is completely consistent with the source cluster's data.
- **Regional Disaster Recovery**: Supports synchronization between clusters in different geographical locations, allowing other clusters to quickly take over business when one cluster fails.
- **Multi-Scenario Applications**: Suitable for disaster recovery backups, business separation (such as read-write separation), active-active clusters, and other scenarios.

### Application Scenario Example:
A company has deployed two Doris clusters in different cities, with Cluster A as the primary cluster and Cluster B as the backup cluster. Through cross-cluster data synchronization, when Cluster A is interrupted due to a natural disaster, Cluster B can take over the business, minimizing downtime.

## 2. Backup and Recovery

Doris provides backup and recovery functions to regularly save data snapshots, preventing data loss due to unexpected events.

### Key Features:

- **Backup**: Supports full backups of specified databases, tables, or partitions, saving complete data snapshots.
- **Recovery**: Supports recovery of databases, tables, or partitions from snapshots.

### Application Scenario Example:
A company regularly backs up data and stores backup files in object storage services (such as Amazon S3). When an important table is accidentally deleted, the backup function quickly restores the lost data, ensuring normal business operations.

## 3. Recycle Bin Recovery

Doris provides a recycle bin feature, offering users a quick way to recover recently deleted data, reducing the impact of operational errors.

### Key Features:

- **Temporary Deletion**: Tables or databases that are deleted are first moved to the recycle bin instead of being permanently deleted immediately.
- **Retention Period**: Deleted data is retained in the recycle bin for a configurable period, during which users can choose to recover it.
- **Quick Recovery**: Data can be easily retrieved from the recycle bin without needing a complete backup recovery.
- **Data Security**: If recovery is not needed, data in the recycle bin will be automatically cleared after the retention period.

### Application Scenario Example:
A team accidentally deleted an important table during routine operations. Using the recycle bin feature, they quickly recovered the deleted data, avoiding a complex backup recovery process while ensuring business continuity.

