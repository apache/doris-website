---
{
    "title": "ALTER USER",
    "language": "ja",
    "description": "ALTER USER 文は、パスワードやパスワードポリシーなど、ユーザーのアカウント属性を変更するために使用します。"
}
---

## 説明 {#description}

`ALTER USER` 文は、パスワードやパスワードポリシーなど、ユーザーのアカウント属性を変更するために使用します。

## 構文 {#syntax}

```sql
ALTER USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[<password_policy>]
[<comment>]

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}
    5. ACCOUNT_UNLOCK
```

## 必須パラメータ {#required-parameters}

**1. `<user_identity`>**

> user_identity はユーザーを一意に識別します。構文は 'user_name'@'host' です。
> `user_identity` は user_name と host の二つの部分で構成されます。user_name はユーザー名、host はクライアントの接続元ホストのアドレスを示します。host には % を使用したあいまい一致を指定できます。host を指定しない場合、デフォルトは '%' となり、そのユーザーはどのホストからでも Doris に接続できます。
> host にはドメインも指定できます。構文は 'user_name'@['domain'] です。角括弧で囲まれている場合、Doris はこれをドメインとして扱い、その IP アドレスの解決を試みます。

## オプションパラメータ {#optional-parameters}

**1. `<password>`**

> ユーザーのパスワードを指定します。

**2. `<password_policy>`**

> `password_policy` は、パスワード認証によるログインに関するポリシーを指定する句です。現在、次のポリシーがサポートされています。
>
> `PASSWORD_HISTORY { <n> | DEFAULT}`
>
>    パスワードを再設定する際に、過去のパスワードの再利用を許可するかどうかを指定します。たとえば、`PASSWORD_HISTORY 10` は、過去10回に設定したパスワードを新しいパスワードとして使用できないことを意味します。`PASSWORD_HISTORY DEFAULT` に設定すると、グローバル変数 `password_history` の値が使用されます。`0` はこの機能を有効にしないことを意味します。デフォルトは0です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    ユーザーのパスワードの有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` は、パスワードが10日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` は、パスワードに有効期限がないことを意味します。`PASSWORD_EXPIRE DEFAULT` に設定すると、グローバル変数 `default_password_lifetime` の値が使用されます。デフォルトは NEVER（または0）で、期限切れにならないことを意味します。
>
> `FAILED_LOGIN_ATTEMPTS <n>`
>
> ユーザーが誤ったパスワードで n 回ログインを試みると、アカウントがロックされます。たとえば、`FAILED_LOGIN_ATTEMPTS 3` は、ログインに3回失敗するとアカウントがロックされることを意味します。
>
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされたときのロック期間を設定します。たとえば、`PASSWORD_LOCK_TIME 1 DAY` は、アカウントが一日間ロックされることを意味します。
>
> `ACCOUNT_UNLOCK`
>
> `ACCOUNT_UNLOCK` は、ロックされたユーザーのロック解除に使用します。

**3. `<comment>`**

> ユーザーのコメントを指定します。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER または ROLE    | この操作は、ADMIN_PRIV 権限を持つユーザーまたはロールのみ実行できます。  |

## 使用上の注意 {#usage-notes}

4.1.5 以降、特別な root ID は `'root'@'%'` のみです。`'root'@'localhost'` などの ID は通常のユーザーのままであり、ユーザー名が root であるという理由だけで、実際の root アカウントを変更する権限は得られません。実際の root アカウントに対する保護は、root という名前のほかのユーザーには適用されません。

1. バージョン 2.0 以降、このコマンドではユーザーロールの変更をサポートしていません。関連する操作には [GRANT](./GRANT-TO.md) と [REVOKE](./REVOKE-FROM.md) を使用してください。

2. ALTER USER コマンドでは、次のアカウント属性のうち、一度に変更できるのは一つだけです。
- パスワードの変更
- `PASSWORD_HISTORY` の変更
- `PASSWORD_EXPIRE` の変更
- `FAILED_LOGIN_ATTEMPTS` と `PASSWORD_LOCK_TIME` の変更
- ユーザーのロック解除

## 例 {#example}

準備としてユーザー `jack` を作成し、以下の例で操作する対象とします。

```sql
CREATE USER jack@'%' IDENTIFIED BY "12345";
```

- ユーザーのパスワードを変更する

```sql
ALTER USER jack@'%' IDENTIFIED BY "12345";
```

- ユーザーのパスワードポリシーを変更する

```sql
ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- ユーザーのロックを解除する

```sql
ALTER USER jack@'%' ACCOUNT_UNLOCK
```

- ユーザーのコメントを変更する

```sql
ALTER USER jack@'%' COMMENT "this is my first user"
```
