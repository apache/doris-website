---
{
    "title": "SHOW PRIVILEGES",
    "language": "en"
}
---

## Description

`SHOW PRIVILEGES` statement is used to display the list of currently available privileges in the database system. It helps users understand the types of privileges supported by the system and the details of each privilege.

## Syntax

```sql
SHOW PRIVILEGES
```

## Return Value

  | Column | Description |
  | -- | -- |
  | Privilege | Privilege name |
  | Context | Applicable range |
  | Comment | Description |

## Access Control Requirements

The user executing this SQL command does not need to have specific privileges.

## Examples

View all privileges

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
