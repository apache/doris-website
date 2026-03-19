---
{
  "title": "フェデレーティッド認証",
  "language": "ja",
  "description": "サードパーティのLDAPサービスを統合して、Dorisにログイン認証とグループ認可サービスを提供する。"
}
---
## LDAP

サードパーティのLDAPサービスを統合して、Dorisにログイン認証とグループ認可サービスを提供します。

### LDAPログイン認証

LDAPログイン認証とは、LDAPサービスからのパスワード検証を統合することで、Dorisのログイン認証を補完することです。Dorisは優先的にLDAPを使用してユーザーパスワードを検証します。LDAPサービスにユーザーが存在しない場合、Dorisは独自のパスワード検証を継続して使用します。LDAPパスワードが正しいがDorisに対応するアカウントがない場合、Dorisにログインするための一時ユーザーが作成されます。

LDAPを有効にした後、ユーザーはDorisとLDAPで以下のシナリオで存在することができます：

| LDAPユーザー   | Dorisユーザー  | パスワード     | ログインステータス | Dorisにログインしたユーザー |
| -------------- | -------------- | -------------- | ------------------ | --------------------------- |
| 存在する       | 存在する       | LDAPパスワード | ログイン成功       | Dorisユーザー               |
| 存在する       | 存在する       | Dorisパスワード| ログイン失敗       | なし                        |
| 存在しない     | 存在する       | Dorisパスワード| ログイン成功       | Dorisユーザー               |
| 存在する       | 存在しない     | LDAPパスワード | ログイン成功       | LDAP一時ユーザー            |

LDAPを有効にした後、ユーザーがMySQLクライアントを使用してログインする際、DorisはまずLDAPサービスを通じてユーザーパスワードを検証します。ユーザーがLDAPに存在しパスワードが正しい場合、Dorisはそのユーザーでログインします。Dorisに対応するアカウントがある場合は、直接そのアカウントにログインします。対応するアカウントがない場合は、ユーザーがログインするための一時アカウントが作成されます。一時アカウントには対応する権限があり（LDAPグループ認可を参照）、現在の接続に対してのみ有効です。Dorisはユーザーを作成せず、ユーザー作成メタデータも生成しません。
ログインユーザーがLDAPサービスに存在しない場合は、Dorisのパスワード認証が使用されます。

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
2. LDAPにユーザーが存在するが、Dorisに対応するアカウントがない場合：

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
### LDAPグループ認可

LDAPグループ認可は、LDAPグループをDorisロールにマッピングし、ログインしたユーザーに対応するすべてのロール権限を付与することです。ログアウト後、Dorisは対応するロール権限を取り消します。LDAPグループ認可を使用する前に、Dorisで対応するロールを作成し、そのロールに権限を付与する必要があります。

ログインしたユーザーの権限は、Dorisユーザーおよびグループの権限と関連しており、次の表に示されています：

| LDAPユーザー | Dorisユーザー | ログインユーザーの権限 |
| -------------- | -------------- | ----------------------------------------------- |
| 存在する | 存在する | LDAPグループ権限 + Dorisユーザー権限 |
| 存在しない | 存在する | Dorisユーザー権限 |
| 存在する | 存在しない | LDAPグループ権限 |

ログインしたユーザーが一時ユーザーでグループ権限を持たない場合、ユーザーはデフォルトでinformation_schemaのselect_priv権限を持ちます。

例：

LDAPユーザーdnがLDAPグループノードの"member"属性であり、Dorisはそのユーザーがそのグループに属していると判断します。Dorisはグループdnの最初のRdnをグループ名として取ります。

例えば、ユーザーdnが`uid=jack,ou=aidp,dc=domain,dc=com`で、グループ情報は次のとおりです：

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com
objectClass: groupOfNames
member: uid=jack,ou=aidp,dc=domain,dc=com
```
その後、グループ名は`doris_rd`になります。

`jack`もLDAPグループ`doris_qa`と`doris_pm`に属しており、DorisにはロールdDoris_rd`、`doris_qa`、`doris_pm`があると仮定します。LDAP認証でログイン後、ユーザーは元のアカウントの権限だけでなく、ロール`doris_rd`、`doris_qa`、`doris_pm`の権限も取得します。

> 注意：
>
> ユーザーが属するグループは、LDAPツリーの組織構造とは無関係です。例のUser2は必ずしもgroup2に属するわけではありません。

### LDAP例

#### Doris設定の変更

1. `fe/conf/fe.conf`ファイルで、認証方式をldapに設定します：`authentication_type=ldap`。
2. `fe/conf/ldap.conf`ファイルで、基本的なLDAP情報を設定します。
3. LDAP管理者パスワードの設定：`ldap.conf`ファイルの設定後、feを起動し、rootまたはadminアカウントでDorisにログインし、SQLを実行します

