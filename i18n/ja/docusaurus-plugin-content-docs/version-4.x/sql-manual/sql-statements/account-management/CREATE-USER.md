---
{
    "title": "CREATE USER",
    "language": "ja",
    "description": "CREATE USER 文は Doris ユーザーを作成するために使用します。"
}
---

## 説明

`CREATE USER` 文は Doris ユーザーを作成するために使用します。

## 構文

```sql
CREATE USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[DEFAULT ROLE <role_name>]
[<password_policy>]
[<comment>]  

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}
```
## 必須パラメータ

**1. `<user_identity>`**

> user_identity はユーザーを一意に識別します。構文は 'user_name'@'host' です。
> `user_identity` は user_name と host の二つの部分で構成されます。user_name はユーザー名、host はクライアントの接続元ホストアドレスを表します。host には % を使用してあいまい一致を指定できます。host を指定しない場合は '%' がデフォルトとなり、ユーザーは任意のホストから Doris に接続できます。
> host にはドメインも指定できます。構文は 'user_name'@['domain'] です。角括弧で囲まれている場合、Doris はこれをドメインとして扱い、IP アドレスの解決を試みます。


## 任意パラメータ

**1. `<password>`**

> ユーザーのパスワードを指定します。

**2. `<role_name>`**

> ユーザーのロールを指定します。
> ロール（ROLE）を指定すると、新しく作成されたユーザーにはそのロールの権限が自動的に付与されます。指定しない場合、ユーザーにはデフォルトで権限がありません。指定するロールは、あらかじめ存在している必要があります。

**3. `<password_policy>`**

> `password_policy` は、パスワード認証によるログインに関するポリシーを指定する句です。現在、以下のポリシーをサポートしています。
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> パスワードの再設定時に、過去に使用したパスワードの再利用を許可するかどうかを指定します。たとえば `PASSWORD_HISTORY 10` は、直近 10 回に設定したパスワードを新しいパスワードとして使用できないことを意味します。`PASSWORD_HISTORY DEFAULT` を指定すると、グローバル変数 `password_history` の値が使用されます。`0` はこの機能を有効にしないことを意味します。デフォルトは 0 です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> ユーザーのパスワードの有効期限を設定します。たとえば `PASSWORD_EXPIRE INTERVAL 10 DAY` は、パスワードが 10 日後に失効することを意味します。`PASSWORD_EXPIRE NEVER` は、パスワードが失効しないことを意味します。`PASSWORD_EXPIRE DEFAULT` を指定すると、グローバル変数 `default_password_lifetime` の値が使用されます。デフォルトは NEVER（または 0）で、失効しません。
>
> `FAILED_LOGIN_ATTEMPTS <n>`
>
> ユーザーが誤ったパスワードで n 回ログインを試みると、アカウントがロックされます。たとえば `FAILED_LOGIN_ATTEMPTS 3` は、誤ったパスワードで 3 回ログインを試みるとアカウントがロックされることを意味します。
>
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされたときのロック期間を設定します。たとえば `PASSWORD_LOCK_TIME 1 DAY` は、アカウントが一日間ロックされることを意味します。

**4. `<comment`>**

> ユーザーのコメントを指定します。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER または ROLE    | この操作は、ADMIN_PRIV 権限を持つユーザーまたはロールのみ実行できます |

## 例

- パスワードのないユーザーを作成します（ホストを指定しない場合は jack@'%' と同等です）。

```sql
CREATE USER 'jack';
```

- '172.10.1.10' からログインできる、パスワード付きのユーザーを作成します。

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```

- 平文のパスワードを渡さないために、例 2 は次の方法でも作成できます。

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
The encrypted content can be obtained through PASSWORD(), for example:
SELECT PASSWORD('123456');
```

- '192.168' サブネットからログインできるユーザーを作成し、そのロールに example_role を指定します。

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```

- ドメイン 'example_domain' からログインできるユーザーを作成します。

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```

- ユーザーを作成してロールを割り当てます。

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```
   
- ユーザーを作成し、パスワードを 10 日後に失効させ、ログインに 3 回失敗した場合はアカウントを一日間ロックします。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- ユーザーを作成し、直近 8 回に使用したパスワードの再利用を制限します。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```

- コメント付きのユーザーを作成します。

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```
