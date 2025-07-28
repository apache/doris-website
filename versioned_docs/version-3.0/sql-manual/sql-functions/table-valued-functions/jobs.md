---
{
  "title": "JOBS",
  "language": "en"
}
---

## Description

Table function, generating a temporary task table, which can view job information in a certain task type.

## Syntax

```sql
JOBS(
    "type"="<type>"
)
```

## Required Parameters
| Field         | Description                                                                                   |
|---------------|-----------------------------------------------------------------------------------------------|
| **`<type>`**  | The type of the job: <br/> `insert`: Insert into type job. <br/> `mv`: Materialized view job. |



## Return Value

-  **`jobs("type"="insert")`** Job return value of type insert

   | Field              | Description                |
       |--------------------|----------------------------|
   | Id                 | Job ID                     |
   | Name               | Job name                   |
   | Definer            | Job definer                |
   | ExecuteType        | Execution type             |
   | RecurringStrategy  | Recurring strategy         |
   | Status             | Job status                 |
   | ExecuteSql         | Execution SQL              |
   | CreateTime         | Job creation time          |
   | SucceedTaskCount   | Number of successful tasks |
   | FailedTaskCount    | Number of failed tasks     |
   | CanceledTaskCount  | Number of canceled tasks   |
   | Comment            | Job comment                |


- **`jobs("type"="mv")`** MV type job return value

  | Field                | Description                                                 |
      |----------------------|-------------------------------------------------------------|
  | Id                   | job ID                                                      |
  | Name                 | job name                                                    |
  | MvId                 | Materialized View ID                                        |
  | MvName               | Materialized View Name                                      |
  | MvDatabaseId         | DB ID of the materialized view                              |
  | MvDatabaseName       | Name of the database to which the materialized view belongs |
  | ExecuteType          | Execution type                                              |
  | RecurringStrategy    | Loop strategy                                               |
  | Status               | Job status                                                  |
  | CreateTime           | Task creation time                                          |


## Examples

View jobs in all materialized views

```sql
select * from jobs("type"="mv");
```
```text
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
| Id    | Name             | MvId  | MvName                   | MvDatabaseId | MvDatabaseName                                         | ExecuteType | RecurringStrategy | Status  | CreateTime          |
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
| 23369 | inner_mtmv_23363 | 23363 | range_date_up_union_mv1  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 18:19:10 |
| 23377 | inner_mtmv_23371 | 23371 | range_date_up_union_mv2  | 21805        | regression_test_nereids_rules_p0_mv_create_part_and_up | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 18:19:10 |
| 21794 | inner_mtmv_21788 | 21788 | test_tablet_type_mtmv_mv | 16016        | zd                                                     | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-08 12:26:06 |
| 19508 | inner_mtmv_19494 | 19494 | mv1                      | 16016        | zd                                                     | MANUAL      | MANUAL TRIGGER    | RUNNING | 2025-01-07 22:13:31 |
+-------+------------------+-------+--------------------------+--------------+--------------------------------------------------------+-------------+-------------------+---------+---------------------+
```

View all insert jobs
```sql
select * from jobs("type"="insert");
```
```text
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| Id             | Name           | Definer | ExecuteType | RecurringStrategy                          | Status  | ExecuteSql                                                   | CreateTime          | SucceedTaskCount | FailedTaskCount | CanceledTaskCount | Comment |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| 78533940810334 | insert_tab_job | root    | RECURRING   | EVERY 10 MINUTE STARTS 2025-01-17 14:42:53 | RUNNING | INSERT INTO test.insert_tab SELECT * FROM test.example_table | 2025-01-17 14:32:53 | 0                | 0               | 0                 |         |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
```