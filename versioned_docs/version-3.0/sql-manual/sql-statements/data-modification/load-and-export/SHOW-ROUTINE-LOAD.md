---
{
    "title": "SHOW ROUTINE LOAD",
    "language": "en"
}
---

## Description

This statement is used to display the running status of Routine Load jobs. You can view the status information of either a specific job or all jobs.

## Syntax

```sql
SHOW [ALL] ROUTINE LOAD [FOR <jobName>];
```

## Optional Parameters

**1. `[ALL]`**

> Optional parameter. If specified, all jobs (including stopped or cancelled jobs) will be displayed. Otherwise, only currently running jobs will be shown.

**2. `[FOR <jobName>]`**

> Optional parameter. Specifies the job name to view. If not specified, all jobs under the current database will be displayed.
>
> Supports the following formats:
>
> - `<job_name>`: Shows the job with the specified name in the current database
> - `<db_name>.<job_name>`: Shows the job with the specified name in the specified database

## Return Results

| Field Name           | Description                                                  |
| :------------------- | :---------------------------------------------------------- |
| Id                   | Job ID                                                       |
| Name                 | Job name                                                     |
| CreateTime           | Job creation time                                            |
| PauseTime            | Most recent job pause time                                   |
| EndTime              | Job end time                                                 |
| DbName               | Corresponding database name                                  |
| TableName            | Corresponding table name (shows 'multi-table' for multiple tables) |
| IsMultiTbl           | Whether it's a multi-table job                              |
| State                | Job running status                                          |
| DataSourceType       | Data source type: KAFKA                                     |
| CurrentTaskNum       | Current number of subtasks                                  |
| JobProperties        | Job configuration details                                    |
| DataSourceProperties | Data source configuration details                            |
| CustomProperties     | Custom configurations                                        |
| Statistic            | Job running statistics                                      |
| Progress            | Job running progress                                         |
| Lag                 | Job delay status                                            |
| ReasonOfStateChanged | Reason for job state change                                 |
| ErrorLogUrls         | URLs to view filtered data that failed quality checks       |
| OtherMsg            | Other error messages                                        |

## Access Control Requirements

Users executing this SQL command must have at least the following permission:

| Privilege    | Object | Notes                                            |
| :----------- | :----- | :----------------------------------------------- |
| LOAD_PRIV    | Table  | SHOW ROUTINE LOAD requires LOAD permission on the table |

## Notes

- State descriptions:
  - NEED_SCHEDULE: Job is waiting to be scheduled
  - RUNNING: Job is running
  - PAUSED: Job is paused
  - STOPPED: Job has ended
  - CANCELLED: Job has been cancelled

- Progress description:
  - For Kafka data source, shows the consumed offset for each partition
  - For example, {"0":"2"} means the consumption progress of Kafka partition 0 is 2

- Lag description:
  - For Kafka data source, shows the consumption delay for each partition
  - For example, {"0":10} means the consumption lag of Kafka partition 0 is 10

## Examples

- Show all routine load jobs (including stopped or cancelled ones) named test1

    ```sql
    SHOW ALL ROUTINE LOAD FOR test1;
    ```

- Show currently running routine load jobs named test1

    ```sql
    SHOW ROUTINE LOAD FOR test1;
    ```

- Show all routine load jobs (including stopped or cancelled ones) in example_db. Results can be one or multiple rows.

    ```sql
    use example_db;
    SHOW ALL ROUTINE LOAD;
    ```

- Show all currently running routine load jobs in example_db

    ```sql
    use example_db;
    SHOW ROUTINE LOAD;
    ```

- Show currently running routine load job named test1 in example_db

    ```sql
    SHOW ROUTINE LOAD FOR example_db.test1;
    ```

- Show all routine load jobs (including stopped or cancelled ones) named test1 in example_db. Results can be one or multiple rows.

    ```sql
    SHOW ALL ROUTINE LOAD FOR example_db.test1;
    ```