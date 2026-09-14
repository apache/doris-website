---
{
    "title": "DROP STREAM",
    "language": "en",
    "description": "Drops a Table Stream."
}
---

## Description

Drops a Table Stream. Dropping a Stream does not affect the base table or its Row Binlog.

## Syntax

```sql
DROP STREAM [IF EXISTS] [<db_name>.]<stream_name> [FORCE]
```

## Required Parameters

**1. `<stream_name>`**
> The Stream to drop.

## Optional Parameters

**1. `<db_name>`**
> The database of the Stream; defaults to the current database.

**2. `IF EXISTS`**
> Do not report an error if the Stream does not exist.

**3. `FORCE`**
> Drop directly without going through the recycle bin. A Stream whose base table has been dropped must be dropped with `FORCE`; in the compute-storage decoupled mode `FORCE` is mandatory.

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| DROP_PRIV | Stream | |

## Usage Notes

- Running `DROP TABLE` on a Stream fails with a hint to use `DROP STREAM`.
- In the compute-storage decoupled mode, omitting `FORCE` fails with `Cloud Table Stream only supports DROP STREAM ... FORCE`.
- The consumption offsets are removed together with the Stream; a Stream recreated with the same name starts consuming from its creation time.

## Examples

```sql
DROP STREAM IF EXISTS orders_stream;
DROP STREAM orders_stream FORCE;
```
