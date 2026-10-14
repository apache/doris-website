---
{
    "title": "S3",
    "language": "ja",
    "description": "Job と S3 TVF を使用して S3 オブジェクトストレージのファイルデータを Doris テーブルに継続的かつ増分で取り込み、自動ポーリング、増分検出、バッチ書き込みを行う方法を説明します。",
    "keywords": [
        "Doris の S3 継続的なインポート",
        "S3 増分インポート",
        "S3 TVF Streaming Job",
        "オブジェクトストレージの増分同期",
        "CSV の Doris への継続的なインポート",
        "CREATE STREAMING JOB S3"
    ]
}
---

<!-- Knowledge type: Procedure + Configuration parameters -->
<!-- Applicable scenario: Continuous/incremental loading from S3 object storage into Doris -->

Doris では **Job + S3 TVF** を使用して継続的なインポートジョブを作成できます。S3 ディレクトリに新しいファイルが継続的に生成され、Doris テーブルへ増分同期する必要がある場合に適しています。

Job を登録すると、Doris はインポートジョブを実行し続け、一定の頻度で S3 ディレクトリをポーリングして、S3 TVF クエリが返す新しいファイルのデータを Doris テーブルに書き込みます。

代表的な利用シーンは次のとおりです。

-   ログやイベントトラッキングなどから継続的に生成される CSV、JSON、Parquet ファイルを Doris に同期する。
-   上流の ETL が S3 ディレクトリに分割ファイルを書き込み続けており、下流のデータウェアハウスに自動で取り込む。
-   運用上の負担を抑えながら、S3 から Doris への増分取り込みを自動化する。

## 基本原理 {#basic-principles}

Doris は指定した S3 ディレクトリ内のファイルを走査してファイルリストに分割し、そのファイルリストを**小さなバッチ**に分けて Doris テーブルに書き込みます。

### 増分読み取りモード {#incremental-read-mode}

タスクの作成後、Doris は指定したパスからデータを読み取り続け、一定の頻度で新しいファイルをポーリングします。

新しいファイルを識別するルールは次のとおりです。

-   新しいファイルの名前は、最後に取り込んだファイルの名前よりも**辞書順で大きい**必要があります。それ以外の場合、新しいファイルとして認識されません。
-   たとえば、`file1`、`file2`、`file3` が順に生成された場合は、その順番で取り込まれます。その後に `file0` を追加しても、取り込み済みの `file3` より辞書順で小さいため、**Doris はこのファイルを取り込みません**。

:::tip ファイル名の推奨事項
追加されたファイルが正しく認識されるように、タイムスタンプや単調増加する連番など、名前が単調に増加する方式を使用してください（例: `2025-09-22-001.csv`）。
:::

## クイックスタート {#quick-start}

継続的なインポートの一連の手順は、通常次のとおりです。

1.  `CREATE JOB ... ON STREAMING` を使用して継続的なインポートジョブを作成します。
2.  `jobs()` テーブル関数を使用して、インポートの状態と進捗を確認します。
3.  必要に応じて `ALTER JOB` を使用し、ジョブのパラメータまたは SQL を変更します。
4.  一時停止、再開、削除などの管理操作には、[継続的なインポートの概要](./continuous-load-overview.md) に記載された共通操作を使用します。

### ステップ 1: インポートジョブを作成する {#step-1-create-a-load-job}

[CREATE STREAMING JOB](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md) を使用して、継続的なインポートジョブを作成します。

S3 ディレクトリに CSV 拡張子のファイルが定期的に生成される場合、次の Job を作成できます。

```SQL
CREATE JOB my_job 
ON STREAMING
DO 
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

### ステップ 2: インポート状態を確認する {#step-2-view-the-load-status}

`jobs()` テーブル関数を使用して、STREAMING タイプのジョブの実行状態を確認します。

```SQL
select * from jobs("type"="insert") where ExecuteType = "STREAMING"
               Id: 1758538737484
             Name: my_job1
          Definer: root
      ExecuteType: STREAMING
RecurringStrategy: \N
           Status: RUNNING
       ExecuteSql: INSERT INTO test.`student1`
SELECT * FROM S3
(
    "uri" = "s3://bucket/s3/demo/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "s3.endpoint" = "https://s3.ap-southeast-1.amazonaws.com",
    "s3.region" = "ap-southeast-1",
    "s3.access_key" = "",
    "s3.secret_key" = ""
)
       CreateTime: 2025-09-22 19:24:51
 SucceedTaskCount: 1
  FailedTaskCount: 0
CanceledTaskCount: 0
          Comment: \N
       Properties: \N
    CurrentOffset: {"fileName":"s3/demo/test/1.csv"}
        EndOffset: {"fileName":"s3/demo/test/1.csv"}
    LoadStatistic: {"scannedRows":20,"loadBytes":425,"fileNumber":2,"fileSize":256}
         ErrorMsg: \N
    JobRuntimeMsg: \N
```

主なフィールドの意味は次のとおりです。

| フィールド | 意味 |
| ---------- | ---- |
| Status | ジョブの状態。一般的な値: `RUNNING`、`PAUSED`、`STOPPED` |
| CurrentOffset | 処理済みの最新のファイル名（増分処理の進捗） |
| EndOffset | 現在のバッチの終点となるファイル名 |
| LoadStatistic | 累積のスキャン行数、バイト数、ファイル数、ファイルサイズ |
| SucceedTaskCount | 正常に実行されたサブタスクの数 |
| FailedTaskCount | 失敗したサブタスクの数 |
| ErrorMsg | 失敗時のエラーメッセージ |

### ステップ 3: インポートジョブを変更する {#step-3-modify-the-load-job}

Job の `PROPERTIES` と `INSERT` 文は、同時に変更できます。

```SQL
-- Support modifying Job properties and insert statement
Alter Job jobName
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

