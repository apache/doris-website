---
{
    "title": "ALTER STREAM",
    "language": "en",
    "description": "Modifies the comment of a Table Stream."
}
---

## Description

Modifies the comment of a Table Stream. The consumption type (`type`) and the `show_initial_rows` property of a Table Stream cannot be changed after creation; drop and recreate the Stream instead.

## Syntax

```sql
ALTER STREAM [<db_name>.]<stream_name> { SET | MODIFY } COMMENT '<comment>'
```

## Required Parameters

**1. `<stream_name>`**
> The Stream to modify.

**2. `<comment>`**
> The new comment. `SET COMMENT` and `MODIFY COMMENT` are equivalent.

## Optional Parameters

**1. `<db_name>`**
> The database of the Stream; defaults to the current database.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| ALTER_PRIV | Stream | |

## Usage Notes

The new comment is shown by `SHOW CREATE STREAM` and in the `STREAM_COMMENT` column of `information_schema.table_streams`.

## Examples

```sql
ALTER STREAM orders_stream SET COMMENT 'sync order changes to dwd';
ALTER STREAM orders_stream MODIFY COMMENT 'sync order changes to dwd, hourly';
```
