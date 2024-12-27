---
{
    "title": "Backup",
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

For concepts related to backup, please refer to the [Backup & Restore](./overview.md). This guide provides a step-by-step process for creating a repository and backup data in Doris.

## 1. Creating a Repository

<!--
suites/backup_restore/test_create_and_drop_repository.groovy
-->

Choose the appropriate statement to create a repository based on your storage. For detailed usage, please refer to [CREATE REPOSITORY](../../sql-manual/sql-statements/data-modification/backup-and-restore/CREATE-REPOSITORY.md)

### Creating a Repository on S3

To create a repository on S3 storage, use the following SQL command:

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

- Replace bucket_name with the name of your S3 bucket.
- Provide the appropriate endpoint, access key, secret key, and region for your S3 setup.

### Creating a Repository on Azure

To create a repository on Azure storage, use the following SQL command:

```sql
CREATE REPOSITORY `azure_repo`
WITH S3
ON LOCATION "s3://bucket_name/azure_repo"
PROPERTIES
(
    "s3.endpoint" = "selectdbcloudtestwestus3.blob.core.windows.net",
    "s3.region" = "dummy_region",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "provider" = "AZURE"
);
```

- Replace bucket_name and container with your Azure container name.
- Provide your Azure storage account and key for authentication.
- `s3.region` is just a fake region.
- `provider` must be `AZURE`.

### Creating a Repository on GCP

To create a repository on Google Cloud Platform (GCP) storage, use the following SQL command:

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

- Replace bucket_name with the name of your GCP bucket.
- Provide your GCP endpoint, access key, and secret key.
- `s3.region` is just a fake region.

### Creating a Repository on OSS (Alibaba Cloud Object Storage Service)

To create a repository on OSS, use the following SQL command:

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
- Replace bucket_name with the name of your OSS bucket.
- Provide your OSS endpoint, region access key and secret key.

### Creating a Repository on MinIO

To create a repository on MinIO storage, use the following SQL command:

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

- Replace bucket_name with the name of your MinIO bucket.
- Provide your MinIO endpoint, access key and secret key.
- `s3.region` is just a fake region.
- If you do not enable Virtual Host-styple, 'use_path_style' must be true.

### Creating a Repository on HDFS

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

- Replace prefix_path with the real path.
- Provide your hdfs endpoint and username.

## 2. Backup

Refer to the following statements to back up a database, tables, or partitions. For detailed usage, please refer to [backup](../../sql-manual/sql-statements/data-modification/backup-and-restore/BACKUP.md).

It is recommended to use meaningful names for labels, such as including which databases and tables are in the backup.

### Backup the current database

   The following SQL statement backs up the current database to a repository named `example_repo` with a snapshot label `exampledb_20241225`.

   ```sql
   BACKUP SNAPSHOT exampledb_20241225
   TO example_repo;
   ```
   - `exampledb_20241225` is a unique identifer for the snapshot.
   - `example_repo` is the name of a repository.

### Backup specified tables

   The following SQL statement backs up two tables to a repository named `example_repo` with a snapshot label `exampledb_tbl_tbl1_20241225`.

   ```sql
   BACKUP SNAPSHOT exampledb_tbl_tbl1_20241225
   TO example_repo
   ON (example_tbl, example_tbl1);
   ```
   - `exampledb_tbl_tbl1_20241225` is a unique identifer for the snapshot.
   - `example_repo` is the name of a repository.
   - `example_tbl` and `example_tbl1` are the name of tables to be backed up.

### Backup specified partitions

   The following SQL statement backs up a table named `example_tbl2` and two partitions named `p1` and `p2` in a table named `example_tbl` to  a repository named `example_repo` with a snapshot label `example_tbl_p1_p2_tbl1_20241225`.

   ```sql
   BACKUP SNAPSHOT example_tbl_p1_p2_tbl1_20241225
   TO example_repo
   ON
   (
      example_tbl PARTITION (p1,p2),
      example_tbl2
   );
   ```

   - `example_tbl_p1_p2_tbl1_20241225` is a unique identifer for the snapshot.
   - `example_repo` is the name of a repository.
   - `example_tbl` and `example_tbl2` are the name of tables to be backed up.

### Backup current database excluding some tables

   The following SQL statement backs up the current database to a repository named `example_repo` with a snapshot label `exampledb_20241225`, excluding two tables named `example_tbl` and `example_tbl1`.

   ```sql
   BACKUP SNAPSHOT exampledb_20241225
   TO example_repo
   EXCLUDE
   (
      example_tbl,
      example_tbl1
   );
   ```
   - `exampledb_20241225` is a unique identifer for the snapshot.
   - `example_repo` is the name of a repository.
   - `example_tbl` and `example_tbl1` are the name of tables to be excluded.


## 3. View the execution of the most recent backup job

   The following SQL statement can be used to view the execution of the most recent backup job.

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

## 4. View existing backup in a repository

   The following SQL statement can be used to view existing backups in a repository named `example_repo`.

   ```sql
   mysql> SHOW SNAPSHOT ON example_repo;
   +-----------------+---------------------+--------+
   | Snapshot        | Timestamp           | Status |
   +-----------------+---------------------+--------+
   | exampledb_20241225 | 2022-04-08-15-52-29 | OK     |
   +-----------------+---------------------+--------+
   1 row in set (0.15 sec)
   ```