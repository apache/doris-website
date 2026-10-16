---
{
    "title": "Ranger-Hive による認可",
    "language": "ja",
    "description": "Kerberos、ポリシー、行フィルタリング、マスキングを含む、Doris Hive Catalog の Ranger-Hive 認可の設定方法。",
    "keywords": [
        "Apache Doris Ranger Hive",
        "Hive Catalog の認可",
        "ranger-hive",
        "ranger-hive-security.xml",
        "ranger.plugin.hive.service.name",
        "access_controller.class",
        "行フィルタリング",
        "データマスキング",
        "Doris Hive Catalog の Ranger 認可",
        "Ranger Admin の Kerberos",
        "policy.download.auth.users",
        "ranger-hive-security.xml が見つからない",
        "Ranger Hive ポリシーのダウンロード失敗",
        "Doris Current の Ranger Hive"
    ]
}
---

<!-- Knowledge Type: Configuration Guide / Authorization -->
<!-- Use Case: Hive Catalog Authorization / Reusing Ranger Hive Policies -->

Apache Doris では、個々の Hive Catalog に Ranger-Hive Access Controller を割り当てられます。これにより、その Catalog 内のデータベース、テーブル、カラムの認可に、Apache Ranger で管理されている既存の Hive ポリシーを再利用できます。Ranger の行レベルフィルタリング、データマスキング、監査にも対応しています。

組織がすでに Ranger で Hive の権限を管理しており、同じデータに対する Doris のクエリにもそのポリシーを適用したい場合に使用します。

Ranger-Hive が制御するのは、この Access Controller を設定した Hive Catalog だけです。Doris クラスター全体の認可を置き換えるものではなく、基盤となる HDFS、S3、その他のストレージシステムに対して Ranger ポリシーを適用するものでもありません。

## ユースケース

| シナリオ | 対応 | 説明 |
| --- | --- | --- |
| Doris からクエリする Hive データに既存の Ranger Hive ポリシーを再利用する | はい | 対応する Hive Catalog に Ranger-Hive Access Controller を設定する |
| Ranger で Doris クラスター全体の権限を一元管理する | いいえ | Ranger-Doris を使用する |
| 基盤となる HDFS または S3 ストレージへのアクセスを認可する | いいえ | ストレージシステム側でアクセス制御と認証情報の分離を実施する |
| Hive/HMS 以外の Catalog に Ranger 認可を設定する | いいえ | Ranger-Hive は Hive/HMS Catalog にのみ適用できる |

<!-- Knowledge Type: Architecture Decision -->
<!-- Use Case: Choosing Ranger-Doris or Ranger-Hive / Confirming Authorization Boundaries -->

## Ranger-Doris と Ranger-Hive

Ranger-Doris と Ranger-Hive は用途が異なります。

| 項目 | Ranger-Doris | Ranger-Hive |
| --- | --- | --- |
| 主な用途 | Ranger で Doris クラスターの権限を一元管理する | 特定の Hive Catalog に既存の Ranger Hive ポリシーを適用する |
| 有効化方法 | FE 設定 `access_controller_type=ranger-doris` | Catalog プロパティ `access_controller.class` |
| Ranger サービスタイプ | Doris。Doris Ranger プラグインとサービス定義が必要 | Hive。Ranger 組み込みの Hive サービス定義を使用 |
| リソース階層 | Doris の Global、Catalog、Database、Table、Column など | Hive の Database、Table、Column |
| 適用範囲 | Doris クラスターのデフォルト Access Controller | コントローラーを指定した外部 Catalog のみ |
| ポリシーの共有 | Doris ポリシーは Hive ポリシーに変換されない | Hive ポリシーは Ranger-Doris ポリシーを参照しない |

両方を同じ Doris クラスターで使用できます。たとえば、Ranger-Doris をデフォルト Access Controller とし、`hive_ctl` で Ranger-Hive を使用できます。Hive Catalog で Ranger-Hive を有効にすると、リクエストは次のように振り分けられます。「デフォルト Access Controller」には、Doris 組み込みの認可または Ranger-Doris を使用できます。

### 認可の境界

| 権限の範囲 | コントローラー | 備考 |
| --- | --- | --- |
| Global | デフォルト Access Controller | Ranger-Hive に Doris Global リソースはない |
| Catalog | デフォルト Access Controller | Ranger Hive に Doris Catalog リソースはない |
| データベース（Database） | 現在の Catalog の Ranger-Hive | Ranger リソースは Hive データベース名 |
| Table / View | 現在の Catalog の Ranger-Hive | Ranger リソースは Hive データベース名とテーブル名 |
| カラム（Column） | 現在の Catalog の Ranger-Hive | 参照する各カラムを個別に検査する |
| 行レベルフィルター（Row Level Filter） | 現在の Catalog の Ranger-Hive | Doris は Ranger からフィルター式を取得する。`root` と `admin` にはポリシーを適用しない |
| Data Masking | 現在の Catalog の Ranger-Hive | Doris は Ranger からカラムのマスキングルールを取得する。`root` と `admin` にはポリシーを適用しない |
| Resource、Storage Vault、Compute Group | デフォルト Access Controller | これらのリソースは Ranger-Hive の対象外 |
| HDFS、S3、その他のストレージ | Ranger-Hive では検査しない | Doris は引き続き Catalog に設定されたストレージ認証情報でデータを読み取る |

:::warning
デフォルト Access Controller が対応する Global 権限を付与している場合、Ranger-Hive がリソースを拒否しても、データベース、テーブル、カラムに対する最終的な権限検査は成功します。拒否ポリシーは、`ADMIN_PRIV` も Global `SELECT_PRIV` も持たない一般ユーザーで検証してください。`root` や `admin` は使用しないでください。
:::

## 前提条件

- Ranger Admin がデプロイされ、すべての Doris FE から接続できること。
- Ranger に Hive サービスが存在すること。このガイドでは Service Name に `hive_prod` を使用します。
- Doris のユーザーと Catalog を作成する権限があること。Ranger は認可を行いますが、Doris ユーザーの作成やパスワード認証は行いません。
- Hive Catalog に、Hive Metastore と基盤ストレージへのアクセスに必要なネットワーク、認証、権限の設定が済んでいること。
- すべての FE が Ranger 設定ファイルを読み取れること。ローカルポリシーキャッシュを設定する場合は、FE プロセスのユーザーがそのディレクトリを作成または書き込みできること。

## 設定の概要

以下の手順では、Ranger WebUI の Hive サービス `hive_prod`、Doris Catalog `hive_ctl`、ユーザー `alice` を使用します。

