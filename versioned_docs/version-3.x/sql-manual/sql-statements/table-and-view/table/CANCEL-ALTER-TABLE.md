---
{
    "title": "CANCEL ALTER TABLE",
    "language": "en"
}
---

## Description

This statement is used to cancel (revoke) an ongoing ALTER TABLE operation. You can use this command to terminate an ALTER TABLE operation while it is being executed.

## Syntax

```sql
CANCEL ALTER TABLE { COLUMN | MATERIALIZED VIEW | ROLLUP } FROM <db_name>.<table_name> [ <job_id1> [ , <job_id2> ... ]]
```

## Required Parameters
**1. `{ COLUMN | MATERIALIZED VIEW | ROLLUP }`**
>Specify the type of modification to be canceled, one of which must be selected
>- `COLUMN`: Cancel the modification operation on the table column
>- `ROLLUP`: Cancel the modification operation on the view
>- `MATERIALIZED VIEW`: Cancel the modification operation on the materialized view

**2.`<db_name>`**
> Specifies the identifier (that is, the name) of the database.
>
> Identifier must begin with an alphabet character (if Unicode name support is enabled, any language character is allowed), and must not contain spaces or special characters, except for the entire identifier string enclosed in quotes (e.g., `My Database`).
>
> Identifier cannot use reserved keywords.
>
> For more information, see Identifier Requirements and Reserved Keywords.

**3.`<table_name>`**
> Specifies the identifier (that is, the name) of the table, within its database (Database).
>
> Identifier must begin with an alphabet character (if Unicode name support is enabled, any language character is allowed), and must not contain spaces or special characters, except for the entire identifier string enclosed in quotes (e.g., `My Object`).
>
> Identifier cannot use reserved keywords.
>
> For more information, see Identifier Requirements and Reserved Keywords.

## Optional Parameters
**1. `<job_id>`**
> The specific job ID to cancel.
>
> If a job ID is specified, only the specified job is canceled; if not specified, all ongoing modifications of the specified type (COLUMN or ROLLUP) on the table are canceled.
>
> You can specify multiple job IDs, separated by commas.
>
> You can obtain job IDs by using the `SHOW ALTER TABLE COLUMN` or `SHOW ALTER TABLE ROLLUP` command.


## Permission Control
Users who execute this SQL command must have at least the following permissions:


| Privilege | Object | Notes                    |
| :---------------- | :------------- | :---------------------------- |
| ALTER_PRIV        | Table   | CANCEL ALTER TABLE belongs to table ALTER operation |


## Notes
- This command is an asynchronous operation, and the actual execution result needs to be confirmed by using `SHOW ALTER TABLE COLUMN` or `SHOW ALTER TABLE ROLLUP` to check the status of the task.

## Example

1. Cancel ALTER TABLE COLUMN operation

```sql
CANCEL ALTER TABLE COLUMN
FROM db_name.table_name
```

2. Cancel ALTER TABLE ROLLUP operation


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name
```

3. Cancel ALTER TABLE ROLLUP operation in batches based on job ID


```sql
CANCEL ALTER TABLE ROLLUP
FROM db_name.table_name (jobid,...)
```


4. Cancel ALTER CLUSTER operation

```sql
(To be implemented...)
```
