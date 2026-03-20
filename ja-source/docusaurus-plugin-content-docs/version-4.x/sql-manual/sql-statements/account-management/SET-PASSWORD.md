---
{
  "title": "SET PASSWORD",
  "description": "SET PASSWORD文は、ユーザーのログインパスワードを変更するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

`SET PASSWORD`文は、ユーザーのログインパスワードを変更するために使用されます。

## Syntax

```sql
SET PASSWORD [FOR <user_identity>] =
    [PASSWORD(<plain_password>)]|[<hashed_password>]
```
## 必須パラメータ

**1. `<plain_password>`**

> 入力は平文パスワードです。パスワード`123456`を例に取ると、文字列`123456`を直接使用します。

**2. `<hashed_password>`**

> 入力は暗号化されたパスワードです。パスワード123456を例に取ると、文字列`*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9`を直接使用します。これは関数`PASSWORD('123456')`の戻り値です。

## オプションパラメータ

**1. `<user_identity>`**

> ここでのuser_identityは、CREATE USERでユーザーを作成する際に指定したuser_identityと正確に一致する必要があります。そうでなければ、ユーザーが存在しないというエラーが報告されます。user_identityが指定されていない場合、現在のユーザーは'username'@'ip'となり、どのuser_identityとも一致しない可能性があります。現在のユーザーはSHOW GRANTSで確認できます。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER または ROLE    | ユーザーまたはロールがADMIN_PRIV権限を持つ場合、すべてのユーザーのパスワードを変更できます。そうでなければ、現在のユーザーのパスワードのみ変更可能です。  |

## 使用上の注意

- `FOR user_identity`フィールドが存在しない場合、現在のユーザーのパスワードを変更します。

## 例

- 現在のユーザーのパスワードを変更する

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```
- 指定されたユーザーパスワードを変更する

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```
