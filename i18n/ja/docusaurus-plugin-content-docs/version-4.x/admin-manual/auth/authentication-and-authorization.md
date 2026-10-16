---
{
    "title": "認証と認可",
    "language": "ja",
    "description": "Doris の権限管理システムは、MySQL の権限管理の仕組みをモデルにしています。"
}
---

Doris の権限管理システムは、MySQL の権限管理の仕組みをモデルにしています。行および列レベルの細かな権限制御、ロールベースのアクセス制御、ホワイトリストの仕組みをサポートします。

## 用語集

1. ユーザー ID

   権限システムでは、ユーザーはユーザー ID（User Identity）によって識別されます。ユーザー ID は `username` と `host` の二つの要素で構成されます。`username` はユーザー名で、英字（大文字と小文字）で構成されます。`host` はユーザーの接続元 IP を表します。ユーザー ID は `username@'host'` と表記し、`username` が `host` から接続することを意味します。

   ユーザー ID には `username@['domain']` という表記もあります。`domain` は、DNS によって複数の IP に解決できるドメイン名です。最終的には `username@'host'` の集合として表されるため、以下では `username@'host'` という表記に統一します。

2. 権限

   権限はノード、データディレクトリ、データベース、またはテーブルに適用されます。権限の種類によって許可される操作が異なります。

3. ロール

   Doris では、任意の名前を付けたロールを作成できます。ロールは権限の集合と考えることができます。新規ユーザーにロールを割り当てると、そのロールの権限が自動的に継承されます。その後ロールの権限を変更すると、そのロールに関連付けられたすべてのユーザーの権限にも反映されます。

4. ユーザープロパティ

   ユーザープロパティはユーザー ID ではなく、ユーザーに直接紐付きます。つまり、`user@'192.%'` と `user@['domain']` は同じユーザープロパティを共有します。そのプロパティはユーザー `user` に属し、`user@'192.%'` や `user@['domain']` には属しません。

   ユーザープロパティには、ユーザーの最大接続数やインポートクラスタの設定などが含まれます。

## 認証と認可の仕組み

Apache Doris へのユーザーログインは、**認証**と**認可**の二段階に分かれます。

- 認証：ユーザーが提供した資格情報（ユーザー名、クライアント IP、パスワードなど）に基づいて本人確認を行います。確認できたユーザーを、システムで定義されたユーザー ID に対応付けます。
- 認可：取得したユーザー ID に紐付く権限に基づき、実行しようとする操作に必要な権限があるか確認します。

## 認証

Doris は組み込みの認証方式と LDAP 認証をサポートします。

### Doris 組み込み認証方式

認証には、Doris 自体に保存されているユーザー名やパスワードなどの情報を使用します。

管理者は `CREATE USER` コマンドでユーザーを作成し、`SHOW ALL GRANTS` コマンドですべてのユーザーの権限とロールを確認できます。

ユーザーのログイン時には、ユーザー名、パスワード、クライアント IP アドレスが正しいかをシステムが確認します。

#### パスワードポリシー

Doris はパスワード管理を支援するため、次のポリシーをサポートします。

1. `PASSWORD_HISTORY`

    現在のパスワードを変更するときに、過去のパスワードを再利用できるかを決めます。たとえば、`PASSWORD_HISTORY 10` を指定すると、直近 10 個のパスワードを新しいパスワードとして再利用できません。`PASSWORD_HISTORY DEFAULT` を指定すると、グローバル変数 `PASSWORD_HISTORY` の値を使用します。0 を指定すると、この機能は無効になります。デフォルトは 0 です。

    例：

    - グローバル変数を設定：`SET GLOBAL password_history = 10`
    - ユーザーに設定：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

2. `PASSWORD_EXPIRE`

    現在のユーザーのパスワードの有効期間を設定します。たとえば、`PASSWORD_EXPIRE INTERVAL 10 DAY` を指定すると、パスワードは 10 日後に期限切れになります。`PASSWORD_EXPIRE NEVER` は無期限を意味します。`PASSWORD_EXPIRE DEFAULT` を指定すると、グローバル変数 `default_password_lifetime` の値（日数）を使用します。デフォルトは NEVER（または 0）で、期限切れになりません。

    例：

    - グローバル変数を設定：`SET GLOBAL default_password_lifetime = 1`
    - ユーザーに設定：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

