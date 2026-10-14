---
{
    "title": "Spark Load",
    "language": "ja",
    "description": "Spark Load は外部の Spark リソースを使って取り込みデータを前処理します。大量のデータを Doris に取り込む際の性能を高め、Doris クラスターの計算リソースを節約します。主に Doris への初期移行や大規模なデータ取り込みに使用します。"
}
---

# Spark Load

Spark Load は外部の Spark リソースを使って取り込みデータを前処理します。大量のデータを Doris に取り込む際の性能を高め、Doris クラスターの計算リソースを節約します。主に Doris への初期移行や大規模なデータ取り込みに使用します。

Spark Load は Spark クラスターのリソースを使って取り込みデータをソートし、Doris BE がファイルを直接書き込みます。これにより Doris クラスターのリソース使用量が大幅に減り、大量の履歴データを移行する際のクラスター負荷を抑えられます。

取り込みジョブの作成と実行には Spark Load クライアントを使用します。ジョブの実行状態はコンソールに出力され、SHOW LOAD で取り込み結果を確認することもできます。

:::caution Note

この機能は実験的なもので、現在は master ブランチでのみ利用できます。
現在のバージョンは、ストレージとコンピュートが一体となったクラスターのみをサポートします。
使用中に問題が発生した場合は、メーリングリスト、[GitHub Issue](https://github.com/apache/doris/issues)、またはその他の手段で報告してください。

:::

## 利用シーン

- ソースデータが HDFS など、Spark からアクセスできるストレージシステムにある場合。
- データ量が数十 GB から TB 規模の場合。

:::caution Note
主キーモデルでは、現在は merge-on-read モードのテーブルのみがサポートされます。  
:::

## 基本原理

### 基本的な処理の流れ

Spark Load タスクは主に次の 7 段階で実行されます。

1. 設定ファイルを作成し、読み込むソースファイルまたはテーブルと、ターゲットテーブルの情報を指定します。
2. Spark Load クライアントが FE に取り込みジョブを作成してトランザクションを開始します。FE はターゲットテーブルのメタデータをクライアントに返します。
3. Spark Load クライアントが ETL タスクを Spark クラスターに送信して実行します。
4. Spark クラスターが ETL を実行し、グローバル辞書の構築（Bitmap 型）、パーティション分割、ソート、集約など、取り込みデータの前処理を完了します。
5. ETL タスクの完了後、Spark Load クライアントが前処理済みの各シャードのデータパスを FE に同期し、該当する BE に Push タスクを実行させます。
6. BE がデータを読み込み、Doris の内部ストレージ形式に変換します。
7. FE が有効なバージョンをスケジュールし、取り込みタスクを完了します。

### グローバル辞書

#### 適用シーン

現在、Doris の Bitmap カラムには Roaringbitmap ライブラリが使用されています。Roaringbitmap に入力できるのは整数型のみです。そのため、取り込み中に Bitmap カラムの事前計算を行う場合は、入力データを整数型に変換する必要があります。

Doris の既存の取り込み処理では、グローバル辞書は Hive テーブルを基に実装され、元の値とエンコード後の値の対応関係を保存します。

#### 構築手順

1. 上流のデータソースからデータを読み込み、hive_table という Hive 一時テーブルを作成します。
2. hive_table から対象カラムの重複を除いた値を抽出し、distinct_value_table という新しい Hive テーブルを作成します。
3. 元の値とエンコード後の値をそれぞれ格納するカラムを持つ、dict_table という新しいグローバル辞書テーブルを作成します。
4. distinct_value_table と dict_table を Left Join して新たに追加された一意の値を求め、ウィンドウ関数でエンコードします。これにより元の値に対応するエンコード値のカラムが得られます。最後に、元の値とエンコード値のカラムのデータを dict_table に書き戻します。
5. dict_table と hive_table を結合し、hive_table の元の値を整数のエンコード値に置き換えます。
6. 次のデータ前処理で hive_table を読み込み、計算後に Doris に取り込みます。
   データ前処理（DPP）
   基本的な処理の流れ
7. データソースからデータを読み込みます。上流のデータソースには HDFS ファイルまたは Hive テーブルを使用できます。
8. 読み込んだデータのフィールドマッピングと式の評価を行い、パーティション情報に基づいてバケットフィールド bucket_id を生成します。
9. Doris テーブルの Rollup メタデータに基づいて RollupTree を生成します。
10. RollupTree をたどり、階層ごとに集約します。次の階層の Rollup は、前の階層の Rollup から計算できます。
11. 各集約計算の完了後、bucket_id に従ってデータをバケットに分け、HDFS に書き込みます。
12. 続いて Broker が HDFS からファイルを取得し、Doris BE に取り込みます。

#### Hive Bitmap UDF

Spark は、Hive が生成した Bitmap データを Doris に直接取り込めます。詳細は hive-bitmap-udf ドキュメントを参照してください。

## クイックスタート

- ファイルからデータを読み込む

  - ターゲットテーブルのスキーマ

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

  - 設定ファイルを作成する

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
          "paths": ["hdfs://hadoop:8020/data/data.txt"],
          "format": "csv",
          "fieldSep": ",", "columns":"c_int,c_char,c_varchar,c_bool,c_tinyint,c_smallint,c_bigint,c_largeint,c_float,c_double,c_decimal,c_decimalv3,c_date,c_datev2,c_datetime,c_datetimev2"
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

  - Spark Load ジョブを開始する

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

  - ジョブの実行結果を確認する

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-file | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

- Hive テーブルからデータを読み込む

    - Hive テーブルのスキーマ

      ```hive
      CREATE TABLE IF NOT EXISTS tbl_test_spark_load (
        c_int int,
        c_char char,
        c_varchar varchar,
        c_bool boolean,
        c_tinyint tinyint,
        c_smallint smallint,
        c_bigint bigint,
        c_largeint largeint,
        c_float float,
        c_double double,
        c_decimal decimal(6, 3),
        c_decimalv3 decimal(6, 3),
        c_date date,
        c_datev2 date,
        c_datetime datetime,
        c_datetimev2 datetime
      )
      STORED AS TEXTFILE
      ```

    - ターゲットテーブルのスキーマ

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

    - 設定ファイルを作成する

      ```json
      {
        "feAddresses": "127.0.0.1:8030",
        "label": "spark-load-test-hive",
        "user": "root",
        "password": "",
        "database": "test",
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "tbl_test_spark_load": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "tbl_test_spark_load"
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

    - Spark Load ジョブを開始する

      ```shell
      $ cd spark-load-dir
      $ sh ./bin/spark-load.sh -c config.json
      ```

    - ジョブの実行結果を確認する

      ```sql
      mysql> show load;
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | JobId | Label                 | State    | Progress      | Type      | EtlInfo | TaskInfo                                            | ErrorMsg | CreateTime          | EtlStartTime        | EtlFinishTime       | LoadStartTime       | LoadFinishTime      | URL                 | JobDetails                                                                                                                              | TransactionId | ErrorTablets | User | Comment |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      | 38104 | spark-load-test-hive | FINISHED | 100.00% (0/0) | INGESTION | NULL    | cluster:N/A; timeout(s):86400; max_filter_ratio:0.0 | NULL     | 2024-08-16 14:47:22 | 2024-08-16 14:47:22 | 2024-08-16 14:47:58 | 2024-08-16 14:47:58 | 2024-08-16 14:48:01 | app-1723790846300 | {"Unfinished backends":{"0-0":[]},"ScannedRows":0,"TaskNumber":1,"LoadBytes":0,"All backends":{"0-0":[-1]},"FileNumber":0,"FileSize":0} | 27024         | {}           | root |         |
      +-------+-----------------------+----------+---------------+-----------+---------+-----------------------------------------------------+----------+---------------------+---------------------+---------------------+---------------------+---------------------+---------------------+-----------------------------------------------------------------------------------------------------------------------------------------+---------------+--------------+------+---------+
      ```

## リファレンスマニュアル

### Spark Load クライアント

#### ディレクトリ構成

```text
├── app
│   └── spark-load-dpp-1.0-SNAPSHOT.jar
├── bin
│   └── spark-load.sh
└── lib
```

- **app**: Spark DPP のアプリケーションパッケージ
- **bin**: Spark Load の起動スクリプト
- **lib**: その他の依存パッケージ

#### 起動スクリプトのパラメータ

- `--config`|`-c`: 設定ファイルのパスを指定します。
- `--recovery`|`-r`: リカバリーモードで起動するかどうかを指定します。

### 取り込みのキャンセル

Spark Load ジョブの状態が `CANCELLED` または `FINISHED` でなければ、手動でキャンセルできます。

Spark Load の起動スクリプトのプロセスを終了するか、Doris で `CANCEL LOAD` コマンドを実行すると、取り込みタスクをキャンセルできます。

`CANCEL LOAD` でキャンセルする場合は、対象の取り込みタスクの `Label` を指定する必要があります。コマンドの構文は `HELP CANCEL LOAD` で確認できます。

### 設定パラメータ

#### 一般設定

| パラメータ名 | 必須 | デフォルト | 説明                                                |
|-------------|------|-----|--------------------------------------------------------|
| feAddresses | はい  | -   | Doris FE の HTTP アドレス。形式: fe_ip:http_port, [fe_ip:http_port] |
| label       | はい  | -   | 取り込みジョブのラベル                                       |
| user        | はい  | -   | Doris のユーザー名                                         |
| password    | はい  | -   | Doris のパスワード                                         |
| database    | はい  | -   | Doris のデータベース名                                    |
| workingDir  | はい  | -   | Spark Load の作業パス                                |

#### タスク設定

| パラメータ名 | サブパラメータ -1 | サブパラメータ -2 | 必須 | デフォルト | 説明                                       |
|-----------|-------|-------------------|------|-------|--------------------------------------------------|
| loadTasks |       |                   | はい  | -     | 取り込みタスクのジョブ                                  |
|           | ターゲットテーブル名 |       | はい  | -     | 取り込み先の Doris テーブル名           |
|           |       | type              | はい  | -     | タスクの種類: file はファイル読み込みタスク、hive は Hive テーブル読み込みタスク |
|           |       | paths             | はい  | -     | ファイルパスの配列。ファイル読み込みタスク（type=file）の場合のみ有効 |
|           |       | format            | はい  | -     | ファイル形式。対応形式: csv、parquet、orc。ファイル読み込みタスク（type=file）の場合のみ有効 |
|           |       | fieldSep          | いいえ   | `\t`  | カラム区切り文字。ファイル読み込みタスク（type=file）で、ファイル形式が csv（format=csv）の場合のみ有効 |
|           |       | lineDelim         | いいえ   | `\n`  | 行区切り文字。ファイル読み込みタスク（type=file）で、ファイル形式が csv（format=csv）の場合のみ有効 |
|           |       | hiveMetastoreUris | はい  | -     | Hive Metastore サービスのアドレス                   |
|           |       | hiveDatabase      | はい  | -     | Hive のデータベース名                               |
|           |       | hiveTable         | はい  | -     | Hive のテーブル名                                  |
|           |       | columns           | いいえ   | ターゲットテーブルのカラム | ソースデータのカラム名。ファイル読み込みタスク（type=file）の場合のみ有効 |
|           |       | columnMappings    | いいえ   | -     | カラムのマッピング                                  |
|           |       | where             | いいえ   | -     | フィルター条件                                 |
|           |       | targetPartitions  | いいえ   | -     | 取り込み先のパーティション                         |

#### Spark パラメータ設定

| パラメータ名 | サブパラメータ -1 | 必須 | デフォルト | 説明                                     |
|--------|------------|------|--------|-------------------------------------------|
| spark  |            | はい  | -      | 取り込みタスクのジョブ                           |
|        | sparkHome  | はい  | -      | Spark の配置パス                     |
|        | master     | はい  | -      | Spark Master。対応する種類: yarn、standalone、local |
|        | deployMode | いいえ   | client | Spark のデプロイモード。対応する種類: cluster、client |
|        | properties | はい  | -      | Spark ジョブのプロパティ                      |

#### Hadoop パラメータ設定

| パラメータ名 | 必須 | デフォルト | 説明                                 |
|--------- |---------| ------ | ----------------------------------------- |
| hadoop   | はい     | -      | HDFS 関連および Yarn の設定を含む Hadoop の設定 |

#### 環境パラメータ設定

| パラメータ名 | 必須 | デフォルト | 説明 |
| -------- |--------| ------ | -------- |
| env      | いいえ     | -      | 環境変数 |

## 取り込み例

### Bitmap 型データの取り込み

- グローバル辞書を構築して取り込む

    - Hive テーブル

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Doris テーブル

      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
      "replication_num" = "1"
      )
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
            "columnMappings": ["uuid=bitmap_dict(uuid)"]
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


- Bitmap UDF で処理した Hive Binary 型データを取り込む

    - Hive テーブル

      ```hive
      CREATE TABLE IF NOT EXISTS hive_t1
      (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid VARCHAR(100)
      )
      STORED AS TEXTFILE
      ```

    - Doris テーブル
    
      ```sql
      CREATE TABLE IF NOT EXISTS doris_t1 (
        k1 INT,
        K2 SMALLINT,
        k3 VARCHAR(50),
        uuid BITMAP
      ) ENGINE=OLAP
      DUPLICATE KEY (k1)
      DISTRIBUTED BY HASH(k1) BUCKETS 1
      PROPERTIES (
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
        "workingDir": "hdfs://hadoop:8020/spark-load",
        "loadTasks": {
          "doris_tb1": {
            "type": "hive",
            "hiveMetastoreUris": "thrift://hadoop:9083",
            "hiveDatabase": "test",
            "hiveTable": "hive_t1",
            "columnMappings": ["uuid=binary_bitmap(uuid)"]
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
