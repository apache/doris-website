---
{
  "title": "ALTER USER",
  "description": "ALTER USER文は、パスワードやパスワードポリシーなどを含むユーザーのアカウント属性を変更するために使用されます。",
  "language": "ja"
}
---
## 説明

`ALTER USER`文は、パスワードやパスワードポリシーなどを含む、ユーザーアカウントの属性を変更するために使用されます。

## 構文

```sql
ALTER USER [IF EXISTS] <user_identity> [IDENTIFIED BY <password>]
[<password_policy>]
[<comment>]

password_policy:
    1. PASSWORD_HISTORY { <n> | DEFAULT }
    2. PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}
    3. FAILED_LOGIN_ATTEMPTS <n>
    4. PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}
    5. ACCOUNT_UNLOCK
```
## 必須パラメータ

**1. `<user_identity`>**

> user_identityはユーザーを一意に識別します。構文は：'user_name'@'host'です。
> `user_identity`は2つの部分から構成され、user_nameとhostで、usernameはユーザー名です。Hostはクライアントが接続するホストアドレスを識別します。host部分では曖昧マッチングに%を使用できます。hostが指定されていない場合、デフォルトは'%'になり、これはユーザーが任意のホストからDorisに接続できることを意味します。
> host部分はドメインとして指定することも可能で、構文は：'user_name'@['domain']です。角括弧で囲まれている場合でも、Dorisはこれをドメインと見なしてそのipアドレスの解決を試行します。

## オプションパラメータ

**1. `<password>`**

> ユーザーパスワードを指定します。

**2. `<password_policy>`**

> `password_policy`はパスワード認証ログインに関連するポリシーを指定するために使用される句です。現在、以下のポリシーがサポートされています：
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
>    現在のユーザーがパスワードをリセットする際に履歴パスワードの使用を許可するかどうか。例えば、`PASSWORD_HISTORY 10`は過去10回に設定されたパスワードを新しいパスワードとして使用することを禁止することを意味します。`PASSWORD_HISTORY DEFAULT`に設定された場合、グローバル変数`password_history`の値が使用されます。`0`はこの機能を有効にしないことを意味します。デフォルトは0です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    現在のユーザーのパスワードの有効期限を設定します。例えば`PASSWORD_EXPIRE INTERVAL 10 DAY`は10日でパスワードが期限切れになることを意味します。`PASSWORD_EXPIRE NEVER`はパスワードが期限切れにならないことを意味します。`PASSWORD_EXPIRE DEFAULT`に設定された場合、グローバル変数`default_password_lifetime`の値が使用されます。デフォルトはNEVER（または0）で、期限切れにならないことを意味します。
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> 現在のユーザーがログインする際、ユーザーが間違ったパスワードでn回ログインした場合、アカウントがロックされます。例えば、`FAILED_LOGIN_ATTEMPTS 3`は3回間違ってログインした場合、アカウントがロックされることを意味します。
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされた場合のロック時間を設定します。例えば、`PASSWORD_LOCK_TIME 1 DAY`はアカウントが1日間ロックされることを意味します。
>
> `ACCOUNT_UNLOCK`
>    
> `ACCOUNT_UNLOCK`はロックされたユーザーのロックを解除するために使用されます。

**3. `<comment>`**

>ユーザーコメントを指定します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作はADMIN_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 使用上の注意

1. このコマンドはバージョン2.0からユーザーロールの変更のサポートを終了しました。関連操作には[GRANT](./GRANT-TO.md)と[REVOKE](./REVOKE-FROM.md)を使用してください

2. ALTER USERコマンドでは、以下のアカウント属性のうち一度に変更できるのは1つのみです：
- パスワードの変更
- `PASSWORD_HISTORY`の変更
- `PASSWORD_EXPIRE`の変更
- `FAILED_LOGIN_ATTEMPTS`と`PASSWORD_LOCK_TIME`の変更
- ユーザーのロック解除

## 例

- ユーザーのパスワードを変更

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
