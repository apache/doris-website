---
{
    "title": "SHOW TABLES",
    "language": "en"
}
---

## Description

This statement is used to display all tables and views under the current db.

## Syntax

```sql
SHOW [ FULL ] TABLES [ FROM [ <catalog_name>.]<db_name> ][ LIKE <like_condition> ]
```

## Optional parameters

**1. `FULL`**
> If this parameter is added to the statement, the returned result will have three more columns, namely Table_type (table type), Storage_format (storage format), and Inverted_index_storage_format (inverted index storage format).

**2. `FROM [ <catalog_name>.]<db_name>`**
> In the FROM clause, you can specify the catalog name and database name to be queried.

**2. `LIKE <like_condition>`**
> In the LIKE clause, you can perform fuzzy queries based on table names.

## Return value

| Column name (Column) | Type (DataType) | Notes (Notes) |
|:--------------------|:-------------|:----------------------------|
| Tables_in_<db_name> | String | All tables and views under the database where `<db_name>` is located. |
| Table_type | String | Table and view type. |
| Storage_format | String | Table and view storage format. |
| Inverted_index_storage_format | String | Table and view inverted index storage format. |

## Access Control Requirements

The user who executes this SQL command must have at least the following permissions:

| Privilege (Privilege) | Object (Object) | Notes (Notes) |
|:--------------|:-----------|:------------------|
| SELECT_PRIV | Table (Table), View (View) | Only tables and views with query permissions can be displayed. |

## Usage Notes

- If the FROM clause is not specified in the statement, the corresponding database needs to be used for execution.

## Examples

- View all tables under DB

     ```sql
     SHOW TABLES;
     ```

     ```text
     +---------------------------------+
     | Tables_in_demo                  |
     +---------------------------------+
     | ads_client_biz_aggr_di_20220419 |
     | cmy1                            |
     | cmy2                            |
     | intern_theme                    |
     | left_table                      |
     +---------------------------------+
     ```

- Fuzzy query by table name

     ```sql
     SHOW TABLES LIKE '%cm%'
     ```

     ```text
     +----------------+
     | Tables_in_demo |
     +----------------+
     | cmy1           |
     | cmy2           |
     +----------------+
     ```

- Use FULL to query the tables and views under db

     ```sql
     SHOW FULL TABLES
     ```

     ```text
     +----------------+------------+----------------+-------------------------------+
     | Tables_in_demo | Table_type | Storage_format | Inverted_index_storage_format |
     +----------------+------------+----------------+-------------------------------+
     | test_table     | BASE TABLE | V2             | V1                            |
     | test_view      | VIEW       | NONE           | NONE                          |
     +----------------+------------+----------------+-------------------------------+
     ```

