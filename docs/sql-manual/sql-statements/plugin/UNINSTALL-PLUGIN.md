---
{
    "title": "UNINSTALL PLUGIN",
    "language": "en"
}
---

## Description

This statement is used to uninstall a plugin.

## Syntax：

```sql
UNINSTALL PLUGIN <plugin_name>;
```

## Required parameters

** 1. `<plugin_name>`**
>  The name of the uninstalled plugin

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | The entire cluster | Requires administrative privileges for the entire cluster |

## Precautions

Only non-builtin plugins can be uninstalled

## Example

- To uninstall a plugin:

    ```sql
    UNINSTALL PLUGIN auditdemo;
    ```
