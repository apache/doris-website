---
{
    "title": "CREATE STREAMING JOB",
    "language": "ja",
    "description": "Doris Streaming Job は、Job 方式に基づく継続的なデータ取り込みタスクです。Job を送信すると、Doris は取り込みジョブを継続的に実行し、TVF または上流のデータソースをリアルタイムで照会して、Doris テーブルにデータを書き込みます。"
}
---

## 説明

Doris Streaming Job は、Job 方式に基づく継続的なデータ取り込みタスクです。Job を送信すると、Doris は取り込みジョブを継続的に実行し、TVF または上流のデータソースをリアルタイムで照会して、Doris テーブルにデータを書き込みます。

次の二つのモードをサポートします。

- **TVF モード**: `DO INSERT INTO ... SELECT FROM TVF()` 構文を使用して、TVF のデータを指定した単一の Doris テーブルに継続的に書き込みます。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートします。
- **複数テーブル CDC モード**: `FROM <sourceType> TO DATABASE` 構文を使用して、上流の複数のデータベーステーブルから Doris に全量データと増分データを継続的に同期します。初回の同期時に同期先のテーブルを自動作成します。

詳しい使い方は、[継続的なデータ取り込み](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md)を参照してください。

## 構文

### TVF モード

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

### 複数テーブル CDC モード

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

## 必須パラメータ

**1. `<job_name>`**
> ジョブ名です。データベース内のイベントを一意に識別します。ジョブ名はグローバルに一意である必要があり、同じ名前のジョブがすでに存在する場合はエラーが報告されます。

**2. `<Insert_Command>`**（TVF モード）
> DO 句では、ジョブがトリガーされたときに実行する操作、つまり INSERT INTO SELECT FROM TVF ステートメントを指定します。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートします。

**3. `<sourceType>`**（複数テーブル CDC モード）
> サポートされるデータソースの種類: 現在は `MYSQL` と `POSTGRES` をサポートします。

**4. `<source_property>`**（複数テーブル CDC モード）

| パラメータ      | デフォルト値 | 説明                                                  |
| -------------- | ------- | ------------------------------------------------------------ |
| jdbc_url       | -       | JDBC 接続文字列（MySQL/PostgreSQL）                    |
| driver_url     | -       | JDBC ドライバーの JAR ファイルのパス                                         |
| driver_class   | -       | JDBC ドライバーのクラス名                                       |
| user           | -       | データベースのユーザー名                                            |
| password       | -       | データベースのパスワード                                            |
| database       | -       | データベース名                                                |
| schema         | -       | スキーマ名（PostgreSQL）                                     |
| include_tables | -       | 同期するテーブルをカンマで区切って指定します。指定しない場合、デフォルトですべてのテーブルを同期します。 |
| offset         | latest  | `latest`: 増分データのみ（デフォルト）、`initial`: 全量データと増分データを同期します。   |
| snapshot_split_size | 40960（4.1.4 より前は 8096） | 分割サイズ（行数）です。全量同期中は、テーブルを複数の分割に分けます。 |
| snapshot_parallelism | 1   | 全量同期フェーズの並列度、つまりタスクあたりの最大分割数です。 |

**5. `<target_db>`**（複数テーブル CDC モード）
> 取り込み先となる Doris のターゲットデータベース名です。

**6. `<target_property>`**（複数テーブル CDC モード）

| パラメータ                       | デフォルト値 | 説明                                                  |
| ------------------------------- | ------- | ------------------------------------------------------------ |
| table.create.properties.*       | -       | テーブル作成時のプロパティです（例: replication_num）。         |
| load.strict_mode                | -       | 厳格モードを有効にするかどうかを指定します。デフォルトでは無効です。          |
| load.max_filter_ratio           | -       | サンプリング期間内で許容されるフィルタリング比率の最大値です。0 以上 1 以下で指定します。デフォルト値は 0 で、エラー行を許容しません。サンプリング期間は max_interval * 10 です。この期間中に、全行数に対するエラー行数の比率が max_filter_ratio を超えると、スケジュールされたジョブは一時停止されます。データ品質の問題に対処するには手動での対応が必要です。 |

## 任意パラメータ

**1. `<job_property>`**

| パラメータ          | デフォルト値 | 説明                                                  |
| ------------------ | ------- | ------------------------------------------------------------ |
| session.*          | -       | job_properties ですべてのセッション変数を設定できます（TVF モードのみ）。 |
| s3.max_batch_files | 256     | 蓄積されたファイル数がこの値に達すると、データ取り込みの書き込みがトリガーされます（S3 TVF のみ）。 |
| s3.max_batch_bytes | 10737418240 | 蓄積されたデータサイズ（バイト単位）がこの値に達すると、データ取り込みの書き込みがトリガーされます。指定できるのは `10737418240` のような単位なしの整数のバイト数のみで、`10G` のような単位付きの値はサポートされません。有効範囲は 100MB–10GB、つまり 104857600–10737418240 です（S3 TVF のみ）。 |
| max_interval       | 10      | 上流に新しいファイルやデータがない場合の、アイドル状態でのスケジューリング間隔（秒）です。`10` のような秒数を表す整数のみ指定でき、`10s` のような単位付きの値はサポートされません。1 以上である必要があります。 |

## 権限制御

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限   | オブジェクト      | 備考                                 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | データベース    | 現在、この操作でサポートされるのは **LOAD** 権限のみです。 |

## 注意事項

- TASK は最新の 100 件のレコードのみを保持します。

## 例

### TVF モード

- S3 の指定したディレクトリ内のファイルを継続的に監視し、CSV ファイルのデータを db1.tbl1 に取り込むジョブを作成します。

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

### 複数テーブル CDC モード

- 上流の MySQL にある user_info テーブルと order_info テーブルを、最初から target_test_db データベースに同期するジョブを作成します。

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

- 上流の PostgreSQL にある test_tbls テーブルの増分データを、target_test_db データベースに継続的に同期するジョブを作成します。

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

## 設定

**fe.conf**

| パラメータ                             | デフォルト値 | 説明                                 |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streaming Job の最大数            |
| job_streaming_task_exec_thread_num     | 10      | StreamingTask の実行スレッド数         |
| max_streaming_task_show_count          | 100     | メモリ内に保持する StreamingTask レコードの最大数 |
