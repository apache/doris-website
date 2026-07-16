---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "en",
    "description": "Modifies an existing Routine Load job. Kafka jobs can also switch their target table."
}
---

## Description

`ALTER ROUTINE LOAD` modifies an existing Routine Load job. For a single-table Kafka job, one statement can switch the target table and modify supported job and Kafka data source properties at the same time. Kinesis jobs support job and data source property modifications, but do not support target-table switching.

Only a job in the `PAUSED` state can be modified. The recommended sequence is `PAUSE ROUTINE LOAD`, `ALTER ROUTINE LOAD`, and then `RESUME ROUTINE LOAD`.

## Syntax

```sql
ALTER ROUTINE LOAD FOR [<db_name>.]<job_name>
[
    SET TARGET TABLE = "<table_name>"
    | <load_property> [, <load_property> ...]
]
[PROPERTIES (
    "<job_property>" = "<value>"
    [, ...]
)]
[FROM <KAFKA | KINESIS> (
    "<data_source_property>" = "<value>"
    [, ...]
)];
```

The statement must specify at least one modification.

When `SET TARGET TABLE` is specified, the existing job must be a Kafka job and an optional `FROM` clause must be `FROM KAFKA`. A Kinesis job can use the other ALTER forms but cannot specify `SET TARGET TABLE`.

## Required Parameters

### `[<db_name>.]<job_name>`

Specifies the Routine Load job to modify.

- If `<db_name>` is omitted, Doris uses the current database.
- The job name can be enclosed in backticks.

## Optional Parameters

### `SET TARGET TABLE`

Switches the target table of a single-table Kafka Routine Load job to `<table_name>`.

The target table name must be a string literal, for example, `SET TARGET TABLE = "new_table"`. The old `ON new_table` form and an unquoted `SET TARGET TABLE = new_table` are not supported.

The target table must meet all of the following requirements:

- It is in the same database as the Routine Load job. `<table_name>` cannot specify another database.
- It is a non-temporary OLAP table.
- The job uses Kafka as its data source. Kinesis jobs do not support target-table switching.
- The job is a single-table Routine Load job. Multi-table jobs are not supported.
- The current user has the `LOAD_PRIV` privilege on both the old and new target tables.
- The new table is compatible with the existing column mappings, filters, fixed partitions, merge or delete conditions, sequence column, and partial-update mode. Doris replans the existing load configuration against the new table and rejects the change if a valid load plan cannot be generated.
- If the job was created with `load_to_single_tablet=true`, the new table uses Random Distribution.

`SET TARGET TABLE` can be combined with `PROPERTIES` and `FROM KAFKA`, but it cannot be combined with `FROM KINESIS` or `<load_property>`.

### `<load_property>`

Modifies an existing load clause. Supported clauses include:

- `COLUMNS TERMINATED BY`
- `COLUMNS (...)`
- `PRECEDING FILTER`
- `WHERE`
- `DELETE ON`
- `ORDER BY`
- `PARTITION (...)`

These clauses can be combined with `PROPERTIES` and `FROM`, but cannot appear in the same statement as `SET TARGET TABLE`. When the target table is switched, Doris reuses the existing load clauses.

### `<job_property>`

Properties in the `PROPERTIES` clause are modified by key. Only explicitly specified keys are changed; omitted keys retain their existing values.

| Property | Modification requirements |
| --- | --- |
| `desired_concurrent_number` | Must be greater than `0`. Actual concurrency is still limited by the number of BEs, partitions or shards, and cluster configuration. |
| `max_error_number` | Must be greater than or equal to `0`. |
| `max_filter_ratio` | Must be in `[0, 1]`. |
| `max_batch_interval` | Must be greater than or equal to `1`, in seconds. |
| `max_batch_rows` | Must be greater than or equal to `200000`. |
| `max_batch_size` | Must be from 100 MiB through 10 GiB, in bytes. |
| `strict_mode` | `true` or `false`. |
| `timezone` | A valid time zone. It is also used to parse Kafka datetime offsets in the same statement. |
| `workload_group` | A non-empty Workload Group name. |
| `partial_columns` | A backward-compatible property. For Kafka jobs, `true` maps `UPSERT` to `UPDATE_FIXED_COLUMNS`; `false` does not change an existing partial-update mode back to `UPSERT`. Do not specify this property together with `unique_key_update_mode` for a Kinesis job. |
| `unique_key_update_mode` | One of `UPSERT`, `UPDATE_FIXED_COLUMNS`, and `UPDATE_FLEXIBLE_COLUMNS`. For Kafka jobs, this property takes precedence if `partial_columns` is also specified. For Kinesis jobs, use this property alone to disable partial updates or switch modes unambiguously. |
| `jsonpaths` | Changes JSON paths. The file format itself cannot be changed by ALTER. |
| `json_root` | Changes the JSON root. |
| `strip_outer_array` | `true` or `false`. |
| `num_as_string` | `true` or `false`. |
| `fuzzy_parse` | `true` or `false`. |
| `enclose` | This version accepts and records this key, but does not update the enclosing character used by runtime tasks. Do not use ALTER to change it; recreate the job when this character must change. |
| `escape` | This version accepts and records this key, but does not update the escape character used by runtime tasks. Do not use ALTER to change it; recreate the job when this character must change. |
| `empty_field_as_null` | `true` or `false`. |

