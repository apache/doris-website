---
{
  "title": "Alibaba Cloud DLF Rest カタログの統合",
  "description": "この記事では、Apache DorisとAlibaba Cloud DLF (Data Lake Formation) Rest カタログを統合して、PaimonTableデータへのシームレスなアクセスと分析を行う方法について説明します。カタログの作成、データのクエリ、増分読み取りに関するガイドも含まれています。",
  "language": "ja"
}
---
Alibaba Cloud [Data Lake Formation (DLF)](https://cn.aliyun.com/product/bigdata/dlf)は、クラウドネイティブデータレイクアーキテクチャのコア コンポーネントとして、ユーザーがクラウドネイティブデータレイクソリューションを迅速に構築することを支援します。DLFは、データレイク上での統一されたメタデータ管理、エンタープライズレベルの権限制御、複数の計算エンジンとのシームレスな統合を提供し、データサイロを解消してビジネスインサイトを可能にします。

- 統一されたメタデータとストレージ

    ビッグデータ計算エンジンは、単一セットのレイクメタデータとストレージを共有し、レイク製品間でデータがシームレスに流れます。

- 統一された権限管理

    ビッグデータ計算エンジンは、単一セットのレイクtable権限設定を共有し、一度の設定で全体に効果をもたらします。

- ストレージ最適化

    小さなファイルの統合、期限切れスナップショットのクリーンアップ、パーティション再編成、不要ファイルのクリーンアップなどの最適化戦略を提供し、ストレージ効率を向上させます。

- 包括的なクラウドエコシステムサポート

    ストリーミングやバッチ計算エンジンを含むAlibaba Cloud製品との深い統合により、すぐに使える機能と強化されたユーザー体験を提供します。

DLFは、バージョン2.5からPaimon Rest カタログをサポートしています。Dorisは、バージョン3.0.3/3.1.0からDLF 2.5+ Paimon Rest カタログとの統合をサポートし、DLFへのシームレスな接続を可能にしてPaimonTableデータにアクセスし分析できます。この記事では、Apache DorisをDLF 2.5+と接続し、PaimonTableデータにアクセスする方法を説明します。

:::tip
この機能は、Dorisバージョン3.0.3/3.1.0から対応しています。
:::

## 使用ガイド

### 01 DLFサービスの有効化

DLFサービスを有効にし、対応するカタログ、Database、tableを作成するには、DLFの公式ドキュメントを参照してください。

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
### 03 Dorisを使用してDLFに接続する

- Paimon カタログを作成する

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
- DorisはDLFから返される一時的な認証情報を使用してOSSオブジェクトストレージにアクセスするため、追加のOSS認証情報は不要です。
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
- Query システム Tables

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
- 段階的読み取り

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
