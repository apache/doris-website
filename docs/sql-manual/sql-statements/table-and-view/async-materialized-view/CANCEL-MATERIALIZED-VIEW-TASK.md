---
{
    "title": "CANCEL MATERIALIZED VIEW TASK",
    "language": "en"
}
---

## Description

This statement is used to cancel the task of materialized views

## Syntax

```sql
CANCEL MATERIALIZED VIEW TASK <task_id> ON <mv_name>
```

## Required Parameters
**1. `<task_id>`**
> Specifies the task id of materialized view.


**2. `<mv_name>`**
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
| ALTER_PRIV | Materialized View  | CANCEL is an ALTER operation on a materialized view |

## Example

- Cancel the task with id 1 in materialized view mv1

    ```sql
    CANCEL MATERIALIZED VIEW TASK 1 on mv1;
    ```

