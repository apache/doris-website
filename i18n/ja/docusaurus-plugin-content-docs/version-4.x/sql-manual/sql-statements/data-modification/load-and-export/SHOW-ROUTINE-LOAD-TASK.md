---
{
    "title": "SHOW ROUTINE LOAD TASK",
    "language": "ja",
    "description": "この構文は、指定した Routine Load ジョブで現在実行中のサブタスクを表示するために使用します。"
}
---

## 説明

この構文は、指定した Routine Load ジョブで現在実行中のサブタスクを表示するために使用します。

## 構文

```sql
SHOW ROUTINE LOAD TASK WHERE JobName = <job_name>;
```

## 必須パラメータ

**1. `<job_name>`**

> 表示する Routine Load ジョブの名前を指定します。

## 返却結果

返却結果には、次のフィールドが含まれます。

| フィールド名 | 説明 |
| :------------------- | :---------------------------------------------------------- |
| TaskId | サブタスクの一意の ID |
| TxnId | サブタスクに対応するインポートトランザクションの ID |
| TxnStatus | サブタスクのインポートトランザクションの状態。Null は、サブタスクがまだスケジュールされていないことを示します |
| JobId | サブタスクに対応するジョブの ID |
| CreateTime | サブタスクの作成時刻 |
| ExecuteStartTime | サブタスクの実行がスケジュールされた時刻。通常は作成時刻より後です |
| Timeout | サブタスクのタイムアウト。通常はジョブに設定された `max_batch_interval` の二倍です |
| BeId | このサブタスクを実行する BE ノードの ID |
| DataSourceProperties | サブタスクが消費を開始する予定の Kafka パーティションの開始オフセット。JSON 形式の文字列で、キーはパーティション ID、値は消費の開始オフセットです |

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明 |
| :-------- | :----- | :---- |
| LOAD_PRIV | テーブル | SHOW ROUTINE LOAD TASK には、テーブルに対する LOAD 権限が必要です |

## 使用上の注意

- TxnStatus が null でも、タスクにエラーが発生したとは限りません。タスクがまだスケジュールされていない可能性があります。
- DataSourceProperties のオフセット情報は、データの消費状況を追跡するために使用できます。
- Timeout に達すると、データの消費が完了しているかどうかにかかわらず、タスクは自動的に終了します。

## 例

- test1 という名前の Routine Load ジョブのサブタスク情報を表示します。

    ```sql
    SHOW ROUTINE LOAD TASK WHERE JobName = "test1";
    ```
