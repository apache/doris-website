---
{
  "title": "STREAMING JOBの作成",
  "description": "Doris Streaming Jobは、Job + TVFアプローチに基づく継続的なインポートタスクです。Jobが送信された後、",
  "language": "ja"
}
---
## デスクリプション

Doris Streaming Jobは、Job + TVFアプローチに基づく継続的なインポートタスクです。Jobが送信された後、Dorisはインポートジョブを継続的に実行し、TVF内のデータをクエリして、リアルタイムでDorisTableに書き込みます。

## Syntax

```SQL
CREATE JOB <job_name>
ON STREAMING
[job_properties]
[ COMMENT <comment> ]
DO <Insert_Command> 
```
## 必須パラメータ

**1. `<job_name>`**
> ジョブ名はデータベース内でイベントを一意に識別するために使用されます。ジョブ名はグローバルに一意である必要があり、同じ名前のジョブが既に存在する場合はエラーが発生します。

**3. `<sql_body>`**
> DO句は、ジョブがトリガーされた時に実行される操作、つまりSQL文を指定します。現在、S3 TVFのみサポートしています。

## オプションパラメータ

**1. `<job_properties>`**
| パラメータ | デフォルト値 | 説明 |
| ------------------ | ------ | ------------------------------------------------------------ |
| session.* | None | job_propertiesで全てのセッション変数の設定をサポート |
| s3.max_batch_files | 256 | 累積ファイル数がこの値に達した時にインポート書き込みをトリガー |
| s3.max_batch_bytes | 10G | 累積データ量がこの値に達した時にインポート書き込みをトリガー |
| max_interval | 10s | 上流で新しいファイルやデータの追加がない時のアイドルスケジューリング間隔 |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：
| 権限 | オブジェクト | 備考 |
|:--------------|:-----------|:------------------------|
| LOAD_PRIV | Database (DB) | 現在、この操作を実行するために**LOAD**権限のみサポート |

## 使用上の注意

- TASKは最新の100レコードのみを保持します。
- 現在、**INSERT internal table Select * From S3(...)**操作のみサポートしており、将来的により多くの操作がサポートされる予定です。

## 例

- S3の指定されたディレクトリ内のファイルを継続的に監視し、.csvで終わるファイルからdb1.tbl1にデータをインポートするmy_jobという名前のジョブを作成する。

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
## CONFIG

**fe.conf**

| パラメータ | Default Values ​​| |
| ------------------------------------ | ------ | ------------------------------------------- |
| max_streaming_job_num | 1024 | Streamingジョブの最大数 |
| job_streaming_task_exec_thread_num | 10 | StreamingTaskの実行に使用されるスレッド数 |
| max_streaming_task_show_count | 100 | StreamingTaskがメモリに保持するタスク実行記録の最大数 |
