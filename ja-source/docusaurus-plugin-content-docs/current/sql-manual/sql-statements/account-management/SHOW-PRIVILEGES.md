---
{
  "title": "SHOW PRIVILEGES",
  "language": "ja",
  "description": "SHOW PRIVILEGES文は、データベースシステムで現在利用可能な権限のリストを表示するために使用されます。"
}
---
## 説明

`SHOW PRIVILEGES`文は、データベースシステムで現在利用可能な権限のリストを表示するために使用されます。これにより、ユーザーはシステムでサポートされている権限の種類と各権限の詳細を理解することができます。

## 構文

```sql
SHOW PRIVILEGES
```
## 戻り値

  | Column | Description |
  | -- | -- |
  | Privilege | 権限名 |
  | Context | 適用範囲 |
  | Comment | 説明 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、特定の権限を持つ必要はありません。

## 例

すべての権限を表示

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
