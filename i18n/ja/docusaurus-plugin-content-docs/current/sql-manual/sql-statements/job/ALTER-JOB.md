---
{
    "title": "ALTER JOB",
    "language": "ja",
    "description": "ALTER JOB を使用して、一時停止中のストリーミングジョブの実行時プロパティや SQL を変更したり、MySQL または PostgreSQL の CDC 処理位置を正確な JSON オフセットにリセットしたりできます。"
}
---

## 説明

ストリーミングジョブの実行時プロパティ、実行する SQL、または自動テーブル作成同期（Auto Table Creation Sync）の設定を変更します。変更できるのは `PAUSED` 状態のストリーミングジョブだけで、各文では少なくとも一つの実際の変更を指定する必要があります。

## 構文

```sql
ALTER JOB <job_name>
[
    PROPERTIES (<job_property>[, ...])
]
[
    <Insert_Command>
    | FROM <source_type> (<source_property>[, ...])
      TO DATABASE <target_db> (<target_property>[, ...])
]
```

## 必須パラメータ

**1. `<job_name>`**
> 変更するジョブの名前。

## 任意のパラメータ

**1. `<job_property>`**
> `max_interval`、`compute_group`、`session.*` などのジョブプロパティを変更します。また、JSON 形式の `offset` を指定して CDC 処理位置をリセットできます。

**2. `<Insert_Command>`**
> TVF モードのジョブが実行する INSERT SQL を変更します。`DO` キーワードは `ALTER JOB` で使用しないでください。

**3. `<source_property>` と `<target_property>`**
> 自動テーブル作成同期のソース側またはターゲット側のプロパティを変更します。データソースの種類とターゲットデータベースは変更できません。

:::note
自動テーブル作成同期では、`jdbc_url`、`database`、`schema`、`include_tables`、`exclude_tables`、ソース側の `offset`、`snapshot_split_size`、`snapshot_parallelism`、テーブルごとのマッピングパラメータ、`slot_name`、`publication_name` を変更できません。CDC 処理位置をリセットするには、ジョブプロパティの `offset` を使用してください。

CDC Stream TVF モードでは、ターゲットテーブル、TVF の種類、`type`、`jdbc_url`、`database`、`schema`、`table`、`snapshot_split_size`、`snapshot_parallelism`、`slot_name`、`publication_name` を変更できません。INSERT SQL を変更することで、認証情報やドライバーなど、変更可能なパラメータを切り替えられます。
:::

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | ジョブタイプ | 備考 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | データベース (DB) | Streaming | **LOAD** 権限でこの操作を実行できます |

## 例

- my_job のセッション変数を変更する

   ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    );
    ```
- my_job の SQL 文を変更する

   ```sql
    ALTER JOB my_job
    INSERT INTO db1.tbl1 
    SELECT * FROM S3
    (
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ```  

- my_job のプロパティと SQL 文を同時に変更する。

    ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    INSERT INTO db1.tbl1 
    select * from S3(
        "uri" = "s3://bucket/*.csv",
        "s3.access_key" = "<s3_access_key>",
        "s3.secret_key" = "<s3_secret_key>",
        "s3.region" = "<s3_region>",
        "s3.endpoint" = "<s3_endpoint>",
        "format" = "<format>"
    );
    ``` 

- S3 ジョブ my_job の同期進捗を変更する

```sql
ALTER JOB my_job
PROPERTIES(
    'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
);
```

- MySQL CDC ジョブを正確な Binlog オフセットにリセットする

```sql
ALTER JOB mysql_cdc_job
PROPERTIES (
    "offset" = '{"file":"binlog.000001","pos":"154"}'
);
```

- PostgreSQL CDC ジョブを正確な LSN にリセットする

```sql
ALTER JOB pg_cdc_job
PROPERTIES (
    "offset" = '{"lsn":"12345678"}'
);
```

CDC 処理位置を変更できるのは、ジョブが `PAUSED` 状態のときだけです。`offset` プロパティに指定できるのは、上記の形式の正確な JSON オフセットだけです。`initial`、`snapshot`、`earliest`、`latest` は指定できません。
