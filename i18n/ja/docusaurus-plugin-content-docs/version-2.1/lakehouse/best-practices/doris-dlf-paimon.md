---
{
  "title": "Aliyun DLF Rest Catalogとの統合",
  "language": "ja",
  "description": "Aliyun Data Lake Formation（DLF）は、クラウドネイティブデータレークアーキテクチャのコアコンポーネントとして機能します。"
}
---
Aliyun [Data Lake Formation (DLF)](https://www.alibabacloud.com/en/product/datalake-formation) は、クラウドネイティブデータレイクアーキテクチャのコアコンポーネントとして機能し、ユーザーがクラウドネイティブデータレイクアーキテクチャを迅速に構築することを支援します。Data Lake Formation は、レイク上での統一メタデータ管理、エンタープライズレベルの権限制御を提供し、複数のコンピューティングエンジンとシームレスに統合してデータサイロを打破し、ビジネス価値を発掘します。

- 統一メタデータとストレージ

    コンピューティングエンジンは統一されたレイクメタデータとストレージのセットを共有し、レイクエコシステム製品間でのデータフローを可能にします。

- 統一権限管理

    コンピューティングエンジンは統一されたレイクテーブル権限設定のセットを共有し、一度の設定で複数の場所での効果を実現します。

- ストレージ最適化

    小ファイルマージ、期限切れスナップショットクリーンアップ、パーティション整理、廃止ファイルクリーンアップなどの最適化戦略を提供し、ストレージ効率を向上させます。

- 包括的なクラウドエコシステムサポート

    ストリーミングおよびバッチコンピューティングエンジンを含むAlibaba Cloud製品との深い統合により、すぐに使える機能を実現し、ユーザーエクスペリエンスと運用の利便性を向上させます。

DLF バージョン 2.5 から、Paimon Rest Catalog がサポートされています。Doris は、バージョン 3.1.0 から、DLF 2.5+ Paimon Rest Catalog との統合をサポートし、DLF へのシームレス接続を可能にして Paimon テーブルデータにアクセスし分析できます。このドキュメントでは、Apache Doris を使用して DLF 2.5+ に接続し、Paimon テーブルデータにアクセスする方法を説明します。

:::tip
この機能は Doris 3.1 からサポートされています
:::

## 使用ガイド

### 01 DLF サービスを有効にする

DLF 公式ドキュメントを参照して DLF サービスを有効にし、対応する Catalog、Database、Table を作成してください。

### 02 EMR Spark SQL を使用した DLF へのアクセス

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
以下のエラーが発生した場合は、`/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3`から`paimon-jindo-x.y.z.jar`を削除し、Sparkサービスを再起動してから再試行してください。

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```
### 03 DorisをDLFに接続

- Paimon Catalogを作成

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
- DorisはDLFから返される一時認証情報を使用してOSSオブジェクトストレージにアクセスするため、追加のOSS認証情報は不要です。
    - 同一VPC内でのDLFアクセスのみをサポートしているため、正しいuriアドレスを提供してください。

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
- バッチ増分読み取り

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
