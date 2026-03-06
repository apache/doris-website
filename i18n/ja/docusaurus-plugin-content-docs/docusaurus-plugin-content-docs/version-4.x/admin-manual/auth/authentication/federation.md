---
{
  "title": "フェデレーション認証",
  "language": "ja",
  "description": "サードパーティのLDAPサービスを統合して、Dorisにログイン認証とグループ認可サービスを提供する。"
}
---
## LDAP
サードパーティのLDAPサービスを統合して、Dorisにログイン認証とグループ認可サービスを提供します。

### LDAPログイン認証
LDAPログイン認証とは、LDAPサービスからのパスワード検証を統合することで、Dorisのログイン認証を補完することを指します。Dorisは、ユーザーパスワードの検証にLDAPを優先的に使用します。ユーザーがLDAPサービスに存在しない場合、Dorisは独自のパスワード検証を継続して使用します。LDAPパスワードが正しいがDorisに対応するアカウントがない場合、Dorisにログインするための一時ユーザーが作成されます。

LDAPを有効にした後、ユーザーはDorisとLDAPにおいて以下のシナリオで存在できます：

| LDAPユーザー | Dorisユーザー | パスワード | ログインステータス | Dorisにログインしたユーザー |
| -------- | --------- | --------- | -------- | --------------- |
| 存在する | 存在する | LDAPパスワード | ログイン成功 | Dorisユーザー |
| 存在する | 存在する | Dorisパスワード | ログイン失敗 | なし |
| 存在しない | 存在する | Dorisパスワード | ログイン成功 | Dorisユーザー |
| 存在する | 存在しない | LDAPパスワード | ログイン成功 | Ldap一時ユーザー |

LDAPを有効にした後、ユーザーがMySQLクライアントを使用してログインする際、DorisはまずLDAPサービスを通じてユーザーパスワードを検証します。ユーザーがLDAPに存在し、パスワードが正しい場合、Dorisはそのユーザーでログインします。Dorisに対応するアカウントがある場合は、そのアカウントに直接ログインします。対応するアカウントがない場合は、ユーザーがログインするための一時アカウントが作成されます。一時アカウントは対応する権限を持ち（LDAPグループ認可を参照）、現在の接続でのみ有効です。Dorisはユーザーを作成せず、ユーザー作成メタデータも生成しません。
ログインユーザーがLDAPサービスに存在しない場合、Dorisのパスワード認証が使用されます。

LDAP認証が有効で、`ldap_user_filter = (&(uid={login}))`で設定され、他の設定が正しいと仮定して、クライアントは環境変数を適切に設定します。

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
### LDAP グループ認証
LDAP グループ認証は、LDAP グループを Doris ロールにマッピングし、対応するすべてのロール権限をログインユーザーに付与する機能です。ログアウト後、Doris は対応するロール権限を取り消します。LDAP グループ認証を使用する前に、Doris で対応するロールを作成し、そのロールに権限を付与する必要があります。

ログインユーザーの権限は、Doris ユーザーとグループ権限に関連しており、以下の表に示されています：

| LDAP User | Doris User | Login User's Permissions             |
| -------- | --------- | -------------------------- |
| 存在する     | 存在する      | LDAP Group Permissions + Doris User Permissions |
| 存在しない   | 存在する      | Doris User Permissions              |
| 存在する     | 存在しない    | LDAP Group Permissions                 |

ログインユーザーが一時ユーザーでグループ権限を持たない場合、そのユーザーはデフォルトで information_schema の select_priv 権限を持ちます。

例：

LDAP ユーザー dn が LDAP グループノードの "member" 属性である場合、Doris はそのユーザーがそのグループに属していると見なします。Doris は、グループ dn の最初の Rdn をグループ名として取得します。

