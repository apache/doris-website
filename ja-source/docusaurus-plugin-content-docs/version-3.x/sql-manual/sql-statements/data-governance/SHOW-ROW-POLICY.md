---
{
  "title": "SHOW ROW POLICY",
  "description": "行セキュリティポリシーを表示します。行セキュリティポリシーの詳細については、「Security Policies」の章を参照してください。",
  "language": "ja"
}
---
## 説明

行セキュリティポリシーを表示します。行セキュリティポリシーの詳細については、「Security Policies」の章を参照してください。

## 構文

```sql
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```
## Optional パラメータ

**<user_name>**

> ユーザー名

**<role_name>**

> ロール名

## Access Control Requirements

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object | 注釈 |
| :--------- | :----- | :---- |
| ADMIN_PRIV | Global |       |

## Examples

1. すべてのセキュリティポリシーを表示する

  ```sql
  SHOW ROW POLICY;
  ```
1. ユーザー名を指定してクエリを実行する

  ```sql
  SHOW ROW POLICY FOR user1;
  ```
1. ロール名を指定してクエリを実行する

  ```sql
  SHOW ROW POLICY for role role1;
  ```
