---
{
  "title": "SHOW ALTER",
  "description": "この文は、進行中の様々な変更タスクの実行状況を表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、実行中の様々な変更タスクの実行状況を表示するために使用されます。

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```
注意事項：

1. TABLE COLUMN：カラムを変更するためのALTERタスクを表示します。
2. サポートされている構文：[WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT]。
3. TABLE ROLLUP：ROLLUPの作成または削除のためのタスクを表示します。
4. db_nameが指定されていない場合、現在のデフォルトデータベースが使用されます。

## 結果

*SHOW ALTER TABLE COLUMN*

| Field Name            | デスクリプション                                                         |
|-----------------------|------------------------------------------------------------------|
| JobId                 | 各Schema Changeジョブの一意のID。                          |
| TableName             | Schema Changeに対応するベースTableの名前。 |
| CreateTime            | ジョブ作成時刻。                                              |
| FinishedTime          | ジョブ完了時刻。完了していない場合は「N/A」を表示。      |
| IndexName             | この変更に関与するベースTable/同期マテリアライズドビューの名前。        |
| IndexId               | 新しいベースTable/同期マテリアライズドビューのID。                                      |
| OriginIndexId         | この変更に関与するベースTable/同期マテリアライズドビューのID。                                      |
| SchemaVersion         | M:N形式で表示。MはSchema Changeのバージョンを表し、Nは対応するハッシュ値を表します。各Schema Changeでバージョンが増分されます。 |
| TransactionId         | 履歴データ変換のためのトランザクションID。                  |
| State                 | ジョブのフェーズ。                                               |
|                       | - PENDING：ジョブがキュー内でスケジュールされるのを待機中。        |
|                       | - WAITING_TXN：境界トランザクションID前のインポートタスクの完了を待機中。 |
|                       | - RUNNING：現在履歴データ変換を実行中。                |
|                       | - FINISHED：ジョブが正常に完了。                            |
|                       | - CANCELLED：ジョブが失敗。                                          |
| Msg                   | ジョブが失敗した場合、失敗メッセージを表示。                        |
| Progress              | ジョブの進捗。RUNNING状態でのみ表示。進捗はM/N形式で表示されます。NはSchema Changeに関与するレプリカの総数。Mは履歴データ変換が完了したレプリカの数。 |
| Timeout                | ジョブのタイムアウト（秒）。                                       |


## 例

1. デフォルトデータベースのすべての変更カラムタスクの実行状況を表示します。

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```
2. 特定のTableに対する最新の列変更タスクの実行ステータスを表示する。

   ```sql
   SHOW ALTER TABLE COLUMN WHERE TableName = "table1" ORDER BY CreateTime DESC LIMIT 1;
   ```
3. 指定されたデータベースに対するROLLUPタスクの作成または削除の実行ステータスを表示します。

   ```sql
   SHOW ALTER TABLE ROLLUP FROM example_db;
   ```
## Keywords

    SHOW, ALTER

## ベストプラクティス
