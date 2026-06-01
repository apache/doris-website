---
{
    "title": "Backup",
    "language": "en",
    "description": "Use the Doris backup feature to back up databases, tables, or partitions as snapshots to remote storage such as S3, Azure, GCP, OSS, MinIO, and HDFS. This guide provides the complete procedure.",
    "keywords": [
        "Doris backup",
        "BACKUP SNAPSHOT",
        "CREATE REPOSITORY",
        "data backup",
        "full backup",
        "snapshot",
        "Repository",
        "S3 backup",
        "Azure backup",
        "HDFS backup",
        "OSS backup",
        "MinIO backup",
        "GCP backup",
        "partition backup",
        "database backup",
        "show backup",
        "cancel backup"
    ]
}
---

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Data backup / Disaster recovery setup / Cross-cluster migration -->

Doris provides backup capabilities to back up databases, tables, or partitions as snapshots to a remote storage system, and to [restore](./restore) them when needed. This document is intended for DBAs and operations engineers who need to perform routine backups, disaster recovery drills, or cross-cluster data migration. It describes the key concepts, prerequisites, and complete operational procedure for backups.

## Applicable scenarios

| Scenario | Description |
| --- | --- |
| Routine data backup | Periodically perform full backups of databases, tables, or partitions to prevent data loss caused by accidental deletion or hardware failure. |
| Disaster recovery | Save backups to off-site remote storage (S3, HDFS, and so on) for recovery in the event of a full cluster failure. |
| Cross-cluster data migration | Back up on the source cluster and restore on the target cluster to migrate data between clusters. |
| Test environment data preparation | Back up part of a production environment's tables or partitions and restore them to a test cluster. |
| Approximate incremental backup | Back up only newly added or changed partitions to approximate incremental backup behavior (Doris does not yet support native incremental backup). |

## Prerequisites

Before performing a backup operation, confirm that the following conditions are met:

- **Privileges**: The operating account has **ADMIN** privileges (required for both backup and restore).
- **Deployment mode**: The current cluster is in compute-storage coupled mode (**compute-storage decoupled mode does not support** backup/restore).
- **Remote storage**: An accessible remote storage system (S3, Azure, GCP, OSS, COS, MinIO, HDFS, or other S3-compatible object storage) is ready, and the corresponding access credentials have been obtained.
- **Network connectivity**: Both FE and BE nodes can access the remote storage endpoint.
- **Object restrictions**: The objects to be backed up do not belong to the following unsupported types:
    - Asynchronous materialized views (MTMV)
    - Tables using a [storage policy](../../../table-design/tiered-storage/remote-storage)

## Key concepts

| Concept | Definition |
| --- | --- |
| Snapshot | A point-in-time capture of the data in a database, table, or partition. When creating a snapshot, you must specify a snapshot Label, and a timestamp is generated when the snapshot completes. A snapshot is uniquely identified by the Repository, snapshot Label, and timestamp. |
| Repository | The remote location where backup files are stored. Supports S3, Azure, GCP, OSS, COS, MinIO, HDFS, and other S3-compatible object storage. |
| Backup operation | Creates a snapshot of a database, table, or partition, uploads the snapshot files to a remote Repository, and stores metadata related to the backup. |
| Restore operation | Downloads a snapshot from a remote Repository and restores it to a Doris cluster. |

## Usage limitations

| Limitation | Description |
| --- | --- |
| Compute-storage decoupled mode is not supported | Backup and restore functions are unavailable in the deployment mode where storage and compute are decoupled. |
| Asynchronous materialized views (MTMV) are not supported | Backup and restore operations do not include asynchronous materialized views. |
| Tables with a storage policy are not supported | Tables using a [storage policy](../../../table-design/tiered-storage/remote-storage) do not support backup and restore operations. |
| Only full backups are supported | Doris currently supports only full backups. Incremental backup (storing only data changed since the last backup) is not yet supported. You can approximate incremental backup behavior by backing up specific partitions. |
| The `colocate_with` property is not preserved | During a backup or restore operation, Doris does not preserve a table's `colocate_with` property. You may need to reconfigure colocate tables after restoration. |
| Dynamic partitioning must be re-enabled | After a table is restored, you need to manually enable the dynamic partitioning property using the `ALTER TABLE` command. |
| Single-concurrency limit | Only one backup or restore task can run at a time within a database. |

