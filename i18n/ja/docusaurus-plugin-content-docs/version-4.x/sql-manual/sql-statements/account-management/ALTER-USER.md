---
{
    "title": "ALTER USER",
    "language": "ja",
    "description": "ALTER USER 文は、デュアルパスワードによるローテーションを含め、アカウントのパスワードとポリシーを変更します。"
}
---

## 説明 {#description}

`ALTER USER` 文は、パスワードやパスワードポリシーなど、ユーザーのアカウント属性を変更するために使用します。

4.2.1 以降、Doris は `RETAIN CURRENT PASSWORD` と `DISCARD OLD PASSWORD` を使用した、組み込みパスワード認証のデュアルパスワードをサポートします。

## 構文 {#syntax}

```sql
ALTER USER [IF EXISTS] <user_identity>
    [IDENTIFIED BY <password> [RETAIN CURRENT PASSWORD] | DISCARD OLD PASSWORD]
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
> `user_identity` は user_name と host の二つの部分で構成され、user_name はユーザー名です。host はクライアントの接続元ホストアドレスを示します。host 部分では % を使用したあいまい一致が可能です。host を指定しない場合のデフォルトは '%' で、ユーザーは任意のホストから Doris に接続できます。
> host 部分にはドメインも指定できます。構文は 'user_name'@['domain'] です。角括弧で囲まれている場合、Doris はドメインとして扱い、IP アドレスの解決を試みます。

## オプションパラメータ {#optional-parameters}

**1. `<password>`**

> ユーザーのパスワードを指定します。

**2. `<password_policy>`**

> `password_policy` は、パスワード認証によるログインに関するポリシーを指定する句です。現在、以下のポリシーをサポートしています。
>
> `PASSWORD_HISTORY { <n> | DEFAULT}`
>
>    パスワードを再設定するときに、過去に使用したパスワードの再利用を許可するかどうかを指定します。たとえば、`PASSWORD_HISTORY 10` は、過去 10 回に設定したパスワードを新しいパスワードとして使用することを禁止します。`PASSWORD_HISTORY DEFAULT` に設定すると、グローバル変数 `password_history` の値が使用されます。`0` はこの機能を無効にすることを意味します。デフォルトは 0 です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    現在のユーザーのパスワードの有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` は、パスワードが 10 日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` は、パスワードが期限切れにならないことを意味します。`PASSWORD_EXPIRE DEFAULT` に設定すると、グローバル変数 `default_password_lifetime` の値が使用されます。デフォルトは NEVER（または 0）で、期限切れになりません。
>
> `FAILED_LOGIN_ATTEMPTS <n>`
>
> 現在のユーザーが誤ったパスワードで n 回ログインを試みると、アカウントがロックされます。たとえば、`FAILED_LOGIN_ATTEMPTS 3` は、ログインに 3 回失敗するとアカウントがロックされることを意味します。
>
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされた場合のロック時間を設定します。たとえば、`PASSWORD_LOCK_TIME 1 DAY` は、アカウントが一日間ロックされることを意味します。
>
> `ACCOUNT_UNLOCK`
>
> `ACCOUNT_UNLOCK` は、ロックされたユーザーのロックを解除します。

**3. `<comment>`**

>ユーザーのコメントを指定します。

**4. `RETAIN CURRENT PASSWORD`（4.2.1 以降）**

> `IDENTIFIED BY` とともに使用すると、従来の主パスワードを副パスワードとして保持します。新しいパスワードが主パスワードになり、どちらのパスワードでも認証できます。それ以前に保持されていた副パスワードは置き換えられます。

**5. `DISCARD OLD PASSWORD`（4.2.1 以降）**

> 保持されている副パスワードを削除します。主パスワードは変わりません。これは単独で実行する操作であり、パスワードの変更、パスワードポリシー、コメント、その他のアカウント操作と組み合わせることはできません。副パスワードが存在しない場合は、何も変更されません。

## 必要な権限 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限     | 対象    | 備考 |
|:--------------|:----------|:------|
| GRANT_PRIV または ADMIN_PRIV | グローバル | RETAIN CURRENT PASSWORD と DISCARD OLD PASSWORD を含む ALTER USER の実行に必要です。 |

## 使用上の注意 {#usage-notes}

4.1.5 以降、特別な root アカウントは `'root'@'%'` のみです。`'root'@'localhost'` のようなアカウントは通常のユーザーであり、ユーザー名が root であるというだけで、実際の root アカウントを変更する権限は得られません。実際の root アカウントに対する保護は、root という名前のほかのユーザーには適用されません。

1. バージョン 2.0 以降、このコマンドはユーザーロールの変更をサポートしていません。関連する操作には [GRANT](./GRANT-TO.md) と [REVOKE](./REVOKE-FROM.md) を使用してください。

2. ALTER USER コマンドでは、以下のアカウント属性のうち、一度に変更できるのは一つだけです。
- パスワードを変更する。必要に応じて RETAIN CURRENT PASSWORD を指定できます
- 保持されている副パスワードを削除する
- `PASSWORD_HISTORY` を変更する
- `PASSWORD_EXPIRE` を変更する
- `FAILED_LOGIN_ATTEMPTS` と `PASSWORD_LOCK_TIME` を変更する
- ユーザーのロックを解除する

### デュアルパスワード（4.2.1 以降） {#dual-passwords-since-421}

- `RETAIN CURRENT PASSWORD` を使用するには、現在の主パスワードが空でないことと、パスワードを変更することが必要です。新しいパスワードが空の場合は、RETAIN を指定していても両方のパスワードが消去されます。
- RETAIN を指定せずに空でないパスワードへ通常の変更を行った場合、既存の副パスワードは保持され、その認証情報は失効しません。
- アカウントのロックとパスワードの有効期限の確認は、両方のパスワードに適用されます。DISCARD はパスワード履歴を変更せず、パスワードの有効期限の起算時点も変更しません。

ローテーションの手順、状態の確認方法、ドメインアカウントでの動作、アップグレード時の制約については、[デュアルパスワード](../../../admin-manual/auth/authentication/internal#dual-passwords)を参照してください。これらの句が管理するのは組み込みパスワードであり、LDAP や外部認証連携で保持される認証情報には適用されません。

## 例 {#example}

準備として、以下の例で使用するユーザー `jack` を作成します。

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

- 以前のパスワードを引き続き使用できる状態で、パスワードをローテーションする（4.2.1 以降）

```sql
ALTER USER jack@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
```

以前のパスワードと `NewPwd_2026!` のどちらでも認証できます。すべてのクライアントを新しいパスワードに切り替えたら、保持されているパスワードを削除します。

```sql
ALTER USER jack@'%' DISCARD OLD PASSWORD;
```

以後は `NewPwd_2026!` でのみ認証できます。
