---
{
    "title": "ALTER JOB",
    "language": "ja",
    "description": "ユーザーはジョブを変更できます。変更できるのは、PAUSE 状態の Streaming タイプのジョブのみです。"
}
---

## 説明

ユーザーはジョブを変更できます。変更できるのは、PAUSE 状態の Streaming タイプのジョブのみです。

## 構文

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command> 
```

## 必須パラメータ

**1. `<job_name>`**
> 変更対象のジョブ名。

## 任意のパラメータ

**1. `<job_properties>`**
> ジョブの属性を変更します。

**1. `<Insert_Command>`**
> ジョブが実行する SQL を変更します。


## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | ジョブタイプ | 備考 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | データベース (DB) | Streaming | この操作は **LOAD** 権限で実行できます |

## 例

- my_job のセッション変数を変更する

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    ```
- my_job の SQL 文を変更する

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

- my_job のプロパティと SQL 文を同時に変更する。

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

- my_job の同期進捗を変更する

    ```sql
        Alter JOB my_job
        PROPERTIES(
            'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
        )
    ```
