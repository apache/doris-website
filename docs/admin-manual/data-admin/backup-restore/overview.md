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

Apache Doris provides robust support for backup and restore operations. These features enable users to back up data from tables or entire databases to remote storage systems and restore it as needed. The system supports snapshot-based backups, which capture the state of the data at a particular point in time, and these snapshots can be stored in remote repositories like HDFS and object storages.

## Requirements

- **ADMIN Privileges**: Only users with **ADMIN** privileges are authorized to perform backup and restore operations.

## Key Concepts

1. **Snapshot**:
   A snapshot is a point-in-time capture of the data in a database, a table or partition, achieved by obtaining consistent version numbers and creating hard links to keep the data. A snapshot can be idetified by a repository name and timestamp.

2. **Repository**:
   A remote storage location where the backup files are stored. Supported repositories include S3, Azure, GCP, OSS, COS,MinIO, HDFS and other object storages.

3. **Backup Operation**:
   A backup operation involves creating a snapshot of a database, a table or partition, uploading the snapshot files to a remote repository, and storing the metadata related to the backup.

4. **Restore Operation**:
   A restore operation involves downloading the backup from a remote repository and restoring it to a Doris cluster.

## Key Features

1. **Backup Data**:
   Doris allows you to back up data from a table, partition, or an entire database by creating snapshots. The data is backed up in file format and stored on remote storage systems like HDFS, S3, or other compatible systems.

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

1. **Storage&Compute Decoupled**:
   Storage and compute decoupling mode does not support backup and restore.

2. **Async Materialized View (MTMV) Not Supported**:
   Backing up or restoring **Async Materialized Views (MTMV)** is not supported in Doris. These views are not considered during backup and restore operations.

3. **Tables with Storage Policy Not Supported**:
   Tables that have a [**storage policy**](../../../table-desgin/tiered-storage/remote-storage.md) defined are **not supported** for backup and restore operations.

4. **Incremental Backup**:
   At present, Doris only supports full backups. Incremental backups (where only the changed data since the last backup is stored) are not yet supported, although users can backup specific partitions.

5. **Colocate With Property**:
   During a backup or restore operation, Doris will not preserve the `colocate_with` property of tables. This may require reconfiguring the colocated tables after restoring them.

6. **Dynamic Partition Support**:
   While dynamic partitioning is supported in Doris, the dynamic partition attribute will be disabled during backup. When restoring data, this attribute needs to be manually enabled using the `ALTER TABLE` command.

7. **Single Concurrency**:
   Only one backup or restore task can run simultaneously under a single database.
