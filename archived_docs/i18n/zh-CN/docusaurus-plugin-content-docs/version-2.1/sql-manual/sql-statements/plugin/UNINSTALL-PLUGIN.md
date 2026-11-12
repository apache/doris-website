---
{
    "title": "UNINSTALL PLUGIN",
    "language": "zh-CN",
    "description": "该语句用于卸载一个插件"
}
---

## 描述

该语句用于卸载一个插件

## 语法：

```sql
UNINSTALL PLUGIN <plugin_name>;
```

## 必选参数

** 1. `<plugin_name>`**
> 卸载插件的名称

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象   | 说明            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 整个集群 | 需要对整个集群具有管理权限 |

## 注意事项

只能卸载非 builtin 的插件。

## 示例

- 卸载一个插件：

    ```sql
    UNINSTALL PLUGIN auditdemo;
    ```
