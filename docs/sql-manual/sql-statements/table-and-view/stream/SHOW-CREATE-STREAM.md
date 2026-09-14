---
{
    "title": "SHOW CREATE STREAM",
    "language": "en",
    "description": "Shows the CREATE statement of a Table Stream."
}
---

## Description

Shows the CREATE statement of a Table Stream, including its base table, comment, and properties.

## Syntax

```sql
SHOW CREATE STREAM [<db_name>.]<stream_name>
```

## Required Parameters

**1. `<stream_name>`**
> The Stream name.

## Optional Parameters

**1. `<db_name>`**
> The database of the Stream; defaults to the current database.

## Return Value

| Column | Description |
|---|---|
| `Stream` | Stream name |
| `Create Stream` | The CREATE statement |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | |

## Usage Notes

Running this statement on an ordinary table fails with a hint to use `SHOW CREATE TABLE`. If the base table has been dropped, `ON TABLE` shows `UNKNOWN`.

## Examples

```sql
SHOW CREATE STREAM orders_stream\G
```

```text
*************************** 1. row ***************************
       Stream: orders_stream
Create Stream: CREATE STREAM `orders_stream`
ON TABLE internal.demo.orders
COMMENT 'sync order changes to dwd'
PROPERTIES (
"type" = "MIN_DELTA",
"show_initial_rows" = "false"
);
```
