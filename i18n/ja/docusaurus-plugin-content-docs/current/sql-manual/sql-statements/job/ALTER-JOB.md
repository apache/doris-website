---
{
  "title": "ALTER JOB",
  "language": "ja",
  "description": "ユーザーはジョブを変更できます。PAUSE状態のジョブのみが変更可能で、Streamingタイプのジョブのみが変更できます。"
}
---
## 説明

ユーザーはジョブを変更できます。PAUSE状態のジョブのみが変更可能で、Streamingタイプのジョブのみが変更できます。

## 構文

```SQL
Alter Job <job_name>
[job_properties]
DO <Insert_Command> 
```
## 必須パラメータ

**1. `<job_name>`**
> ジョブのジョブ名を変更します

## オプションパラメータ

**1. `<job_properties>`**
> ジョブの属性を変更します。

**1. `<Insert_Command>`**
> ジョブによって実行されるSQLを変更します。


## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | ジョブタイプ | 注記 |
|:--------------|:-----------|:------------------------|:------------------------|
| LOAD_PRIV | Database (DB) | Streaming | この操作を実行するために**LOAD**権限をサポートします |

## 例

- my_jobのセッション変数を変更する

   ```SQL
    Alter Job my_job
    PROPERTIES(
    "session.insert_max_filter_ratio"="0.5" 
    )
    ```
- my_job のSQL文を変更する

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
- my_jobのPropertiesとSQL文を同時に変更します。

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
- my_jobの同期進捗を変更する

    ```sql
        Alter JOB my_job
        PROPERTIES(
            'offset' = '{"fileName":"regression/load/data/example_0.csv"}'
        )
    ```
