---
{
    "title": "SHOW PLUGINS",
    "language": "en"
}
---

## Description

This statement is used to display installed plug-ins

## Syntax

```sql
SHOW PLUGINS
```

## Return Value

| Column | Description |
| ------ | ----------- |
| Description | Corresponding plug-in description |
| Version | Plug-in corresponding version number |
| JavaVersion | Corresponding Java version number |
| ClassName | Program class name |
| SoName | Program shared object name |
| Sources | Plugin Source |
| Status | Installation Status |
| Properties | Plugin Properties  |

## Permission Control

The user executing this SQL command must have at least the following permissions:

| Permissions         | Object   | Notes            |
|:-----------|:-----|:--------------|
| ADMIN_PRIV | The entire cluster | Requires administrative privileges for the entire cluster |

## Example

- Show installed plugins:

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
