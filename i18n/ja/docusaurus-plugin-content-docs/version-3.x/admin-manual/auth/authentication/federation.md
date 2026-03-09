---
{
  "title": "フェデレーテッド認証",
  "language": "ja",
  "description": "サードパーティのLDAPサービスを統合して、Dorisにログイン認証とグループ認可サービスを提供する。"
}
---
## LDAP

サードパーティのLDAPサービスを統合して、Dorisにログイン認証とグループ認可サービスを提供します。

### LDAPログイン認証

LDAPログイン認証とは、LDAPサービスからのパスワード検証を統合してDorisのログイン認証を補完することを指します。DorisはLDAPを使用してユーザーパスワードを検証することを優先します。ユーザーがLDAPサービスに存在しない場合、Dorisは独自のパスワード検証を継続して使用します。LDAPパスワードが正しいがDorisに対応するアカウントが存在しない場合、Dorisにログインするための一時ユーザーが作成されます。

LDAPを有効にした後、ユーザーはDorisとLDAPで以下のシナリオで存在できます：

| LDAPユーザー   | Dorisユーザー  | パスワード      | ログインステータス | Dorisにログインしたユーザー |
| -------------- | -------------- | -------------- | ---------------- | ---------------------- |
| 存在する       | 存在する       | LDAPパスワード  | ログイン成功      | Dorisユーザー           |
| 存在する       | 存在する       | Dorisパスワード | ログイン失敗      | なし                   |
| 存在しない     | 存在する       | Dorisパスワード | ログイン成功      | Dorisユーザー           |
| 存在する       | 存在しない     | LDAPパスワード  | ログイン成功      | Ldap一時ユーザー        |

LDAPを有効にした後、ユーザーがMySQLクライアントを使用してログインする際、DorisはまずLDAPサービスを通してユーザーパスワードを検証します。ユーザーがLDAPに存在し、パスワードが正しい場合、Dorisはそのユーザーでログインします。Dorisに対応するアカウントがある場合は、そのアカウントに直接ログインします。対応するアカウントがない場合は、ユーザーがログインするための一時アカウントが作成されます。一時アカウントには対応する権限があり（LDAPグループ認可を参照）、現在の接続に対してのみ有効です。Dorisはユーザーを作成したり、ユーザー作成メタデータを生成したりしません。
ログインユーザーがLDAPサービスに存在しない場合、Dorisのパスワード認証が使用されます。

LDAP認証が有効になっており、`ldap_user_filter = (&(uid={login}))`で設定され、その他の設定が正しいと仮定して、クライアントは環境変数を適切に設定します。

例：

1. DorisとLDAPの両方にアカウントがある場合：

    Dorisアカウント：`jack@'172.10.1.10'`、パスワード：`123456`

    LDAPユーザーノードの属性：`uid: jack` ユーザーパスワード：`abcdef`

    以下のコマンドを使用してDorisにログインすると、`jack@'172.10.1.10'`アカウントにログインできます：

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
    ```
以下のコマンドを使用するとログインに失敗します：

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
    ```
2. LDAPにはユーザーが存在するが、Dorisに対応するアカウントがない場合：

    LDAPユーザーノードの属性：`uid: jack` ユーザーパスワード：`abcdef`

    以下のコマンドを使用して一時ユーザーを作成し、`jack@'%'`でログインします。一時ユーザーは基本権限DatabasePrivs: Select_privを持ち、ログアウト後にユーザーは削除されます：

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
    ```
3. LDAPにユーザーが存在しない場合：

    Dorisアカウント：`jack@'172.10.1.10'`、パスワード：`123456`

    Dorisのパスワードを使用してアカウントにログイン、成功：

    ```sql
    mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
    ```
### LDAP グループ認可

LDAP グループ認可は、LDAP グループを Doris ロールにマップし、対応するすべてのロール権限をログインユーザーに付与することです。ログアウト後、Doris は対応するロール権限を取り消します。LDAP グループ認可を使用する前に、Doris で対応するロールを作成し、ロールに権限を付与する必要があります。

ログインユーザーの権限は、Doris ユーザーとグループ権限に関連しており、次の表に示すとおりです。

| LDAP User      | Doris User     | Login User's Permissions                        |
| -------------- | -------------- | ----------------------------------------------- |
| Exists         | Exists         | LDAP Group Permissions + Doris User Permissions |
| Does Not Exist | Exists         | Doris User Permissions                          |
| Exists         | Does Not Exist | LDAP Group Permissions                          |

ログインユーザーが一時ユーザーでグループ権限を持たない場合、そのユーザーはデフォルトで information_schema の select_priv 権限を持ちます。

例：

LDAP ユーザー dn が LDAP グループノードの "member" 属性である場合、Doris はそのユーザーがそのグループに属すると見なします。Doris はグループ dn の最初の Rdn をグループ名として取得します。

例えば、ユーザー dn が `uid=jack,ou=aidp,dc=domain,dc=com` で、グループ情報は次のとおりです。

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com
objectClass: groupOfNames
member: uid=jack,ou=aidp,dc=domain,dc=com
```
その後、グループ名は `doris_rd` になります。

`jack` がLDAPグループ `doris_qa` と `doris_pm` にも属しており、Dorisにロールがあるとしましょう：`doris_rd`、`doris_qa`、`doris_pm`。LDAP認証でログインした後、ユーザーはアカウントの元の権限を持つだけでなく、ロール `doris_rd`、`doris_qa`、および `doris_pm` の権限も取得します。

