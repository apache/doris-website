---
{
    "title": "CloudCanal",
    "language": "ja",
    "description": "CloudCanal は、独自開発されたビジュアル操作型の自動データ移行・同期ツールです。一般的なリレーショナルデータベース、リアルタイムデータウェアハウス、メッセージミドルウェア、キャッシュデータベース、検索エンジンなど、30 種類以上のシステム間でデータを連携できます。高いリアルタイム性、正確な連携、安定性と拡張性、ワンストップの運用、ハイブリッドデプロイ、複雑なデータ変換に対応しています。"
}
---

CloudCanal は、独自開発されたビジュアル操作型の自動データ移行・同期ツールです。一般的なリレーショナルデータベース、リアルタイムデータウェアハウス、メッセージミドルウェア、キャッシュデータベース、検索エンジンなど、30 種類以上のシステム間でデータを連携できます。高いリアルタイム性、正確な連携、安定性と拡張性、ワンストップの運用、ハイブリッドデプロイ、複雑なデータ変換に対応しています。

## 機能の説明
CloudCanal のビジュアルインターフェースを使用すると、スキーマ移行、データの全量移行、増分同期、検証と修正を簡単に実行できます。また、パラメータを設定することで、より細かくカスタマイズしたデータ同期も可能です。現在、以下のデータソースから Doris へのデータ連携に対応しています。

| 接続元データソース           | スキーマ移行 | 全量移行 | 増分同期 | 検証と修正 |
|------------------------------|--------------|----------|----------|------------|
| MySQL/MariaDB/AuroraMySQL    | 対応         | 対応     | 対応     | 対応       |
| Oracle                       | 対応         | 対応     | 対応     | 対応       |
| PostgreSQL/AuroraPostgreSQL | 対応         | 対応     | 対応     | 対応       |
| SQL Server                   | 対応         | 対応     | 対応     | 対応       |
| Kafka                        | 非対応       | 非対応   | 対応     | 非対応     |
| AutoMQ                       | 非対応       | 非対応   | 対応     | 非対応     |
| TiDB                         | 対応         | 対応     | 対応     | 対応       |
| Hana                         | 対応         | 対応     | 対応     | 対応       |
| PolarDB-X                    | 対応         | 対応     | 対応     | 対応       |

:::info
その他の機能やパラメータ設定については、[CloudCanal データ連携ドキュメント](https://www.clougence.com/cc-doc/dataMigrationAndSync/connection/mysql2?target=Doris)を参照してください。
:::


## ダウンロードとインストール
[新規インストール（Docker Linux/MacOS）](https://www.clougence.com/cc-doc/productOP/docker/install_linux_macos)を参照し、[CloudCanal 公式サイト](https://www.clougence.com/)からプライベートデプロイ版をダウンロードしてインストールしてください。

## 使用例
以下では、MySQL から Doris にデータを移行・同期する方法を例として説明します。

### データソースの追加
1. CloudCanal コンソールにログインし、**データソース管理** > **データソースの追加**をクリックします。
2. MySQL と Doris のデータソースをそれぞれ選択し、対応する情報を入力します。
   ![データソースの追加 -1](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-1.png)

3. **接続テスト**をクリックします。接続に成功したら、**データソースの追加**をクリックして、データソースの追加を完了します。
   ![データソースの追加 -2](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-2.png)

### タスクの作成
1. **同期タスク** > **タスクの作成**をクリックします。
2. 接続元と接続先のデータソースを選択し、それぞれで**接続テスト**をクリックします。
   ![タスクの作成 -1](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-3.png)

3. **データ同期**を選択し、**全量初期化**にチェックを入れます。
   ![タスクの作成 -2](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-4.png)

4. 同期するテーブルを選択します。
   ![タスクの作成 -3](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-5.png)

5. 同期するカラムを選択します。
   ![タスクの作成 -4](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-6.png)

6. タスクの作成を確定します。
7. タスクは自動的に実行されます。CloudCanal は、次のステップで構成されるタスクの処理を自動的に行います。
  - スキーマ移行：接続元のテーブルスキーマを接続先に移行します。接続先に同名のテーブルが既に存在する場合、そのテーブルは無視されます。
  - データの全量移行：既存のデータをすべて接続先に移行します。中断した箇所からの再開に対応しています。
  - 増分データ同期：増分データを接続先のデータベースにリアルタイムで継続的に同期します（遅延は秒単位）。
  ![タスクの作成 -5](/images/next/connection-integration/data-integration/cloudcanal/cc-doris-8.png)
