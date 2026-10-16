---
{
    "title": "SHOW ALTER",
    "language": "ja",
    "description": "このステートメントは、進行中のさまざまな変更タスクの実行状態を表示するために使用します。"
}
---

## 説明

このステートメントは、進行中のさまざまな変更タスクの実行状態を表示するために使用します。

```sql
SHOW ALTER [TABLE [COLUMN | ROLLUP] [FROM db_name]];
```

補足:

1. TABLE COLUMN: カラムを変更する ALTER タスクを表示します。
2. サポートされる構文: [WHERE TableName|CreateTime|FinishTime|State] [ORDER BY] [LIMIT]。
3. TABLE ROLLUP: ROLLUP を作成または削除するタスクを表示します。
4. db_name を指定しない場合は、現在のデフォルトデータベースが使用されます。

## 結果

*SHOW ALTER TABLE COLUMN*

| フィールド名          | 説明                                                               |
|-----------------------|--------------------------------------------------------------------|
| JobId                 | 各スキーマ変更ジョブの一意の ID。                                  |
| TableName             | スキーマ変更に対応するベーステーブルの名前。                        |
| CreateTime            | ジョブの作成時刻。                                                 |
| FinishedTime          | ジョブの完了時刻。完了していない場合は「N/A」と表示されます。       |
| IndexName             | この変更の対象となるベーステーブル／同期マテリアライズドビューの名前。 |
| IndexId               | 新しいベーステーブル／同期マテリアライズドビューの ID。             |
| OriginIndexId         | この変更の対象となるベーステーブル／同期マテリアライズドビューの ID。 |
| SchemaVersion         | M:N 形式で表示されます。M はスキーマ変更のバージョン、N は対応するハッシュ値を表します。スキーマ変更のたびにバージョンが増加します。 |
| TransactionId         | 過去データの変換に使用するトランザクション ID。                     |
| State                 | ジョブのフェーズ。                                                 |
|                       | - PENDING: ジョブはキュー内でスケジュールされるのを待っています。  |
|                       | - WAITING_TXN: 境界となるトランザクション ID より前のインポートタスクの完了を待っています。 |
|                       | - RUNNING: 過去データを変換しています。                            |
|                       | - FINISHED: ジョブは正常に完了しました。                            |
|                       | - CANCELLED: ジョブは失敗しました。                                 |
| Msg                   | ジョブが失敗した場合に、失敗メッセージを表示します。                 |
| Progress              | ジョブの進捗状況。RUNNING 状態でのみ表示されます。進捗状況は M/N 形式で表示されます。N はスキーマ変更の対象となるレプリカの総数、M は過去データの変換が完了したレプリカの数です。 |
| Timeout               | ジョブのタイムアウト（秒）。                                       |


## 例

1. デフォルトデータベースのすべてのカラム変更タスクの実行状態を表示します。

   ```sql
   SHOW ALTER TABLE COLUMN;
   ```

2. 特定のテーブルについて、直近のカラム変更タスクの実行状態を表示します。

   ```sql
   SHOW ALTER TABLE COLUMN WHERE TableName = "table1" ORDER BY CreateTime DESC LIMIT 1;
   ```

3. 指定したデータベースの ROLLUP 作成または削除タスクの実行状態を表示します。

   ```sql
   SHOW ALTER TABLE ROLLUP FROM example_db;
   ```

## キーワード

    SHOW, ALTER

## ベストプラクティス
