---
{
    "title": "CREATE STREAMING JOB",
    "language": "ja",
    "description": "CREATE STREAMING JOB を使用して、TVF からデータを継続的に取り込むか、MySQL および PostgreSQL のテーブルを Doris に同期します。"
}
---

## 説明 {#description}

Doris Streaming Job は、Job アプローチに基づく継続的なインポートタスクです。Job の送信後、Doris はインポートジョブを継続的に実行し、TVF または上流データソースをリアルタイムでクエリして、データを Doris テーブルに書き込みます。

次の 2 つのモードがサポートされています。

- **TVF モード**：`DO INSERT INTO ... SELECT FROM TVF()` 構文を使用して、TVF データを指定した単一の Doris テーブルに継続的に書き込みます。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートします。
- **マルチテーブル CDC モード**：`FROM <sourceType> TO DATABASE` 構文を使用して、上流データベースの複数のテーブルから全量データと増分データを Doris に継続的に同期し、初回同期時に下流テーブルを自動的に作成します。

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
> データベース内のイベントを一意に識別するジョブ名です。ジョブ名はグローバルに一意である必要があります。同じ名前のジョブがすでに存在する場合はエラーが報告されます。

**2. `<Insert_Command>`**（TVF モード）
> DO 句は、ジョブがトリガーされたときに実行する操作、つまり INSERT INTO SELECT FROM TVF ステートメントを指定します。[S3 TVF](../../sql-functions/table-valued-functions/s3.md) と [CDC Stream TVF](../../sql-functions/table-valued-functions/cdc-stream.md) をサポートします。

**3. `<sourceType>`**（マルチテーブル CDC モード）
> サポートされるデータソースの種類は、現在 `MYSQL` と `POSTGRES` です。

**4. `<source_property>`**（マルチテーブル CDC モード）

| パラメータ | 適用ソース | デフォルト | 説明 |
| --- | --- | --- | --- |
| `jdbc_url` | MySQL、PostgreSQL | - | 必須。JDBC 接続文字列。 |
| `driver_url` | MySQL、PostgreSQL | - | 必須。JDBC ドライバー jar のパス。 |
| `driver_class` | MySQL、PostgreSQL | - | 必須。JDBC ドライバークラス名。 |
| `user` | MySQL、PostgreSQL | - | 必須。データベースユーザー名。 |
| `password` | MySQL、PostgreSQL | - | 必須。データベースパスワード。 |
| `database` | MySQL、PostgreSQL | - | 必須。上流データベース名。PostgreSQL では JDBC URL のデータベース名と一致する必要があります。 |
| `schema` | PostgreSQL | - | 必須。PostgreSQL スキーマ名。 |
| `include_tables` | MySQL、PostgreSQL | - | 同期するテーブル名をカンマで区切って指定します。設定しない場合、データベースまたはスキーマ内のすべてのテーブルが同期されます。 |
| `exclude_tables` | MySQL、PostgreSQL | - | 同期しないテーブル名をカンマで区切って指定します。このパラメータは `include_tables` が設定されていない場合にのみ有効です。 |
| `table.<table_name>.target_table` | MySQL、PostgreSQL | ソーステーブル名 | ソーステーブルの Doris ターゲットテーブル名を設定します。 |
| `table.<table_name>.exclude_columns` | MySQL、PostgreSQL | - | ソーステーブルのキー以外の列をカンマで区切って除外します。 |
| `offset` | MySQL、PostgreSQL | `latest` | 起動オフセット。`initial`、`snapshot`、`latest`、および正確な JSON オフセットをサポートします。MySQL では `earliest` もサポートします。 |
| `snapshot_split_size` | MySQL、PostgreSQL | `40960`（4.1.4 より前は `8096`） | フルスナップショットの分割サイズ（行数）。正の整数である必要があります。 |
| `snapshot_parallelism` | MySQL、PostgreSQL | `1` | 全量同期フェーズで Task が一度にスケジュールできる分割の最大数。正の整数である必要があります。 |
| `ssl_mode` | MySQL、PostgreSQL | `disable` | SSL モード。有効な値は `disable`、`require`、`verify-ca` です。 |
| `ssl_rootcert` | MySQL、PostgreSQL | - | `FILE:<file_name>` 形式の CA 証明書ファイル。`ssl_mode=verify-ca` の場合は必須です。 |
| `server_id` | MySQL | 自動生成 | MySQL CDC リーダーのサーバー ID。`5400` のような単一値、または `5400-5408` のような閉区間を指定できます。区間の幅は `snapshot_parallelism` 以上である必要があります。 |
| `slot_name` | PostgreSQL | `doris_cdc_<job_id>` | 論理レプリケーションスロット名。カスタムスロットは事前に作成し、ユーザーが管理する必要があります。 |
| `publication_name` | PostgreSQL | `doris_pub_<job_id>` | パブリケーション名。カスタムパブリケーションは事前に作成し、同期対象のすべてのテーブルを含め、ユーザーが管理する必要があります。 |

