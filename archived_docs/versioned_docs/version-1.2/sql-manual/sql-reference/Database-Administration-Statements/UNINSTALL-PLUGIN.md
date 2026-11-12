---
{
    "title": "UNINSTALL-PLUGIN",
    "language": "en"
}
---

## UNINSTALL-PLUGIN

### Name

UNINSTALL PLUGIN

### Description

This statement is used to uninstall a plugin.

grammar:

```sql
UNINSTALL PLUGIN plugin_name;
```

  plugin_name can be viewed with the `SHOW PLUGINS;` command.

Only non-builtin plugins can be uninstalled.

### Example

1. Uninstall a plugin:

    ```sql
    UNINSTALL PLUGIN auditdemo;
    ```

### Keywords

    UNINSTALL, PLUGIN

### Best Practice