## Backup workflow overview

The complete backup workflow consists of the following 5 steps:

1. **Create a Repository**: Register a remote storage location in Doris.
2. **Perform the backup**: Trigger a backup task with `BACKUP SNAPSHOT`.
3. **View backup progress**: Use `SHOW BACKUP` to check task execution status.
4. **View existing snapshots in the Repository**: Use `SHOW SNAPSHOT` to list available backups.
5. **(Optional) Cancel the backup**: Terminate the task with `CANCEL BACKUP` in case of an exception.

The following sections describe each step in this order.

## Step 1: Create a Repository

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Remote storage integration / Backup preparation -->

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

Choose the corresponding repository creation statement based on the type of remote storage you use. For detailed usage, see [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY).

:::tip
When using Repositories with the same path across different clusters for backups, make sure to use different Labels to avoid path conflicts and data corruption.
:::

The repository creation methods for each remote storage type are as follows:

| Method | Remote storage | Notes |
| --- | --- | --- |
| Method 1 | S3 | AWS S3 or S3-compatible object storage |
| Method 2 | Azure Blob Storage | Supported since Doris 3.1.3 |
| Method 3 | GCP (Google Cloud Storage) | A dummy `s3.region` must be specified |
| Method 4 | OSS (Alibaba Cloud Object Storage) | None |
| Method 5 | MinIO | `use_path_style=true` is required when Virtual Host-style is not enabled |
| Method 6 | HDFS | None |

### Method 1: Create a Repository on S3

Create a Repository on AWS S3:

```sql
CREATE REPOSITORY `s3_repo`
WITH S3
ON LOCATION "s3://bucket_name/s3_repo"
PROPERTIES
(
    "s3.endpoint" = "s3.us-east-1.amazonaws.com",
    "s3.region" = "us-east-1",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

Notes:

- Replace `bucket_name` with the name of your S3 bucket.
- Provide the appropriate `endpoint`, `access key`, `secret key`, and `region` for S3 setup.

### Method 2: Create a Repository on Azure

**Supported since Doris 3.1.3.**

Create a Repository on Azure Blob Storage:

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://<container_name>/azure_repo"
PROPERTIES
(
    "azure.endpoint" = "https://<account_name>.blob.core.windows.net",
    "azure.account_name" = "<account_name>",
    "azure.account_key" = "<account_key>",
    "provider" = "AZURE"
);
```

Notes:

- Replace `<container_name>` with the name of your Azure container.
- Provide your Azure storage account and key for authentication.
- `provider` must be `AZURE`.

### Method 3: Create a Repository on GCP

Create a Repository on Google Cloud Platform (GCP) storage:

