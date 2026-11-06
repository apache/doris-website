---
{
    "title": "CREATE STREAMING JOB",
    "language": "ja",
    "description": "Doris Streaming Job は Job 方式に基づく継続的なインポートタスクです。Job の送信後、Doris はインポートジョブを継続的に実行し、TVF または上流データソースにリアルタイムでクエリを実行して、データを Doris テーブルに書き込みます。"
}
---

## 説明 {#description}

Doris Streaming Job は Job 方式に基づく継続的なインポートタスクです。Job の送信後、Doris はインポートジョブを継続的に実行し、TVF または上流データソースにリアルタイムでクエリを実行して、データを Doris テーブルに書き込みます。

次のモードをサポートしています：

- **TVF モード**：`DO INSERT INTO ... SELECT FROM TVF()` 構文を使用して、TVF のデータを指定した単一の Doris テーブルに継続的に書き込みます。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートしています。
- **マルチテーブル CDC モード**：`FROM <sourceType> TO DATABASE` 構文を使用して、上流データベースの複数テーブルから全量および増分データを Doris に継続的に同期し、初回同期時に下流テーブルを自動的に作成します。

詳細な使用方法については、[継続的なデータロード](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md)を参照してください。

## 構文 {#syntax}

### TVF モード {#tvf-mode}

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
DO <Insert_Command>
```

### マルチテーブル CDC モード {#multi-table-cdc-mode}

```SQL
CREATE JOB <job_name>
[ PROPERTIES (
    <job_property>
    [ , ... ]
    )
]
ON STREAMING
[ COMMENT <comment> ]
FROM <sourceType> (
    <source_property>
    [ , ... ]
)
TO DATABASE <target_db> (
    <target_property>
    [ , ... ]
)
```

## 必須パラメータ {#required-parameters}

**1. `<job_name>`**
> ジョブ名。データベース内のイベントを一意に識別します。ジョブ名はグローバルに一意である必要があります。同じ名前のジョブがすでに存在する場合は、エラーが報告されます。

**2. `<Insert_Command>`**（TVF モード）
> DO 句は、ジョブがトリガーされたときに実行する操作、つまり INSERT INTO SELECT FROM TVF ステートメントを指定します。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートしています。

**3. `<sourceType>`**（マルチテーブル CDC モード）
> サポートされるデータソースタイプ：現在は `MYSQL` と `POSTGRES` をサポートしています。

**4. `<source_property>`**（マルチテーブル CDC モード）

| パラメータ      | デフォルト | 説明                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC 接続文字列（MySQL/PostgreSQL）                    |
| driver_url     | -       | JDBC ドライバー jar パス                                         |
| driver_class   | -       | JDBC ドライバークラス名                                       |
| user           | -       | データベースユーザー名                                            |
| password       | -       | データベースパスワード                                            |
| database       | -       | データベース名                                                |
| schema         | -       | スキーマ名（PostgreSQL）                                     |
| include_tables | -       | 同期するテーブル。カンマ区切りで指定します。指定しない場合、デフォルトですべてのテーブルが同期されます。 |
| offset         | latest  | `latest`: 増分のみ（デフォルト）；`initial`: 全量 + 増分同期   |
| snapshot_split_size | 40960 (4.1.4 より前は 8096) | 分割サイズ（行数）。全量同期中、テーブルは複数の split に分割されます。 |
| snapshot_parallelism | 1   | 全量同期フェーズ中の並列度、つまりタスクあたりの最大 split 数。 |

**5. `<target_db>`**（マルチテーブル CDC モード）
> インポート先の Doris ターゲットデータベース名です。

**6. `<target_property>`**（マルチテーブル CDC モード）

| パラメータ                       | デフォルト | 説明                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | 作成時のテーブルプロパティ。例：replication_num         |
| load.strict_mode                | -       | strict モードを有効にするかどうか。デフォルトでは無効です。          |
| load.max_filter_ratio           | -       | サンプリングウィンドウ内で許容される最大フィルタリング率。0 以上 1 以下である必要があります。デフォルト値は 0 で、許容値ゼロを示します。サンプリングウィンドウは max_interval * 10 と同じです。このウィンドウ内で、エラー行数と総行数の比率が max_filter_ratio を超えると、スケジュールされたジョブが一時停止され、データ品質の問題に対処するため手動介入が必要になります。 |

## オプションパラメータ {#optional-parameters}

**1. `<job_property>`**

| パラメータ          | デフォルト | 説明                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | job_properties ですべてのセッション変数を設定できます（TVF モードのみ） |
| s3.max_batch_files | 256     | 累積ファイル数がこの値に達すると、インポート書き込みをトリガーします（S3 TVF のみ） |
| s3.max_batch_bytes | 10737418240 | 累積データサイズ（バイト単位）がこの値に達すると、インポート書き込みをトリガーします。プレーンな整数のバイト数のみ受け付けます。例：`10737418240`。`10G` のような単位サフィックスはサポートされません。有効範囲は 100MB–10GB、つまり 104857600–10737418240 です。（S3 TVF のみ） |
| max_interval       | 10      | 上流に新しいファイルまたはデータがない場合のアイドルスケジューリング間隔（秒）。整数（秒数）のみ受け付けます。例：`10`。`10s` のような単位サフィックスはサポートされません。1 以上である必要があります。 |

## 権限制御 {#privilege-control}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります：

| 権限   | オブジェクト      | 注記                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | データベース    | 現在、この操作では **LOAD** 権限のみサポートされています |

## 注意事項 {#notes}

- TASK は最新の 100 件のレコードのみ保持します。

## 例 {#examples}

### TVF モード {#tvf-mode-1}

- S3 上の指定ディレクトリにあるファイルを継続的に監視し、CSV ファイルのデータを db1.tbl1 にインポートするジョブを作成します。

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
        "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
        "s3.region" = "ap-southeast-1",
        "s3.access_key" = "",
        "s3.secret_key" = ""
    );
    ```

