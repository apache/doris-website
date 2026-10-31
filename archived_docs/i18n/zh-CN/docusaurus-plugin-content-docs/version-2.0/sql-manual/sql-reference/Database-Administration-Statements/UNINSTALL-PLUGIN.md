---
{
    "title": "UNINSTALL-PLUGIN",
    "language": "zh-CN"
}
---

## UNINSTALL-PLUGIN

### Name

UNINSTALL PLUGIN

## 描述

该语句用于卸载一个插件。

语法：

```sql
UNINSTALL PLUGIN plugin_name;
```

 plugin_name 可以通过 `SHOW PLUGINS;` 命令查看。

只能卸载非 builtin 的插件。

## 举例

1. 卸载一个插件：

    ```sql
    UNINSTALL PLUGIN auditdemo;
    ```

### Keywords

    UNINSTALL, PLUGIN

### Best Practice

