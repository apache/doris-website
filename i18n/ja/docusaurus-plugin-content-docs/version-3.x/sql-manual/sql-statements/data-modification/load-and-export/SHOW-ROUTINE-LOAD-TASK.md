---
{
  "title": "SHOW ROUTINE LOAD TASK",
  "description": "この構文は、指定されたRoutine Loadジョブで現在実行中のサブタスクを表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

この構文は、指定されたRoutine Loadジョブの現在実行中のサブタスクを表示するために使用されます。

## Syntax

```sql
SHOW ROUTINE LOAD TASK WHERE JobName = <job_name>;
```
## 必須パラメータ

**1. `<job_name>`**

> 表示するroutine loadジョブの名前。

## 戻り値

戻り値には以下のフィールドが含まれます：

| フィールド名         | 説明                                                        |
| :------------------- | :---------------------------------------------------------- |
| TaskId               | サブタスクの一意ID                                         |
| TxnId                | サブタスクに対応するインポートトランザクションID           |
| TxnStatus            | サブタスクのインポートトランザクションステータス。Nullはサブタスクがまだスケジュールされていないことを示す |
| JobId                | サブタスクに対応するジョブID                               |
| CreateTime           | サブタスクの作成時刻                                       |
| ExecuteStartTime     | サブタスクが実行のためにスケジュールされた時刻、通常は作成時刻より遅い |
| Timeout              | サブタスクのタイムアウト、通常はジョブで設定された`max_batch_interval`の2倍 |
| BeId                 | このサブタスクを実行するBEノードID                         |
| DataSourceProperties | サブタスクが消費準備中のKafka Partitionの開始オフセット。Json形式の文字列。KeyはPartition Id、Valueは消費開始オフセット |

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限      | オブジェクト | 備考 |
| :-------- | :----------- | :---- |
| LOAD_PRIV | Table        | SHOW ROUTINE LOAD TASKはTableに対するLOAD権限が必要 |

## 注意事項

- TxnStatusがnullであることは、タスクエラーを示すものではなく、タスクがまだスケジュールされていない可能性があることを意味します
- DataSourcePropertiesのオフセット情報は、データ消費の進捗を追跡するために使用できます
- Timeoutに達すると、データ消費が完了しているかどうかに関わらず、タスクは自動的に終了します

## 例

- test1という名前のroutine loadタスクのサブタスク情報を表示する。

    ```sql
    SHOW ROUTINE LOAD TASK WHERE JobName = "test1";
    ```
