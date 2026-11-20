---
{
    "title": "SHOW CREATE CATALOG",
    "language": "en",
    "description": "This statement shows the creating statement of a doris catalog."
}
---

## Description

This statement shows the creating statement of a doris catalog.

## Property Masking

The password mask in this example describes that field only. Coverage of other credentials and connection strings depends on the exact version and patch level; it does not imply that every access key, token, JDBC URL or URI is hidden. The [complete development-version policy](/docs/dev/lakehouse/catalog-property-masking/) is not a guarantee for every 3.x build. In the example, `*XXX` is a masking marker; other `XXX` values are illustrative placeholders.

## Syntax

```sql
SHOW CREATE CATALOG <catalog_name>;
```

## Required Parameters

**1. `<catalog_name>`**

The name of the catalog whose creation statement needs to be viewed.

## Access Control Requirements
| Privilege                                                                                    | Object  | Notes                                     |
|:---------------------------------------------------------------------------------------------|:--------|:------------------------------------------|
| ADMIN_PRIV / SELECT_PRIV / LOAD_PRIV / ALTER_PRIV / CREATE_PRIV / SHOW_VIEW_PRIV / DROP_PRIV | Catalog | One of the above permissions is required. |


## Example

1. View the creating statement of the oracle catalog in doris

   ```sql
   SHOW CREATE CATALOG oracle;
   ```
   ```text
   +---------+----------------------------------------------------------------------------------------------------------------------+
    | Catalog | CreateCatalog                                                                                                        |
    +---------+----------------------------------------------------------------------------------------------------------------------+
    | oracle  |
    CREATE CATALOG `oracle` PROPERTIES (
    "user" = "XXX",
    "type" = "jdbc",
    "password" = "*XXX",
    "jdbc_url" = "XXX",
    "driver_url" = "XXX",
    "driver_class" = "oracle.jdbc.driver.OracleDriver",
    "checksum" = "XXX"
    ); |
    +---------+----------------------------------------------------------------------------------------------------------------------+
   ```

