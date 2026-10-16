---
{
    "title": "Alibaba Cloud DLF Rest Catalog との連携",
    "language": "ja",
    "description": "Apache Doris を Alibaba Cloud DLF（Data Lake Formation）Rest Catalog と連携し、Paimon テーブルのデータにアクセスして分析する方法を説明します。Catalog の作成、データのクエリ、増分読み取りについても取り上げます。"
}
---

Alibaba Cloud の [Data Lake Formation（DLF）](https://cn.aliyun.com/product/bigdata/dlf) は、クラウドネイティブなデータレイクアーキテクチャの中核となるコンポーネントで、クラウドネイティブなデータレイクソリューションを迅速に構築するのに役立ちます。DLF は、データレイク上のメタデータの一元管理、企業向けの権限制御、複数のコンピュートエンジンとのシームレスな連携を提供し、データサイロを解消してビジネス上の知見を得られるようにします。

- メタデータとストレージの一元化

    ビッグデータ処理エンジン間でデータレイクのメタデータとストレージを共有し、データレイク関連製品間でデータをシームレスにやり取りできます。

- 権限管理の一元化

    ビッグデータ処理エンジン間でデータレイクのテーブル権限設定を共有できるため、一度の設定で全体に適用できます。

- ストレージの最適化

    小さなファイルのコンパクション、期限切れスナップショットのクリーンアップ、パーティションの再編成、不要ファイルのクリーンアップなどの最適化手法により、ストレージ効率を向上させます。

- 幅広いクラウドエコシステムへの対応

    ストリーミングおよびバッチ処理エンジンを含む Alibaba Cloud 製品と深く連携し、すぐに使える機能と優れたユーザー体験を提供します。

DLF はバージョン 2.5 以降で Paimon Rest Catalog をサポートしています。Doris はバージョン 3.0.3/3.1.0 以降で DLF 2.5+ の Paimon Rest Catalog との連携をサポートし、DLF に接続して Paimon テーブルのデータにアクセスし、分析できます。この記事では、Apache Doris を DLF 2.5+ に接続し、Paimon テーブルのデータにアクセスする方法を示します。

:::tip
この機能は Doris バージョン 3.0.3/3.1.0 以降でサポートされています。
:::

## 利用ガイド

### 01 DLF サービスを有効化する

DLF の公式ドキュメントを参照して DLF サービスを有効化し、対応する Catalog、Database、Table を作成してください。

### 02 EMR Spark SQL を使用して DLF にアクセスする

- 接続する

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

    > `warehouse` と `uri` の値を、使用する環境に合わせて置き換えてください。

- データを書き込む

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

    次のエラーが発生した場合は、`paimon-jindo-x.y.z.jar` を `/opt/apps/PAIMON/paimon-dlf-2.5/lib/spark3` から削除し、Spark サービスを再起動してから、もう一度試してください。

    ```
    Ambiguous FileIO classes are:
    org.apache.paimon.jindo.JindoLoader
    org.apache.paimon.oss.OSSLoader
    ```

### 03 Doris を使用して DLF に接続する

- Paimon Catalog を作成する

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

    - Doris は DLF から返される一時的な認証情報を使用して OSS オブジェクトストレージにアクセスするため、OSS の認証情報を追加で設定する必要はありません。
    - DLF には同じ VPC 内からのみアクセスできます。正しい URI アドレスを指定してください。

- データをクエリする

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

- システムテーブルをクエリする

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

- 増分読み取りを行う

    ```sql
    SELECT * FROM users_samples@incr('startSnapshotId'=1, 'endSnapshotId'=2) ORDER BY user_id;
    +---------+-----------+-------------------+------+
    | user_id | age_level | final_gender_code | clk  |
    +---------+-----------+-------------------+------+
    |       3 | 25-34     | M                 |    1 |
    |       4 | 18-24     | F                 |    0 |
    +---------+-----------+-------------------+------+
    ```
