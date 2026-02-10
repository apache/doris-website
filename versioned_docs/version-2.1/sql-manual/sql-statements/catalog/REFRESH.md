---
{
    "title": "REFRESH",
    "language": "en",
    "description": "This statement refreshes the metadata of the specified Catalog/Database/Table."
}
---

## Description

This statement refreshes the metadata of the specified Catalog/Database/Table.

## Syntax

```sql
REFRESH CATALOG <catalog_name>;
REFRESH DATABASE [<catalog_name>.]<database_name>;
REFRESH TABLE [[<catalog_name>.]<database_name>.]<table_name>;
```

## Required Parameters

**1. `<catalog_name>`**

The name of the catalog that needs to be refreshed.

**2. `[<catalog_name>.]<database_name>`**

The name of the database within the catalog that needs to be refreshed.

**3. `[[<catalog_name>.]<database_name>.]<table_name>`**

The name of the table within the catalog that needs to be refreshed.

## Access Control Requirements
| Privilege                                                                                    | Object  | Notes                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | One of the above permissions is required. |


## Usage Notes
When the Catalog is refreshed, the object-related Cache is forced to be invalidated. Including Partition Cache, Schema Cache, File Cache, etc.

## Example

1. Refresh hive catalog

    ```sql
    REFRESH CATALOG hive;
    ```

2. Refresh database1

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

3. Refresh table1

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```