---
{
    "title": "Ranger-Hive による認可",
    "description": "Kerberos、ポリシー、行フィルタリング、データマスキングを含む、Doris Hive Catalog の Ranger-Hive 認可を設定します。",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Hive Catalog 認可",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "行フィルター",
        "データマスキング",
        "Doris Hive Catalog Ranger 認可",
        "Ranger Admin Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml が見つからない",
        "Ranger Hive ポリシーのダウンロード失敗",
        "Doris 4.x Ranger Hive"
    ],
    "language": "ja"
}
---

<!-- Knowledge Type: Configuration Guide / Authorization -->
<!-- Use Case: Hive Catalog Authorization / Reusing Ranger Hive Policies -->

Apache Doris では、個々の Hive Catalog に Ranger-Hive Access Controller を割り当てることができます。これにより Doris は、その Catalog 内のデータベース、テーブル、カラムの認可に、Apache Ranger で管理されている既存の Hive ポリシーを再利用します。Ranger の行レベルフィルター、データマスキング、監査にも対応しています。

組織がすでに Ranger で Hive の権限を管理しており、同じデータに対する Doris のクエリにもそのポリシーを適用したい場合に、この方式を使用します。

Ranger-Hive が制御するのは、この Access Controller を設定した Hive Catalog のみです。Doris クラスター全体の認可に代わるものではなく、基盤となる HDFS、S3、その他のストレージシステムに Ranger ポリシーを適用するものでもありません。

## ユースケース

| シナリオ | 対応 | 説明 |
| --- | --- | --- |
| Doris 経由でクエリする Hive データに既存の Ranger Hive ポリシーを再利用する | はい | 対象の Hive Catalog に Ranger-Hive Access Controller を設定します |
| Ranger で Doris クラスター全体の権限を一元管理する | いいえ | Ranger-Doris を使用します |
| 基盤となる HDFS または S3 ストレージへのアクセスを認可する | いいえ | ストレージシステム側でアクセス制御と認証情報の分離を行います |
| Hive/HMS 以外の Catalog に Ranger 認可を設定する | いいえ | Ranger-Hive は Hive/HMS Catalog のみに適用されます |

<!-- Knowledge Type: Architecture Decision -->
<!-- Use Case: Choosing Ranger-Doris or Ranger-Hive / Confirming Authorization Boundaries -->

## Ranger-Doris と Ranger-Hive

Ranger-Doris と Ranger-Hive の用途は異なります。

| 項目 | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| 主な用途 | Ranger で Doris クラスターの権限を一元管理する | 特定の Hive Catalog に既存の Ranger Hive ポリシーを適用する |
| 有効化 | FE 設定 `access_controller_type=ranger-doris` | Catalog プロパティ `access_controller.class` |
| Ranger サービスタイプ | Doris。Doris Ranger プラグインとサービス定義が必要 | Hive。Ranger に組み込まれた Hive サービス定義を使用 |
| リソース階層 | Doris の Global、Catalog、Database、Table、Column など | Hive の Database、Table、Column |
| 適用範囲 | Doris クラスターのデフォルト Access Controller | コントローラーを宣言した外部 Catalog のみ |
| ポリシーの共有 | Doris ポリシーは Hive ポリシーに変換されない | Hive ポリシーは Ranger-Doris ポリシーを参照しない |

両者は同じ Doris クラスターで使用できます。たとえば、Ranger-Doris をデフォルト Access Controller とし、`hive_ctl` では Ranger-Hive を使用できます。Hive Catalog で Ranger-Hive を有効にした場合、リクエストは次のように振り分けられます。「デフォルト Access Controller」は Doris 組み込みの認可または Ranger-Doris です。

### 認可の境界

| 権限の範囲 | コントローラー | 備考 |
| --- | --- | --- |
| Global | デフォルト Access Controller | Ranger-Hive には Doris の Global リソースがありません |
| Catalog | デフォルト Access Controller | Ranger Hive には Doris の Catalog リソースがありません |
| Database | 現在の Catalog の Ranger-Hive | Ranger リソースは Hive データベース名です |
| Table / View | 現在の Catalog の Ranger-Hive | Ranger リソースは Hive データベース名とテーブル名です |
| Column | 現在の Catalog の Ranger-Hive | 参照する各カラムを個別に検査します |
| Row Level Filter | 現在の Catalog の Ranger-Hive | Doris は Ranger からフィルター式を取得します。`root` と `admin` にはポリシーを適用しません |
| Data Masking | 現在の Catalog の Ranger-Hive | Doris は Ranger からカラムのマスキングルールを取得します。`root` と `admin` にはポリシーを適用しません |
| Resource、Storage Vault、Compute Group | デフォルト Access Controller | これらのリソースは Ranger-Hive のモデルに含まれません |
| HDFS、S3、その他のストレージ | Ranger-Hive では検査しない | Doris は Catalog に設定されたストレージ認証情報で引き続きデータを読み取ります |

:::warning
デフォルト Access Controller が対応する Global 権限を付与している場合、Ranger-Hive がリソースを拒否しても、データベース、テーブル、カラムの最終的な検査は成功します。拒否ポリシーは、`ADMIN_PRIV` も Global の `SELECT_PRIV` も持たない通常のユーザーでテストしてください。`root` や `admin` は使用しないでください。
:::

## 前提条件

- Ranger Admin がデプロイされており、すべての Doris FE からアクセスできること。
- Ranger に Hive サービスが存在すること。このガイドでは、Service Name として `hive_prod` を使用します。
- Doris のユーザーと Catalog を作成する権限があること。Ranger は認可を行いますが、Doris ユーザーの作成やパスワード認証は行いません。
- Hive Catalog に、Hive Metastore と基盤ストレージへのアクセスに必要なネットワーク、認証、権限の設定がすでにあること。
- すべての FE が Ranger 設定ファイルを読み取れること。ローカルポリシーキャッシュを設定する場合、FE プロセスのユーザーがそのディレクトリを作成または書き込みできること。

## 設定の概要

以下の手順では、Ranger WebUI の Hive サービス `hive_prod`、Doris Catalog `hive_ctl`、ユーザー `alice` を使用します。

1. Ranger WebUI で Hive サービス `hive_prod` を確認または作成します。
2. すべての FE に `ranger-hive-security.xml` と `ranger-hive-audit.xml` を配置し、ポリシーキャッシュディレクトリを作成して、FE を再起動します。
3. Doris ユーザー `alice` と、Ranger-Hive を有効にした Hive Catalog `hive_ctl` を作成します。
4. `alice` のアクセスポリシーを Ranger の `hive_prod` サービスに作成します。
5. `alice` として Doris にログインし、許可されるアクセスと拒否されるアクセスを検証します。