1. Ranger WebUI で Hive サービス `hive_prod` を確認または作成します。
2. すべての FE に `ranger-hive-security.xml` と `ranger-hive-audit.xml` を配置し、ポリシーキャッシュディレクトリを作成して FE を再起動します。
3. Doris ユーザー `alice` と、Ranger-Hive を有効にした Hive Catalog `hive_ctl` を作成します。
4. `alice` 用のアクセスポリシーを Ranger の `hive_prod` サービスで作成します。
5. `alice` として Doris にログインし、許可と拒否の両方のアクセスを検証します。

Ranger Admin が Kerberos または HTTPS を使用する場合は、まず基本設定を完了し、その後、このガイドの該当するセキュリティ設定を適用してください。

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Basic Ranger-Hive Configuration -->

## Ranger サービスと FE の設定

### Ranger Hive サービスの確認

Ranger WebUI の Service Manager ページで、Hive サービスを確認または作成します。

| Ranger WebUI のフィールド | 例 | 説明 |
| --- | --- | --- |
| Service Type | `Hive` | Ranger の Hive サービス定義を使用する。Doris Ranger プラグインは不要 |
| Service Name | `hive_prod` | Hive ポリシーを保存する Ranger サービスインスタンス |

HiveServer2 がすでに `hive_prod` を使用している場合、Doris は同じポリシーを読み取れます。Doris 専用の別サービスを作成する必要はありません。

### すべての FE で設定ファイルを準備する

以下のファイルを各 FE の `fe/conf/` ディレクトリに配置します。

```text
fe/conf/
├── ranger-hive-security.xml
├── ranger-hive-audit.xml
└── ranger-policymgr-ssl.xml    # Only for custom HTTPS trust or mutual TLS
```

`ranger-hive-security.xml` と `ranger-hive-audit.xml` を一緒に配置してください。監査が不要な場合も監査ファイルを残し、監査を明示的に無効にしてください。これにより、Ranger 2.7 が旧式の監査設定へのフォールバックに入るのを防げます。`ranger-policymgr-ssl.xml` は、Ranger Admin がカスタムトラストストアまたはクライアント証明書を使用する HTTPS の場合にのみ必要です。

#### ranger-hive-security.xml の設定

次のテンプレートをすべての FE の `fe/conf/` に保存し、サービス名、アドレス、パスを置き換えます。

`ranger-hive-security.xml` の例:

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
| `ranger.plugin.hive.service.name` | はい | なし | `<value>` は Ranger WebUI の Hive Service Name（例: `hive_prod`）と完全に一致させる |
| `ranger.plugin.hive.policy.source.impl` | いいえ | Ranger Admin REST クライアント | ポリシーの取得に使用する実装 |
| `ranger.plugin.hive.policy.rest.url` | はい | なし | ポリシー API パスを含まない Ranger Admin のルート URL |
| `ranger.plugin.hive.policy.cache.dir` | このガイドの本番環境構成では必須 | ローカルキャッシュなし | テンプレートはパスの例を設定する。事前にディレクトリを作成し、FE プロセスのユーザーに書き込み権限を与える |
| `ranger.plugin.hive.policy.pollIntervalMs` | いいえ | `30000` ミリ秒 | ポリシーのポーリング間隔 |
| `ranger.plugin.hive.policy.rest.client.connection.timeoutMs` | いいえ | `120000` ミリ秒 | Ranger Admin への接続タイムアウト。テンプレートでは `60000` ミリ秒に変更する |
| `ranger.plugin.hive.policy.rest.client.read.timeoutMs` | いいえ | `30000` ミリ秒 | Ranger Admin の応答読み取りタイムアウト。テンプレートでは `60000` ミリ秒に変更する |
| `ranger.plugin.hive.policy.rest.ssl.config.file` | カスタム HTTPS 信頼設定では必須 | 空 | `ranger-policymgr-ssl.xml` の絶対パス |

#### ポリシーキャッシュディレクトリの作成

Ranger-Doris と Ranger-Hive には、別々の `policy.cache.dir` パスを使用します。たとえば、`/var/lib/doris/ranger/doris_prod/policy-cache` と `/var/lib/doris/ranger/hive_prod/policy-cache` を指定します。同じ Ranger Hive サービスを再利用する Catalog は、同じ Hive プラグイン設定とキャッシュを読み取ります。

この例では `/var/lib/doris/ranger/hive_prod/policy-cache` を使用します。各 FE で以下を `root` として実行するか、`sudo` を付けて実行します。

```shell
mkdir -p /var/lib/doris/ranger/hive_prod/policy-cache
chown -R doris:doris /var/lib/doris/ranger/hive_prod
chmod 700 /var/lib/doris/ranger/hive_prod/policy-cache
```

これらのコマンドは、FE がユーザーとグループ `doris:doris` で動作することを前提としています。実際のプロセス ID に合わせて変更してください。`sudo -u doris test -w /var/lib/doris/ranger/hive_prod/policy-cache` で書き込み権限を確認します。`sudo` が使えない場合は、FE プロセスのユーザーで同等の確認を行ってください。

#### ranger-hive-audit.xml の設定

このガイドでは Ranger 監査をデフォルトで無効にします。監査が無効な場合でも、各 FE に次の `fe/conf/ranger-hive-audit.xml` を保存してください。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>xasecure.audit.is.enabled</name>
        <value>false</value>
    </property>
