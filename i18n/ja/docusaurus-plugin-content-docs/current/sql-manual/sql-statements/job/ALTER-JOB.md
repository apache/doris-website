---
{
    "title": "ALTER JOB",
    "language": "ja",
    "description": "ALTER JOB を使用して、一時停止中の Streaming Job を更新し、実行時プロパティまたは SQL を変更し、MySQL または PostgreSQL CDC の進行状況を正確な JSON オフセットにリセットします。"
}
---

## 説明 {#description}

Streaming Job の実行時プロパティ、実行 SQL、または Auto Table Creation Sync 構成を変更します。`PAUSED` 状態の Streaming Job のみ変更でき、各ステートメントでは少なくとも 1 つの実際の変更を指定する必要があります。

## 構文 {#syntax}

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

## 必須パラメータ {#required-parameters}

**1. `<job_name>`**
> 変更する Job の名前。

## オプションパラメータ {#optional-parameters}

**1. `<job_property>`**
> `max_interval`、`compute_group`、`session.*` などの Job プロパティを変更するか、JSON の `offset` を使用して CDC の位置をリセットします。

**2. `<Insert_Command>`**
> TVF モードの Job が実行する INSERT SQL を変更します。`DO` キーワードは `ALTER JOB` では使用しないでください。

**3. `<source_property>` と `<target_property>`**
> Auto Table Creation Sync のソース側またはターゲット側のプロパティを変更します。データソースの種類とターゲットデータベースは変更できません。

:::note
Auto Table Creation Sync では、`jdbc_url`、`database`、`schema`、`include_tables`、`exclude_tables`、ソース側の `offset`、`snapshot_split_size`、`snapshot_parallelism`、テーブルごとのマッピングパラメータ、`slot_name`、`publication_name` を変更できません。CDC の位置をリセットするには、Job Property `offset` を使用してください。

CDC Stream TVF モードでは、ターゲットテーブル、TVF タイプ、`type`、`jdbc_url`、`database`、`schema`、`table`、`snapshot_split_size`、`snapshot_parallelism`、`slot_name`、`publication_name` を変更できません。認証情報、ドライバー、その他の変更可能なパラメータをローテーションするには、INSERT SQL を変更できます。
:::

## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | Job タイプ | 注記 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | Database (DB) | Streaming | この操作を実行するための **LOAD** 権限をサポートします |

## 例 {#examples}

- my_job のセッション変数を変更する

   ```sql
    ALTER JOB my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5"
    );
    ```
- my_job の SQL ステートメントを変更する

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

- my_job の Properties と SQL ステートメントを同時に変更する

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

- S3 Job my_job の同期進行状況を変更する

```sql
ALTER JOB my_job
PROPERTIES(
    'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
);
```

- MySQL CDC Job を正確な Binlog オフセットにリセットする

```sql
ALTER JOB mysql_cdc_job
PROPERTIES (
    "offset" = '{"file":"binlog.000001","pos":"154"}'
);
```

- PostgreSQL CDC Job を正確な LSN にリセットする

```sql
ALTER JOB pg_cdc_job
PROPERTIES (
    "offset" = '{"lsn":"12345678"}'
);
```

CDC の位置を変更できるのは、Job が `PAUSED` 状態にある間だけです。`offset` プロパティには、上記の形式の正確な JSON オフセットのみ指定できます。`initial`、`snapshot`、`earliest`、`latest` は指定できません。
