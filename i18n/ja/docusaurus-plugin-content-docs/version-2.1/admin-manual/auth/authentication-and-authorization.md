---
{
  "title": "認証と認可",
  "language": "ja",
  "description": "DorisのPermission Management SystemはMySQLのPermission Management Mechanismをモデルにしています。"
}
---
Doris権限管理システムは、MySQL権限管理メカニズムをモデルとしています。行レベル・カラムレベルでの細かい権限制御、ロールベースアクセス制御をサポートし、また、ホワイトリストメカニズムもサポートしています。

## 用語集

1. User Identity

   権限システム内では、ユーザーはUser Identityとして識別されます。User Identityは2つの部分から構成されます：`username`と`host`です。`username`はユーザーの名前で、英字（大文字・小文字両方）から構成されます。`host`は、ユーザー接続の発信元IPを表します。User Identityは`username@'host'`として表現され、これは`host`からの`username`を示しています。

   User Identityのもう一つの表現は`username@['domain']`で、ここで`domain`はDNSを通じて一連のIPに解決可能なドメイン名を指します。最終的に、これは`username@'host'`の集合として表現されるため、今後は統一して`username@'host'`で表記します。

2. Privilege

   権限はノード、データディレクトリ、データベース、またはテーブルに適用されます。異なる権限は異なる操作許可を表します。

3. Role

   Dorisでは、カスタム名のロールを作成できます。ロールは権限の集合として見なすことができます。新しく作成されたユーザーにロールを割り当てることで、そのロールの権限を自動的に継承します。その後のロールの権限変更も、そのロールに関連付けられたすべてのユーザーの権限に反映されます。

4. User Property

   ユーザープロパティは、User Identityではなく、ユーザーに直接関連付けられます。つまり、`user@'192.%'`と`user@['domain']`の両方が同じユーザープロパティのセットを共有し、これらは`user@'192.%'`や`user@['domain']`ではなく、ユーザー`user`に属します。

   ユーザープロパティには、ユーザー接続の最大数、インポートクラスター設定などが含まれますが、これらに限定されません。

## 認証・認可フレームワーク

ユーザーがApache Dorisにログインするプロセスは2つの部分に分けられます：**認証**と**認可**です。

- 認証：ユーザーが提供した認証情報（ユーザー名、クライアントIP、パスワードなど）に基づいて身元確認が行われます。確認されると、個別のユーザーがシステム定義のUser Identityにマッピングされます。
- 認可：取得したUser Identityに基づいて、そのUser Identityに関連付けられた権限に従って、ユーザーが意図した操作に必要な権限を持っているかどうかをチェックします。

## 認証

Dorisは組み込み認証スキームとLDAP認証をサポートしています。

### Doris組み込み認証スキーム

認証は、Doris内に保存されたユーザー名、パスワード、その他の情報に基づいて行われます。

管理者は`CREATE USER`コマンドでユーザーを作成し、`SHOW ALL GRANTS`コマンドで作成されたすべてのユーザーを表示します。

ユーザーがログインする際、システムはユーザー名、パスワード、クライアントIPアドレスが正しいかどうかを検証します。

#### パスワードポリシー

Dorisは以下のパスワードポリシーをサポートし、ユーザーのより良いパスワード管理を支援します。

1. `PASSWORD_HISTORY`

    ユーザーが現在のパスワードをリセットする際に、過去のパスワードを再利用できるかどうかを決定します。例えば、`PASSWORD_HISTORY 10`は過去10個のパスワードを新しいパスワードとして再利用できないことを意味します。`PASSWORD_HISTORY DEFAULT`を設定すると、グローバル変数`PASSWORD_HISTORY`の値が使用されます。0に設定するとこの機能が無効になります。デフォルトは0です。

    例：

    - グローバル変数を設定：`SET GLOBAL password_history = 10`
    - ユーザーに対して設定：`ALTER USER user1@'ip' PASSWORD_HISTORY 10`

2. `PASSWORD_EXPIRE`

    現在のユーザーのパスワードの有効期限を設定します。例えば、`PASSWORD_EXPIRE INTERVAL 10 DAY`はパスワードが10日後に期限切れになることを意味します。`PASSWORD_EXPIRE NEVER`はパスワードが期限切れにならないことを示します。`PASSWORD_EXPIRE DEFAULT`を設定すると、グローバル変数`default_password_lifetime`（日数）の値が使用されます。デフォルトはNEVER（または0）で、期限切れにならないことを示します。

    例：

    - グローバル変数を設定：`SET GLOBAL default_password_lifetime = 1`
    - ユーザーに対して設定：`ALTER USER user1@'ip' PASSWORD_EXPIRE INTERVAL 10 DAY`

