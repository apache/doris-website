---
{
  "title": "認証と認可",
  "language": "ja",
  "description": "DorisのPermission管理システムは、MySQLのPermission管理メカニズムをモデルにしています。"
}
---
Dorisの権限管理システムはMySQLの権限管理メカニズムをモデルとしています。行およびカラムレベルでのきめ細かい権限制御、ロールベースアクセス制御をサポートし、また、ホワイトリストメカニズムもサポートしています。

## 用語集

1. ユーザーアイデンティティ

   権限システム内では、ユーザーはUser Identityとして識別されます。User Identityは`username`と`host`の2つの部分で構成されます。`username`はユーザーの名前で、英字（大文字小文字）から構成されます。`host`はユーザー接続の送信元IPを表します。User Identityは`username@'host'`と表され、`host`からの`username`を示します。

   User Identityのもう一つの表現は`username@['domain']`で、ここで`domain`はDNSを通じて一連のIPに解決できるドメイン名を指します。最終的には、これは`username@'host'`の集合として表されるため、今後は統一して`username@'host'`を使用してそれを示します。

2. 権限

   権限はノード、データディレクトリ、データベース、またはテーブルに適用されます。異なる権限は異なる操作許可を表します。

3. ロール

   Dorisではカスタム名でのロール作成が可能です。ロールは権限の集合として見ることができます。新しく作成されたユーザーにはロールを割り当てることができ、そのロールの権限を自動的に継承します。その後のロールの権限変更は、そのロールに関連付けられたすべてのユーザーの権限にも反映されます。

4. ユーザープロパティ

   ユーザープロパティはUser Identityではなく、ユーザーに直接関連付けられます。つまり、`user@'192.%'`と`user@['domain']`の両方が同じユーザープロパティセットを共有し、これらは`user@'192.%'`や`user@['domain']`ではなく、ユーザー`user`に属します。

   ユーザープロパティには、ユーザー接続の最大数、インポートクラスター設定などが含まれますが、これらに限定されません。

## 認証と認可のフレームワーク

ユーザーがApache Dorisにログインするプロセスは、**認証**と**認可**の2つの部分に分かれています。

- 認証：ユーザーが提供した認証情報（ユーザー名、クライアントIP、パスワードなど）に基づいて身元確認を行います。確認されると、個々のユーザーはシステム定義のUser Identityにマッピングされます。
- 認可：取得したUser Identityに基づいて、そのUser Identityに関連付けられた権限に従って、ユーザーが意図した操作に必要な権限を持っているかどうかをチェックします。

## 認証

Dorisは組み込み認証スキームとLDAP認証をサポートしています。

### Doris組み込み認証スキーム

認証はDoris自体に保存されているユーザー名、パスワード、およびその他の情報に基づいています。

管理者は`CREATE USER`コマンドでユーザーを作成し、`SHOW ALL GRANTS`コマンドで作成されたすべてのユーザーを表示します。

ユーザーがログインすると、システムはユーザー名、パスワード、およびクライアントIPアドレスが正しいかどうかを検証します。

#### パスワードポリシー

Dorisは、ユーザーがより良いパスワード管理を行うのを支援するため、以下のパスワードポリシーをサポートしています。

1. `PASSWORD_HISTORY`

    現在のパスワードをリセットする際に、ユーザーが過去のパスワードを再利用できるかどうかを決定します。例えば、`PASSWORD_HISTORY 10`は過去10個のパスワードを新しいパスワードとして再利用できないことを意味します。`PASSWORD_HISTORY DEFAULT`を設定すると、グローバル変数`PASSWORD_HISTORY`の値を使用します。0に設定するとこの機能を無効にします。デフォルトは0です。

    例：

    - グローバル変数を設定：`SET GLOBAL password_history = 10`
    - ユーザーに設定：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

