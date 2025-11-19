---
{
"title": "ALTER JOB",
"language": "en"
}
---

## Description

A user can modify a job. Only jobs in the PAUSE state can be modified, and only Streaming type jobs can be modified.

## Syntax

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command> 
```

## Required Parameters

**1. `<job_name>`**
> Modify the job name of the job

## Optional parameters

**1. `<job_properties>`**
> Modify the job's attributes.

**1. `<Insert_Command>`**
> Modify the SQL executed by the job.


## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Job Type | Notes |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | Database (DB) | Streaming | Supports **LOAD** privileges to perform this operation |

## Examples

- Modify the session variable of my_job

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    ```
- Modify the SQL statement for my_job

   ```SQL
    Alter Job my_job
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

    ```SQL
    Alter Job my_job
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
    )
    ``` 

- Modify the synchronization progress of my_job

    ```sql
        Alter JOB my_job
        PROPERTIES(
            'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
        )
    ```