---
{
  "title": "LDAP",
  "language": "ja",
  "description": "Apache Dorisフェデレーション認証の詳細ガイド：LDAP統合による統一アイデンティティ検証とグループ認可、設定手順、ログイン方法、権限マッピングルール、および一般的なトラブルシューティングを網羅。"
}
---
Dorisは、サードパーティのLDAPサービスとの統合をサポートし、2つの主要な機能を提供します：

- **認証**: アイデンティティ検証においてDorisパスワードの代わりにLDAPパスワードを使用します。
- **グループ認可**: LDAP `groups`をDoris `roles`にマッピングして、統一された権限管理を行います。

## LDAP基本概念

LDAPでは、データはツリー構造で整理されます。以下は、典型的なLDAPディレクトリツリーの例です：

```text
- dc=example,dc=com
 - ou = ou1
   - cn = group1
   - cn = user1
 - ou = ou2
   - cn = group2
     - cn = user2
 - cn = user3
```
### 用語

| 用語 | フルネーム | 説明 |
| --- | --- | --- |
| `dc` | Domain Component | 組織のドメイン名で、ツリーのルートノードとして機能する |
| `dn` | Distinguished Name | 一意の名前。例えば、user1の`dn`は`cn=user1,ou=ou1,dc=example,dc=com`、user2の`dn`は`cn=user2,cn=group2,ou=ou2,dc=example,dc=com` |
| `rdn` | Relative Distinguished Name | `dn`の一部。user1の4つの`rdn`は`cn=user1`、`ou=ou1`、`dc=example`、`dc=com` |
| `ou` | Organization Unit | サブ組織。`users`は`ou`内またはexample.comドメインの直下に配置可能 |
| `cn` | Common Name | 名前 |
| `group` | - | グループ、Dorisロールに対応 |
| `user` | - | ユーザー、Dorisユーザーと等価 |
| `objectClass` | - | データ型。ノードが`group`または`user`のどちらかを区別するために使用。`group`は`cn`と`member`（`users`のリスト）属性が必要、`user`は`cn`、`password`、`uid`等が必要 |

## クイックスタート

### ステップ1: Dorisの設定

1. `fe/conf/fe.conf`で認証方式を設定：`authentication_type=ldap`。
2. `fe/conf/ldap.conf`でLDAPサービス接続情報を設定：

    ```
    ldap_authentication_enabled = true
    ldap_host = ladp-host
    ldap_port = 389
    ldap_admin_name = uid=admin,o=emr
    ldap_user_basedn = ou=people,o=emr
    ldap_user_filter = (&(uid={login}))
    ldap_group_basedn = ou=group,o=emr
    ```
3. `fe`を起動した後、`root`または`admin`アカウントでDorisにログインし、LDAP管理者パスワードを設定します：

    ```sql
    set ldap_admin_password = password('<ldap_admin_password>');
    ```
### ステップ2: クライアント接続

LDAP認証では、クライアントがパスワードを平文で送信する必要があるため、平文認証プラグインを有効にする必要があります。

**MySQLクライアント**

以下のいずれかの方法で平文認証プラグインを有効にできます：

- **方法1**: 環境変数を設定（永続的）

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```
- **Method 2**: ログイン時にパラメータを追加する（一回限り）

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```
**JDBCクライアント**

1. Doris SSLが無効な場合

    Doris SSLが有効でない場合、JDBC接続を使用する際にSSL制限を回避するためのカスタム認証プラグインを作成する必要があります：

    1. `MysqlClearPasswordPlugin`を拡張し、`requiresConfidentiality()`メソッドをオーバーライドするカスタムプラグインクラスを作成します：

        ```java
        public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
          @Override
          public boolean requiresConfidentiality() {
            return false;
          }
        }
        ```
2. JDBC接続URLでカスタムプラグインを設定します（`xxx`を実際のパッケージ名に置き換えてください）：

        ```sql
        jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
        ```
