---
{
    "title": "Backup and Restore Overview",
    "language": "en",
    "description": "Doris provides support for backup and restore operations. These features allow users to back up data from databases, tables,"
}
---

## Introduction

Doris provides support for backup and restore operations. These features allow users to back up data from databases, tables, or partitions to remote storage systems and restore it when needed.

## Requirements

- **Administrator Privileges**: Only users with **ADMIN** privileges can perform backup and restore operations.

## Key Concepts

**Snapshot**:
   A snapshot is a time-point capture of data in a database, table, or partition. When creating a snapshot, a snapshot label must be specified, and a timestamp is generated upon completion, which can identify a snapshot through the Repository, snapshot label, and timestamp.

**Repository**:
   The remote storage location where backup files are stored. Supported remote storage includes S3, Azure, GCP, OSS, COS, MinIO, HDFS, and other S3-compatible object storage.

**Backup Operation**:
   The backup operation involves creating a snapshot of a database, table, or partition, uploading the snapshot file to a remote Repository, and storing metadata related to the backup.

**Restore Operation**:
   The restore operation involves retrieving a backup from the remote Repository and restoring it to the Doris cluster.

## Key Features

1. **Backup Data**:
   Doris allows you to back up data from tables, partitions, or entire databases by creating snapshots. Data is backed up in file format and stored in HDFS, S3, or other S3-compatible remote storage systems.

2. **Restore Data**:
   You can restore backup data from the remote Repository to any Doris cluster. This includes full database restoration, full table restoration, and partition-level restoration, allowing for flexible data recovery.

3. **Snapshot Management**:
   Data is backed up in the form of snapshots. These snapshots are uploaded to remote storage systems and can be restored when needed. The restoration process involves downloading the snapshot file and mapping it to local metadata to make it effective.

4. **Data Migration**:
   In addition to backup and restore, this feature also supports data migration between different Doris clusters. You can back up data to a remote storage system and restore it to another Doris cluster, facilitating cluster migration scenarios.

5. **Replication Control**:
   When restoring data, you can specify the number of replicas for the restored data to ensure redundancy and fault tolerance.

## Limitations

1. **Decoupling of Storage and Computing**:
   The storage-computing separation model does not support backup and restore.

2. **Asynchronous Materialized Views (MTMV) Not Supported**:
   Backup or restore of **asynchronous materialized views (MTMV)** is not supported. These views are not considered in backup and restore operations.

3. **Tables with Storage Policies Not Supported**:
   Tables that use [**storage policies**](../../../table-design/tiered-storage/remote-storage) **do not support** backup and restore operations.

4. **Incremental Backup**:
   Currently, Doris only supports full backups. Incremental backups (only storing data changed since the last backup) are not supported; you can back up specific partitions to achieve incremental backup.

5. **colocate_with Attribute**:
   During backup or restore operations, Doris does not retain the `colocate_with` attribute of the table. This may need to be reconfigured for colocated tables after restoration.

6. **Dynamic Partition Support**:
   After restoring a table, you need to manually enable this attribute using the `ALTER TABLE` command.

7. **Single Concurrency**:
   Only one backup or restore task can run simultaneously under a single database.

