---
{
    "title": "DBine",
    "language": "ja",
    "description": "無料のオープンソースのデスクトップデータベース管理ツール DBine を、Doris 接続タイプで Apache Doris に接続し、データベースやテーブルの参照と SQL の実行を行う方法を説明します。"
}
---

<!-- Knowledge type: Scenario description -->
<!-- Applicable scenario: Use DBine to connect to and query Apache Doris -->

## 概要 {#overview}

[DBine](https://dbine.com) は、Windows、macOS、Linux 向けの無料のオープンソース（Apache 2.0 ライセンス）のデスクトップデータベース管理ツールです。同じウィンドウで 130+ のデータベースとクラウドサービスを扱えます。Apache Doris 接続タイプを備えており、MySQL プロトコルで FE に接続します。

この記事を読むと、次のことができるようになります。

- DBine をインストールし、Doris 接続を作成する。
- internal catalog のデータベース、テーブル、ビュー、カラムを参照し、Doris に対して SQL を実行する。
- 表示された情報を判断する際に、MySQL サーバーとの違いを把握する。

## 前提条件 {#prerequisites}

<!-- Knowledge type: Prerequisites -->
<!-- Applicable scenario: Check the DBine and Doris connection requirements before connecting -->

- DBine がインストールされていること。[リリースページ](https://github.com/addlayer-io/dbine/releases)からダウンロードできます。
- DBine を実行するコンピューターから FE にアクセスできること。Doris ユーザーに、対象のデータベースとテーブルに必要な権限を付与してください。
- Doris クラスターの接続情報（FE のホストアドレス、FE の MySQL プロトコルポート〔デフォルトは `9030`〕、対象のデータベース、ユーザー名、パスワード）が用意されていること。

## Doris に接続する {#connect-to-doris}

<!-- Knowledge type: Procedure -->
<!-- Applicable scenario: Create a Doris connection in DBine -->

### 1. 接続を追加する {#1-add-a-connection}

DBine で **New connection** をクリックし、エンジンの一覧から **Apache Doris** を選択します。

### 2. Doris 接続を設定する {#2-configure-the-doris-connection}

接続フォームに入力します。

| 項目 | 説明 |
| --- | --- |
| Server | Doris クラスターの FE ホストアドレス。 |
| Port | FE の MySQL プロトコルポート。デフォルトは `9030`。 |
| Database | Doris クラスターの internal catalog にある対象のデータベース。省略可能。 |
| User | Doris クラスターのユーザー名。 |
| Password | Doris クラスターのパスワード。 |

TLS を使用するクラスターでは、**SSL/TLS** タブを開き、**Encrypt the connection (TLS)** を選択します。

### 3. 接続をテストして保存する {#3-test-and-save-the-connection}

**Test connection** をクリックして接続を確認し、**Save and connect** をクリックします。接続テストで `Connection successful` と表示され、接続が **Explorer** に表示されます。

![接続の設定](/images/next/connection-integration/data-integration/dbine/dbine-connection-form.png)

### 4. 参照してクエリを実行する {#4-browse-and-query}

**Explorer** で接続を展開すると、Doris のデータベースが表示されます。データベースを展開すると、テーブル、ビュー、カラムが表示されます。データベースを右クリックして **New query** を選択すると SQL エディターが開きます。続いて **Run** をクリックします。例を示します。

```sql
SELECT @@version_comment AS doris_version;
```

```text
+--------------------------------------------+
| doris_version                              |
+--------------------------------------------+
| doris version doris-4.1.3-rc02-7126cf65d96 |
+--------------------------------------------+
```

![Doris の参照とクエリの実行](/images/next/connection-integration/data-integration/dbine/dbine-editor.png)

## 既知の制限事項 {#known-limitations}

以下の結果は、Doris 4.1.3（`apache/doris:all-in-one-4.1.3`）で確認したものです。

| 対象 | 状態 | 詳細 |
| --- | --- | --- |
| 参照とクエリ | 正常 | データベース、テーブル、ビュー、カラムが一覧表示され、internal catalog へのクエリはユーザー自身の権限で実行されます。あるデータベースに `SELECT_PRIV` を付与されたユーザーには、そのデータベースが `information_schema` および `mysql` とともに表示されます。 |
| EXPLAIN | 正常 | `EXPLAIN` は Doris 独自の Nereids プランをテキストで返します。 |
| サーバーバージョン | MySQL バージョン | 接続テストとステータスバーには `5.7.99` が表示されます。これは Doris が `version()` を通じて報告する MySQL バージョンです。Doris のビルドを確認するには、`SELECT @@version_comment` を実行してください。 |

DBine の使い方について詳しくは、[DBine リポジトリ](https://github.com/addlayer-io/dbine)を参照してください。
