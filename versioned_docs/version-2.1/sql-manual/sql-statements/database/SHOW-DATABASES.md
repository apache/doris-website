---
{
    "title": "SHOW DATABASES",
    "language": "en"
}
---

## Description

This statement is used to display the currently visible database.

## Syntax

```sql
SHOW DATABASES [FROM <catalog>] [<filter_expr>];
```

## Optional parameters

** 1. `<catalog>`**
>  Corresponding catalog

** 2. `<filter_expr>`**
>  Filter by specified conditions

## Return Value

| Column | Description |
|:---------|:-----------|
| Database |  Database Name|

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object    | Notes             |
|:-----------|:------|:---------------|
| SELECT_PRIV | Corresponding database | Requires read permission on the corresponding database |

## 示例

- Displays the names of all current databases.

   ```sql
   SHOW DATABASES;
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | test               |
   | information_schema |
   +--------------------+
   ```

- Will display all database names in `hms_catalog`.

   ```sql
   SHOW DATABASES FROM hms_catalog;
   ```

   ```text
   +---------------+
   | Database      |
   +---------------+
   | default       |
   | tpch          |
   +---------------+
   ```

- Displays the names of all databases currently filtered by the expression `like 'infor%'`.

   ```sql
   SHOW DATABASES like 'infor%';
   ```

   ```text
   +--------------------+
   | Database           |
   +--------------------+
   | information_schema |
   +--------------------+
   ```
