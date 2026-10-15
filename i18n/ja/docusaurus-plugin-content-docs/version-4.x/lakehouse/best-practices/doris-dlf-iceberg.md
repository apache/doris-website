---
{
    "title": "Alibaba Cloud DLF REST Catalog との連携",
    "language": "ja",
    "description": "この記事では、Apache Doris と Alibaba Cloud DLF（Data Lake Formation）REST Catalog を連携し、Iceberg テーブルのデータにシームレスにアクセスして分析する方法を説明します。Catalog の作成、データのクエリ、増分読み取りの手順を含みます。"
}
---

Alibaba Cloud の [Data Lake Formation（DLF）](https://cn.aliyun.com/product/bigdata/dlf) は、クラウドネイティブなデータレイクアーキテクチャの中核コンポーネントとして、クラウドネイティブなデータレイクソリューションを迅速に構築するのに役立ちます。DLF はデータレイク上のメタデータの一元管理、企業レベルの権限管理、複数の計算エンジンとのシームレスな連携を提供し、データサイロを解消してビジネスに役立つ知見を得られるようにします。

- メタデータとストレージの一元管理

    ビッグデータ計算エンジンが同じデータレイクのメタデータとストレージを共有し、データレイク関連製品間でデータをシームレスにやり取りできます。

- 権限の一元管理

    ビッグデータ計算エンジンが同じデータレイクテーブルの権限設定を共有するため、一度設定すれば全体に適用されます。

- ストレージの最適化

    小さなファイルの統合、期限切れのスナップショットの削除、パーティションの再編成、不要になったファイルの削除などの最適化手法により、ストレージ効率を向上させます。

- 幅広いクラウドエコシステムのサポート

    ストリーミングおよびバッチ処理エンジンを含む Alibaba Cloud 製品と緊密に連携し、すぐに使える機能と優れたユーザー体験を提供します。

Doris はバージョン 4.1.0 以降、DLF Iceberg REST Catalog との連携をサポートしており、DLF にシームレスに接続して Iceberg テーブルのデータにアクセスし、分析できます。この記事では、Apache Doris を DLF に接続し、Iceberg テーブルのデータにアクセスする方法を示します。

:::tip
この機能は Doris バージョン 4.1.0 以降でサポートされています。
:::

## 利用ガイド

### 01 DLF サービスの有効化

DLF の公式ドキュメントを参照して DLF サービスを有効化し、対応する Catalog、Database、Table を作成してください。

### 02 EMR Spark SQL を使用した DLF へのアクセス

- 接続

    ```shell
    spark-sql --master yarn \
        --conf spark.sql.extensions=org.apache.iceberg.spark.extensions.IcebergSparkSessionExtensions \
        --conf spark.sql.catalog.iceberg=org.apache.iceberg.spark.SparkCatalog \
        --conf spark.sql.catalog.iceberg.catalog-impl=org.apache.iceberg.rest.RESTCatalog \
        --conf spark.sql.catalog.iceberg.uri=http://<region>-vpc.dlf.aliyuncs.com/iceberg \
        --conf spark.sql.catalog.iceberg.warehouse=<your-catalog-name> \
        --conf spark.sql.catalog.iceberg.credential=<ak>:<sk>
    ```

    > 該当する `<region>`、`warehouse`、`<ak>`、`<sk>` を置き換えてください。

- データの書き込み

    ```sql
    USE iceberg.<your-catalog-name>;

    CREATE TABLE users_samples
    (
        user_id INT,             
        age_level STRING,           
        final_gender_code STRING,    
        clk BOOLEAN
    ) USING iceberg;

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

### 03 Doris を使用した DLF への接続

- Iceberg Catalog の作成

    ```sql
    CREATE CATALOG ice PROPERTIES (
        'type' = 'iceberg',
        'iceberg.catalog.type' = 'rest',
        'iceberg.rest.uri' = 'http://<region>-vpc.dlf.aliyuncs.com/iceberg',
        'warehouse' = '<your-catalog-name>',
        'iceberg.rest.sigv4-enabled' = 'true',
        'iceberg.rest.signing-name' = 'DlfNext',
        'iceberg.rest.access-key-id' = '<ak>',
        'iceberg.rest.secret-access-key' = '<sk>',
        'iceberg.rest.signing-region' = '<region>',
        'iceberg.rest.vended-credentials-enabled' = 'true',
        'io-impl' = 'org.apache.iceberg.rest.DlfFileIO',
        'fs.oss.support' = 'true'
    );
    ```

    - Doris は DLF から返される一時的な認証情報を使用して OSS オブジェクトストレージにアクセスするため、OSS の認証情報を追加で設定する必要はありません。
    - DLF には同じ VPC 内からのみアクセスできます。正しい URI アドレスを指定してください。
    - DLF Iceberg REST Catalog では SigV4 署名を有効にし、DLF 固有の署名名 `DlfNext` を指定する必要があります。

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
