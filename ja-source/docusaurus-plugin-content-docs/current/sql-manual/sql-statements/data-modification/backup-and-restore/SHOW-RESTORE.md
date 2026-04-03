---
{
  "title": "RESTORE を表示",
  "language": "ja",
  "description": "このステートメントはRESTOREタスクを表示するために使用されます"
}
---
## 説明

このステートメントはRESTOREタスクを表示するために使用されます

## 構文

```SQL
SHOW [BRIEF] [GLOBAL] RESTORE [FROM <db_name>]
```
## パラメータ

**1.`<db_name>`**

復旧タスクが属するデータベースの名前。

## 戻り値

- brief: RESTOREタスクの主要な情報のみを表示し、RestoreObjs、Progress、TaskErrMsg列は表示されません

| 列 | 説明 |
| -- | -- |
| JobId | 一意のジョブid |
| Label | 復元するバックアップの名前 |
| Timestamp | 復元するバックアップの時刻バージョン |
| DbName | 所属するデータベース |
| State | 現在のステージ: <ul><li>PENDING: ジョブ送信後の初期状態。</li><li>SNAPSHOTING: スナップショット実行中。</li><li>DOWNLOAD: スナップショットが完了し、リポジトリ内のスナップショットのダウンロード準備完了。</li><li>DOWNLOADING: スナップショットダウンロード中。</li><li>COMMIT: スナップショットダウンロードが完了し、有効化準備完了。</li><li>COMMITTING: 有効化中。</li><li>FINISHED: ジョブ完了時刻。</li><li>CANCELLED: ジョブ失敗。</li></ul> |
| AllowLoad | 復元時にインポートを許可するかどうか（現在サポートされていません）|
| ReplicationNum | 復元するレプリカ数を指定 |
| ReserveReplica | コピーを保持するかどうか |
| ReplicaAllocation | 動的パーティショニングを有効にしたままにするかどうか |
| RestoreJobs | 復元するテーブルとパーティション |
| CreateTime | タスク送信時刻 |
| MetaPreparedTime | メタデータ準備完了時刻 |
| SnapshotFinishedTime | スナップショット完了時刻 |
| DownloadFinishedTime | スナップショットダウンロード完了時刻 |
| FinishedTime | ジョブ完了時刻 |
| UnfinishedTasks | SNAPSHOTING、DOWNLOADING、COMMITINGステージ中に未完了のサブタスクidを表示 |
| Progress | タスクの進行状況 |
| TaskErrMsg | タスクエラーメッセージを表示 |
| Status | ジョブが失敗した場合、失敗メッセージを表示 |
| Timeout | ジョブタイムアウト（秒） |

## 例

1. example_db下の最新のRESTOREタスクを表示します。

```sql
SHOW RESTORE FROM example_db;
```
2. 最新のGLOBAL RESTOREタスクを表示します。

```sql
SHOW GLOBAL RESTORE;
```