例えば、ユーザー dn が `uid=jack,ou=aidp,dc=domain,dc=com` で、グループ情報は以下の通りです：

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```
その後、グループ名は`doris_rd`になります。

`jack`がLDAPグループ`doris_qa`と`doris_pm`にも属しており、DorisにはロールOB`doris_rd`、`doris_qa`、`doris_pm`が存在すると仮定すると、LDAP認証でログインした後、ユーザーはアカウントの元の権限だけでなく、ロール`doris_rd`、`doris_qa`、`doris_pm`の権限も取得します。

> 注意:
>
> ユーザーが属するグループは、LDAPツリーの組織構造とは無関係です。例のUser2は必ずしもgroup2に属するわけではありません。

### LDAP例
#### Doris設定の変更
1. `fe/conf/fe.conf`ファイルで、認証方式をldapに設定します: `authentication_type=ldap`。
2. `fe/conf/ldap.conf`ファイルで、基本的なLDAP情報を設定します。
3. LDAP管理者パスワードの設定: `ldap.conf`ファイルの設定後、feを起動し、rootまたはadminアカウントを使用してDorisにログインし、SQLを実行します

```sql
set ldap_admin_password = password('ldap_admin_password');
```
#### MySQL クライアントを使用してログインする

```sql
mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
Enter the LDAP password
```
注意: 他のクライアントを使用してログインする場合は、以下の「How Clients Use Clear Text Login」のセクションを参照してください。

### LDAP Information Cache

LDAP サービスへの頻繁なアクセスを避けるため、Doris は LDAP 情報をメモリにキャッシュします。`ldap.conf` ファイル内の `ldap_user_cache_timeout_s` パラメータを設定して、LDAP ユーザーのキャッシュ時間を指定できます。デフォルトは 12 時間です。LDAP サービス内の情報を変更したり、Doris 内の対応するロール権限を変更した後、キャッシュのため変更がすぐに反映されない場合があります。`refresh ldap` ステートメントを使用してキャッシュを更新できます。詳細については、[REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP) を参照してください。

### LDAP 認証の制限事項

- 現在、Doris の LDAP 機能はクリアテキストパスワード認証のみをサポートしており、これはパスワードがクライアントと fe 間、および fe と LDAP サービス間でクリアテキストで送信されることを意味します。

### よくある問題

- LDAP ユーザーが Doris でどのロールを持っているかを確認する方法は？

  LDAP ユーザーを使用して Doris にログインし、`show grants;` を実行して現在のユーザーのロールを表示します。`ldapDefaultRole` は、各 LDAP ユーザーが Doris で持つデフォルトロールです。

- LDAP ユーザーの Doris でのロールが期待より少ない理由は？

    1. `show roles;` を使用して、期待するロールが Doris に存在するかを確認します。存在しない場合は、`CREATE ROLE rol_name;` を使用してロールを作成します。
    2. 期待するグループが `ldap_group_basedn` に対応する組織構造の下にあるかを確認します。
    3. 期待するグループにメンバー属性があるかを確認します。
    4. 期待するグループのメンバー属性に現在のユーザーが含まれているかを確認します。

### LDAP の概念
LDAP では、データはツリー構造で整理されます。

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

- dc (Domain Component): 組織のドメイン名として理解でき、ツリーのルートノードとして機能します。
- dn (Distinguished Name): 一意の名前と同等で、例えばuser1のdnは`cn=user1,ou=ou1,dc=example,dc=com`、user2のdnは`cn=user2,cn=group2,ou=ou2,dc=example,dc=com`です。
- rdn (Relative Distinguished Name): dnの一部で、例えばuser1の4つのrdnは`cn=user1`、`ou=ou1`、`dc=example`、`dc=com`です。
- ou (Organization Unit): サブ組織として理解でき、ユーザーをouの下に配置することも、example.comドメインの直下に配置することもできます。
- cn (common name): 名前。
- group: グループ、Dorisのロールとして理解できます。
- user: ユーザー、Dorisのユーザーと同等です。
- objectClass: 各行のデータのタイプとして理解でき、例えばgroup1がグループかユーザーかを区別する方法として、各タイプのデータには異なる属性が必要で、グループにはcnとmember（ユーザーリスト）が必要、ユーザーにはcn、password、uidなどが必要です。

### クライアントでのクリアテキストログインの使用方法
#### MySQLクライアント
LDAP認証を使用するには、クライアントでMySQLクライアントクリアテキスト認証プラグインを有効にする必要があります。コマンドラインを使用してDorisにログインするには、以下のいずれかの方法でMySQLクリアテキスト認証プラグインを有効にできます：

- 環境変数`LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN`を1に設定

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

JDBC clientを使用してDorisにログインするには、pluginをカスタマイズする必要があります。

まず、`MysqlClearPasswordPlugin`を継承した`MysqlClearPasswordPluginWithoutSSL`という名前のclassを作成します。このclassで、`requiresConfidentiality()`メソッドをoverrideしてfalseを返します。

```java
public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
@Override  
public boolean requiresConfidentiality() {
    return false;
  }
}
```
データベース接続を取得する際、propertiesでカスタマイズされたプラグインを設定する必要があります。

つまり、（xxxはカスタマイズされたクラスのパッケージ名です）

- authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
- defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL
- disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin

例：

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
```
