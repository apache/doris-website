---
{
    "title": "SHOW ROW POLICY",
    "language": "ja",
    "description": "行セキュリティポリシーを表示します。行セキュリティポリシーの詳細については、「セキュリティポリシー」の章を参照してください。"
}
---

## 説明

行セキュリティポリシーを表示します。行セキュリティポリシーの詳細については、「セキュリティポリシー」の章を参照してください。

## 構文

```sql
SHOW ROW POLICY [ FOR { <user_name> | ROLE <role_name> } ];
```
## オプションパラメータ

**<user_name>**

> ユーザー名

**<role_name>**

> ロール名

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限  | 対象 | 備考 |
| :--------- | :----- | :---- |
| ADMIN_PRIV | グローバル |       |

## 例

1. すべてのセキュリティポリシーを表示する


  ```sql
  SHOW ROW POLICY;
  ```

1. ユーザー名を指定して照会する

  ```sql
  SHOW ROW POLICY FOR user1;
  ```

1. ロール名を指定して照会する

  ```sql
  SHOW ROW POLICY for role role1;
  ```