Partial updates are also constrained by the target table and the existing load configuration:

- `UPDATE_FIXED_COLUMNS` requires a Merge-on-Write Unique Key table.
- `UPDATE_FLEXIBLE_COLUMNS` requires a table that supports flexible partial updates. The effective configuration after this ALTER must use JSON, have `fuzzy_parse` disabled, have no non-empty `jsonpaths`, and have no `COLUMNS` mapping. For example, the same statement can set `fuzzy_parse` to `false` or clear `jsonpaths`.
- Multi-table jobs do not support partial-update modes.

The following create-time properties are not in the ALTER allowlist and cannot be modified by this statement:

- `format`
- `exec_mem_limit`
- `send_batch_parallelism`
- `load_to_single_tablet`
- `partial_update_new_key_behavior`

Other unknown properties are also rejected. Property names must use the fixed spelling in the allowlist; use the lowercase names shown in this document.

### Kafka `<data_source_property>`

A Kafka job must use `FROM KAFKA (...)`. The explicit data source type must match the existing job type; a Kafka job cannot be converted into a Kinesis job.

| Property | Modification requirements |
| --- | --- |
| `kafka_broker_list` | A list of Kafka broker addresses. Existing values do not need to be repeated during ALTER. Changing only the brokers does not reset progress. |
| `kafka_topic` | A non-empty new topic. Explicitly providing a non-empty value invokes the topic-switch path and resets progress, even when it equals the current topic. An empty value does not clear the current topic. |
| `kafka_partitions` | A comma-separated partition list. It must be specified together with `kafka_offsets` or a default offset. |
| `kafka_offsets` | One value per `kafka_partitions` entry. A value can be a non-negative integer, `OFFSET_BEGINNING`, `OFFSET_END`, or a datetime. Datetime and ordinary offset semantics cannot be mixed in one list. |
| `kafka_default_offsets` | The default offset: `OFFSET_BEGINNING`, `OFFSET_END`, or a datetime. It cannot be specified together with `kafka_offsets`. |
| `property.kafka_default_offsets` | A compatible form of `kafka_default_offsets`. The two forms cannot be specified together. |
| `property.*` | A custom Kafka client property. Doris removes the `property.` prefix internally. A matching key is overwritten and other custom properties are retained. |
| `aws.*` | Doris AWS MSK IAM properties. Related authentication properties must form a complete, valid set in this ALTER statement. |

Kafka offset changes have these additional requirements:

- `kafka_partitions` and `kafka_offsets` must contain the same number of items.
- Without a topic switch, only partitions that are already in the job's consumed range can be changed. ALTER cannot add a new consumed partition.
- `kafka_offsets` is mutually exclusive with `kafka_default_offsets` and `property.kafka_default_offsets`.
- `kafka_default_offsets` and `property.kafka_default_offsets` are mutually exclusive.
- A default offset specified without partitions applies to partitions discovered later. When it is specified with `kafka_partitions`, it also initializes the listed partitions.
- If no default offset is explicitly specified, Doris retains the current default instead of synthesizing `OFFSET_END`.

The following Kafka multi-table routing properties are create-only and cannot be modified by ALTER:

- `kafka_table_name_location`
- `kafka_table_name_format`
- `kafka_text_table_name_field_delimiter`
- `kafka_text_table_name_field_index`

When modifying AWS MSK IAM settings, the `FROM KAFKA` clause must contain a self-consistent configuration. For example, it must provide `aws.region`, `property.security.protocol=SASL_SSL`, and `property.sasl.mechanism=OAUTHBEARER`. An external ID requires a role ARN. If the same ALTER statement specifies a public broker and explicit credentials, it must provide both an access key and a secret key.

### Kinesis `<data_source_property>`

A Kinesis job must use `FROM KINESIS (...)`. The explicit data source type must match the existing job type; a Kinesis job cannot be converted into a Kafka job. Kinesis jobs support the property modifications below, but do not support `SET TARGET TABLE`.

| Property | Modification requirements |
| --- | --- |
| `aws.region` | An AWS region such as `us-east-1`. The existing value does not need to be repeated during ALTER. |
| `aws.endpoint` | A custom Kinesis endpoint. The legacy key `kinesis_endpoint` is also accepted. |
| `kinesis_stream` | A non-empty new stream. Explicitly providing a non-empty value invokes the stream-switch path and resets progress and discovered shard state, even when it equals the current stream. An empty value does not clear the current stream. |
| `kinesis_shards` | A comma-separated list of shard IDs. It must be specified together with `kinesis_shards_pos` or a default position. |
| `kinesis_shards_pos` | One value per `kinesis_shards` entry. A value can be `TRIM_HORIZON`, `LATEST`, or a numeric sequence number. |
| `property.kinesis_default_pos` | The default position: `TRIM_HORIZON`, `LATEST`, or a numeric sequence number. The `property.` prefix is required. |
| `aws.access_key` | An AWS access key. It must be provided together with `aws.secret_key`. |
| `aws.secret_key` | An AWS secret key. It must be provided together with `aws.access_key`. |
| `aws.session_key` | An optional AWS session token. |
| `aws.role_arn` | An optional IAM role ARN. |
| `property.*` | A custom Kinesis client property. A matching key is overwritten and other custom properties are retained. |