</configuration>
```

`xasecure.audit.is.enabled=false` は Ranger 認可の監査出力を無効にします。本番環境で監査する場合は、使用する Ranger バージョンの Hive 監査テンプレートを基に、Solr、HDFS、Kafka などの一元管理されたバックエンドを設定し、このプロパティを `true` にします。Log4j を本番環境の監査先として使用することは推奨しません。監査レコードが FE ログのローテーションポリシーを共有するため、保持期間と総容量を独立して制御しにくくなります。

#### FE の再起動

XML ファイルとキャッシュディレクトリを設定したら、Catalog を作成する前にすべての FE を再起動します。Ranger 設定は Access Controller の初期化時に読み込まれるため、すべての FE で同じファイルとパスを使用する必要があります。

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

Ranger-Hive は Doris の Catalog レベルの権限を管理しません。デフォルト値の `skip_catalog_priv_check=false` では、新しい `hive_ctl` をユーザーが参照して使用できるよう、デフォルト Access Controller 側でも許可する必要があります。デフォルトコントローラーが Doris 組み込み認可の場合は、次を実行します。

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

この権限付与は Doris の Catalog レベルの検査にのみ適用されます。`hive_ctl` 内のデータベース、テーブル、カラムへのアクセスは引き続きその Ranger-Hive Access Controller が検査します。

Current バージョンでは、代わりに `skip_catalog_priv_check=true` を `fe.conf` で設定すると、カスタム Access Controller を持つ外部 Catalog の `SHOW` と `SELECT` に対する Catalog レベルの検査を省略できます。Ranger-Hive によるデータベース、テーブル、カラムの検査や、`CREATE`、`LOAD`、`ALTER` などの操作に対する Catalog レベルの検査は省略されません。

次の名前は混同しやすいため、区別してください。

| 設定箇所 | 例 | 意味 |
| --- | --- | --- |
| Catalog の `access_controller.class` | `org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory` | Ranger-Hive Access Controller ファクトリの完全修飾クラス名。Current と 4.x では短縮識別子 `ranger-hive` も使用できる。Ranger Service Name を入力しない |
| Catalog の `access_controller.properties.ranger.service.name` | `hive` | Ranger プラグインの設定プレフィックスとサービスタイプ。Doris は `access_controller.properties.` を除去し、`ranger.service.name=hive` を Ranger に渡す |
| `ranger.plugin.hive.service.name`（`fe/conf/ranger-hive-security.xml` 内） | `hive_prod` | `<value>` には、Ranger WebUI でポリシーを保存する Hive Service Name を指定する |

:::caution
Catalog プロパティを `'access_controller.properties.ranger.service.name'='hive_prod'` に設定しないでください。この標準構成では `hive` にする必要があります。実際の Ranger WebUI の Service Name は `ranger.plugin.hive.service.name` に指定します。このプロパティは `ranger-hive-security.xml` 内にあり、値の例は `<value>hive_prod</value>` です。
:::

Hive Metastore、HDFS、またはオブジェクトストレージへの接続は、[Hive Catalog](../../../lakehouse/catalogs/hive-catalog) のドキュメントに従って設定してください。Ranger Admin または HMS/HDFS が Kerberos を使用する場合は、後述の Kerberos セクションを参照してください。これらの接続では、プリンシパル、キータブ、設定箇所がそれぞれ異なります。

Catalog の作成時、FE は設定を検証するために Access Controller をインスタンス化します。ほかの FE は、その Catalog のリクエストを初めて認可するときに、使用するコントローラーを初期化します。

<!-- Knowledge Type: Operational Steps -->
<!-- Use Case: Creating and Verifying a Ranger Hive Access Policy -->

## Ranger ポリシーの設定と検証

### Ranger アクセスポリシーの作成

Ranger WebUI で Hive サービス `hive_prod` を開き、Access Policy を作成します。

| フィールド | 例 |
| --- | --- |
| ポリシー名（Policy Name） | `alice_read_sales_orders` |
| データベース（Database） | `sales` |
| テーブル（Table） | `orders` |
| カラム（Column） | `*` |
| 対象ユーザー（Select User） | `alice` |
| 権限（Permissions） | `select` |

ポリシーを保存し、ポーリング間隔が一度経過するまで、この例では約 30 秒待ちます。

### 認可の検証

`alice` として Doris にログインし、次を実行します。

```sql
SHOW DATABASES FROM hive_ctl;
SELECT * FROM hive_ctl.sales.orders LIMIT 10;
```

期待される動作:

- `alice` は `sales` を表示し、`orders` をクエリできます。
- `hive_ctl.sales.customers` などの許可されていないテーブルをクエリすると、権限エラーが返されます。
- Ranger の一元監査を有効にしている場合、バックエンドに許可と拒否の両方のリクエストが記録されます。

<!-- Knowledge Type: Permission Mapping / Behavior Reference -->
<!-- Use Case: Ranger Policy Design / Authorization Troubleshooting -->

## 認可の動作

### 権限の対応関係

次の表は、Current と 4.x の `RangerHiveAccessController` における基本的な対応関係を示します。現在、この対応関係は同じですが、4.x ではさらにユーザー名、ロール名、データベース名から Cluster Namespace プレフィックスを除去します。対応関係があるからといって、すべての SQL 文でその権限検査が実行されるわけではありません。文のサポートは、各 Doris バージョンに実装された認可経路にも依存します。

| Doris の権限述語 | Ranger のアクセスタイプ |
| --- | --- |
| `SHOW` | `ANY_ACCESS`。リソースに対するいずれかのアクセスが許可されていることを意味する |
| `SELECT` | `select` |
| `LOAD` | `update` |
| `ALTER` | `alter` |
| `CREATE` | `create` |
| `DROP` | `drop` |
| `ADMIN` / `ALL` | `all` |
| 対応付けのないその他の述語 | `none` |

Ranger-Hive のリソースには `database`、`table`、`column` のみが含まれ、Doris Catalog 名は含まれません。二つの Doris Catalog がどちらも `hive_prod` を使用し、両方に `sales.orders` がある場合、同じ Ranger ポリシーが両方の Catalog のそのリソースに一致します。

### ユーザーとロールの照合

- Doris はユーザーを認証した後、現在の Doris ユーザー名を Ranger リクエストで送信します。Ranger のユーザー名は Doris のユーザー名と完全に一致する必要があります。
- Ranger-Hive を使用する Catalog では、データベース、テーブル、カラムの権限は Ranger-Hive のみが判定し、これらの範囲に対する Doris オブジェクト権限の付与結果は組み合わせません。ただし、Doris の Global 権限によって検査が先に成功することがあり、Catalog 権限は引き続きデフォルト Access Controller が管理します。
- Doris は、ユーザーが現在持つロール名をリクエストコンテキストとして送信します。Ranger ポリシーの `Roles` はこれらの名前と照合できます。これは Ranger ポリシーの条件にすぎず、Doris 内部のオブジェクト権限付与が Ranger-Hive の判定に加わることはありません。
- Doris と Ranger はロールを同期しません。ロールを条件にしたポリシーを記述する場合に限り、Doris リクエスト内のロール名が Ranger で参照するロール名と一致する必要があります。通常は、ユーザーまたはグループに基づく Ranger ポリシーの方が管理しやすくなります。
- Ranger UserSync は Doris のログインユーザーを作成しません。Ranger に `alice` が存在しても、Doris 側で `alice` を作成するか、LDAP などの設定済みプロバイダーで認証する必要があります。
- Doris ユーザーのホスト部分はログイン照合と監査用クライアント IP に使用され、Ranger ユーザー名には含まれません。たとえば、Doris ユーザー `'alice'@'10.%'` は Ranger ユーザー `alice` に対応します。

<!-- Knowledge Type: Configuration Examples -->
<!-- Use Case: Row-Level Access Control / Sensitive Data Masking -->

## 行フィルタリングとデータマスキング

### 行レベルフィルター

`hive_prod` に Row Level Filter Policy を作成します。

| フィールド | 例 |
| --- | --- |
| データベース（Database） | `sales` |
| テーブル（Table） | `orders` |
| ユーザー（User） | `alice` |
| 行レベルフィルター（Row Level Filter） | `region = 'CN'` |

Access Policy では、`alice` に `select` 権限を `sales.orders` に対して付与する必要もあります。行フィルターはフィルター式を追加するだけで、基本のアクセス認可を置き換えません。

次を実行します。

```sql
SELECT order_id, region FROM hive_ctl.sales.orders;
```

結果には `region = 'CN'` の行のみが含まれます。

### データマスキング

`hive_prod` に Masking Policy を作成します。

| フィールド | 例 |
| --- | --- |
| データベース（Database） | `sales` |
| テーブル（Table） | `customers` |
| カラム（Column） | `phone` |
| ユーザー（User） | `alice` |
| マスキングオプション（Masking Option） | Ranger 組み込みのタイプまたは Custom |
| カスタム式（Custom Expression） | `concat(substr({col}, 1, 3), '****')` |

さらに `alice` に `select` を対象カラムで許可します。`phone` をクエリすると、Doris は Ranger の式中の `{col}` を実際のカラム名に置き換えて、マスキング式を適用します。

:::caution
Doris SQL エンジンが行フィルター式とマスキング式を解析します。HiveServer2 向けの式に Doris がサポートしない Hive UDF や構文が含まれる場合は、書き換える必要があります。
:::

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Kerberos-Enabled Ranger Admin / SPNEGO Policy Download -->

## Ranger Admin が Kerberos を使用する場合

このセクションでは、FE の Ranger-Hive クライアントが HTTP/SPNEGO 経由で Ranger Admin に認証するよう設定します。Ranger Admin の Kerberos 認証は、Hive/HMS の Kerberos サービス認証とは異なります。同じ realm を使用することはできますが、各接続にはそれぞれサービスプリンシパル、クライアントプリンシパル、キータブ、設定箇所があります。

| 接続 | サーバー ID の例 | Doris クライアント ID の例 | 用途と設定 |
| --- | --- | --- | --- |
| FE から Ranger Admin | `HTTP/ranger-admin.example.com@EXAMPLE.COM` | `doris/ranger-client.example.com@EXAMPLE.COM` | ポリシーのダウンロード。サーバー設定は Ranger Admin、クライアント設定は `fe/conf/ranger-hive-security.xml` に置く |
| FE から HMS | `hive/hms.example.com@EXAMPLE.COM` | `doris/hive-client.example.com@EXAMPLE.COM` | メタデータの読み取り。Hive Catalog の `hive.metastore.*` プロパティで設定する |
| FE/BE から HDFS | NameNode/DataNode のサービスプリンシパル | `doris/hive-client.example.com@EXAMPLE.COM` | データの読み取り。Hive Catalog の `hdfs.authentication.*` プロパティで設定する |

:::caution バージョン要件
Doris 4.x では **4.0.2 以降**が必要です。Doris 4.0.0 と 4.0.1 に含まれる Ranger 2.4 には、ここで使用する Ranger プラグインの UGI キータブログインがありません。Doris 4.0.2 では Ranger が 2.7 にアップグレードされました。Current に含まれる Ranger バージョンにもこの機能があります。
:::

### 1. Ranger Admin と FE の Kerberos ID を確認する

まず Ranger Admin サーバーの設定を確認します。Apache Ranger は通常、`core-site.xml` と `ranger-admin-site.xml` をデプロイされた Web アプリケーションの `WEB-INF/classes/conf/` ディレクトリから読み込みます。ディストリビューションによってパスが異なる場合があるため、Ranger Admin の起動引数またはインストール構成を正としてください。

| ファイル | プロパティ | 意味 |
| --- | --- | --- |
| `core-site.xml` | `hadoop.security.authentication` | Ranger Admin の SPNEGO フィルターで使用する Hadoop 認証。安全なプラグインダウンロードには `kerberos` を使用する |
| `ranger-admin-site.xml` | `ranger.service.host` | Ranger Admin サービスのホスト名、および `_HOST` に代入する値 |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.principal` | HTTP/SPNEGO サービスプリンシパル。例: `HTTP/_HOST@EXAMPLE.COM` |
| `ranger-admin-site.xml` | `ranger.spnego.kerberos.keytab` | Ranger Admin が読み取るサーバー側 SPNEGO キータブのパス |