Ranger Admin で Kerberos または HTTPS を使用する場合は、まず基本設定を完了してから、このガイドの後半にある対応するセキュリティ設定を適用してください。

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Basic Ranger-Hive Configuration -->

## Ranger サービスと FE の設定

### Ranger Hive サービスの確認

Ranger WebUI の Service Manager ページで Hive サービスを確認または作成します。

| Ranger WebUI の項目 | 例 | 説明 |
| --- | --- | --- |
| Service Type | `Hive` | Ranger の Hive サービス定義を使用します。Doris Ranger プラグインは不要です |
| Service Name | `hive_prod` | Hive ポリシーを保存する Ranger サービスインスタンスです |

HiveServer2 がすでに `hive_prod` を使用している場合、Doris は同じポリシーを読み取れます。Doris 専用のサービスを別途作成する必要はありません。

### すべての FE に設定ファイルを用意する

各 FE の `fe/conf/` ディレクトリに以下のファイルを配置します。

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # Only for custom HTTPS trust or mutual TLS
```

`ranger-hive-security.xml` と `ranger-hive-audit.xml` は一緒に配置してください。監査が不要でも監査ファイルを配置して明示的に無効化すると、Ranger 2.7 が従来の監査設定へのフォールバックを行うのを防げます。`ranger-policymgr-ssl.xml` が必要なのは、Ranger Admin がカスタムトラストストアまたはクライアント証明書を使用する HTTPS の場合だけです。

#### ranger-hive-security.xml の設定

以下のテンプレートをすべての FE の `fe/conf/` に保存し、サービス名、アドレス、パスを置き換えます。

`ranger-hive-security.xml` の例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <!-- The Hive Service Name in Ranger WebUI -->
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <!-- Set an absolute ranger-policymgr-ssl.xml path for HTTPS; otherwise leave empty -->
    <property>
        <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
        <value></value>
    </property>
</configuration>
```

`ranger-hive-security.xml` のプロパティは次のとおりです。

| プロパティ | 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `ranger.plugin.hive.service.name` | はい | なし | `<value>` は、`hive_prod` など、Ranger WebUI の Hive Service Name と完全に一致する必要があります |
| `ranger.plugin.hive.policy.source.impl` | いいえ | Ranger Admin REST クライアント | ポリシー取得に使用する実装です |
| `ranger.plugin.hive.policy.rest.url` | はい | なし | ポリシー API のパスを含まない Ranger Admin のルート URL です |
| `ranger.plugin.hive.policy.cache.dir` | このガイドの本番環境設定では必須 | ローカルキャッシュなし | テンプレートではパスの例を指定しています。事前にディレクトリを作成し、FE プロセスのユーザーに書き込み権限を与えてください |
| `ranger.plugin.hive.policy.pollIntervalMs` | いいえ | `30000` ミリ秒 | ポリシーのポーリング間隔です |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | いいえ | `120000` ミリ秒 | Ranger Admin への接続タイムアウトです。テンプレートでは `60000` ミリ秒に上書きします |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | いいえ | `30000` ミリ秒 | Ranger Admin の応答読み取りタイムアウトです。テンプレートでは `60000` ミリ秒に上書きします |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | カスタム HTTPS トラスト設定では必須 | 空 | `ranger-policymgr-ssl.xml` の絶対パスです |

#### ポリシーキャッシュディレクトリの作成

Ranger-Doris と Ranger-Hive には、それぞれ別の `policy.cache.dir` パスを使用します。たとえば、`/var/lib/doris/ranger/doris_prod/policy-cache` と `/var/lib/doris/ranger/hive_prod/policy-cache` です。同じ Ranger Hive サービスを再利用する Catalog は、同じ Hive プラグイン設定とキャッシュを読み取ります。

この例では `/var/lib/doris/ranger/hive_prod/policy-cache` を使用します。各 FE で以下を `root` として実行するか、`sudo` を追加します。

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

これらのコマンドは、FE がユーザーおよびグループ `doris:doris` で実行されていることを前提としています。実際のプロセスのユーザーとグループに合わせて置き換えてください。`sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache` で書き込み権限を確認します。`sudo` が使えない場合は、FE プロセスのユーザーとして同等の確認を行ってください。

#### ranger-hive-audit.xml の設定

このガイドでは、Ranger 監査をデフォルトで無効にします。監査を無効にする場合でも、すべての FE に次の `fe/conf/ranger-hive-audit.xml` を保存します。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false` は Ranger の認可監査出力を無効にします。本番環境で監査する場合は、使用する Ranger バージョンの Hive 監査テンプレートを基に、Solr、HDFS、Kafka などの集中管理バックエンドを設定して、このプロパティを `true` にします。Log4j は、本番環境の監査先として推奨しません。監査レコードが FE ログのローテーションポリシーを共有するため、保持期間と総容量を個別に制御しにくいためです。

#### FE の再起動

XML ファイルとキャッシュディレクトリの設定後、Catalog を作成する前にすべての FE を再起動します。Ranger 設定は Access Controller の初期化時に読み込まれるため、すべての FE で同じファイルとパスを使用する必要があります。

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Creating a Hive Catalog with Ranger-Hive Enabled -->

## ユーザーと Hive Catalog の作成

### Doris ユーザーの作成

Ranger ユーザーと同じ名前の Doris ログインユーザーを作成します。

```sql
CREATE USER 'alice' IDENTIFIED BY 'R8!mQ2#vL7@k';
```

### Ranger-Hive を使用する Hive Catalog の作成

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger-Hive は Doris の Catalog レベルの権限を管理しません。デフォルトの Catalog 権限チェックが有効な場合、新しく作成した `hive_ctl` をユーザーが見つけて使用できるように、デフォルト Access Controller 側でも許可する必要があります。デフォルトコントローラーが Doris 組み込みの認可である場合は、次を実行します。

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

この権限付与は、Doris の Catalog レベルの検査を通すためだけのものです。`hive_ctl` 内のデータベース、テーブル、カラムへのアクセスは、引き続きその Ranger-Hive Access Controller が検査します。

次の名前は混同しやすいため、区別してください。

| 設定箇所 | 例 | 意味 |
| --- | --- | --- |
| Catalog の `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Ranger-Hive Access Controller ファクトリの完全修飾クラス名です。Current と 4.x では短い識別子 `ranger-hive` も使用できます。Ranger Service Name を入力しないでください |
| Catalog の `access_controller.properties.ranger.service.name` | `hive` | Ranger プラグインの設定プレフィックスとサービスタイプです。Doris は `access_controller.properties.` を取り除き、`ranger.service.name=hive` を Ranger に渡します |
| `ranger.plugin.hive.service.name`（`fe/conf/ranger-hive-security.xml` 内） | `hive_prod` | `<value>` は、Ranger WebUI でポリシーを保存する Hive Service Name です |

