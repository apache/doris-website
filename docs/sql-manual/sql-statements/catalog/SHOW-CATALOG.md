---
{
    "title": "SHOW CATALOG",
    "language": "en",
    "description": "Shows properties of specified catalog"
}
---

## Description

Shows properties of specified catalog

## Property Masking

Sensitive properties follow the [Catalog property masking rules](../../../lakehouse/catalog-property-masking.md) and display as `*XXX`; some internal properties are omitted. Explicit JDBC connection strings are entirely hidden, while ordinary URIs are sanitized according to their values. This development-version behavior is not a guarantee for every 4.x or 3.x build.

## Syntax

```sql
SHOW CATALOG <catalog_name>
```


## Required Parameters

**1. `<catalog_name>`**

The name of the catalog to be displayed.

## Return Value

| Column Name | Description                   |
|-------------|-------------------------------|
| Key         | Configuration property name.  |
| Value       | Configuration property value. |

## Access Control Requirements

| Privilege                                                                                    | Object  | Notes                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | One of the above permissions is required. |

## Examples

1. View specific catalog configuration details

   ```sql
   show catalog test_mysql;
   ```
   ```text
      +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   | Key            | Value                                                                                                                                               |
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   | checksum       | fdf55dcef04b09f2eaf42b75e61ccc9a                                                                                                                    |
   | create_time    | 2025-02-17 17:21:13.099                                                                                                                             |
   | driver_class   | com.mysql.cj.jdbc.Driver                                                                                                                            |
   | driver_url     | mysql-connector-j-8.3.0.jar                                                                                                                         |
   | jdbc_url       | *XXX                                                                                                                                                |
   | password       | *XXX                                                                                                                                                |
   | type           | jdbc                                                                                                                                                |
   | use_meta_cache | true                                                                                                                                                |
   | user           | root                                                                                                                                                |
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+ 
   ```
