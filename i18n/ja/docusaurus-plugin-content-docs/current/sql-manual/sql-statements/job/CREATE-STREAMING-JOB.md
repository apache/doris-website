---
{
  "title": "ストリーミングジョブを作成",
  "language": "ja",
  "description": "Doris Streaming Jobは、Jobアプローチに基づく継続的なインポートタスクです。Jobが送信された後、Dorisは継続的にインポートジョブを実行し、リアルタイムでTVFまたは上流のデータソースにクエリを実行し、データをDorisテーブルに書き込みます。"
}
---
## 説明

Doris Streaming JobはJobアプローチに基づいた継続的なインポートタスクです。Jobが送信された後、Dorisは継続的にインポートジョブを実行し、TVFまたは上流のデータソースをリアルタイムでクエリして、データをDorisテーブルに書き込みます。

## 構文

```SQL
CREATE JOB <job_name>
ON STREAMING
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
[ COMMENT <comment> ]
(
DO <Insert_Command> 
|
(
    FROM <sourceType> (
        <source_property>
        [ , ... ])
    TO DATABASE <target_db> 
    [ PROPERTIES   (
        <target_property>
        [ , ... ])
    ]
)
```
## 必須パラメータ

**1. `<job_name>`**
> ジョブ名。データベース内のイベントを一意に識別します。ジョブ名はグローバルに一意である必要があります。同名のジョブが既に存在する場合、エラーが報告されます。

**2. `<Insert_Command>`**
> DO句は、ジョブがトリガーされた際に実行される操作、つまりSQL文を指定します。現在、S3 TVFのみサポートされています。

**3. `<sourceType>`**
> サポートされているデータソース：現在MySQLとPostgresのみ。

**4. `<source_property>`**
| パラメータ      | デフォルト | 説明                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC接続文字列（MySQL/PG）                            |
| driver_url     | -       | JDBCドライバjarパス                                         |
| driver_class   | -       | JDBCドライバクラス名                                       |
| user           | -       | データベースユーザー名                                            |
| password       | -       | データベースパスワード                                            |
| database       | -       | データベース名                                                |
| schema         | -       | スキーマ名                                                  |
| include_tables | -       | 同期対象テーブル、カンマ区切り                       |
| offset         | initial | initial：フル＋増分同期、latest：増分のみ   |
| snapshot_split_size | 8096 | 各スプリットのサイズ（行数）。フル同期中、テーブルは同期のために複数のスプリットに分割されます。 |
| snapshot_parallelism | 1 | フル同期フェーズ中の並列度レベル、つまり単一タスクが一度にスケジュールできるスプリットの最大数。 |


**5. `<target_db>`**
> インポート先のDorisターゲットデータベース名。

**6. `<target_property>`**
| パラメータ                       | デフォルト | 説明                                 |
| ------------------------------- | ------- | ------------------------------------------- |
| table.create.properties.*       | -       | テーブル作成時のテーブルプロパティ、例：replication_num |
| load.strict_mode | - | 厳密モードを有効にするかどうか。デフォルトでは無効。 |
| load.max_filter_ratio | - | サンプリングウィンドウ内で許可される最大フィルタリング率。0と1の間（両端含む）である必要があります。デフォルト値は0で、ゼロトレラントを示します。サンプリングウィンドウはmax_interval * 10と等しくなります。このウィンドウ内で、エラー行の総行数に対する比率がmax_filter_ratioを超えると、スケジュールされたジョブは一時停止され、データ品質の問題に対処するための手動介入が必要になります。 |



## オプションパラメータ

**1. `<job_property>`**
| パラメータ          | デフォルト | 説明                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | None    | job_propertiesでのすべてのセッション変数の設定をサポート |
| s3.max_batch_files | 256     | 累積ファイル数がこの値に達するとインポート書き込みをトリガー |
| s3.max_batch_bytes | 10G     | 累積データ量がこの値に達するとインポート書き込みをトリガー |
| max_interval       | 10s     | 上流に新しいファイルやデータがない場合のアイドルスケジューリング間隔 |

## 権限制御

このSQLコマンドを実行するユーザーは、最低でも以下の権限を持つ必要があります：

| 権限   | オブジェクト      | 備考                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | Database    | 現在、この操作では**LOAD**権限のみサポートされています |

## 注意事項

- TASKは最新の100件のレコードのみ保持します。
- 現在、Insert_Commandは**INSERT internal table Select * From S3(...)**のみサポートしています。将来的により多くの操作がサポートされる予定です。

## 例

- my_jobという名前のジョブを作成し、S3の指定されたディレクトリ内のファイルを継続的に監視し、.csvで終わるファイルからdb1.tbl1にデータをインポートします。

    ```sql
    CREATE JOB my_job
    ON STREAMING
    DO 
    INSERT INTO db1.`tbl1`
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/s3/demo/*.csv",
        "format" = "csv",
        "column_separator" = ",",
        "s3.endpoint" = "s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```
- MySQL上流のuser_infoテーブルとorder_infoテーブルを最初からtarget_test_dbデータベースに同期するmulti_table_syncという名前のジョブを作成します。

    ```sql
    CREATE JOB multi_table_sync
    ON STREAMING
    FROM MYSQL (
            "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
            "driver_url" = "mysql-connector-j-8.0.31.jar",
            "driver_class" = "com.mysql.cj.jdbc.Driver",
            "user" = "root",
            "password" = "123456",
            "database" = "test",
            "include_tables" = "user_info,order_info",
            "offset" = "initial"
    )
    TO DATABASE target_test_db (
        "table.create.properties.replication_num" = "1"
    )
    ```
- test_postgres_jobという名前のジョブを作成し、PostgreSQLアップストリームのtest_tblsテーブルから増分データを継続的にtarget_test_dbデータベースに同期します。

    ```sql
    CREATE JOB test_postgres_job
    ON STREAMING
    FROM POSTGRES (
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.0.jar",
        "driver_class" = "org.postgresql.Driver",
        "user" = "postgres",
        "password" = "postgres",
        "database" = "postgres",
        "schema" = "public",
        "include_tables" = "test_tbls", 
        "offset" = "latest"
    )
    TO DATABASE target_test_db (
    "table.create.properties.replication_num" = "1"
    )
    ```
## CONFIG

**fe.conf**

| Parameter                             | Default | Description                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streamingジョブの最大数            |
| job_streaming_task_exec_thread_num     | 10      | StreamingTaskのスレッド数         |
| max_streaming_task_show_count          | 100     | メモリ内のStreamingTaskレコードの最大数|
