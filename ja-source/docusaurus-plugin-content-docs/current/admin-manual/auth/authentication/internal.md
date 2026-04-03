---
{
  "title": "ビルトイン認証",
  "language": "ja",
  "description": "Dorisでは、useridentityはユーザーを一意に識別します。useridentityは、usernameとhostの2つの部分で構成され、usernameはユーザー名です。"
}
---
## 主要概念
### ユーザー

Dorisでは、user_identityがユーザーを一意に識別します。user_identityは2つの部分で構成されます：user_nameとhostです。usernameはユーザー名です。hostはユーザークライアント接続が配置されているホストアドレスを識別します。host部分は曖昧マッチングに%を使用できます。hostが指定されていない場合、デフォルトは'%'となり、これはユーザーが任意のホストからDorisに接続できることを意味します。

#### ユーザー属性

ユーザー属性は、user_identityではなくuser_nameに直接付与されます。これは、user@'192.%'とuser@['domain']が同じユーザー属性セットを持つことを意味します。これらの属性は、user@'192.%'やuser@['domain']ではなく、userに属します。

ユーザー属性には、ユーザー最大接続数、インポートクラスター設定などが含まれますが、これらに限定されません。

#### 組み込みユーザー

組み込みユーザーは、Dorisでデフォルトで作成されるユーザーで、rootやadminを含む特定のデフォルト権限を持ちます。初期パスワードは空です。FE開始後、パスワード変更コマンドを使用して変更できます。組み込みユーザーは削除できません。

- root@'%'：rootユーザー、任意のノードからのログインが許可され、operatorロールを持ちます。
- admin@'%'：adminユーザー、任意のノードからのログインが許可され、adminロールを持ちます。

### パスワード

ユーザーログイン認証情報で、管理者がユーザー作成時に設定するか、作成後にユーザー自身が変更できます。

#### パスワードポリシー

Dorisは、ユーザーがパスワードをより適切に管理できるよう、以下のパスワードポリシーをサポートしています。

- `PASSWORD_HISTORY`

  パスワードリセット時に現在のユーザーが履歴パスワードを使用することを許可するかどうか。例えば、`PASSWORD_HISTORY` 10は、過去10個のパスワードを新しいパスワードとして使用することを禁止することを意味します。`PASSWORD_HISTORY DEFAULT`に設定すると、グローバル変数`password_history`の値を使用します。0はこの機能が無効であることを意味します。デフォルトは0です。

  例：

  - グローバル変数を設定：`SET GLOBAL password_history = 10`
  - ユーザーに設定：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

- `PASSWORD_EXPIRE`

  現在のユーザーのパスワードの有効期限を設定します。例えば、`PASSWORD_EXPIRE INTERVAL 10 DAY`は、パスワードが10日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER`は、パスワードが期限切れにならないことを意味します。`PASSWORD_EXPIRE DEFAULT`に設定すると、グローバル変数`default_password_lifetime`（日数）の値を使用します。デフォルトはNEVER（または0）で、期限切れにならないことを意味します。

  例：

  - グローバル変数を設定：`SET GLOBAL default_password_lifetime = 1`
  - ユーザーに設定：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

- `FAILED_LOGIN_ATTEMPTS`と`PASSWORD_LOCK_TIME`

  現在のユーザーが間違ったパスワードでn回ログインした場合、アカウントをロックし、ロック時間を設定します。例えば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`は、3回間違ったログインがあった場合、アカウントを1日間ロックすることを意味します。管理者はALTER USER文を通じてロックされたアカウントを能動的にアンロックできます。

  例：

  - ユーザーに設定：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

- パスワード強度

  この機能はグローバル変数`validate_password_policy`によって制御されます。デフォルトはNONE/0で、パスワード強度がチェックされないことを意味します。STRONG/2に設定すると、パスワードは「大文字」、「小文字」、「数字」、「特殊文字」のうち3つを含む必要があり、長さは8以上である必要があります。

  例：

    - `SET validate_password_policy=STRONG`

