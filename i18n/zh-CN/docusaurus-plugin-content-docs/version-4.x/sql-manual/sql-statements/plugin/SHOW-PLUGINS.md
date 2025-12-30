---
{
    "title": "SHOW PLUGINS",
    "language": "zh-CN",
    "description": "该语句用于展示已安装的插件"
}
---

## 描述

该语句用于展示已安装的插件

## 语法

```sql
SHOW PLUGINS
```

## 返回值

| 列 | 描述 |
| ------ |----|
| Description | 对应插件描述 |
| Version | 插件对应版本号 |
| JavaVersion | 对应 Java 版本号 |
| ClassName | 程序类名 |
| SoName | 程序共享对象名称 |
| Sources | 插件来源 |
| Status | 安装状态 |
| Properties | 插件属性 |

## 权限控制

执行此 SQL 命令的用户必须至少具有以下权限：

| 权限         | 对象   | 说明            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | 整个集群 | 需要对整个集群具有管理权限 |

## 示例

- 展示已安装的插件：

    ```SQL
    SHOW PLUGINS;
    ```

    ```text
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | Name                          | Type    | Description                                               | Version | JavaVersion | ClassName                                                  | SoName | Sources | Status    | Properties |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
   | __builtin_AuditLoader         | AUDIT   | builtin audit loader, to load audit log to internal table | 2.1.0   | 1.8.31      | org.apache.doris.plugin.audit.AuditLoader                  | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_AuditLogBuilder     | AUDIT   | builtin audit logger                                      | 0.12.0  | 1.8.31      | org.apache.doris.plugin.audit.AuditLogBuilder              | NULL   | Builtin | INSTALLED | {}         |
   | __builtin_SqlDialectConverter | DIALECT | builtin sql dialect converter                             | 2.1.0   | 1.8.31      | org.apache.doris.plugin.dialect.HttpDialectConverterPlugin | NULL   | Builtin | INSTALLED | {}         |
   +-------------------------------+---------+-----------------------------------------------------------+---------+-------------+------------------------------------------------------------+--------+---------+-----------+------------+
    ```
