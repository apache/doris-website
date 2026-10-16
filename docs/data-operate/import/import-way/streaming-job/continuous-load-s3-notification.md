---
{
    "title": "S3 notification ingestion",
    "sidebar_label": "Notification ingestion",
    "language": "en",
    "description": "Ingest S3 files through a dedicated SQS queue with Doris Streaming Job, including AWS setup, IAM policies, SQL, monitoring, and delivery limitations.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "Notification ingestion"
    ]
}
---

Notification ingestion uses `NOTIFICATION` to consume S3 object-created events from SQS and continuously ingest new files into Doris. It suits UUID filenames and files arriving in any order, without relying on filename ordering.

Only **AWS S3 notifications sent directly to an SQS Standard Queue in the same Region** are supported. Each job needs a dedicated queue. Historical objects are not scanned or backfilled. End-to-end delivery is at-least-once: an object can be ingested more than once, and file ingestion order is not guaranteed.

## Quick start

The example uses `s3://example-bucket/data/*.csv` in `us-east-1`. Replace the bucket, account, queue, and credentials with your values.

### Prepare the Doris target table

The account needs `LOAD` on the target table and the corresponding database/table creation privileges. Use a separate empty table to avoid overlap with other examples.

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

This single-BE example uses one replica. Adjust the replica count for production.

### Step 1: Create an SQS Standard Queue

Create a Standard Queue in the **same Region** as the S3 bucket and record its URL and ARN. A 14-day message retention period is recommended to cover pauses and failures. SQS deletes messages after the retention period expires.

### Step 2: Allow S3 to send notifications

Merge the following statement into the queue access policy, replacing the account, bucket, and queue identifiers:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ToSendMessage",
      "Effect": "Allow",
      "Principal": {"Service": "s3.amazonaws.com"},
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>",
      "Condition": {
        "ArnEquals": {"aws:SourceArn": "arn:aws:s3:::example-bucket"},
        "StringEquals": {"aws:SourceAccount": "<account-id>"}
      }
    }
  ]
}
```

### Step 3: Grant Doris access

Grant the job's IAM user or role the following permissions. FE needs SQS and S3 access; BE needs to read S3 objects. AssumeRole also requires STS connectivity.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::example-bucket"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::example-bucket/data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>"
    }
  ]
}
```

### Step 4: Configure S3 event notifications

Create a rule under the bucket's Event notifications:

- Select **All object create events** (`s3:ObjectCreated:*`).
- Set Prefix to `data/` and Suffix to `.csv`, without wildcards. The rule must cover the job's URI pattern.
- Select the SQS queue as the destination. Send S3 messages directly without an SNS envelope.

Enable the rule before uploading files to ingest. Creating a notification rule does not generate events for existing objects.

### Step 5: Create the Streaming Job

S3 TVF needs matching files for schema inference during job creation. After enabling notifications, upload a non-empty `data/001.csv` containing:

```text
1,Alice
2,Bob
```

Then create the job:

```sql
CREATE JOB s3_event_job
PROPERTIES (
    "s3.ingestion_mode" = "NOTIFICATION",
    "s3.event.source" = "SQS",
    "s3.sqs.queue_url" = "https://sqs.us-east-1.amazonaws.com/<account-id>/<queue-name>",
    "max_interval" = "10"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://example-bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "provider" = "S3",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>"
);
```

This file generates an SQS notification. Objects uploaded before notifications were configured can supply schema inference, but are not automatically backfilled. At least one matching file must remain readable when creating the job.

To use an IAM role, replace the access-key and secret-key options with the following; `s3.external_id` is optional depending on the trust policy:

```sql
"s3.role_arn" = "arn:aws:iam::<account-id>:role/<role-name>",
"s3.external_id" = "<external-id>"
```

FE calls AssumeRole using its configured AWS credentials. The role needs S3 and SQS permissions, the caller needs `sts:AssumeRole`, and the role's trust policy must allow that caller.

After processing the notification for `data/001.csv`, the table contains the corresponding two rows. Later files are ingested through notifications even if their keys are smaller than previously processed keys. Repeated notifications can affect the row count depending on the target table model.

### Step 6: Monitor the queue backlog

