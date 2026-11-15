---
{
    "title": "S3 通知取り込み",
    "sidebar_label": "通知取り込み",
    "language": "ja",
    "description": "専用の SQS キューと Doris Streaming Job を使用して S3 ファイルを取り込みます。AWS の設定、IAM ポリシー、SQL、監視、配信に関する制限を含みます。",
    "keywords": [
        "Doris S3",
        "Streaming Job",
        "通知取り込み"
    ]
}
---

:::caution 実験的機能

S3 通知取り込みは実験的機能であり、Doris 4.1.6 以降でサポートされます。

:::

通知取り込みでは `NOTIFICATION` を使用して SQS から S3 オブジェクト作成イベントを消費し、新しいファイルを Doris に継続的に取り込みます。UUID 形式のファイル名や、任意の順序で到着するファイルに適しており、ファイル名の順序に依存しません。

**同じ Region にある S3 から SQS Standard Queue へ直接送信された AWS S3 通知のみ**サポートされます。各ジョブには専用キューが必要です。履歴オブジェクトはスキャンもバックフィルもされません。エンドツーエンドの配信は at-least-once です。つまり、同じオブジェクトが複数回取り込まれる可能性があり、ファイルの取り込み順序も保証されません。

## クイックスタート {#quick-start}

この例では、`s3://example-bucket/data/*.csv` と `us-east-1` を使用します。バケット、アカウント、キュー、認証情報を実際の値に置き換えてください。

### Doris のターゲットテーブルを準備する {#prepare-the-doris-target-table}

アカウントにはターゲットテーブルに対する `LOAD` 権限と、対応するデータベースおよびテーブル作成権限が必要です。他の例との重複を避けるため、独立した空のテーブルを使用してください。

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

この単一 BE の例ではレプリカを 1 つ使用します。本番環境ではレプリカ数を調整してください。

### 手順 1：SQS Standard Queue を作成する {#step-1-create-an-sqs-standard-queue}

S3 バケットと**同じ Region** に Standard Queue を作成し、その URL と ARN を記録します。停止や障害に対応できるよう、14 日間のメッセージ保持期間を推奨します。保持期間が過ぎると、SQS はメッセージを削除します。

### 手順 2：S3 に通知の送信を許可する {#step-2-allow-s3-to-send-notifications}

次のステートメントをキューのアクセス ポリシーに統合し、アカウント、バケット、キューの識別子を置き換えます。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowS3ToSendMessage",
      "Effect": "Allow",
      "Principal": {"Service": "s3.amazonaws.com"},
      "Action": "sqs:SendMessage",
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>",
      "Condition": {
        "ArnEquals": {"aws:SourceArn": "arn:aws:s3:::example-bucket"},
        "StringEquals": {"aws:SourceAccount": "<account-id>"}
      }
    }
  ]
}
```

### 手順 3：Doris にアクセス権を付与する {#step-3-grant-doris-access}

ジョブの IAM ユーザーまたはロールに、次の権限を付与します。FE には SQS と S3 へのアクセスが必要で、BE には S3 オブジェクトの読み取りが必要です。AssumeRole を使用する場合は、STS への接続性も必要です。

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::example-bucket"
    },
    {
      "Effect": "Allow",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::example-bucket/data/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:ChangeMessageVisibility"
      ],
      "Resource": "arn:aws:sqs:us-east-1:<account-id>:<queue-name>"
    }
  ]
}
```

### 手順 4：S3 イベント通知を設定する {#step-4-configure-s3-event-notifications}

バケットの Event notifications でルールを作成します。

- **All object create events**（`s3:ObjectCreated:*`）を選択します。
- Prefix に `data/`、Suffix に `.csv` を指定します。ワイルドカードは使用しません。このルールはジョブの URI パターンをカバーする必要があります。
- 宛先として SQS キューを選択します。SNS エンベロープを使わず、S3 メッセージを直接送信します。

取り込むファイルをアップロードする前に、ルールを有効にしてください。通知ルールを作成しても、既存のオブジェクトに対するイベントは生成されません。

### 手順 5：Streaming Job を作成する {#step-5-create-the-streaming-job}

