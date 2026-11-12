---
{
    "title": "AWS Kinesis",
    "language": "ja",
    "description": "Routine Load を使用して AWS Kinesis Data Streams を Apache Doris に継続的にデータロードする方法。セットアップ、認証、Shard の位置、トラブルシューティングを説明します。"
}
---

Routine Load は AWS Kinesis Data Streams を継続的に読み取り、レコードを Doris テーブルにデータロードできます。Stream には複数の Shard が含まれ、Doris は各 Shard の Sequence Number を使用して進捗を追跡します。

:::info バージョン
Kinesis Routine Load は dev バージョンで利用できます。4.x のソースブランチにはこのデータソースが含まれていないため、このガイドはそれらのバージョンには適用されません。
:::

## 前提条件 {#prerequisites}

- Kinesis Routine Load を含む Doris ビルドを使用します。BE から Kinesis エンドポイントにアクセスできる必要があります。
- Kinesis Stream と、対象に対する `kinesis:ListShards`、`kinesis:GetShardIterator`、`kinesis:GetRecords` の権限を持つ認証情報を準備します。
- データベースとテーブルを作成する権限、および対象テーブルに対する `LOAD_PRIV` を持つ Doris アカウントを使用します。既存ジョブの管理操作にも、適切なデータロード権限が必要です。
- 以下のプロデューサーコマンドでは、`kinesis:PutRecord` 権限を持つ認証情報で AWS CLI を設定します。専用のテスト Stream を使用するか、Stream 内に既存のレコードがあることを考慮してください。

Doris は、アクセスキーとシークレットキーのペア、セッショントークン付きの一時認証情報、引き受ける IAM ロール、または BE プロセスで利用できる AWS のデフォルト認証情報チェーンをサポートします。AWS 認証情報に関する一般的なガイダンスについては、[AWS 認証](../../../admin-manual/auth/integrations/aws-authentication-and-authorization.md) を参照してください。

## クイックスタート {#quick-start}

### 1. データベースと対象テーブルを作成する {#1-create-a-database-and-target-table}

MySQL クライアントで次の SQL を実行します。この例では、単一のレプリカを使用しています。単一 BE の開発クラスター向けの設定であるため、本番環境では適切なレプリカ数を選択してください。

```sql
CREATE DATABASE IF NOT EXISTS kinesis_demo;
USE kinesis_demo;

CREATE TABLE kinesis_events (
    id BIGINT NOT NULL,
    name STRING
)
UNIQUE KEY(id)
DISTRIBUTED BY HASH(id) BUCKETS 1
PROPERTIES ("replication_num" = "1");
```

### 2. Routine Load ジョブを作成する {#2-create-a-routine-load-job}

このステートメントを実行する前に、Stream 名、リージョン、認証情報を置き換えます。プロパティは `kinesis_stream` であり、`aws.` プレフィックスは付けません。`TRIM_HORIZON` は、Stream にまだ保持されている最も古いレコードから読み取ります。

```sql
CREATE ROUTINE LOAD kinesis_demo.kinesis_job ON kinesis_events
COLUMNS(id, name)
PROPERTIES (
    "format" = "json",
    "desired_concurrent_number" = "1"
)
FROM KINESIS (
    "aws.region" = "us-east-1",
    "kinesis_stream" = "my-test-stream",
    "aws.access_key" = "<access_key>",
    "aws.secret_key" = "<secret_key>",
    "property.kinesis_default_pos" = "TRIM_HORIZON"
);
```

BE 環境に適切な AWS デフォルト認証情報チェーンがすでに設定されている場合は、アクセスキーとシークレットキープロパティを省略します。ロールおよび一時認証情報の設定については、パラメーターリファレンスを参照してください。

### 3. テストレコードを書き込み、確認する {#3-write-a-test-record-and-verify-it}

テスト Stream 用に AWS CLI v2 を設定したシェルから、次を実行します。

```shell
aws kinesis put-record \
  --region us-east-1 \
  --stream-name my-test-stream \
  --partition-key 1 \
  --cli-binary-format raw-in-base64-out \
  --data '{"id":1,"name":"Alice"}'
```

このコマンドは Shard ID と Sequence Number を返します。Routine Load は非同期で実行されます。ジョブがレコードを消費してコミットした後、Doris に対してクエリを実行します。

```sql
SELECT id, name FROM kinesis_demo.kinesis_events WHERE id = 1;
```

```text
+----+-------+
| id | name  |
+----+-------+
|  1 | Alice |
+----+-------+
```

## パラメーター {#parameters}

以下のすべてのプロパティは `FROM KINESIS (...)` 句に属します。省略したオプションプロパティはデフォルト値になります。`format`、`jsonpaths`、`desired_concurrent_number` などの一般的なジョブプロパティは `PROPERTIES (...)` に属します。[Routine Load](../import-way/routine-load-manual.md) を参照してください。