- CDC Stream TVF を使用して、単一の MySQL テーブルを Doris に継続的に同期するジョブを作成します。

    ```sql
    CREATE JOB mysql_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
    SELECT * FROM cdc_stream(
        "type" = "mysql",
        "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
        "driver_url" = "mysql-connector-java-8.0.25.jar",
        "driver_class" = "com.mysql.cj.jdbc.Driver",
        "user" = "root",
        "password" = "123456",
        "database" = "source_db",
        "table" = "source_table",
        "offset" = "initial"
    );
    ```

- CDC Stream TVF を使用して、単一の PostgreSQL テーブルを Doris に継続的に同期するジョブを作成します。

    ```sql
    CREATE JOB pg_cdc_job
    ON STREAMING
    DO
    INSERT INTO db1.target_table
    SELECT * FROM cdc_stream(
        "type" = "postgres",
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
        "driver_class" = "org.postgresql.Driver",
        "user" = "postgres",
        "password" = "postgres",
        "database" = "postgres",
        "schema" = "public",
        "table" = "source_table",
        "offset" = "initial"
    );
    ```

### マルチテーブル CDC モード {#multi-table-cdc-mode-1}

- MySQL 上流の user_info テーブルと order_info テーブルを最初から target_test_db データベースに同期するジョブを作成します。

    ```sql
    CREATE JOB multi_table_sync
    ON STREAMING
    FROM MYSQL (
            "jdbc_url" = "jdbc:mysql://127.0.0.1:3306",
            "driver_url" = "mysql-connector-java-8.0.25.jar",
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

- PostgreSQL 上流の test_tbls テーブルから target_test_db データベースへ増分データを継続的に同期するジョブを作成します。

    ```sql
    CREATE JOB test_postgres_job
    ON STREAMING
    FROM POSTGRES (
        "jdbc_url" = "jdbc:postgresql://127.0.0.1:5432/postgres",
        "driver_url" = "postgresql-42.5.1.jar",
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

## CONFIG {#config}

**fe.conf**

| パラメータ                             | デフォルト | 説明                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streaming ジョブの最大数            |
| job_streaming_task_exec_thread_num     | 10      | StreamingTask 用のスレッド数         |
| max_streaming_task_show_count          | 100     | メモリ内の StreamingTask レコードの最大数|