2. `PASSWORD_EXPIRE`

    現在のユーザーのパスワードの有効期限を設定します。例えば、`PASSWORD_EXPIRE INTERVAL 10 DAY`はパスワードが10日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER`はパスワードが期限切れにならないことを示します。`PASSWORD_EXPIRE DEFAULT`を設定すると、グローバル変数`default_password_lifetime`（日数）の値を使用します。デフォルトはNEVER（または0）で、期限切れにならないことを示します。

    例：

    - グローバル変数を設定：`SET GLOBAL default_password_lifetime = 1`
    - ユーザーに設定：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

3. `FAILED_LOGIN_ATTEMPTS`と`PASSWORD_LOCK_TIME`

    ユーザーアカウントがロックされるまでの誤ったパスワード試行回数を設定し、ロック期間を設定します。例えば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`は3回の誤ったログインがあるとアカウントが1日間ロックされることを意味します。管理者は`ALTER USER`ステートメントを使用してアカウントのロックを解除できます。

    例：

    - ユーザーに設定：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

4. パスワード強度

    これはグローバル変数`validate_password_policy`によって制御されます。デフォルトは`NONE/0`で、パスワード強度チェックが行われないことを意味します。`STRONG/2`に設定すると、パスワードは大文字、小文字、数字、特殊文字のうち少なくとも3つを含む必要があり、少なくとも8文字の長さが必要です。

    例：

    - `SET validate_password_policy=STRONG`

    Doris 4.0.4以降、パスワード強度検証ポリシーは以下のように強化されています：

    1. `validate_password_policy`が`STRONG/2`に設定されている場合、パスワードは以前の「4つのうち3つ」の要件ではなく、**4つすべての文字種類**（大文字、小文字、数字、特殊文字）を含む必要があります。

    2. **辞書単語チェック**を追加：パスワードは一般的な弱い単語（password、admin、test、rootなど）を含むことができません。システムには一般的な弱い単語の組み込み辞書が含まれており、これらの単語を含むパスワードは拒否されます。

    3. **カスタム辞書ファイル**のサポート：グローバル変数`validate_password_dictionary_file`を介してカスタム辞書ファイル名を指定できます。辞書ファイルは`${DORIS_HOME}/plugins/security/`ディレクトリに配置する必要があります。ファイル形式は1行に1単語です。空行と`#`で始まる行は無視されます。

       例：
       - `SET GLOBAL validate_password_dictionary_file = 'my_dictionary.txt'`

詳細については、[ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)を参照してください。

### LDAPベース認証スキーム

[LDAPベース認証スキーム](./ldap.md)を参照してください。

## 認可

### 権限操作

