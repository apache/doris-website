---
{
  "title": "Alibaba Cloud DLF Rest Catalogの統合",
  "language": "ja",
  "description": "この記事では、Apache DorisとAlibaba Cloud DLF（Data Lake Formation）Rest Catalogを統合して、Paimonテーブルデータへのシームレスなアクセスと分析を行う方法を説明します。Catalogの作成、データのクエリ、および増分読み取りのガイドが含まれています。"
}
---
Alibaba Cloud [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf)は、クラウドネイティブデータレイクアーキテクチャのコアコンポーネントとして、ユーザーがクラウドネイティブデータレイクソリューションを迅速に構築できるよう支援します。DLFは、データレイク上での統一メタデータ管理、エンタープライズレベルの権限制御、複数の計算エンジンとのシームレスな統合を提供し、データサイロを打破してビジネスインサイトを可能にします。

- 統一メタデータとストレージ

    ビッグデータ計算エンジンは単一のレイクメタデータとストレージセットを共有し、レイク製品間でデータがシームレスに流れます。

- 統一権限管理

    ビッグデータ計算エンジンは単一のレイクテーブル権限設定セットを共有し、一度の設定で全体に効果をもたらします。

- ストレージ最適化

    小ファイル圧縮、期限切れスナップショットクリーンアップ、パーティション再編成、不要ファイルクリーンアップなどの最適化戦略を提供し、ストレージ効率を向上させます。

- 包括的なクラウドエコシステムサポート

    Alibaba Cloud製品との深い統合により、ストリーミングおよびバッチ計算エンジンを含め、すぐに使える機能と向上したユーザーエクスペリエンスを提供します。

DLFはバージョン2.5からPaimon Rest Catalogをサポートしています。Dorisはバージョン3.0.3/3.1.0からDLF 2.5+ Paimon Rest Catalogとの統合をサポートし、DLFへのシームレスな接続を可能にしてPaimonテーブルデータにアクセスし分析できます。この記事では、Apache DorisをDLF 2.5+と接続し、Paimonテーブルデータにアクセスする方法を説明します。

:::tip
この機能はDorisバージョン3.0.3/3.1.0からサポートされています。
:::

## 使用ガイド

### 01 DLFサービスの有効化

DLF公式ドキュメントを参照してDLFサービスを有効化し、対応するCatalog、Database、Tableを作成してください。

### 02 EMR Spark SQLを使用したDLFへのアクセス

- 接続

    ```sql
    spark-sql --master yarn \
        --conf spark.driver.memory=5g \
        --conf spark.sql.defaultCatalog=paimon \
        --conf spark.sql.catalog.paimon=org.apache.paimon.spark.SparkCatalog \
        --conf spark.sql.catalog.paimon.metastore=rest \
        --conf spark.sql.extensions=org.apache.paimon.spark.extensions.PaimonSparkSessionExtensions \
        --conf spark.sql.catalog.paimon.uri=http://<region>-vpc.dlf.aliyuncs.com \
        --conf spark.sql.catalog.paimon.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.paimon.token.provider=dlf \
        --conf spark.sql.catalog.paimon.dlf.token-loader=ecs
    ```
> 対応する`warehouse`と`uri`アドレスを置き換えてください。

- データの書き込み

    ```sql
    USE <your-catalog-name>;

    CREATE TABLE users_samples
    (
        user_id INT,             
        age_level STRING,           
        final_gender_code STRING,    
        clk BOOLEAN
    );

    INSERT INTO users_samples VALUES
    (1, '25-34', 'M', true),
    (2, '18-24', 'F', false);

    INSERT INTO users_samples VALUES
    (3, '25-34', 'M', true),
    (4, '18-24', 'F', false);

    INSERT INTO users_samples VALUES
    (5, '25-34', 'M', true),
    (6, '18-24', 'F', false);
    ```
以下のエラーが発生した場合は、`/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3`から`paimon-jindo-x.y.z.jar`を削除してから、Sparkサービスを再起動して再試行してください。

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```
### 03 Dorisを使用したDLFへの接続

- Paimon Catalogの作成

    ```sql
    CREATE CATALOG paimon_dlf_test PROPERTIES (
        'type' = 'paimon',
        'paimon.catalog.type' = 'rest',
        'uri' = 'http://<region>-vpc.dlf.aliyuncs.com',
        'warehouse' = '<your-catalog-name>',
        'paimon.rest.token.provider' = 'dlf',
        'paimon.rest.dlf.access-key-id' = '<ak>',
        'paimon.rest.dlf.access-key-secret' = '<sk>'
    );
    ```
- Dorisは、OSSオブジェクトストレージにアクセスするためにDLFから返される一時的な認証情報を使用するため、追加のOSS認証情報は必要ありません。
    - DLFは同一VPC内からのみアクセス可能です。正しいURIアドレスを提供することを確認してください。

- データのクエリ

    ```sql
    SELECT * FROM users_samples ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       1 | 25-34     | M                 |    1 |
    |       2 | 18-24     | F                 |    0 |
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    |       5 | 25-34     | M                 |    1 |
    |       6 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
- システムテーブルのクエリ

    ```sql
    SELECT snapshot_id, commit_time, total_record_count FROM users_samples$snapshots;
    +-------------+-------------------------+--------------------+
    | snapshot_id | commit_time             | total_record_count |
    +-------------+-------------------------+--------------------+
    |           1 | 2025-08-09 05:56:02.906 |                  2 |
    |           2 | 2025-08-13 03:41:32.732 |                  4 |
    |           3 | 2025-08-13 03:41:35.218 |                  6 |
    +-------------+-------------------------+--------------------+
    ```
- インクリメンタルリーディング

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