一時停止、再開、削除、タスクの表示など、その他の共通操作については、[継続的なインポートの概要](./continuous-load-overview.md) を参照してください。

## リファレンス {#reference}

<!-- Knowledge type: Configuration parameters -->

### ジョブ作成の構文 {#job-creation-syntax}

S3 TVF を使用する継続的なインポートジョブの作成構文は次のとおりです。

```SQL
CREATE JOB <job_name>
[job_properties]
ON STREAMING
[ COMMENT <comment> ]
DO <Insert_Command> 
```

各要素の説明は次のとおりです。

| 要素 | 説明 |
| ---- | ---- |
| job_name | タスク名 |
| job_properties | Job の共通のインポートパラメータを指定するために使用します |
| comment | Job に付けるコメントを指定するために使用します |
| Insert_Command | 実行する SQL。すなわち `INSERT INTO table SELECT * FROM S3()` |

### インポート設定パラメータ {#load-configuration-parameters}

`job_properties` では、次のパラメータを設定できます。

| パラメータ | デフォルト | 説明 |
| ---------- | ---------- | ---- |
| session.\* | なし | `job_properties` ですべてのセッション変数を設定できます。インポート用の変数については、[Insert Into Select](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters) を参照してください |
| s3.max_batch_files | 256 | 累積ファイル数がこの値に達すると、インポートの書き込みが実行されます |
| s3.max_batch_bytes | 10737418240 | 累積データ量（バイト数）がこの値に達すると、インポートの書き込みが実行されます。`10737418240` のようなバイト数の整数のみを指定できます。`10G` のような単位付きの値は使用できません。有効範囲は 100MB～10GB、すなわち 104857600～10737418240 です |
| max_interval | 10 | 上流に新しいファイルやデータがない場合の待機中のスケジューリング間隔（秒）。`10` のように秒数を整数で指定します。`10s` のような単位付きの値は使用できません。1 以上である必要があります |

:::tip バッチ書き込みの実行条件
`s3.max_batch_files` または `s3.max_batch_bytes` のいずれかの条件を満たすと書き込みが実行されます。上流に新しいファイルがない場合は、`max_interval` に従って待機中のポーリングが行われます。
:::

## FAQ {#faq}

<!-- Knowledge type: FAQ -->

### Q1: 新しく追加されたファイルが取り込まれないのはなぜですか？ {#q1-why-are-newly-added-files-not-loaded}

最も一般的な原因は、ファイル名が `CurrentOffset` に記録されたファイル名よりも**辞書順で小さい**ことです。次の点を確認してください。

-   新しいファイルの名前が単調に増加しているか（タイムスタンプや単調増加する連番の使用を推奨します）。
-   `jobs()` で `CurrentOffset` を確認し、新しいファイル名がその値より大きいか。

### Q2: バッチごとのファイル数とデータ量はどのように制御できますか？ {#q2-how-can-i-control-the-number-of-files-and-the-data-volume-per-batch}

`s3.max_batch_files` と `s3.max_batch_bytes` を使用してバッチサイズを制御します。どちらか一方の条件を満たすと、書き込みが実行されます。

### Q3: ジョブが待機中に新しいファイルをポーリングする頻度はどのくらいですか？ {#q3-how-often-does-the-job-poll-for-new-files-when-idle}

`max_interval` で制御します。デフォルトは 10 秒です。`job_properties` で調整できます。

### Q4: CSV 以外の形式にも対応していますか？ {#q4-are-formats-other-than-csv-supported}

はい。`format` パラメータで S3 TVF の形式（`csv`、`json`、`parquet` など）を指定します。使用できる形式は、S3 TVF がサポートする形式によって決まります。

### Q5: 実行中のジョブのインポート SQL はどのように変更できますか？ {#q5-how-do-i-modify-the-load-sql-of-a-running-job}

`ALTER JOB` を使用すると、`PROPERTIES` と `INSERT` 文を同時に変更できます。[ステップ 3: インポートジョブを変更する](#step-3-modify-the-load-job) を参照してください。

## トラブルシューティング {#troubleshooting}

<!-- Knowledge type: Troubleshooting -->

| 症状 | 考えられる原因 | 対処方法 |
| ---- | -------------- | -------- |
| 新しいファイルが取り込まれない | ファイル名が `CurrentOffset` よりも辞書順で小さい | タイムスタンプや単調増加する連番など、名前が単調に増加する方式に変更します |
| ジョブの `Status` が `RUNNING` だが進捗がない | S3 パスに新しいファイルがない | `uri` のワイルドカードが新しいファイルに一致するか確認し、必要に応じて `max_interval` を短くします |
| 認証に失敗する、または S3 にアクセスできない | `s3.access_key`、`s3.secret_key`、その他の設定が正しくない | AK/SK、`region`、`endpoint` が一致しているか確認します。また、IAM 権限で該当するバケットを読み取れることを確認します |
| 単一バッチのインポートが大きすぎる、または遅い | `s3.max_batch_bytes` または `s3.max_batch_files` が大きすぎる | 下流の書き込み能力に合わせてバッチのしきい値を下げます |
| `FailedTaskCount` が増加し続ける | データ形式またはスキーマが一致しない | `ErrorMsg` を確認します。`session.insert_max_filter_ratio` を使用して一部の異常行を許容するか、上流のデータを修正します |

## 関連ドキュメント {#related-documents}

-   [継続的なインポートの概要](./continuous-load-overview.md)
-   [CREATE STREAMING JOB の構文](../../../../sql-manual/sql-statements/job/CREATE-STREAMING-JOB.md)
-   [Insert Into Select のインポート設定パラメータ](../../../../data-operate/import/import-way/insert-into-manual.md#import-configuration-parameters)