S3 TVF では、ジョブ作成時のスキーマ推論に一致するファイルが必要です。通知を有効にした後、次の内容を含む空でない `data/001.csv` をアップロードします。

```text
1,Alice
2,Bob
```

次に、ジョブを作成します。

```sql
CREATE JOB s3_event_job
PROPERTIES (
    "s3.ingestion_mode" = "NOTIFICATION",
    "s3.event.source" = "SQS",
    "s3.sqs.queue_url" = "https://sqs.us-east-1.amazonaws.com/<account-id>/<queue-name>",
    "max_interval" = "10"
)
ON STREAMING DO
INSERT INTO db1.tbl1
SELECT * FROM S3(
    "uri" = "s3://example-bucket/data/*.csv",
    "format" = "csv",
    "column_separator" = ",",
    "provider" = "S3",
    "s3.region" = "us-east-1",
    "s3.endpoint" = "https://s3.us-east-1.amazonaws.com",
    "s3.access_key" = "<access-key>",
    "s3.secret_key" = "<secret-key>"
);
```

このファイルによって SQS 通知が生成されます。通知を設定する前にアップロードされたオブジェクトはスキーマ推論に使用できますが、自動的にバックフィルされることはありません。ジョブの作成時には、少なくとも 1 つの一致するファイルを読み取り可能な状態で残しておく必要があります。

IAM ロールを使用するには、access-key と secret-key のオプションを次のものに置き換えます。`s3.external_id` は信頼ポリシーに応じて省略できます。

```sql
"s3.role_arn" = "arn:aws:iam::<account-id>:role/<role-name>",
"s3.external_id" = "<external-id>"
```

FE は設定された AWS 認証情報を使用して AssumeRole を呼び出します。ロールには S3 と SQS の権限が必要で、呼び出し元には `sts:AssumeRole` が必要です。また、ロールの信頼ポリシーでその呼び出し元を許可する必要があります。

`data/001.csv` の通知を処理した後、テーブルには対応する 2 行が含まれます。その後のファイルは、キーが以前に処理したキーより小さい場合でも、通知を通じて取り込まれます。通知が繰り返し配信されると、ターゲットテーブルのモデルによって行数に影響する可能性があります。

### 手順 6：キューのバックログを監視する {#step-6-monitor-the-queue-backlog}

```sql
SELECT Name, Status, CurrentOffset, EndOffset, LagBytes,
       LastSourceEventTimestamp, LastTaskSuccessTime
FROM jobs("type" = "insert")
WHERE Name = 's3_event_job';
```

`CurrentOffset` の例は `{"fileName":"data/a.csv"}` です。`EndOffset` の例は `{"fileName":"data/b.csv","lagMessages":12}` です。これらのキーは辞書順のウォーターマークではなく、バッチ位置を表します。そのため、取り込みが追いついたかどうかを判断することはできません。

| フィールド | 通知モードでの意味 |
| --- | --- |
| `LagBytes` | `-1`：キューに入っているオブジェクトのバイトサイズを取得できません。 |
| `EndOffset.lagMessages` | 可視状態にある SQS メッセージのおおよその数です。処理中または遅延中のメッセージは含まれず、ファイル数でもありません。 |
| `LastSourceEventTimestamp` | 直近にコミットされたバッチに含まれる S3 イベントタイムスタンプの最大値です（Unix 秒）。それ以前のすべてのイベントが処理済みであることを示すものではありません。 |

FE では、ジョブ単位の次のメトリクスも公開されます。

```text
doris_fe_streaming_job_per_job_lag_messages
doris_fe_streaming_job_per_job_last_source_event_timestamp_seconds
```

## 通知の確認と制限 {#acknowledgment-and-limitations}

