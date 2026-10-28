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
REFRESH CATALOG <catalog_name>
    [PROPERTIES ("invalid_cache" = "true" | "false")];
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

`invalid_cache` controls whether lower-level metadata caches are invalidated during `REFRESH CATALOG`:

- `true`: invalidate catalog object caches and lower-level caches such as partition, schema, and file caches. This is the default behavior.
- `false`: refresh only catalog-level object/name metadata and keep lower-level caches.

`invalid_cache` currently applies to `REFRESH CATALOG`.

In the development version (master), `REFRESH TABLE` treats a table name in an existing external database as a metadata invalidation target. It succeeds even if the remote table has been dropped or the supplied table name has never existed. A missing catalog or database, an internal catalog, or insufficient privileges still causes an error.

A successful table refresh does not confirm remote table existence or immediately reload its schema. Doris reloads metadata on subsequent access, so a query against a dropped table can still fail. This allows stale table lookups to be invalidated across FEs even when the master has not cached the table.

## Example

1. Refresh hive catalog

    ```sql
    REFRESH CATALOG hive;
    ```

2. Refresh hive catalog without invalidating lower-level caches

    ```sql
    REFRESH CATALOG hive PROPERTIES("invalid_cache" = "false");
    ```

3. Refresh database1

    ```sql
    REFRESH DATABASE ctl.database1;
    REFRESH DATABASE database1;
    ```

4. Refresh table1

    ```sql
    REFRESH TABLE ctl.db.table1;
    REFRESH TABLE db.table1;
    REFRESH TABLE table1;
    ```

