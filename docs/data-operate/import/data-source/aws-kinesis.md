---
{
    "title": "AWS Kinesis",
    "language": "en",
    "description": "Continuously load AWS Kinesis Data Streams into Apache Doris with Routine Load: setup, authentication, shard positions, and troubleshooting."
}
---

Routine Load can continuously read AWS Kinesis Data Streams and load records into Doris tables. A stream contains shards; Doris tracks progress using a sequence number for each shard.

:::info Version
Kinesis Routine Load is available in the dev version. The 4.x source branches do not include this data source; this guide does not apply to those versions.
:::

## Prerequisites

- Use a Doris build that includes Kinesis Routine Load. BEs must be able to reach the Kinesis endpoint.
- Prepare a Kinesis stream and credentials that allow `kinesis:ListShards`, `kinesis:GetShardIterator`, and `kinesis:GetRecords` on it.
- Use a Doris account with database/table creation permissions and `LOAD_PRIV` on the target table. Administrative operations on an existing job also require the appropriate load permission.
- For the producer command below, configure the AWS CLI with credentials that have `kinesis:PutRecord` permission. Use a dedicated test stream, or account for existing records in the stream.

Doris supports an access-key/secret-key pair, temporary credentials with a session token, an assumed IAM role, or the AWS default credential chain available to the BE process. For general AWS credential guidance, see [AWS Authentication](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md).

## Quick Start

### 1. Create a database and target table

Run the following SQL with a MySQL client. The example uses one replica for a single-BE development cluster; choose an appropriate replica count for production.

```sql
CREATE DATABASE IF NOT EXISTS kinesis_demo;
USE kinesis_demo;

CREATE TABLE kinesis_events (
    id BIGINT NOT NULL,
    name STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 2. Create a Routine Load job

Replace the stream name, region, and credentials before running this statement. The property is `kinesis_stream`, without an `aws.` prefix. `TRIM_HORIZON` reads from the oldest records still retained by the stream.

```sql
CREATE ROUTINE LOAD kinesis_demo.kinesis_job ON kinesis_events
COLUMNS(id, name)
PROPERTIES (
    "format" = "json",
    "desired_concurrent_number" = "1"
)
FROM KINESIS (
    "aws.region" = "us-east-1",
    "kinesis_stream" = "my-test-stream",
    "aws.access_key" = "<access_key>",
    "aws.secret_key" = "<secret_key>",
    "property.kinesis_default_pos" = "TRIM_HORIZON"
);
```

For BE environments that already have an appropriate default AWS credential chain, omit the access-key and secret-key properties. See the parameter reference for role and temporary-credential settings.

### 3. Write a test record and verify it

From a shell with AWS CLI v2 configured for the test stream:

```shell
aws kinesis put-record \
  --region us-east-1 \
  --stream-name my-test-stream \
  --partition-key 1 \
  --cli-binary-format raw-in-base64-out \
  --data '{"id":1,"name":"Alice"}'
```

The command returns a shard ID and sequence number. Routine Load runs asynchronously. After the job consumes and commits the record, query Doris:

```sql
SELECT id, name FROM kinesis_demo.kinesis_events WHERE id = 1;
```

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
+----+-------+
```

## Parameters

All properties below belong to the `FROM KINESIS (...)` clause. Omitted optional properties retain their defaults. General job properties such as `format`, `jsonpaths`, and `desired_concurrent_number` belong to `PROPERTIES (...)`; see [Routine Load](../import-way/routine-load-manual.md).

| Parameter | Type / Required | Default | Description |
| --- | --- | --- | --- |
| `aws.region` | String; required | None | Region containing the stream, such as `us-east-1`. |
| `kinesis_stream` | String; required | None | Stream name. Do not use `aws.kinesis_stream`. |
| `aws.endpoint` | String; optional | AWS endpoint for the region | Custom Kinesis endpoint, for example a LocalStack endpoint. The legacy alias `kinesis_endpoint` is also accepted; prefer `aws.endpoint`. |
| `aws.access_key` | String; optional | AWS default credential chain when no explicit credentials are supplied | Access-key ID. Must be supplied together with `aws.secret_key`. |
| `aws.secret_key` | String; optional | None | Secret key paired with `aws.access_key`. |
| `aws.session_key` | String; optional | None | Session token for temporary credentials. |
| `aws.role_arn` | String; optional | None | IAM role to assume; the credential identity must be allowed to assume it. |
| `kinesis_shards` | Comma-separated string; optional | Automatically discover shards | Shard IDs to consume. |
| `kinesis_shards_pos` | Comma-separated string; optional | `LATEST` for each explicitly listed shard | Positions corresponding one-to-one to `kinesis_shards`. Each value is `TRIM_HORIZON`, `LATEST`, or a sequence number. A sequence number starts consumption **after** that record. |
| `property.kinesis_default_pos` | String; optional | `LATEST` | Default start position: `TRIM_HORIZON`, `LATEST`, or a sequence number. Cannot be combined with `kinesis_shards_pos`. Timestamp strings are not supported. |
| Other `property.*` | String; optional | Depends on the BE option | Forwarded to the BE after stripping `property.`. For example, `property.aws.profile.name` selects a credential profile and `property.aws.external.id` supplies an external ID for role assumption; the latter requires a role ARN. Only use options supported by the BE. |

## Monitor and Manage the Job

```sql
SHOW ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

| Field | Expected meaning |
| --- | --- |
| `State` | `RUNNING` after the job is scheduled and can read the stream. Inspect the pause reason if the job is `PAUSED`. |
| `DataSourceType` | `KINESIS`. |
| `DataSourceProperties` | Region, stream, endpoint, and configured shards. |
| `Progress` | Per-shard sequence-number progress. Sequence numbers are not Kafka offsets and cannot be added together to count records. |
| `Lag` | Per-shard lag in milliseconds behind the latest record, when available. |

```sql
PAUSE ROUTINE LOAD FOR kinesis_demo.kinesis_job;
RESUME ROUTINE LOAD FOR kinesis_demo.kinesis_job;
STOP ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

`PAUSE` stops scheduling new tasks and allows the job to be resumed. `STOP` permanently ends the job; a stopped job cannot be resumed.

## Caveats and Best Practices

- The default `LATEST` does not replay historical records. Use `TRIM_HORIZON` for the oldest retained data, or explicit shard positions for controlled replay. Data already expired from Kinesis cannot be recovered by changing the start position.
- Explicit shard IDs and positions must have the same number of entries. Do not combine `kinesis_shards_pos` and `property.kinesis_default_pos`.
- If creation reports an invalid property, check the spelling and the distinction between job properties and source properties. In particular, `aws.kinesis_stream` and timestamp start-position strings are invalid.
- If the job pauses, inspect `SHOW ROUTINE LOAD` and BE logs for authentication, endpoint, shard, and data-format errors. JSON records must match the target columns or the configured mappings.
- Use representative stream throughput to size concurrency. Kinesis read limits and shard distribution can limit throughput; adding tasks cannot bypass AWS per-shard limits.
