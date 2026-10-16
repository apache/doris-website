---
{
    "title": "DBeaver",
    "language": "ja",
    "description": "Apache Doris ドライバーまたは MySQL ドライバーで DBeaver を Apache Doris に接続し、内部・外部カタログを参照して SQL クエリを実行する方法を説明します。"
}
---

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenario: Use DBeaver to connect to and manage Apache Doris databases -->

DBeaver は、開発者、データベース管理者、アナリストなど、データを扱う人向けのクロスプラットフォーム対応データベースツールです。

Apache Doris は MySQL プロトコルを通じてクエリを受け付けます。DBeaver 26.1.1 以降には `Apache Doris` データソースがあり、内部カタログと外部カタログにクエリを実行できます。

`Select your database` ウィンドウに `Apache Doris` が表示されない場合は、MySQL ドライバーを使用してください。[MySQL ドライバーで接続する](#connect-with-the-mysql-driver)を参照してください。

## ユースケース

- Apache Doris のカタログ、データベース、テーブル、ビューなどのメタデータを参照する。
- SQL エディターでクエリを実行し、データを分析する。
- 単一のツールで内部カタログと外部カタログを管理する。
- セッション、システム変数、ユーザー権限などの実行時情報を確認する。

## 前提条件

- [https://dbeaver.com](https://dbeaver.com) から DBeaver 26.1.1 以降をインストールします。
- Apache Doris クラスターに接続でき、FE のホストアドレス、MySQL プロトコルのポート、ユーザー名、パスワードが分かっている必要があります。
- `catalog.db` 形式で外部カタログに接続するには、Doris 2.1.0 以降を使用します。

## DBeaver を Doris に接続する

### Apache Doris ドライバーで接続する（推奨）

:::warning バージョン要件
DBeaver 26.1.1 以降が必要です。
:::

#### ステップ 1: データベース接続を作成する

DBeaver を起動します。

左上のプラス（`+`）アイコンをクリックするか、メニューバーから `Database` > `New Database Connection` を選択します。`Connect to a database` ウィンドウが開きます。

![データベース接続を作成する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-add-connection.jpg)

#### ステップ 2: Apache Doris ドライバーを選択する

`Select your database` ウィンドウで `Apache Doris` を検索または選択し、`Next` をクリックします。

![Apache Doris ドライバーを選択する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-select-driver.jpg)

#### ステップ 3: Doris への接続を設定する

`Main` タブ（`Apache Doris connection settings` ウィンドウ）で、次の値を入力します。

| フィールド | 説明 | 例 |
|-------|-------------|---------|
| Host | FE のホスト名または IP アドレス。SSH トンネルを使用する場合は、ローカル転送先のアドレスを入力します。 | `127.0.0.1` |
| Port | FE の MySQL プロトコルのポート。SSH トンネルを使用する場合は、ローカル転送先のポートを入力します。 | `9030` または `19030` |
| Database/Schema | 省略可能。接続先のデータベース。外部カタログに直接接続する場合は `catalog.db` 形式を使用します。 | `example_db` または `hive.example_db` |
| Username | Doris クラスターのユーザー名。 | `admin` |
| Password | Doris クラスターのパスワード。 | - |

`Database/Schema` の値によって、DBeaver が開くカタログとデータベースが決まります。

- 空欄にすると、接続後に Database Navigator でカタログとデータベースを参照できます。
- データベース名を入力すると、内部カタログ内のそのデータベースが開きます。
- `catalog.db` を入力すると、指定した外部カタログ内のデータベースが開きます。DBeaver には、そのカタログとデータベースのテーブルが表示されます。

:::note
`catalog.db` 形式には Doris 2.1.0 以降が必要です。
:::

内部カタログに接続する場合:

![内部カタログに接続する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-internal-catalog.jpg)

外部カタログに接続する場合:

![外部カタログに接続する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-external-catalog.jpg)

DBeaver に組み込まれた SSH 機能を使用するには、右上の `SSH, Proxy` をクリックしてトンネルを設定します。ローカルポート転送をすでに設定している場合は、`Host` と `Port` にローカルのアドレスとポートを入力します。

#### ステップ 4: 接続をテストして保存する

左下の `Test Connection` をクリックします。

DBeaver に接続成功が表示されたら、`OK` をクリックします。

`Finish` をクリックして接続を保存します。

![Apache Doris ドライバーの接続をテストする](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-test-connection.jpg)

#### ステップ 5: Doris のオブジェクトを参照する

新しいデータソースが Database Navigator に表示されます。展開すると、Doris のカタログ、データベース、テーブル、ビューを参照できます。

![Doris のオブジェクトを参照する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-navigator.jpg)

#### ドライバーのプロパティを設定する

Apache Doris ドライバーは MySQL Connector/J を使用して FE の MySQL プロトコルのポートに接続します。デフォルトのポートは `9030`、デフォルトのユーザーは `root` です。JDBC URL テンプレートは次のとおりです。

```text
jdbc:mysql://{host}[:{port}]/[{database}]
```

ドライバークラスは次のとおりです。

```text
com.mysql.cj.jdbc.Driver
```

ドライバーには、デフォルトで次の値が設定されます。

```text
connectTimeout=20000
rewriteBatchedStatements=true
useSSL=false
enabledTLSProtocols=TLSv1.2,TLSv1.3
```

![Apache Doris ドライバーのプロパティを設定する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-doris-driver-properties.jpg)

`useSSL=false` により、TLS/SSL はデフォルトで無効になります。FE の MySQL プロトコルのポートで TLS が有効であり、証明書チェーンが正しく設定されている場合は、`Driver properties` で MySQL Connector/J の SSL プロパティを設定します。例:

```text
useSSL=true
sslMode=REQUIRED
```

認証局を検証するには、Java トラストストアを設定します。

```text
sslMode=VERIFY_CA
trustCertificateKeyStoreUrl=file:/path/to/doris-truststore.jks
trustCertificateKeyStorePassword=<password>
```

サーバーのホスト名も検証するには、次を使用します。

```text
sslMode=VERIFY_IDENTITY
```

`VERIFY_IDENTITY` を使用する場合、DBeaver の `Host` の値は証明書の SAN または CN と一致する必要があります。

### MySQL ドライバーで接続する {#connect-with-the-mysql-driver}

`Select your database` ウィンドウに `Apache Doris` が表示されない場合は、MySQL ドライバーで接続します。

#### ステップ 1: データベース接続を作成する

DBeaver を起動します。

左上のプラス（`+`）アイコンをクリックするか、メニューバーから `Database` > `New Database Connection` を選択します。`Connect to a database` ウィンドウが開きます。

![MySQL データベース接続を作成する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-add-connection.jpg)

#### ステップ 2: MySQL ドライバーを選択する

`Select your database` ウィンドウで `MySQL` を選択します。

#### ステップ 3: Doris への接続を設定する

`Main` タブ（`Connection Settings` ウィンドウ）で、次の値を入力します。

| フィールド | 説明 | 例 |
|-------|-------------|---------|
| Server Host | FE のホスト名または IP アドレス。 | `127.0.0.1` |
| Port | FE の MySQL プロトコルのポート。 | `9030` |
| Database | 接続先のデータベース。外部カタログに直接接続する場合は `catalog.db` 形式を使用します。 | `example_db` または `hive.example_db` |
| Username | Doris クラスターのユーザー名。 | `admin` |
| Password | Doris クラスターのパスワード。 | - |

`Database` の値によって、デフォルトのカタログが決まります。

- データベース名を入力すると、内部カタログ内のそのデータベースが開きます。
- `catalog.db` を入力すると、指定した外部カタログ内のデータベースが開きます。DBeaver には、そのカタログとデータベースのテーブルが表示されます。

複数のカタログに直接アクセスする必要がある場合は、Doris のデータソースを個別に作成します。

:::note
`catalog.db` 形式には Doris 2.1.0 以降が必要です。
:::

内部カタログに接続する場合:

![MySQL ドライバーで内部カタログに接続する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-internal-catalog.jpg)

外部カタログに接続する場合:

![MySQL ドライバーで外部カタログに接続する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-external-catalog.jpg)

#### ステップ 4: 接続をテストして保存する

左下の `Test Connection` をクリックします。

DBeaver に接続成功が表示されたら、`OK` をクリックします。

![MySQL ドライバーの接続をテストする](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-test-connection.jpg)

`Finish` をクリックして接続を保存します。

#### ステップ 5: データベースを管理する

新しいデータソースが Database Navigator に表示されます。このデータソースを使用して、データベースに接続し、管理します。

![MySQL ドライバーでデータベースを管理する](/images/next/connection-integration/data-integration/dbeaver-new/dbeaver-mysql-navigator.jpg)

## ドライバーの選択と機能の対応状況

### ドライバーを選択する

Apache Doris ドライバーと MySQL ドライバーは、どちらも FE の MySQL プロトコルのポートを通じて Doris に接続します。主な違いは、DBeaver におけるメタデータのモデル化、ナビゲーター内のオブジェクトの構成、管理機能の提供方法です。

ドライバーを選択する際は、次の目安を使用してください。

| ユースケース | 推奨ドライバー |
|----------|--------------------|
| Doris に接続し、SQL を実行してデータベースとテーブルを参照する | Apache Doris ドライバー |
| 単一の接続で内部カタログと複数の外部カタログを参照する | Apache Doris ドライバー |
| 使用中の DBeaver のバージョンに Apache Doris データソースがない | MySQL ドライバー |
| Users、Session Manager、System Info を表示する | MySQL ドライバー |

内部カタログのみを使用する場合は、どちらのドライバーでも Doris に接続して SQL を実行できます。ただし、Apache Doris ドライバーを推奨します。

### 機能の比較

| 機能 | Apache Doris ドライバー | MySQL ドライバー |
|---------|---------------------|--------------|
| Doris に接続して SQL を実行する | 対応 | 対応 |
| 内部カタログを参照する | 対応 | 対応 |
| 単一の接続で複数のカタログを参照する | 対応 | 非対応 |
| Database Navigator で外部カタログを参照する | 対応 | 非対応 |
| `catalog.db` をデフォルトの SQL コンテキストとして使用する | 対応 | 対応 |
| テーブル、ビュー、カラム、DDL を表示する | 対応 | 対応 |
| SQL エディターと SQL コンソールを使用する | 対応 | 対応 |
| UI からデータを表示する | 対応 | 対応 |
| UI からデータを挿入する | 対応 | 対応 |
| Users、Session Manager、System Info を表示する | 非対応 | 対応 |
| Tools > Analyse | 非対応 | 対応 |
| Tools > Truncate | 非対応 | 対応 |

:::note 対応範囲

この表では、対応する機能を明示的に列挙しています。

- 表で「対応」と明記された機能のみが、このドキュメントの対象です。
- 表にない DBeaver の UI 操作や管理機能は、サポートされていません。
- MySQL ドライバーを使用する場合、DBeaver のインターフェースに MySQL の機能が表示されても、Doris がその機能をサポートしているとは限りません。
- Users、Session Manager、System Info は読み取り専用です。DBeaver を使用してユーザー、権限、セッションを変更することはできません。
- `Analyse` と `Truncate` の対応は、MySQL ドライバー使用時の DBeaver の Tools メニューにのみ適用されます。Apache Doris ドライバーを使用する場合は、SQL エディターで対応する Doris SQL 文を実行してください。

:::

### 主な制限事項

どちらのドライバーも、次の操作には対応していません。

- UI から既存のデータを更新または削除する。
- UI からテーブルを作成する。
- UI からカラムを追加または変更する。
- UI からインデックスを作成または変更する。
- UI から外部キーまたはトリガーを作成する。
- UI からキーモデル、パーティション、バケット、レプリカ数、テーブルプロパティを設定する。
- Session Status、Global Status、Dashboard を使用する。
- データベースに対して Check、Optimize、Repair、Dump を実行する。

Doris のテーブルスキーマを変更したり、既存のデータを更新または削除したりする場合は、SQL エディターを使用してください。