必要な3つのプロパティの説明：

        | プロパティ | 説明 |
        | --- | --- |
        | `authenticationPlugins` | カスタムクリアテキスト認証プラグインを登録する |
        | `defaultAuthenticationPlugin` | カスタムプラグインをデフォルトの認証プラグインとして設定する |
        | `disabledAuthenticationPlugins` | 元のクリアテキスト認証プラグイン（SSLを必須とする）を無効にする |

    > 例については、[このコードリポジトリ](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test)を参照してください。または、`build-auth-plugin.sh`を実行してプラグインJARファイルを直接生成し、クライアントの指定された場所に配置してください。

2. Doris SSL有効化

    Doris SSLが有効化されている場合（`fe.conf`に`enable_ssl=true`が追加されている場合）：

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
    ```
## 認証

LDAP認証とは、Dorisのネイティブ認証メカニズムを補完するためにLDAPサービスを通じてパスワード検証を行うことです。パスワード検証の優先度は以下の通りです：

1. DorisはまずLDAPを使用してユーザーパスワードを検証します。
2. LDAPにユーザーが存在しない場合、Dorisローカルパスワード検証にフォールバックします。
3. LDAPパスワードが正しいがDorisに対応するアカウントがない場合、ログイン用の一時ユーザーが作成されます。

### ログイン動作の概要

LDAPを有効にした後、異なるユーザー状態でのログイン動作は以下の通りです：

| LDAPユーザー | Dorisユーザー | 使用パスワード | ログイン結果 | ログイン身元 |
| --------- | ---------- | ------------- | ------------ | -------------- |
| 存在 | 存在 | LDAPパスワード | 成功 | Dorisユーザー |
| 存在 | 存在 | Dorisパスワード | 失敗 | - |
| 存在しない | 存在 | Dorisパスワード | 成功 | Dorisユーザー |
| 存在 | 存在しない | LDAPパスワード | 成功 | LDAP一時ユーザー |

> **一時ユーザーについて：**
>
> - 一時アカウントは現在の接続でのみ有効であり、切断時に自動的に破棄されます。
> - Dorisは一時ユーザーの永続的なユーザーメタデータを作成しません。
> - 一時ユーザーの権限はLDAPグループ認可によって決定されます（下記の「グループ認可」セクションを参照）。
> - 一時ユーザーに対応するグループ権限がない場合、デフォルトで`information_schema`に対する`select_priv`が適用されます。

### ログイン例

以下の例では、LDAP認証が有効になっており、`ldap_user_filter = (&(uid={login}))`で設定され、クライアントが`LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1`を設定していることを前提としています。

**シナリオ1：DorisとLDAPの両方にアカウントが存在**

- Dorisアカウント：`jack@'172.10.1.10'`、パスワード：`123456`
- LDAPユーザー属性：`uid: jack`、パスワード：`abcdef`

LDAPパスワードでログイン、成功：

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```
Dorisパスワードでのログインに失敗しました（LDAP有効化後、LDAPユーザーはLDAPパスワードを使用する必要があります）：

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```
**シナリオ2: ユーザーがLDAPにのみ存在する場合**

- LDAPユーザー属性: `uid: jack`、パスワード: `abcdef`

LDAPパスワードでログインすると、Dorisは自動的に一時ユーザー`jack@'%'`を作成してログインします。一時ユーザーは基本権限`DatabasePrivs`: `Select_priv`を持ち、切断後に自動的に削除されます:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```
**シナリオ3: アカウントがDorisにのみ存在する場合**

- Dorisアカウント: `jack@'172.10.1.10'`、パスワード: `123456`

