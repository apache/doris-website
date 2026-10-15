---
{
    "title": "SHOW RESTORE",
    "language": "ja",
    "description": "このステートメントは RESTORE タスクの情報を表示します"
}
---

## 説明

このステートメントは RESTORE タスクの情報を表示します。

## 構文

```SQL
SHOW [BRIEF] RESTORE [FROM <db_name>]
```

## パラメータ

**1.`<db_name>`**

リストアタスクが属するデータベースの名前です。

## 戻り値

- brief: RESTORE タスクの主要な情報のみを表示し、RestoreObjs、Progress、TaskErrMsg カラムは表示しません。

| カラム | 説明 |
| -- | -- |
| JobId | 一意のジョブ ID |
| Label | リストア対象のバックアップ名 |
| Timestamp | リストア対象のバックアップの時刻バージョン |
| DbName | ジョブが属するデータベース |
| State | 現在の段階：<ul><li>PENDING：ジョブ送信後の初期状態。</li><li>SNAPSHOTING：スナップショットを実行中。</li><li>DOWNLOAD：スナップショットが完了し、リポジトリ内のスナップショットをダウンロードする準備ができた状態。</li><li>DOWNLOADING：スナップショットをダウンロード中。</li><li>COMMIT：スナップショットのダウンロードが完了し、適用する準備ができた状態。</li><li>COMMITTING：適用中。</li><li>FINISHED：ジョブの終了時刻。</li><li>CANCELLED：ジョブが失敗した状態。</li></ul> |
| AllowLoad | リストア中にインポートを許可するかどうか（現在はサポートされていません） |
| ReplicationNum | リストア時のレプリカ数を指定します |
| ReserveReplica | レプリカを保持するかどうか |
| ReplicaAllocation | 動的パーティショニングを有効なまま維持するかどうか |
| RestoreJobs | リストア対象のテーブルとパーティション |
| CreateTime | タスクの送信時刻 |
| MetaPreparedTime | メタデータの準備完了時刻 |
| SnapshotFinishedTime | スナップショットの完了時刻 |
| DownloadFinishedTime | スナップショットのダウンロード完了時刻 |
| FinishedTime | ジョブの終了時刻 |
| UnfinishedTasks | SNAPSHOTING、DOWNLOADING、COMMITING の各段階で未完了のサブタスク ID を表示します |
| Progress | タスクの進行状況 |
| TaskErrMsg | タスクのエラーメッセージを表示します |
| Status | ジョブが失敗した場合、失敗メッセージを表示します |
| Timeout | ジョブのタイムアウト（秒） |

## 例

1. example_db 内の最新の RESTORE タスクを表示します。

```sql
SHOW RESTORE FROM example_db;
```
