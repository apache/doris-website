---
{
    "title": "SHOW ALTER TABLE MATERIALIZED VIEW",
    "language": "en"
}
---

## Description

Check the status of the synchronized materialized view build task.

Since creating a synchronized materialized view is an asynchronous operation, after submitting the materialized view creation task, users need to asynchronously check the status of the synchronized materialized view build through a command.

## Syntax


```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM <database>
```

## Required Parameters

**1. `<database>`**

> The database to which the base table of the synchronized materialized view belongs.

## Permissions

The user executing this SQL command must have at least the following permissions:

| Privilege  | Object | Notes                                                        |
| ---------- | ------ | ------------------------------------------------------------ |
| ALTER_PRIV | Table  | Requires ALTER_PRIV permission on the table to which the current materialized view belongs |

## Example

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM doc_db;
```