3. `FAILED_LOGIN_ATTEMPTS`と`PASSWORD_LOCK_TIME`

    パスワード入力間違いの回数とそれによるユーザーアカウントのロック、ロック期間を設定します。例えば、`FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`は3回間違ってログインするとアカウントが1日間ロックされることを意味します。管理者は`ALTER USER`文を使用してアカウントをアンロックできます。

    例：

    - ユーザーに対して設定：`ALTER USER user1@'ip' FAILED_LOGIN_ATTEMPTS 3 PASSWORD_LOCK_TIME 1 DAY`

4. パスワード強度

    これはグローバル変数`validate_password_policy`によって制御されます。デフォルトは`NONE/0`で、パスワード強度チェックを行わないことを意味します。`STRONG/2`に設定した場合、パスワードは大文字、小文字、数字、特殊文字のうち少なくとも3つを含み、8文字以上である必要があります。

    例：

    - `SET validate_password_policy=STRONG`

詳細については、[ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)を参照してください。

### LDAPベース認証スキーム

[LDAPベース認証スキーム](./ldap.md)を参照してください。

## 認可

### 権限操作

- ユーザー作成：[CREATE USER](../../sql-manual/sql-statements/account-management/CREATE-USER)
- ユーザー変更：[ALTER USER](../../sql-manual/sql-statements/account-management/ALTER-USER.md)
- ユーザー削除：[DROP USER](../../sql-manual/sql-statements/account-management/DROP-USER.md)
- ロール付与/割り当て：[GRANT](../../sql-manual/sql-statements/account-management/GRANT-TO)
- ロール取り消し/撤回：[REVOKE](../../sql-manual/sql-statements/account-management/REVOKE-FROM.md)
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

Dorisは現在、以下の権限をサポートしています：

1. `Node_priv`

    ノード変更権限。FE、BE、BROKERノードの追加、削除、オフライン化を含みます。

    rootユーザーはデフォルトでこの権限を持ちます。`Grant_priv`と`Node_priv`の両方を持つユーザーは、この権限を他のユーザーに付与できます。

    この権限はGlobalレベルでのみ付与可能です。

2. `Grant_priv`

    権限変更権限。権限の付与、取り消し、ユーザー/ロールの追加/削除/変更を含む操作の実行を許可します。

    バージョン2.1.2以前では、他のユーザー/ロールに権限を付与する際、現在のユーザーはそれぞれのレベルの`Grant_priv`権限のみが必要でした。バージョン2.1.2以降、現在のユーザーは付与したいリソースに対する権限も必要です。

    他のユーザーにロールを割り当てる際は、Globalレベルの`Grant_priv`権限が必要です。

3. `Select_priv`

    データディレクトリ、データベース、テーブルの読み取り専用権限。

4. `Load_priv`

    データディレクトリ、データベース、テーブルの書き込み権限。Load、Insert、Deleteなどを含みます。

5. `Alter_priv`

    データディレクトリ、データベース、テーブルの変更権限。ライブラリ/テーブルの名前変更、カラムの追加/削除/変更、パーティションの追加/削除などを含みます。

6. `Create_priv`

    データディレクトリ、データベース、テーブル、ビューを作成する権限。

7. `Drop_priv`

    データディレクトリ、データベース、テーブル、ビューを削除する権限。

8. `Usage_priv`

    ResourcesとWorkload Groupsの使用権限。

9. `Show_view_priv`

    `SHOW CREATE VIEW`を実行する権限。

### 権限レベル

#### Global権限

`*.*.*`スコープでのGRANT文によって付与される権限。これらの権限は任意のカタログ内の任意のテーブルに適用されます。

#### カタログ権限

`ctl.*.*`スコープでのGRANT文によって付与される権限。これらの権限は指定されたカタログ内の任意のテーブルに適用されます。

#### Database権限

`ctl.db.*`スコープでのGRANT文によって付与される権限。これらの権限は指定されたデータベース内の任意のテーブルに適用されます。

#### table権限

`ctl.db.tbl`スコープでのGRANT文によって付与される権限。これらの権限は指定されたテーブル内の任意のカラムに適用されます。

#### Column権限

