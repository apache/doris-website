---
{
   "title": "SHOW CATALOG",
   "language": "en"
}
---

## Description

Shows properties of specified catalog

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
   mysql> show catalog test_mysql;
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   | Key            | Value                                                                                                                                               |
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   | checksum       | fdf55dcef04b09f2eaf42b75e61ccc9a                                                                                                                    |
   | create_time    | 2025-02-17 17:21:13.099                                                                                                                             |
   | driver_class   | com.mysql.cj.jdbc.Driver                                                                                                                            |
   | driver_url     | mysql-connector-java-8.0.25.jar                                                                                                                     |
   | jdbc_url       | jdbc:mysql://127.0.0.1:23306/tpch?yearIsDateType=false&tinyInt1isBit=false&useUnicode=true&rewriteBatchedStatements=true&characterEncoding=utf-8 |
   | password       | *XXX                                                                                                                                                |
   | type           | jdbc                                                                                                                                                |
   | use_meta_cache | true                                                                                                                                                |
   | user           | root                                                                                                                                                |
   +----------------+-----------------------------------------------------------------------------------------------------------------------------------------------------+
   ```
