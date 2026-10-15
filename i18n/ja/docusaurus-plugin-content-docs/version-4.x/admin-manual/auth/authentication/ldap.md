---
{
    "title": "LDAP",
    "language": "ja",
    "description": "LDAP/LDAPS と連携して Apache Doris の認証とグループ認可を統合する方法を説明します。ログイン方法、権限のマッピング、よくある問題を含みます。",
    "keywords": [
        "Doris LDAP",
        "Doris LDAPS",
        "LDAP 認証",
        "LDAP グループ認可",
        "統合認証",
        "ldap.conf 設定",
        "ldap_default_roles",
        "ldap_allow_empty_pass",
        "MysqlClearPasswordPlugin",
        "ldap_admin_password",
        "ldap_use_ssl",
        "SSLHandshakeException",
        "PKIX path building failed",
        "平文パスワードプラグイン",
        "平文プラグイン",
        "空パスワードでのログイン"
    ]
}
---

Apache Doris は外部の LDAP サービスとの連携をサポートしています。既存の企業アカウントシステムを Doris の ID と権限の管理元としてそのまま利用でき、ユーザーやパスワードの二重管理を避けられます。LDAP 連携には次の機能があります。

- **認証によるログイン**: Doris のパスワードの代わりに LDAP のパスワードを使って本人確認します。
- **グループ認可**: LDAP の `group` を Doris の `role` にマッピングし、権限を一元管理します。
- **デフォルトロールによる認可**: すべての LDAP 認証ユーザーを一つの LDAP グループに追加せずに、設定した Doris ロールを付与します。

<!-- Knowledge type: Architecture decision -->
<!-- Applicable scenario: Integrating enterprise unified identity / centralized privilege management -->

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 説明 |
| --- | --- |
| 企業の統合 ID 認証 | 既存の LDAP/AD アカウントシステムを Doris ユーザーが直接利用し、Doris でアカウントを再作成したくない場合 |
| 権限の一元管理 | LDAP グループでロールのメンバーを管理し、グループのメンバー変更によって Doris の権限をまとめて調整する場合 |
| LDAP ユーザーの基本権限 | LDAP グループによる認可を維持しながら、設定を通じてすべての LDAP 認証ユーザーに同じ Doris ロールを付与する場合 |
| 一時的なアクセス | LDAP にのみ存在するユーザーが、LDAP グループの権限に基づいて一時ユーザーとして Doris にログインする場合 |
| 暗号化された通信経路 | Doris FE と LDAP サーバー間の接続を暗号化する必要がある場合（LDAPS） |

## 前提条件 {#prerequisites}

- 接続可能な LDAP/AD サービスがデプロイされており、次の情報が分かっていること。
    - LDAP サービスの `host` とポート（平文通信は `389`、LDAPS は `636`）
    - 管理者アカウントの `dn` とパスワード
    - ユーザーとグループの `basedn`
    - ユーザーフィルター（`ldap_user_filter`）
- Doris クラスターの FE 設定ファイルを読み書きでき、FE を再起動できること。
- LDAP 管理者パスワードの設定に使う `root` または `admin` アカウントがあること。
- LDAPS を有効にするには Doris **4.0.5** 以降が必要です。

## LDAP の基本概念 {#ldap-basic-concepts}

LDAP では、データをツリー構造で管理します。次に典型的な LDAP ディレクトリツリーの例を示します。

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

### 用語の説明 {#term-explanations}

| 用語 | 正式名称 | 説明 |
| --- | --- | --- |
| `dc` | Domain Component | 組織のドメイン名。ツリーのルートノードとして使用します |
| `dn` | Distinguished Name | 一意の名前。たとえば、`dn` は user1 では `cn=user1,ou=ou1,dc=example,dc=com`、`dn` は user2 では `cn=user2,cn=group2,ou=ou2,dc=example,dc=com` です |
| `rdn` | Relative Distinguished Name | `dn` の構成要素。四つの `rdn` は user1 の場合、`cn=user1`、`ou=ou1`、`dc=example`、`dc=com` です |
| `ou` | Organization Unit | 組織内の単位。`user` は `ou` の中、または example.com ドメインの直下に配置できます |
| `cn` | Common Name | 名前 |
| `group` | - | グループ。Doris のロールに対応します |
| `user` | - | ユーザー。Doris ユーザーに相当します |
| `objectClass` | - | データ型。ノードが `group` か `user` かを区別するために使用します。`group` には `cn` と `member`（`user` の一覧）属性が必要です。`user` には `cn`、`password`、`uid` などの属性が必要です |

