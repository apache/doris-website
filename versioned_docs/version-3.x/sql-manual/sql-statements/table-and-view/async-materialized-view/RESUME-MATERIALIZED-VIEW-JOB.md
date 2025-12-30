---
{
    "title": "RESUME MATERIALIZED VIEW",
    "language": "en",
    "description": "This statement is used to temporarily restore the scheduled scheduling of materialized views"
}
---

## Description

This statement is used to temporarily restore the scheduled scheduling of materialized views

## Syntax

```sql
RESUME MATERIALIZED VIEW JOB ON <mv_name>
```

## Required Parameters

**1. `<mv_name>`**
> Specifies the materialized view name.
>
> The materialized view name must start with a letter character (or any language character if unicode name support is enabled) and cannot contain spaces or special characters unless the entire materialized view name string is enclosed in backticks (e.g., `My Object`).
>
> The materialized view name cannot use reserved keywords.
>
> For more details, see Reserved Keywords.

## Access Control Requirements
Users executing this SQL command must have at least the following privileges:

| Privilege  | Object | Notes                                        |
| :--------- | :----- | :------------------------------------------- |
| ALTER_PRIV | Materialized View  | RESUME is an ALTER operation on a materialized view |


## Usage Notes

- This statement is generally used after the pause materialized view statement

## Example

- Timed scheduling for restoring materialized view mv1

    ```sql
    RESUME MATERIALIZED VIEW JOB ON mv1;
    ```
