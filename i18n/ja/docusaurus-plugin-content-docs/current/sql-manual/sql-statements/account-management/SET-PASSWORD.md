---
{
    "title": "SET PASSWORD",
    "language": "ja",
    "description": "SET PASSWORD 文は、ユーザーのログインパスワードを変更するために使用します。"
}
---

## 説明 {#description}

`SET PASSWORD` 文は、ユーザーのログインパスワードを変更するために使用します。

## 構文 {#syntax}

```sql
SET PASSWORD [FOR <user_identity>] =
    [PASSWORD(<plain_password>)]|[<hashed_password>]
```

## 必須パラメータ {#required-parameters}

**1. `<plain_password>`**

> 平文のパスワードを指定します。パスワードが `123456` の場合は、文字列 `123456` をそのまま使用します。

**2. `<hashed_password>`**

> 暗号化されたパスワードを指定します。パスワードが 123456 の場合は、文字列 `*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9` をそのまま使用します。これは関数 `PASSWORD('123456')` の戻り値です。

## オプションパラメータ {#optional-parameters}

**1. `<user_identity>`**

> ここで指定する user_identity は、CREATE USER でユーザーを作成したときに指定した user_identity と完全に一致する必要があります。一致しない場合は、ユーザーが存在しないというエラーが報告されます。user_identity を指定しない場合、現在のユーザーは 'username'@'ip' として扱われますが、どの user_identity とも一致しない可能性があります。現在のユーザーは SHOW GRANTS で確認できます。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER または ROLE    | ユーザーまたはロールに ADMIN_PRIV 権限がある場合は、すべてのユーザーのパスワードを変更できます。権限がない場合は、現在のユーザーのパスワードのみ変更できます。 |

## 使用上の注意 {#usage-notes}

4.1.5 以降、特別な root アイデンティティは `'root'@'%'` のみです。`'root'@'localhost'` のようなアイデンティティは通常のユーザーのままであり、ユーザー名が root であるというだけでは、実際の root アカウントを変更する権限は得られません。実際の root アカウントに対する保護は、root という名前のほかのユーザーには適用されません。

- `FOR user_identity` フィールドを指定しない場合は、現在のユーザーのパスワードを変更します。

## 例 {#example}

- 現在のユーザーのパスワードを変更する

```sql
SET PASSWORD = PASSWORD('123456')
SET PASSWORD = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```

- 指定したユーザーのパスワードを変更する

```sql
SET PASSWORD FOR 'jack'@'192.%' = PASSWORD('123456')
SET PASSWORD FOR 'jack'@['domain'] = '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9'
```