> 注意:
>
> ユーザーが属するグループは、LDAPツリーの組織構造とは関係ありません。例のUser2は必ずしもgroup2に属するとは限りません。

### LDAP例

#### Doris設定の変更

1. `fe/conf/fe.conf` ファイルで、認証方式をldapとして設定します：`authentication_type=ldap`。
2. `fe/conf/ldap.conf` ファイルで、基本的なLDAP情報を設定します。
3. LDAP管理者パスワードの設定：`ldap.conf` ファイルを設定後、feを起動し、rootまたはadminアカウントでDorisにログインして、SQLを実行します。

```sql
set ldap_admin_password = password('ldap_admin_password');
```
#### MySQL クライアントを使用してログインする

```sql
mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
Enter the LDAP password
```
注意：他のクライアントを使用してログインするには、以下の「How Clients Use Clear Text Login」セクションを参照してください。

### LDAP Information Cache

LDAP サービスへの頻繁なアクセスを避けるため、DorisはLDAP情報をメモリにキャッシュします。`ldap.conf`ファイルの`ldap_user_cache_timeout_s`パラメータを設定して、LDAPユーザーのキャッシュ時間を指定できます。デフォルトは12時間です。LDAPサービスの情報を変更した後、またはDorisで対応するロール権限を変更した後、キャッシュのため変更がすぐに有効にならない場合があります。`refresh ldap`文を使用してキャッシュを更新できます。詳細については、[REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)を参照してください。

### LDAP Verificationの制限事項

-   現在、DorisのLDAP機能はクリアテキストパスワード検証のみをサポートしており、これはクライアントとfe間、およびfeとLDAPサービス間でパスワードがクリアテキストで送信されることを意味します。

### よくある問題

-   LDAPユーザーがDorisでどのロールを持っているかを確認する方法は？

    LDAPユーザーでDorisにログインし、`show grants;`を実行して現在のユーザーのロールを表示します。`ldapDefaultRole`は各LDAPユーザーがDorisで持つデフォルトロールです。

-   なぜLDAPユーザーのDorisでのロールが期待より少ないのですか？

    1. `show roles;`を使用して、期待するロールがDorisに存在するかを確認します。存在しない場合は、`CREATE ROLE rol_name;`を使用してロールを作成します。
    2. 期待するグループが`ldap_group_basedn`に対応する組織構造下にあるかを確認します。
    3. 期待するグループにmember属性があるかを確認します。
    4. 期待するグループのmember属性に現在のユーザーが含まれているかを確認します。

### LDAP Concepts

LDAPでは、データはツリー構造で組織化されます。

#### 例（以下の説明はこの例に基づいています）

```
- dc=example,dc=com
 - ou = ou1
   - cn = group1
   - cn = user1
 - ou = ou2
   - cn = group2
     - cn = user2
 - cn = user3
```
#### LDAP用語

-   dc（Domain Component）：組織のドメイン名として理解でき、ツリーのルートノードとして機能します。
-   dn（Distinguished Name）：一意の名前に相当し、例えばuser1のdnは`cn=user1,ou=ou1,dc=example,dc=com`、user2のdnは`cn=user2,cn=group2,ou=ou2,dc=example,dc=com`です。
-   rdn（Relative Distinguished Name）：dnの一部で、例えばuser1の4つのrdnは`cn=user1`、`ou=ou1`、`dc=example`、`dc=com`です。
-   ou（Organization Unit）：サブ組織として理解でき、ユーザーをouの下に配置することも、example.comドメインの直下に配置することもできます。
-   cn（common name）：名前。
-   group：グループ、Dorisにおけるロールとして理解できます。
-   user：ユーザー、Dorisにおけるユーザーに相当します。
-   objectClass：各行データのタイプとして理解でき、例えばgroup1をグループまたはユーザーとして区別する方法など、各タイプのデータには異なる属性が必要です。例えば、groupにはcnとmember（ユーザーリスト）が必要で、userにはcn、password、uidなどが必要です。

### クライアントがクリアテキストログインを使用する方法

#### MySQLクライアント

LDAP検証を使用するには、クライアントでMySQLクライアントクリアテキスト検証プラグインを有効にする必要があります。コマンドラインを使用してDorisにログインするには、以下のいずれかの方法でMySQLクリアテキスト検証プラグインを有効にできます：

-   環境変数`LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN`を1に設定する

    例えば、LinuxまたはMac環境では、以下を使用できます：

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ～/.bash_profile && source ～/.bash_profile
    ```
Dorisへのログイン時に毎回パラメータ`--enable-cleartext-plugin`を追加する

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin

    Enter the LDAP password
    ```
#### JDBC Client

JDBC clientを使用してDorisにログインするには、プラグインをカスタマイズする必要があります。

まず、`MysqlClearPasswordPlugin`を継承した`MysqlClearPasswordPluginWithoutSSL`という名前のクラスを作成します。このクラスで、`requiresConfidentiality()`メソッドをオーバーライドし、falseを返します。

```java
public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
@Override
public boolean requiresConfidentiality() {
    return false;
  }
}
```
データベース接続を取得する際は、カスタマイズされたプラグインをプロパティで設定する必要があります。

つまり、（xxxはカスタマイズされたクラスのパッケージ名）

-   authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
-   defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
-   disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin

例えば：

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
```
