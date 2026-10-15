---
{
    "title": "CREATE STREAMING JOB",
    "language": "ja",
    "description": "CREATE STREAMING JOB を使用して、TVF からデータを継続的に取り込むか、MySQL および PostgreSQL のテーブルを Doris に同期します。"
}
---

## 説明

Doris Streaming Job は、Job に基づく継続的なインポートタスクです。Job を送信すると、Doris はインポートジョブを継続的に実行し、TVF または上流のデータソースをリアルタイムでクエリして、データを Doris のテーブルに書き込みます。

次の二つのモードをサポートします。

- **TVF モード**: `DO INSERT INTO ... SELECT FROM TVF()` 構文を使用して、TVF のデータを指定した単一の Doris テーブルに継続的に書き込みます。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートします。
- **複数テーブル CDC モード**: `FROM <sourceType> TO DATABASE` 構文を使用して、上流データベースの複数のテーブルから全量データと増分データを Doris に継続的に同期します。初回の同期時には、同期先のテーブルを自動的に作成します。

詳しい使い方については、[継続的なロード](../../../data-operate/import/import-way/streaming-job/continuous-load-overview.md)を参照してください。

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
> データベース内のイベントを一意に識別するジョブ名です。ジョブ名はグローバルに一意である必要があり、同じ名前のジョブがすでに存在する場合はエラーになります。

**2. `<Insert_Command>`**（TVF モード）
> DO 句では、ジョブがトリガーされたときに実行する操作、すなわち INSERT INTO SELECT FROM TVF 文を指定します。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートします。

**3. `<sourceType>`**（複数テーブル CDC モード）
> サポートするデータソースの種類: 現在は `MYSQL` と `POSTGRES` をサポートします。

**4. `<source_property>`**（複数テーブル CDC モード）