`ranger.authentication.method` は Ranger WebUI のログインを制御しますが、それだけでは安全なプラグインダウンロードエンドポイントで SPNEGO が使用されることを証明できません。有効な `ranger-admin-site.xml` と Ranger Admin の起動ログを確認してください。

Ranger Admin サーバーで `klist -kt <actual ranger.spnego.kerberos.keytab path>` を実行し、キータブに `_HOST` 展開後の HTTP プリンシパル（例: `HTTP/ranger-admin.example.com@EXAMPLE.COM`）が含まれることを確認します。`ranger.plugin.hive.policy.rest.url` のホスト名はこのプリンシパルと一致する必要があります。

Ranger は FE クライアントのプリンシパルやキータブを作成しません。Kerberos 管理者が `doris/ranger-client.example.com@EXAMPLE.COM` のような ID を作成して `/etc/security/keytabs/doris-ranger.keytab` にエクスポートし、すべての FE に配置して、FE プロセスのユーザーが読み取れるようにする必要があります。Ranger Admin の HTTP プリンシパルやサーバー用 SPNEGO キータブを FE に渡さないでください。

このセクションでは以下を使用します。

| 項目 | 例 |
| --- | --- |
| Ranger Hive の Service Name | `hive_prod` |
| Ranger Admin の URL | `http://ranger-admin.example.com:6080` |
| Kerberos realm | `EXAMPLE.COM` |
| Ranger Admin HTTP サービスプリンシパル | `HTTP/ranger-admin.example.com@EXAMPLE.COM` |
| FE ポリシーダウンロード用プリンシパル | `doris/ranger-client.example.com@EXAMPLE.COM` |
| FE クライアントキータブ | `/etc/security/keytabs/doris-ranger.keytab` |

