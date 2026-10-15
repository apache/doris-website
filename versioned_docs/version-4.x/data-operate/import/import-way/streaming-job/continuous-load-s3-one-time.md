---
{
    "title": "S3 one-time ingestion",
    "sidebar_label": "One-time ingestion",
    "language": "en",
    "description": "Ingest a prepared S3 file set in batches with Doris Streaming Job, including SQL, completion state, recovery, and source stability requirements.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "One-time ingestion"
    ]
}
---

One-time ingestion uses `ONE_TIME` to ingest matching S3 files into an existing Doris table in batches. The job enters `FINISHED` after the final batch commits. It suits historical initialization, a one-off offline load, or a backfill under a separate prefix.

Prepare all files before creation and keep the source path stable during ingestion. The completed job does not wait for future files. For continuous ingestion, choose [ordered ingestion](./continuous-load-s3-ordered.md) or [notification ingestion](./continuous-load-s3-notification.md).

## Quick start

### Step 1: Prepare the target table and files

The execution account needs `LOAD` on the target table and the corresponding privileges to create the database and table. S3 credentials need `s3:ListBucket` and `s3:GetObject`. Doris nodes must be able to access the S3 endpoint.

```sql
CREATE DATABASE IF NOT EXISTS db1;
CREATE TABLE db1.tbl1 (
    id INT,
    name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

This example uses one replica for a single-BE cluster. Set the replica count to suit your production cluster. Upload the following as `s3://bucket/001.csv` and replace the bucket, endpoint, Region, and credentials in the SQL with your values:

```text
1,Alice
2,Bob
```

### Step 2: Create the job

```sql
CREATE JOB s3_one_time_job
PROPERTIES (
    "s3.ingestion_mode" = "ONE_TIME",
    "s3.max_batch_files" = "256",
    "s3.max_batch_bytes" = "10737418240"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

## Check completion

Query the job status:

```sql
SELECT Name, ExecuteType, Status
FROM jobs("type" = "insert")
WHERE Name = 's3_one_time_job';
```

Expected result:

```text
Name             ExecuteType  Status
s3_one_time_job  STREAMING    FINISHED
```

Run `SELECT * FROM db1.tbl1 ORDER BY id;`. Expected result:

```text
id  name
1   Alice
2   Bob
```

## Limitations and recovery

`ONE_TIME` does not take a directory snapshot at creation. It lists files in batches and stops after the final batch commits. Files added behind the committed cursor are not backfilled. Prepare all source files before creating the job, and stop writing or overwriting objects under the path during ingestion. After an FE restart, the job resumes from committed progress and enters `FINISHED` when consumption is complete.

## Parameters

Configure the following in Job `PROPERTIES`. S3 connection, credentials, and file format options belong in `S3(...)`.

| Parameter | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | String | `ORDERED_LIST` | Yes | Set to `ONE_TIME`. Cannot be changed after creation. |
| `s3.max_batch_files` | Positive integer | `256` | No | File count threshold per batch. |
| `s3.max_batch_bytes` | Integer | `10737418240` | No | Byte threshold per batch, from `104857600` to `10737418240`. Unit suffixes are not accepted. |
| `max_interval` | Positive integer | `10` | No | Idle scheduling interval in seconds. |

Do not set `offset`, `s3.event.source`, or `s3.sqs.queue_url`. `max_interval` does not keep a completed job waiting for more files. For session settings, see [INSERT INTO SELECT](../insert-into-manual.md#import-configuration-parameters).

The ingestion mode and S3 URI cannot be changed after creation. Create another job to change the mode or path.

## Troubleshooting and best practices

- **Creation fails:** ensure that a matching, readable, non-empty file exists for S3 TVF schema inference.
- **The job does not finish:** inspect `Status`, `ErrorMsg`, and failed tasks. Unreadable objects and format errors can prevent a batch from committing.
- **New files are not read after completion:** `FINISHED` is terminal. Put the next batch under a separate prefix and create a new job to avoid reloading old data.
- **Combining with notification ingestion:** use non-overlapping prefixes for historical and incoming data, or handle overlap and duplicates in your application.

For pause, resume, and task inspection, see [Continuous Load Overview](./continuous-load-overview.md). To modify a job, see [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md).