ユーザーがLDAPに存在しないため、Dorisローカル認証にフォールバックし、Dorisパスワードでログインが成功します:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```
## グループ認可

LDAPグループ認可は、LDAP `groups` を Doris `roles` にマッピングして、集中的な権限管理を実現します。コアメカニズムは以下の通りです：

- LDAPユーザーの `dn` がLDAPグループノードの `member` 属性に現れる場合、Dorisはそのユーザーがそのグループに属すると見なします。
- ユーザーがログインすると、DorisはそのLDAPグループに対応する `role` 権限を自動的に付与します。
- ユーザーがログアウトすると、Dorisはこれらの `role` 権限を自動的に取り消します。

> **前提条件：** LDAPグループ認可を使用する前に、LDAP `groups` と同じ名前の `roles` をDorisで作成し、これらの `roles` に権限を付与する必要があります。

### 権限マージルール

ログインしたユーザーの最終権限は、LDAPとDorisの両方での状態に依存します：

| LDAP User | Doris User | Final Permissions |
| --------- | ---------- | ----------------- |
| Exists | Exists | LDAP group permissions + Doris user permissions |
| Not exists | Exists | Doris user permissions |
| Exists | Not exists | LDAP group permissions |

### グループ名マッピングルール

DorisはLDAPグループ `dn` の最初の `Rdn` をグループ名として抽出し、Doris内の同名の `role` にマッピングします。

例えば、ユーザー `dn` が `uid=jack,ou=aidp,dc=domain,dc=com` で、グループ情報が以下の場合：

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```
このグループ`dn`の最初の`Rdn`は`cn=doris_rd`なので、グループ名は`doris_rd`となり、Doris内の`role` `doris_rd`に対応します。

### グループ認可の例

ユーザーjackがLDAPグループ`doris_rd`、`doris_qa`、`doris_pm`に属し、Dorisに同じ名前の`roles`：`doris_rd`、`doris_qa`、`doris_pm`がある場合、jackがログイン後、元のDorisアカウントの権限に加えて、これら3つの`roles`の権限も取得します。

> **注意：**
>
> - `user`がどの`group`に属するかは、LDAPツリーの組織構造とは独立しています。上記の例の`user2`は必ずしも`group2`に属するわけではありません。
> - `user2`を`group2`に属させるには、明示的に`user2`を`group2`の`member`属性に追加する必要があります。

## キャッシュ管理

LDAPサービスへの頻繁なアクセスを避けるため、DorisはLDAP情報をメモリにキャッシュします。

| 設定項目 | 説明 | デフォルト値 |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | LDAPユーザー情報のキャッシュ時間（秒） | 43200（12時間） |

以下のシナリオでは、変更を即座に有効にするため、手動でキャッシュをリフレッシュする必要がある場合があります：

- LDAPサービス内のユーザーまたはグループ情報を変更した場合
- Doris内でLDAPユーザーグループに対応する`Role`権限を変更した場合

`refresh ldap`ステートメントでキャッシュをリフレッシュできます。詳細は[REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)を参照してください。

## 既知の制限

- 現在、DorisのLDAP機能は平文パスワード認証のみをサポートしており、ユーザーログイン時にパスワードが`client`と`fe`の間、および`fe`とLDAPサービスの間で平文で送信されます。

## FAQ

**Q: LDAPユーザーがDoris内で持つrolesを確認するにはどうすればよいですか？**

LDAPユーザーでDorisにログイン後、`show grants;`を実行して現在のユーザーのすべてのrolesを表示します。`ldapDefaultRole`は、すべてのLDAPユーザーが持つデフォルトのroleです。

**Q: LDAPユーザーのDoris内でのrolesが期待より少ない場合、どのようにトラブルシューティングしますか？**

以下の項目を段階的に確認してください：

1. `show roles;`を実行して、期待するrolesがDoris内に存在するかを確認します。存在しない場合は、`CREATE ROLE role_name;`で作成してください。
2. 期待する`group`が`ldap_group_basedn`に対応する組織構造の下に配置されているかを確認します。
3. 期待する`group`が`member`属性を含んでいるかを確認します。
4. 期待する`group`の`member`属性に現在のユーザーの`dn`が含まれているかを確認します。