HTTP プリンシパルは Ranger Admin のサーバー ID です。FE の `ugi.keytab.principal` に指定しないでください。このプロパティには FE クライアントの ID を指定する必要があります。

### 2. Hadoop UGI を Kerberos モードで初期化する

`ugi.*` プロパティだけを `ranger-hive-security.xml` に追加しても不十分です。Ranger は `UserGroupInformation.loginUserFromKeytab()` を呼び出します。キータブログインで Kerberos 認証情報が得られるのは、グローバル Hadoop 認証が `kerberos` に設定されている場合だけです。

各 FE で `core-site.xml` を `fe/conf/` に作成します。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<configuration>
    <property>
        <name>hadoop.security.authentication</name>
        <value>kerberos</value>
    </property>
</configuration>
```

`start_fe.sh` は FE の `conf` ディレクトリを Java クラスパスに追加するため、`fe/conf/core-site.xml` を推奨します。代わりに共有 Hadoop 設定ディレクトリを使用する場合は、`fe.conf` に次を設定します。

```text
HADOOP_CONF_DIR=/etc/hadoop/conf
```

その場合、すべての FE を再起動する前に、`/etc/hadoop/conf/core-site.xml` が存在し、FE プロセスのユーザーが読み取れる必要があります。

### 3. krb5.conf と Ranger Admin HTTP SPN を設定する

Ranger Admin URL のホスト名に対応する realm、KDC、`domain_realm` のマッピングを、各 FE の `/etc/krb5.conf` に設定します。

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

`ranger.plugin.hive.policy.rest.url` のホスト名は、Ranger Admin の HTTP/SPNEGO キータブ内の SPN と一致する必要があります。URL のホストが `ranger-admin.example.com` の場合、サーバーのキータブには次が含まれる必要があります。

```text
HTTP/ranger-admin.example.com@EXAMPLE.COM
```

短いホスト名、FQDN、CNAME、VIP、IP を混在させないでください。URL が `http://ranger-admin:6080` のような短いホスト名を使用する場合は、ドメインのマッピングに加えて完全一致するマッピングを追加します。

```ini
[domain_realm]
    ranger-admin = EXAMPLE.COM
    ranger-admin.example.com = EXAMPLE.COM
    .example.com = EXAMPLE.COM
```

`kinit`、`klist`、`kdestroy`、`kvno` を提供する Kerberos クライアントツールをインストールします。以下を FE プロセスのユーザーとして実行します。別のチケットキャッシュを使用するため、既存の認証情報は消去されません。まずプリンシパル、キータブ、ホスト名を置き換えてください。

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

`klist -kt` で FE クライアントのプリンシパルが表示される必要があります。`kinit` が成功した場合、通常は何も表示されません。`kvno` が成功し、続く `klist` で `krbtgt/...` と Ranger Admin の HTTP チケットの両方が表示されれば、クライアントキータブ、realm のマッピング、HTTP SPN を確認できます。最後の `kdestroy` はこの確認で使った一時キャッシュだけを削除します。

### 4. 完全な ranger-hive-security.xml を設定する

各 FE の `fe/conf/ranger-hive-security.xml` で、ポリシーへのアクセスと UGI ログインを併せて設定します。

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

Kerberos 固有のプロパティ:

| プロパティ | 説明 |
| --- | --- |
| `ranger.plugin.hive.ugi.initialize` | Ranger-Hive プラグインの初期化時に Hadoop UGI ログインを実行する |
| `ranger.plugin.hive.ugi.login.type` | キータブログインには `keytab` を設定する |
| `ranger.plugin.hive.ugi.keytab.principal` | FE が Ranger ポリシーのダウンロードに使用するクライアントプリンシパル。キータブ内に存在する必要がある |
| `ranger.plugin.hive.ugi.keytab.file` | クライアントキータブの絶対パス。すべての FE で同じパスに配置し、FE プロセスのユーザーが読み取れるようにする |

`ranger.plugin.hive.policy.rest.secure=true` は Kerberos ダウンロード経路を選択する設定ではありません。Ranger クライアントは、Hadoop UGI がセキュアモードかどうか、およびログインユーザーが Kerberos 認証情報を持つかどうかを確認します。選択されたモードは FE ログの `secureMode` で確認してください。

### 5. FE サービス ID に hive_prod ポリシーのダウンロードを許可する

この手順で認可するのは、**FE がポリシーのダウンロードに使用するサービスアカウント**です。Doris のクエリユーザー `alice` ではなく、このアカウントに Hive データへのアクセス権を付与するものでもありません。

Ranger Admin で Kerberos を有効にすると、ポリシーのダウンロードには二つの検査が必要です。

1. Ranger Admin が SPNEGO 経由で FE キータブのプリンシパルを認証します。
2. Ranger Admin が、認証済みログイン ID に `hive_prod` のデータをダウンロードする権限があるか確認します。

この例での ID の変換は次のとおりです。

| 段階 | 例 | 用途 |
| --- | --- | --- |
| FE キータブ内のプリンシパル | `doris/ranger-client.example.com@EXAMPLE.COM` | SPNEGO 認証 |
| Ranger Admin のログイン ID | `doris` | `auth_to_local` によるプリンシパル変換後のアカウント |
| 推奨する Hive サービス設定 | `policy.download.auth.users=doris` | この FE アカウントによるポリシーとロールのデータのダウンロードを許可する |

通常の FE サービスアカウントには、Hive サービスの `policy.download.auth.users` を使用して、ダウンロードに必要な最小権限だけを付与します。Ranger WebUI で Hive サービス `hive_prod` を編集し、その設定に次が含まれることを確認します。

```text
policy.download.auth.users=doris
```

ここでの `doris` は認証済み Ranger Admin セッションのログイン ID であり、Doris のクエリユーザーではありません。Ranger Admin の SPNEGO フィルターは `hadoop.security.auth_to_local` をその `core-site.xml` から適用します。この例のプリンシパルがそのルールで `doris` に変換される場合にのみ、`doris` を使用してください。完全なプリンシパルや固定の短縮名を推測せず、Ranger Admin の認証ログで実際のログイン ID を確認します。

Apache Ranger 2.7 は `policy.download.auth.users` をカンマで分割し、各項目をログイン ID と大文字小文字を区別せず完全一致で比較します。複数アカウントには `doris,hive` のようにスペースを含まないカンマ区切りリストを使用します。Ranger 管理者と `policy.grantrevoke.auth.users` に指定されたユーザーもダウンロード認可を通過できますが、FE に必要なのはダウンロード権限だけなので、そのためにより広い付与・取り消し権限を与えないでください。

