---
{
    "title": "AWS-Kinesis",
    "language": "en",
    "description": "Apache Doris continuously imports data from AWS Kinesis Data Streams through Routine Load. It can automatically and continuously consume data from Kinesis streams and import it into Doris tables."
}
---

## Basic Principles

### Core Concept Mapping

| Kinesis | Kafka | Description |
| --- | --- | --- |
| Stream | Topic | Named collection of data streams |
| Shard | Partition | Data shard in a stream; each shard has an independent data sequence |
| Sequence Number | Offset | Unique identifier of a record in a shard |
| GetRecords | Consume | API for reading records from a stream |

### AWS Authentication

For AWS authentication when importing from Kinesis, you can fully refer to the authentication method for importing data from MSK: [Routine Load Manual](./aws-msk.md)

## Parameters

| Parameter | Description | Default | Example |
| --- | --- | --- | --- |
| aws.region | AWS Region | Manually specified | `"us-east-1"` |
| aws.access_key | AWS Access Key ID | Manually specified | `\` |
| aws.secret_key | AWS Secret Access Key | Manually specified | `\` |
| aws.role_arn | Role ARN for cross-account access | Manually specified | `"arn:aws:iam::123456789012:role/MyRole"` |
| kinesis_stream | Kinesis Stream name | Manually specified | `"my-data-stream"` |
| kinesis_shards | Comma-separated list of shard IDs to consume. | All shards by default | `"shardId-000000000001,shardId-000000000002"` |
| kinesis_shards_pos | Starting position for each shard, comma-separated and mapped one-to-one with `kinesis_shards`. | `LATEST` | `TRIM_HORIZON` (earliest), `LATEST` (latest), `sequence number` |
| property.kinesis_default_pos | Default shard start position used when `kinesis_shards_pos` is not specified. | `LATEST` | `TRIM_HORIZON` (earliest), `LATEST` (latest), timestamp `"2026-01-01 00:00:00"` |
| Other `property.*` | Parameters with this prefix are passed through from FE to BE. | `\` | `\` |

## Quick Start

Because Doris reads data from Kinesis through Routine Load, the operation flow is consistent with the [Routine Load Manual](../import-way/routine-load-manual.md).

### Create Import

```SQL
CREATE ROUTINE LOAD [db_name.]job_name ON table_name
[load_properties]
[job_properties]
FROM KINESIS
(
    "aws.region" = "us-east-1",
    "aws.kinesis_stream" = "<your_stream_name>",
    "aws.access_key" = "<your_ak>",
    "aws.secret_key" = "<your_sk>"
);
```

### View Import Status

```SQL
SHOW ROUTINE LOAD FOR job_name;
```

Output field description (Kinesis-related fields only)

| Field | Description |
| --- | --- |
| DataSourceType | Data source type: KINESIS |
| DataSourceProperties | Kinesis data source configurations (region, stream, shards) |
| Progress | Consumption progress (Sequence Number for each shard) |
| Lag | Consumption lag (milliseconds from each shard to the latest data) |

### Pause Import Job

```SQL
PAUSE ROUTINE LOAD FOR job_name;
```

### Resume Import Job

```SQL
RESUME ROUTINE LOAD FOR job_name;
```

### Delete Import Job

```SQL
STOP ROUTINE LOAD FOR job_name;
```
