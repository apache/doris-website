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
## オプションパラメータ

**<user_name>**

> ユーザー名

**<role_name>**

> ロール名

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| Privilege  | Object | 注釈 |
| :--------- | :----- | :---- |
| ADMIN_PRIV | Global |       |

## 例

1. すべてのセキュリティポリシーを表示

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
