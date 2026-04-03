---
{
  "title": "SHOW BACKUP",
  "description": "このステートメントはBACKUPタスクを表示するために使用されます",
  "language": "ja"
}
---
## デスクリプション

このステートメントはBACKUPタスクを表示するために使用されます

## Syntax

```sql
 SHOW BACKUP [FROM <db_name>]
     [WHERE SnapshotName { LIKE | = } '<snapshot_name>' ]
```
## パラメータ

**1.`<db_name>`**

バックアップタスクが属するデータベースの名前。

**2.`<snapshot_name>`**

バックアップ名。

## Return Value

| Column | デスクリプション |
| -- | -- |
| JobId | 一意のジョブID |
| SnapshotName | バックアップの名前 |
| DbName | 属するデータベース |
| State | 現在のステージ：<ul><li>PENDING: ジョブ送信後の初期状態。</li><li>SNAPSHOTING: スナップショットを実行中。</li><li>UPLOAD_SNAPSHOT: スナップショット完了、アップロード準備完了。</li><li>UPLOADING: スナップショットアップロード中。</li><li>SAVE_META: ジョブメタ情報をローカルファイルに保存。</li><li>UPLOAD_INFO: ジョブメタ情報をアップロード。</li><li>FINISHED: ジョブが正常に完了。</li><li>CANCELLED: ジョブが失敗。</li></ul> |
| BackupObjs | バックアップされたTableとパーティション |
| CreateTime | タスク送信時刻 |
| SnapshotFinishedTime | スナップショット完了時刻 |
| UploadFinishedTime | スナップショットアップロード完了時刻 |
| FinishedTime | ジョブ終了時刻 |
| UnfinishedTasks | SNAPSHOTINGおよびUPLOADINGステージ中の未完了サブタスクIDを表示 |
| Progress | タスクの進捗 |
| TaskErrMsg | タスクエラーメッセージを表示 |
| Status | ジョブが失敗した場合、失敗メッセージを表示 |
| Timeout | ジョブタイムアウト、秒単位 |

## Example

1. example_db配下の最後のBACKUPタスクを表示する。

```sql
SHOW BACKUP FROM example_db;
```