```sql
CREATE REPOSITORY `gcp_repo`
WITH S3
ON LOCATION "s3://bucket_name/backup/gcp_repo"
PROPERTIES
(
    "s3.endpoint" = "storage.googleapis.com",
    "s3.region" = "US-WEST2",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

Notes:

- Replace `bucket_name` with the name of your GCP bucket.
- Provide your GCP `endpoint`, `access key`, and `secret key`.
- `s3.region` is only a dummy region. You can specify any value, but it must be specified.

### Method 4: Create a Repository on OSS (Alibaba Cloud Object Storage Service)

Create a Repository on OSS:

```sql
CREATE REPOSITORY `oss_repo`
WITH S3
ON LOCATION "s3://bucket_name/oss_repo"
PROPERTIES
(
    "s3.endpoint" = "oss.aliyuncs.com",
    "s3.region" = "cn-hangzhou",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk"
);
```

Notes:

- Replace `bucket_name` with the name of your OSS bucket.
- Provide your OSS `endpoint`, `region`, `access key`, and `secret key`.

### Method 5: Create a Repository on MinIO

Create a Repository on MinIO storage:

```sql
CREATE REPOSITORY `minio_repo`
WITH S3
ON LOCATION "s3://bucket_name/minio_repo"
PROPERTIES
(
    "s3.endpoint" = "yourminio.com",
    "s3.region" = "dummy-region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "use_path_style" = "true"
);
```

Notes:

- Replace `bucket_name` with the name of your MinIO bucket.
- Provide your MinIO `endpoint`, `access key`, and `secret key`.
- `s3.region` is only a dummy region. You can specify any value, but it must be specified.
- If Virtual Host-style is not enabled, `use_path_style` must be set to `true`.

### Method 6: Create a Repository on HDFS

Create a Repository on HDFS:

```sql
CREATE REPOSITORY `hdfs_repo`
WITH hdfs
ON LOCATION "/prefix_path/hdfs_repo"
PROPERTIES
(
    "fs.defaultFS" = "hdfs://127.0.0.1:9000",
    "hadoop.username" = "doris-test"
)
```

Notes:

- Replace `prefix_path` with the actual path.
- Provide your HDFS `endpoint` and username.

## Step 2: Perform the backup

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Database/table/partition backup -->

Trigger a backup task with `BACKUP SNAPSHOT`. For detailed usage, see [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP).

:::tip
It is recommended to use a meaningful Label name, for example one that includes the databases and tables contained in the backup, to make later identification and management easier.
:::

You can choose different forms based on the backup target:

| Method | Backup target | Applicable scenario |
| --- | --- | --- |
| Method 1 | Current database | Full-database backup using the currently `USE`d database |
| Method 2 | Specified database | Full-database backup with an explicitly specified database name |
| Method 3 | Specified tables | Back up only certain tables |
| Method 4 | Specified partitions | Back up specific partitions of a table, can be mixed with full tables |
| Method 5 | Exclude certain tables | Full-database backup, excluding specified tables |

### Method 1: Back up the current database

The following SQL statement backs up the current database to a Repository named `example_repo`, using the snapshot Label `exampledb_20241225`:

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### Method 2: Back up a specified database

The following SQL statement backs up the database named `destdb` to a Repository named `example_repo`, using the snapshot Label `destdb_20241225`:

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### Method 3: Back up specified tables

The following SQL statement backs up two tables to a Repository named `example_repo`, using the snapshot Label `exampledb_tbl_tbl1_20241225`:

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### Method 4: Back up specified partitions

The following SQL statement backs up the table named `example_tbl2`, along with partitions `p1` and `p2` of the table named `example_tbl`, to a Repository named `example_repo`, using the snapshot Label `example_tbl_p1_p2_tbl1_20241225`:

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### Method 5: Back up the current database, excluding certain tables

The following SQL statement backs up the current database to a Repository named `example_repo`, using the snapshot Label `exampledb_20241225`, excluding two tables named `example_tbl` and `example_tbl1`:

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## Step 3: View the execution status of recent backup jobs

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup progress tracking / Troubleshooting -->

Use the following SQL to view the execution status of recent backup jobs:

```sql
mysql> show BACKUP\G;
*************************** 1. row ***************************
                  JobId: 17891847
           SnapshotName: exampledb_20241225
                 DbName: example_db
                  State: FINISHED
             BackupObjs: [example_db.example_tbl]
             CreateTime: 2022-04-08 15:52:29
   SnapshotFinishedTime: 2022-04-08 15:52:32
     UploadFinishedTime: 2022-04-08 15:52:38
           FinishedTime: 2022-04-08 15:52:44
        UnfinishedTasks:
               Progress:
             TaskErrMsg:
                 Status: [OK]
                Timeout: 86400
   1 row in set (0.01 sec)