- 保持されている SQS 通知のみを消費します。履歴オブジェクトはスキャンされません。
- ジョブの作成には、S3 TVF のスキーマ推論に使用できる、一致する読み取り可能な空でないファイルが必要です。
- 各キューは 1 つのジョブ専用である必要があります。Doris は対象範囲外のレコード、形式が不正またはサポートされていない通知、S3 テストイベントをスキップして確認します。異なる URI パターンを持つジョブで同じキューを共有しないでください。
- 有効なファイルの場合、INSERT トランザクションがコミットされた後にメッセージが削除されます。処理中は可視性が延長され、失敗したバッチは再試行できます。FE のリカバリでは、直近にコミットされたバッチから永続化されたキーを使用して再配信を処理できますが、グローバルな重複排除のためにすべての履歴キーを永続化することはありません。
- S3 と SQS は重複した通知を配信する可能性があります。エンドツーエンドのセマンティクスは at-least-once であり、ファイルの取り込み順序は保証されません。必要に応じて、ビジネス上の重複排除には Unique Key テーブルを使用し、順序に依存する更新には Sequence 列を使用してください。
- オブジェクトキーは一意にし、内容は不変で読み取り可能な状態に保ってください。Doris はイベントが発行された時点のバージョンとは限らず、処理時点の内容を読み取ります。オブジェクトを早期に削除すると、失敗と再試行が発生します。

## パラメータ {#parameters}

次の項目を Job の `PROPERTIES` に設定します。S3 の接続、認証情報、ファイル形式のオプションは `S3(...)` に指定します。

| パラメータ | 型 | デフォルト | 必須 | 説明 |
| --- | --- | --- | --- | --- |
| `s3.ingestion_mode` | 文字列 | `ORDERED_LIST` | はい | `NOTIFICATION` に設定します。作成後は変更できません。 |
| `s3.event.source` | 文字列 | None | はい | `SQS` である必要があります。作成後は変更できません。 |
| `s3.sqs.queue_url` | 文字列 | None | はい | 専用 SQS キューの URL です。作成後は変更できません。 |
| `s3.max_batch_files` | 正の整数 | `256` | いいえ | バッチあたりのファイル数のしきい値です。 |
| `s3.max_batch_bytes` | 整数 | `10737418240` | いいえ | バッチあたりのバイト数のしきい値です。`104857600` から `10737418240` の範囲で指定します。単位サフィックスは使用できません。 |
| `max_interval` | 正の整数 | `10` | いいえ | アイドル時のスケジューリング間隔を秒単位で指定します。`7200` 未満である必要があります。 |

バッチのしきい値は厳密な待機条件ではなく、完全なバッチになるまで待つ必要はありません。すでに受信したメッセージは同じバッチに残ります。しきい値に達すると次の受信が停止するため、1 つのバッチがいずれかのしきい値を超える場合があります。作成時および `ALTER JOB` では `offset` を指定できません。S3 URI は変更できません。パスまたはキューを変更するには、別のジョブを作成してください。

## トラブルシューティングとベストプラクティス {#troubleshooting-and-best-practices}

| 症状 | 確認事項と対処 |
| --- | --- |
| ジョブの作成に失敗する | 一致する空でないファイル、S3/SQS の権限、ネットワーク接続を確認します。 |
| ジョブは実行されるがファイルが取り込まれない | 通知がアップロードより前に有効になっていること、`s3:ObjectCreated:*` が選択されていること、フィルターが URI をカバーしていること、他のコンシューマーがキューを読み取っていないことを確認します。 |
| 履歴ファイルが見つからない | 通知ルールは履歴イベントを再生しません。別のプレフィックスを使用し、[一度限りの取り込み](./continuous-load-s3-one-time.md)を実行します。 |
| 一時停止後にファイルが見つからない | SQS のメッセージ保持期間を確認し、必要に応じて不足しているファイルを個別にバックフィルします。 |
| 読み取り失敗が繰り返される | `ErrorMsg` とタスクエラーを確認します。オブジェクトが利用可能で不変であること、形式に互換性があることを確認します。 |
| 重複行が発生する | ビジネスキーとターゲットテーブルのモデルを確認します。履歴ファイル全体の重複排除に依存しないでください。 |

十分なメッセージ保持期間を設定し、オブジェクトを不変かつ読み取り可能な状態に保ちます。おおよそのバックログ、最後の成功時刻、タスクエラーを監視してください。ジョブ管理については、[継続ロードの概要](./continuous-load-overview.md) と [ALTER JOB](../../../../sql-manual/sql-statements/job/ALTER-JOB.md) を参照してください。
