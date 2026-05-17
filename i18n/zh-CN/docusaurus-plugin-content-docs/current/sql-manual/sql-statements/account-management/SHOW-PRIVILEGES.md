---
{
    "title": "SHOW PRIVILEGES",
    "language": "zh-CN",
    "description": "SHOW PRIVILEGES 语句用于显示数据库系统中当前可用的权限列表。它帮助用户了解系统支持的权限类型以及每种权限的详细信息。"
}
---

## 描述

`SHOW PRIVILEGES` 语句用于显示数据库系统中当前可用的权限列表。它帮助用户了解系统支持的权限类型以及每种权限的详细信息。

## 语法

```sql
SHOW PRIVILEGES
```

## 返回值

  | 列名 | 说明 |
  | -- | -- |
  | Privilege | 权限名 |
  | Context | 可作用范围 |
  | Comment | 说明 |

## 权限控制

执行此 SQL 命令的用户不需要具有特定的权限。

## 示例

查看所有权限项

```sql
SHOW PRIVILEGES
```
  
```text
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Privilege   | Context                                               | Comment                                       |
+-------------+-------------------------------------------------------+-----------------------------------------------+
| Node_priv   | GLOBAL                                                | Privilege for cluster node operations         |
| Admin_priv  | GLOBAL                                                | Privilege for admin user                      |
| Grant_priv  | GLOBAL,CATALOG,DATABASE,TABLE,RESOURCE,WORKLOAD GROUP | Privilege for granting privilege              |
| Select_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for select data in tables           |
| Load_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for loading data into tables        |
| Alter_priv  | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for alter database or table         |
| Create_priv | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for creating database or table      |
| Drop_priv   | GLOBAL,CATALOG,DATABASE,TABLE                         | Privilege for dropping database or table      |
| Usage_priv  | RESOURCE,WORKLOAD GROUP                               | Privilege for using resource or workloadGroup |
+-------------+-------------------------------------------------------+-----------------------------------------------+
```
