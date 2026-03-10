---
{
  "title": "LDAP_ADMIN_PASSWORDを設定する",
  "language": "ja",
  "description": "SET LDAPADMINPASSWORDコマンドは、LDAP管理者パスワードを設定するために使用されます。LDAP認証を使用する場合、"
}
---
## 説明

`SET LDAP_ADMIN_PASSWORD`コマンドは、LDAP管理者パスワードを設定するために使用されます。LDAP認証を使用する場合、dorisはログインユーザー情報を取得するためにLDAPサービスに問い合わせを行う際に、管理者アカウントとパスワードを使用する必要があります。

## 構文

```sql
 SET LDAP_ADMIN_PASSWORD = PASSWORD('<plain_password>')
```
## 必須パラメータ

**1. `<plain_password>`**

LDAP管理者パスワード

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 注記                  |
| :--------------------- | :-------------- | :--------------------- |
| ADMIN_PRIV        | USER or ROLE    | この操作は`ADMIN_PRIV`権限を持つユーザーまたはロールのみが実行できます |

## 例

- LDAP管理者パスワードを設定する

  ```sql
  SET LDAP_ADMIN_PASSWORD = PASSWORD('123456')
  ```