カラム権限は主に、テーブル内の特定のカラムに対するユーザーアクセスを制限するために使用されます。具体的には、カラム権限により、管理者は特定のカラムに対する表示、編集、その他の権利を設定し、ユーザーの特定のカラムデータへのアクセスと操作を制御できます。

テーブルの特定のカラムに対する権限は`GRANT Select_priv(col1,col2) ON ctl.db.tbl TO user1`で付与できます。

現在、カラム権限は`Select_priv`のみをサポートしています。

#### 行レベル権限

Row Policiesにより、管理者はデータ内のフィールドに基づいてアクセスポリシーを定義し、どのユーザーがどの行にアクセスできるかを制御できます。

具体的には、Row Policiesにより、管理者はデータに実際に保存されている値に基づいて行へのユーザーアクセスをフィルタリングまたは制限できるルールを作成できます。

バージョン1.2から、`CREATE ROW POLICY`コマンドで行レベル権限を作成できます。

バージョン2.1.2から、Apache RangerのRow Level Filterを通じて行レベル権限を設定するサポートが利用可能です。

#### Usage権限

- Resource権限

    Resource権限はResourcesに特化して設定され、データベースやテーブルの権限とは無関係で、`Usage_priv`と`Grant_priv`のみ割り当て可能です。

    すべてのResourcesに対する権限は`GRANT USAGE_PRIV ON RESOURCE '%' TO user1`で付与できます。

- Workload Group権限

    Workload Group権限はWorkload Groupsに特化して設定され、データベースやテーブルの権限とは無関係で、`Usage_priv`と`Grant_priv`のみ割り当て可能です。

    すべてのWorkload Groupsに対する権限は`GRANT USAGE_PRIV ON WORKLOAD GROUP '%' TO user1`で付与できます。

### データマスキング

データマスキングは、元のデータを変更、置換、または隠蔽することで機密データを保護する方法であり、マスキングされたデータは特定の形式と特性を保持しながら、もはや機密情報を含まないようにします。

例えば、管理者はクレジットカード番号やID番号などの機密フィールドの一部または全部の数字をアスタリスク`*`や他の文字に置き換えたり、実名を仮名に置き換えたりすることを選択できます。

バージョン2.1.2から、Apache RangerのData Maskingを通じて特定のカラムにデータマスキングポリシーを設定するサポートが利用可能で、現在は[Apache Ranger](./ranger.md)を通じてのみ設定可能です。

### Doris組み込み認可スキーム

Dorisの権限設計はRBAC（Role-Based Access Control）モデルに基づいており、ユーザーはロールと関連付けられ、ロールは権限と関連付けられます。ユーザーはロールを通じて間接的に権限と関連付けられます。

ロールが削除されると、ユーザーは自動的にそのロールに関連するすべての権限を失います。

ユーザーがロールから切り離されると、自動的にそのロールのすべての権限を失います。

ロールに権限が追加または削除されると、そのロールに関連付けられたユーザーの権限も相応に変更されます。

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

User1とuser2は両方とも`role1`を通じて権限`priv1`を持っています。

UserNは`role3`を通じて権限`priv1`を持ち、`roleN`を通じて権限`priv2`と`privN`を持っています。したがって、userNは権限`priv1`、`priv2`、および`privN`を同時に持っています。

ユーザー操作の簡素化のため、ユーザーに直接権限を付与することが可能です。内部的には、各ユーザーに対して一意のデフォルトロールが作成されます。ユーザーに権限が付与される際、それは本質的にユーザーのデフォルトロールに権限を付与することになります。

デフォルトロールは削除できず、他の人に割り当てることもできません。ユーザーが削除されると、そのデフォルトロールも自動的に削除されます。

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

    - ADMIN権限を持つユーザーは、任意のユーザーに対して権限の付与または取り消しができます。
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
    - root@'%'：rootユーザー、任意のノードからのログインが許可され、operatorロールを持ちます。
    - admin@'%'：adminユーザー、任意のノードからのログインが許可され、adminロールを持ちます。

2. デフォルトで作成されたユーザー、ロール、またはユーザーの削除や権限の変更はサポートされていません。
    - ユーザーroot@'%'とadmin@'%'の削除はサポートされていませんが、root@'xxx'とadmin@'xxx'ユーザー（xxxは%以外の任意のホストを指す）の作成と削除は許可されています（Dorisはこれらのユーザーを通常ユーザーとして扱います）。
    - root@'%'とadmin@'%'のデフォルトロールの取り消しはサポートされていません。
    - ロールoperatorとadminの削除はサポートされていません。
    - ロールoperatorとadminの権限の変更はサポートされていません。
   
