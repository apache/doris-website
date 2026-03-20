---
{
  "title": "認証と認可",
  "language": "ja",
  "description": "Dorisのアクセス許可管理システムはMySQLのアクセス許可管理メカニズムをモデルとしています。"
}
---
Dorisの権限管理システムは、MySQLの権限管理メカニズムをモデルにしています。行および列レベルでの細かい権限制御、ロールベースのアクセス制御をサポートし、さらにホワイトリストメカニズムもサポートしています。

## 用語集

1. User Identity

   権限システム内では、ユーザーはUser Identityとして識別されます。User Identityは2つの部分から構成されます：`username`と`host`です。`username`はユーザーの名前で、英字（大文字小文字両方）で構成されます。`host`はユーザー接続の送信元IPを表します。User Identityは`username@'host'`として表現され、これは`host`からの`username`を示します。

   User Identityのもう一つの表現は`username@['domain']`で、ここで`domain`はDNSを通じて一連のIPに解決できるドメイン名を指します。最終的には、これは一連の`username@'host'`として表現されるため、今後は統一して`username@'host'`を使用して表記します。

2. Privilege

   権限はノード、データディレクトリ、データベース、またはテーブルに適用されます。異なる権限は異なる操作許可を表します。

3. Role

   Dorisではカスタム名のロールを作成できます。ロールは権限の集合として見ることができます。新しく作成されたユーザーにはロールを割り当てることができ、そのロールの権限を自動的に継承します。その後のロールの権限変更は、そのロールに関連付けられたすべてのユーザーの権限にも反映されます。

4. User Property

   ユーザープロパティはUser Identityではなく、ユーザーに直接関連付けられます。つまり、`user@'192.%'`と`user@['domain']`の両方が同じユーザープロパティセットを共有し、これらは`user@'192.%'`や`user@['domain']`ではなく、ユーザー`user`に属します。

   ユーザープロパティには以下が含まれますが、これらに限定されません：ユーザーの最大接続数、インポートクラスター設定など。

## 認証と認可フレームワーク

ユーザーがApache Dorisにログインするプロセスは2つの部分に分かれます：**認証**と**認可**。

- 認証：ユーザーが提供した資格情報（ユーザー名、クライアントIP、パスワードなど）に基づいて身元確認を行います。確認後、個別のユーザーはシステム定義のUser Identityにマッピングされます。
- 認可：取得したUser Identityに基づいて、そのUser Identityに関連付けられた権限に従って、ユーザーが意図した操作に必要な権限を持っているかをチェックします。

## 認証

Dorisは組み込み認証スキームとLDAP認証をサポートしています。

### Doris組み込み認証スキーム

認証はDoris自体に保存されたユーザー名、パスワード、その他の情報に基づいています。

管理者は`CREATE USER`コマンドでユーザーを作成し、`SHOW ALL GRANTS`コマンドで作成されたすべてのユーザーを表示します。

ユーザーがログインする際、システムはユーザー名、パスワード、クライアントIPアドレスが正しいかを検証します。

#### パスワードポリシー

Dorisは以下のパスワードポリシーをサポートして、ユーザーのより良いパスワード管理を支援します。

1. `PASSWORD_HISTORY`

    ユーザーが現在のパスワードをリセットする際に履歴パスワードを再利用できるかを決定します。例えば、`PASSWORD_HISTORY 10`は過去10個のパスワードを新しいパスワードとして再利用できないことを意味します。`PASSWORD_HISTORY DEFAULT`を設定するとグローバル変数`PASSWORD_HISTORY`の値を使用します。0に設定するとこの機能を無効にします。デフォルトは0です。

    例：

    - グローバル変数の設定：`SET GLOBAL password_history = 10`
    - ユーザーに対する設定：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

2. `PASSWORD_EXPIRE`

    現在のユーザーのパスワードの有効期限を設定します。例えば、`PASSWORD_EXPIRE INTERVAL 10 DAY`はパスワードが10日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER`はパスワードが期限切れにならないことを示します。`PASSWORD_EXPIRE DEFAULT`を設定するとグローバル変数`default_password_lifetime`（日数）の値を使用します。デフォルトはNEVER（または0）で、期限切れにならないことを示します。

    例：

    - グローバル変数の設定：`SET GLOBAL default_password_lifetime = 1`
    - ユーザーに対する設定：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

3. `FAILED_LOGIN_ATTEMPTS`と`PASSWORD_LOCK_TIME`

    ユーザーアカウントがロックされるまでのパスワード間違い回数とロック期間を設定します。例えば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`は3回間違ったログインがあった場合、アカウントが1日間ロックされることを意味します。管理者は`ALTER USER`文を使用してアカウントのロックを解除できます。

    例：

    - ユーザーに対する設定：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