```sql
set ldap_admin_password = password('ldap_admin_password');
```
#### MySQLクライアントを使用してログインする

```sql
mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
Enter the LDAP password
```
注意: 他のクライアントを使用してログインするには、下記の「クライアントがクリアテキストログインを使用する方法」のセクションを参照してください。

### LDAP情報キャッシュ

LDAPサービスへの頻繁なアクセスを避けるため、DorisはLDAP情報をメモリにキャッシュします。`ldap.conf`ファイルの`ldap_user_cache_timeout_s`パラメータを設定することで、LDAPユーザーのキャッシュ時間を指定できます。デフォルトは12時間です。LDAPサービスの情報を変更したり、Dorisで対応するロール権限を変更した後、キャッシュにより変更がすぐに反映されない場合があります。`refresh ldap`ステートメントを使用してキャッシュを更新できます。詳細については、[REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)を参照してください。

### LDAP検証の制限事項

-   現在、DorisのLDAP機能はクリアテキストパスワード検証のみをサポートしており、これはパスワードがクライアントとfe間、およびfeとLDAPサービス間でクリアテキストで送信されることを意味します。

### よくある問題

-   LDAPユーザーがDorisでどのロールを持っているかを確認する方法は？

    LDAPユーザーでDorisにログインし、`show grants;`を実行して現在のユーザーのロールを確認します。`ldapDefaultRole`は各LDAPユーザーがDorisで持つデフォルトロールです。

-   LDAPユーザーのDorisでのロールが期待よりも少ない理由は？

    1. `show roles;`を使用して、期待するロールがDorisに存在するかを確認します。存在しない場合は、`CREATE ROLE rol_name;`を使用してロールを作成します。
    2. 期待するグループが`ldap_group_basedn`に対応する組織構造の下にあるかを確認します。
    3. 期待するグループにmember属性があるかを確認します。
    4. 期待するグループのmember属性に現在のユーザーが含まれているかを確認します。

### LDAPの概念

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

-   dc (Domain Component): 組織のドメイン名として理解でき、ツリーのルートノードとして機能します。
-   dn (Distinguished Name): 一意の名前と同等で、例えばuser1のdnは`cn=user1,ou=ou1,dc=example,dc=com`、user2のdnは`cn=user2,cn=group2,ou=ou2,dc=example,dc=com`です。
-   rdn (Relative Distinguished Name): dnの一部で、例えばuser1の4つのrdnは`cn=user1`、`ou=ou1`、`dc=example`、`dc=com`です。
-   ou (Organization Unit): サブ組織として理解でき、ユーザーをouの下に配置することも、example.comドメインの直下に配置することも可能です。
-   cn (common name): 名前。
-   group: グループ、Dorisにおけるロールとして理解できます。
-   user: ユーザー、Dorisのユーザーと同等です。
-   objectClass: 各行のデータのタイプとして理解でき、例えばgroup1をグループまたはユーザーとして区別する方法で、各タイプのデータには異なる属性が必要です。例えば、groupにはcnとmember（ユーザーリスト）が必要で、userにはcn、password、uidなどが必要です。

### クライアントがクリアテキストログインを使用する方法

#### MySQLクライアント

LDAP認証を使用するには、クライアントでMySQLクライアントクリアテキスト認証プラグインを有効にする必要があります。コマンドラインを使用してDorisにログインするには、以下の方法のいずれかを使用してMySQLクリアテキスト認証プラグインを有効にできます：

-   環境変数`LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN`を1に設定

    例えば、LinuxまたはMac環境では、以下を使用できます：

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ～/.bash_profile && source ～/.bash_profile
    ```
- Dorisにログインする際に毎回パラメータ`--enable-cleartext-plugin`を追加する

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin

    Enter the LDAP password
    ```
#### JDBC Client

JDBC クライアントを使用して Doris にログインするには、プラグインをカスタマイズする必要があります。

まず、`MysqlClearPasswordPlugin` を継承する `MysqlClearPasswordPluginWithoutSSL` という名前のクラスを作成します。このクラスで、`requiresConfidentiality()` メソッドをオーバーライドし、false を返します。

```java
public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
@Override
public boolean requiresConfidentiality() {
    return false;
  }
}
```
データベース接続を取得する際、propertiesでカスタマイズされたプラグインを設定する必要があります。

すなわち、（xxxはカスタマイズされたクラスのパッケージ名です）

-   authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
-   defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
-   disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin

例：

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
```