```sql
SELECT Name, Status, CurrentOffset, EndOffset, LagBytes,
       LastSourceEventTimestamp, LastTaskSuccessTime
FROM jobs("type" = "insert")
WHERE Name = 's3_event_job';
```

Example `CurrentOffset`: `{"fileName":"data/a.csv"}`. Example `EndOffset`: `{"fileName":"data/b.csv","lagMessages":12}`. These keys describe batch positions, not lexicographical watermarks, and cannot determine whether ingestion has caught up.

| Field | Meaning in notification mode |
| --- | --- |
| `LagBytes` | `-1`: the byte size of queued objects is unavailable. |
| `EndOffset.lagMessages` | Approximate visible SQS messages, excluding in-flight and delayed messages. It is not a file count. |
| `LastSourceEventTimestamp` | Maximum S3 event timestamp in the most recently committed batch, in Unix seconds. It does not prove that all earlier events have been processed. |

FE also exposes per-job metrics:

```text
doris_fe_streaming_job_per_job_lag_messages
doris_fe_streaming_job_per_job_last_source_event_timestamp_seconds
```

## Acknowledgment and limitations

- Only retained SQS notifications are consumed. Historical objects are not scanned.
- Job creation requires a matching, readable, non-empty file for S3 TVF schema inference.
- Each queue must be exclusive to one job. Doris skips and acknowledges out-of-scope records, malformed or unsupported notifications, and S3 test events. Jobs with different URI patterns must not share a queue.
- For valid files, messages are deleted after the INSERT transaction commits. Visibility is extended during processing, and failed batches can be retried. FE recovery can use persisted keys from the most recently committed batch to handle its redelivery; Doris does not persist every historical key for global deduplication.
- S3 and SQS can deliver duplicates. End-to-end semantics are at-least-once and file ingestion order is not guaranteed. Use a Unique Key table for business deduplication and a Sequence column for order-sensitive updates as needed.
- Keep object keys unique and content immutable and readable. Doris reads the content at processing time, not necessarily the version present when the event was emitted. Deleting objects early causes failures and retries.

## Parameters

Configure the following in Job `PROPERTIES`. S3 connection, credentials, and file format options belong in `S3(...)`.

| Parameter | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | String | `ORDERED_LIST` | Yes | Set to `NOTIFICATION`. Cannot be changed after creation. |
| `s3.event.source` | String | None | Yes | Must be `SQS`. Cannot be changed after creation. |
| `s3.sqs.queue_url` | String | None | Yes | URL of the dedicated SQS queue. Cannot be changed after creation. |
| `s3.max_batch_files` | Positive integer | `256` | No | File count threshold per batch. |
| `s3.max_batch_bytes` | Integer | `10737418240` | No | Byte threshold per batch, from `104857600` to `10737418240`. Unit suffixes are not accepted. |
| `max_interval` | Positive integer | `10` | No | Idle scheduling interval in seconds. Must be less than `7200`. |

Batch thresholds are soft and do not require waiting for a full batch. Already received messages stay in the same batch; the next receive stops after a threshold is reached, so a batch can exceed either threshold. `offset` is prohibited during creation and `ALTER JOB`. The S3 URI cannot be changed. Create another job to change the path or queue.

## Troubleshooting and best practices

| Symptom | Checks and action |
| --- | --- |
| Job creation fails | Check matching non-empty files, S3/SQS permissions, and network connectivity. |
| The job runs without ingesting files | Check that notifications preceded uploads, `s3:ObjectCreated:*` is selected, filters cover the URI, and no other consumer reads the queue. |
| Historical files are missing | Notification rules do not replay historical events. Use a separate prefix and [one-time ingestion](./continuous-load-s3-one-time.md). |
| Files are missing after a pause | Check SQS message retention and backfill missing files separately if needed. |
| Repeated read failures | Inspect `ErrorMsg` and task errors. Check object availability, immutability, and format compatibility. |
| Duplicate rows | Review business keys and the target table model. Do not rely on global historical file deduplication. |

Set sufficient message retention, keep objects immutable and readable, and monitor approximate backlog, last success time, and task errors. For job management, see [Continuous Load Overview](./continuous-load-overview.md) and [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md).
