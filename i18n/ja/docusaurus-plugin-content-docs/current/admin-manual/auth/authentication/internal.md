---
{
    "title": "組み込み認証",
    "language": "ja",
    "description": "Doris ユーザー、パスワードポリシー、二重パスワードのローテーション、ユーザー識別子の照合、認証のトラブルシューティングを管理します。"
}
---

<!-- Knowledge type: Concept + Configuration parameters + Troubleshooting -->
<!-- Applicable scenarios: User and privilege management / Login authentication troubleshooting / Password policy configuration -->

Apache Doris には、組み込みのユーザー認証機能があります。管理者は SQL コマンドを使用してユーザーを作成し、パスワードを設定し、接続元を制御できます。このドキュメントでは、Doris のユーザー識別子の構成、利用できるパスワードポリシー、IP の照合優先順位、一般的な運用シナリオとトラブルシューティング方法について説明します。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 参照するセクション |
| --- | --- |
| アカウントの作成・削除、パスワードのリセット | [基本概念](#core-concepts)、[一般的な運用コマンド](#common-operational-commands) |
| 企業向けパスワードポリシー（有効期限 / 履歴 / 強度 / ロックアウト）の設定 | [パスワードポリシー](#password-policies) |
| クライアントの移行中にアプリケーションのパスワードをローテーションする | [二重パスワード](#dual-passwords) |
| 同じユーザー名が複数の `user_identity` に一致し、ログインが拒否される | [ユーザー識別子の照合優先順位](#user-identity-matching-priority) |
| 特定の IP からのログインをブロックする（ブラックリストを模擬する） | [ホワイトリストによるブラックリストの模擬](#simulating-a-blacklist-with-a-whitelist) |
| root のパスワードを忘れた、または `current_user()` と `user()` が一致しない | [よくある質問](#faq) |

## 基本概念 {#core-concepts}

<!-- Knowledge type: Concept -->

### ユーザー（user_identity） {#user-user_identity}

Doris では、`user_identity` がユーザーを一意に識別し、次の二つの要素で構成されます。

- `user_name`：ユーザー名。
- `host`：クライアントの接続元ホストアドレス。`%` を使用したあいまい一致に対応しています。

`host` を指定しない場合、デフォルトは `'%'` です。これは、そのユーザーが任意のホストから Doris に接続できることを意味します。

### ユーザープロパティ {#user-properties}

ユーザープロパティは `user_identity` ではなく、`user_name` に直接関連付けられます。つまり、`user@'192.%'` と `user@['domain']` は同じユーザープロパティを共有します。プロパティはユーザーに属し、`user@'192.%'` や `user@['domain']` には属しません。

ユーザープロパティには、ユーザーの最大接続数やデータロードクラスターの設定などが含まれます。

### 組み込みユーザー {#built-in-users}

組み込みユーザーは Doris がデフォルトで作成するユーザーで、root や admin など、初めから一定の権限を持っています。初期パスワードは空です。FE の起動後、パスワード変更コマンドで変更できます。**デフォルトユーザーは削除できません。**

| ユーザー | 許可されるログイン元 | デフォルトのロール |
| --- | --- | --- |
| `root@'%'` | 任意のノード | operator |
| `admin@'%'` | 任意のノード | admin |

### パスワード {#password}

パスワードは、ユーザーがログインするときに使用する認証情報です。ユーザーの作成時に管理者が設定し、後からユーザー自身が変更することもできます。

## 認証の仕組み {#authentication-mechanism}

<!-- Knowledge type: Process description -->

Doris の認証は、次の二つの手順で行われます。

1. **クライアントが認証情報を送信する。** クライアントはユーザー情報（ユーザー名、パスワード、データベースなど）をまとめ、身元を証明してデータベースへのアクセスを要求するために Doris サーバーへ送信します。
2. **サーバーが身元を検証する。** Doris は認証情報を受信すると検証します。ユーザー名、パスワード、クライアント IP がすべて正しく、そのユーザーに選択されたデータベースへのアクセス権があれば、認証が成功し、Doris はユーザーをシステム内のユーザー識別子に対応付けます。それ以外の場合は認証が失敗し、対応するエラーメッセージがクライアントに返されます。

## パスワードポリシー {#password-policies}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Enterprise security compliance / Password lifecycle management -->

Doris は、管理者によるパスワードのライフサイクルとセキュリティの管理を支援するため、次のパスワードポリシーをサポートしています。

| ポリシー | 用途 | デフォルト値 |
| --- | --- | --- |
| `PASSWORD_HISTORY` | 直近 N 個のパスワードの再利用を禁止する | 0（無効） |
| `PASSWORD_EXPIRE` | パスワードの有効期限を設定する | NEVER（期限なし） |
| `FAILED_LOGIN_ATTEMPTS` + `PASSWORD_LOCK_TIME` | ログイン失敗が連続した場合にアカウントをロックする | 無効 |
| `validate_password_policy` | パスワードの強度を検証する | NONE/0（検証しない） |

### PASSWORD_HISTORY {#password_history}

現在のユーザーがパスワードをリセットするときに、過去のパスワードを再利用できるかどうかを制御します。たとえば、`PASSWORD_HISTORY 10` は直近 10 個のパスワードを新しいパスワードとして使用することを禁止します。`PASSWORD_HISTORY DEFAULT` に設定すると、グローバル変数 `password_history` の値が使用されます。0 はこの機能を無効にし、デフォルトも 0 です。

例：

- グローバル変数を設定する：`SET GLOBAL password_history = 10`
- ユーザーに設定する：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

### PASSWORD_EXPIRE {#password_expire}

現在のユーザーのパスワードの有効期限を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` は、パスワードが 10 日後に失効することを意味します。`PASSWORD_EXPIRE NEVER` は、パスワードに有効期限を設けないことを意味します。`PASSWORD_EXPIRE DEFAULT` に設定すると、グローバル変数 `default_password_lifetime` の値が日数として使用されます。デフォルトは NEVER（または 0）で、パスワードは失効しません。

例：

- グローバル変数を設定する：`SET GLOBAL default_password_lifetime = 1`
- ユーザーに設定する：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

### FAILED_LOGIN_ATTEMPTS と PASSWORD_LOCK_TIME {#failed_login_attempts-and-password_lock_time}

現在のユーザーのログインが n 回失敗した後にアカウントをロックし、ロック期間を設定します。たとえば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` は、ログインが 3 回失敗するとアカウントが 1 日間ロックされることを意味します。管理者は ALTER USER 文を使用して、ロックされたアカウントを手動で解除できます。

例：

- ユーザーに設定する：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

### パスワードの強度 {#password-strength}

この機能は、グローバル変数 `validate_password_policy` で制御します。デフォルトは NONE/0 で、パスワードの強度は検査されません。STRONG/2 に設定した場合、パスワードは大文字、小文字、数字、特殊文字という 4 種類のうち少なくとも 3 種類を含み、長さが 8 文字以上である必要があります。

例：

- `SET validate_password_policy = STRONG`

### パスワードポリシーの確認 {#viewing-password-policies}

上記のポリシーを設定した後は、次のコマンドで確認できます。

```sql
SHOW PROC "/auth/'<user>'@'<host>'";
```

ユーザー部分とホスト部分は、それぞれ単一引用符で囲む必要があります。例：

```sql
SHOW PROC "/auth/'root'@'%'";
SHOW PROC "/auth/'user1'@'127.0.0.1'";
```

## 二重パスワード {#dual-passwords}

<!-- Knowledge type: Operational procedure + Rules -->
<!-- Applicable scenarios: Application credential rotation -->

**4.2.1 以降でサポートされています。** 組み込みパスワード認証では、同じアカウントに主パスワードと、保持された副パスワードを一つずつ設定できます。両方を使用できる期間を設けることで、以前のパスワードを使用するクライアントを拒否せずに、新しいパスワードへ移行できます。副パスワードはデフォルトでは存在せず、`RETAIN CURRENT PASSWORD` を指定した場合にのみ作成されます。これらの変更は以後の認証に適用され、既存のセッションは切断されません。

### 前提条件 {#prerequisites}

- これらの句を使用する前に、すべての FE を 4.2.1 以降にアップグレードしてください。
- グローバルな `GRANT_PRIV` または `ADMIN_PRIV` を持つ管理者がローテーションを実行してください。自分のアカウントであっても RETAIN にはこの権限が必要ですが、RETAIN を指定しない通常のセルフサービスの SET PASSWORD には必要ありません。
- 組み込み認証を使用し、空でない主パスワードが設定されたアカウントを使用してください。LDAP や認証連携の認証情報は、それぞれの仕組みで管理されます。

### パスワードのローテーション {#rotate-a-password}

1. 例のアカウントを作成し、現在のパスワードを保持したまま新しいパスワードを設定します。既存のアカウントでは ALTER USER 文のみを実行します。

    ```sql
    CREATE USER 'app_user'@'%' IDENTIFIED BY 'OldPwd_2026!';
    ALTER USER 'app_user'@'%' IDENTIFIED BY 'NewPwd_2026!' RETAIN CURRENT PASSWORD;
    ```

    `OldPwd_2026!` と `NewPwd_2026!` の両方で認証できます。同等の保持操作として `SET PASSWORD FOR 'app_user'@'%' = PASSWORD('NewPwd_2026!') RETAIN CURRENT PASSWORD` も使用できます。ALTER 文の代わりに使用し、ALTER 文の後に実行しないでください。

2. すべてのクライアントが `NewPwd_2026!` を使用するように更新します。アカウントの副パスワードの保持状態を確認します。

    ```sql
    SHOW GRANTS FOR 'app_user'@'%';
    ```

    `Password` 列には `Yes (dual)` と表示されます。`SHOW ALL GRANTS` と `SHOW PROC '/auth'` でも同じ表示を確認できます。各 FE の `doris_fe_secondary_password_auth_total` メトリクスは、アカウントポリシーのチェック後に副パスワードを使用して認証に成功した回数を、全アカウントを通じて数えます。この累積カウンターがゼロに戻るのを待つのではなく、増分を観察してください。

3. すべてのクライアントの移行が完了したら、副パスワードを取り消します。

    ```sql
    ALTER USER 'app_user'@'%' DISCARD OLD PASSWORD;
    ```

    以後は `NewPwd_2026!` のみで認証でき、`Password` 列の表示は `Yes` に戻ります。副パスワードが存在しない状態で DISCARD を繰り返しても、影響はありません。

### パスワードの有効期間とポリシーの規則 {#password-lifetime-and-policy-rules}

| 操作 | 結果 |
| --- | --- |
| 空でない新しいパスワードを RETAIN とともに設定する | 以前の主パスワードが唯一の副パスワードになり、それ以前の副パスワードは置き換えられます。 |
| RETAIN を指定せずに空でないパスワードへ変更する | 既存の副パスワードは引き続き有効です。主パスワードを置き換えるだけでは取り消されません。 |
| 空の新しいパスワードを設定する | RETAIN を指定していても、両方のパスワードが消去されます。 |
| 現在の主パスワードが空の状態で RETAIN を指定する | 拒否されます。 |
| DISCARD OLD PASSWORD | 副パスワードだけが削除されます。パスワード履歴とパスワードの有効期限の起算時点は変わりません。 |

両方のパスワードに、アカウントのロックと有効期限のポリシーが適用されます。RETAIN を指定した変更もパスワード変更であり、パスワードの強度と履歴に関する規則に従い、有効期限の起算時点を更新します。認証連携の紐付け、解除、変更を行うと、保持された副パスワードは消去されます。これらの切り替えと同時に RETAIN を使用することはできません。DISCARD は単独の ALTER USER 操作であり、パスワードの変更、ポリシーの変更、コメントの変更とは組み合わせられません。

### ドメインアカウントとバージョン変更 {#domain-accounts-and-version-changes}

ドメインアカウントに対して DISCARD を実行すると、まず永続化されたドメインアカウントの副パスワードが消去されます。解決済み IP のエントリが保持されたパスワードを受け付けなくなるのは、次回のドメインリゾルバーの更新時です。通常の更新間隔は 10 秒ですが、これは取り消しまでの時間の厳密な上限ではありません。

ローリングアップグレード中、古い FE は主パスワードでしか認証できず、新しい句も解析できません。二重パスワードのローテーションを開始する前に、すべての FE のアップグレードを完了してください。この機能を使用した後にダウングレードすると、保持された副パスワードは失われ、主パスワードだけが残ります。再度アップグレードしても、以前の副パスワードは復元されません。

文の完全なリファレンスについては、[ALTER USER](../../../sql-manual/sql-statements/account-management/ALTER-USER) と [SET PASSWORD](../../../sql-manual/sql-statements/account-management/SET-PASSWORD) を参照してください。

## ユーザー識別子の照合優先順位 {#user-identity-matching-priority}

<!-- Knowledge type: Rule description -->
<!-- Applicable scenarios: Login rejection troubleshooting / Conflicts between multiple user_identity values -->

`user_identity` は `user_name` と `host` で構成されますが、ログイン時にユーザーが指定するのは `user_name` だけです。Doris はクライアント IP に基づいて対応する `host` を照合し、ログインに使用する `user_identity` を決定します。

クライアント IP に一致する `user_identity` が一つだけの場合、Doris はそれを使用します。複数の `user_identity` が一致する場合は、次の優先順位を適用します。

| 比較する対象 | 優先順位 |
| --- | --- |
| 特定の IP とドメイン | 特定の IP がドメインより優先されます |
| 特定の IP と IP 範囲 | より具体的な IP 範囲が優先されます（例：`192.%` は `%` より優先） |

### 例 1：IP がドメインより優先される {#example-1-ip-takes-priority-over-domain}

```sql
CREATE USER user1@['domain1'] IDENTIFIED BY "12345";
CREATE USER user1@'ip1' IDENTIFIED BY "abcde";
```

`domain1` が `ip1` と `ip2` という二つの IP に解決されるとします。IP はドメインより優先されるため、ユーザー `user1` が `ip1` からパスワード `'12345'` を使って Doris にログインしようとすると拒否されます（正しいパスワードは `'abcde'` です）。

### 例 2：より具体的な IP 範囲が優先される {#example-2-more-specific-ip-range-wins}

```sql
CREATE USER user1@'%' IDENTIFIED BY "12345";
CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
```

`'192.%'` は `'%'` より優先されるため、ユーザー `user1` が `192.168.1.1` からパスワード `'12345'` を使って Doris にログインしようとすると拒否されます（正しいパスワードは `'abcde'` です）。

## ホワイトリストによるブラックリストの模擬 {#simulating-a-blacklist-with-a-whitelist}

<!-- Knowledge type: Operational technique -->
<!-- Applicable scenarios: Block specific IPs from logging in -->

Doris はブラックリストを標準ではサポートせず、ホワイトリストのみをサポートしています。ただし、[ユーザー識別子の照合優先順位](#user-identity-matching-priority)を利用して、ブラックリストを模擬できます。

たとえば、`user@'192.%'` というユーザーが作成されており、`192.*` からのログインが許可されているとします。`192.168.10.1` からのログインをブロックするには、別のユーザー `cmy@'192.168.10.1'` を作成し、新しいパスワードを設定します。`192.168.10.1` は `192.%` より優先順位が高いため、`192.168.10.1` からのユーザーは古いパスワードではログインできなくなります。

## 一般的な運用コマンド {#common-operational-commands}

<!-- Knowledge type: Command index -->

| 操作 | コマンド |
| --- | --- |
| ユーザーを作成する | [CREATE USER](../../../sql-manual/sql-statements/account-management/CREATE-USER) |
| ユーザーの権限付与を確認する | [SHOW ALL GRANTS](../../../sql-manual/sql-statements/account-management/SHOW-GRANTS) |
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
3. FE ホスト上で、root ユーザーとしてパスワードなしで Doris にログインします。
4. ログイン後、`SET PASSWORD` コマンドでパスワードをリセットします。

### Q: 他のユーザーが root ユーザーのパスワードをリセットできますか？ {#q-can-other-users-reset-the-root-users-password}

いいえ。**root 以外のユーザーは、root ユーザーのパスワードをリセットできません。**

### Q: `current_user()` と `user()` の違いは何ですか？ {#q-what-is-the-difference-between-current_user-and-user}

`SELECT current_user()` と `SELECT user()` を実行すると、それぞれ `current_user` と `user` を確認できます。

- `current_user`：現在のユーザーが認証に使用した識別子（ユーザー作成時に使用された `user_identity`）。
- `user`：実際のクライアント IP を含む、現在のユーザーの実際の識別子。

たとえば、ユーザー `user1@'192.%'` が作成され、`192.168.10.1` からユーザー `user1` がシステムにログインしたとします。この場合、`current_user` は `user1@'192.%'`、`user` は `user1@'192.168.10.1'` です。

すべての権限は特定の `current_user` に付与され、実際のユーザーはその `current_user` のすべての権限を持ちます。

### Q: パスワードが正しいことを確認したのに、ユーザーのログインが拒否されるのはなぜですか？ {#q-a-users-login-is-rejected-but-the-password-is-confirmed-to-be-correct-why}

通常は、[ユーザー識別子の照合優先順位](#user-identity-matching-priority)の規則が適用されています。クライアント IP がより具体的な `user_identity` に一致したため、その `user_identity` に対応するパスワードでログインする必要があります。実際に一致した識別子は、次のコマンドで確認できます。

```sql
SELECT current_user();
```