:::caution
Catalog プロパティを `'access_controller.properties.ranger.service.name'='hive_prod'` に設定しないでください。この標準設定では `hive` にする必要があります。Ranger WebUI の実際の Service Name は、`ranger.plugin.hive.service.name` に設定します。このプロパティは `ranger-hive-security.xml` 内にあります。例：`<value>hive_prod</value>`。
:::

Hive Metastore、HDFS、オブジェクトストレージへの接続は、[Hive Catalog](../../../lakehouse/catalogs/hive-catalog) のドキュメントに従って設定してください。Ranger Admin または HMS/HDFS で Kerberos を使用する場合は、後述の Kerberos セクションを参照してください。これらの接続は、異なるプリンシパル、keytab、設定箇所を使用します。

Catalog の作成時、FE は Access Controller をインスタンス化して設定を検証します。他の FE は、その Catalog へのリクエストを初めて認可する際に、使用中のコントローラーを必要に応じて初期化します。

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Creating and Verifying a Ranger Hive Access Policy -->

## Ranger ポリシーの設定と検証

### Ranger アクセスポリシーの作成

Ranger WebUI で Hive サービス `hive_prod` を開き、Access Policy を作成します。

| 項目 | 例 |
| --- | --- |
| ポリシー名（Policy Name） | `alice_read_sales_orders` |
| データベース（Database） | `sales` |
| テーブル（Table） | `orders` |
| カラム（Column） | `*` |
| 対象ユーザー（Select User） | `alice` |
| 権限（Permissions） | `select` |

ポリシーを保存し、ポーリング間隔一回分待ちます。この例では約 30 秒です。

### 認可の検証

`alice` として Doris にログインし、次を実行します。

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

期待される動作：

- `alice` は `sales` を表示でき、`orders` をクエリできます。
- `hive_ctl.sales.customers` など、許可されていないテーブルをクエリすると権限エラーが返されます。
- 集中管理された Ranger 監査が有効な場合、そのバックエンドには許可されたリクエストと拒否されたリクエストの両方が記録されます。

<!-- Knowledge Type: Permission Mapping / Behavior Reference -->
<!-- Use Case: Ranger Policy Design / Authorization Troubleshooting -->

## 認可の動作

### 権限のマッピング

次の表は、`RangerHiveAccessController` の 4.x における基本的なマッピングです。4.x では、Ranger にリクエストを送る前に、Doris はユーザー名、ロール名、データベース名から Cluster Namespace のプレフィックスも削除します。マッピングが存在しても、すべての SQL 文でその検査が行われるとは限りません。文のサポート状況は、該当する Doris バージョンで実装された認可経路にも依存します。

| Doris の権限述語 | Ranger のアクセスタイプ |
| --- | --- |
| `SHOW` | `ANY_ACCESS`。リソースに対する何らかのアクセスが許可されていることを意味します |
| `SELECT` | `select` |
| `LOAD` | `update` |
| `ALTER` | `alter` |
| `CREATE` | `create` |
| `DROP` | `drop` |
| `ADMIN` / `ALL` | `all` |
| その他のマッピングされていない述語 | `none` |

Ranger-Hive のリソースに含まれるのは `database`、`table`、`column` のみで、Doris Catalog 名は含まれません。二つの Doris Catalog がともに `hive_prod` を使用し、両方に `sales.orders` がある場合、そのリソースには両方の Catalog で同じ Ranger ポリシーが一致します。

### ユーザー名とロール名の照合

- Doris はユーザーを認証した後、現在の Doris ユーザー名を Ranger リクエストで送信します。セッション名に Cluster Namespace を保持する 4.x バージョンでは、まずそのプレフィックスを削除します。Ranger のユーザー名は、削除後の名前と一致する必要があります。
- Ranger-Hive を使用する Catalog では、データベース、テーブル、カラムの権限は Ranger-Hive だけが判定します。これらの範囲に対する Doris オブジェクト権限の付与結果は判定に組み合わせられません。ただし、Doris の Global 権限があれば検査が早期に成功する場合があり、Catalog 権限は引き続きデフォルト Access Controller が管理します。
- Doris は、Doris ユーザーが現在持つロールの名前をリクエストのコンテキストとして送信します。4.x では、それらのロール名からも Cluster Namespace のプレフィックスを削除します。Ranger ポリシーの `Roles` は、削除後の名前に一致させることができます。これは Ranger ポリシーの条件にすぎず、Doris 内部のオブジェクト権限を Ranger-Hive の判定に参加させるものではありません。
- Doris と Ranger はロールを同期しません。ロールに対するポリシーを作成する場合に限り、Doris リクエストのロール名を Ranger で参照するロール名に一致させる必要があります。通常は、ユーザーまたはグループに基づく Ranger ポリシーのほうが管理しやすくなります。
- Ranger UserSync は Doris のログインユーザーを作成しません。Ranger に `alice` が存在していても、Doris で `alice` を作成するか、LDAP など設定済みのプロバイダーで認証してください。
- Doris ユーザーのホスト部分は、ログイン時の照合と監査時のクライアント IP に使用され、Ranger ユーザー名には含まれません。たとえば、Doris ユーザー `'alice'@'10.%'` は Ranger ユーザー `alice` に対応します。

<!-- Knowledge Type: Configuration Examples -->
<!-- Use Case: Row-Level Access Control / Sensitive Data Masking -->

## 行フィルタリングとデータマスキング

### 行レベルフィルター

`hive_prod` に Row Level Filter Policy を作成します。

| 項目 | 例 |
| --- | --- |
| データベース（Database） | `sales` |
| テーブル（Table） | `orders` |
| ユーザー（User） | `alice` |
| 行レベルフィルター（Row Level Filter） | `region = 'CN'` |

Access Policy でも、`alice` に `select` を `sales.orders` に対して付与する必要があります。行フィルターはフィルター式を追加するだけで、基本的なアクセス認可に代わるものではありません。

次を実行します。

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

結果には `region = 'CN'` を満たす行だけが含まれます。

### データマスキング

`hive_prod` に Masking Policy を作成します。

