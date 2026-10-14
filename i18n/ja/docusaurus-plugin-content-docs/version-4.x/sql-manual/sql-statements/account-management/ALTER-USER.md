---
{
    "title": "ALTER USER",
    "language": "ja",
    "description": "ALTER USER 文は、パスワードやパスワードポリシーなど、ユーザーのアカウント属性を変更します。"
}
---

## 説明

`ALTER USER` 文は、パスワードやパスワードポリシーなど、ユーザーのアカウント属性を変更します。

## 構文

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

## 必須パラメータ

**1. `<user_identity`>**

> user_identity はユーザーを一意に識別します。構文は 'user_name'@'host' です。
> `user_identity` は user_name と host の二つの部分で構成されます。user_name はユーザー名、host はクライアントの接続元ホストアドレスを示します。host には % を使ったあいまい一致を指定できます。host を省略するとデフォルトは '%' となり、どのホストからも Doris に接続できます。
> host 部分にはドメインも指定できます。構文は 'user_name'@['domain'] です。角括弧で囲まれていても、Doris はドメインとみなして IP アドレスの解決を試みます。 

## 任意パラメータ

**1. `<password>`**

> ユーザーのパスワードを指定します。 

**2. `<password_policy>`**

> `password_policy` は、パスワード認証によるログインに関するポリシーを指定する句です。現在は次のポリシーをサポートします。
>
> `PASSWORD_HISTORY { <n> | DEFAULT}`
>
>    現在のユーザーがパスワードを再設定する際、過去のパスワードを再利用できるかどうかを指定します。たとえば `PASSWORD_HISTORY 10` は、過去 10 回に設定したパスワードを新しいパスワードに使用できないことを意味します。`PASSWORD_HISTORY DEFAULT` を指定すると、グローバル変数 `password_history` の値を使用します。`0` はこの機能を無効にします。デフォルトは 0 です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    現在のユーザーのパスワードの有効期限を設定します。たとえば `PASSWORD_EXPIRE INTERVAL 10 DAY` は 10 日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` では期限切れになりません。`PASSWORD_EXPIRE DEFAULT` を指定すると、グローバル変数 `default_password_lifetime` の値を使用します。デフォルトは NEVER（または 0）で、期限切れになりません。
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> 現在のユーザーがログイン時にパスワードを n 回間違えると、アカウントがロックされます。たとえば `FAILED_LOGIN_ATTEMPTS 3` では、3 回間違えるとロックされます。
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされたときのロック期間を設定します。たとえば `PASSWORD_LOCK_TIME 1 DAY` では、アカウントが一日間ロックされます。
>
> `ACCOUNT_UNLOCK`
>    
> `ACCOUNT_UNLOCK` はロックされたユーザーのロックを解除します。

**3. `<comment>`**

>ユーザーのコメントを指定します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限     | 対象    | 説明 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作を実行できるのは ADMIN_PRIV 権限を持つユーザーまたはロールのみです  |

## 使用上の注意

1. バージョン 2.0 以降、このコマンドでユーザーのロールは変更できません。関連する操作には [GRANT](./GRANT-TO.md) と [REVOKE](./REVOKE-FROM.md) を使用してください。

2. ALTER USER コマンドでは、一度に変更できるアカウント属性は次のいずれか一つです。
- パスワードの変更
- `PASSWORD_HISTORY` の変更
- `PASSWORD_EXPIRE` の変更
- `FAILED_LOGIN_ATTEMPTS` と `PASSWORD_LOCK_TIME` の変更
- ユーザーのロック解除

## 例

準備としてユーザー `jack` を作成し、以降の例の操作対象にします。

```sql
CREATE USER jack@'%' IDENTIFIED BY "12345";
```

- ユーザーのパスワードを変更します

```sql
ALTER USER jack@'%' IDENTIFIED BY "12345";
```

- ユーザーのパスワードポリシーを変更します
	
```sql
ALTER USER jack@'%' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- ユーザーのロックを解除します

```sql
ALTER USER jack@'%' ACCOUNT_UNLOCK
```

- ユーザーのコメントを変更します

```sql
ALTER USER jack@'%' COMMENT "this is my first user"
```
