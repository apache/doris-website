---
{
    "title": "FineBI",
    "language": "ja",
    "description": "MySQL プロトコルを使用して FineBI を Apache Doris に接続し、データモデリング、テーブルのインポート、可視化分析までの設定手順を説明します。"
}
---

<!-- Knowledge type: Operation steps -->
<!-- Applicable scenarios: BI tool integration / Visualization analysis -->

FineBI は、データ処理、アドホック分析、多次元ダッシュボードなどの機能を備えたビジネスインテリジェンス製品です。多様なデータソースへの接続と、複数のビューを使ったテーブル分析の管理に対応しており、Apache Doris の内部データと外部データの両方を使用したモデリングと可視化を円滑に行えます。

このドキュメントでは、FineBI から Apache Doris のデータソースに接続し、接続設定からデータモデリングまでを行う手順を説明します。

## 適用シナリオ {#applicable-scenarios}

| シナリオ | 説明 |
| --- | --- |
| BI レポート分析 | Doris のビジネスデータを基にダッシュボードやレポートを作成する |
| アドホックな多次元分析 | FineBI の多次元分析機能を使用して Doris のデータを探索する |
| 内部データと外部データのモデリング | Doris の内部テーブルと外部テーブルを FineBI にまとめて取り込み、モデリングに使用する |

## 前提条件 {#prerequisites}

- FineBI 5.0 以降がインストールされていること。ダウンロード先: [https://www.finebi.com/](https://www.finebi.com/)
- Apache Doris クラスターがデプロイ済みで、次の接続情報が分かっていること:
    - FE ホストの IP アドレス
    - FE のクエリポート（デフォルトは `9030`）
    - アクセス権限を持つユーザー名とパスワード
    - 接続先のデータベース名

## 操作手順 {#procedure}

### ステップ 1: FineBI にログインする {#step-1-log-in-to-finebi}

1. FineBI のログインアカウントを作成し、そのアカウントでログインします。

    ![ログインページ](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-1.png)

2. FineBI の情報リポジトリとして内蔵データベースを選択します。外部データベースを使用する場合は、公式ドキュメントを参照してください: [https://help.fanruan.com/finebi/doc-view-437.html](https://help.fanruan.com/finebi/doc-view-437.html)

    :::info 注記
    FanRuan BI の情報リポジトリには、内蔵データベースを選択することを推奨します。ここで選択するデータベースの種類は、クエリ分析の対象となるデータベースではありません。モデルやダッシュボードなど、FineBI のメタデータを保存・管理するためのデータベースです。FineBI は、このデータベースに対して作成、読み取り、更新、削除の操作を行う必要があります。
    :::

    ![データベースの選択](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-2.png)

### ステップ 2: Doris のデータ接続を作成する {#step-2-create-a-doris-data-connection}

1. **Management System**（管理システム）に移動し、**Data Connection**（データ接続）の下にある **Database Connection**（データベース接続）を選択して、新しいデータベース接続を作成します。

    ![データ接続](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-3.png)

2. データベース接続の種類を選択する画面で **MySQL** を選択します。

    ![接続の種類の選択](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-4.png)

3. Doris データベースへの接続情報を入力します。各項目は次のとおりです。

    | パラメータ | 説明 |
    | --- | --- |
    | Username（ユーザー名） | Doris クラスターへのログインに使用するユーザー名。例: `admin` |
    | Password（パスワード） | Doris クラスターへのログインに使用するパスワード |
    | Host（ホスト） | Doris クラスターの FE ホストの IP アドレス |
    | Port（ポート） | Doris クラスターの FE クエリポート。例: `9030` |
    | Coding（文字エンコーディング） | Doris クラスターで使用する文字エンコーディング |
    | Name Database（データベース名） | Doris クラスター内の接続先データベース |

    ![接続情報](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-5.png)

4. **Test Connection**（接続テスト）をクリックします。接続情報が正しく入力されていれば、接続成功のメッセージが表示されます。

    ![接続テスト](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-6.png)

### ステップ 3: データモデルを作成する {#step-3-create-a-data-model}

1. **Public Data**（公開データ）で新しいデータセットを作成します。Doris のデータセットを追加する際は、**Database Table**（データベーステーブル）を選択します。

    ![新しいデータセット](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-7.png)

2. 作成したデータベース接続から、インポートするテーブルを選択します。

    ![テーブルの選択](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-8.png)

3. テーブルをインポートした後、インポートした各テーブルをリフレッシュする必要があります。リフレッシュ後、分析トピックでそのテーブルをデータ分析に使用できるようになります。

    ![テーブルのリフレッシュ](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-9.png)

4. インポートした公開データを分析トピックに追加すると、業務要件に応じてダッシュボードの分析と設定を行えます。

    ![データ分析](/images/next/connection-integration/data-integration/finebi/bi-finebi-en-10.png)

## よくある質問 {#faq}

**Q: 接続テストに失敗した場合は、どのように調査すればよいですか？**

次の項目を順番に確認してください。

- Doris の FE ノードの IP アドレスとクエリポート（デフォルトは `9030`）に、FineBI を実行しているホストから到達できること。
- ログインユーザーに接続先データベースへのアクセス権限があること。
- 接続の種類が別のデータベースではなく、MySQL に設定されていること。

**Q: テーブルをインポートしても、分析トピックで分析できないのはなぜですか？**

**Public Data**（公開データ）で、インポートした各テーブルをリフレッシュする必要があります。リフレッシュが完了すると、そのテーブルを分析トピックで使用できます。