- ユーザー作成：[CREATE USER](../../sql-manual/sql-statements/account-management/CREATE-USER)
- ユーザー変更：[ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)
- ユーザー削除：[DROP USER](../../sql-manual/sql-statements/account-management/DROP-USER.md)
- 権限付与/ロール割り当て：[GRANT](../../sql-manual/sql-statements/account-management/GRANT-TO)
- 権限取り消し/ロール取り消し：[REVOKE](../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- ロール作成：[CREATE ROLE](../../sql-manual/sql-statements/account-management/CREATE-ROLE.md)
- ロール削除：[DROP ROLE](../../sql-manual/sql-statements/account-management/DROP-ROLE.md)
- ロール変更：[ALTER ROLE](../../sql-manual/sql-statements/account-management/ALTER-ROLE.md)
- 現在のユーザーの権限とロールを表示：[SHOW GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- すべてのユーザーの権限とロールを表示：[SHOW ALL GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- 作成されたロールを表示：[SHOW ROLES](../../sql-manual/sql-statements/account-management/SHOW-ROLES.md)
- ユーザープロパティを設定：[SET PROPERTY](../../sql-manual/sql-statements/account-management/SET-PROPERTY.md)
- ユーザープロパティを表示：[SHOW PROPERTY](../../sql-manual/sql-statements/account-management/SHOW-PROPERTY.md)
- パスワード変更：[SET PASSWORD](../../sql-manual/sql-statements/account-management/SET-PASSWORD.md)
- サポートされているすべての権限を表示：[SHOW PRIVILEGES]
- 行ポリシーを表示：[SHOW ROW POLICY]
- 行ポリシーを作成：[CREATE ROW POLICY]

### 権限の種類

Dorisは現在、以下の権限をサポートしています：

1. `Node_priv`

    ノード変更権限。FE、BE、BROKERノードの追加、削除、オフライン化を含みます。

    rootユーザーはデフォルトでこの権限を持ちます。`Grant_priv`と`Node_priv`の両方を持つユーザーは、この権限を他のユーザーに付与できます。

    この権限はGlobalレベルでのみ付与できます。

2. `Grant_priv`

    権限変更権限。権限の付与、取り消し、ユーザー/ロールの追加/削除/変更を含む操作の実行を許可します。

    バージョン2.1.2以前では、他のユーザー/ロールに権限を付与する際、現在のユーザーは該当レベルの`Grant_priv`権限のみが必要でした。バージョン2.1.2以降、現在のユーザーは付与したいリソースの権限も必要です。

    他のユーザーにロールを割り当てる場合、Globalレベルの`Grant_priv`権限が必要です。

3. `Select_priv`

    データディレクトリ、データベース、テーブルの読み取り専用権限。

4. `Load_priv`

    データディレクトリ、データベース、テーブルの書き込み権限。Load、Insert、Deleteなどを含みます。

5. `Alter_priv`

    データディレクトリ、データベース、テーブルの変更権限。ライブラリ/テーブルの名前変更、カラムの追加/削除/変更、パーティションの追加/削除などを含みます。

6. `Create_priv`

    データディレクトリ、データベース、テーブル、ビューの作成権限。

7. `Drop_priv`

    データディレクトリ、データベース、テーブル、ビューの削除権限。

8. `Usage_priv`

    ResourcesとWorkload Groupsの使用権限。

9. `Show_view_priv`

    `SHOW CREATE VIEW`の実行権限。

### 権限レベル

#### Global権限

`*.*.*`スコープでのGRANTステートメントを通じて付与される権限。これらの権限は任意のカタログ内の任意のテーブルに適用されます。

#### Catalog権限

`ctl.*.*`スコープでのGRANTステートメントを通じて付与される権限。これらの権限は指定されたカタログ内の任意のテーブルに適用されます。

#### Database権限

`ctl.db.*`スコープでのGRANTステートメントを通じて付与される権限。これらの権限は指定されたデータベース内の任意のテーブルに適用されます。

#### Table権限

`ctl.db.tbl`スコープでのGRANTステートメントを通じて付与される権限。これらの権限は指定されたテーブル内の任意のカラムに適用されます。

#### Column権限

カラム権限は主にテーブル内の特定のカラムへのユーザーアクセスを制限するために使用されます。具体的には、カラム権限により管理者は特定のカラムの表示、編集、その他の権利を設定し、ユーザーの特定のカラムデータへのアクセスと操作を制御できます。

テーブルの特定のカラムの権限は`GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`で付与できます。

現在、カラム権限は`Select_priv`のみをサポートしています。

#### 行レベル権限

Row Policiesにより管理者はデータ内のフィールドに基づいてアクセスポリシーを定義し、どのユーザーがどの行にアクセスできるかを制御できます。

具体的には、Row Policiesにより管理者はデータに実際に保存されている値に基づいてユーザーの行へのアクセスをフィルタリングまたは制限できるルールを作成できます。

バージョン1.2から、`CREATE ROW POLICY`コマンドで行レベル権限を作成できます。

バージョン2.1.2から、Apache Rangerの`Row Level Filter`を通じた行レベル権限の設定をサポートしています。

#### Usage権限

- Resource権限

    Resource権限はResourcesに対して特別に設定され、データベースやテーブルの権限とは無関係で、`Usage_priv`と`Grant_priv`のみを割り当てることができます。

    すべてのResourcesの権限は`GRANT USAGE_PRIV ON RESOURCE '%' TO user1`で付与できます。

- Workload Group権限

    Workload Group権限はWorkload Groupsに対して特別に設定され、データベースやテーブルの権限とは無関係で、`Usage_priv`と`Grant_priv`のみを割り当てることができます。

    すべてのWorkload Groupsの権限は`GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`で付与できます。

### データマスキング

データマスキングは、元のデータを変更、置換、または隠すことで機密データを保護する方法で、マスクされたデータが特定の形式と特性を保持しながら、機密情報を含まないようにします。

例えば、管理者はクレジットカード番号やID番号などの機密フィールドの数字の一部またはすべてをアスタリスク`*`や他の文字に置き換えたり、実名を仮名に置き換えることを選択できます。

バージョン2.1.2から、Apache RangerのData Maskingを通じて特定のカラムのデータマスキングポリシーの設定をサポートしています。現在は[Apache Ranger](./ranger.md)を介してのみ設定可能です。

### Doris組み込み認可スキーム

Dorisの権限設計はRBAC（Role-Based Access Control）モデルに基づいており、ユーザーはロールに関連付けられ、ロールは権限に関連付けられます。ユーザーはロールを通じて間接的に権限とリンクされます。

ロールが削除されると、ユーザーは自動的にそのロールに関連付けられたすべての権限を失います。

ユーザーがロールから関連付けを解除されると、自動的にそのロールのすべての権限を失います。

ロールに権限が追加または削除されると、そのロールに関連付けられたユーザーの権限も相応に変化します。

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
上記の通り：

User1とuser2は両方とも`role1`を通じて権限`priv1`を持っています。

UserNは`role3`を通じて権限`priv1`を、`roleN`を通じて権限`priv2`と`privN`を持っています。したがって、userNは権限`priv1`、`priv2`、`privN`を同時に持っています。

ユーザー操作の利便性のため、ユーザーに直接権限を付与することが可能です。内部的には、各ユーザーに対して固有のデフォルトロールが作成されます。ユーザーに権限が付与される際、実質的にはそのユーザーのデフォルトロールに権限を付与していることになります。

デフォルトロールは削除することも、他の誰かに割り当てることもできません。ユーザーが削除されると、そのデフォルトロールも自動的に削除されます。

### Apache Rangerベースの認可スキーム

[Apache Rangerベースの認可スキーム](./ranger.md)を参照してください。

## よくある質問

### 権限の説明

1. ADMIN権限またはGLOBALレベルでGRANT権限を持つユーザーは、以下の操作を実行できます：

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

    - ADMIN権限を持つユーザーは、任意のユーザーに対して権限を付与または取り消すことができます。
    - ADMINまたはGLOBALレベルのGRANT権限を持つユーザーは、ユーザーにロールを割り当てることができます。
    - 対応するレベルのGRANT権限と割り当てられる権限を持つユーザーは、それらの権限をユーザー/ロールに配布できます。

3. SET PASSWORD

    - ADMIN権限またはGLOBALレベルのGRANT権限を持つユーザーは、非rootユーザーのパスワードを設定できます。
    - 一般ユーザーは、対応するUser Identityのパスワードを設定できます。対応するUser Identityは`SELECT CURRENT_USER()`コマンドで確認できます。
    - ROOTユーザーは自分のパスワードを変更できます。

### 追加情報

1. Dorisが初期化される際、以下のユーザーとロールが自動的に作成されます：

    - operatorロール：このロールは`Node_priv`と`Admin_priv`を持ち、つまりDorisの全権限を持ちます。
    - adminロール：このロールは`Admin_priv`を持ち、つまりノード変更以外の全権限を持ちます。
    - root@'%'：rootユーザー、任意のノードからログイン可能、operatorロールを持ちます。
    - admin@'%'：adminユーザー、任意のノードからログイン可能、adminロールを持ちます。

2. デフォルトで作成されたユーザー、ロール、またはユーザーの削除や権限変更はサポートされていません。
    - ユーザーroot@'%'とadmin@'%'の削除はサポートされていませんが、root@'xxx'とadmin@'xxx'ユーザー（xxxは%以外の任意のホストを指します）の作成と削除は許可されています（Dorisはこれらのユーザーを通常のユーザーとして扱います）。
    - root@'%'とadmin@'%'のデフォルトロールの取り消しはサポートされていません。
    - ロールoperatorとadminの削除はサポートされていません。
    - ロールoperatorとadminの権限変更はサポートされていません。

3. operatorロールを持つユーザーはRootのみです。adminロールを持つユーザーは複数存在できます。

4. 潜在的に競合する可能性のある操作について以下で説明します：

    1. ドメインとIPの競合：

        以下のユーザーが作成されたとします：

        `CREATE USER user1@['domain'];`

        そして権限を付与：

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        このドメインは2つのIP、ip1とip2に解決されます。

        後で`user1@'ip1'`に別の権限を付与したとします：

        `GRANT ALTER_PRIV ON . TO user1@'ip1';`

        この場合、`user1@'ip1'`はSelect_privとAlter_privの両方の権限を持つことになります。そして`user1@['domain']`の権限を再度変更しても、`user1@'ip1'`はその変更に従いません。

    2. 重複するIPの競合：

        以下のユーザーが作成されたとします：

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```
優先度に関しては、`'192.%'` は `'%'` よりも優先されるため、マシン `192.168.1.1` からユーザー `user1` がパスワード `'12345'` を使用してDorisにログインしようとすると、アクセスは拒否されます。

5. パスワードを忘れた場合

    パスワードを忘れてDorisにログインできない場合、FEの設定ファイルに `skip_localhost_auth_check=true` を追加してFEを再起動することで、ローカルマシンからパスワードなしでrootとしてDorisにログインできます。

    ログイン後、`SET PASSWORD` コマンドを使用してパスワードをリセットできます。

6. rootユーザー自身を除いて、どのユーザーもrootユーザーのパスワードをリセットできません。

7. `Admin_priv` 権限はGLOBALレベルでのみ付与または取り消しできます。

8. `current_user()` と `user()`

    ユーザーは、それぞれ `SELECT current_user()` と `SELECT user()` を実行することで、自分の `current_user` と `user` を確認できます。ここで、`current_user` はユーザーが認証された身元を示し、`user` は現時点での実際のUser Identityです。

    例えば：

    `user1@'192.%'` が作成され、その後ユーザー `user1` が `192.168.10.1` からログインしたとします。この場合、`current_user` は `user1@'192.%'` となり、`user` は `user1@'192.168.10.1'` となります。

    すべての権限は特定の `current_user` に対して付与され、実際のユーザーは対応する `current_user` のすべての権限を持ちます。

## ベストプラクティス

以下は、Doris権限システムの使用例です。

1. シナリオ1

   Dorisクラスターのユーザーは、管理者（Admin）、開発エンジニア（RD）、およびユーザー（Client）に分類されます。管理者はクラスター全体に対するすべての権限を持ち、主にクラスターのセットアップとノード管理を担当します。開発エンジニアはビジネスモデリングを担当し、データベースやテーブルの作成、インポート、データの変更を行います。ユーザーは異なるデータベースやテーブルにアクセスしてデータを取得します。

   このシナリオでは、管理者にはADMINまたはGRANT権限を付与できます。RDには、任意の、または特定のデータベースやテーブルに対するCREATE、DROP、ALTER、LOAD、SELECT権限を付与できます。Clientには、任意の、または特定のデータベースやテーブルに対するSELECT権限を付与できます。さらに、複数のユーザーの認可プロセスを簡素化するため、異なるロールを作成できます。

2. シナリオ2

   クラスターには複数のビジネスが含まれる可能性があり、それぞれが1つ以上のデータセットを使用する可能性があります。各ビジネスは独自のユーザーを管理する必要があります。このシナリオでは、管理ユーザーが各データベースに対してDATABASEレベルのGRANT権限を持つユーザーを作成できます。このユーザーは、指定されたデータベースに対してのみユーザーを認可できます。

3. ブラックリスト

   Doris自体はブラックリストをサポートしておらず、ホワイトリストのみをサポートしていますが、特定の手段を通じてブラックリストをシミュレートできます。`user@'192.%'` という名前のユーザーが作成され、`192.*` からのユーザーのログインを許可しているとします。`192.168.10.1` からのユーザーのログインを禁止したい場合、新しいパスワードで別のユーザー `cmy@'192.168.10.1'` を作成できます。`192.168.10.1` は `192.%` よりも優先度が高いため、`192.168.10.1` からのユーザーは古いパスワードでログインできなくなります。
