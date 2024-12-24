---
{
    "title": "Backup and Restore Overview",
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

## Introduction

Apache Doris provides robust support for backup and restore operations. These features enable users to back up data from tables or entire databases to remote storage systems and restore it as needed. The system supports snapshot-based backups, which capture the state of the data at a particular point in time, and these snapshots can be stored in remote repositories like HDFS, S3, and MinIO.

Backup and restore operations are crucial for disaster recovery, data migration between clusters, and ensuring data integrity over time.

## Requirements

- **ADMIN Privileges**: Only users with **ADMIN** privileges are authorized to perform backup and restore operations. This ensures secure handling of sensitive data and prevents unauthorized access to backup processes.

- Doris version 0.8.2 or higher.

## Key Concepts

1. **Snapshot**:
   A snapshot is a point-in-time capture of the data in a table or partition. It is an efficient operation, as it only creates a hard link to the existing data files.

2. **Repository**:
   A remote storage location where the backup files are stored. Supported repositories include HDFS, S3, MinIO and other object storages.

3. **Backup Operation**:
   A backup operation involves creating a snapshot of a table or partition, uploading the snapshot files to a remote repository, and storing the metadata related to the backup.

4. **Restore Operation**:
   A restore operation involves downloading the backup from a remote repository and restoring it to a Doris cluster.

## Key Features

1. **Backup Data**:
   Doris allows you to back up data from a table, partition, or an entire database by creating snapshots. The data is backed up in file format and stored on remote storage systems like HDFS, S3, or other compatible systems via the broker process.

2. **Restore Data**:
   You can restore the backup data from a remote repository to any Doris cluster. This includes full database restores, full table restores, and partition-level restores, allowing for flexibility in recovering data.

3. **Snapshot Management**:
   Data is backed up in the form of snapshots. These snapshots are uploaded to remote storage systems and can be later restored as needed. The restore process involves downloading snapshot files and mapping them to local metadata to make them effective.

4. **Data Migration**:
   In addition to backup and restore, this functionality enables data migration between different Doris clusters. You can back up data to a remote storage system and restore it to another Doris cluster, helping in cluster migration scenarios.

5. **Replication Control**:
   When restoring data, you can specify the number of replicas for the restored data to ensure redundancy and fault tolerance.

## Not Supported Features

While Doris provides powerful backup and restore capabilities, there are some limitations and unsupported features in certain scenarios:

1. **Async Materialized View (MTMV) Not Supported**:
   Doris currently does not support backing up or restoring tables that are associated with **Async Materialized Views (MTMV)**. If such views are involved, the backup or restore operations may not work as expected, and users may encounter issues related to consistency or data integrity during the process.

2. **Tables with Storage Policy Not Supported**:
   Tables that have a **storage policy** defined (e.g., tables configured with custom storage settings) are **not supported** for backup and restore operations. These tables may encounter issues during backup or restore, as their storage configurations may conflict with the snapshot process.

3. **Incremental Backup**:
   At present, Doris only supports full backups. Incremental backups (where only the changed data since the last backup is stored) are not yet supported, although this may be included in future versions.

4. **Colocate With Property**:
   During a backup or restore operation, Doris will not preserve the `colocate_with` property of tables. This may require reconfiguring the colocated tables after restoring them.

5. **Dynamic Partition Support**:
   While dynamic partitioning is supported in Doris, the dynamic partition attribute will be disabled during backup. When restoring data, this attribute needs to be manually enabled using the `ALTER TABLE` command.

For detailed usage instructions, please refer to the backup and restore user guides.

