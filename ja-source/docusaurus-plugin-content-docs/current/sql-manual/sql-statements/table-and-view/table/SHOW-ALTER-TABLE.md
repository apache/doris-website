---
{
  "title": "SHOW ALTER",
  "language": "ja",
  "description": "このステートメントは、実行中の様々な変更タスクの実行状況を表示するために使用されます。"
}
---
## 説明

このステートメントは、実行中の様々な変更タスクの実行状況を表示するために使用されます。

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```
注意:

1. TABLE COLUMN: カラムを変更するためのALTERタスクを表示します。
2. サポートされる構文: [WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT]。
3. TABLE ROLLUP: ROLLUPを作成または削除するタスクを表示します。
4. db_nameが指定されていない場合、現在のデフォルトデータベースが使用されます。

## 結果

*SHOW ALTER TABLE COLUMN*

| フィールド名            | 説明                                                         |
|-----------------------|------------------------------------------------------------------|
| JobId                 | 各Schema Changeジョブの一意のID。                          |
| TableName             | Schema Changeに対応するベーステーブルの名前。 |
| CreateTime            | ジョブ作成時刻。                                              |
| FinishedTime          | ジョブ完了時刻。未完了の場合は「N/A」を表示します。      |
| IndexName             | この変更に関与するベーステーブル/同期マテリアライズドビューの名前。        |
| IndexId               | 新しいベーステーブル/同期マテリアライズドビューのID。                                      |
| OriginIndexId         | この変更に関与するベーステーブル/同期マテリアライズドビューのID。                                      |
| SchemaVersion         | M:N形式で表示されます。MはSchema Changeのバージョンを表し、Nは対応するハッシュ値を表します。各Schema Changeでバージョンが増加します。 |
| TransactionId         | 履歴データを変換するためのトランザクションID。                  |
| State                 | ジョブのフェーズ。                                               |
|                       | - PENDING: ジョブはキューでのスケジューリングを待機中です。        |
|                       | - WAITING_TXN: 境界トランザクションID以前のインポートタスクの完了を待機中。 |
|                       | - RUNNING: 現在履歴データ変換を実行中。                |
|                       | - FINISHED: ジョブが正常に完了しました。                            |
|                       | - CANCELLED: ジョブが失敗しました。                                          |
| Msg                   | ジョブが失敗した場合、失敗メッセージを表示します。                        |
| Progress              | ジョブの進行状況。RUNNING状態でのみ表示されます。進行状況はM/N形式で表示されます。NはSchema Changeに関与するレプリカの総数です。Mは履歴データ変換が完了したレプリカの数です。 |
| Timeout                | ジョブタイムアウト（秒）。                                       |


## 例

1. デフォルトデータベースのすべてのカラム変更タスクの実行ステータスを表示します。

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```
2. 特定のテーブルに対する最新の列変更タスクの実行状況を表示します。

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
