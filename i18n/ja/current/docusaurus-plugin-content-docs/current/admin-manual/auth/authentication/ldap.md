---
{
  "title": "LDAP",
  "language": "ja",
  "description": "Apache Dorisフェデレーテッド認証の詳細ガイド：LDAP統合による統一アイデンティティ検証とグループ認可、設定手順、ログイン方法、権限マッピングルール、および一般的なトラブルシューティングを含む。"
}
---
Dorisは、サードパーティのLDAPサービスとの統合をサポートし、2つの主要な機能を提供します：

- **認証**: ID検証においてDorisパスワードの代わりにLDAPパスワードを使用します。
- **グループ認可**: LDAPの`groups`をDorisの`roles`にマッピングし、統一的な権限管理を行います。

## LDAPの基本概念

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

| 用語 | 正式名称 | 説明 |
| --- | --- | --- |
| `dc` | Domain Component | 組織のドメイン名で、ツリーのルートノードとして機能する |
| `dn` | Distinguished Name | 一意の名前。例えば、user1の`dn`は`cn=user1,ou=ou1,dc=example,dc=com`、user2の`dn`は`cn=user2,cn=group2,ou=ou2,dc=example,dc=com` |
| `rdn` | Relative Distinguished Name | `dn`の一部。user1の4つの`rdn`は`cn=user1`、`ou=ou1`、`dc=example`、`dc=com` |
| `ou` | Organization Unit | サブ組織。`users`は`ou`に配置することも、example.comドメイン直下に配置することも可能 |
| `cn` | Common Name | 名前 |
| `group` | - | グループ、Dorisロールに対応 |
| `user` | - | ユーザー、Dorisユーザーと同等 |
| `objectClass` | - | データタイプ。ノードが`group`か`user`かを区別するために使用。`group`には`cn`と`member`（`users`のリスト）属性が必要、`user`には`cn`、`password`、`uid`などが必要 |

## クイックスタート

### ステップ1：Dorisの設定

1. `fe/conf/fe.conf`で認証方法を設定：`authentication_type=ldap`
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

LDAP認証では、クライアントがパスワードをプレーンテキストで送信する必要があるため、クリアテキスト認証プラグインを有効にする必要があります。

**MySQLクライアント**

次のいずれかの方法でクリアテキスト認証プラグインを有効にできます:

- **方法1**: 環境変数を設定する（永続的）

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```
- **Method 2**: ログイン時にパラメータを追加する（一回限り）

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```
**JDBC Client**

1. Doris SSL が無効な場合

    Doris SSL が無効な場合、JDBC接続を使用する際にSSL制限を回避するためにカスタム認証プラグインを作成する必要があります：

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

    > [このコードリポジトリ](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test)の例を参照できます。または、`build-auth-plugin.sh`を実行してプラグインのJARファイルを直接生成し、クライアントの指定した場所に配置してください。

2. Doris SSL有効

    Doris SSLが有効な場合（`fe.conf`に`enable_ssl=true`を追加）：

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
    ```
## 認証

LDAP認証とは、Dorisのネイティブ認証メカニズムを補完するために、LDAPサービスを通じてパスワード検証を行うことを意味します。パスワード検証の優先順位は以下の通りです：

1. DorisはまずLDAPを使用してユーザーパスワードを検証します。
2. ユーザーがLDAPに存在しない場合、Dorisローカルパスワード検証にフォールバックします。
3. LDAPパスワードが正しいがDorisに対応するアカウントが存在しない場合、ログイン用の一時ユーザーが作成されます。

### ログイン動作概要

LDAPを有効にした後、異なるユーザー状態でのログイン動作は以下の通りです：

| LDAPユーザー | Dorisユーザー | 使用パスワード | ログイン結果 | ログインID |
| --------- | ---------- | ------------- | ------------ | -------------- |
| 存在 | 存在 | LDAPパスワード | 成功 | Dorisユーザー |
| 存在 | 存在 | Dorisパスワード | 失敗 | - |
| 存在しない | 存在 | Dorisパスワード | 成功 | Dorisユーザー |
| 存在 | 存在しない | LDAPパスワード | 成功 | LDAP一時ユーザー |

> **一時ユーザーについて：**
>
> - 一時アカウントは現在の接続でのみ有効で、切断時に自動的に破棄されます。
> - Dorisは一時ユーザーに対して永続的なユーザーメタデータを作成しません。
> - 一時ユーザーの権限はLDAPグループ認証によって決定されます（以下の「グループ認証」セクションを参照）。
> - 一時ユーザーに対応するグループ権限がない場合、デフォルトで`information_schema`の`select_priv`が設定されます。

### ログイン例

以下の例では、LDAP認証が有効化され、`ldap_user_filter = (&(uid={login}))`で設定されており、クライアントが`LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1`を設定していることを前提としています。

**シナリオ1：アカウントがDorisとLDAPの両方に存在**

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

LDAPパスワードでログインすると、Dorisは自動的に一時ユーザー`jack@'%'`を作成してログインします。一時ユーザーは基本権限`DatabasePrivs`: `Select_priv`を持ち、接続切断後に自動的に削除されます:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```
**シナリオ 3: アカウントが Doris にのみ存在する場合**