Kinesis position changes have these additional requirements:

- `kinesis_shards` and `kinesis_shards_pos` must contain the same number of items.
- Without a stream switch, only positions of currently consumed shards can be changed.
- `kinesis_shards_pos` and `property.kinesis_default_pos` are mutually exclusive.
- Kinesis positions do not accept datetime values.
- A default position specified without shards applies to shards discovered later. When it is specified with `kinesis_shards`, it also initializes the listed shards.
- If a `FROM KINESIS` ALTER specifies neither `kinesis_shards_pos` nor `property.kinesis_default_pos`, Doris synthesizes `LATEST` and records it as the new default position. To retain a non-`LATEST` default while changing only the region, endpoint, stream, credentials, or another custom property, repeat the current `property.kinesis_default_pos` in the same statement.
- The access key and secret key must be provided together in the same ALTER statement. `property.aws.external.id` also requires a role ARN.

## Property Modification Semantics

`job_properties`, Kafka properties, and Kinesis properties generally use key-based incremental update semantics:

- Only explicitly specified keys are changed and omitted keys retain their current values, except for the Kinesis default-position behavior described above.
- Custom `property.*` values are merged with the existing properties, and a matching key is overwritten.
- There is no general `UNSET` or property-deletion syntax. Omitting a key does not delete it.
- Authentication properties with dependencies should be provided as a complete set in the same ALTER statement.
- Do not repeat an unchanged, non-empty `kafka_topic` or `kinesis_stream`, because doing so triggers the corresponding source-switch and progress-reset behavior.

## Access Control Requirements

The user executing this command needs at least the following privileges:

| Privilege | Object | Notes |
| --- | --- | --- |
| `LOAD_PRIV` | Current target table | Modifying a Routine Load job requires `LOAD_PRIV` on its current target table. |
| `LOAD_PRIV` | New target table | `SET TARGET TABLE` additionally requires `LOAD_PRIV` on the new target table. |

## Progress and Data Behavior

- Switching only the target table of a Kafka job does not reset Kafka offsets. Existing rows remain in the old table; after the job resumes, newly consumed data is written to the new table.
- Changing ordinary job properties, Kafka brokers, the Kinesis region or endpoint, or custom `property.*` values does not reset progress.
- Explicitly providing a non-empty `kafka_topic` resets Kafka progress.
- Explicitly providing a non-empty `kinesis_stream` resets Kinesis progress, discovered shards, and the lag cache.
- If one statement switches the target table and also provides a non-empty `kafka_topic`, progress is reset because of the topic change. It is not a target-only switch.

## Examples

### Switch the target table of a Kafka job and retain progress

In this example, `db1.job1` is a single-table Kafka Routine Load job.

```sql
PAUSE ROUTINE LOAD FOR db1.job1;

ALTER ROUTINE LOAD FOR db1.job1
SET TARGET TABLE = "new_table";

RESUME ROUTINE LOAD FOR db1.job1;
```

Already consumed rows remain in the old table. After the job resumes, new rows are written to `new_table`.

### Switch the target table and modify properties together

This example switches the target table, changes the error threshold, and updates the Kafka client ID. Kafka progress is retained because `kafka_topic` is not explicitly specified.

```sql
PAUSE ROUTINE LOAD FOR db1.job1;

ALTER ROUTINE LOAD FOR db1.job1
SET TARGET TABLE = "new_table"
PROPERTIES (
    "max_error_number" = "10"
)
FROM KAFKA (
    "property.client.id" = "target-switch"
);

RESUME ROUTINE LOAD FOR db1.job1;
```

### Change Kafka partition offsets

```sql
PAUSE ROUTINE LOAD FOR db1.job1;

ALTER ROUTINE LOAD FOR db1.job1
FROM KAFKA (
    "kafka_partitions" = "0,1,2",
    "kafka_offsets" = "100,200,100"
);

RESUME ROUTINE LOAD FOR db1.job1;
```

### Change Kinesis shard positions

```sql
PAUSE ROUTINE LOAD FOR db1.kinesis_job;

ALTER ROUTINE LOAD FOR db1.kinesis_job
FROM KINESIS (
    "kinesis_shards" = "shardId-000000000000,shardId-000000000001",
    "kinesis_shards_pos" = "TRIM_HORIZON,LATEST"
);

RESUME ROUTINE LOAD FOR db1.kinesis_job;
```

After the modification, use `SHOW ROUTINE LOAD FOR <job_name>` to inspect the target table, job properties, data source properties, and consumption progress.
