---
{
    "title": "組み込み認証",
    "language": "ja",
    "description": "Apache Doris の組み込み認証の詳細ガイド。user_identity の構成、パスワードポリシー（履歴、有効期限、ログイン失敗によるロック、強度検証）、IP の照合優先順位、ホワイトリストを使ったブラックリストの模擬、および一般的なトラブルシューティングを説明します。"
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris には組み込みのユーザー認証機構があります。管理者は SQL コマンドを使用してユーザーを作成し、パスワードを設定し、接続元を制御します。このドキュメントでは、Doris のユーザー ID の構成、利用できるパスワードポリシー、IP の照合優先順位、一般的な運用例とトラブルシューティング方法を説明します。

## 主な利用シーン {#applicable-scenarios}

| シーン | 参照先 |
| --- | --- |
| アカウントの作成・削除、パスワードのリセット | [基本概念](#core-concepts)、[よく使う操作コマンド](#common-operational-commands) |
| 企業向けのパスワードポリシー（有効期限、履歴、強度、ロック）の設定 | [パスワードポリシー](#password-policies) |
| 同じユーザー名が複数の `user_identity` に一致し、ログインが拒否される場合 | [ユーザー ID の照合優先順位](#user-identity-matching-priority) |
| 特定の IP からのログインをブロックする場合（ブラックリストの模擬） | [ホワイトリストを使ったブラックリストの模擬](#simulating-a-blacklist-with-a-whitelist) |
| root のパスワードを忘れた場合、または `current_user()` と `user()` が一致しない場合 | [FAQ](#faq) |

## 基本概念 {#core-concepts}

<!-- Knowledge type: Concept -->

### ユーザー（user_identity） {#user-user_identity}

Doris では、`user_identity` がユーザーを一意に識別し、次の二つの要素で構成されます。

- `user_name`：ユーザー名。
- `host`：クライアントの接続元ホストアドレス。あいまい一致には `%` を使用できます。

`host` を指定しない場合、デフォルトは `'%'` です。これは、どのホストからでも Doris に接続できることを意味します。

### ユーザープロパティ {#user-properties}

ユーザープロパティは `user_name` に直接紐づき、`user_identity` には紐づきません。つまり、`user@'192.%'` と `user@['domain']` は同じユーザープロパティを共有します。プロパティが属するのはユーザーであり、`user@'192.%'` や `user@['domain']` ではありません。

ユーザープロパティには、ユーザーの最大接続数やロードクラスターの設定などが含まれます。

### 組み込みユーザー {#built-in-users}

組み込みユーザーは、Doris がデフォルトで作成し、最初から一定の権限を持つユーザーです。root と admin が含まれます。初期パスワードは空です。FE の起動後、パスワード変更コマンドでパスワードを変更できます。**デフォルトユーザーは削除できません。**

| ユーザー | ログイン可能な接続元 | デフォルトのロール |
| --- | --- | --- |
| `root@'%'` | 任意のノード | operator |
| `admin@'%'` | 任意のノード | admin |

### パスワード {#password}

パスワードは、ユーザーがログインするときに使用する認証情報です。ユーザーの作成時に管理者が設定し、後からユーザー自身が変更することもできます。

## 認証の仕組み {#authentication-mechanism}

<!-- Knowledge type: Process description -->

Doris の認証は、次の二つのステップで行われます。

1. **クライアントが認証情報を送信します。** クライアントはユーザー情報（ユーザー名、パスワード、データベースなど）をまとめて Doris サーバーに送信し、自身の ID を証明してデータベースへのアクセスを要求します。
2. **サーバーが ID を検証します。** Doris は認証情報を受け取ると検証します。ユーザー名、パスワード、クライアント IP がすべて正しく、ユーザーに選択したデータベースへのアクセス権がある場合、認証は成功し、Doris はユーザーをシステム上のユーザー ID に対応付けます。それ以外の場合は認証に失敗し、対応するエラーメッセージがクライアントに返されます。

## パスワードポリシー {#password-policies}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris は、管理者がパスワードのライフサイクルとセキュリティを管理できるよう、次のパスワードポリシーをサポートしています。

| ポリシー | 目的 | デフォルト値 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 直近 N 個のパスワードの再利用を禁止する | 0（無効） |
| `PASSWORD_EXPIRE` | パスワードの有効期限を設定する | NEVER（期限なし） |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | 連続したログイン失敗後にアカウントをロックする | 無効 |
| `validate_password_policy` | パスワードの強度を検証する | NONE/0（検証なし） |

### PASSWORD_HISTORY

現在のユーザーがパスワードのリセット時に以前のパスワードを再利用できるかどうかを制御します。たとえば、`PASSWORD_HISTORY 10` は直近 10 個のパスワードを新しいパスワードとして使用することを禁止します。`PASSWORD_HISTORY DEFAULT` に設定した場合、グローバル変数 `password_history` の値が使用されます。0 にするとこの機能は無効になり、デフォルトは 0 です。

例：

- グローバル変数を設定する：`SET GLOBAL password_history = 10`
- ユーザーに設定する：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE

現在のユーザーのパスワードの有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` はパスワードが 10 日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` は無期限を意味します。`PASSWORD_EXPIRE DEFAULT` に設定した場合、グローバル変数 `default_password_lifetime` の値（日数）が使用されます。デフォルトは NEVER（または 0）で、パスワードは期限切れになりません。

例：

- グローバル変数を設定する：`SET GLOBAL default_password_lifetime = 1`
- ユーザーに設定する：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS と PASSWORD_LOCK_TIME {#failed_login_attempts-and-password_lock_time}

ログインに n 回失敗した後に現在のユーザーのアカウントをロックし、ロック期間を設定します。たとえば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` は、ログインに 3 回失敗するとアカウントが一日間ロックされることを意味します。管理者は ALTER USER ステートメントでロックされたアカウントを手動で解除できます。

例：

- ユーザーに設定する：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### パスワードの強度 {#password-strength}

この機能はグローバル変数 `validate_password_policy` で制御します。デフォルトは NONE/0 で、パスワードの強度は検証されません。STRONG/2 に設定すると、パスワードには大文字、小文字、数字、特殊文字の 4 種類のうち少なくとも 3 種類を含める必要があり、長さも 8 文字以上でなければなりません。

例：

- `SET validate_password_policy = STRONG`

### パスワードポリシーの確認 {#viewing-password-policies}

上記のポリシーを設定した後、次のコマンドで確認できます。

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

ユーザーとホストは、それぞれ単一引用符で囲む必要があります。例：

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## ユーザー ID の照合優先順位 {#user-identity-matching-priority}

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

`user_identity` は `user_name` と `host` で構成されますが、ログイン時にユーザーが指定するのは `user_name` だけです。Doris はクライアント IP を基に対応する `host` を照合し、ログインに使用する `user_identity` を決定します。

クライアント IP に一致する `user_identity` が一つだけの場合、Doris はそれを使用します。複数の `user_identity` が一致する場合は、次の優先順位を適用します。

| 比較対象 | 優先順位 |
| --- | --- |
| 特定の IP とドメイン | 特定の IP がドメインより優先される |
| 特定の IP と IP 範囲 | より具体的な IP 範囲が優先される（例：`192.%` は `%` より優先） |

### 例 1：IP はドメインより優先される {#example-1-ip-takes-priority-over-domain}

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

`domain1` が `ip1` と `ip2` の二つの IP に解決されるとします。IP はドメインより優先されるため、ユーザー `user1` が `ip1` からパスワード `'12345'` を使って Doris にログインしようとすると、ログインは拒否されます（正しいパスワードは `'abcde'` です）。

### 例 2：より具体的な IP 範囲が優先される {#example-2-more-specific-ip-range-wins}

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

`'192.%'` は `'%'` より優先されるため、ユーザー `user1` が `192.168.1.1` からパスワード `'12345'` を使って Doris にログインしようとすると、ログインは拒否されます（正しいパスワードは `'abcde'` です）。

## ホワイトリストを使ったブラックリストの模擬 {#simulating-a-blacklist-with-a-whitelist}

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris はブラックリストを標準ではサポートせず、ホワイトリストのみをサポートします。ただし、[ユーザー ID の照合優先順位](#user-identity-matching-priority)を利用してブラックリストを模擬できます。

たとえば、`user@'192.%'` というユーザーが作成され、`192.*` からのログインが許可されているとします。`192.168.10.1` からのログインをブロックするには、別のユーザー `cmy@'192.168.10.1'` を作成し、新しいパスワードを設定します。`192.168.10.1` は `192.%` より優先されるため、`192.168.10.1` からのユーザーは古いパスワードではログインできなくなります。

## よく使う操作コマンド {#common-operational-commands}

<!-- Knowledge type: Command index -->

| 操作 | コマンド |
| --- | --- |
| ユーザーを作成する | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| ユーザーへの権限付与を確認する | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| ユーザーを変更する | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| パスワードを変更する | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| ユーザーを削除する | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| ユーザープロパティを設定する | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| ユーザープロパティを確認する | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## FAQ {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Login failures / Identity confusion / Forgotten passwords -->

### Q：忘れたパスワードをリセットするには？ {#q-how-do-i-reset-a-forgotten-password}

パスワードを忘れて Doris にログインできない場合は、次の手順で復旧します。

1. FE の設定ファイルに次のパラメータを追加します。

    ```text
    skip_localhost_auth_check = true
    ```

2. FE を再起動します。
3. FE ホスト上で、パスワードを指定せずに root ユーザーとして Doris にログインします。
4. ログイン後、`SET PASSWORD` コマンドでパスワードをリセットします。

### Q：ほかのユーザーが root ユーザーのパスワードをリセットできますか？ {#q-can-other-users-reset-the-root-users-password}

いいえ。**root 以外のユーザーは、root ユーザーのパスワードをリセットできません。**

### Q：`current_user()` と `user()` の違いは何ですか？ {#q-what-is-the-difference-between-current_user-and-user}

`SELECT current_user()` と `SELECT user()` を実行すると、それぞれ `current_user` と `user` を確認できます。

- `current_user`：現在のユーザーが認証に使用した ID（ユーザーの作成時に使用した `user_identity`）。
- `user`：実際のクライアント IP を含む、現在のユーザーの実際の ID。

たとえば、`user1@'192.%'` というユーザーを作成し、その後、ユーザー `user1` が `192.168.10.1` からシステムにログインしたとします。この場合、`current_user` は `user1@'192.%'`、`user` は `user1@'192.168.10.1'` です。

すべての権限は特定の `current_user` に付与され、実際のユーザーはその `current_user` のすべての権限を持ちます。

### Q：パスワードが正しいことを確認したのに、ユーザーのログインが拒否されるのはなぜですか？ {#q-a-users-login-is-rejected-but-the-password-is-confirmed-to-be-correct-why}

通常は、[ユーザー ID の照合優先順位](#user-identity-matching-priority)の規則が適用されたことを意味します。クライアント IP がより具体的な `user_identity` に一致したため、その `user_identity` に対応するパスワードでログインする必要があります。実際に一致した ID は、次のコマンドで確認できます。

```sql
SELECT current_user();
```