| パラメーター | 型 / 必須 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `aws.region` | String；必須 | なし | Stream が存在するリージョン。例：`us-east-1`。 |
| `kinesis_stream` | String；必須 | なし | Stream 名。`aws.kinesis_stream` は使用しないでください。 |
| `aws.endpoint` | String；オプション | そのリージョンの AWS エンドポイント | カスタム Kinesis エンドポイント。例：LocalStack エンドポイント。従来の別名 `kinesis_endpoint` も使用できますが、`aws.endpoint` を推奨します。 |
| `aws.access_key` | String；オプション | 明示的な認証情報を指定しない場合は AWS のデフォルト認証情報チェーン | アクセスキー ID。`aws.secret_key` と同時に指定する必要があります。 |
| `aws.secret_key` | String；オプション | なし | `aws.access_key` と組み合わせるシークレットキー。 |
| `aws.session_key` | String；オプション | なし | 一時認証情報のセッショントークン。 |
| `aws.role_arn` | String；オプション | なし | 引き受ける IAM ロール。認証情報の主体には、そのロールを引き受ける権限が必要です。 |
| `kinesis_shards` | カンマ区切り文字列；オプション | Shard を自動検出 | 消費する Shard ID。 |
| `kinesis_shards_pos` | カンマ区切り文字列；オプション | 明示的に指定した各 Shard では `LATEST` | `kinesis_shards` に一対一で対応する位置。各値は `TRIM_HORIZON`、`LATEST`、または Sequence Number です。Sequence Number を指定すると、そのレコードの**後**から消費を開始します。 |
| `property.kinesis_default_pos` | String；オプション | `LATEST` | デフォルトの開始位置。`TRIM_HORIZON`、`LATEST`、または Sequence Number を指定できます。`kinesis_shards_pos` とは併用できません。タイムスタンプ文字列はサポートされません。 |
| その他の `property.*` | String；オプション | BE のオプションに依存 | `property.` を削除した後、BE に転送されます。たとえば `property.aws.external.id` はロール引き受け用の外部 ID を指定し、ロール ARN が必要です。BE がサポートするオプションだけを使用してください。 |

## ジョブの監視と管理 {#monitor-and-manage-the-job}

```sql
SHOW ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

| フィールド | 期待される意味 |
| --- | --- |
| `State` | ジョブのスケジュールが設定され、Stream を読み取れる状態になると `RUNNING` です。ジョブが `PAUSED` の場合は、一時停止の理由を確認してください。 |
| `DataSourceType` | `KINESIS`。 |
| `DataSourceProperties` | リージョン、Stream、エンドポイント、設定された Shard。 |
| `Progress` | Shard ごとの Sequence Number の進捗。Sequence Number は Kafka のオフセットではないため、加算してレコード数を数えることはできません。 |
| `Lag` | 取得できる場合、最新レコードから各 Shard が遅れている時間をミリ秒単位で示します。 |

```sql
PAUSE ROUTINE LOAD FOR kinesis_demo.kinesis_job;
RESUME ROUTINE LOAD FOR kinesis_demo.kinesis_job;
STOP ROUTINE LOAD FOR kinesis_demo.kinesis_job;
```

`PAUSE` は新しいタスクのスケジュールを停止し、ジョブを再開できる状態にします。`STOP` はジョブを完全に終了します。停止したジョブは再開できません。

## 注意事項とベストプラクティス {#caveats-and-best-practices}

- デフォルトの `LATEST` では履歴レコードを再生しません。保持されている最も古いデータを読み取るには `TRIM_HORIZON` を使用し、制御された再生には明示的な Shard の位置を使用してください。Kinesis からすでに期限切れになったデータは、開始位置を変更しても復元できません。
- 明示的に指定する Shard ID と位置のエントリ数は同じでなければなりません。`kinesis_shards_pos` と `property.kinesis_default_pos` は併用しないでください。
- 作成時に無効なプロパティが報告された場合は、スペルとジョブプロパティとデータソースプロパティの違いを確認してください。特に、`aws.kinesis_stream` とタイムスタンプ形式の開始位置文字列は無効です。
- ジョブが一時停止した場合は、`SHOW ROUTINE LOAD` と BE ログで、認証、エンドポイント、Shard、データ形式に関するエラーを確認してください。JSON レコードは対象列または設定したマッピングに一致する必要があります。
- 代表的な Stream スループットを使用して同時実行数を決定します。Kinesis の読み取り制限と Shard の分布によってスループットが制限される場合があります。タスクを追加しても AWS の Shard ごとの制限を回避することはできません。
