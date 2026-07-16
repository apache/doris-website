---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "en",
    "description": "Modifies a paused Routine Load job, including its Kafka target table, job properties, and Kafka source properties."
}
---

## Description

This statement modifies an existing Routine Load job. Only jobs in the `PAUSED` state can be modified. You can pause a Routine Load job by using [PAUSE ROUTINE LOAD](./PAUSE-ROUTINE-LOAD.md).

After a successful modification, you can:

- Use [SHOW ROUTINE LOAD](./SHOW-ROUTINE-LOAD.md) to check the modified job details.
- Use [RESUME ROUTINE LOAD](./RESUME-ROUTINE-LOAD.md) to restart the job.

## Syntax

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[SET TARGET TABLE = "<new_table_name>"]
[PROPERTIES (
    "<job_property>" = "<value>"
    [, ...]
)]
[FROM <data_source> (
    "<data_source_property>" = "<value>"
    [, ...]
)];
```

## Parameters

### 1. `[<db>.]<job_name>`

Specifies the name of the job to modify. An identifier must start with a letter and cannot contain spaces or special characters unless the entire identifier is enclosed in backticks.

An identifier cannot use a reserved keyword. For more information, see [Identifier Requirements](../../../basic-element/object-identifiers.md) and [Reserved Keywords](../../../basic-element/reserved-keywords.md).

### 2. `SET TARGET TABLE = "<new_table_name>"`

Specifies the new target table for the load job.

Switching only the target table does not move historical data. Existing batches remain in the old table. After the job resumes, Doris continues consuming from the retained Kafka offsets and writes new batches to the new table.

The target table must be in the same database as the job and must be a non-temporary OLAP table. Target-table switching supports only single-table Kafka Routine Load jobs.

### 3. `<job_properties>`

Specifies the job properties to modify. The following properties are currently supported:

- `desired_concurrent_number`
- `max_error_number`
- `max_batch_interval`
- `max_batch_rows`
- `max_batch_size`
- `jsonpaths`
- `json_root`
- `strip_outer_array`
- `strict_mode`
- `timezone`
- `num_as_string`
- `fuzzy_parse`
- `partial_columns`
- `max_filter_ratio`

### 4. `<data_source>`

Specifies the data source type. When used together with `SET TARGET TABLE`, currently only the following type is supported:

- `KAFKA`

### 5. `<data_source_properties>`

Specifies the data source properties to modify. The following properties are currently supported:

- `kafka_broker_list`
- `kafka_topic`
- Custom properties, such as `property.group.id`
- `kafka_partitions` and `kafka_offsets`, which modify the offsets of Kafka partitions to be consumed. When `kafka_topic` is not changed, only currently consumed partitions can be modified; new partitions cannot be added.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| --- | --- | --- |
| `LOAD_PRIV` | Current target table | Required when modifying a single-table Routine Load job. |
| `LOAD_PRIV` | Database | Required when modifying a multi-table Routine Load job. |
| `LOAD_PRIV` | New target table | Additionally required when using `SET TARGET TABLE`. |

## Examples

### Modify `desired_concurrent_number` to `1`

```sql
ALTER ROUTINE LOAD FOR db1.label1
PROPERTIES
(
    "desired_concurrent_number" = "1"
);
```

### Modify `desired_concurrent_number`, partition offsets, and group ID

```sql
ALTER ROUTINE LOAD FOR db1.label1
PROPERTIES
(
    "desired_concurrent_number" = "10"
)
FROM KAFKA
(
    "kafka_partitions" = "0, 1, 2",
    "kafka_offsets" = "100, 200, 100",
    "property.group.id" = "new_group"
);
```

### Switch the target table to `new_table_name`

```sql
ALTER ROUTINE LOAD FOR db1.label1
SET TARGET TABLE = "new_table_name";
```