| 項目 | 例 |
| --- | --- |
| データベース（Database） | `sales` |
| テーブル（Table） | `customers` |
| カラム（Column） | `phone` |
| ユーザー（User） | `alice` |
| マスキングオプション（Masking Option） | Ranger 組み込みのタイプまたは Custom |
| カスタム式（Custom Expression） | `concat(substr({col}, 1, 3), '****')` |

`alice` にカラムの `select` 権限も付与します。`phone` がクエリされると、Doris は Ranger の式に含まれる `{col}` を実際のカラム名に置き換え、マスキング式を適用します。

:::caution
行フィルター式とマスキング式は Doris SQL エンジンで解析されます。HiveServer2 向けに書かれた式が Doris でサポートされない Hive UDF や構文を使用している場合は、書き換える必要があります。
:::

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Kerberos-Enabled Ranger Admin / SPNEGO Policy Download -->

## Ranger Admin で Kerberos を使用する場合

このセクションでは、FE 内の Ranger-Hive クライアントが HTTP/SPNEGO 経由で Ranger Admin に認証するよう設定します。Ranger Admin の Kerberos 認証は、Hive/HMS の Kerberos サービス認証とは異なります。同じ realm を使用することはできますが、接続ごとにサービスプリンシパル、クライアントプリンシパル、keytab、設定箇所が異なります。

| 接続 | サーバー ID の例 | Doris クライアント ID の例 | 用途と設定 |
| --- | --- | --- | --- |
| FE から Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | ポリシーのダウンロード。サーバー側は Ranger Admin、クライアント側は `fe/conf/ranger-hive-security.xml` で設定します |
| FE から HMS | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | メタデータの読み取り。Hive Catalog の `hive.metastore.*` プロパティで設定します |
| FE/BE から HDFS | NameNode/DataNode のサービスプリンシパル | `doris/hive-client.example.com@EXAMPLE.COM` | データの読み取り。Hive Catalog の `hdfs.authentication.*` プロパティで設定します |

:::caution バージョン要件
Doris 4.x では **4.0.2 以降**が必要です。Doris 4.0.0 と 4.0.1 には Ranger 2.4 が含まれており、ここで使用する Ranger プラグインの UGI keytab ログインがありません。Doris 4.0.2 では Ranger が 2.7 にアップグレードされています。Current に含まれる Ranger バージョンもこの機能に対応しています。
:::

### 1. Ranger Admin と FE の Kerberos ID の確認

まず Ranger Admin サーバーの設定を確認します。Apache Ranger は通常、`core-site.xml` と `ranger-admin-site.xml` をデプロイされた Web アプリケーションの `WEB-INF/classes/conf/` ディレクトリから読み込みます。ディストリビューションによってパスが異なる場合があるため、Ranger Admin の起動引数またはインストール構成を正としてください。

| ファイル | プロパティ | 意味 |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Ranger Admin の SPNEGO フィルターで使用する Hadoop 認証です。安全なプラグインダウンロードには `kerberos` を使用します |
| `ranger-admin-site.xml` | `ranger.service.host` | Ranger Admin サービスのホスト名で、`_HOST` に代入される値です |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | HTTP/SPNEGO サービスプリンシパルです。例：`HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Ranger Admin が読み取るサーバー側 SPNEGO keytab のパスです |

`ranger.authentication.method` は Ranger WebUI のログインを制御しますが、これだけではプラグインの安全なダウンロードエンドポイントが SPNEGO を使用する証拠にはなりません。実際に適用される `ranger-admin-site.xml` と Ranger Admin の起動ログを確認してください。

Ranger Admin サーバーで `klist -kt <actual ranger.spnego.kerberos.keytab path>` を実行し、keytab に `_HOST` 展開後の HTTP プリンシパル（`HTTP/ranger-admin.example.com@EXAMPLE.COM` など）が含まれていることを確認します。`ranger.plugin.hive.policy.rest.url` のホスト名は、このプリンシパルと一致する必要があります。

Ranger は FE クライアントのプリンシパルや keytab を作成しません。Kerberos 管理者が `doris/ranger-client.example.com@EXAMPLE.COM` などの ID を作成して `/etc/security/keytabs/doris-ranger.keytab` にエクスポートし、すべての FE に配置して、FE プロセスのユーザーが読み取れるようにする必要があります。Ranger Admin の HTTP プリンシパルやサーバー側 SPNEGO keytab を FE に渡さないでください。

このセクションでは以下を使用します。

| 項目 | 例 |
| --- | --- |
| Ranger Hive のサービス名（Service Name） | `hive_prod` |
| Ranger Admin の URL | `http://ranger-admin.example.com:6080` |
| Kerberos の realm | `EXAMPLE.COM` |
| Ranger Admin HTTP サービスプリンシパル | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| FE ポリシーダウンロード用プリンシパル | `doris/ranger-client.example.com@EXAMPLE.COM` |
| FE クライアント keytab | `/etc/security/keytabs/doris-ranger.keytab` |

HTTP プリンシパルは Ranger Admin のサーバー ID です。FE の `ugi.keytab.principal` には指定しないでください。このプロパティには FE クライアントの ID を指定する必要があります。

### 2. Hadoop UGI を Kerberos モードで初期化する

`ugi.*` プロパティを `ranger-hive-security.xml` に追加するだけでは不十分です。Ranger は `UserGroupInformation.loginUserFromKeytab()` を呼び出しますが、keytab ログインで Kerberos 認証情報が生成されるのは、Hadoop のグローバル認証が `kerberos` に設定されている場合だけです。

`core-site.xml` をすべての FE の `fe/conf/` に作成します。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>hadoop.security.authentication</name>
        <value>kerberos</value>
    </property>
</configuration>
```

`start_fe.sh` は FE の `conf` ディレクトリを Java のクラスパスに追加するため、`fe/conf/core-site.xml` を推奨します。代わりに共有 Hadoop 設定ディレクトリを使用する場合は、`fe.conf` に次を設定します。

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

その場合、すべての FE を再起動する前に、`/etc/hadoop/conf/core-site.xml` が存在し、FE プロセスのユーザーから読み取れることを確認してください。

### 3. krb5.conf と Ranger Admin HTTP SPN の設定

Ranger Admin の URL ホスト名に対応する realm、KDC、`domain_realm` のマッピングを、すべての FE の `/etc/krb5.conf` に設定します。

```ini
[libdefaults]
    default_realm = EXAMPLE.COM
    dns_lookup_realm = false
    dns_lookup_kdc = false
    rdns = false

[realms]
    EXAMPLE.COM = {
        kdc = kdc.example.com:88
        admin_server = kdc.example.com
    }

[domain_realm]
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

