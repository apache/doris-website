---
{
    "title": "USE DATABASE",
    "language": "en",
    "description": "Used to switch to the specified database or compute group."
}
---

## Description

Used to switch to the specified database or compute group.

## Syntax

```SQL
USE { [<catalog_name>.]<database_name>[@<compute_group_name>] | @<compute_group_name> }
```

## Required Parameters

Switch to the specified database.

**1. `<database_name>`**
> The name of the database to switch to.
> If no catalog is specified, the current catalog is used by default.

Switch to the specified compute group only.

**1. `<compute_group_name>`**
> The name of the compute group to switch to.

## Optional Parameters

Switch to the specified database.

**1. `<catalog_name>`**
> The name of the catalog to switch to.

**2. `<compute_group_name>`**
> The name of the compute group to switch to.

## Access Control Requirements

| Privilege   | Object                | Notes                                                                |
|-------------|-----------------------|----------------------------------------------------------------------|
| SELECT_PRIV | Catalog, Database     | SELECT_PRIV privilege is required on the catalog or database to switch to. |
| USAGE_PRIV  | Compute Group         | USAGE_PRIV privilege is required on the compute group to switch to.  |

## Examples

1. If the `demo` database exists, try to use it:

   ```sql
   use demo;
   ```

2. If the `demo` database exists under the `hms_catalog` catalog, try to switch to `hms_catalog` and use it:

    ```sql
    use hms_catalog.demo;
    ```

3. If the `demo` database exists in the current catalog and you want to use the compute group named 'cg1', try to access it:

    ```sql
    use demo@cg1;
    ```

4. If you only want to use the compute group named 'cg1', try to access it:

    ```sql
    use @cg1;
    ```