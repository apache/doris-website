---
{
  "title": "AWS-Kinesis",
  "language": "ja",
  "description": "Apache Doris は Routine Load を通じて AWS Kinesis Data Streams から継続的にデータをインポートします。Kinesis ストリームからデータを自動かつ継続的に消費し、Doris テーブルへ取り込むことができます。"
}
---

## 基本原理

### コア概念の対応

| Kinesis | Kafka | 説明 |
| --- | --- | --- |
| Stream | Topic | データストリームの名前付きコレクション |
| Shard | Partition | ストリーム内のデータシャード。各 Shard は独立したデータシーケンスを持つ |
| Sequence Number | Offset | Shard 内レコードの一意識別子 |
| GetRecords | Consume | ストリームからレコードを読み取る API |

### AWS 認証方式

Kinesis インポート時の AWS 認証方式は、MSK からのデータインポート時の認証方式をそのまま参照できます: [Routine Load Manual](./aws-msk.md)

## パラメータ

| パラメータ名 | 説明 | デフォルト値 | 例 |
| --- | --- | --- | --- |
| aws.region | AWS Region | 手動指定 | `"us-east-1"` |
| aws.access_key | AWS Access Key ID | 手動指定 | `\` |
| aws.secret_key | AWS Secret Access Key | 手動指定 | `\` |
| aws.role_arn | クロスアカウントアクセス用 Role ARN | 手動指定 | `"arn:aws:iam::123456789012:role/MyRole"` |
| kinesis_stream | Kinesis Stream 名 | 手動指定 | `"my-data-stream"` |
| kinesis_shards | 消費対象の shard ID をカンマ区切りで指定。 | デフォルトですべての shards を選択 | `"shardId-000000000001,shardId-000000000002"` |
| kinesis_shards_pos | 各 shard の開始位置。`kinesis_shards` と 1 対 1 で対応するカンマ区切り。 | `LATEST` | `TRIM_HORIZON`（最古）, `LATEST`（最新）, `sequence number` |
| property.kinesis_default_pos | `kinesis_shards_pos` 未指定時のデフォルト shard 開始位置。 | `LATEST` | `TRIM_HORIZON`（最古）, `LATEST`（最新）, タイムスタンプ `"2026-01-01 00:00:00"` |
| その他の `property.*` | このプレフィックスのパラメータは FE から BE へ透過されます。 | `\` | `\` |

## クイックスタート

Doris は Routine Load で Kinesis からデータを読み取るため、基本的な操作は [Routine Load Manual](../import-way/routine-load-manual.md) と同じです。

### インポートの作成

```SQL
CREATE ROUTINE LOAD [db_name.]job_name ON table_name
[load_properties]
[job_properties]
FROM KINESIS
(
    "aws.region" = "us-east-1",
    "aws.kinesis_stream" = "<your_stream_name>",
    "aws.access_key" = "<your_ak>",
    "aws.secret_key" = "<your_sk>"
);
```

### インポート状態の確認

```SQL
SHOW ROUTINE LOAD FOR job_name;
```

出力フィールド説明（Kinesis 関連のみ）

| フィールド | 説明 |
| --- | --- |
| DataSourceType | データソース種別: KINESIS |
| DataSourceProperties | Kinesis データソース設定（region, stream, shards） |
| Progress | 消費進捗（各 Shard の Sequence Number） |
| Lag | 消費遅延（各 Shard が最新データに追いつくまでのミリ秒） |

### インポートジョブの一時停止

```SQL
PAUSE ROUTINE LOAD FOR job_name;
```

### インポートジョブの再開

```SQL
RESUME ROUTINE LOAD FOR job_name;
```

### インポートジョブの削除

```SQL
STOP ROUTINE LOAD FOR job_name;
```