`ranger.plugin.hive.policy.rest.url` のホスト名は、Ranger Admin の HTTP/SPNEGO keytab 内の SPN と一致する必要があります。URL のホストが `ranger-admin.example.com` の場合、サーバーの keytab には次が含まれている必要があります。

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

短いホスト名、FQDN、CNAME、VIP、IP アドレスを混在させないでください。URL に `http://ranger-admin:6080` のような短いホスト名を使用する場合は、ドメインのマッピングに加えて、そのホスト名の完全一致マッピングを追加します。

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

`kinit`、`klist`、`kdestroy`、`kvno` を提供する Kerberos クライアントツールをインストールします。以下を FE プロセスのユーザーとして実行します。別のチケットキャッシュを使用するため、既存の認証情報は消去しません。実行前にプリンシパル、keytab、ホスト名を置き換えてください。

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_test_$$
kdestroy 2>/dev/null || true
klist -kt /etc/security/keytabs/doris-ranger.keytab
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM
kvno HTTP/ranger-admin.example.com@EXAMPLE.COM
klist
kdestroy
```

`klist -kt` には FE クライアントのプリンシパルが表示されるはずです。`kinit` が成功した場合、通常は出力がありません。`kvno` が成功し、その後の `klist` で `krbtgt/...` と Ranger Admin の HTTP チケットの両方が表示されれば、クライアント keytab、realm のマッピング、HTTP SPN を確認できます。最後の `kdestroy` は、この確認に使用した一時キャッシュだけを削除します。

### 4. 完全な ranger-hive-security.xml の設定

すべての FE の `fe/conf/ranger-hive-security.xml` で、ポリシーへのアクセスと UGI ログインを一緒に設定します。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="configuration.xsl"?>
<configuration>
    <property>
        <name>ranger.plugin.hive.service.name</name>
        <value>hive_prod</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.source.impl</name>
        <value>org.apache.ranger.admin.client.RangerAdminRESTClient</value>
    </property>

    <!-- The hostname must match the Ranger Admin HTTP SPN -->
    <property>
        <name>ranger.plugin.hive.policy.rest.url</name>
        <value>http://ranger-admin.example.com:6080</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.cache.dir</name>
        <value>/var/lib/doris/ranger/hive_prod/policy-cache</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.pollIntervalMs</name>
        <value>30000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.connection.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.policy.rest.client.read.timeoutMs</name>
        <value>60000</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.initialize</name>
        <value>true</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.login.type</name>
        <value>keytab</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.principal</name>
        <value>doris/ranger-client.example.com@EXAMPLE.COM</value>
    </property>

    <property>
        <name>ranger.plugin.hive.ugi.keytab.file</name>
        <value>/etc/security/keytabs/doris-ranger.keytab</value>
    </property>
</configuration>
```

Kerberos 固有のプロパティ：

| プロパティ | 説明 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Ranger-Hive プラグインの初期化時に Hadoop UGI ログインを実行します |
| `ranger.plugin.hive.ugi.login.type` | keytab ログインには `keytab` を設定します |
| `ranger.plugin.hive.ugi.keytab.principal` | FE が Ranger ポリシーをダウンロードする際に使用するクライアントプリンシパルです。keytab に存在する必要があります |
| `ranger.plugin.hive.ugi.keytab.file` | クライアント keytab の絶対パスです。すべての FE で同じパスを使用し、FE プロセスのユーザーが読み取れるようにします |

`ranger.plugin.hive.policy.rest.secure=true` によって Kerberos ダウンロード経路が選ばれるわけではありません。Ranger クライアントは、Hadoop UGI がセキュアモードであることと、ログインユーザーが Kerberos 認証情報を持つことを確認します。選択されたモードは FE ログの `secureMode` で確認してください。

### 5. FE のサービス ID に hive_prod ポリシーのダウンロードを許可する

この手順では、**FE がポリシーのダウンロードに使用するサービスアカウント**を認可します。これは Doris のクエリユーザー `alice` ではなく、このアカウントに Hive データへのアクセスを許可するものでもありません。

Ranger Admin で Kerberos を有効にすると、ポリシーのダウンロードは次の二つの検査を通過する必要があります。

1. Ranger Admin が FE の keytab プリンシパルを SPNEGO 経由で認証します。
2. Ranger Admin が、認証されたログイン ID に `hive_prod` のデータをダウンロードする権限があることを検証します。

この例での ID の変換は次のとおりです。

| 段階 | 例 | 用途 |
| --- | --- | --- |
| FE の keytab 内のプリンシパル | `doris/ranger-client.example.com@EXAMPLE.COM` | SPNEGO 認証 |
| Ranger Admin のログイン ID | `doris` | `auth_to_local` によるプリンシパル変換後のアカウント |
| 推奨する Hive サービス設定 | `policy.download.auth.users=doris` | この FE アカウントにポリシーとロールのデータのダウンロードを許可 |

通常の FE サービスアカウントには、ダウンロード権限だけを与えるため、Hive サービスの `policy.download.auth.users` を使用します。Ranger WebUI で Hive サービス `hive_prod` を編集し、その設定に次が含まれることを確認します。

```text
policy.download.auth.users=doris
```

ここでの `doris` は、認証された Ranger Admin セッションのログイン ID であり、Doris のクエリユーザーではありません。Ranger Admin の SPNEGO フィルターは、`hadoop.security.auth_to_local` をその `core-site.xml` から読み取って適用します。例のプリンシパルがこのルールによって `doris` に変換される場合にのみ、`doris` を使用してください。完全なプリンシパルや固定の短縮名を推測せず、Ranger Admin の認証ログで実際のログイン ID を確認してください。

Apache Ranger 2.7 は `policy.download.auth.users` をカンマで分割し、各項目とログイン ID を大文字と小文字を区別せずに完全一致で比較します。複数のアカウントを指定する場合は、`doris,hive` のようにスペースを入れず、カンマで区切ります。Ranger 管理者と `policy.grantrevoke.auth.users` に記載されたユーザーもダウンロード認可を通過できますが、FE に必要なのはダウンロード権限だけです。この目的のために、より広い付与・取り消し権限を与えないでください。

### 6. FE を再起動して安全なポリシーダウンロードを検証する

すべての FE を再起動し、まず FE ログに次のようなメッセージがあることを確認します。

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

次に、FE プロセスのユーザーと同じ keytab を使って、セキュアなポリシーエンドポイントを呼び出します。実行前に、`curl --version` の出力に GSS-API、Kerberos、または SPNEGO のサポートが示されることを確認してください。

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

完全なポリシー JSON 応答を伴う HTTP 200 が、エンドツーエンドの成功条件です。`kinit`、`kvno`、`secureMode=true` の成功は経路の一部だけを検証するため、ダウンロード結果の代わりにはなりません。

