---
{
    "title": "SHOW STREAMS",
    "language": "en",
    "description": "Lists the Table Streams in a database."
}
---

## Description

Lists the Table Streams in the current or the specified database; only Streams the user has SHOW privilege on are listed. The type, base table, and state of each Stream are available in [information_schema.table_streams](../../../../admin-manual/system-tables/information_schema/table_streams).

## Syntax

```sql
SHOW STREAMS [{FROM | IN} <db_name>] [LIKE '<pattern>' | WHERE <expr>]
```

## Optional Parameters

**1. `<db_name>`**
> The database name; defaults to the current database.

**2. `LIKE '<pattern>'`**
> Match Stream names with a pattern, with the same syntax as `SHOW TABLES LIKE`.

**3. `WHERE <expr>`**
> Filter with a condition, with the same syntax as `SHOW TABLES WHERE`.

## Return Value

| Column | Description |
|---|---|
| `Tables_in_<db_name>` | Stream name |

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege | Object | Notes |
| :-------- | :----- | :---- |
| SHOW_PRIV | Stream | Only Streams with this privilege are listed |

## Examples

```sql
SHOW STREAMS;
```

```text
+----------------+
| Tables_in_demo |
+----------------+
| orders_stream  |
| events_stream  |
+----------------+
```

```sql
SHOW STREAMS FROM demo LIKE 'orders%';
```