- Doris アカウント: `jack@'172.10.1.10'`、パスワード: `123456`

ユーザーが LDAP に存在しない場合、Doris ローカル認証にフォールバックし、Doris パスワードでログインが成功します:

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```
## グループ認可

LDAP グループ認可は、LDAP の `groups` を Doris の `roles` にマッピングして、集約的な権限管理を実現します。コアメカニズムは以下の通りです：

- LDAP ユーザーの `dn` が LDAP グループノードの `member` 属性に表示される場合、Doris はそのユーザーがそのグループに属していると判断します。
- ユーザーがログインすると、Doris は自動的に LDAP グループに対応する `role` 権限を付与します。
- ユーザーがログアウトした後、Doris は自動的にこれらの `role` 権限を取り消します。

> **前提条件:** LDAP グループ認可を使用する前に、LDAP `groups` と同じ名前の `roles` を Doris で作成し、これらの `roles` に権限を付与する必要があります。

### 権限マージルール

ログインしたユーザーの最終権限は、LDAP と Doris の両方での状態によって決まります：

| LDAP ユーザー | Doris ユーザー | 最終権限 |
| --------- | ---------- | ----------------- |
| 存在する | 存在する | LDAP グループ権限 + Doris ユーザー権限 |
| 存在しない | 存在する | Doris ユーザー権限 |
| 存在する | 存在しない | LDAP グループ権限 |

### グループ名マッピングルール

Doris は LDAP グループ `dn` の最初の `Rdn` をグループ名として抽出し、Doris 内の同じ名前の `role` にマッピングします。

例えば、ユーザー `dn` が `uid=jack,ou=aidp,dc=domain,dc=com` で、グループ情報が以下の場合：

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```
このグループ`dn`の最初の`Rdn`は`cn=doris_rd`であるため、グループ名は`doris_rd`となり、Dorisの`role` `doris_rd`に対応します。

### グループ認可の例

ユーザーjackがLDAPグループ`doris_rd`、`doris_qa`、`doris_pm`に属し、Dorisに同じ名前の`roles`：`doris_rd`、`doris_qa`、`doris_pm`が存在する場合、jackがログイン後、元のDorisアカウントの権限に加えて、これら3つの`roles`の権限も取得します。

> **注意：**
>
> - `user`がどの`group`に属するかは、LDAPツリーの組織構造とは独立しています。上記の例の`user2`は必ずしも`group2`に属するとは限りません。
> - `user2`を`group2`に属させるには、`group2`の`member`属性に`user2`を明示的に追加する必要があります。

## キャッシュ管理

LDAPサービスへの頻繁なアクセスを避けるため、DorisはLDAP情報をメモリにキャッシュします。

| 設定項目 | 説明 | デフォルト値 |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | LDAPユーザー情報のキャッシュ時間（秒） | 43200（12時間） |

以下のシナリオでは、変更を即座に有効にするためにキャッシュを手動でリフレッシュする必要がある場合があります：

- LDAPサービスでユーザーまたはグループ情報を変更した場合
- DorisでLDAPユーザーグループに対応する`Role`権限を変更した場合

`refresh ldap`文でキャッシュをリフレッシュできます。詳細は[REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP)を参照してください。

## 既知の制限事項

- 現在、DorisのLDAP機能は平文パスワード検証のみをサポートしており、ユーザーログイン時にパスワードが`client`と`fe`間、および`fe`とLDAPサービス間で平文で送信されることを意味します。

## FAQ

**Q：LDAPユーザーがDorisでどのロールを持っているかを確認する方法は？**

LDAPユーザーでDorisにログイン後、`show grants;`を実行して現在のユーザーのすべてのロールを表示します。`ldapDefaultRole`は、すべてのLDAPユーザーが持つデフォルトロールです。

**Q：LDAPユーザーのDorisでのロールが期待より少ない場合、どのようにトラブルシューティングしますか？**

以下の項目を順番に確認してください：

1. `show roles;`を実行して、期待するロールがDorisに存在するかを確認します。存在しない場合は、`CREATE ROLE role_name;`で作成してください。
2. 期待する`group`が`ldap_group_basedn`に対応する組織構造下に位置しているかを確認してください。
3. 期待する`group`に`member`属性が含まれているかを確認してください。
4. 期待する`group`の`member`属性に現在のユーザーの`dn`が含まれているかを確認してください。
