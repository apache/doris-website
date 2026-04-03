---
{
  "title": "SHOW ALTER",
  "description": "この文は、実行中のさまざまな変更タスクの実行状況を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、実行中の様々な変更タスクの実行ステータスを表示するために使用されます。

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```
注意事項：

1. TABLE COLUMN: カラムを変更するためのALTERタスクを表示します。
2. サポートされている構文: [WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT]。
3. TABLE ROLLUP: ROLLUPを作成または削除するためのタスクを表示します。
4. db_nameが指定されていない場合、現在のデフォルトデータベースが使用されます。

## 結果

*SHOW ALTER TABLE COLUMN*

| Field Name            | デスクリプション                                                         |
|-----------------------|------------------------------------------------------------------|
| JobId                 | 各Schema Changeジョブの一意ID。                          |
| TableName             | Schema Changeに対応するベースTableの名前。 |
| CreateTime            | ジョブ作成時刻。                                              |
| FinishedTime          | ジョブ完了時刻。完了していない場合は"N/A"を表示。      |
| IndexName             | この変更に関わるベースTable/同期マテリアライズドビューの名前。        |
| IndexId               | 新しいベースTable/同期マテリアライズドビューのID。                                      |
| OriginIndexId         | この変更に関わるベースTable/同期マテリアライズドビューのID。                                      |
| SchemaVersion         | M:N形式で表示。MはSchema Changeのバージョンを表し、Nは対応するハッシュ値を表す。各Schema Changeはバージョンをインクリメントする。 |
| TransactionId         | 履歴データを変換するためのトランザクションID。                  |
| State                 | ジョブのフェーズ。                                               |
|                       | - PENDING: ジョブはキューでスケジュールされるのを待機中。        |
|                       | - WAITING_TXN: 境界トランザクションID前のインポートタスクの完了を待機中。 |
|                       | - RUNNING: 現在履歴データ変換を実行中。                |
|                       | - FINISHED: ジョブが正常に完了。                            |
|                       | - CANCELLED: ジョブが失敗。                                          |
| Msg                   | ジョブが失敗した場合、失敗メッセージを表示。                        |
| Progress              | ジョブ進捗。RUNNING状態でのみ表示。進捗はM/N形式で表示される。NはSchema Changeに関わるレプリカの総数。Mは履歴データ変換が完了したレプリカの数。 |
| Timeout                | ジョブタイムアウト時間（秒）。                                       |


## 例

1. デフォルトデータベースの全ての変更カラムタスクの実行ステータスを表示。

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```
2. 特定のTableに対する最新の列変更タスクの実行状態を表示する。

   ```sql
   SHOW ALTER TABLE COLUMN WHERE TableName = "table1" ORDER BY CreateTime DESC LIMIT 1;
   ```
3. 指定されたデータベースに対するROLLUPタスクの作成または削除の実行ステータスを表示します。

   ```sql
   SHOW ALTER TABLE ROLLUP FROM example_db;
   ```
## キーワード

    SHOW, ALTER

## ベストプラクティス
