---
{
    "title": "S3 ワンタイム取り込み",
    "sidebar_label": "ワンタイム取り込み",
    "language": "ja",
    "description": "Doris Streaming Job を使用して準備済みの S3 ファイルセットをバッチ単位で取り込みます。SQL、完了状態、リカバリ、ソースの安定性要件を含みます。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "ワンタイム取り込み"
    ]
}
---

:::caution 実験的機能

S3 ワンタイム取り込みは実験的機能であり、Doris 4.1.6 以降でサポートされます。

:::

ワンタイム取り込みでは `ONE_TIME` を使用し、一致する S3 ファイルを既存の Doris テーブルにバッチ単位で取り込みます。最後のバッチがコミットされると、ジョブは `FINISHED` になります。履歴データの初期化、一度だけのオフラインロード、または別のプレフィックスでのバックフィルに適しています。

作成前にすべてのファイルを準備し、取り込み中はソースパスを安定した状態に保ちます。完了したジョブは後から追加されるファイルを待ちません。継続的な取り込みには、[順序付き取り込み](./continuous-load-s3-ordered.md) または [通知取り込み](./continuous-load-s3-notification.md) を選択してください。

## クイックスタート {#quick-start}

### 手順 1：対象テーブルとファイルを準備する {#step-1-prepare-the-target-table-and-files}

実行アカウントには対象テーブルへの `LOAD` 権限と、データベースおよびテーブルを作成するための対応する権限が必要です。S3 認証情報には `s3:ListBucket` と `s3:GetObject` が必要です。Doris ノードから S3 エンドポイントにアクセスできなければなりません。

```sql
CREATE DATABASE IF NOT EXISTS db1;
CREATE TABLE db1.tbl1 (
    id INT,
    name STRING
)
DUPLICATE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

この例では、単一 BE クラスターで単一レプリカを使用します。レプリカ数は本番クラスターに合わせて設定してください。次の内容を `s3://bucket/001.csv` としてアップロードし、SQL 内のバケット、エンドポイント、Region、認証情報を実際の値に置き換えてください。

```text
1,Alice
2,Bob
```

### 手順 2：ジョブを作成する {#step-2-create-the-job}

```sql
CREATE JOB s3_one_time_job
PROPERTIES (
    "s3.ingestion_mode" = "ONE_TIME",
    "s3.max_batch_files" = "256",
    "s3.max_batch_bytes" = "10737418240"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://bucket/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.region" = "<s3_region>",
    "s3.endpoint" = "<s3_endpoint>",
    "s3.access_key" = "<s3_access_key>",
    "s3.secret_key" = "<s3_secret_key>"
);
```

## 完了の確認 {#check-completion}

ジョブのステータスを照会します：

```sql
SELECT Name, ExecuteType, Status
FROM jobs("type" = "insert")
WHERE Name = 's3_one_time_job';
```

期待される結果：

```text
Name             ExecuteType  Status
s3_one_time_job  STREAMING    FINISHED
```

`SELECT * FROM db1.tbl1 ORDER BY id;` を実行します。期待される結果：

```text
id  name
1   Alice
2   Bob
```

## 制限事項とリカバリ {#limitations-and-recovery}

`ONE_TIME` の作成時にディレクトリスナップショットは取得されません。ファイルをバッチ単位で一覧表示し、最後のバッチがコミットされた後に停止します。コミット済みカーソルより前に追加されたファイルはバックフィルされません。ジョブを作成する前にすべてのソースファイルを準備し、取り込み中はそのパス配下のオブジェクトへの書き込みや上書きを停止してください。FE の再起動後、ジョブはコミット済みの進行状況から再開し、消費が完了すると `FINISHED` になります。

## パラメータ {#parameters}

Job の `PROPERTIES` で次の項目を設定します。S3 接続、認証情報、ファイル形式のオプションは `S3(...)` に指定します。

| パラメータ | 型 | デフォルト | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 文字列 | `ORDERED_LIST` | はい | `ONE_TIME` に設定します。作成後は変更できません。 |
| `s3.max_batch_files` | 正の整数 | `256` | いいえ | バッチごとのファイル数のしきい値。 |
| `s3.max_batch_bytes` | 整数 | `10737418240` | いいえ | バッチごとのバイト数のしきい値。`104857600` から `10737418240` の範囲です。単位の接尾辞は使用できません。 |
| `max_interval` | 正の整数 | `10` | いいえ | アイドル状態のスケジューリング間隔（秒）。 |

`offset`、`s3.event.source`、`s3.sqs.queue_url` は設定しないでください。`max_interval` によって、完了したジョブが追加ファイルを待機し続けることはありません。セッション設定については [INSERT INTO SELECT](../insert-into-manual.md#import-configuration-parameters) を参照してください。

取り込みモードと S3 URI は作成後に変更できません。モードまたはパスを変更するには、別のジョブを作成してください。

## トラブルシューティングとベストプラクティス {#troubleshooting-and-best-practices}

- **作成に失敗する場合：** S3 TVF のスキーマ推論用に、一致する読み取り可能な空でないファイルが存在することを確認してください。
- **ジョブが完了しない場合：** `Status`、`ErrorMsg`、失敗したタスクを確認します。読み取り不能なオブジェクトや形式エラーにより、バッチをコミットできないことがあります。
- **完了後に新しいファイルが読み取られない場合：** `FINISHED` は終端状態です。以前のデータを再度取り込まないよう、次のバッチを別のプレフィックスに配置して新しいジョブを作成します。
- **通知取り込みと組み合わせる場合：** 履歴データと受信データに重複しないプレフィックスを使用するか、アプリケーション側で重複するオブジェクトや重複データを処理します。

一時停止、再開、タスクの確認については [継続的取り込みの概要](./continuous-load-overview.md) を参照してください。ジョブの変更については [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md) を参照してください。
