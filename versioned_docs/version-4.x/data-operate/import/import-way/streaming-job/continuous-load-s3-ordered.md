---
{
    "title": "S3 ordered ingestion",
    "sidebar_label": "Ordered ingestion",
    "language": "en",
    "description": "Continuously ingest S3 files in lexicographical key order with Doris Streaming Job, including SQL, starting offsets, batching, and naming constraints.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "Ordered ingestion"
    ]
}
---

Ordered ingestion uses `ORDERED_LIST` to continuously discover new S3 objects in **lexicographical key order**, including the path and filename. It suits logs and ETL files named with increasing timestamps or sequence numbers. This order describes file discovery and does not guarantee row order in the target table.

This is the default S3 ingestion mode and requires no queue. For files arriving in any order, use [notification ingestion](./continuous-load-s3-notification.md). For a prepared static file set, use [one-time ingestion](./continuous-load-s3-one-time.md).

## How it works

Doris scans for matching files after the most recently committed key. A new key must be lexicographically greater than the committed key. After `file1`, `file2`, and `file3` have been ingested, a newly uploaded `file0` will not be read. When no new files are available, the job polls at `max_interval`.

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

Omit `s3.ingestion_mode` to use the default, or set it explicitly to `ORDERED_LIST` in Job `PROPERTIES`.

```SQL
CREATE JOB my_job
ON STREAMING
DO
INSERT INTO db1.tbl1
select * from S3(
    "uri" = "s3://bucket/*.csv",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "format" = "csv",
    "column_separator" = ","
);
```

After ingestion, run `SELECT * FROM db1.tbl1 ORDER BY id;`. Expected result:

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
|  2 | Bob   |
+----+-------+
```

### Step 3: Monitor progress

```sql
SELECT Name, Status, CurrentOffset, EndOffset, ErrorMsg
FROM jobs("type" = "insert")
WHERE Name = 'my_job';
```

After `001.csv` is committed, expect `Status` to be `RUNNING` and `CurrentOffset` to be `{"fileName":"001.csv"}`. Upload a larger key such as `002.csv` to continue ingestion. The job remains running when no new files are available.

## Parameters

Configure the following in Job `PROPERTIES`. S3 connection, credentials, and file format options belong in `S3(...)`.

| Parameter | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | String | `ORDERED_LIST` | No | Set to `ORDERED_LIST`. Cannot be changed after creation. |
| `offset` | JSON string | None | No | Read strictly after this key, for example `'{"fileName":"data/001.csv"}'`. Without it, start at the beginning of the matching path. |
| `s3.max_batch_files` | Positive integer | `256` | No | File count threshold per batch. |
| `s3.max_batch_bytes` | Integer | `10737418240` | No | Byte threshold per batch, from `104857600` to `10737418240`. Unit suffixes are not accepted. |
| `max_interval` | Positive integer | `10` | No | Idle scheduling interval in seconds. |

Batch thresholds do not require the job to wait for a full batch before inserting.

### Start after a specific file

If `data/001.csv` and earlier files have already been processed, start reading from `data/002.csv` with:

```sql
CREATE JOB s3_after_offset_job
PROPERTIES (
    "s3.ingestion_mode" = "ORDERED_LIST",
    "offset" = "{\"fileName\":\"data/001.csv\"}"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

This skips `data/001.csv` and all smaller keys, ingesting only matching keys after it. Use a separate target table for this example to avoid overlap with the quick start.

The ingestion mode and S3 URI cannot be changed after creation. Create another job to change the mode or path.

## Troubleshooting and limitations

- **New files are not ingested:** verify that keys match the URI and are greater than `CurrentOffset`. Files added behind the cursor are not backfilled. Use a separate prefix and one-time job for a backfill, or configure notification ingestion before uploading files.
- **Unexpected ordering:** use fixed-width timestamps or zero-padded counters such as `000001.csv`. Otherwise, `file10` sorts before `file2`.
- **Objects are overwritten or deleted:** keep each key unique and its content immutable and readable during ingestion. Overwriting an already committed object does not trigger another ingestion.
- **Creation fails on an empty path:** S3 TVF needs a matching, readable, non-empty file to infer the schema when creating the job.

For pause, resume, and task inspection, see [Continuous Load Overview](./continuous-load-overview.md). To modify a job, see [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md).