### 6. FE を再起動し、安全なポリシーダウンロードを検証する

すべての FE を再起動し、まず FE ログに次のようなメッセージがあるか確認します。

```text
secureMode=true, user=doris/ranger-client.example.com@EXAMPLE.COM (auth:KERBEROS)
```

次に、FE プロセスのユーザーと同じキータブを使って、安全なポリシーエンドポイントを呼び出します。実行前に `curl --version` の出力で GSS-API、Kerberos、または SPNEGO のサポートを確認してください。

```shell
export KRB5CCNAME=FILE:/tmp/krb5cc_doris_ranger_download_test_$$
kdestroy 2>/dev/null || true
kinit -kt /etc/security/keytabs/doris-ranger.keytab \
    doris/ranger-client.example.com@EXAMPLE.COM

curl --negotiate -u : -sS -i \
    'http://ranger-admin.example.com:6080/service/plugins/secure/policies/download/hive_prod?lastKnownVersion=-1&lastActivationTime=0'

kdestroy
```

完全なポリシー JSON 応答と HTTP 200 が得られれば、エンドツーエンドで成功しています。`kinit`、`kvno`、`secureMode=true` の成功は経路の一部しか検証しないため、ダウンロード結果の代わりにはなりません。

ポリシーの読み込み後、この例のキャッシュディレクトリには次のファイルが含まれるはずです。

```text
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod.json
/var/lib/doris/ranger/hive_prod/policy-cache/hive_hive_prod_roles.json
```

### 7. Ranger Admin、HMS、HDFS のすべてが Kerberos を使用する場合

Hive Metastore と HDFS も Kerberos を使用する場合、クイックスタートの `CREATE CATALOG hive_ctl` 文の**代わりに**次の Catalog 定義を使用します。同じ Catalog を二度作成しないでください。ここでは `doris-ranger.keytab` は FE のポリシーダウンロード専用であり、`doris-hive.keytab` は HMS と HDFS へのアクセスに使用します。

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

二つのクライアント ID は用途が異なります。

- `doris-ranger.keytab` は、FE が SPNEGO 経由で Ranger Admin からポリシーをダウンロードするために使用します。FE にのみ配置する必要があります。
- `doris-hive.keytab` は HMS と HDFS へのアクセスに使用します。HMS クライアントキータブはすべての FE に配置します。HDFS クライアントキータブは、HDFS にアクセスするすべての FE と BE に、読み取り可能な同じ絶対パスで配置します。該当するプロパティを別々に設定すれば、HMS と HDFS で異なるクライアント ID を使用できます。

HMS サーバーのプリンシパルは Hive Metastore の Kerberos 設定から取得してください。例の `hive/hms.example.com@EXAMPLE.COM` は Ranger Admin の HTTP プリンシパルではありません。接続に同じ realm を使用することはできますが、プリンシパルとキータブを相互に入れ替えることはできません。

<!-- Knowledge Type: Operational Steps / Configuration Parameters -->
<!-- Use Case: Ranger Admin over HTTPS / Custom CA / Mutual TLS -->

## Ranger Admin が HTTPS を使用する場合

各 FE の `fe/conf/ranger-hive-security.xml` で Ranger Admin の URL を HTTPS に変更し、`ranger.plugin.hive.policy.rest.ssl.config.file` に SSL 設定ファイルを指定します。

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

次の例では Ranger Admin CA 証明書 `/tmp/ranger-admin-ca.pem` と FE プロセス ID `doris:doris` を使用します。各 FE にトラストストアと JCEKS 認証情報プロバイダーを用意します。コマンドには JDK の `keytool` と Hadoop の `hadoop credential` が必要です。

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

`keytool` はトラストストアのパスワードを求め、`hadoop credential` は `sslTrustStore` の値を求めます。両方に同じパスワードを入力してください。一時 CA パスはデプロイ先の証明書管理パスに置き換え、FE プロセスのユーザーが両方のファイルを読み取れることを確認します。

`ranger-policymgr-ssl.xml` の例:

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

Ranger クライアントは、固定エイリアス `sslTrustStore` からトラストストアのパスワードを読み取ります。相互 TLS を使用する場合は、さらに `xasecure.policymgr.clientssl.keystore` と JCEKS 内の `sslKeyStore` エイリアスが必要です。トラストストアやキーストアの平文パスワードを XML に記載しないでください。

<!-- Knowledge Type: Architecture Constraints / Best Practices -->
<!-- Use Case: Multiple Hive Catalogs / Ranger-Doris and Ranger-Hive Coexistence -->

## 複数の Catalog と実行時の制約

### 複数の Catalog で一つの Hive ポリシーサービスを再利用する

`hive_prod` に対応する複数の Catalog は、同じコントローラー設定を使用できます。

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

Ranger Hive のリソースには Catalog という区分がないため、同じ名前のデータベース、テーブル、カラムは同じポリシーに一致します。二つの Metastore が意図的にリソース名と認可の境界を共有する場合にのみ、サービスを再利用してください。

### 異なる Ranger Hive サービスインスタンス

標準の `hive` プレフィックスは一つの `ranger-hive-security.xml` に対応するため、同じ FE 内のすべての Ranger-Hive Catalog は同じ `ranger.plugin.hive.service.name` を読み取ります。現在の Catalog インターフェースでは、Catalog ごとに異なる Ranger Hive Service Name を選択できません。WebUI のサービス名（例: `hive_prod_a`）を Catalog の `ranger.service.name` に指定しないでください。指定すると Ranger は `ranger-hive_prod_a-security.xml` と `ranger.plugin.hive_prod_a.*` を探しますが、これはここで説明する標準の Hive 設定の対象外です。独立した Ranger Hive サービスを分離するには、Doris クラスターを分けるか、Catalog 間で一つの Ranger Hive ポリシーサービスを共有してください。

### 実行時の制約とベストプラクティス

