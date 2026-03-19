---
{
  "title": "SHOW RESTORE",
  "description": "このステートメントはRESTOREタスクを表示するために使用されます",
  "language": "ja"
}
---
## デスクリプション

このステートメントはRESTOREタスクを表示するために使用されます

## Syntax

```SQL
SHOW [BRIEF] RESTORE [FROM <db_name>]
```
## パラメータ

**1.`<db_name>`**

リカバリタスクが属するデータベースの名前。

## 戻り値

- brief: RESTOREタスクのキー情報のみを表示し、RestoreObjs、Progress、TaskErrMsg列は表示されません

| Column | デスクリプション |
| -- | -- |
| JobId | 一意のジョブID |
| Label | 復元するバックアップの名前 |
| Timestamp | 復元するバックアップの時刻バージョン |
| DbName | 所属するデータベース |
| State | 現在のステージ: <ul><li>PENDING: ジョブ送信後の初期状態。</li><li>SNAPSHOTING: スナップショットを実行中。</li><li>DOWNLOAD: スナップショットが完了し、リポジトリ内のスナップショットをダウンロードする準備ができた状態。</li><li>DOWNLOADING: スナップショットをダウンロード中。</li><li>COMMIT: スナップショットのダウンロードが完了し、有効化する準備ができた状態。</li><li>COMMITTING: 有効化中。</li><li>FINISHED: ジョブ完了時刻。</li><li>CANCELLED: ジョブが失敗。</li></ul> |
| AllowLoad | 復元時にインポートを許可するか（現在サポートされていません）|
| ReplicationNum | 復元するレプリカ数を指定 |
| ReserveReplica | コピーを保持するか |
| ReplicaAllocation | 動的パーティショニングを有効にしたままにするか |
| RestoreJobs | 復元するTableとパーティション |
| CreateTime | タスク送信時刻 |
| MetaPreparedTime | メタデータ準備完了時刻 |
| SnapshotFinishedTime | スナップショット完了時刻 |
| DownloadFinishedTime | スナップショットダウンロード完了時刻 |
| FinishedTime | ジョブ完了時刻 |
| UnfinishedTasks | SNAPSHOTING、DOWNLOADING、COMMITINGステージ中に未完了のサブタスクIDを表示 |
| Progress | タスクの進行状況 |
| TaskErrMsg | タスクのエラーメッセージを表示 |
| Status | ジョブが失敗した場合、失敗メッセージを表示 |
| Timeout | ジョブのタイムアウト（秒単位） |

## 例

1. example_db配下の最新のRESTOREタスクを表示。

```sql
SHOW RESTORE FROM example_db;
```