4. パスワード強度

    これはグローバル変数`validate_password_policy`によって制御されます。デフォルトは`NONE/0`で、パスワード強度チェックを行わないことを意味します。`STRONG/2`に設定すると、パスワードは大文字、小文字、数字、特殊文字のうち少なくとも3つを含み、8文字以上である必要があります。

    例：

    - `SET validate_password_policy=STRONG`

    Doris 4.0.4以降、パスワード強度検証ポリシーは以下のように強化されました：

    1. `validate_password_policy`が`STRONG/2`に設定されている場合、パスワードは従来の「4つのうち3つ」の要件ではなく、**4つの文字タイプすべて**（大文字、小文字、数字、特殊文字）を含む必要があります。

    2. **辞書単語チェック**が追加されました：パスワードには一般的な脆弱な単語（password、admin、test、rootなど）を含むことができません。システムには一般的な脆弱単語の組み込み辞書が含まれており、これらの単語を含むパスワードは拒否されます。

    3. **カスタム辞書ファイル**のサポート：グローバル変数`validate_password_dictionary_file`を使用してカスタム辞書ファイル名を指定できます。辞書ファイルは`${DORIS_HOME}/plugins/security/`ディレクトリに配置する必要があります。ファイル形式は1行に1つの単語で、空行と`#`で始まる行は無視されます。

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
- 権限取り消し/ロール剥奪：[REVOKE](../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
- ロール作成：[CREATE ROLE](../../sql-manual/sql-statements/account-management/CREATE-ROLE.md)
- ロール削除：[DROP ROLE](../../sql-manual/sql-statements/account-management/DROP-ROLE.md)
- ロール変更：[ALTER ROLE](../../sql-manual/sql-statements/account-management/ALTER-ROLE.md)
- 現在のユーザーの権限とロールを表示：[SHOW GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- すべてのユーザーの権限とロールを表示：[SHOW ALL GRANTS](../../sql-manual/sql-statements/account-management/SHOW-GRANTS.md)
- 作成されたロールを表示：[SHOW ROLES](../../sql-manual/sql-statements/account-management/SHOW-ROLES.md)
- ユーザープロパティ設定：[SET PROPERTY](../../sql-manual/sql-statements/account-management/SET-PROPERTY.md)
- ユーザープロパティ表示：[SHOW PROPERTY](../../sql-manual/sql-statements/account-management/SHOW-PROPERTY.md)
- パスワード変更：[SET PASSWORD](../../sql-manual/sql-statements/account-management/SET-PASSWORD.md)
- サポートされているすべての権限を表示：[SHOW PRIVILEGES]
- 行ポリシーを表示：[SHOW ROW POLICY]
- 行ポリシーを作成：[CREATE ROW POLICY]

### 権限の種類

Dorisは現在以下の権限をサポートしています：

1. `Node_priv`

    ノード変更権限。FE、BE、BROKERノードの追加、削除、オフライン化を含みます。

    Rootユーザーはデフォルトでこの権限を持ちます。`Grant_priv`と`Node_priv`の両方を持つユーザーは、この権限を他のユーザーに付与できます。

    この権限はGlobalレベルでのみ付与できます。

2. `Grant_priv`

    権限変更権限。権限の付与、取り消し、ユーザー/ロールの追加/削除/変更などの操作の実行を許可します。

    バージョン2.1.2より前は、他のユーザー/ロールに権限を付与する際、現在のユーザーはそれぞれのレベルの`Grant_priv`権限のみが必要でした。バージョン2.1.2以降、現在のユーザーは付与したいリソースに対する権限も必要になります。

    他のユーザーにロールを割り当てる際は、Globalレベルの`Grant_priv`権限が必要です。

3. `Select_priv`

    データディレクトリ、データベース、テーブルの読み取り専用権限。

4. `Load_priv`

    データディレクトリ、データベース、テーブルの書き込み権限。Load、Insert、Deleteなどを含みます。

5. `Alter_priv`

    データディレクトリ、データベース、テーブルの変更権限。データベース/テーブルの名前変更、列の追加/削除/変更、パーティションの追加/削除などを含みます。

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

`*.*.*`スコープでGRANT文を通じて付与される権限。これらの権限は任意のカタログ内の任意のテーブルに適用されます。

#### カタログ権限

`ctl.*.*`スコープでGRANT文を通じて付与される権限。これらの権限は指定されたカタログ内の任意のテーブルに適用されます。

#### Database権限

`ctl.db.*`スコープでGRANT文を通じて付与される権限。これらの権限は指定されたデータベース内の任意のテーブルに適用されます。

#### table権限

`ctl.db.tbl`スコープでGRANT文を通じて付与される権限。これらの権限は指定されたテーブル内の任意の列に適用されます。

#### Column権限

列権限は主にテーブル内の特定の列へのユーザーアクセスを制限するために使用されます。具体的には、列権限により管理者は特定の列に対する表示、編集、その他の権利を設定し、特定の列データへのユーザーアクセスと操作を制御できます。

テーブルの特定の列に対する権限は`GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`で付与できます。

現在、列権限は`Select_priv`のみをサポートしています。

#### 行レベル権限

Row Policiesにより、管理者はデータ内のフィールドに基づいてアクセスポリシーを定義し、どのユーザーがどの行にアクセスできるかを制御できます。

具体的には、Row Policiesにより管理者はデータに実際に保存されている値に基づいて行へのユーザーアクセスをフィルタリングまたは制限できるルールを作成できます。

バージョン1.2より、`CREATE ROW POLICY`コマンドで行レベル権限を作成できます。

バージョン2.1.2より、Apache Rangerの`Row Level Filter`を通じて行レベル権限を設定することがサポートされています。

#### Usage権限

- Resource権限

    Resource権限はResourcesに特化して設定され、データベースやテーブルの権限とは無関係で、`Usage_priv`と`Grant_priv`のみを割り当てることができます。

    すべてのResourcesに対する権限は`GRANT USAGE_PRIV ON RESOURCE '%' TO user1`で付与できます。

- Workload Group権限

    Workload Group権限はWorkload Groupsに特化して設定され、データベースやテーブルの権限とは無関係で、`Usage_priv`と`Grant_priv`のみを割り当てることができます。

    すべてのWorkload Groupsに対する権限は`GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`で付与できます。

### データマスキング

データマスキングは、元のデータを変更、置換、または隠すことで機密データを保護する方法で、マスクされたデータが特定の形式と特性を保持しながら、機密情報を含まないようにします。

例えば、管理者はクレジットカード番号やID番号などの機密フィールドの数字の一部またはすべてをアスタリスク`*`または他の文字で置き換える、または実名を仮名で置き換えることを選択できます。

バージョン2.1.2より、Apache RangerのData Maskingを通じて特定の列にデータマスキングポリシーを設定することがサポートされており、現在は[Apache Ranger](./ranger.md)を通じてのみ設定可能です。

### Doris組み込み認可スキーム

Dorisの権限設計はRBAC（Role-Based Access Control）モデルに基づいており、ユーザーはロールと関連付けられ、ロールは権限と関連付けられます。ユーザーはロールを通じて間接的に権限とリンクされます。

ロールが削除されると、ユーザーは自動的にそのロールに関連付けられたすべての権限を失います。

ユーザーがロールから切り離されると、自動的にそのロールのすべての権限を失います。

ロールに権限が追加または削除されると、そのロールに関連付けられたユーザーの権限が相応に変更されます。

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
上記に示すように：

User1とuser2は両方とも`role1`を通して権限`priv1`を持っています。

UserNは`role3`を通して権限`priv1`を、`roleN`を通して権限`priv2`と`privN`を持っています。したがって、userNは同時に権限`priv1`、`priv2`、`privN`を持っています。

ユーザー操作の利便性のため、ユーザーに直接権限を付与することが可能です。内部的には、各ユーザーに対して一意のデフォルトロールが作成されます。ユーザーに権限が付与される際、実質的にはユーザーのデフォルトロールに権限を付与していることになります。

デフォルトロールは削除できず、他の誰かに割り当てることもできません。ユーザーが削除されると、そのデフォルトロールも自動的に削除されます。

### Apache Rangerベースの認可スキーム

[Apache Rangerベースの認可スキーム](./ranger.md)を参照してください。

## よくある質問

### 権限の説明

1. ADMIN特権またはGLOBALレベルのGRANT特権を持つユーザーは、以下の操作を実行できます：

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

    - ADMIN特権を持つユーザーは、任意のユーザーの権限を付与または取り消すことができます。
    - ADMINまたはGLOBALレベルのGRANT特権を持つユーザーは、ユーザーにロールを割り当てることができます。
    - 対応するレベルのGRANT特権と割り当てる権限を持つユーザーは、それらの権限をユーザー/ロールに配布できます。

3. SET PASSWORD

    - ADMIN特権またはGLOBALレベルのGRANT特権を持つユーザーは、rootでないユーザーのパスワードを設定できます。
    - 一般ユーザーは、対応するUser Identityのパスワードを設定できます。対応するUser Identityは`SELECT CURRENT_USER()`コマンドで確認できます。
    - ROOTユーザーは自分のパスワードを変更できます。

### 追加情報

1. Dorisが初期化されると、以下のユーザーとロールが自動的に作成されます：

    - operatorロール：このロールは`Node_priv`と`Admin_priv`、つまりDorisのすべての権限を持ちます。
    - adminロール：このロールは`Admin_priv`、つまりノード変更を除くすべての権限を持ちます。
    - root@'%'：rootユーザー、任意のノードからのログインが許可され、operatorロールを持ちます。
    - admin@'%'：adminユーザー、任意のノードからのログインが許可され、adminロールを持ちます。

2. デフォルトで作成されたユーザー、ロール、またはユーザーの権限の削除や変更はサポートされていません。
    - ユーザーroot@'%'およびadmin@'%'の削除はサポートされていませんが、root@'xxx'およびadmin@'xxx'ユーザー（xxxは%以外の任意のホストを指す）の作成と削除は許可されています（Dorisはこれらのユーザーを通常のユーザーとして扱います）。
    - root@'%'およびadmin@'%'のデフォルトロールの取り消しはサポートされていません。
    - ロールoperatorおよびadminの削除はサポートされていません。
    - ロールoperatorおよびadminの権限の変更はサポートされていません。

3. operatorロールを持つユーザーはRootのみです。adminロールを持つユーザーは複数存在できます。

4. 潜在的に競合する操作については以下のように説明されます：

    1. ドメインとIPの競合：

        以下のユーザーが作成されたとします：

        `CREATE USER user1@['domain'];`

        そして権限が付与されました：

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        このドメインはip1とip2の2つのIPに解決されます。

        後で、`user1@'ip1'`に別の権限を付与したとします：

        `GRANT ALTER_PRIV ON . TO user1@'ip1';`

        すると`user1@'ip1'`はSelect_privとAlter_privの両方の権限を持つことになります。そして`user1@['domain']`の権限を再度変更しても、`user1@'ip1'`はその変更に従いません。

    2. 重複IPの競合：

        以下のユーザーが作成されたとします：

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```
優先度に関して、`'192.%'` は `'%'` より優先されるため、マシン `192.168.1.1` からのユーザー `user1` がパスワード `'12345'` を使用してDorisにログインしようとすると、アクセスが拒否されます。

5. パスワードを忘れた場合

    パスワードを忘れてDorisにログインできない場合、FEの設定ファイルに `skip_localhost_auth_check=true` を追加してFEを再起動することで、ローカルマシンからパスワードなしでrootとしてDorisにログインできます。

    ログイン後、`SET PASSWORD` コマンドを使用してパスワードをリセットできます。

6. rootユーザー自身を除き、誰もrootユーザーのパスワードをリセットできません。

7. `Admin_priv` 権限は、GLOBALレベルでのみ付与または取り消すことができます。

8. `current_user()` と `user()`

    ユーザーは `SELECT current_user()` と `SELECT user()` をそれぞれ実行することで、自分の `current_user` と `user` を確認できます。ここで、`current_user` はユーザーが認証されたアイデンティティを示し、`user` は現在の実際のUser Identityです。

    例：

    `user1@'192.%'` が作成され、その後ユーザー `user1` が `192.168.10.1` からログインした場合、`current_user` は `user1@'192.%'` となり、`user` は `user1@'192.168.10.1'` となります。

    すべての権限は特定の `current_user` に付与され、実際のユーザーは対応する `current_user` のすべての権限を持ちます。

## ベストプラクティス

以下は、Doris権限システムの使用例です。

1. シナリオ1

   Dorisクラスターのユーザーは、管理者（Admin）、開発エンジニア（RD）、ユーザー（Client）に分類されます。管理者はクラスター全体に対するすべての権限を持ち、主にクラスターのセットアップとノード管理を担当します。開発エンジニアは、データベースとテーブルの作成、インポート、データの変更を含むビジネスモデリングを担当します。ユーザーは異なるデータベースとテーブルにアクセスしてデータを取得します。

   このシナリオでは、管理者にはADMINまたはGRANT権限を付与できます。RDには任意または特定のデータベースとテーブルに対するCREATE、DROP、ALTER、LOAD、SELECT権限を付与できます。ClientsにはCREATE、DROP、ALTER、LOAD、SELECT権限を付与できます。さらに、複数のユーザーの認可プロセスを簡素化するために、異なるロールを作成できます。

2. シナリオ2

   クラスターには複数のビジネスが含まれ、それぞれが1つ以上のデータセットを使用する可能性があります。各ビジネスはそのユーザーを管理する必要があります。このシナリオでは、管理ユーザーは各データベースに対してDATABASEレベルのGRANT権限を持つユーザーを作成できます。このユーザーは、指定されたデータベースのユーザーのみを認可できます。

3. ブラックリスト

   Doris自体はブラックリストをサポートしておらず、ホワイトリストのみをサポートしていますが、特定の手段を通じてブラックリストをシミュレートできます。`user@'192.%'` という名前のユーザーが作成され、`192.*` からのユーザーのログインを許可するとします。`192.168.10.1` からのユーザーのログインを禁止したい場合、新しいパスワードで別のユーザー `cmy@'192.168.10.1'` を作成できます。`192.168.10.1` は `192.%` より高い優先度を持つため、`192.168.10.1` からのユーザーは古いパスワードでログインできなくなります。