3. operatorロールを持つユーザーはRootのみです。adminロールを持つユーザーは複数存在可能です。

4. 潜在的に競合する可能性のある操作について以下に説明します：

    1. ドメインとIPの競合：

        以下のユーザーが作成されたとします：

        `CREATE USER user1@['domain'];`

        そして付与されました：

        `GRANT SELECT_PRIV ON *.* TO user1@['domain']`

        このドメインはip1とip2の2つのIPに解決されます。

        後に、`user1@'ip1'`に個別の権限を付与したとします：

        `GRANT ALTER_PRIV ON . TO user1@'ip1';`

        すると`user1@'ip1'`はSelect_privとAlter_privの両方の権限を持つことになります。そして`user1@['domain']`の権限を再び変更した場合、`user1@'ip1'`はその変更に従いません。

    2. 重複IPの競合：

        以下のユーザーが作成されたとします：

        ```
        CREATE USER user1@'%' IDENTIFIED BY "12345";
        CREATE USER user1@'192.%' IDENTIFIED BY "abcde";
        ```
優先度に関して、`'192.%'`は`'%'`よりも優先されるため、マシン`192.168.1.1`からユーザー`user1`がパスワード`'12345'`を使用してDorisにログインを試行する場合、アクセスは拒否されます。

5. パスワードを忘れた場合

    パスワードを忘れてDorisにログインできない場合、FEの設定ファイルに`skip_localhost_auth_check=true`を追加してFEを再起動することで、ローカルマシンからパスワードなしでrootとしてDorisにログインできます。

    ログイン後、`SET PASSWORD`コマンドを使用してパスワードをリセットできます。

6. rootユーザー自身以外は、rootユーザーのパスワードをリセットすることはできません。

7. `Admin_priv`権限は、GLOBALレベルでのみ付与または取り消しができます。

8. `current_user()`と`user()`

    ユーザーは`SELECT current_user()`と`SELECT user()`をそれぞれ実行することで、自分の`current_user`と`user`を確認できます。ここで、`current_user`はユーザーが認証された際のアイデンティティを示し、`user`はその時点での実際のUser Identityです。

    例：

    `user1@'192.%'`が作成され、その後ユーザー`user1`が`192.168.10.1`からログインした場合、`current_user`は`user1@'192.%'`となり、`user`は`user1@'192.168.10.1'`となります。

    すべての権限は特定の`current_user`に付与され、実際のユーザーは対応する`current_user`のすべての権限を持ちます。

## ベストプラクティス

以下は、Doris権限システムのユースケース例です。

1. シナリオ1

   Dorisクラスターのユーザーは、管理者（Admin）、開発エンジニア（RD）、ユーザー（Client）に分類されます。管理者はクラスター全体に対するすべての権限を持ち、主にクラスター設定とノード管理を担当します。開発エンジニアはビジネスモデリングを担当し、データベースとテーブルの作成、インポート、およびデータの変更を行います。ユーザーは異なるデータベースとテーブルにアクセスしてデータを取得します。

   このシナリオでは、管理者にはADMINまたはGRANT権限を付与できます。RDには、任意または特定のデータベースとテーブルに対してCREATE、DROP、ALTER、LOAD、SELECT権限を付与できます。Clientには、任意または特定のデータベースとテーブルに対してSELECT権限を付与できます。さらに、複数のユーザーに対する認可プロセスを簡素化するために、異なるロールを作成することもできます。

2. シナリオ2

   クラスターには複数のビジネスが含まれる可能性があり、それぞれが1つ以上のデータセットを使用する可能性があります。各ビジネスは独自のユーザーを管理する必要があります。このシナリオでは、管理ユーザーが各データベースに対してDATABASEレベルのGRANT権限を持つユーザーを作成できます。このユーザーは、指定されたデータベースに対してのみユーザーを認可できます。

3. ブラックリスト

   Doris自体はブラックリストをサポートしておらず、ホワイトリストのみをサポートしていますが、特定の手段を通じてブラックリストをシミュレートできます。`user@'192.%'`という名前のユーザーが作成され、`192.*`からのユーザーのログインが許可されているとします。`192.168.10.1`からのユーザーのログインを禁止したい場合、新しいパスワードで別のユーザー`cmy@'192.168.10.1'`を作成できます。`192.168.10.1`は`192.%`よりも高い優先度を持つため、`192.168.10.1`からのユーザーは古いパスワードでログインできなくなります。
