---
{
    "title": "S3 ingestion overview",
    "sidebar_label": "Overview",
    "language": "en",
    "description": "Choose ordered, notification, or one-time S3 ingestion with Doris Streaming Job, with guides for shared options, monitoring, and job management.",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "Overview"
    ]
}
---

Doris uses **Streaming Job + S3 TVF** to ingest S3 files into an existing Doris table in batches. Choose ordered, notification, or one-time ingestion based on how files arrive and whether the job should continue running.

## Choose an ingestion mode

| Guide | Mode | When to use it | Completion |
| --- | --- | --- | --- |
| [Ordered ingestion](./continuous-load-s3-ordered.md) | `ORDERED_LIST` (default) | Keys increase lexicographically, such as timestamps or zero-padded counters | Runs continuously and waits for new files |
| [Notification ingestion](./continuous-load-s3-notification.md) | `NOTIFICATION` | UUID keys or files arriving in any order, discovered through AWS S3 events and a dedicated SQS queue | Runs continuously and waits for messages |
| [One-time ingestion](./continuous-load-s3-one-time.md) | `ONE_TIME` | A prepared static file set or isolated backfill | Enters `FINISHED` after the final batch commits |

Notification ingestion does not backfill historical objects, and repeated notifications can cause duplicate ingestion. All modes require source objects to remain readable and immutable during ingestion. Each guide above includes setup, SQL examples, parameters, and limitations.

## Related documents

- [Amazon S3 ingestion](../../data-source/amazon-s3.md): S3 Load and TVF + INSERT.
- [Continuous Load Overview](./continuous-load-overview.md): job and task inspection, pause, resume, and deletion.
- [CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md): job creation syntax.
- [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md): job modification syntax.
- [S3 TVF](../../../../sql-manual/sql-functions/table-valued-functions/s3.md): connection, credentials, and file format options.
