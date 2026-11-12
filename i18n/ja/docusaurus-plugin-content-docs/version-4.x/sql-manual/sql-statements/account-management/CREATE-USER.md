---
{
    "title": "CREATE USER",
    "language": "ja",
    "description": "CREATE USER ステートメントは Doris ユーザーを作成するために使用します。"
}
---

## 説明 {#description}

`CREATE USER` ステートメントは Doris ユーザーを作成するために使用します。

## 構文 {#syntax}

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
## 必須パラメータ {#required-parameters}

**1. `<user_identity>`**

> user_identity はユーザーを一意に識別します。構文は 'user_name'@'host' です。
> `user_identity` は user_name と host の二つの部分で構成され、username はユーザー名です。Host はクライアントが接続するホストアドレスを示します。host 部分では % を使用してあいまい一致を行えます。host を指定しない場合は '%' がデフォルトとなり、そのユーザーは任意のホストから Doris に接続できます。
> host 部分には domain も指定できます。構文は 'user_name'@['domain'] です。角括弧で囲まれている場合でも、Doris はこれを domain とみなし、その ip アドレスの解決を試みます。


## オプションパラメータ {#optional-parameters}

**1. `<password>`**

> ユーザーパスワードを指定します。

**2. `<role_name>`**

> ユーザーロールを指定します。
> ロール（ROLE）を指定すると、新しく作成されたユーザーにそのロールの権限が自動的に付与されます。指定しない場合、ユーザーにはデフォルトで権限がありません。指定した ROLE はすでに存在している必要があります。

**3. `<password_policy>`**

> `password_policy` は、パスワード認証ログインに関連するポリシーを指定するための句です。現在、次のポリシーがサポートされています：
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> 現在のユーザーがパスワードをリセットするときに、過去のパスワードを使用できるかどうかを指定します。たとえば、`PASSWORD_HISTORY 10` は、過去に 10 回設定したパスワードを新しいパスワードとして使用できないことを意味します。`PASSWORD_HISTORY DEFAULT` に設定すると、グローバル変数 `password_history` の値が使用されます。`0` はこの機能を有効にしないことを意味します。デフォルトは 0 です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> 現在のユーザーのパスワードの有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` はパスワードが 10 日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` はパスワードが期限切れにならないことを意味します。`PASSWORD_EXPIRE DEFAULT` に設定すると、グローバル変数 `default_password_lifetime` の値が使用されます。デフォルトは NEVER（または 0）で、期限切れになりません。
>
> `FAILED_LOGIN_ATTEMPTS <n>`
>
> 現在のユーザーがログインするとき、誤ったパスワードで n 回ログインすると、アカウントがロックされます。たとえば、`FAILED_LOGIN_ATTEMPTS 3` は、3 回誤ってログインするとアカウントがロックされることを意味します。
>
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされると、ロック時間が設定されます。たとえば、`PASSWORD_LOCK_TIME 1 DAY` はアカウントが一日間ロックされることを意味します。

**4. `<comment`>**

> ユーザーコメントを指定します。

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です：

| 権限         | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER または ROLE    | この操作は ADMIN_PRIV 権限を持つユーザーまたはロールのみ実行できます  |

## 例 {#example}

- パスワードなしのユーザーを作成します（host を指定しない場合、jack@'%' と同じです）

```sql
CREATE USER 'jack';
```

- パスワードを設定し、'172.10.1.10' からのログインを許可するユーザーを作成します

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```

- 平文の受け渡しを避けるため、用例 2 は次の方法でも作成できます

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
The encrypted content can be obtained through PASSWORD(), for example:
SELECT PASSWORD('123456');
```

- '192.168' サブネットからのログインを許可し、ロールを example_role に指定するユーザーを作成します

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```

- ドメイン 'example_domain' からのログインを許可するユーザーを作成します

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```

- ユーザーを作成してロールを割り当てます

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```

- ユーザーを作成し、パスワードを 10 日後に期限切れに設定し、3 回ログインに失敗した場合にアカウントを一日間ロックするよう設定します。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```

- ユーザーを作成し、パスワードを直近 8 回使用したパスワードにリセットできないよう制限します。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```

- コメント付きのユーザーを作成します

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```