ポリシーの読み込み後、例のキャッシュディレクトリには次のファイルがあるはずです。

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. Ranger Admin、HMS、HDFS のすべてで Kerberos を使用する場合

Hive Metastore と HDFS でも Kerberos を使用する場合は、クイックスタートの `CREATE CATALOG hive_ctl` 文の**代わりに**、次の Catalog 定義を使用します。同じ Catalog を二回作成しないでください。`doris-ranger.keytab` は FE によるポリシーダウンロード専用で、`doris-hive.keytab` は HMS と HDFS へのアクセスに使用します。

```sql
CREATE CATALOG hive_ctl PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms.example.com:9083',
    'hive.metastore.authentication.type' = 'kerberos',
    'hive.metastore.client.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hive.metastore.client.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'hive.metastore.service.principal' = 'hive/hms.example.com@EXAMPLE.COM',
    'hdfs.authentication.type' = 'kerberos',
    'hdfs.authentication.kerberos.principal' = 'doris/hive-client.example.com@EXAMPLE.COM',
    'hdfs.authentication.kerberos.keytab' = '/etc/security/keytabs/doris-hive.keytab',
    'fs.defaultFS' = 'hdfs://nameservice1',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

二つのクライアント ID には、それぞれ異なる用途があります。

- `doris-ranger.keytab` を使用すると、FE は SPNEGO 経由で Ranger Admin からポリシーをダウンロードできます。この keytab は FE にのみ配置すれば十分です。
- `doris-hive.keytab` は HMS と HDFS へのアクセスに使用します。HMS クライアントの keytab はすべての FE に配置してください。HDFS クライアントの keytab は、HDFS にアクセスするすべての FE と BE に、同じ読み取り可能な絶対パスで配置してください。対応するプロパティを個別に設定すれば、HMS と HDFS で異なるクライアント ID を使用できます。

HMS サーバーのプリンシパルは、Hive Metastore の Kerberos 設定から取得します。例の `hive/hms.example.com@EXAMPLE.COM` は Ranger Admin の HTTP プリンシパルではありません。接続間で同じ realm を使用できますが、プリンシパルと keytab は相互に置き換えられません。

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Ranger Admin over HTTPS / Custom CA / Mutual TLS -->

## Ranger Admin で HTTPS を使用する場合

すべての FE の `fe/conf/ranger-hive-security.xml` で、Ranger Admin の URL を HTTPS に変更し、`ranger.plugin.hive.policy.rest.ssl.config.file` に SSL 設定ファイルを指定します。

```xml
<property>
    <name>ranger.plugin.hive.policy.rest.url</name>
    <value>https://ranger-admin.example.com:6182</value>
</property>
<property>
    <name>ranger.plugin.hive.policy.rest.ssl.config.file</name>
    <value>/opt/apache-doris/fe/conf/ranger-policymgr-ssl.xml</value>
</property>
```

次の例では、Ranger Admin の CA 証明書 `/tmp/ranger-admin-ca.pem` と FE プロセス ID `doris:doris` を使用します。各 FE でトラストストアと JCEKS 認証情報プロバイダーを準備します。コマンドには JDK の `keytool` と Hadoop の `hadoop credential` が必要です。

```shell
sudo install -d -o doris -g doris -m 700 /etc/security/ranger
sudo -u doris keytool -importcert -noprompt \
    -alias ranger-admin-ca \
    -file /tmp/ranger-admin-ca.pem \
    -storetype JKS \
    -keystore /etc/security/ranger/ranger-truststore.jks
sudo -u doris hadoop credential create sslTrustStore \
    -provider jceks://file/etc/security/ranger/ranger-ssl.jceks
sudo chmod 600 /etc/security/ranger/ranger-truststore.jks \
    /etc/security/ranger/ranger-ssl.jceks
```

`keytool` はトラストストアのパスワードを要求し、`hadoop credential` は `sslTrustStore` の値を要求します。両方に同じパスワードを入力してください。一時的な CA パスをデプロイ環境の証明書管理用パスに置き換え、FE プロセスのユーザーが両方のファイルを読み取れることを確認します。

`ranger-policymgr-ssl.xml` の例：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.policymgr.clientssl.truststore</name>
        <value>/etc/security/ranger/ranger-truststore.jks</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.type</name>
        <value>JKS</value>
    </property>
    <property>
        <name>xasecure.policymgr.clientssl.truststore.credential.file</name>
        <value>jceks://file/etc/security/ranger/ranger-ssl.jceks</value>
    </property>
</configuration>
```

Ranger クライアントは、固定の `sslTrustStore` エイリアスからトラストストアのパスワードを読み取ります。相互 TLS には、さらに `xasecure.policymgr.clientssl.keystore` と JCEKS 内の `sslKeyStore` エイリアスが必要です。トラストストアやキーストアのパスワードを平文で XML に記載しないでください。

<!-- Knowledge Type: Architecture Constraints / Best Practices -->
<!-- Use Case: Multiple Hive Catalogs / Ranger-Doris and Ranger-Hive Coexistence -->

## 複数の Catalog と実行時の制約

### 複数の Catalog で一つの Hive ポリシーサービスを再利用する

`hive_prod` に対応する複数の Catalog では、同じコントローラー設定を使用できます。

```sql
CREATE CATALOG hive_prod_a PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-a.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);

CREATE CATALOG hive_prod_b PROPERTIES (
    'type' = 'hms',
    'hive.metastore.uris' = 'thrift://hms-b.example.com:9083',
    'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory',
    'access_controller.properties.ranger.service.name' = 'hive'
);
```

Ranger Hive のリソースには Catalog の次元がないため、データベース名、テーブル名、カラム名が同じ場合は、同じポリシーに一致します。二つの Metastore が意図的にリソース名と認可の境界を共有する場合だけ、サービスを再利用してください。

### 異なる Ranger Hive サービスインスタンス

標準の `hive` プレフィックスは一つの `ranger-hive-security.xml` に対応するため、同じ FE 内のすべての Ranger-Hive Catalog は同じ `ranger.plugin.hive.service.name` を読み取ります。現在の Catalog インターフェースでは、Catalog ごとに異なる Ranger Hive Service Name を選択できません。`hive_prod_a` のような WebUI のサービス名を Catalog の `ranger.service.name` に指定しないでください。指定すると Ranger は `ranger-hive_prod_a-security.xml` と `ranger.plugin.hive_prod_a.*` を探しますが、これはここで説明する標準の Hive 設定には含まれません。独立した Ranger Hive サービスを分離するには、別々の Doris クラスターを使用するか、Catalog 間で一つの Ranger Hive ポリシーサービスを共有してください。

