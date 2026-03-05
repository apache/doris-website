---
{
    "title": "SHOW-DATABASE-ID",
    "language": "en",
    "description": "This statement is used to find the corresponding database name based on the database id (only used by administrators)"
}
---

### Description

This statement is used to find the corresponding database name based on the database id (only used by administrators)

## Syntax

```sql
SHOW DATABASE <database_id>
```

## Required parameters

** 1. `<database_id>`**
>  Database corresponding id number

## Return Value

| Column | Description |
|:---------|:-----------|
| DbName |  Database Name|

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | The entire cluster | Requires administrative privileges for the entire cluster |

## Example

- Find the corresponding database name according to the database id

    ```sql
    SHOW DATABASE 10396;
    ```

    ```text
    +------------+
    | DbName     |
    +------------+
    | example_db |
    +------------+
    ```
