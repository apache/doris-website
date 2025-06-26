---
{
    "title": "CREATE VIEW",
    "language": "en"
}
---

## Description

This statement is used to create a logical view using a specified query statement.

## Syntax

```sql
CREATE VIEW [IF NOT EXISTS] [<db_name>.]<view_name>
   [(<column_definition>)]
AS <query_stmt>
```

Where:
```sql
column_definition:
    <column_name> [COMMENT '<comment>'] [,...]
```

## Required Parameters

**1. `<view_name>`**
> The identifier (i.e., name) of the view; it must be unique within the database where the view is created.  
> The identifier must start with a letter character (if Unicode name support is enabled, it can be a character in any language) and cannot contain spaces or special characters unless the entire identifier string is enclosed in backticks (e.g., `My View`).  
> The identifier cannot use reserved keywords.  
> For more details, see identifier requirements and reserved keywords.

**2. `<query_stmt>`**
> The SELECT query statement that defines the view.

## Optional Parameters

**1. `<db_name>`**
> The name of the database where the view resides. If not specified, the current database is used by default.

**2. `<column_definition>`**
> The column definitions of the view.  
> Where:  
> **1. `<column_name>`**  
> Column name.  
> **2. `<comment>`**  
> Column comment.

## Access Control Requirements

| Privilege   | Object   | Notes                                                                |
|-------------|----------|----------------------------------------------------------------------|
| CREATE_PRIV | Database | CREATE_PRIV privilege is required on the database.                   |
| SELECT_PRIV | Table, View | SELECT_PRIV privilege is required on the tables, views, or materialized views being queried. |

## Notes

- Views are logical and do not have physical storage. All queries on the view are equivalent to queries on the corresponding subquery.
- Creating and dropping views does not affect the data in the underlying tables.

## Examples

1. Create a view `example_view` on `example_db`

    ```sql
    CREATE VIEW example_db.example_view (k1, k2, k3, v1)
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```

2. Create a view with column definitions

    ```sql
    CREATE VIEW example_db.example_view
    (
        k1 COMMENT "first key",
        k2 COMMENT "second key",
        k3 COMMENT "third key",
        v1 COMMENT "first value"
    )
    COMMENT "my first view"
    AS
    SELECT c1 as k1, k2, k3, SUM(v1) FROM example_table
    WHERE k1 = 20160112 GROUP BY k1,k2,k3;
    ```