> バージョンに関する注意：`table.<table_name>.target_table`、`table.<table_name>.exclude_columns`、`offset=snapshot`、`ssl_mode`、`ssl_rootcert`、`server_id`、`slot_name`、`publication_name` はバージョン 4.1.0 以降でサポートされています。

`include_tables` と `exclude_tables` の両方を設定した場合は、`include_tables` が優先されます。`slot_name` と `publication_name` に含められるのは小文字、数字、アンダースコアだけです。数字で始めることはできず、長さは 63 文字に制限されます。ソースごとの完全な相違点、JSON オフセット形式、SSL 証明書の設定については、[自動テーブル作成付き MySQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-mysql-database.md) と [自動テーブル作成付き PostgreSQL CDC](../../../data-operate/import/import-way/streaming-job/continuous-load-postgresql-database.md) を参照してください。

**5. `<target_db>`**（マルチテーブル CDC モード）
> インポート先の Doris ターゲットデータベース名。

**6. `<target_property>`**（マルチテーブル CDC モード）

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `table.create.properties.*` | - | Doris がテーブルを作成するときにテーブルプロパティを追加します。たとえば `table.create.properties.replication_num` です。 |
| `load.strict_mode` | `false` | Stream Load 書き込みで厳密モードを有効にするかどうか。有効な値は `true` と `false` です。 |
| `load.max_filter_ratio` | `0` | サンプリングウィンドウで許可される最大フィルター率。範囲は `[0, 1]` です。サンプリングウィンドウは `max_interval * 10` 秒です。ウィンドウ内のエラー行比率がこの値を超えると、ジョブは一時停止します。 |

## オプションパラメータ {#optional-parameters}

**1. `<job_property>`**

| パラメータ | デフォルト | 説明 |
| --- | --- | --- |
| `max_interval` | `10` | 新しい上流ファイルまたはデータがない場合のアイドルスケジューリング間隔（秒）。1 以上の整数である必要があります。 |
| `compute_group` | 現在のセッションまたはユーザーのデフォルトコンピュートグループ | コンピュートとストレージの分離モードでのみサポートされます。ジョブを実行するコンピュートグループを指定します。ユーザーはそのコンピュートグループに対する USAGE 権限を持っている必要があります。 |
| `session.<variable_name>` | 対応するセッション変数のデフォルト値 | TVF モードでのみサポートされます。INSERT タスクに有効な Doris セッション変数を設定します。 |
| `s3.max_batch_files` | `256` | 累積ファイル数がこの値に達するとロードをトリガーします。S3 TVF でのみ使用されます。 |
| `s3.max_batch_bytes` | `10737418240` | 累積データサイズがこの値に達するとロードをトリガーします。S3 TVF でのみ使用されます。単位はバイトで、有効範囲は 104857600 から 10737418240 です。 |
| `offset` | - | S3 Streaming Job の作成時にソースの開始位置を設定します。MySQL/PostgreSQL の初期位置はソースパラメータで設定する必要があります。`ALTER JOB` によって CDC の進行状況をリセットできるのは、正確な JSON オフセットだけです。 |

`type`、`table`、`include_delete_sign` を含む CDC Stream TVF のすべてのパラメータについては、[CDC Stream](../../sql-functions/table-valued-functions/cdc-stream.md) を参照してください。

## 権限制御 {#privilege-control}

この SQL コマンドを実行するユーザーは、少なくとも次の権限を持っている必要があります。

| 権限 | オブジェクト | 注記 |
|:------------|:------------|:--------------------------------------|
| LOAD_PRIV   | データベース | 現在、この操作でサポートされているのは **LOAD** 権限だけです |

## 注意事項 {#notes}

- TASK に保持されるレコードは最新の 100 件だけです。

### PROPERTIES の使用方法 {#properties-usage}

`PROPERTIES` を使用して、スケジューリング間隔の変更やセッション変数の設定など、Job の実行パラメータを構成します。

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
