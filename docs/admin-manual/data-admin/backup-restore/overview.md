---
{
    "title": "Backup and Restore Overview",
    "language": "en",
    "description": "Doris backup and restore lets you save databases, tables, or partitions as snapshots to remote storage such as S3 or HDFS, and restore them on demand to any Doris cluster.",
    "keywords": [
        "Doris backup and restore",
        "database backup",
        "snapshot",
        "Repository",
        "data migration",
        "disaster recovery",
        "BACKUP SNAPSHOT",
        "RESTORE"
    ]
}
---

<!-- Knowledge type: Feature overview -->
<!-- Applicable scenarios: Disaster recovery / Accidental deletion recovery / Cross-cluster migration / Test data preparation -->

Doris supports backup and restore operations on databases, tables, or partitions. You can save data as snapshots to remote storage (S3, Azure, GCP, OSS, HDFS, and so on), and restore it to any Doris cluster when needed.

## Applicable Scenarios

| Scenario | Description | Recommended Operation |
| --- | --- | --- |
| Accidental data deletion recovery | A table or partition is deleted by mistake and must be restored to a specific point in time | [Restore a specific table or partition](./restore) |
| Periodic disaster-recovery backup | Back up an entire database periodically to guard against cluster failures or hardware damage | [Back up the entire database](./backup) |
| Cross-cluster data migration | Migrate data from a source cluster to a target cluster | [Backup](./backup) then [Restore](./restore) |
| Test environment data preparation | Restore certain production tables or partitions to a test cluster | [Back up specific tables](./backup) then [Restore](./restore) |
| Near-incremental backup | Back up only new or changed partitions to approximate an incremental backup | [Back up specific partitions](./backup) |

## Core Concepts

<!-- Knowledge type: Concept definition -->

| Concept | Definition |
| --- | --- |
| Snapshot | A point-in-time capture of the data in a database, table, or partition. You must specify a snapshot label when creating it, and a timestamp is generated upon completion. A snapshot is uniquely identified by its Repository, label, and timestamp. |
| Repository | The remote location where backup files are stored. Supported targets include S3, Azure, GCP, OSS, COS, MinIO, HDFS, and other S3-compatible storage. |
| Backup operation | Creates a snapshot of the target object, uploads the snapshot files to a Repository, and stores the related metadata. |
| Restore operation | Downloads a snapshot from a Repository and restores it to the target Doris cluster. |

## Prerequisites

- **Privileges**: The executing account must have the **ADMIN** privilege.
- **Deployment mode**: Only the integrated storage-compute mode is supported. The **storage-compute separation mode does not support** backup and restore.

## Limitations

| Limitation | Description |
| --- | --- |
| Storage-compute separation not supported | Backup and restore are unavailable in the deployment mode where storage and compute are decoupled. |
| Asynchronous materialized views (MTMV) not supported | Asynchronous materialized views are not included in backups and must be rebuilt manually after restore. |
| Tables with storage policies not supported | Tables that use a [storage policy](../../../table-design/tiered-storage/remote-storage) do not support backup and restore. |
| Only full backup is supported | Incremental backup is not currently supported. You can back up specific partitions to approximate the effect of incremental backup. |
| `colocate_with` attribute is not retained | You must reconfigure the `colocate_with` attribute of colocated tables after restore. |
| Dynamic partitioning must be enabled manually | After restore, enable the dynamic partition attribute manually with `ALTER TABLE`. |
| Single-task concurrency | Only one backup or restore task can run at a time within the same database. |

## Operation Guides

- [Backup](./backup): Create a Repository and perform a full backup of a database, table, or partition.
- [Restore](./restore): Restore a database, table, or partition from a Repository snapshot to the target cluster.
