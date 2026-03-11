---
{
  "title": "SHOW RESTORE",
  "description": "このステートメントはRESTOREタスクを表示するために使用されます",
  "language": "ja"
}
---
## 説明

このステートメントはRESTOREタスクを表示するために使用されます

## 構文

```SQL
SHOW [BRIEF] RESTORE [FROM <db_name>]
```
## パラメータ

**1.`<db_name>`**

復旧タスクが属するデータベースの名前。

## 戻り値

- brief: RESTOREタスクの主要な情報のみを表示し、RestoreObjs、Progress、TaskErrMsg列は表示されません

| Column | デスクリプション |
| -- | -- |
| JobId | 一意のジョブID |
| Label | 復元するバックアップの名前 |
| Timestamp | 復元するバックアップの時刻バージョン |
| DbName | 所属するデータベース |
| State | 現在のステージ: <ul><li>PENDING: ジョブ投稿後の初期状態。</li><li>SNAPSHOTING: スナップショット実行中。</li><li>DOWNLOAD: スナップショットが完了し、リポジトリのスナップショットをダウンロードする準備完了。</li><li>DOWNLOADING: スナップショットダウンロード中。</li><li>COMMIT: スナップショットダウンロードが完了し、有効化の準備完了。</li><li>COMMITTING: 有効化中。</li><li>FINISHED: ジョブ完了時刻。</li><li>CANCELLED: ジョブ失敗。</li></ul> |
| AllowLoad | 復元時にインポートを許可するかどうか（現在はサポートされていません）|
| ReplicationNum | 復元するレプリカ数を指定 |
| ReserveReplica | コピーを保持するかどうか |
| ReplicaAllocation | 動的パーティショニングを有効にしたままにするかどうか |
| RestoreJobs | 復元するTableとパーティション |
| CreateTime | タスク投稿時刻 |
| MetaPreparedTime | メタデータ準備完了時刻 |
| SnapshotFinishedTime | スナップショット完了時刻 |
| DownloadFinishedTime | スナップショットダウンロード完了時刻 |
| FinishedTime | ジョブ完了時刻 |
| UnfinishedTasks | SNAPSHOTING、DOWNLOADING、COMMITINGステージ中の未完了サブタスクIDを表示 |
| Progress | タスクの進捗 |
| TaskErrMsg | タスクエラーメッセージを表示 |
| Status | ジョブが失敗した場合、失敗メッセージを表示 |
| Timeout | ジョブタイムアウト（秒単位） |

## 例

1. example_db配下の最新のRESTOREタスクを表示。

```sql
SHOW RESTORE FROM example_db;
```
