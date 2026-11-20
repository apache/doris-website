---
{
    "title": "ALTER USER",
    "language": "ja",
    "description": "ALTER USER ステートメントは、デュアルパスワードによるローテーションを含め、アカウントのパスワードとポリシーを変更します。"
}
---

## 説明 {#description}

`ALTER USER` ステートメントは、パスワードやパスワードポリシーなど、ユーザーのアカウント属性を変更するために使用します。

4.2.1 以降、Doris は組み込みのパスワード認証で、`RETAIN CURRENT PASSWORD` と `DISCARD OLD PASSWORD` によるデュアルパスワードをサポートしています。

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
> `user_identity` は user_name と host の二つの部分から構成され、user_name はユーザー名です。host はクライアントの接続元ホストアドレスを示します。host 部分には、あいまい一致のために % を使用できます。host を指定しない場合、デフォルトは '%' となり、ユーザーはどのホストからでも Doris に接続できます。
> host 部分にはドメインも指定できます。構文は 'user_name'@['domain'] です。角括弧で囲まれている場合、Doris はこれをドメインとみなし、その IP アドレスの解決を試みます。

## オプションパラメータ {#optional-parameters}

**1. `<password>`**

> ユーザーのパスワードを指定します。

**2. `<password_policy>`**

> `password_policy` は、パスワード認証によるログインに関するポリシーを指定する句です。現在、以下のポリシーをサポートしています。
>
> `PASSWORD_HISTORY { <n> | DEFAULT}`
>
>    パスワードの再設定時に、過去に使用したパスワードの再利用を許可するかどうかを指定します。たとえば、`PASSWORD_HISTORY 10` は、過去 10 回に設定したパスワードを新しいパスワードとして使用することを禁止します。`PASSWORD_HISTORY DEFAULT` を設定すると、グローバル変数 `password_history` の値が使用されます。`0` はこの機能を有効にしないことを意味します。デフォルトは 0 です。
>
> `PASSWORD_EXPIRE { DEFAULT | NEVER | INTERVAL <n> { DAY | HOUR | SECOND }}`
>
>    ユーザーのパスワードの有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` は、パスワードが 10 日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` は、パスワードの有効期限がないことを意味します。`PASSWORD_EXPIRE DEFAULT` を設定すると、グローバル変数 `default_password_lifetime` の値が使用されます。デフォルトは NEVER（または 0）で、有効期限はありません。
>
> `FAILED_LOGIN_ATTEMPTS <n>`
>
> ユーザーが誤ったパスワードで n 回ログインを試みると、アカウントがロックされます。たとえば、`FAILED_LOGIN_ATTEMPTS 3` は、ログインに 3 回失敗するとアカウントがロックされることを意味します。
>
> `PASSWORD_LOCK_TIME { UNBOUNDED | <n> { DAY | HOUR | SECOND }}`
>
> アカウントがロックされた場合のロック期間を設定します。たとえば、`PASSWORD_LOCK_TIME 1 DAY` は、アカウントが一日間ロックされることを意味します。
>
> `ACCOUNT_UNLOCK`
>
> `ACCOUNT_UNLOCK` は、ロックされたユーザーのロックを解除するために使用します。

**3. `<comment>`**

>ユーザーのコメントを指定します。

**4. `RETAIN CURRENT PASSWORD`（4.2.1 以降）**

> `IDENTIFIED BY` とともに使用し、以前のプライマリパスワードをセカンダリパスワードとして保持します。新しいパスワードがプライマリとなり、どちらのパスワードでも認証できます。それ以前のセカンダリパスワードは置き換えられます。

**5. `DISCARD OLD PASSWORD`（4.2.1 以降）**

> 保持されているセカンダリパスワードを削除し、プライマリパスワードは変更しません。これは単独で実行する操作です。パスワード変更、パスワードポリシー、コメント、その他のアカウント操作と組み合わせないでください。セカンダリパスワードが存在しない場合、何も変わりません。

## アクセス制御の要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも以下の権限が必要です。

| 権限     | 対象    | 備考 |
|:--------------|:----------|:------|
| GRANT_PRIV または ADMIN_PRIV | グローバル | RETAIN CURRENT PASSWORD と DISCARD OLD PASSWORD を含む ALTER USER の実行に必要です。 |

## 使用上の注意 {#usage-notes}

4.1.5 以降、特別な root ユーザーの識別子は `'root'@'%'` のみです。`'root'@'localhost'` などの識別子は通常のユーザーのままであり、ユーザー名が root であるという理由だけで、実際の root アカウントを変更する権限は得られません。実際の root アカウントに対する保護は、root という名前のほかのユーザーには適用されません。

1. バージョン 2.0 以降、このコマンドはユーザーロールの変更をサポートしていません。関連する操作には [GRANT](./GRANT-TO.md) と [REVOKE](./REVOKE-FROM.md) を使用してください。

2. 一つの ALTER USER コマンドでは、以下のアカウント属性のうち、一度に変更できるのは一項目だけです。
- パスワードの変更。必要に応じて RETAIN CURRENT PASSWORD を指定可能
- 保持されているセカンダリパスワードの破棄
- `PASSWORD_HISTORY` の変更
- `PASSWORD_EXPIRE` の変更
- `FAILED_LOGIN_ATTEMPTS` と `PASSWORD_LOCK_TIME` の変更
- ユーザーのロック解除

### デュアルパスワード（4.2.1 以降） {#dual-passwords-since-421}

- `RETAIN CURRENT PASSWORD` を使用するには、現在のプライマリパスワードが空でなく、パスワードを変更する必要があります。新しいパスワードが空の場合、RETAIN を指定していても両方のパスワードが消去されます。
- RETAIN を指定せずに空でないパスワードへ通常の変更を行った場合、既存のセカンダリパスワードは保持されます。その認証情報は失効しません。
- アカウントのロックとパスワードの有効期限のチェックは、両方のパスワードに適用されます。DISCARD はパスワード履歴を変更せず、パスワードの有効期限の起算時点も更新しません。

ローテーションの手順、状態の確認方法、ドメインアカウントでの動作、アップグレード時の制約については、[デュアルパスワード](../../../admin-manual/auth/authentication/internal#dual-passwords)を参照してください。これらの句が管理するのは組み込みのパスワードであり、LDAP や外部認証連携で保持される認証情報には適用されません。

## 例 {#example}

準備としてユーザー `jack` を作成し、以下の例で操作する対象にします。

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

- 以前のパスワードを使用可能な状態に保ちながら、パスワードをローテーションする（4.2.1 以降）

```sql
ALTER USER jack@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
```

以前のパスワードと `NewPwd_2026!` のどちらでも認証できます。すべてのクライアントが新しいパスワードに切り替わったら、保持されているパスワードを破棄します。

```sql
ALTER USER jack@'%' DISCARD OLD PASSWORD;
```

以後は `NewPwd_2026!` でのみ認証できます。