- Ranger-Hive は Hive/HMS Catalog のみに使用します。すべての外部 Catalog に使える汎用 Ranger コントローラーではありません。
- Ranger-Hive と Ranger-Doris のポリシーは同期しません。設定ファイルとポリシーキャッシュディレクトリは別々にしてください。
- Ranger の監査プロバイダーは FE プロセス内でグローバルに共有されます。最初に初期化された Ranger プラグインが監査の有効・無効と出力先を決めます。Ranger-Doris と Ranger-Hive を併用する場合、初期化順序に結果が左右されないよう、両方の監査 XML ファイルで同じ有効・無効設定と一元化された出力先を使用してください。
- Hadoop UGI のログイン状態は FE JVM 内でグローバルです。Ranger-Doris と Ranger-Hive、または Kerberos を有効にした複数の Ranger Catalog を併用する場合、同じ Ranger クライアントプリンシパルとキータブを使用してください。別の ID で後からログインするとプロセスのログインが置き換わり、ポリシーダウンロードが不安定になる可能性があります。
- Ranger-Hive は Ranger の HDFS、S3、オブジェクトストレージのポリシーを検査しません。ストレージへのアクセスには、引き続き Doris Catalog に設定された認証情報を使用します。
- Ranger Hive リソースには Doris Catalog という区分がありません。Metastore 間で同名のデータベースやテーブルがある場合は、競合を評価してください。
- Doris と Ranger はユーザーやロールを同期しません。一貫した命名規則を定め、一般ユーザーのアカウントで許可と拒否の両方のリクエストをテストしてください。
- 最初のポリシーダウンロードに失敗した場合、プラグインはローカルキャッシュを使用することがあります。古いポリシーが見過ごされないように、キャッシュの鮮度と Ranger 監査を監視してください。
- Access Controller を初期化した各 FE は、個別にポリシーをダウンロードしてキャッシュします。すべての FE で設定ファイル、キータブ、トラストストア、ディレクトリ権限を揃えてください。
- ポリシー変更は即時には反映されません。最大遅延は通常、`policy.pollIntervalMs` に Ranger Admin とネットワークの遅延を加えた程度です。

<!-- Knowledge Type: FAQ / Troubleshooting -->
<!-- Use Case: Configuration Loading Failure / Policy Download Failure / Authorization Failure -->

## トラブルシューティング

症状の表で最初に確認する項目を特定し、原因と詳しい手順について対応するセクションを参照してください。

| 症状 | 最初に確認する項目 |
| --- | --- |
| Catalog 作成時に Access Controller が見つからない | `access_controller.class` に完全修飾ファクトリクラス名または `ranger-hive` を指定しているか確認する |
| ログに `ranger-hive-security.xml` が見つからないと表示される | Catalog のプレフィックスが `hive` に固定され、すべての FE の `fe/conf/` にファイルがあるか確認する |
| 監査を無効にするとセキュリティ XML が効かない | `ranger-hive-audit.xml` を配置し、監査を明示的に無効にする |
| Ranger Admin に接続できるがポリシーが読み込まれない | Service Name、REST URL、ネットワークアクセス、キャッシュディレクトリ、ポリシーの状態を確認する |
| Kerberos の有効化後にポリシーダウンロードが失敗する | UGI セキュアモード、HTTP SPN、ダウンロード認可、HTTP ステータス、ポリシーキャッシュを確認する |
| Ranger ではユーザーが許可されるのに Catalog が表示されない | デフォルト Access Controller の Catalog レベルの権限を確認する |
| Ranger の拒否ポリシーが効かない | Global 権限を確認し、`root` または `admin` でのテストを避ける |
| HiveServer2 ではポリシーが効くが Doris では効かない | Service Name、ユーザー名とロール名、式の互換性を確認する |
| ユーザーが HDFS または S3 を直接読み取れる | Ranger-Hive は基盤ストレージのアクセス制御を適用しない |

### Catalog 作成時に Access Controller が見つからない

現在のファクトリクラス名を使用します。

```sql
'access_controller.class' = 'org.apache.doris.catalog.authorizer.ranger.hive.RangerHiveAccessControllerFactory'
```

Current と 4.x は短縮識別子にも対応しています。

```sql
'access_controller.class' = 'ranger-hive'
```

`hive`、`hive_prod`、または旧クラス名 `org.apache.doris.catalog.authorizer.RangerHiveAccessControllerFactory` は使用しないでください。すべての FE で同じ Doris バージョンを実行していることを確認し、FE ログで `Access Controller Plugin Factory` を検索してください。

### ログに ranger-hive-security.xml が見つからないと表示される

次の二つの設定は混同しやすいため、区別してください。

- Catalog の `'access_controller.properties.ranger.service.name' = 'hive'` は Ranger Hive プラグインを選択するもので、値は `hive` のままにする必要があります。Doris はこの値を使用して `ranger-hive-security.xml` を探し、`ranger.plugin.hive.*` の設定を読み取ります。
- `ranger.plugin.hive.service.name` は `ranger-hive-security.xml` 内にあり、Ranger WebUI にある実際の Hive Service Name（例: `hive_prod`）を指定します。

Catalog に誤って `hive_prod` を指定すると、Ranger は `ranger-hive_prod-security.xml` を探します。すべての FE で `ranger-hive-security.xml` が `fe/conf/` にあることを確認し、修正後にすべての FE を再起動してください。

### 監査を無効にした場合も ranger-hive-audit.xml が必要な理由

Ranger 2.7 は `ranger-hive-audit.xml` が見つからないと、旧式のフォールバックに入り、`hive-site.xml`、`hbase-site.xml`、または `hdfs-site.xml` を探し、続いて同じディレクトリから `xasecure-audit.xml` を読み込もうとします。そのファイルが存在しない場合、後から読み込む `ranger-hive-security.xml` も有効にならないことがあります。`ranger-hive-security.xml` と `ranger-hive-audit.xml` は必ず一緒に配置し、監査が不要な場合は `xasecure.audit.is.enabled=false` を設定してください。`core-site.xml` はこの旧式の監査ファイル検索リストにはなく、直接の原因ではありません。

### Ranger Admin に接続できるがポリシーがダウンロードされない

次の順に確認します。

1. `ranger.plugin.hive.service.name` が WebUI の Service Name `hive_prod` と完全に一致すること。
2. `ranger.plugin.hive.policy.rest.url` が Ranger Admin のルート URL であること。
3. FE から Ranger Admin へのネットワーク、DNS、HTTPS トラストストアのアクセスが機能すること。
4. キャッシュディレクトリが存在し、FE プロセスのユーザーが書き込めること。
5. Ranger サービスが有効で、ポリシーが保存されていること。

Ranger Admin が Kerberos を使用する場合は、次のトラブルシューティング項目に進んでください。

### Ranger Admin で Kerberos を有効にした後、ポリシーダウンロードが失敗する

ダウンロード経路を次の順に確認します。

