---
{
    "title": "組み込み認証",
    "language": "ja",
    "description": "Doris ユーザー、パスワードポリシー、デュアルパスワードによるローテーション、ユーザーIDの照合、認証のトラブルシューティングについて説明します。"
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris は組み込みのユーザー認証機能を提供します。管理者は SQL コマンドを使用してユーザーを作成し、パスワードを設定し、接続元を制御できます。このドキュメントでは、Doris のユーザーIDの構成、利用できるパスワードポリシー、IP の照合優先順位、一般的な運用例とトラブルシューティング方法について説明します。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 参照先 |
| --- | --- |
| アカウントの作成・削除、パスワードのリセット | [基本概念](#core-concepts)、[よく使う運用コマンド](#common-operational-commands) |
| 企業向けパスワードポリシーの設定（有効期限 / 履歴 / 強度 / ロック） | [パスワードポリシー](#password-policies) |
| クライアントの移行中にアプリケーションのパスワードをローテーションする | [デュアルパスワード](#dual-passwords) |
| 同じユーザー名が複数の `user_identity` に一致し、ログインが拒否される | [ユーザーIDの照合優先順位](#user-identity-matching-priority) |
| 特定の IP からのログインをブロックする（ブラックリストの模擬） | [ホワイトリストを使ったブラックリストの模擬](#simulating-a-blacklist-with-a-whitelist) |
| root のパスワードを忘れた、または `current_user()` と `user()` が一致しない | [よくある質問](#faq) |

## 基本概念 {#core-concepts}

<!-- Knowledge type: Concept -->

### ユーザー（user_identity） {#user-user_identity}

Doris では、`user_identity` がユーザーを一意に識別し、次の二つの要素で構成されます。

- `user_name`：ユーザー名。
- `host`：クライアントの接続元ホストアドレス。`%` を使ったあいまい一致に対応します。

`host` を指定しない場合、デフォルトは `'%'` です。これは、ユーザーがどのホストからでも Doris に接続できることを意味します。

### ユーザープロパティ {#user-properties}

ユーザープロパティは `user_identity` ではなく、`user_name` に直接紐付きます。つまり、`user@'192.%'` と `user@['domain']` は同じユーザープロパティを共有します。プロパティはユーザーに属し、個々の `user@'192.%'` や `user@['domain']` には属しません。

ユーザープロパティには、ユーザーの最大接続数やデータロード用クラスタの設定などが含まれます。

### 組み込みユーザー {#built-in-users}

組み込みユーザーは Doris がデフォルトで作成するユーザーで、root や admin など、あらかじめ一定の権限を持っています。初期パスワードは空です。FE の起動後、パスワード変更コマンドで変更できます。**デフォルトユーザーは削除できません。**

| ユーザー | ログイン可能な接続元 | デフォルトのロール |
| --- | --- | --- |
| `root@'%'` | 任意のノード | operator |
| `admin@'%'` | 任意のノード | admin |

### パスワード {#password}

パスワードは、ユーザーがログインに使用する認証情報です。ユーザーの作成時に管理者が設定し、後からユーザー自身が変更することもできます。

## 認証の仕組み {#authentication-mechanism}

<!-- Knowledge type: Process description -->

Doris の認証は、次の二つの手順で行われます。

1. **クライアントが認証情報を送信する。** クライアントはユーザー名、パスワード、データベースなどの情報をまとめ、本人確認とデータベースへのアクセス要求のために Doris サーバーへ送信します。
2. **サーバーが本人確認を行う。** Doris は受け取った認証情報を検証します。ユーザー名、パスワード、クライアント IP がすべて正しく、ユーザーに選択したデータベースへのアクセス権がある場合、認証が成功し、Doris はユーザーをシステム上のユーザーIDに対応付けます。それ以外の場合は認証に失敗し、対応するエラーメッセージがクライアントに返されます。

## パスワードポリシー {#password-policies}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris は、管理者によるパスワードのライフサイクルとセキュリティの管理を支援するため、次のパスワードポリシーに対応しています。

| ポリシー | 目的 | デフォルト値 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 直近 N 個のパスワードの再利用を禁止する | 0（無効） |
| `PASSWORD_EXPIRE` | パスワードの有効期限を設定する | NEVER（期限なし） |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | ログインに連続して失敗した後、アカウントをロックする | 無効 |
| `validate_password_policy` | パスワードの強度を検証する | NONE/0（検証なし） |

### PASSWORD_HISTORY {#password_history}

パスワードのリセット時に、現在のユーザーが過去のパスワードを再利用できるかどうかを制御します。たとえば、`PASSWORD_HISTORY 10` は、直近 10 個のパスワードを新しいパスワードとして使用することを禁止します。`PASSWORD_HISTORY DEFAULT` に設定すると、グローバル変数 `password_history` の値が使用されます。0 にするとこの機能は無効になり、デフォルト値も 0 です。

例：

- グローバル変数を設定する：`SET GLOBAL password_history = 10`
- ユーザーに設定する：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE {#password_expire}

現在のユーザーのパスワードに有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` はパスワードが 10 日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER` は期限切れにならないことを意味します。`PASSWORD_EXPIRE DEFAULT` に設定すると、グローバル変数 `default_password_lifetime` の値が日数として使用されます。デフォルトは NEVER（または 0）で、パスワードは期限切れになりません。

例：

- グローバル変数を設定する：`SET GLOBAL default_password_lifetime = 1`
- ユーザーに設定する：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS と PASSWORD_LOCK_TIME {#failed_login_attempts-and-password_lock_time}

現在のユーザーがログインに n 回失敗した後にアカウントをロックし、ロック期間を設定します。たとえば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` は、ログインに 3 回失敗するとアカウントが一日間ロックされることを意味します。管理者は ALTER USER 文を使用して、ロックされたアカウントを手動で解除できます。

例：

- ユーザーに設定する：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### パスワードの強度 {#password-strength}

この機能はグローバル変数 `validate_password_policy` で制御します。デフォルトは NONE/0 で、パスワードの強度は検証されません。STRONG/2 に設定した場合、パスワードには大文字、小文字、数字、特殊文字という 4 種類のうち少なくとも 3 種類を含め、長さを 8 文字以上にする必要があります。

例：

- `SET validate_password_policy = STRONG`

### パスワードポリシーの確認 {#viewing-password-policies}

上記のポリシーを設定した後、次のコマンドで確認できます。

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

user と host の各部分を、それぞれ単一引用符で囲む必要があります。例：

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## デュアルパスワード {#dual-passwords}

<!-- Knowledge type: Operational procedure + Rules -->
<!-- Applicable scenarios: Application credential rotation -->

**4.2.1 以降でサポートされます。** 組み込みのパスワード認証では、同じアカウントに一つの主パスワードと、保持された一つの副パスワードを設定できます。両方が有効な期間を利用すると、以前のパスワードを使うクライアントの認証を拒否せずに、新しいパスワードへ移行できます。デフォルトでは副パスワードは存在せず、`RETAIN CURRENT PASSWORD` を使用した場合にのみ作成されます。これらの変更は以後の認証に適用され、既存のセッションは切断されません。

### 前提条件 {#prerequisites}

- これらの句を使用する前に、すべての FE を 4.2.1 以降にアップグレードしてください。
- グローバルな `GRANT_PRIV` または `ADMIN_PRIV` を持つ管理者としてローテーションを実行してください。自分のアカウントでも RETAIN の使用にはこの権限が必要ですが、RETAIN を伴わない通常のセルフサービスの SET PASSWORD には必要ありません。
- 組み込み認証による空でない主パスワードを持つアカウントを使用してください。LDAP と認証連携では、それぞれ独自の認証情報を管理します。

### パスワードをローテーションする {#rotate-a-password}

1. 例示用のアカウントを作成し、現在のパスワードを保持したまま新しいパスワードを設定します。既存のアカウントでは、ALTER USER 文のみを実行します。

    ```sql
    CREATE USER 'app_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
    ALTER USER 'app_user'@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
    ```

    `OldPwd_2026!` と `NewPwd_2026!` のどちらでも認証できます。同等の操作として `SET PASSWORD FOR 'app_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD` も使用できます。これは ALTER 文の代わりに使用し、ALTER 文の後には実行しないでください。

2. すべてのクライアントが `NewPwd_2026!` を使用するように更新します。アカウントの副パスワードの保持状態を確認します。

    ```sql
    SHOW GRANTS FOR 'app_user'@'%';
    ```

    `Password` 列には `Yes (dual)` と表示されます。`SHOW ALL GRANTS` と `SHOW PROC '/auth'` でも同じ表示を確認できます。各 FE の `doris_fe_secondary_password_auth_total` メトリクスは、アカウントポリシーの確認を通過した後に副パスワードで認証に成功した回数を、全アカウントにわたって数えます。この累積カウンターがゼロに戻るのを待つのではなく、増分を監視してください。

3. すべてのクライアントの移行後、副パスワードを取り消します。

    ```sql
    ALTER USER 'app_user'@'%' DISCARD OLD PASSWORD;
    ```

    以後は `NewPwd_2026!` だけで認証でき、`Password` 列の表示は `Yes` に戻ります。副パスワードが存在しない状態で DISCARD を繰り返しても、影響はありません。

### パスワードの有効期間とポリシーのルール {#password-lifetime-and-policy-rules}

| 操作 | 結果 |
| --- | --- |
| RETAIN を指定して空でない新しいパスワードを設定する | 以前の主パスワードが唯一の副パスワードになり、それより前の副パスワードは置き換えられます。 |
| RETAIN を指定せず、空でない新しいパスワードに変更する | 既存の副パスワードは引き続き有効です。主パスワードの変更だけでは取り消されません。 |
| 空の新しいパスワードを設定する | RETAIN を指定していても、両方のパスワードが消去されます。 |
| 現在の主パスワードが空の状態で RETAIN を指定する | 拒否されます。 |
| DISCARD OLD PASSWORD | 副パスワードだけが削除されます。パスワード履歴とパスワードの有効期限のカウントは変わりません。 |

どちらのパスワードにも、アカウントのロックポリシーと有効期限ポリシーが適用されます。RETAIN を指定した変更もパスワード変更であるため、パスワードの強度と履歴のルールに従い、有効期限のカウントが更新されます。認証連携の紐付け、解除、変更を行うと、保持された副パスワードは消去されます。これらの切り替えをまたいだ RETAIN の使用は拒否されます。DISCARD は独立した ALTER USER 操作であり、パスワード変更、ポリシー変更、コメントと組み合わせることはできません。

### ドメインアカウントとバージョン変更 {#domain-accounts-and-version-changes}

ドメインアカウントで DISCARD を実行すると、まず永続化されたドメインアカウントの副パスワードが消去されます。解決済み IP のエントリは、次回のドメインリゾルバの更新時に、保持している副パスワードのコピーを受け付けなくなります。通常の更新間隔は 10 秒ですが、これが取り消し完了までの厳密な上限時間というわけではありません。

ローリングアップグレード中、古い FE は主パスワードのみで認証し、新しい句を解析できません。すべての FE のアップグレードが完了してから、デュアルパスワードのローテーションを開始してください。この機能の使用後にダウングレードすると、保持された副パスワードは失われ、主パスワードのみが残ります。再びアップグレードしても、以前の副パスワードは復元されません。

文の完全なリファレンスについては、[ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) と [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) を参照してください。

## ユーザーIDの照合優先順位 {#user-identity-matching-priority}

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

`user_identity` は `user_name` と `host` で構成されますが、ログイン時にユーザーが指定するのは `user_name` だけです。Doris はクライアント IP に基づいて対応する `host` を照合し、ログインに使用する `user_identity` を決定します。

クライアント IP に一致する `user_identity` が一つだけなら、それを使用します。複数の `user_identity` が一致する場合、Doris は次の優先順位を適用します。

| 比較対象 | 優先順位 |
| --- | --- |
| 特定の IP とドメイン | 特定の IP がドメインより優先されます |
| 特定の IP と IP 範囲 | より限定的な IP 範囲が優先されます（たとえば、`192.%` は `%` より優先されます） |

### 例 1：IP がドメインより優先される {#example-1-ip-takes-priority-over-domain}

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

`domain1` が `ip1` と `ip2` という二つの IP に解決されるとします。IP はドメインより優先されるため、ユーザー `user1` が `ip1` からパスワード `'12345'` を使って Doris にログインしようとすると、拒否されます（正しいパスワードは `'abcde'` です）。

### 例 2：より限定的な IP 範囲が優先される {#example-2-more-specific-ip-range-wins}

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

`'192.%'` は `'%'` より優先されるため、ユーザー `user1` が `192.168.1.1` からパスワード `'12345'` を使って Doris にログインしようとすると、拒否されます（正しいパスワードは `'abcde'` です）。

## ホワイトリストを使ったブラックリストの模擬 {#simulating-a-blacklist-with-a-whitelist}

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris はブラックリストを標準ではサポートせず、ホワイトリストのみをサポートします。ただし、[ユーザーIDの照合優先順位](#user-identity-matching-priority)を利用して、ブラックリストを模擬できます。

たとえば、`user@'192.%'` というユーザーが作成され、`192.*` からのログインが許可されているとします。`192.168.10.1` からのログインをブロックするには、別のユーザー `cmy@'192.168.10.1'` を作成し、新しいパスワードを設定します。`192.168.10.1` は `192.%` より優先されるため、`192.168.10.1` からは古いパスワードでログインできなくなります。

## よく使う運用コマンド {#common-operational-commands}

<!-- Knowledge type: Command index -->

| 操作 | コマンド |
| --- | --- |
| ユーザーを作成する | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| ユーザーの権限を確認する | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
| ユーザーを変更する | [ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) |
| パスワードを変更する | [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) |
| ユーザーを削除する | [DROP USER](../../../sql-manual/sql-statements/account-management/DROP-USER) |
| ユーザープロパティを設定する | [SET PROPERTY](../../../sql-manual/sql-statements/account-management/SET-PROPERTY) |
| ユーザープロパティを確認する | [SHOW PROPERTY](../../../sql-manual/sql-statements/account-management/SHOW-PROPERTY) |

## よくある質問 {#faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenarios: Login failures / Identity confusion / Forgotten passwords -->

### Q: 忘れたパスワードをリセットするには？ {#q-how-do-i-reset-a-forgotten-password}

パスワードを忘れて Doris にログインできない場合は、次の手順で復旧します。

1. FE の設定ファイルに次のパラメータを追加します。

    ```text
    skip_localhost_auth_check = true
    ```

2. FE を再起動します。
3. FE ホスト上で、パスワードなしで root ユーザーとして Doris にログインします。
4. ログイン後、`SET PASSWORD` コマンドでパスワードをリセットします。

### Q: ほかのユーザーが root ユーザーのパスワードをリセットできますか？ {#q-can-other-users-reset-the-root-users-password}

できません。**root 以外のユーザーは、root ユーザーのパスワードをリセットできません。**

### Q: `current_user()` と `user()` の違いは何ですか？ {#q-what-is-the-difference-between-current_user-and-user}

`SELECT current_user()` と `SELECT user()` を実行すると、それぞれ `current_user` と `user` を確認できます。

- `current_user`：現在のユーザーが認証を通過した際のIDです（ユーザー作成時に使用された `user_identity`）。
- `user`：実際のクライアント IP を含む、現在のユーザーの実際のIDです。

たとえば、`user1@'192.%'` というユーザーを作成し、`192.168.10.1` からユーザー `user1` がログインした場合、`current_user` は `user1@'192.%'`、`user` は `user1@'192.168.10.1'` です。

すべての権限は特定の `current_user` に付与され、実際のユーザーは対応する `current_user` のすべての権限を持ちます。

### Q: パスワードが正しいことを確認したのに、ユーザーのログインが拒否されるのはなぜですか？ {#q-a-users-login-is-rejected-but-the-password-is-confirmed-to-be-correct-why}

通常は、[ユーザーIDの照合優先順位](#user-identity-matching-priority)のルールが適用されたためです。クライアント IP がより限定的な `user_identity` に一致した場合、その `user_identity` に対応するパスワードでログインする必要があります。実際に一致したIDは、次のコマンドで確認できます。

```sql
SELECT current_user();
```
