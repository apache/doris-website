---
{
    "title": "SHOW CATALOGS",
    "language": "en",
    "description": "This statement is used for view created catalogs"
}
---

## Description

This statement is used for view created catalogs

## Syntax

```sql
SHOW CATALOGS [LIKE <catalog_name>]
```

illustrate:

1. LIKE: Fuzzy query can be performed according to the catalog name


## Optional Parameters

**1. `<catalog_name>`**

The name of the catalog to be displayed.

## Return Value

| Column Name    | Description |
|---|---|
| CatalogId      | Unique ID of the data catalog |
| CatalogName    | Name of the data catalog. The default built-in catalog is named "internal" and cannot be modified. |
| Type           | Type of the data catalog |
| IsCurrent      | Indicates whether it is the currently active data catalog |
| CreateTime     | Creation time  |
| LastUpdateTime | Last updated time |
| Comment        | comments about the catalog |

## Access Control Requirements
| Privilege                                                                                    | Object  | Notes                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | One of the above permissions is required. |


## Examples

1. View the data catalogs that have been created currently

   ```sql
   SHOW CATALOGS;
   ```
   ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    |         0 | internal    | internal | yes       | UNRECORDED              | NULL                | Doris internal catalog |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    ```

2. Fuzzy query by catalog name

   ```sql
   SHOW CATALOGS LIKE 'hi%';
   ```
    ```sql
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    | CatalogId | CatalogName | Type     | IsCurrent | CreateTime              | LastUpdateTime      | Comment                |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
    |    130100 | hive        | hms      |           | 2023-12-25 16:11:41.687 | 2023-12-25 20:43:18 | NULL                   |
    +-----------+-------------+----------+-----------+-------------------------+---------------------+------------------------+
   ```