---
{
    "title": "SET FRONTEND CONFIG",
    "language": "en",
    "description": "This statement is used to set the configuration items of the cluster (currently only supports setting FE configuration items)."
}
---

## Description

This statement is used to set the configuration items of the cluster (currently only supports setting FE configuration items).

## Syntax:

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```

## Required Parameters
**`{ALL FRONTENDS | FRONTEND}`**
> **`ALL FRONTENDS`**: Represents all FE nodes in the Doris cluster
>
> **`FRONTEND`**: Represents the currently connected FE node, i.e., the FE node the user is interacting with

## Optional Parameters
The `<fe_config_key>` and `<fe_config_value>` that need to be modified can be viewed through the [SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG) command

:::tip Explanation

- Starting from version 2.1.5, the `ALL` keyword is supported. When using the `ALL` keyword, the configuration parameters will be applied to all FEs (except for the `master_only` parameter).
- This syntax does not persistently modify the configuration. After an FE restarts, the modified configuration becomes invalid. To persist the changes, the configuration items need to be synchronously added in fe.conf.
  :::

## Example

1. Set `disable_balance` to `true`

    ```sql
    ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
    ```

2. Set `disable_balance` of all FE nodes to `true`
   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```
