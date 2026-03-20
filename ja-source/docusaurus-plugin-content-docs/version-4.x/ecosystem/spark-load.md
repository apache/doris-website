---
{
  "title": "Spark負荷",
  "language": "ja",
  "description": "Spark Loadは外部のSparkリソースを使用して、インポートされたデータを前処理します。"
}
---
# Spark Load

Spark Loadは外部のSparkリソースを使用してインポートされたデータを前処理し、Dorisの大容量データのインポート性能を向上させ、Dorisクラスターのコンピュートリソースを節約します。主にDorisへの初期移行と大容量データのインポートシナリオで使用されます。

Spark LoadはSparkクラスターのリソースを使用してインポート対象のデータをソートします。Doris BEが直接ファイルを書き込むため、Dorisクラスターのリソース使用量を大幅に削減できます。履歴の大容量データ移行においてDorisクラスターのリソース使用量と負荷を削減する点で良好な効果があります。

ユーザーはSpark Loadクライアントを通じてインポートタスクを作成し実行する必要があります。タスクの実行状態はコンソールに出力され、インポート結果はSHOW LOADでも確認できます。

:::caution CAUTION

この機能は実験的機能であり、現在はmasterブランチでのみ利用可能です。
現在のバージョンではストレージとコンピュートが結合されたクラスターのみサポートしています。
使用中に何らかの問題が発生した場合は、メーリンググループ、[GitHub Issue](https://github.com/apache/doris/issues)などを通じてフィードバックをお願いします。

:::

## 適用シナリオ

- ソースデータがHDFSなど、Sparkからアクセス可能なストレージシステムにある場合。

- データ量が数十GBからTBレベルの場合。

:::caution CAUTION
unique keyモデルの場合、現在はmerge-on-readモードのテーブルのみサポートされています。
:::

## 基本原理

### 基本プロセス

Spark Loadタスクの実行は主に以下の5段階に分かれます：

1. ユーザーが設定ファイルを作成し、読み取り対象のソースファイル/テーブル、ターゲットテーブルおよびその他の情報を設定する

2. Spark LoadクライアントがFEにインポートジョブを作成してトランザクションを開始し、FEがクライアントにターゲットテーブルのメタデータを返す

3. Spark LoadクライアントがETLタスクをSparkクラスターに送信して実行する。

4. SparkクラスターがETLを実行してインポートデータの前処理を完了する（グローバル辞書構築（Bitmap型）、パーティショニング、ソート、集約など）。

5. ETLタスク完了後、Spark Loadクライアントが各シャードの前処理済みデータパスをFEに同期し、関連するBEにPushタスクの実行をスケジュールする。

6. BEがデータを読み取ってDoris下位層のストレージ形式に変換する。

7. FEが有効バージョンをスケジュールしてインポートタスクを完了する。

### グローバル辞書

#### 適用シナリオ

現在、DorisのBitmap列はクラスライブラリRoaringbitmapを使用して実装されており、Roaringbitmapの入力データ型は整数のみ可能です。そのため、インポートプロセスでBitmap列の事前計算を実装したい場合は、入力データ型を整数に変換する必要があります。

Dorisの既存のインポートプロセスでは、グローバル辞書のデータ構造はHiveテーブルに基づいており、元の値からエンコードされた値へのマッピングを保存しています。

#### 構築プロセス

1. 上流データソースからデータを読み取り、Hive一時テーブルを生成し、hive_tableとして記録する。

2. hive_tableから重複除去対象フィールドの重複除去値を抽出し、新しいHiveテーブルを生成し、distinct_value_tableとして記録する。

3. 新しいグローバル辞書テーブルを作成し、dict_tableとして記録する。元の値用の列と、エンコードされた値用の列を持つ。
4. distinct_value_tableとdict_tableのLeft Joinを実行して新しく追加された重複除去値のセットを計算し、このセットにウィンドウ関数を使用してエンコードを行う。この時点で重複除去列の元の値にエンコード値の追加列があり、最終的にこれら2列のデータをdict_tableに書き戻す。
5. dict_tableとhive_tableをJoinして、hive_table内の元の値を整数エンコード値で置換する作業を完了する。
6. hive_tableは次のステップのデータ前処理で読み取られ、計算後にDorisにインポートされる。
   データ前処理（DPP）
   基本プロセス
7. データソースからデータを読み取る。上流データソースはHDFSファイルまたはHiveテーブルが可能。
8. 読み取ったデータに対してフィールドマッピング、式計算を実行し、パーティション情報に基づいてバケットフィールドbucket_idを生成する。
9. DorisテーブルのRollupメタデータに基づいてRollupTreeを生成する。
10. RollupTreeを走査して階層集約操作を実行する。次のレベルのRollupは前のレベルのRollupから計算できる。
11. 各集約計算後、データはbucket_idに従ってバケット化されHDFSに書き込まれる。
12. 後続のBrokerがHDFS内のファイルを取得してDoris Beにインポートする。

#### Hive Bitmap UDF

SparkはHiveで生成されたBitmapデータを直接Dorisにインポートすることをサポートしています。詳細はhive-bitmap-udfドキュメントを参照してください。

### クイックスタート


- ファイルからデータを読み取る

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

### Spark Load クライアント

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
- `--recovery`|`-r`: 復旧モードで起動するかどうか

### loadのキャンセル

Spark Loadジョブのステータスが`CANCELLED`または`FINISHED`でない場合、ユーザーが手動でキャンセルできます。

ユーザーはSpark Load起動スクリプトのプロセスを終了するか、DorisでCCANCEL
LOAD`コマンドを実行することでloadタスクをキャンセルできます。

CANCEL経由でLOADをキャンセルする場合、キャンセルするインポートタスクのLabelを指定する必要があります。キャンセルインポートコマンドの構文を確認するには、`HELP CANCEL LOAD`を実行してください。

### 設定パラメータ

#### 一般設定

| Name        | Required | Default value| Parameter description                                             |
|-------------|----------|-----|-------------------------------------------------------------------|
| feAddresses | yes      | - | Doris FE HTTPアドレス、形式: fe_ip:http_port, [fe_ip:http_port] |
| label       | yes      | - | Loadジョブラベル                                                    |
| user        | yes      | - | Dorisユーザー名                                                    |
| Password    | Yes      | - | Dorisパスワード                                                    |
| Database    | Yes      | - | Dorisデータベース名                                               |
| WorkingDir  | Yes      | - | Spark Load作業パス                                           |


#### タスク設定

| Name      | Suboption-1     | Suboption-2    | Required | Default value        | Description                                                                                   |
|-----------|-------------------|-------------------|----------|----------------------|-----------------------------------------------------------------------------------------------|
| loadTasks |                   |                   | Yes      | -                    | インポートタスクジョブ                                                                               |
|           | ターゲットテーブル名 |                   | Yes      | -                    | インポートするDorisテーブル名                                                                     |
|           |                   | type              | Yes      | -                    | タスクタイプ: file - ファイル読み取りタスク、hive - Hiveテーブル読み取りタスク                                 |
|           |                   | paths             | Yes      | -                    | ファイルパス配列、ファイル読み取りタスク（type=file）でのみ有効                                    |
|           |                   | format            | Yes      | -                    | ファイルタイプ、サポート種類: csv, parquet, orc、ファイル読み取りタスク（type=file）でのみ有効      |
|           |                   | fieldSep          | No       | `\t`                 | 列区切り文字、ファイル読み取りタスク（type=file）かつファイルタイプがcsv（format=csv）の場合のみ有効 |
|           |                   | lineDelim         | No       | `\n`                 | 行区切り文字、ファイル読み取りタスク（type=file）かつファイルタイプがcsv（format=csv）の場合のみ有効    |
|           |                   | hiveMetastoreUris | Yes      | -                    | Hiveメタデータサービスアドレス                                                                 |
|           |                   | hiveDatabase      | Yes      | -                    | Hiveデータベース名                                                                            |
|           |                   | hiveTable         | Yes      | -                    | Hiveデータテーブル名                                                                          |
|           |                   | columns           | No       | ターゲットテーブル列 | ソースデータ列名、ファイル読み取りタスク（type=file）でのみ有効                       |
|           |                   | columnMappings    | No       | -                    | 列マッピング                                                                                |
|           |                   | where             | No       | -                    | フィルタ条件                                                                             |
|           |                   | targetPartitions  | No       | -                    | ターゲットインポートパーティション                                                                       |

#### Sparkパラメータ設定

| Name  | Suboption | Required | Default value | Description                                                 |
|-------|--------------|----------|---------------|-------------------------------------------------------------|
| spark |              | Yes      | -             | インポートタスクジョブ                                             |
|       | sparkHome    | Yes      | -             | Sparkデプロイメントパス                                       |
|       | master       | Yes      | -             | Spark Master、サポート種類: yarn, standalone, local  |
|       | deployMode   | No       | client        | Sparkデプロイメントモード、サポート種類: cluster, client |
|       | properties   | Yes      | -             | Sparkジョブプロパティ                                        |

#### Hadoopパラメータ設定

| Name   | Required | Default value | Parameter description                                               |
|--------|----------|---------------|---------------------------------------------------------------------|
| hadoop | Yes      | -             | Hadoop設定、HDFS関連およびYarn設定を含む |

#### 環境パラメータ設定

| Name  | Required | Default value | Parameter description |
|-------|----------|---------------|-----------------------|
| env   | No       | -             | 環境変数 |

## Load例

### Bitmap型データのLoad

- グローバル辞書を構築することによるLoad

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
- Bitmap UDFで処理した後のHiveバイナリデータを読み込む

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