3. `FAILED_LOGIN_ATTEMPTS` と `PASSWORD_LOCK_TIME`

    パスワードの入力を何回間違えるとアカウントをロックするか、およびロック期間を設定します。たとえば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY` は、ログインに 3 回失敗するとアカウントが一日間ロックされることを意味します。管理者は `ALTER USER` ステートメントでアカウントのロックを解除できます。

    例：

    - ユーザーに設定：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

4. パスワードの強度

    グローバル変数 `validate_password_policy` で制御します。デフォルトは `NONE/0` で、パスワードの強度を検証しません。`STRONG/2` に設定すると、パスワードは大文字、小文字、数字、特殊文字のうち少なくとも三種類を含み、8 文字以上である必要があります。

    例：

    - `SET validate_password_policy=STRONG`

    Doris 4.0.4 以降、パスワード強度の検証ポリシーは次のように強化されました。

    1. `validate_password_policy` を `STRONG/2` に設定した場合、従来の「4 種類のうち 3 種類」ではなく、**4 種類すべての文字**（大文字、小文字、数字、特殊文字）を含む必要があります。

    2. **辞書単語のチェック**が追加されました。パスワードには、password、admin、test、root などの一般的な弱い単語を含められません。システムには一般的な弱い単語の辞書が組み込まれており、それらを含むパスワードは拒否されます。

    3. **カスタム辞書ファイル**をサポートします。グローバル変数 `validate_password_dictionary_file` でカスタム辞書のファイル名を指定できます。辞書ファイルは `${DORIS_HOME}/plugins/security/` ディレクトリに配置してください。ファイル形式は一行に一単語です。空行と `#` で始まる行は無視されます。

       例：
       - `SET GLOBAL validate_password_dictionary_file = 'my_dictionary.txt'`

詳細については、[ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md) を参照してください。

### LDAP による認証方式

[LDAP による認証方式](./authentication/ldap.md)を参照してください。

## 認可

### 権限に関する操作

