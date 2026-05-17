---
{
    "title": "ALTER CATALOG",
    "language": "en",
    "description": "This statement is used to set properties of the specified catalog."
}
---

## Description

This statement is used to set properties of the specified catalog.


## Syntax
1) Rename the catalog

    ```sql
    ALTER CATALOG <catalog_name> RENAME <new_catalog_name>;
    ```

2) Modify / Add properties for the catalog

    ```sql
    ALTER CATALOG <catalog_name> SET PROPERTIES ('<key>' = '<value>' [, ... ]);  
    ```

3) Modify comment for the catalog

    ```sql
    ALTER CATALOG <catalog_name> MODIFY COMMENT "<new catalog comment>";
    ```

## Required Parameters

**1. `<catalog_name>`**

The name of the catalog that should be modified

**2. `<new_catalog_name>`**

New catalog name after modification

**3. `'<key>' = '<value>'`**

The key and value of the catalog properties that need to be modified / added

**4. `<new catalog comment>`**

Modified catalog comment


## Access Control Requirements
| Privilege  | Object  | Notes                                     |
|:-----------|:--------|:------------------------------------------|
| ALTER_PRIV | Catalog | The ALTER_PRIV of the catalog is required |

## Usage Notes

1) Rename the catalog
- The builtin catalog `internal` cannot be renamed
- Only the one who has at least Alter privilege can rename a catalog
- After renaming the catalog, use the REVOKE and GRANT commands to modify the appropriate user permissions

2) Modify / Add properties for the catalog

- property `type` cannot be modified.
- properties of builtin catalog `internal` cannot be modified.
- Update values of specified keys. If a key does not exist in the catalog properties, it will be added.

3) Modify comment for the catalog

- The builtin catalog `internal` cannot be modified

## Example

1. rename catalog ctlg_hive to hive

      ```sql
      ALTER CATALOG ctlg_hive RENAME hive;
      ```

2. modify property `hive.metastore.uris` of catalog hive

      ```sql
      ALTER CATALOG hive SET PROPERTIES ('hive.metastore.uris'='thrift://172.21.0.1:9083');
      ```

3. modify comment of catalog hive
      ```sql
      ALTER CATALOG hive MODIFY COMMENT "new catalog comment";
      ```

