---
{
  "title": "Spark負荷",
  "language": "ja",
  "description": "Spark Loadは外部のSparkリソースを使用してインポートされたデータを前処理します"
}
---
# Spark Load

Spark Loadは外部のSparkリソースを使用してインポートデータを前処理し、Dorisの大容量データインポート性能を向上させ、Dorisクラスターの計算リソースを節約します。主にDorisへの初期移行と大容量データインポートのシナリオで使用されます。

Spark LoadはSparkクラスターのリソースを使用してインポート対象データをソートします。Doris BEが直接ファイルを書き込むため、Dorisクラスターのリソース使用量を大幅に削減できます。履歴の大量データ移行において、Dorisクラスターのリソース使用量と負荷を軽減する効果があります。

ユーザーはSpark Loadクライアントを通じてインポートタスクを作成・実行する必要があります。タスクの実行状態はコンソールに出力され、インポート結果もSHOW LOADで確認できます。

:::caution CAUTION

この機能は実験的であり、現在masterブランチでのみ利用可能です。
現在のバージョンはストレージコンピューティング結合クラスターのみをサポートしています。
使用中に問題が発生した場合は、メーリンググループ、[GitHub Issue](https://github.com/apache/doris/issues)などでフィードバックをお願いします。

:::

## 適用シナリオ

- ソースデータがHDFSなど、Sparkからアクセス可能なストレージシステムにある場合。

- データ量が数十GBからTBレベルの場合。

:::caution CAUTION
unique keyモデルの場合、現在はmerge-on-readモードのテーブルのみサポートされています。
:::

## 基本原理

### 基本プロセス

Spark Loadタスクの実行は主に以下の5段階に分かれています：

1. ユーザーが設定ファイルを作成し、読み取り対象のソースファイル/テーブル、ターゲットテーブルなどの情報を設定

2. Spark LoadクライアントがFEにインポートジョブを作成してトランザクションを開始し、FEがクライアントにターゲットテーブルメタデータを返却

3. Spark LoadクライアントがSparkクラスターにETLタスクを送信して実行

4. SparkクラスターがETLを実行してインポートデータの前処理を完了。これにはグローバル辞書構築（Bitmap型）、パーティショニング、ソート、集約などが含まれる

5. ETLタスク完了後、Spark Loadクライアントが各シャードの前処理済みデータパスをFEに同期し、関連するBEにPushタスクの実行をスケジュール

6. BEがデータを読み取り、Doris基盤ストレージ形式に変換

7. FEが有効バージョンをスケジュールしてインポートタスクを完了

### グローバル辞書

#### 適用シナリオ

現在、DorisのBitmap列はクラスライブラリRoaringbitmapを使用して実装されており、Roaringbitmapの入力データ型は整数のみです。そのため、インポートプロセスでBitmap列の事前計算を実装するには、入力データ型を整数に変換する必要があります。

Dorisの既存のインポートプロセスでは、グローバル辞書のデータ構造はHiveテーブルをベースとしており、元の値からエンコード値へのマッピングを保存します。

#### 構築プロセス

1. 上流データソースからデータを読み取り、Hive一時テーブルを生成（hive_tableとして記録）

2. hive_tableから重複除去対象フィールドの重複除去値を抽出し、新しいHiveテーブルを生成（distinct_value_tableとして記録）

3. 新しいグローバル辞書テーブルを作成（dict_tableとして記録）。元の値用の列とエンコード値用の列を持つ

4. distinct_value_tableとdict_tableをLeft Joinして新たに追加された重複除去値セットを計算し、ウィンドウ関数を使用してこのセットをエンコード。この時点で重複除去列の元の値にエンコード値の追加列があり、最終的にこれら2列のデータをdict_tableに書き戻し

5. dict_tableとhive_tableをJoinして、hive_table内の元の値を整数エンコード値で置換する作業を完了

6. hive_tableは次のデータ前処理ステップで読み取られ、計算後Dorisにインポート
   データ前処理（DPP）
   基本プロセス

7. データソースからデータを読み取り。上流データソースはHDFSファイルまたはHiveテーブル

8. 読み取ったデータに対してフィールドマッピング、式計算を実行し、パーティション情報に基づいてバケットフィールドbucket_idを生成

9. DorisテーブルのRollupメタデータに基づいてRollupTreeを生成

10. RollupTreeを走査して階層集約操作を実行。次レベルのRollupは前レベルのRollupから計算可能

11. 各集約計算後、データはbucket_idに従ってバケット化されHDFSに書き込み

12. 後続のBrokerがHDFS内のファイルを取得してDoris Beにインポート

#### Hive Bitmap UDF

SparkはHiveで生成されたBitmapデータをDorisに直接インポートすることをサポートしています。詳細はhive-bitmap-udfドキュメントを参照してください。

### クイックスタート

- ファイルからのデータ読み取り

    - ターゲットテーブル構造

       ```sql
       CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
                                                         c_int int(11) NULL,
          c_char char(15) NULL,
          c_varchar varchar(100) NULL,
          c_bool boolean NULL,
          c_tinyint tinyint(4) NULL,
          c_smallint smallint(6) NULL,
          c_bigint bigint(20) NULL,
          c_largeint largeint(40) NULL,
          c_float float NULL,
          c_double double NULL,
          c_decimal decimal(6, 3) NULL,
          c_decimalv3 decimal(6, 3) NULL,
          c_date date NULL,
          c_datev2 date NULL,
          c_datetime datetime NULL,
          c_datetimev2 datetime NULL
          )
       DISTRIBUTED BY HASH(c_int) BUCKETS 1
       PROPERTIES (
         "replication_num" = "1"
       )
       ``` 
- 設定ファイルを書く

        ```json 
          {
          "feAddresses": "127.0.0.1:8030",
          "label": "spark-load-test-file",
          "user": "root",
          "password": "",
          "database": "test",
          "workingDir": "hdfs://hadoop:8020/spark-load",
          "loadTasks": {
            "tbl_test_spark_load": {
              "type": "file",
              "paths": [
                "hdfs://hadoop:8020/data/data.txt"
              ],
              "format": "csv",
              "fieldSep": ",",
              "columns": "c_int,c_char,c_varchar,c_bool,c_tinyint,c_smallint,c_bigint,c_largeint,c_float,c_double,c_decimal,c_decimalv3,c_date,c_datev2,c_datetime,c_datetimev2"
            }
          },
          "spark": {
            "sparkHome": "/opt/spark",
            "master": "yarn",
            "deployMode": "cluster",
            "properties": {
              "spark.executor.memory": "2G",
              "spark.executor.cores": 1,
              "spark.num.executor": 4
            }
          },
          "hadoopProperties": {
            "fs.defaultFS": "hdfs://hadoop:8020",
            "hadoop.username": "hadoop"
          }
        } 
        ```
- Spark Load ジョブを開始

    ``` shell
        $ cd spark-load-dir
        $ sh./bin/spark-load.sh - c config.json
    ```
- ジョブ実行結果の表示

    ```sql
    mysql
    > show load;
    +-------+-----------------------+-----------+---------------+---------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
    | JobId | Label | State | Progress | タイプ | EtlInfo | TaskInfo | ErrorMsg | CreateTime | EtlStartTime | EtlFinishTime | LoadStartTime | LoadFinishTime | URL | JobDetails | TransactionId | ErrorTablets | User | コメント |--+---------------------+---------------------+--- ------------------+---------------------------------- -------------------------------------------------- -------------------------------------------------- ------+---------------+--------------+------+----- ----+ | 38104 | spark-load-test-hvie | FINISHED | 100.00% (0/0) | INGESTION | NULL | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL | 2024-08-16 14 :47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1 ]},"FileNumber":0,"FileSize":0} | 27024 | {} | root | |
    +-------+----------------- ------+----------+---------------+-----------+---- -----+-------------------------------------------- ---------+----------+---------------------+------- ------------+---------------------+------------- --------+---------------------+------------------- --+----------------------------------------------- -------------------------------------------------- ----------------------------------------+--------- ------+--------------+------+---------+
    ```
## リファレンスマニュアル

### Spark Load client

#### ディレクトリ構造

```text
├── app
│ └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│ └── spark-load.sh
└── lib
```
- **app**: spark dppのアプリケーションパッケージ
- **bin**: spark load起動スクリプト
- **lib**: その他の依存パッケージ

#### 起動スクリプトパラメータ

- `--config`|`-c`: 設定ファイルアドレスを指定
- `--recovery`|`-r`: リカバリモードで起動するかどうか

### ロードのキャンセル

Spark Loadジョブのステータスが`CANCELLED`または`FINISHED`でない場合、ユーザーが手動でキャンセルできます。

ユーザーはSpark Load起動スクリプトのプロセスを終了するか、Dorisで`CANCEL LOAD`コマンドを実行することでロードタスクをキャンセルできます。

CANCEL LOADでキャンセルする場合、キャンセルするインポートタスクのLabelを指定する必要があります。キャンセルインポートコマンドの構文を確認するには、`HELP CANCEL LOAD`を実行してください。

### 設定パラメータ

#### 一般設定

| 名前        | 必須 | デフォルト値| パラメータ説明                                             |
|-------------|----------|-----|-------------------------------------------------------------------|
| feAddresses | はい      | - | Doris FE HTTPアドレス、形式: fe_ip:http_port, [fe_ip:http_port] |
| label       | はい      | - | ロードジョブラベル                                                    |
| user        | はい      | - | Dorisユーザー名                                                    |
| Password    | はい      | - | Dorisパスワード                                                    |
| Database    | はい      | - | Dorisデータベース名                                               |
| WorkingDir  | はい      | - | Spark Loadワーキングパス                                           |


#### タスク設定

| 名前      | サブオプション-1     | サブオプション-2    | 必須 | デフォルト値        | 説明                                                                                   |
|-----------|-------------------|-------------------|----------|----------------------|-----------------------------------------------------------------------------------------------|
| loadTasks |                   |                   | はい      | -                    | インポートタスクジョブ                                                                               |
|           | ターゲットテーブル名 |                   | はい      | -                    | インポートするDorisテーブル名                                                                     |
|           |                   | type              | はい      | -                    | タスクタイプ: file - ファイル読み取りタスク、hive - Hiveテーブル読み取りタスク                                 |
|           |                   | paths             | はい      | -                    | ファイルパス配列、ファイル読み取りタスク（type=file）でのみ有効                                    |
|           |                   | format            | はい      | -                    | ファイルタイプ、サポートされるタイプ: csv、parquet、orc、ファイル読み取りタスク（type=file）でのみ有効      |
|           |                   | fieldSep          | いいえ       | `\t`                 | カラム区切り文字、ファイル読み取りタスク（type=file）でファイルタイプがcsv（format=csv）の場合のみ有効 |
|           |                   | lineDelim         | いいえ       | `\n`                 | 行区切り文字、ファイル読み取りタスク（type=file）でファイルタイプがcsv（format=csv）の場合のみ有効    |
|           |                   | hiveMetastoreUris | はい      | -                    | Hiveメタデータサービスアドレス                                                                 |
|           |                   | hiveDatabase      | はい      | -                    | Hiveデータベース名                                                                            |
|           |                   | hiveTable         | はい      | -                    | Hiveデータテーブル名                                                                          |
|           |                   | columns           | いいえ       | ターゲットテーブルカラム | ソースデータカラム名、ファイル読み取りタスク（type=file）でのみ有効                       |
|           |                   | columnMappings    | いいえ       | -                    | カラムマッピング                                                                                |
|           |                   | where             | いいえ       | -                    | フィルター条件                                                                             |
|           |                   | targetPartitions  | いいえ       | -                    | ターゲットインポートパーティション                                                                       |

#### Sparkパラメータ設定

| 名前  | サブオプション | 必須 | デフォルト値 | 説明                                                 |
|-------|--------------|----------|---------------|-------------------------------------------------------------|
| spark |              | はい      | -             | インポートタスクジョブ                                             |
|       | sparkHome    | はい      | -             | Sparkデプロイメントパス                                       |
|       | master       | はい      | -             | Spark Master、サポートされるタイプ: yarn、standalone、local  |
|       | deployMode   | いいえ       | client        | Sparkデプロイメントモード、サポートされるタイプ: cluster、client |
|       | properties   | はい      | -             | Sparkジョブプロパティ                                        |

#### Hadoopパラメータ設定

| 名前   | 必須 | デフォルト値 | パラメータ説明                                               |
|--------|----------|---------------|---------------------------------------------------------------------|
| hadoop | はい      | -             | Hadoop設定、HDFS関連およびYarn設定を含む |

#### 環境パラメータ設定

| 名前  | 必須 | デフォルト値 | パラメータ説明 |
|-------|----------|---------------|-----------------------|
| env   | いいえ       | -             | 環境変数 |

## ロード例

### Bitmapタイプデータのロード

- グローバル辞書を構築してロード

  - Hiveテーブル

    ```hiveql
    CREATE TABLE IF NOT EXISTS hive_t1
    (
       k1INT,
       K2   SMALLINT,
       k3   VARCHAR(50),
       uuid VARCHAR(100)
    ) STORED AS TEXTFILE 
    ``` 
- Dorisテーブル

    ```sql 
    CREATE TABLE IF NOT EXISTS doris_t1 ( 
        k1 INT, 
        K2 SMALLINT, 
        k3 VARCHAR(50), 
        uuid BITMAP 
    ) ENGINE=OLAP 
    DUPLICATE KEY (k1) 
    DISTRIBUTED BY HASH(k1) BUCKETS 1 
    PROPERTIES ( "replication_num" = "1" ) 
    ``` 
- 設定ファイル

    ```json 
      {
      "feAddresses": "127.0.0.1:8030",
      "label": "spark-load-test-bitmap-dict",
      "user": "root",
      "password": "",
      "database": "test",
      "workingDir": "hdfs://hadoop:8020/spark-load",
      "loadTasks": {
        "doris_t1": {
          "type": "hive",
          "hiveMetastoreUris": "thrift://hadoop:9083",
          "hiveDatabase": "test",
          "hiveTable": "hive_t1",
          "columnMappings": [
            "uuid=bitmap_dict(uuid)"
          ]
        }
      },
      "spark": {
        "sparkHome": "/opt/spark",
        "master": "yarn",
        "deployMode": "cluster",
        "properties": {
          "spark.executor.cores": "1",
          "spark.executor.memory": "2GB",
          "spark.executor.instances": "1"
        }
      },
      "hadoopProperties": {
        "fs.defaultFS": "hdfs://hadoop:8020",
        "hadoop.username": "hadoop"
      }
    }
    ``` 
- Bitmap UDFで処理後にHiveバイナリデータを読み込む

  - Hiveテーブル

    ```hiveql 
    CREATE TABLE IF NOT EXISTS hive_t1 (
    k1 INT, 
    K2 SMALLINT, 
    k3 VARCHAR(50), 
    uuid VARCHAR(100) 
    ) STORED AS TEXTFILE 
    ```
- Dorisテーブル

    ```sql 
    CREATE TABLE IF NOT EXISTS doris_t1
    (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
    ) ENGINE=OLAP DUPLICATE KEY(k1)
    DISTRIBUTED BY HASH(k1) BUCKETS 1
    PROPERTIES
    (
        "replication_num" = "1"
    ) 
    ``` 
- 設定ファイル

    ```json 
    {
      "feAddresses": "127.0.0.1:8030",
      "label": "spark-load-test-bitmap-binary",
      "user": "root",
      "password": "",
      "database": "test",
      "workingDir": "hdfs: //hadoop:8020/spark-load",
      "loadTasks": {
        "doris_tb1": {
          "type": "hive",
          "hiveMetastoreUris": "thrift://hadoop:9083",
          "hiveDatabase": "test",
          "hiveTable": "hive_t1",
          "columnMappings": [
            "uuid=binary_bitmap(uuid)"
          ]
        }
      },
      "spark": {
        "sparkHome": "/opt/spark",
        "master": "yarn",
        "deployMode": "cluster",
        "properties": {
          "spark.executor.cores": "1",
          "spark.executor.memory": "2GB ",
          "spark.executor.instances": "1"
        }
      },
      "hadoopProperties": {
        "fs.defaultFS": "hdfs://hadoop:8020",
        "hadoop.username": "hadoop"
      }
    }
    ```
