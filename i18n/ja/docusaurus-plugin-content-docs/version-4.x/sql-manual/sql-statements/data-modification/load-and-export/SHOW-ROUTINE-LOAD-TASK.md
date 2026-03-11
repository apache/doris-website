---
{
  "title": "SHOW ROUTINE LOAD TASK",
  "description": "この構文は、指定されたRoutine Loadジョブの現在実行中のサブタスクを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

この構文は、指定されたRoutine Loadジョブの現在実行中のサブタスクを表示するために使用されます。

## 構文

```sql
SHOW ROUTINE LOAD TASK WHERE JobName = <job_name>;
```
## 必要なパラメータ

**1. `<job_name>`**

> 表示するroutine loadジョブの名前。

## 戻り結果

戻り結果には以下のフィールドが含まれます：

| フィールド名           | 説明                                                  |
| :------------------- | :---------------------------------------------------------- |
| TaskId               | サブタスクの一意ID                                     |
| TxnId                | サブタスクに対応するインポートトランザクションID           |
| TxnStatus            | サブタスクのインポートトランザクションステータス。Nullはサブタスクがまだスケジュールされていないことを示す |
| JobId                | サブタスクに対応するジョブID                          |
| CreateTime           | サブタスクの作成時刻                                 |
| ExecuteStartTime     | サブタスクが実行のためにスケジュールされた時刻、通常は作成時刻より後 |
| Timeout              | サブタスクのタイムアウト、通常はジョブで設定された`max_batch_interval`の2倍 |
| BeId                 | このサブタスクを実行するBEノードID                            |
| DataSourceProperties | サブタスクが消費を準備しているKafka Partitionの開始オフセット。Json形式の文字列。キーはPartition Id、値は消費の開始オフセット |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOAD TASKはTableに対するLOAD権限が必要 |

## 注意事項

- TxnStatusがnullの場合、タスクエラーを示すものではなく、タスクがまだスケジュールされていない可能性があります
- DataSourcePropertiesのオフセット情報は、データ消費の進行状況を追跡するために使用できます
- Timeoutに達した場合、データ消費が完了しているかどうかに関係なく、タスクは自動的に終了します

## 例

- test1という名前のroutine loadタスクのサブタスク情報を表示。

    ```sql
    SHOW ROUTINE LOAD TASK WHERE JobName = "test1";
    ```