1. **Kerberos モードを確認する。** FE ログに `secureMode=true` と `(auth:KERBEROS)` があるはずです。`secureMode=false` または `(auth:SIMPLE)` と表示される場合は、`hadoop.security.authentication=kerberos` が `core-site.xml` に設定されていることを確認し、ファイルを `fe/conf/` または `HADOOP_CONF_DIR` 経由でクラスパスに追加されるディレクトリに配置して、すべての FE を再起動します。デフォルトの `hadoop_config_dir`（`plugins/hadoop_conf/` 内）だけに依存しないでください。このディレクトリは主に Catalog/Hadoop 接続用であり、Ranger プラグインがグローバル UGI を初期化するときに参照できるとは限りません。4.x では 4.0.2 以降を使用し、誤って `ranger.plugin.hive.forceNonKerberos=true` が設定されていないことを確認します。
2. **HTTP サービスチケットを確認する。** FE プロセスのユーザーとして、Kerberos の主な手順にある `kinit` と `kvno HTTP/ranger-admin.example.com@EXAMPLE.COM` の確認を実行します。`Server not found in Kerberos database`、`No service creds`、または誤った `krbtgt/<REALM>` へのリクエストが出る場合は、URL のホスト名、Ranger Admin の HTTP SPN、DNS、`/etc/krb5.conf` のマッピングを比較します。URL と SPN はまったく同じホスト名を使用する必要があります。
3. **ダウンロード認可を確認する。** SPNEGO 認証後、Ranger Admin ログで実際のログイン ID を確認します。ここで使用する通常の FE アカウントでは、その ID を `hive_prod` サービスの `policy.download.auth.users` に指定します。Apache Ranger 2.7 は Ranger 管理者と `policy.grantrevoke.auth.users` のアカウントも許可しますが、FE のダウンロードだけのために、より広い付与・取り消し権限を与えないでください。WebUI に `policy.download.auth.users` が表示されない場合は、ディストリビューションの Ranger プラグインインストール設定または Ranger Service REST API を通じて確認または更新します。REST 経由で更新する際は、既存のすべてのサービス設定を保持してください。
4. **安全なエンドポイントのステータスを確認する。** Kerberos の手順 6 の `curl --negotiate` コマンドを再実行し、応答本文を保存します。標準の Apache Ranger 2.7 では、HTTP 401 は SPNEGO 認証の失敗、403 はログイン ID が認証されたが管理者ではなく、どちらの許可ユーザーリストにも含まれないこと、404 は通常 XML の Service Name が Ranger WebUI と一致しないことを意味します。完全なポリシー JSON を伴う 200 のみが成功を確認します。ベンダーのディストリビューションではステータスの扱いが異なることがあるため、Ranger Admin ログも確認してください。`kinit` の成功はクライアント TGT の取得だけを証明します。
5. **ポリシーキャッシュを確認する。** ダウンロードが成功すると、`hive_hive_prod.json` と `hive_hive_prod_roles.json` の両方が作成されます。小さなロールファイルしかない場合、メインのポリシーはまだ読み込まれていません。`getServicePoliciesIfUpdated` の応答と、`policy engine initialization failed` やキャッシュ書き込みエラーなどの FE ログメッセージを確認してください。

### Ranger ではユーザーが許可されるが、SHOW CATALOGS に Catalog が表示されない

Catalog レベルの検査はデフォルト Access Controller が担当します。Doris 組み込み認可の場合は Catalog に対する権限を付与します。

```sql
GRANT SELECT_PRIV ON hive_ctl.*.* TO 'alice';
```

Current では `skip_catalog_priv_check=true` も検討できます。この設定が影響するのは、カスタム Access Controller を持つ外部 Catalog に対する Catalog レベルの `SHOW` と `SELECT` の検査だけです。

### Ranger の拒否ポリシーが効かない

ユーザーに Doris の Global 権限があるか確認してください。デフォルト Access Controller が一致する Global 権限を付与していると、Ranger-Hive がデータベース、テーブル、カラムを許可していなくても、最終的な検査が成功する場合があります。`ADMIN_PRIV` も Global `SELECT_PRIV` も持たない一般ユーザーでテストしてください。

### HiveServer2 ではポリシーが効くが Doris では効かない

Doris と HiveServer2 が同じ Ranger Hive Service Name を読み取っていること、およびポリシー式が Doris のサポートする SQL 構文を使用していることを確認してください。また、Doris リクエスト内のユーザー名とロール名が Ranger ポリシーで参照する名前と完全に一致することも確認します。

### Ranger-Hive は HDFS または S3 への直接アクセスを防げますか？

いいえ。Ranger-Hive は Doris SQL レイヤーで Hive のデータベース、テーブル、カラムへのリクエストだけを認可します。HDFS、S3、その他のストレージへのアクセスは Catalog のストレージ認証設定を使用し、ストレージ側で別途アクセス制御と認証情報の分離が必要です。

<!-- Knowledge Type: Production Checklist -->
<!-- Use Case: Production Deployment Acceptance -->

## 本番環境のチェックリスト

- Ranger WebUI で Service Type に Hive を使用し、Service Name が XML の値と完全に一致している。
- すべての FE に解析可能な `ranger-hive-security.xml` と `ranger-hive-audit.xml` があり、監査が不要な場合は監査 XML で明示的に無効になっている。
- Ranger-Doris と Ranger-Hive は、FE プロセスのユーザーが書き込める別々のポリシーキャッシュディレクトリを使用している。
- Catalog の `access_controller.class` に Ranger-Hive ファクトリの完全修飾クラス名またはサポート対象の識別子 `ranger-hive` を使用し、設定プレフィックスの値が `hive` になっている。
- 通常の Doris ユーザー名と Ranger ユーザー名が一致している。Doris ロールを Ranger ポリシーで使用する場合は、参照するロール名が一致している。
- 許可されたアクセス、拒否されたアクセス、カラム権限、行フィルタリング、データマスキングをそれぞれテストしている。
- Catalog レベルの権限はデフォルト Access Controller から付与され、テストユーザーには意図した Ranger-Hive の検査を迂回する Global 権限がない。
- Ranger Admin の Kerberos または HTTPS を使用する場合、すべての FE でキータブ、トラストストア、`krb5.conf`、絶対パスが一致している。
- Catalog 間で同名のデータベースやテーブルを確認し、意図しないポリシー適用範囲の拡大を防いでいる。
- 監査を有効にしている場合、設定した出力先に Doris の許可・拒否レコードが含まれる。Ranger WebUI で監査を表示するにも、Solr など、対応する一元化されたバックエンドが必要。
