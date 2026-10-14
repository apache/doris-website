---
{
    "title": "SHOW PRIVILEGES",
    "language": "ja",
    "description": "SHOW PRIVILEGES 文は、データベースシステムで現在使用できる権限の一覧を表示します。"
}
---

## 説明

`SHOW PRIVILEGES` 文は、データベースシステムで現在使用できる権限の一覧を表示します。システムがサポートする権限の種類と詳細を確認できます。

## 構文

```sql
SHOW PRIVILEGES
```

## 戻り値

  | 列 | 説明 |
  | -- | -- |
  | 権限 | 権限名 |
  | Context | 適用範囲 |
  | Comment | 説明 |

## 必要な権限

この SQL コマンドの実行に特別な権限は必要ありません。

## 例

すべての権限を表示します

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