### 実行時の制約とベストプラクティス

- Ranger-Hive は Hive/HMS Catalog のみに使用してください。すべての外部 Catalog に使える汎用 Ranger コントローラーではありません。
- Ranger-Hive と Ranger-Doris のポリシーは同期しません。設定ファイルとポリシーキャッシュディレクトリを分けてください。
- Ranger の監査プロバイダーは、FE プロセス内でグローバルに共有されます。最初に初期化された Ranger プラグインが監査の有効・無効と出力先を決めます。Ranger-Doris と Ranger-Hive を併用する場合は、初期化順序によって結果が変わらないよう、両方の監査 XML ファイルで同じ有効・無効設定と集中管理された出力先を指定してください。
- Hadoop UGI のログイン状態は FE JVM 内でグローバルです。Ranger-Doris と Ranger-Hive、または Kerberos を有効にした複数の Ranger Catalog を併用する場合は、同じ Ranger クライアントプリンシパルと keytab を使用してください。異なる ID で後からログインすると、プロセスのログイン ID が置き換わり、ポリシーダウンロードが不安定になる可能性があります。
- Ranger-Hive は Ranger の HDFS、S3、オブジェクトストレージのポリシーを検査しません。ストレージへのアクセスには、引き続き Doris Catalog に設定された認証情報を使用します。
- Ranger Hive のリソースには Doris Catalog の次元がありません。Metastore 間で同名のデータベースやテーブルがある場合は、競合を評価してください。
- Doris と Ranger はユーザーやロールを同期しません。一貫した命名規則を定め、通常のアカウントで許可されるリクエストと拒否されるリクエストの両方をテストしてください。
- 最初のポリシーダウンロードに失敗した場合、プラグインはローカルキャッシュを使用することがあります。古いポリシーが見逃されないよう、キャッシュの鮮度と Ranger の監査を監視してください。
- Access Controller を初期化する各 FE は、それぞれ独立してポリシーをダウンロードし、キャッシュします。すべての FE で設定ファイル、keytab、トラストストア、ディレクトリの権限を揃えてください。
- ポリシーの変更は即時には反映されません。通常、最大遅延は `policy.pollIntervalMs` に Ranger Admin とネットワークの遅延を加えた程度です。

<!-- Knowledge Type: FAQ / Troubleshooting -->
<!-- Use Case: Configuration Loading Failure / Policy Download Failure / Authorization Failure -->

## トラブルシューティング

症状の表で最初に確認する項目を特定し、対応するセクションで原因と詳しい手順を確認してください。

| 症状 | 最初の確認項目 |
| --- | --- |
| Catalog の作成時に Access Controller が見つからない | `access_controller.class` が完全修飾ファクトリクラス名または `ranger-hive` であることを確認します |
| ログに `ranger-hive-security.xml` が見つからないと表示される | Catalog のプレフィックスが `hive` に固定され、すべての FE の `fe/conf/` にファイルがあることを確認します |
| 監査を無効にすると security XML が機能しない | `ranger-hive-audit.xml` を配置し、監査を明示的に無効にします |
| Ranger Admin にアクセスできるがポリシーが読み込まれない | Service Name、REST URL、ネットワークアクセス、キャッシュディレクトリ、ポリシーの状態を確認します |
| Kerberos を有効にした後、ポリシーダウンロードに失敗する | UGI のセキュアモード、HTTP SPN、ダウンロード権限、HTTP ステータス、ポリシーキャッシュを確認します |
| Ranger ではユーザーが許可されるが、Catalog が表示されない | デフォルト Access Controller の Catalog レベルの権限を確認します |
| Ranger の拒否ポリシーが適用されない | Global 権限を確認し、`root` や `admin` でテストしないでください |
| ポリシーが HiveServer2 では機能するが Doris では機能しない | Service Name、ユーザー名とロール名、式の互換性を確認します |
| ユーザーが HDFS または S3 を直接読み取れる | Ranger-Hive は基盤ストレージのアクセス制御を適用しません |

### Catalog 作成時に Access Controller が見つからないと報告される

現在のファクトリクラス名を使用します。

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current と 4.x では、短い識別子も使用できます。

```sql
'access_controller.class' = 'ranger-hive'
```

`hive`、`hive_prod`、または古いクラス名 `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory` は使用しないでください。すべての FE が同じ Doris バージョンで動作していることを確認し、FE ログで `Access Controller Plugin Factory` を検索してください。

### ログに ranger-hive-security.xml が見つからないと表示される

次の二つの設定は混同しやすいため、区別してください。

- Catalog の `'access_controller.properties.ranger.service.name' = 'hive'` は Ranger Hive プラグインを選択するもので、`hive` のままにする必要があります。Doris はこれを使用して `ranger-hive-security.xml` を探し、`ranger.plugin.hive.*` の設定を読み取ります。
- `ranger.plugin.hive.service.name` は `ranger-hive-security.xml` 内で設定し、`hive_prod` など、Ranger WebUI での実際の Hive Service Name を指定します。

Catalog に誤って `hive_prod` を指定すると、Ranger は `ranger-hive_prod-security.xml` を探します。`ranger-hive-security.xml` がすべての FE の `fe/conf/` にあることを確認し、修正後にすべての FE を再起動してください。

### 監査が無効でも ranger-hive-audit.xml が必要な理由

Ranger 2.7 が `ranger-hive-audit.xml` を見つけられない場合、従来のフォールバック処理に入り、`hive-site.xml`、`hbase-site.xml`、`hdfs-site.xml` を探してから、同じディレクトリの `xasecure-audit.xml` を読み込もうとします。このファイルがない場合、後で読み込む `ranger-hive-security.xml` も有効にならない可能性があります。`ranger-hive-security.xml` と `ranger-hive-audit.xml` は常に一緒に配置し、監査が不要な場合は `xasecure.audit.is.enabled=false` を設定してください。`core-site.xml` は、この従来の監査ファイル検索リストには含まれず、直接の引き金ではありません。

### Ranger Admin にアクセスできるがポリシーがダウンロードされない

次の順序で確認します。

1. `ranger.plugin.hive.service.name` が WebUI の Service Name `hive_prod` と完全に一致すること。
2. `ranger.plugin.hive.policy.rest.url` が Ranger Admin のルート URL であること。
3. FE から Ranger Admin へのネットワーク、DNS、HTTPS トラストストアのアクセスが正常であること。
4. キャッシュディレクトリが存在し、FE プロセスのユーザーが書き込めること。
5. Ranger サービスが有効で、ポリシーが保存されていること。