- ユーザーの作成：[CREATE USER](../../sql-manual/sql-statements/account-management/CREATE-USER)
- ユーザーの変更：[ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)
- ユーザーの削除：[DROP USER](../../sql-manual/sql-statements/account-management/DROP-USER.md)
- 権限の付与／ロールの割り当て：[GRANT](../../sql-manual/sql-statements/account-management/GRANT-TO)
- 権限の取り消し／ロールの割り当て解除：[REVOKE](../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- ロールの作成：[CREATE ROLE](../../sql-manual/sql-statements/account-management/CREATE-ROLE.md)
- ロールの削除：[DROP ROLE](../../sql-manual/sql-statements/account-management/DROP-ROLE.md)
- ロールの変更：[ALTER ROLE](../../sql-manual/sql-statements/account-management/ALTER-ROLE.md)
- 現在のユーザーの権限とロールの確認：[SHOW GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- すべてのユーザーの権限とロールの確認：[SHOW ALL GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- 作成済みロールの確認：[SHOW ROLES](../../sql-manual/sql-statements/account-management/SHOW-ROLES.md)
- ユーザープロパティの設定：[SET PROPERTY](../../sql-manual/sql-statements/account-management/SET-PROPERTY.md)
- ユーザープロパティの確認：[SHOW PROPERTY](../../sql-manual/sql-statements/account-management/SHOW-PROPERTY.md)
- パスワードの変更：[SET PASSWORD](../../sql-manual/sql-statements/account-management/SET-PASSWORD.md)
- サポートされるすべての権限の確認：[SHOW PRIVILEGES]
- 行ポリシーの確認：[SHOW ROW POLICY]
- 行ポリシーの作成：[CREATE ROW POLICY]

### 権限の種類

Doris は現在、次の権限をサポートします。

1. `Node_priv`

    ノードを変更する権限です。FE、BE、BROKER ノードの追加、削除、オフライン化が含まれます。

    root ユーザーはデフォルトでこの権限を持ちます。`Grant_priv` と `Node_priv` の両方を持つユーザーは、この権限をほかのユーザーに付与できます。

    この権限はグローバルレベルでのみ付与できます。

2. `Grant_priv`

    権限を変更する権限です。権限の付与や取り消し、ユーザーやロールの追加、削除、変更などの操作を実行できます。

    バージョン 2.1.2 より前は、ほかのユーザーやロールに権限を付与する際、現在のユーザーは該当するレベルの `Grant_priv` だけを持っていれば十分でした。バージョン 2.1.2 以降は、付与する対象リソースに対する権限も必要です。

    ほかのユーザーにロールを割り当てるには、グローバルレベルの `Grant_priv` が必要です。

3. `Select_priv`

    データディレクトリ、データベース、テーブルを読み取る権限です。

4. `Load_priv`

    データディレクトリ、データベース、テーブルに書き込む権限です。Load、Insert、Delete などが含まれます。

5. `Alter_priv`

    データディレクトリ、データベース、テーブルを変更する権限です。ライブラリやテーブルの名前変更、列の追加・削除・変更、パーティションの追加・削除などが含まれます。

6. `Create_priv`

    データディレクトリ、データベース、テーブル、ビューを作成する権限です。

7. `Drop_priv`

    データディレクトリ、データベース、テーブル、ビューを削除する権限です。

8. `Usage_priv`

    リソースおよびワークロードグループを使用する権限です。

9. `Show_view_priv`

    `SHOW CREATE VIEW` を実行する権限です。

### 権限のレベル

#### グローバル権限

`*.*.*` のスコープを指定した GRANT ステートメントで付与する権限です。どのカタログのどのテーブルにも適用されます。

#### カタログ権限

`ctl.*.*` のスコープを指定した GRANT ステートメントで付与する権限です。指定したカタログ内のすべてのテーブルに適用されます。

#### データベース権限

`ctl.db.*` のスコープを指定した GRANT ステートメントで付与する権限です。指定したデータベース内のすべてのテーブルに適用されます。

#### テーブル権限

`ctl.db.tbl` のスコープを指定した GRANT ステートメントで付与する権限です。指定したテーブルのすべての列に適用されます。

#### 列権限

列権限は主に、テーブル内の特定の列へのユーザーアクセスを制限するために使用します。管理者は特定の列に対する閲覧や編集などの権限を設定し、列データへのアクセスと操作を制御できます。

テーブルの特定の列に対する権限は、`GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1` で付与できます。

現在、列権限でサポートされるのは `Select_priv` のみです。

#### 行レベルの権限

行ポリシーを使用すると、管理者はデータのフィールドに基づいてアクセスポリシーを定義し、各ユーザーがアクセスできる行を制御できます。

具体的には、データに格納された実際の値に基づいて行へのアクセスをフィルタリングまたは制限するルールを作成できます。

バージョン 1.2 以降、`CREATE ROW POLICY` コマンドで行レベルの権限を作成できます。

バージョン 2.1.2 以降、Apache Ranger の `Row Level Filter` による行レベルの権限設定もサポートします。

#### 利用権限

- リソース権限

    リソース権限はリソース専用に設定するもので、データベースやテーブルの権限とは無関係です。付与できるのは `Usage_priv` と `Grant_priv` のみです。

    すべてのリソースに対する権限は、`GRANT USAGE_PRIV ON RESOURCE '%' TO user1` で付与できます。

- ワークロードグループ権限

    ワークロードグループ権限はワークロードグループ専用に設定するもので、データベースやテーブルの権限とは無関係です。付与できるのは `Usage_priv` と `Grant_priv` のみです。

    すべてのワークロードグループに対する権限は、`GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1` で付与できます。

### データマスキング

データマスキングは、元のデータを変更、置換、または隠すことで機密データを保護する方法です。マスキング後のデータは一定の形式や特性を保ちながら、機密情報を含まなくなります。

たとえば、管理者はクレジットカード番号や身分証明書番号などの機密フィールドの数字の一部または全部をアスタリスク `*` などの文字に置き換えたり、実名を仮名に置き換えたりできます。

バージョン 2.1.2 以降、Apache Ranger の Data Masking によって特定の列にデータマスキングポリシーを設定できます。現在、設定には [Apache Ranger](./authorization/ranger.md) のみを使用できます。

### Doris 組み込み認可方式

Doris の権限設計は RBAC（ロールベースのアクセス制御）モデルに基づいています。ユーザーはロールに、ロールは権限に関連付けられます。ユーザーはロールを介して間接的に権限に紐付きます。

ロールを削除すると、そのロールに関連付けられていたユーザーは、そのロールのすべての権限を自動的に失います。

ユーザーとロールの関連付けを解除すると、そのユーザーはそのロールのすべての権限を自動的に失います。

ロールに権限を追加したり、ロールから権限を削除したりすると、そのロールに関連付けられたユーザーの権限もそれに応じて変わります。

```
┌────────┐        ┌────────┐         ┌────────┐
│  user1 ├────┬───►  role1 ├────┬────►  priv1 │
└────────┘    │   └────────┘    │    └────────┘
              │                 │
              │                 │
              │   ┌────────┐    │
              │   │  role2 ├────┤
┌────────┐    │   └────────┘    │    ┌────────┐
│  user2 ├────┘                 │  ┌─►  priv2 │
└────────┘                      │  │ └────────┘
                  ┌────────┐    │  │
           ┌──────►  role3 ├────┘  │
           │      └────────┘       │
           │                       │
           │                       │
┌────────┐ │      ┌────────┐       │ ┌────────┐
│  userN ├─┴──────►  roleN ├───────┴─►  privN │
└────────┘        └────────┘         └────────┘
```

上の図に示すように、

user1 と user2 は、どちらも `priv1` 権限を持ちます。この権限は `role1` を通じて付与されます。

userN は `priv1` 権限を `role3` から、`priv2` と `privN` の権限を `roleN` から取得します。したがって、userN は `priv1`、`priv2`、`privN` の権限を同時に持ちます。

ユーザーが操作しやすいように、ユーザーに権限を直接付与することもできます。内部的には、ユーザーごとに固有のデフォルトロールが作成されます。ユーザーに権限を付与することは、実質的にはそのユーザーのデフォルトロールに権限を付与することです。

デフォルトロールは削除できず、ほかのユーザーに割り当てることもできません。ユーザーを削除すると、そのデフォルトロールも自動的に削除されます。

### Apache Ranger に基づく認可方式

[Apache Ranger に基づく認可方式](./authorization/ranger.md)を参照してください。

## よくある質問

### 権限について

1. ADMIN 権限、またはグローバルレベルの GRANT 権限を持つユーザーは、次の操作を実行できます。

    - CREATE USER
    - DROP USER
    - ALTER USER
    - SHOW GRANTS
    - CREATE ROLE
    - DROP ROLE
    - ALTER ROLE
    - SHOW ROLES
    - SHOW PROPERTY FOR USER

2. GRANT/REVOKE

    - ADMIN 権限を持つユーザーは、任意のユーザーに権限を付与したり、その権限を取り消したりできます。
    - ADMIN 権限またはグローバルレベルの GRANT 権限を持つユーザーは、ユーザーにロールを割り当てられます。
    - 該当レベルの GRANT 権限と、付与する権限の両方を持つユーザーは、その権限をユーザーやロールに付与できます。

3. SET PASSWORD

    - ADMIN 権限またはグローバルレベルの GRANT 権限を持つユーザーは、root 以外のユーザーのパスワードを設定できます。
    - 一般ユーザーは、自分に対応するユーザー ID のパスワードを設定できます。対応するユーザー ID は `SELECT CURRENT_USER()` コマンドで確認できます。
    - ROOT ユーザーは自分のパスワードを変更できます。

### 補足情報

1. Doris の初期化時には、次のユーザーとロールが自動的に作成されます。

    - operator ロール：`Node_priv` と `Admin_priv` を持ちます。つまり、Doris のすべての権限を持ちます。
    - admin ロール：`Admin_priv` を持ちます。つまり、ノードの変更を除くすべての権限を持ちます。
    - root@'%'：どのノードからもログインできる root ユーザーで、operator ロールを持ちます。
    - admin@'%'：どのノードからもログインできる admin ユーザーで、admin ロールを持ちます。

2. デフォルトで作成されるユーザーやロールの削除、または権限の変更はサポートされません。
    - root@'%' と admin@'%' の削除はサポートされません。ただし、root@'xxx' と admin@'xxx' のユーザー（xxx は % 以外の任意のホストを表す）は作成・削除できます。Doris はこれらのユーザーを通常のユーザーとして扱います。
    - root@'%' と admin@'%' のデフォルトロールは取り消せません。
    - operator ロールと admin ロールは削除できません。
    - operator ロールと admin ロールの権限は変更できません。

3. operator ロールを持つユーザーは Root だけです。admin ロールを持つユーザーは複数存在できます。

4. 競合する可能性がある操作について、次に説明します。

    1. ドメインと IP の競合：

        次のユーザーを作成したとします。

        `CREATE USER user1@['domain'];`

        そして、次の権限を付与します。

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        このドメインは ip1 と ip2 の二つの IP に解決されます。

        その後、`user1@'ip1'` に別の権限を付与したとします。

        `GRANT ALTER_PRIV ON *.* TO user1@'ip1';`

        この場合、`user1@'ip1'` は Select_priv と Alter_priv の両方の権限を持ちます。その後、`user1@['domain']` の権限を再度変更しても、`user1@'ip1'` にはその変更が反映されません。

    2. IP の重複による競合：

        次のユーザーを作成したとします。

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```

        `'192.%'` は `'%'` より優先されるため、ユーザー `user1` がマシン `192.168.1.1` からパスワード `'12345'` で Doris にログインしようとすると、アクセスは拒否されます。

5. パスワードを忘れた場合

    パスワードを忘れて Doris にログインできない場合は、FE の設定ファイルに `skip_localhost_auth_check=true` を追加して FE を再起動すると、ローカルマシンからパスワードなしで root として Doris にログインできます。

    ログイン後、`SET PASSWORD` コマンドでパスワードを再設定できます。

6. root ユーザー以外は、root ユーザーのパスワードを再設定できません。

7. `Admin_priv` 権限を付与または取り消せるのはグローバルレベルのみです。

8. `current_user()` と `user()`

    ユーザーは `current_user` と `user` の値を、対応する `SELECT current_user()` と `SELECT user()` を実行して確認できます。ここで、`current_user` は認証に使用された ID を、`user` はその時点の実際のユーザー ID を表します。

    たとえば、次のようになります。

    `user1@'192.%'` を作成し、ユーザー `user1` が `192.168.10.1` からログインした場合、`current_user` は `user1@'192.%'`、`user` は `user1@'192.168.10.1'` になります。

    すべての権限は特定の `current_user` に付与され、実際のユーザーは対応する `current_user` のすべての権限を持ちます。

## ベストプラクティス

Doris の権限システムを使用する例を以下に示します。

1. シナリオ 1

   Doris クラスタのユーザーを管理者（Admin）、開発エンジニア（RD）、利用者（Client）に分けます。管理者はクラスタ全体に対するすべての権限を持ち、主にクラスタのセットアップとノード管理を担当します。開発エンジニアは、データベースやテーブルの作成、データのインポートや変更など、ビジネスモデリングを担当します。利用者はさまざまなデータベースやテーブルにアクセスしてデータを取得します。

   このシナリオでは、管理者に ADMIN または GRANT 権限を付与できます。RD には、すべてのデータベースとテーブル、または特定のデータベースとテーブルに対する CREATE、DROP、ALTER、LOAD、SELECT 権限を付与できます。Client には、すべてのデータベースとテーブル、または特定のデータベースとテーブルに対する SELECT 権限を付与できます。また、ロールを作成すると、複数のユーザーへの権限付与を簡単にできます。

2. シナリオ 2

   一つのクラスタに複数の業務があり、それぞれが一つ以上のデータセットを使用する場合があります。各業務でユーザーを管理する必要があります。このシナリオでは、管理ユーザーが各データベースに対して DATABASE レベルの GRANT 権限を持つユーザーを作成できます。このユーザーは、指定されたデータベースについてのみ、ほかのユーザーに権限を付与できます。

3. ブラックリスト

   Doris 自体はブラックリストをサポートせず、ホワイトリストのみをサポートしますが、一定の方法でブラックリストを模擬できます。`user@'192.%'` というユーザーを作成し、`192.*` からのログインを許可したとします。`192.168.10.1` からのログインを禁止したい場合は、別のユーザー `cmy@'192.168.10.1'` を新しいパスワードで作成します。`192.168.10.1` は `192.%` より優先順位が高いため、`192.168.10.1` からのユーザーは古いパスワードではログインできなくなります。
