---
{
    "title": "SHOW TABLE ID",
    "language": "en",
    "description": "This statement is used to find the corresponding database name, table name according to table id."
}
---

### Description

This statement is used to find the corresponding database name, table name according to table id.

## Syntax

```sql
SHOW TABLE <table_id>
```

## Required parameters

**1. `<table_id>`**
> Need to find `<table_id>` of database name, table name table.

## Return value

| Column name (Column) | Type (DataType) | Notes (Notes) |
|:--------------------|:-------------|:----------|
| DbName | String | Database name |
| TableName | String | Table name |
| DbId | String | Database ID |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
|:--------------|:-----------|:------------------------|
| ADMIN_PRIV | Table (table) | Currently only supports **ADMIN** permissions to perform this operation |

## Examples

- Find the corresponding database name, table name according to the table id

   ```sql
   SHOW TABLE 2261121
   ```

   ```text
   +--------+------------+---------+
   | DbName | TableName  | DbId    |
   +--------+------------+---------+
   | demo   | test_table | 2261034 |
   +--------+------------+---------+
   ```
