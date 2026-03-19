---
{
  "title": "ユーザーの作成",
  "description": "CREATE USER文は、Dorisユーザーを作成するために使用されます。",
  "language": "ja"
}
---
## 説明

`CREATE USER`文は、Dorisユーザーを作成するために使用されます。

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
    4. PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}
```
## 必須パラメータ

**1. `<user_identity>`**

> user_identityはユーザーを一意に識別します。構文は'user_name'@'host'です。
> `user_identity`はuser_nameとhostの2つの部分で構成され、usernameはユーザー名です。Hostはクライアントが接続するホストアドレスを識別します。host部分では曖昧マッチングに%を使用できます。hostが指定されない場合、デフォルトで'%'となり、ユーザーは任意のホストからDorisに接続できることを意味します。
> host部分はドメインとしても指定でき、構文は'user_name'@['domain']です。角括弧で囲まれていても、Dorisはこれをドメインと見なし、そのipアドレスの解決を試みます。

## オプションパラメータ

**1. `<password>`**

> ユーザーパスワードを指定します。

**2. `<role_name>`**

> ユーザーロールを指定します。
> ロール（ROLE）が指定された場合、新しく作成されたユーザーには自動的にそのロールの権限が付与されます。指定されない場合、ユーザーはデフォルトで権限を持ちません。指定されたROLEは既に存在している必要があります。

**3. `<password_policy>`**

> `password_policy`はパスワード認証ログインに関するポリシーを指定するための句です。現在、以下のポリシーがサポートされています：
>
> `PASSWORD_HISTORY { <n> | DEFAULT }`
>
> 現在のユーザーがパスワードをリセットする際に履歴パスワードの使用を許可するかどうかです。例えば、`PASSWORD_HISTORY 10`は過去10回に設定されたパスワードを新しいパスワードとして使用することを禁止することを意味します。`PASSWORD_HISTORY DEFAULT`に設定された場合、グローバル変数`password_history`の値が使用されます。`0`はこの機能を有効にしないことを意味します。デフォルトは0です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
> 現在のユーザーのパスワードの有効期限を設定します。例えば`PASSWORD_EXPIRE INTERVAL 10 DAY`はパスワードが10日で期限切れになることを意味します。`PASSWORD_EXPIRE NEVER`はパスワードが期限切れにならないことを意味します。`PASSWORD_EXPIRE DEFAULT`に設定された場合、グローバル変数`default_password_lifetime`の値が使用されます。デフォルトはNEVER（または0）で、期限切れにならないことを意味します。
>
> `FAILED_LOGIN_ATTEMPTS <n>` 
>
> 現在のユーザーがログインする際、ユーザーが間違ったパスワードでn回ログインするとアカウントがロックされます。例えば、`FAILED_LOGIN_ATTEMPTS 3`は3回間違ってログインするとアカウントがロックされることを意味します。
>   
> `PASSWORD_LOCK_TIME { UNBOUNDED ｜ <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされたときのロック時間を設定します。例えば、`PASSWORD_LOCK_TIME 1 DAY`はアカウントが1日間ロックされることを意味します。

**4. `<comment`>**

> ユーザーコメントを指定します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限     | オブジェクト    | 備考 |
|:--------------|:----------|:------|
| ADMIN_PRIV    | USER or ROLE    | この操作はADMIN_PRIV権限を持つユーザーまたはロールのみが実行できます  |

## 例

- パスワードなしのユーザーを作成する（hostが指定されない場合、jack@'%'と同等です）

```sql
CREATE USER 'jack';
```
- '172.10.1.10'からのログインを許可するために、パスワード付きのユーザーを作成する

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY '123456';
```
- プレーンテキストの受け渡しを避けるため、use case 2は以下の方法でも作成できます

```sql
CREATE USER jack@'172.10.1.10' IDENTIFIED BY PASSWORD '*6BB4837EB74329105EE4568DDA7DC67ED2CA2AD9';
The encrypted content can be obtained through PASSWORD(), for example:
SELECT PASSWORD('123456');
```
- '192.168' サブネットからのログインを許可するユーザーを作成し、そのロールを example_role として指定する

```sql
CREATE USER 'jack'@'192.168.%' DEFAULT ROLE 'example_role';
```
- ドメイン'example_domain'からのログインが許可されたユーザーを作成する

```sql
CREATE USER 'jack'@['example_domain'] IDENTIFIED BY '12345';
```
- ユーザーを作成してroleを割り当てる

```sql
CREATE USER 'jack'@'%' IDENTIFIED BY '12345' DEFAULT ROLE 'my_role';
```
- ユーザーを作成し、パスワードを10日後に期限切れになるよう設定し、3回ログインに失敗した場合にアカウントを1日間ロックするよう設定する。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_EXPIRE INTERVAL 10 DAY FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY;
```
- ユーザーを作成し、リセット不可能なパスワードを過去8回使用したパスワードに制限する。

```sql
CREATE USER 'jack' IDENTIFIED BY '12345' PASSWORD_HISTORY 8;
```
- コメント付きでユーザーを作成する

```sql
CREATE USER 'jack' COMMENT "this is my first user";
```