## 連携手順の概要 {#integration-process-overview}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: First-time LDAP integration -->

1. **Doris FE を設定する**: `fe.conf` で認証方式を切り替え、`ldap.conf` に LDAP サービスの接続情報を入力します。
2. **LDAP 管理者パスワードを設定する**: Doris にログインした後、SQL で `ldap_admin_password` を設定します。
3. **クライアントを設定する**: LDAP パスワードを送信できるように、MySQL Client または JDBC Client で平文パスワードプラグインを有効にします。
4. **（任意）LDAPS を有効にする**: FE と LDAP 間の通信経路を暗号化します。
5. **（任意）グループ認可を設定する**: LDAP グループと同じ名前の `role` を Doris で作成し、権限を付与します。
6. **（任意）デフォルトロールを設定する**: `ldap_default_roles` を使って、すべての LDAP 認証ユーザーに基本的な Doris ロールを付与します。

## ステップ 1: Doris FE を設定する {#step-1-configure-doris-fe}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: LDAP integration configuration on the FE side -->

### 1.1 認証方式を切り替える {#11-switch-the-authentication-method}

`fe/conf/fe.conf` で認証方式を設定します。

```text
authentication_type=ldap
```

### 1.2 LDAP 接続情報を設定する {#12-configure-ldap-connection-information}

`fe/conf/ldap.conf` に LDAP サービスの接続情報を入力します。

```text
ldap_authentication_enabled = true
ldap_host = ladp-host
ldap_port = 389
ldap_admin_name = uid=admin,o=emr
ldap_user_basedn = ou=people,o=emr
ldap_user_filter = (&(uid={login}))
ldap_group_basedn = ou=group,o=emr
ldap_default_roles = ldap_readonly,ldap_query_user
```

各設定項目の意味は次のとおりです。

