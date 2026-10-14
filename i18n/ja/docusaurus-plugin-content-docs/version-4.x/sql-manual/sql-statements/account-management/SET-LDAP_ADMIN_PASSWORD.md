---
{
    "title": "SET LDAP_ADMIN_PASSWORD",
    "language": "ja",
    "description": "SET LDAP_ADMIN_PASSWORD コマンドは LDAP 管理者パスワードを設定します。LDAP 認証を使用する場合、"
}
---

## 説明

 `SET LDAP_ADMIN_PASSWORD` コマンドは LDAP 管理者パスワードを設定します。LDAP 認証を使用する場合、Doris は管理者アカウントとパスワードを使って LDAP サービスにログインユーザーの情報を照会します。

## 構文

```sql
 SET LDAP_ADMIN_PASSWORD = PASSWORD('<plain_password>')
```

## 必須パラメータ

**1. `<plain_password>`**

LDAP 管理者のパスワード

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明                  |
| :--------------------- | :-------------- | :--------------------- |
| ADMIN_PRIV        | USER or ROLE    | この操作を実行できるのは `ADMIN_PRIV` 権限を持つユーザーまたはロールのみです |

## 例

- LDAP 管理者パスワードを設定します
  ```sql
  SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
  ```
