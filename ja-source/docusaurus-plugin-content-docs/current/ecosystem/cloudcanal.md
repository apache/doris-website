---
{
  "title": "BladePipe",
  "language": "ja",
  "description": "BladePipeは、30以上のデータベース、メッセージキュー、検索エンジン、キャッシュ間でデータを移動するリアルタイムエンドツーエンドデータレプリケーションツールです。"
}
---
BladePipeは**リアルタイムエンドツーエンドデータレプリケーション**ツールで、**30以上**のデータベース、メッセージキュー、検索エンジン、キャッシング、リアルタイムデータウェアハウス、データレイクなど間でデータを移動し、**3秒未満の超低レイテンシ**を実現します。効率性、安定性、拡張性、多様なデータベースエンジンとの互換性、ワンストップ管理、強化されたセキュリティ、複雑なデータ変換を特徴としています。

## 機能
BladePipeは視覚的な管理インターフェースを提供し、DataJobsを簡単に作成して**スキーマ移行、データ移行、同期、検証と修正**などを実現できます。さらに、パラメータ設定により、より細かくカスタマイズされた設定をサポートしています。現在BladePipeは、以下のソースDataSourcesからDorisへのデータ移動をサポートしています：

| Source DataSource            | Schema Migration | Data Migration | Data Sync | Verification & Correction |
|------------------------------|------------------|----------------|-----------|---------------------------|
| MySQL/MariaDB/AuroraMySQL    | Yes              | Yes            | Yes       | Yes                       |
| Oracle                       | Yes              | Yes            | Yes       | Yes                       |
| PostgreSQL/AuroraPostgreSQL | Yes              | Yes            | Yes       | Yes                       |
| SQL サーバー                   | Yes              | Yes            | Yes       | Yes                       |
| Kafka                        | No               | No             | Yes       | No                        |
| AutoMQ                       | No               | No             | Yes       | No                        |
| TiDB                         | Yes              | Yes            | Yes       | Yes                       |
| Hana                         | Yes              | Yes            | Yes       | Yes                       |
| PolarDB-X                    | Yes              | Yes            | Yes       | Yes                       |

:::info
より多くの機能とパラメータ設定については、[BladePipe Connections](https://doc.bladepipe.com/dataMigrationAndSync/connection/mysql2?target=Doris)を参照してください。
:::

## インストール
[Install Worker (Docker)](https://doc.bladepipe.com/productOP/docker/install_worker_docker)または[Install Worker (Binary)](https://doc.bladepipe.com/productOP/binary/install_worker_binary)の手順に従って、BladePipe Workerをダウンロードしてインストールしてください。

## 例
MySQLインスタンスを例として、以下の部分ではMySQLからDorisへデータを移動する方法について説明します。

### DataSourcesの追加
1. [BladePipe Cloud](https://cloud.bladepipe.com/)にログインします。**DataSource** > **Add DataSource**をクリックします。
2. タイプとしてそれぞれMySQLとDorisを選択し、設定フォームに適切に入力します。
   ![Add DataSources-1](/images/bp-doris-1.png)

3. **Test Connection**をクリックします。接続が成功したら、**Add DataSource**をクリックしてDataSourceを追加します。
   ![Add DataSources-2](/images/bp-doris-2.png)


### DataJobの作成
1. DataJob > [Create DataJob](https://doc.bladepipe.com/operation/job_manage/create_job/create_full_incre_task)をクリックします。
2. ソースとターゲットのDataSourcesを選択し、**Test Connection**をクリックしてソースとターゲットのDataSourcesへの接続が両方とも成功することを確認します。
  ![Create a DataJob-1](/images/bp-doris-3.png)

1. DataJob タイプとして**Incremental**を選択し、**Full Data**オプションと合わせます。
  ![Create a DataJob-2](/images/bp-doris-4.png)

1. レプリケーション対象のテーブルを選択します。
  ![Create a DataJob-3](/images/bp-doris-5.png)

1. レプリケーション対象のカラムを選択します。
  ![Create a DataJob-4](/images/bp-doris-6.png)

1. DataJobの作成を確認します。
2. DataJobは自動的に実行されます。BladePipeは以下のDataTasksを自動的に実行します：
  - **Schema Migration**: ソーステーブルのスキーマがターゲットインスタンスに移行されます。
  - **Full Data**: ソーステーブルの既存データがすべてターゲットインスタンスに完全移行されます。
  - **Incremental**: 継続的なデータ変更がターゲットインスタンスに継続的に同期されます。
  ![Create a DataJob-5](/images/bp-doris-8.png)
