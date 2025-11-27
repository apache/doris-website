---
{
    "title": "Backup",
    "language": "en"
}
---

For concepts related to backup, please refer to [Backup and Restore](./overview.md). This guide provides the steps to create a Repository and back up data.

## Step 1. Create Repository

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

Use the appropriate statement to create a Repository based on your storage choice. For detailed usage, please refer to [Create Repository](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY). When backing up using the same path for the Repository across different clusters, ensure to use different labels to avoid conflicts that may cause data confusion.

### Option 1: Create Repository on S3

To create a Repository on S3 storage, use the following SQL command:

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

- Replace `bucket_name` with your S3 bucket name.
- Provide the appropriate endpoint, access key, secret key, and region for S3 setup.

### Option 2: Create Repository on Azure

**Azure is supported since 3.1.3**

To create a Repository on Azure storage, use the following SQL command:

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://<container_name>/azure_repo"
PROPERTIES
(
    "azure.endpoint" = "https://<account_name>.blob.core.windows.net",
    "azure.account_name" = "ak",
    "azure.account_key" = "sk",
    "provider" = "AZURE"
);
```

- Replace `container_name` with your Azure container name.
- Provide your Azure storage account and key for authentication.
- The `provider` must be set to `AZURE` for Azure storage.

### Option 3: Create Repository on GCP

To create a Repository on Google Cloud Platform (GCP) storage, use the following SQL command:

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

- Replace `bucket_name` with your GCP bucket name.
- Provide your GCP endpoint, access key, and secret key.
- `s3.region` is a dummy but required field.

### Option 4: Create Repository on OSS (Alibaba Cloud Object Storage Service)

To create a Repository on OSS, use the following SQL command:

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
- Replace `bucket_name` with your OSS bucket name.
- Provide your OSS endpoint, region, access key, and secret key.

### Option 5: Create Repository on MinIO

To create a Repository on MinIO storage, use the following SQL command:

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

- Replace `bucket_name` with your MinIO bucket name.
- Provide your MinIO endpoint, access key, and secret key.
- `s3.region` is a dummy but required field.
- If you do not enable Virtual Host-style, then `use_path_style` must be true.

### Option 6: Create Repository on HDFS

To create a Repository on HDFS storage, use the following SQL command:

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

- Replace `prefix_path` with the actual path.
- Provide your HDFS endpoint and username.

## Step 2. Backup

Refer to the following statements to back up databases, tables, or partitions. For detailed usage, please refer to [Backup](../../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP).

It is recommended to use meaningful label names, such as those containing the databases and tables included in the backup.

### Option 1: Backup Current Database

The following SQL statement backs up the current database to a Repository named `example_repo`, using the snapshot label `exampledb_20241225`.

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo;
```

### Option 2: Backup Specified Database

The following SQL statement backs up a database named `destdb` to a Repository named `example_repo`, using the snapshot label `destdb_20241225`.

```sql
BACKUP SNAPSHOT destdb.`destdb_20241225`
TO example_repo;
```

### Option 3: Backup Specified Tables

The following SQL statement backs up two tables to a Repository named `example_repo`, using the snapshot label `exampledb_tbl_tbl1_20241225`.

```sql
BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
TO example_repo
ON (example_tbl, example_tbl1);
```

### Option 4: Backup Specified Partitions

The following SQL statement backs up a table named `example_tbl2` and two partitions named `p1` and `p2` to a Repository named `example_repo`, using the snapshot label `example_tbl_p1_p2_tbl1_20241225`.

```sql
BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
TO example_repo
ON
(
      example_tbl PARTITION (p1,p2),
      example_tbl2
);
```

### Option 5: Backup Current Database Excluding Certain Tables

The following SQL statement backs up the current database to a Repository named `example_repo`, using the snapshot label `exampledb_20241225`, excluding two tables named `example_tbl` and `example_tbl1`.

```sql
BACKUP SNAPSHOT exampledb_20241225
TO example_repo
EXCLUDE
(
      example_tbl,
      example_tbl1
);
```

## Step 3. View Recent Backup Job Execution Status

The following SQL statement can be used to view the execution status of recent backup jobs.

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

## Step 4. View Existing Backups in Repository

The following SQL statement can be used to view existing backups in a Repository named `example_repo`, where the Snapshot column is the snapshot label, and the Timestamp is the timestamp.

```sql
mysql> SHOW SNAPSHOT ON example_repo;
+-----------------+---------------------+--------+
| Snapshot        | Timestamp           | Status |
+-----------------+---------------------+--------+
| exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
+-----------------+---------------------+--------+
1 row in set (0.15 sec)
```

## Step 5. Cancel Backup (if necessary)

You can use `CANCEL BACKUP FROM db_name;` to cancel a backup task in a database. For more specific usage, refer to [Cancel Backup](../../../sql-manual/sql-statements/data-modification/backup-and-restore/CANCEL-BACKUP).