| 設定項目 | 説明 |
| --- | --- |
| `ldap_authentication_enabled` | LDAP 認証を有効にするかどうか。`true` に設定する必要があります |
| `ldap_host` | LDAP サーバーのアドレス |
| `ldap_port` | LDAP サービスのポート。デフォルトは平文 LDAP で `389`、LDAPS で `636` です |
| `ldap_admin_name` | LDAP 管理者の `dn`。Doris はこのアカウントを使ってユーザーとグループの情報を照会します |
| `ldap_user_basedn` | ユーザー検索のベース `dn` |
| `ldap_user_filter` | ユーザーの照合フィルター。`{login}` はログインユーザー名に置き換えられます |
| `ldap_group_basedn` | グループ検索のベース `dn`。グループ認可に使用します |
| `ldap_default_roles` | 任意。すべての LDAP 認証ユーザーに付与する Doris ロールをカンマ区切りで指定します。LDAP グループのロールに追加して付与されます（バージョン 4.0.7 および 4.1.3 以降でサポート） |
| `ldap_allow_empty_pass` | 任意。LDAP に存在するユーザーが空のパスワードでログインできるかどうか。デフォルトの `false` では、Doris は空パスワードでのログインを直接拒否します。変更後は FE の再起動が必要です。[空パスワードでのログイン](#empty-password-login)を参照してください（バージョン 4.1.5 以降でサポート） |

:::tip
LDAPS（LDAP サーバーへの暗号化接続）を有効にする方法は、後述の[LDAPS（暗号化接続）](#ldaps-encrypted-connection)を参照してください。
:::

### 1.3 LDAP 管理者パスワードを設定する {#13-set-the-ldap-administrator-password}

FE の起動後、`root` または `admin` アカウントで Doris にログインし、LDAP 管理者パスワードを設定します。

```sql
set ldap_admin_password = password('<ldap_admin_password>');
```

このパスワードは、`ldap_admin_name` に対応するアカウントのパスワードです。Doris は LDAP サービスへの照会に使用します。

## ステップ 2: クライアントを接続する {#step-2-client-connection}

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Enabling the cleartext password plugin on the client -->

LDAP 認証では、クライアントがパスワードを平文で送信する必要があるため、平文認証プラグインを有効にする必要があります。

### 2.1 MySQL Client {#21-mysql-client}

次のいずれかの方法で平文認証プラグインを有効にできます。

- **方法 1**: 環境変数を設定する（継続的に有効）

    ```shell
    echo "export LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1" >> ~/.bash_profile && source ~/.bash_profile
    ```

- **方法 2**: ログイン時にパラメーターを追加する（そのときだけ有効）

    ```shell
    mysql -hDORIS_HOST -PDORIS_PORT -u user -p --enable-cleartext-plugin
    ```

### 2.2 JDBC Client {#22-jdbc-client}

JDBC では、デフォルトで SSL 上でのみ平文パスワードプラグインを使用できます。JDBC URL の指定方法は、SSL が有効かどうかによって異なります。

#### シナリオ A: Doris で SSL が有効になっていない場合 {#scenario-a-ssl-is-not-enabled-in-doris}

SSL の制限を回避するには、カスタム認証プラグインが必要です。

1. `MysqlClearPasswordPlugin` を継承し、`requiresConfidentiality()` メソッドをオーバーライドするカスタムプラグインクラスを作成します。

    ```java
    public class MysqlClearPasswordPluginWithoutSSL extends MysqlClearPasswordPlugin {
        @Override
        public boolean requiresConfidentiality() {
            return false;
        }
    }
    ```

2. JDBC 接続 URL にカスタムプラグインを指定します（`xxx` は実際のパッケージ名に置き換えてください）。

    ```sql
    jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?authenticationPlugins=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&defaultAuthenticationPlugin=xxx.xxx.xxx.MysqlClearPasswordPluginWithoutSSL&disabledAuthenticationPlugins=com.mysql.jdbc.authentication.MysqlClearPasswordPlugin";
    ```

    設定する三つのプロパティは次のとおりです。

    | プロパティ | 説明 |
    | --- | --- |
    | `authenticationPlugins` | カスタムの平文認証プラグインを登録します |
    | `defaultAuthenticationPlugin` | カスタムプラグインをデフォルトの認証プラグインに設定します |
    | `disabledAuthenticationPlugins` | SSL を必須とする元の平文認証プラグインを無効にします |

:::tip
関連する例は[こちらのコードリポジトリ](https://github.com/morningman/doris-debug-tools/tree/main/jdbc-test)を参照してください。`build-auth-plugin.sh` を直接実行すると、上記のプラグイン JAR が生成されます。生成した JAR をクライアントの所定の場所に配置できます。
:::

#### シナリオ B: Doris で SSL が有効になっている場合 {#scenario-b-ssl-is-enabled-in-doris}

`enable_ssl=true` を `fe.conf` に追加すると、JDBC URL で MySQL 標準の平文パスワードプラグインを直接使用できます。

```sql
jdbcUrl = "jdbc:mysql://localhost:9030/mydatabase?useSSL=true&sslMode=REQUIRED
```

## 認証によるログイン {#authentication-login}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Understanding user authentication priority -->

LDAP 認証によるログインでは、Doris 自身の認証機構を補完する形で LDAP サービスを使ってパスワードを検証します。パスワード検証の優先順位は次のとおりです。

1. Doris はまず LDAP でユーザーのパスワードを検証します。
2. ユーザーが LDAP に存在しない場合は、Doris のローカルパスワード検証に切り替えます。
3. LDAP のパスワードが正しく、対応するアカウントが Doris に存在しない場合は、ログイン用の一時ユーザーを作成します。

### ログイン動作の概要 {#login-behavior-overview}

LDAP を有効にした後の、ユーザーの状態ごとのログイン動作は次のとおりです。

| LDAP ユーザー | Doris ユーザー | 使用するパスワード | ログイン結果 | ログイン時の ID |
| --------- | ---------- | -------------- | ------------ | -------------- |
| 存在する | 存在する | LDAP のパスワード | 成功 | Doris ユーザー |
| 存在する | 存在する | Doris のパスワード | 失敗 | - |
| 存在しない | 存在する | Doris のパスワード | 成功 | Doris ユーザー |
| 存在する | 存在しない | LDAP のパスワード | 成功 | LDAP の一時ユーザー |
| 存在する | 任意 | 空のパスワード | デフォルトでは失敗（`ldap_allow_empty_pass = false`） | - |

:::info 一時ユーザーについて

- 一時アカウントは現在の接続でのみ有効で、接続が閉じられると自動的に削除されます。
- Doris は一時ユーザーの永続的なユーザーメタデータを作成しません。
- 一時ユーザーの権限は LDAP グループ認可と `ldap_default_roles` によって決まります（後述の「グループ認可」と「LDAP ユーザーのデフォルトロール」を参照）。
- 対応するグループ権限も設定済みのデフォルトロールもない一時ユーザーには、`select_priv` 権限が `information_schema` に対してデフォルトで付与されます。

:::

### 空パスワードでのログイン {#empty-password-login}

:::info バージョン 4.1.5 以降でサポート
:::

デフォルト（`ldap_allow_empty_pass = false`）では、LDAP に存在するユーザーが空のパスワードでログインしようとすると、Doris はアクセス拒否エラーを返して直接拒否します。そのパスワードで LDAP サーバーへのバインドは試みません。FE は `Rejected LDAP login with empty password, user=jack` のような警告を `fe.log` に記録します。

このデフォルト設定には理由があります。LDAP プロトコルでは、`dn` を指定し、パスワードを空にしたバインド要求は*未認証バインド*として扱われます。Active Directory など、一部のディレクトリサーバーはこのバインドを受け入れ、成功を返します。Doris が空のパスワードをそのまま転送すると、有効な LDAP ユーザー名を知っているだけで、パスワードなしに Doris へログインできる可能性があります。4.1.5 より前のバージョンでは、Doris は空のパスワードを常に LDAP サーバーへ転送していたため、ログインの成否は LDAP サーバーの設定だけで決まっていました。

以前の動作を維持する必要がある場合は、`fe/conf/ldap.conf` に次を設定し、FE を再起動します。

```text
ldap_allow_empty_pass = true
```

設定後、Doris 自身は空のパスワードを検査せず、バインド要求を LDAP サーバーへ転送します。その後のログインの成否は、LDAP サーバーが未認証バインドを受け入れるかどうかで決まります。

:::caution

- `ldap_allow_empty_pass` を有効にすると、前述のセキュリティリスクが再び生じます。本番環境ではデフォルトの `false` を維持してください。
- `ldap_allow_empty_pass` は `ADMIN SET FRONTEND CONFIG` でオンライン変更できません。変更後は FE の再起動が必要です。
- この設定が影響するのは LDAP に存在するユーザーだけです。Doris にのみ存在するユーザーは、引き続き Doris のローカルパスワードで検証されます。

:::

### ログイン例 {#login-examples}

以下の例では、LDAP 認証が有効で、`ldap_user_filter = (&(uid={login}))` が設定され、クライアントには `LIBMYSQL_ENABLE_CLEARTEXT_PLUGIN=1` が設定されているものとします。

**シナリオ 1: アカウントが Doris と LDAP の両方に存在する場合**

- Doris アカウント: `jack@'172.10.1.10'`、パスワード: `123456`
- LDAP ユーザー属性: `uid: jack`、パスワード: `abcdef`

LDAP のパスワードでログインすると成功します。

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

Doris のパスワードでログインすると失敗します（LDAP が有効な場合、LDAP ユーザーは LDAP のパスワードを使う必要があります）。

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**シナリオ 2: ユーザーが LDAP にのみ存在する場合**

- LDAP ユーザー属性: `uid: jack`、パスワード: `abcdef`

LDAP のパスワードでログインします。Doris は一時ユーザー `jack@'%'` を自動的に作成してログインさせます。利用可能な場合、一時ユーザーには LDAP グループのロールと設定済みのデフォルトロールが付与されます。一致するロールがない場合は、基本権限 `DatabasePrivs`: `Select_priv` が付与され、接続が閉じられた後に自動的に削除されます。

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p abcdef
```

**シナリオ 3: アカウントが Doris にのみ存在する場合**

- Doris アカウント: `jack@'172.10.1.10'`、パスワード: `123456`

ユーザーが LDAP に存在しないため、Doris のローカル認証に切り替わります。Doris のパスワードでログインすると成功します。

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack -p 123456
```

**シナリオ 4: LDAP ユーザーが空のパスワードでログインする場合**

- LDAP ユーザー属性: `uid: jack`、パスワード: `abcdef`

パスワードを入力せずにログインします。デフォルトの `ldap_allow_empty_pass = false` では、Doris は直接ログインを拒否します（[空パスワードでのログイン](#empty-password-login)を参照）。

```sql
mysql -hDoris_HOST -PDoris_PORT -ujack
```

## グループ認可 {#group-authorization}

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenario: Mapping LDAP groups to Doris roles -->

LDAP グループ認可では、LDAP の `group` を Doris の `role` にマッピングして権限を一元管理します。主な仕組みは次のとおりです。

- LDAP ユーザーの `dn` が LDAP グループノードの `member` 属性に含まれる場合、Doris はそのユーザーがグループに属すると判断します。
- ユーザーがログインすると、所属する LDAP グループに対応する `role` の権限が自動的に付与されます。
- `ldap_default_roles` が設定されている場合は、それらのデフォルトロールも付与されます。
- ユーザーがログアウトすると、これらの `role` の権限は Doris によって自動的に取り消されます。

:::caution 前提条件
LDAP グループ認可を使用する前に、Doris で `role` を作成します。その名前を LDAP の `group` と同じにし、`role` に権限を付与する必要があります。
:::

### 権限の統合ルール {#privilege-merge-rules}

ログインしたユーザーの最終的な権限は、LDAP と Doris でのユーザーの状態によって異なります。

| LDAP ユーザー | Doris ユーザー | 最終的な権限 |
| --------- | ---------- | ---------------- |
| 存在する | 存在する | LDAP グループの権限 + 設定済みのデフォルトロール + Doris ユーザーの権限 |
| 存在しない | 存在する | Doris ユーザーの権限 |
| 存在する | 存在しない | LDAP グループの権限 + 設定済みのデフォルトロール |

### グループ名のマッピングルール {#group-name-mapping-rules}

Doris は LDAP グループの最初の `Rdn` を、そのグループの `dn` からグループ名として取り出し、Doris 内の同名の `role` にマッピングします。

たとえば、ユーザーの `dn` が `uid=jack,ou=aidp,dc=domain,dc=com` で、グループ情報が次の場合を考えます。

```text
dn: cn=doris_rd,ou=group,dc=domain,dc=com  
objectClass: groupOfNames  
member: uid=jack,ou=aidp,dc=domain,dc=com  
```

グループの最初の `Rdn` は、そのグループの `dn` では `cn=doris_rd` です。そのため、グループ名は `doris_rd` となり、Doris の `role` `doris_rd` に対応します。

### グループ認可の例 {#group-authorization-example}

ユーザー jack が LDAP グループ `doris_rd`、`doris_qa`、`doris_pm` に属し、Doris にも同名の `role` `doris_rd`、`doris_qa`、`doris_pm` があるとします。jack はログインすると、Doris アカウントの既存の権限に加えて、これら三つの `role` の権限を取得します。

:::note 注記

- どの `group` に `user` が属するかは、LDAP ツリーの組織構造とは無関係です。上の例で、`user2` が必ず `group2` に属するわけではありません。
- `user2` を `group2` に所属させるには、`user2` を `member` 属性（`group2` の属性）に明示的に追加する必要があります。

:::

## LDAP ユーザーのデフォルトロール {#default-roles-for-ldap-users}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Granting baseline Doris privileges to all LDAP-authenticated users -->

:::info バージョン 4.0.7 および 4.1.3 以降でサポート
:::

`ldap_default_roles` は、すべての LDAP 認証ユーザーに基本的な Doris ロールを付与するために使用します。すべての LDAP ユーザーに同じ基本権限を与えたいものの、全員を含む専用の LDAP グループを維持しにくい場合に役立ちます。

`ldap_default_roles` は LDAP グループ認可の代わりにはなりません。LDAP ユーザーがログインすると、Doris は次のすべての権限を統合します。

- ユーザーが所属する LDAP グループからマッピングされた Doris ロール。
- `ldap_default_roles` に設定された Doris ロール。
- 同じアカウントが Doris にも存在する場合、その Doris ユーザーが持つ既存の権限。
- 組み込みの `ldapDefaultRole`。`select_priv` を `information_schema` に対して付与します。

:::caution 前提条件
`ldap_default_roles` に指定するロールは、Doris にすでに存在している必要があります。設定したロールが存在しない場合、Doris はそのロールを無視して警告をログに記録します。
:::

### デフォルトロールを設定する {#configure-default-roles}

ロールを作成し、権限を付与します。

```sql
CREATE ROLE ldap_readonly;
CREATE ROLE ldap_query_user;

GRANT SELECT_PRIV ON internal.example_db.* TO ROLE 'ldap_readonly';
GRANT SELECT_PRIV ON internal.example_db.example_table TO ROLE 'ldap_query_user';
```

`fe/conf/ldap.conf` でロールを設定します。

```text
ldap_default_roles = ldap_readonly,ldap_query_user
```

値はオンラインでも更新できます。

```sql
ADMIN SET FRONTEND CONFIG ("ldap_default_roles" = "ldap_readonly,ldap_query_user");
```

`ldap_default_roles` をオンラインで更新すると、Doris は LDAP ユーザーキャッシュを自動的に更新します。その後の LDAP ログインでは、新しいデフォルトロールが使用されます。

## LDAPS（暗号化接続） {#ldaps-encrypted-connection}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Encrypting the channel between FE and the LDAP server -->

:::info バージョン 4.0.5 以降でサポート
:::

デフォルトでは、Doris は平文の LDAP プロトコルで LDAP サーバーと通信します。バージョン 4.0.5 以降では、Doris は LDAPS（LDAP over SSL/TLS）をサポートし、Doris FE と LDAP サーバー間の接続を暗号化できます。

### LDAPS を有効にする {#enable-ldaps}

`fe/conf/ldap.conf` でポートを LDAPS のポート（通常は `636`）に変更し、SSL を有効にします。

```text
ldap_host = ldap-host
ldap_port = 636
ldap_use_ssl = true
```

`ldap_use_ssl` を `true` に設定すると、Doris は `ldaps://` プロトコルで LDAP サーバーに接続します。

### 証明書の信頼を設定する {#configure-certificate-trust}

LDAPS を使用する場合、Doris FE の JVM が LDAP サーバーの SSL 証明書を信頼している必要があります。

- LDAP サーバーの証明書が一般に信頼されている公開 CA によって発行されている場合、追加の設定は不要です。
- 独自の CA または自己署名 CA を使用する場合は、CA 証明書を Java の trustStore にインポートし、その trustStore を使用するように JVM を設定する必要があります。

trustStore のパラメーターを `JAVA_OPTS` に追加します。設定箇所は `fe/conf/fe.conf` です。例:

```text
# JDK 17 example
JAVA_OPTS_FOR_JDK_17 = "-Djavax.net.ssl.trustStore=/path/to/your/cacerts -Djavax.net.ssl.trustStorePassword=changeit ..."
```

自己署名 CA 証明書をインポートする手順は次のとおりです。

1. CA 証明書ファイル（例: `ca.crt`）を取得します。
2. `keytool` を使って Java の trustStore にインポートします。

    ```shell
    keytool -importcert -alias ldap-ca -keystore /path/to/your/cacerts -file /path/to/ca.crt -storepass changeit -noprompt
    ```

3. 上記のとおり `JAVA_OPTS` に trustStore のパスを設定します。
4. 設定を反映するために Doris FE を再起動します。

## キャッシュ管理 {#cache-management}

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenario: Forcing a refresh after LDAP information changes -->

LDAP サービスへの頻繁なアクセスを避けるため、Doris は LDAP 情報をメモリにキャッシュします。

| 設定項目 | 説明 | デフォルト値 |
| --- | --- | --- |
| `ldap_user_cache_timeout_s` | LDAP ユーザー情報のキャッシュ期間（秒） | 43200（12 時間） |

次の場合は、変更をすぐに反映するためにキャッシュを手動で更新する必要があることがあります。

- LDAP サービスのユーザー情報またはグループ情報を変更した場合。
- Doris で LDAP ユーザーグループに対応する `Role` の権限を変更した場合。

`ldap_default_roles` をオンラインで更新すると、LDAP ユーザーキャッシュは自動的に更新されます。この設定変更だけを理由に `refresh ldap` を実行する必要はありません。

キャッシュは `refresh ldap` ステートメントで更新できます。詳しくは [REFRESH-LDAP](../../../sql-manual/sql-statements/account-management/REFRESH-LDAP) を参照してください。

## 既知の制限 {#known-limitations}

- Doris の LDAP 機能では、クライアントから FE への通信経路上では平文パスワードによる検証のみをサポートします。つまり、ユーザーのログイン時には `client` と `fe` の間でパスワードが平文で送信されます。クライアントと Doris FE の間を SSL/TLS で暗号化するには、別途設定が必要です（[クライアントの接続](#step-2-client-connection)を参照）。
- FE から LDAP サーバーへの通信経路は、デフォルトでは平文です（`ldap_use_ssl = false`）。この経路を暗号化するには、`ldap_use_ssl = true` を設定して LDAPS を有効にします（[LDAPS（暗号化接続）](#ldaps-encrypted-connection)を参照）。

## よくある質問 {#frequently-asked-questions}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Login failure / empty-password login rejected / missing roles / LDAPS handshake failure -->

### Q: LDAP ユーザーが Doris で持つロールを確認するには？ {#q-how-do-i-view-which-roles-an-ldap-user-has-in-doris}

LDAP ユーザーで Doris にログインした後、`show grants;` を実行すると、現在のユーザーが持つすべてのロールを確認できます。このうち `ldapDefaultRole` は、すべての LDAP ユーザーが持つデフォルトロールです。

`ldapDefaultRole` は、`select_priv` を `information_schema` に対して付与する組み込みの一時ロールです。`ldap_default_roles` に設定したロールとは異なります。

### Q: LDAP ユーザーが Doris で持つロールが想定より少ない場合、どう調査すればよいですか？ {#q-an-ldap-user-has-fewer-roles-in-doris-than-expected-how-do-i-troubleshoot}

次の項目を順番に確認してください。

1. `show roles;` を実行し、期待するロールが Doris に存在するか確認します。存在しない場合は `CREATE ROLE role_name;` で作成します。
2. 期待する `group` が `ldap_group_basedn` に対応する組織構造の下にあるか確認します。
3. 期待する `group` に `member` 属性があるか確認します。
4. `member` 属性（期待する `group` の属性）に現在のユーザーの `dn` が含まれているか確認します。
5. 不足しているロールが `ldap_default_roles` に設定されている場合は、ロール名のスペルが正しいか、そのロールが Doris に存在するか確認します。

### Q: 以前は空のパスワードでログインできた LDAP ユーザーが、アップグレード後にログインできなくなったのはなぜですか？ {#q-an-ldap-user-could-log-in-with-an-empty-password-before-but-the-login-fails-after-upgrading-why}

バージョン 4.1.5 以降、LDAP に存在するユーザーが空のパスワードでログインすると、Doris はデフォルトで拒否します（`ldap_allow_empty_pass = false`）。一部の LDAP サーバーでは、空のパスワードによるバインドが未認証バインドとして成功するためです。このような試行は `fe.log` に `Rejected LDAP login with empty password` と記録されます。

ユーザーには LDAP のパスワードでログインするよう案内してください。以前の動作を維持する必要がある場合は、`ldap_allow_empty_pass = true` を `fe/conf/ldap.conf` に設定し、FE を再起動します。本番環境では推奨しません。詳しくは[空パスワードでのログイン](#empty-password-login)を参照してください。

### Q: LDAPS 接続に失敗する場合、どう調査すればよいですか？ {#q-ldaps-connection-fails-how-do-i-troubleshoot}

次の項目を順番に確認してください。

1. `ldap_use_ssl = true` が `fe/conf/ldap.conf` に設定されているか確認します。
2. `ldap_port` が正しい LDAPS ポート（通常は `636`）に設定されているか確認します。
3. Doris FE の JVM が LDAP サーバーの SSL 証明書を信頼しているか確認します。`fe.log` に `SSLHandshakeException` や `PKIX path building failed` などの SSL ハンドシェイクエラーがないか調べます。
4. 自己署名 CA を使用している場合は、CA 証明書が trustStore にインポートされ、`JAVA_OPTS` の trustStore パスが正しく設定されているか確認します。
