---
{
    "title": "ALTER JOB",
    "language": "ja",
    "description": "ユーザーはジョブを変更できます。PAUSE 状態のジョブのみ変更でき、Streaming タイプのジョブのみ変更できます。"
}
---

## 説明 {#description}

ユーザーはジョブを変更できます。PAUSE 状態のジョブのみ変更でき、Streaming タイプのジョブのみ変更できます。

## 構文 {#syntax}

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command>
```

## 必須パラメータ {#required-parameters}

**1. `<job_name>`**
> ジョブ名を変更します。

## オプションパラメータ {#optional-parameters}

**1. `<job_properties>`**
> ジョブの属性を変更します。

**1. `<Insert_Command>`**
> ジョブが実行する SQL を変更します。


## アクセス制御要件 {#access-control-requirements}

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です：

| 権限 | オブジェクト | ジョブタイプ | 注記 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | データベース (DB) | Streaming | **LOAD** 権限を使用してこの操作を実行できます |

## 例 {#examples}

- my_job のセッション変数を変更する

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5"
    )
    ```
- my_job の SQL ステートメントを変更する

   ```SQL
    Alter Job my_job
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

- my_job の Properties と SQL ステートメントを同時に変更する。

    ```SQL
    Alter Job my_job
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
    )
    ```

- my_job の同期の進捗を変更する

    ```sql
        Alter JOB my_job
        PROPERTIES(
            'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
        )
    ```
