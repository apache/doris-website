---
{
    "title": "DROP INDEX",
    "language": "en"
}
---

## Description

This statement is used to delete an index with a specified name from a table. Currently, only bitmap indexes are supported.

## Syntax

```sql
DROP INDEX [ IF EXISTS ] <index_name> ON [ <db_name> . ] <table_name>;
```

## Required Parameters

**1. `<index_name>`**: The name of the index.  

**2. `<table_name>`**：The name of the table to which the index belongs.  

## Optional Parameters

**1. `<db_name>`**：The database name, optional. If not specified, the current database is used by default.  

## Access Control Requirements

The user executing this SQL command must have at least the following privileges:

| Privilege            | Object             | Notes                                         |
|:---------------------|:-------------------|:----------------------------------------------|
| ALTER_PRIV           | Table              | DROP INDEX is an ALTER operation on the table |

## Examples

- drop index

   ```sql
   DROP INDEX IF NOT EXISTS index_name ON table1 ;
   ```