| パラメータ | 対象データソース | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | MySQL、PostgreSQL | - | 必須。JDBC 接続文字列です。 |
| `driver_url` | MySQL、PostgreSQL | - | 必須。JDBC ドライバーの jar ファイルへのパスです。 |
| `driver_class` | MySQL、PostgreSQL | - | 必須。JDBC ドライバーのクラス名です。 |
| `user` | MySQL、PostgreSQL | - | 必須。データベースのユーザー名です。 |
| `password` | MySQL、PostgreSQL | - | 必須。データベースのパスワードです。 |
| `database` | MySQL、PostgreSQL | - | 必須。上流データベースの名前です。PostgreSQL の場合は、JDBC URL 内のデータベース名と一致する必要があります。 |
| `schema` | PostgreSQL | - | 必須。PostgreSQL のスキーマ名です。 |
| `include_tables` | MySQL、PostgreSQL | - | 同期するテーブルの名前をカンマ区切りで指定します。設定しない場合は、データベースまたはスキーマ内のすべてのテーブルを同期します。 |
| `exclude_tables` | MySQL、PostgreSQL | - | 同期しないテーブルの名前をカンマ区切りで指定します。このパラメータは、`include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | MySQL、PostgreSQL | ソーステーブル名 | ソーステーブルに対応する Doris 側の同期先テーブル名を設定します。 |
| `table.<table_name>.exclude_columns` | MySQL、PostgreSQL | - | ソーステーブルのキー以外の列をカンマ区切りで指定し、同期対象から除外します。 |
| `offset` | MySQL、PostgreSQL | `latest` | 開始オフセットです。`initial`、`snapshot`、`latest`、および具体的な JSON オフセットをサポートします。MySQL では `earliest` もサポートします。 |
| `snapshot_split_size` | MySQL、PostgreSQL | `40960`（4.1.4 より前は `8096`） | 全量スナップショットの分割サイズを行数で指定します。正の整数である必要があります。 |
| `snapshot_parallelism` | MySQL、PostgreSQL | `1` | 全量同期フェーズで、Task が一度にスケジュールする分割の最大数です。正の整数である必要があります。 |
| `ssl_mode` | MySQL、PostgreSQL | `disable` | SSL モードです。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | MySQL、PostgreSQL | - | `FILE:<file_name>` 形式の CA 証明書ファイルです。`ssl_mode=verify-ca` の場合に必須です。 |
| `server_id` | MySQL | 自動生成 | MySQL CDC リーダーのサーバー ID です。`5400` のような単一の値、または `5400-5408` のような両端を含む範囲を指定できます。範囲の幅は `snapshot_parallelism` 以上である必要があります。 |
| `slot_name` | PostgreSQL | `doris_cdc_<job_id>` | 論理レプリケーションスロット名です。カスタムスロットは事前に作成し、ユーザーが管理する必要があります。 |
| `publication_name` | PostgreSQL | `doris_pub_<job_id>` | パブリケーション名です。カスタムパブリケーションは事前に作成し、同期対象のすべてのテーブルを含め、ユーザーが管理する必要があります。 |

> バージョンに関する注意: `table.<table_name>.target_table`、`table.<table_name>.exclude_columns`、`offset=snapshot`、`ssl_mode`、`ssl_rootcert`、`server_id`、`slot_name`、`publication_name` は、バージョン 4.1.0 以降でサポートされます。

`include_tables` と `exclude_tables` の両方を設定した場合は、`include_tables` が優先されます。`slot_name` と `publication_name` に使用できる文字は小文字の英字、数字、アンダースコアのみです。数字で始めることはできず、長さは 63 文字以下に制限されます。データソースごとの相違点、JSON オフセットの形式、SSL 証明書の設定について詳しくは、[テーブル自動作成を伴う MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md)と[テーブル自動作成を伴う PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md)を参照してください。

**5. `<target_db>`**（複数テーブル CDC モード）
> インポート先となる Doris のデータベース名です。

**6. `<target_property>`**（複数テーブル CDC モード）

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成する際に、`table.create.properties.replication_num` などのテーブルプロパティを追加します。 |
| `load.strict_mode` | `false` | Stream Load による書き込みで厳格モードを有効にするかどうかを指定します。有効な値は `true` と `false` です。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウ内で許容されるフィルター比率の最大値で、範囲は `[0, 1]` です。サンプリングウィンドウは `max_interval * 10` 秒です。ウィンドウ内のエラー行の比率がこの値を超えると、ジョブは一時停止します。 |

## オプションパラメータ

**1. `<job_property>`**

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | 上流に新しいファイルまたはデータがないときのスケジューリング間隔です。単位は秒で、1 以上の整数である必要があります。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトのコンピュートグループ | コンピュートとストレージを分離したモードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。ユーザーには、そのコンピュートグループに対する USAGE 権限が必要です。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | TVF モードでのみサポートされます。INSERT タスクで使用する有効な Doris セッション変数を設定します。 |
| `s3.max_batch_files` | `256` | 累積ファイル数がこの値に達するとロードをトリガーします。S3 TVF でのみ使用します。 |
| `s3.max_batch_bytes` | `10737418240` | 累積データサイズがこの値に達するとロードをトリガーします。S3 TVF でのみ使用します。単位はバイトで、有効な範囲は 104857600 から 10737418240 までです。 |
| `offset` | - | S3 Streaming Job の作成時にソースの開始位置を設定します。MySQL/PostgreSQL の初期位置はソースパラメータで設定する必要があります。`ALTER JOB` で CDC の進行位置をリセットできるのは、具体的な JSON オフセットを指定した場合のみです。 |

`type`、`table`、`include_delete_sign` を含む CDC Stream TVF のすべてのパラメータについては、[CDC Stream](../../sql-functions/table-valued-functions/cdc-stream.md)を参照してください。

## 権限制御

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限        | オブジェクト | 備考                                              |
|:------------|:------------|:--------------------------------------------------|
| LOAD_PRIV   | データベース | 現在、この操作でサポートされるのは **LOAD** 権限のみです |

## 注意事項

- TASK は最新の 100 件のレコードのみを保持します。

### PROPERTIES の使用方法

`PROPERTIES` を使用すると、スケジューリング間隔の変更やセッション変数の設定など、Job の実行時パラメータを構成できます。

```sql
CREATE JOB my_job
PROPERTIES (
    "max_interval" = "30",
    "session.insert_max_filter_ratio" = "0.5"
)
ON STREAMING
DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
);
```

## 例

### TVF モード

- S3 の指定したディレクトリ内のファイルを継続的に監視し、CSV ファイルのデータを db1.tbl1 にインポートするジョブを作成します。

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

- CDC Stream TVF を使用して、MySQL の単一テーブルを Doris に継続的に同期するジョブを作成します。

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

- CDC Stream TVF を使用して、PostgreSQL の単一テーブルを Doris に継続的に同期するジョブを作成します。

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

- MySQL 上流の user_info テーブルと order_info テーブルを、最初から target_test_db データベースに同期するジョブを作成します。

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

- PostgreSQL 上流の test_tbls テーブルから、増分データを target_test_db データベースに継続的に同期するジョブを作成します。

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

| パラメータ                           | デフォルト | 説明                                        |
| -------------------------------------- | ------- | ------------------------------------------- |
| max_streaming_job_num                  | 1024    | Streaming Job の最大数                       |
| job_streaming_task_exec_thread_num     | 10      | StreamingTask 用のスレッド数                  |
| max_streaming_task_show_count          | 100     | メモリ内に保持する StreamingTask レコードの最大数 |