上記のポリシーを設定後、以下のコマンドでそれらを表示できます：

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```
注意：userとhost部分はそれぞれ単一引用符で個別に囲む必要があります。例：

```
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```
## 認証メカニズム

1. クライアント認証情報の送信：クライアントはユーザー情報（ユーザー名、パスワード、データベースなど）をパッケージ化してDorisサーバーに送信します。この情報は、クライアントの身元を証明し、データベースへのアクセスを要求するために使用されます。

2. サーバー認証：Dorisはクライアントの認証情報を受信した後、検証を実行します。ユーザー名、パスワード、およびクライアントIPが正しく、ユーザーが選択されたデータベースにアクセスする権限を持っている場合、認証が成功し、DorisはユーザーをシステムのUser Identityにマッピングします。そうでない場合、認証が失敗し、対応するエラーメッセージをクライアントに返します。

## ブラックリストとホワイトリスト

Doris自体はブラックリストをサポートしておらず、ホワイトリスト機能のみをサポートしていますが、特定の方法でブラックリストをシミュレートできます。最初に`user@'192.%'`という名前のユーザーを作成し、`192.*`からのユーザーのログインを許可することを示したとします。`192.168.10.1`からのユーザーのログインを禁止したい場合、別のユーザー`cmy@'192.168.10.1'`を作成し、新しいパスワードを設定できます。`192.168.10.1`は`192.%`よりも優先度が高いため、`192.168.10.1`からのユーザーは古いパスワードを使用してログインできなくなります。

## 関連コマンド

- ユーザー作成：[CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER)
- ユーザー表示：[SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS)
- ユーザー変更：[ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER)
- パスワード変更：[SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD)
- ユーザー削除：[DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER)
- ユーザー属性設定：[SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY)
- ユーザー属性表示：[SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY)

## その他の注意事項

1. ログイン時のuser_identityの優先選択

    上述の通り、`user_identity`は`user_name`と`host`で構成されますが、ユーザーがログインする際は`user_name`のみを入力すればよいため、DorisはクライアントのIPに基づいて対応する`host`をマッチングし、ログインに使用する`user_identity`を決定します。

    クライアントIPに基づいて1つの`user_identity`のみがマッチできる場合、この`user_identity`が間違いなくマッチされます。しかし、複数の`user_identity`がマッチできる場合、以下の優先度の問題が発生します。

    1. ドメインとIPの間の優先度：

        以下のユーザーが作成されたとします：

        ```sql
        CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
        CREATE USER user1@'ip1'IDENTIFIED BY "abcde";
        ```
domain1は2つのIP（ip1とip2）に解決されます。

        優先度に関して、IPがドメインより優先されるため、ユーザーuser1がパスワード'12345'を使用してip1からDorisにログインしようとすると、拒否されます。

    2. 特定のIPとIP範囲の間の優先度：

      以下のユーザーが作成されたとします：

      ```sql
      CREATE USER user1@'%' IDENTIFIED BY "12345";
      CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
      ```
優先度の観点から、'192.%'は'%'よりも優先されるため、ユーザーuser1が192.168.1.1からパスワード'12345'を使用してDorisにログインしようとすると、拒否されます。

2. パスワードを忘れた場合

    パスワードを忘れてDorisにログインできない場合は、FE設定ファイルにskip_localhost_auth_check=trueパラメータを追加してFEを再起動することで、FEローカルマシン上でrootとしてパスワードなしでDorisにログインできます。

    ログイン後、SET PASSWORDコマンドを使用してパスワードをリセットできます。

3. rootユーザー自身を除き、rootユーザーのパスワードをリセットできるユーザーはいません。

4. `current_user()`と`user()`

    ユーザーは`SELECT current_user()`と`SELECT user()`を通じて、それぞれ`current_user`と`user`を確認できます。`current_user`は現在のユーザーが認証システムを通過した際のアイデンティティを表し、`user`はユーザーの実際のUser Identityです。

    例：

    ユーザー`user1@'192.%'`を作成したとして、`192.168.10.1`からユーザー`user1`がシステムにログインしたとします。この場合、`current_user`は`user1@'192.%'`となり、`user`は`user1@'192.168.10.1'`となります。

    すべての権限は特定の`current_user`に付与され、実際のユーザーは対応する`current_user`のすべての権限を持ちます。
