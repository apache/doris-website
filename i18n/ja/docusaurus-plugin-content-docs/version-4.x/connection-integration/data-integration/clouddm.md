---
{
    "title": "CloudDM",
    "language": "ja",
    "description": "CloudDM を使用して Apache Doris に接続し、Doris データソースを管理する方法を説明します。データアクセス、データマスキング、視覚的な編集、データベースの CI/CD をサポートします。"
}
---

## 概要

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use CloudDM to connect to and manage Apache Doris data sources -->

Clougence が開発した CloudDM は、チームと個人ユーザー向けのクロスプラットフォームのデータベースツールです。データベースの変更と管理を、安全かつ効率的に、規制に準拠して行うのに役立ちます。

Apache Doris を使用する場面では、CloudDM は Doris の機能に合わせた専用の対応を提供し、データアクセス、データマスキング、視覚的な編集、データベースの CI/CD をサポートします。この記事では、次の操作を説明します。

- CloudDM に Doris データソースを追加する。
- Doris インスタンスのデータ管理を有効にし、接続をテストする。
- CloudDM を使用して Doris のデータにアクセスし、管理する。

## 事前準備

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the CloudDM installation and verify the version before connecting to Doris -->

| 項目 | 要件 |
|-------|------|
| CloudDM | CloudDM がインストールされていること。[CloudDM 公式サイト](https://www.cdmgr.com/)からダウンロードしてインストールできます。 |
| 検証済みバージョン | この記事は CloudDM 2.8.0.0 で検証しています。 |

## Doris データソースに接続する

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris data source connection in CloudDM -->

### 1. Doris データソースを追加する

1. CloudDM にログインします。
2. ナビゲーションバーで **Data Source Management（データソース管理）** > **Add Data Source（データソースを追加）** をクリックします。
3. Doris データソースを選択します。

![データソースを追加する](/images/next/connection-integration/data-integration/clouddm/clouddm1-en.png)

### 2. 接続情報を設定する

データソースの追加ページで、次の接続情報を設定します。

| 項目 | 説明 |
|-------|------|
| クライアントアドレス（Client address） | Doris クラスターの FE クエリポートのアドレス。例: `hostID:9030`。 |
| アカウント（Account） | Doris クラスターへのログインに使用するユーザー名。例: `admin`。 |
| パスワード（Password） | Doris クラスターへのログインに使用するユーザーのパスワード。 |

:::tip
Doris には `internal catalog` と `external catalog` があり、CloudDM では両方を同時に管理できます。
:::

:::info 注記
Doris の `external catalog` を `catalog.db` 形式のデータベースとして管理するには、Doris 2.1.0 以降が必要です。
:::

### 3. データ管理を有効にして接続をテストする

画面上部の **Query Settings（クエリ設定）** > **Query Configuration（クエリ構成）** をクリックして、Doris インスタンスのデータ管理を有効にし、接続をテストします。

![データソースを有効にする](/images/next/connection-integration/data-integration/clouddm/clouddm2-en.png)

### 4. Doris のデータにアクセスする

データベースへの接続が確立すると、左側のデータベース接続ナビゲーションに接続済みのデータソースが表示され、CloudDM を使用してデータベースに接続し、管理できます。

![接続を確立する](/images/next/connection-integration/data-integration/clouddm/clouddm3-en.png)

## CloudDM がサポートする Doris の管理シナリオ

<!-- Knowledge type: Feature support -->
<!-- Applicable scenario: Understand which Doris management capabilities CloudDM supports -->

CloudDM は、次の二つのカテゴリで Doris の機能をサポートします。

| シナリオ | サポートする機能 |
|---------|---------|
| クエリクライアント | Doris のデータベースオブジェクトを視覚的に管理する。コンソールで SQL を記述して Doris を操作する。クエリ結果をエクスポートする。 |
| チームでの利用 | テーブル単位までのステートメントレベルの権限付与、チケットの承認、データベースの CI/CD、機密データのマスキング、SQL レビュールール。 |