Ranger Admin が Kerberos を使用する場合は、次のトラブルシューティング項目に進んでください。

### Ranger Admin で Kerberos を有効にした後にポリシーダウンロードが失敗する

ダウンロード経路を次の順序で確認します。

1. **Kerberos モードを確認する。** FE ログには `secureMode=true` と `(auth:KERBEROS)` が含まれるはずです。`secureMode=false` または `(auth:SIMPLE)` と表示される場合は、`hadoop.security.authentication=kerberos` が `core-site.xml` に設定されていることを確認し、そのファイルを `fe/conf/` または `HADOOP_CONF_DIR` を通じてクラスパス上にあるディレクトリに配置して、すべての FE を再起動します。デフォルトの `hadoop_config_dir` がある `plugins/hadoop_conf/` だけに依存しないでください。このディレクトリは主に Catalog/Hadoop 接続用で、Ranger プラグインがグローバル UGI を初期化する際に参照できるとは限りません。4.x では 4.0.2 以降を使用し、`ranger.plugin.hive.forceNonKerberos=true` を誤って設定していないことを確認してください。
2. **HTTP サービスチケットを確認する。** FE プロセスのユーザーとして、Kerberos の主手順にある `kinit` と `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM` の確認を実行します。`Server not found in Kerberos database`、`No service creds`、または誤った `krbtgt/<REALM>` へのリクエストが発生する場合は、URL のホスト名、Ranger Admin の HTTP SPN、DNS、`/etc/krb5.conf` のマッピングを比較します。URL と SPN には完全に同じホスト名を使用する必要があります。
3. **ダウンロード権限を確認する。** SPNEGO 認証後、Ranger Admin のログで実際のログイン ID を確認します。ここで使用する通常の FE アカウントについては、その ID を `hive_prod` サービスの `policy.download.auth.users` に指定します。Apache Ranger 2.7 では、Ranger 管理者と `policy.grantrevoke.auth.users` にあるアカウントも許可されますが、FE のダウンロードのためだけに広い付与・取り消し権限を与えないでください。WebUI に `policy.download.auth.users` が表示されない場合は、ディストリビューションの Ranger プラグインインストール設定または Ranger Service REST API で確認・更新します。REST 経由で更新する際は、既存のサービス設定をすべて保持してください。
4. **セキュアなエンドポイントのステータスを調べる。** `curl --negotiate` コマンドを Kerberos の手順 6 に従って再実行し、応答本文を保存します。標準の Apache Ranger 2.7 では、HTTP 401 は SPNEGO 認証の失敗、403 はログイン ID の認証は成功したものの管理者ではなく、認可されたユーザー一覧のどちらにも存在しないこと、404 は通常 XML の Service Name と Ranger WebUI の不一致を意味します。完全なポリシー JSON を伴う 200 だけが成功を示します。ベンダーのディストリビューションではステータスの扱いが異なる場合があるため、Ranger Admin のログも確認してください。`kinit` の成功が証明するのは、クライアント TGT を取得できたことだけです。
5. **ポリシーキャッシュを調べる。** ダウンロードに成功すると、`hive_hive_prod.json` と `hive_hive_prod_roles.json` の両方が作成されます。小さなロールファイルしかない場合、メインのポリシーはまだ読み込めていません。`getServicePoliciesIfUpdated` の応答と、`policy engine initialization failed` やキャッシュへの書き込みエラーなどの FE ログメッセージを確認してください。

### Ranger ではユーザーが許可されるが SHOW CATALOGS に Catalog が表示されない

Catalog レベルの検査はデフォルト Access Controller が担当します。Doris 組み込みの認可を使用する場合は、Catalog に対する権限を付与します。

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

### Ranger の拒否ポリシーが適用されない

ユーザーが Doris の Global 権限を持っていないか確認してください。デフォルト Access Controller が対応する Global 権限を付与している場合、Ranger-Hive がデータベース、テーブル、カラムを許可していなくても、最終的な検査が成功する可能性があります。`ADMIN_PRIV` も Global の `SELECT_PRIV` も持たない通常のユーザーでテストしてください。

### ポリシーが HiveServer2 では機能するが Doris では機能しない

Doris と HiveServer2 が同じ Ranger Hive Service Name を読み取り、ポリシー式が Doris でサポートされる SQL 構文を使用していることを確認します。また、Doris リクエスト内のユーザー名とロール名が、Ranger ポリシーで参照する名前と完全に一致することも確認してください。

### Ranger-Hive は HDFS や S3 への直接アクセスを防ぐか？

いいえ。Ranger-Hive は Doris の SQL レイヤーで Hive データベース、テーブル、カラムへのリクエストだけを認可します。HDFS、S3、その他のストレージへのアクセスは Catalog のストレージ認証設定を使用するため、ストレージ側で別途アクセス制御と認証情報の分離が必要です。

<!-- Knowledge Type: Production Checklist -->
<!-- Use Case: Production Deployment Acceptance -->

## 本番環境のチェックリスト

- Ranger WebUI の Service Type が Hive であり、その Service Name が XML の値と完全に一致している。
- すべての FE に解析可能な `ranger-hive-security.xml` と `ranger-hive-audit.xml` があり、監査が不要な場合は監査 XML 内で明示的に無効にしている。
- Ranger-Doris と Ranger-Hive は別々のポリシーキャッシュディレクトリを使用し、FE プロセスのユーザーが書き込める。
- Catalog の `access_controller.class` に Ranger-Hive ファクトリの完全修飾クラス名または対応する `ranger-hive` 識別子を使用し、設定プレフィックスの値が `hive` である。
- 通常の Doris ユーザー名が Ranger のユーザー名と一致している。Doris のロールを Ranger ポリシーで使用する場合、参照されるロール名も一致している。
- 許可されたアクセス、拒否されたアクセス、カラム権限、行フィルタリング、データマスキングをそれぞれテスト済みである。
- Catalog レベルの権限はデフォルト Access Controller が提供し、テストユーザーには意図した Ranger-Hive の検査を迂回する Global 権限がない。
- Ranger Admin で Kerberos または HTTPS を使用する場合、すべての FE で keytab、トラストストア、`krb5.conf`、絶対パスが揃っている。
- Catalog 間で同名のデータベースとテーブルを確認し、意図しないポリシー適用範囲の拡大を防いでいる。
- 監査が有効な場合、設定した出力先に Doris の許可・拒否レコードがある。Ranger WebUI で監査を表示するには、Solr など、対応する集中管理バックエンドも必要である。
