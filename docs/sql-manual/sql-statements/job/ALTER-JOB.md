---
{
    "title": "ALTER JOB",
    "language": "en",
    "description": "Use ALTER JOB to update paused Streaming Jobs, change runtime properties or SQL, and reset MySQL or PostgreSQL CDC progress to an exact JSON offset."
}
---

## Description

Modifies the runtime properties, execution SQL, or Auto Table Creation Sync configuration of a Streaming Job. Only Streaming Jobs in the `PAUSED` state can be modified, and each statement must provide at least one actual change.

## Syntax

```sql
ALTER JOB <job_name>
[
    PROPERTIES (<job_property>[, ...])
]
[
    <Insert_Command>
    | FROM <source_type> (<source_property>[, ...])
      TO DATABASE <target_db> (<target_property>[, ...])
]
```

## Required Parameters

**1. `<job_name>`**
> The name of the Job to modify.

## Optional parameters

**1. `<job_property>`**
> Modifies Job properties such as `max_interval`, `compute_group`, or `session.*`, or resets a CDC position through a JSON `offset`.

**2. `<Insert_Command>`**
> Modifies the INSERT SQL executed by a TVF-mode job. Do not use the `DO` keyword in `ALTER JOB`.

**3. `<source_property>` and `<target_property>`**
> Modify source-side or target-side properties of Auto Table Creation Sync. The data source type and target database cannot be changed.

:::note
Auto Table Creation Sync does not allow changes to `jdbc_url`, `database`, `schema`, `include_tables`, `exclude_tables`, the source-side `offset`, `snapshot_split_size`, `snapshot_parallelism`, per-table mapping parameters, `slot_name`, or `publication_name`. To reset a CDC position, use the Job Property `offset`.

CDC Stream TVF mode does not allow changes to the target table, TVF type, `type`, `jdbc_url`, `database`, `schema`, `table`, `snapshot_split_size`, `snapshot_parallelism`, `slot_name`, or `publication_name`. You can modify the INSERT SQL to rotate credentials, drivers, or other modifiable parameters.
:::

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Job Type | Notes |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | Database (DB) | Streaming | Supports **LOAD** privileges to perform this operation |

## Examples

- Modify the session variable of my_job

   ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    );
    ```
- Modify the SQL statement for my_job

   ```sql
    ALTER JOB my_job
    INSERT INTO db1.tbl1 
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ```  

- Simultaneously modify the Properties and SQL statements of my_job.

    ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    INSERT INTO db1.tbl1 
    select * from S3(
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ``` 

- Modify the synchronization progress of the S3 job my_job

```sql
ALTER JOB my_job
PROPERTIES(
    'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
);
```

- Reset a MySQL CDC job to an exact Binlog offset

```sql
ALTER JOB mysql_cdc_job
PROPERTIES (
    "offset" = '{"file":"binlog.000001","pos":"154"}'
);
```

- Reset a PostgreSQL CDC job to an exact LSN

```sql
ALTER JOB pg_cdc_job
PROPERTIES (
    "offset" = '{"lsn":"12345678"}'
);
```

A CDC position can be modified only while the job is in the `PAUSED` state. The `offset` property accepts only an exact JSON offset in the formats shown above; it does not accept `initial`, `snapshot`, `earliest`, or `latest`.