```

Key field descriptions:

| Field | Meaning |
| --- | --- |
| `JobId` | The backup task ID. |
| `SnapshotName` | The snapshot Label, corresponding to the name specified in `BACKUP SNAPSHOT`. |
| `DbName` | The database the backup belongs to. |
| `State` | The task state. For example, `FINISHED` indicates completion. |
| `BackupObjs` | The list of objects actually backed up. |
| `CreateTime` / `SnapshotFinishedTime` / `UploadFinishedTime` / `FinishedTime` | Timestamps for task creation, snapshot completion, upload completion, and overall completion. |
| `Status` | The task result status. `[OK]` indicates success; otherwise it contains error information. |
| `Timeout` | The task timeout (in seconds). |

## Step 4: View existing backups in the Repository

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Backup inventory / Pre-restore verification -->

Use the following SQL to view existing backups in the Repository named `example_repo`. The `Snapshot` column is the snapshot Label, and `Timestamp` is the timestamp:

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

When performing a [restore](./restore) operation, you need to combine `Snapshot` and `Timestamp` to uniquely identify a backup version.

## Step 5: Cancel a backup (if needed)

<!-- Knowledge type: Operational procedure -->
<!-- Applicable scenarios: Abnormal termination / Rolling back accidental operations -->

When a backup task encounters an exception or needs to be aborted, use the following SQL to cancel a running backup task under a database:

```sql
CANCEL BACKUP FROM db_name;
```

For more detailed usage, see [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP).

## FAQ

### Q: What should I do if creating a Repository fails?

This is usually caused by incorrect remote storage credentials, an unreachable Endpoint, or a non-existent Bucket/container. Check whether the `endpoint`, `access key`, `secret key`, and Bucket name are correct, and make sure the FE/BE nodes can access the remote storage.

### Q: What should I do if backups to MinIO fail?

This usually happens when Virtual Host-style is not enabled but the `use_path_style` parameter is missing. Add `"use_path_style" = "true"` to `PROPERTIES`.

### Q: What should I do if GCP/MinIO reports a missing region error?

`s3.region` must be specified even with a placeholder value, for example `dummy-region`.

### Q: What should I do if creating an Azure Repository fails?

Versions of Doris earlier than 3.1.3 do not support Azure Blob Storage. Upgrade to Doris 3.1.3 or later, and confirm that `provider = AZURE`.

### Q: What should I do if a backup/restore conflict is reported within the same database?

Only one backup or restore task can run at a time within a database. Wait for the existing task to complete, or cancel it with `CANCEL BACKUP FROM db_name;` before starting a new task.

### Q: What should I do if a compute-storage decoupled cluster cannot perform backups?

Backup/restore is not supported in compute-storage decoupled mode. Switch to compute-storage coupled mode, or use an alternative data export approach.

### Q: Why was the materialized view not backed up?

Asynchronous materialized views (MTMV) are not included in the backup scope. After restoration, you need to recreate the corresponding materialized views on the target cluster.

### Q: How do I resolve data corruption when different clusters back up to the same path?

This is caused by using the same snapshot Label, which leads to path conflicts. When different clusters back up to the same Repository path, use different Labels.

### Q: Why is dynamic partitioning not effective after restoration?

Backup/restore does not automatically enable dynamic partitioning. After restoration, manually enable the dynamic partitioning property using `ALTER TABLE`.

### Q: What should I do if colocate tables behave abnormally after restoration?

Backup/restore does not preserve the `colocate_with` property. After restoration, reconfigure the `colocate_with` property of the colocate tables.

## Related documents

- [Restore](./restore)
- [CREATE REPOSITORY](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY)
- [BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP)
- [CANCEL BACKUP](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP)
- [SHOW SNAPSHOT](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-SNAPSHOT)
- [SHOW REPOSITORIES](../../../sql-manual/sql-statements/data-modification/backup-and-restore/SHOW-REPOSITORIES)
- [Storage policy](../../../table-design/tiered-storage/remote-storage)
