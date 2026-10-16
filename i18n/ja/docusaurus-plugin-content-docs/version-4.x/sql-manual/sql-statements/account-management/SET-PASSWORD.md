---
{
    "title": "SET PASSWORD",
    "language": "ja",
    "description": "SET PASSWORD 文はユーザーのログインパスワードを変更します。"
}
---

## 説明

`SET PASSWORD` 文はユーザーのログインパスワードを変更します。

## 構文 

```sql
SET PASSWORD [FOR <user_identity>] =
    [PASSWORD(<plain_password>)]|[<hashed_password>]
```

## 必須パラメータ

**1. `<plain_password>`**

> 入力は平文のパスワードです。パスワード `123456` の場合は、文字列 `123456` をそのまま指定します。

**2. `<hashed_password>`**

> 入力は暗号化されたパスワードです。パスワード 123456 の場合、文字列 `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9` をそのまま指定します。これは関数 `PASSWORD('123456')` の戻り値です。

## 任意パラメータ

**1. `<user_identity>`**

> ここで指定する user_identity は、CREATE USER でユーザーを作成したときの user_identity と完全に一致する必要があります。一致しない場合はユーザーが存在しないというエラーになります。user_identity を省略すると、現在のユーザーは 'username'@'ip' となり、既存の user_identity と一致しない場合があります。現在のユーザーは SHOW GRANTS で確認できます。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 説明 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | ADMIN_PRIV 権限を持つユーザーまたはロールはすべてのユーザーのパスワードを変更できます。それ以外は現在のユーザーのパスワードだけを変更できます。  |

## 使用上の注意

- `FOR user_identity` を省略すると、現在のユーザーのパスワードを変更します。

## 例

- 現在のユーザーのパスワードを変更します

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- 指定したユーザーのパスワードを変更します

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```