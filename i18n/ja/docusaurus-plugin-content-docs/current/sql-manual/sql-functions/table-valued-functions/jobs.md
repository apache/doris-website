---
{
    "title": "JOBS",
    "language": "ja",
    "description": "指定したタスク種別のジョブ情報を参照できる一時テーブルを生成するテーブル関数。"
}
---

## 説明

指定したタスク種別のジョブ情報を参照できる一時テーブルを生成するテーブル関数です。

## 構文

```sql
JOBS(
    "type"="<type>"
)
```

## 必須パラメータ
| フィールド    | 説明                                                                                         |
|---------------|----------------------------------------------------------------------------------------------|
| **`<type>`**  | ジョブの種別：<br/> `insert`：INSERT ジョブ。<br/> `mv`：マテリアライズドビューのジョブ。 |



## 戻り値

- **`jobs("type"="insert")`** INSERT ジョブの戻り値

    | フィールド        | 説明                |
    |-------------------|---------------------|
    | Id                | ジョブ ID           |
    | Name              | ジョブ名            |
    | Definer           | ジョブの定義者      |
    | ExecuteType       | 実行種別            |
    | RecurringStrategy | 定期実行の方法      |
    | Status            | ジョブの状態        |
    | ExecuteSql        | 実行する SQL        |
    | CreateTime        | ジョブの作成時刻    |
    | SucceedTaskCount  | 成功したタスクの数  |
    | FailedTaskCount   | 失敗したタスクの数  |
    | CanceledTaskCount | キャンセルされたタスクの数 |
    | Comment           | ジョブのコメント    |
    | Properties        | ジョブのプロパティ。`ExecuteType = STREAMING` のジョブでのみ値が入ります |
    | CurrentOffset     | ジョブが処理を完了したオフセット。`ExecuteType = STREAMING` のジョブでのみ値が入ります |
    | EndOffset         | ジョブがデータソースから取得した最大のオフセット。`ExecuteType = STREAMING` のジョブでのみ値が入ります |
    | LoadStatistic     | ジョブのロード統計  |
    | ErrorMsg          | ジョブ実行時のエラーメッセージ |
    | JobRuntimeMsg     | ジョブの実行時メッセージ |
    | LagBytes          | ソース側のログ（MySQL の binlog や PostgreSQL の WAL など）の未処理量（バイト単位）。`-1` は、S3 データソースの場合やフルスナップショットの段階など、現在は取得できないことを示します。<br/>**4.1.4 以降**、この列は `Lag`（秒単位）から `LagBytes`（バイト単位）に名前が変更されました |
    | LastSourceEventTimestamp | ジョブがコミットしたオフセットに記録された、ソース側の最新イベントのタイムスタンプ（Unix 秒）。空欄の場合は取得できないことを示します。**4.1.4 で追加** |
    | LastTaskSuccessTime | タスクが最後に正常終了した時刻 |


- **`jobs("type"="mv")`** MV ジョブの戻り値

    | フィールド         | 説明                                                        |
    |--------------------|-------------------------------------------------------------|
    | Id                 | ジョブ ID。MV ジョブの場合、`tasks("type"="mv").JobId` に対応します。 |
    | Name               | ジョブ名。MV ジョブの場合、`mv_infos("database"="...").JobName` および `tasks("type"="mv").JobName` に対応します。 |
    | MvId               | このジョブが管理するマテリアライズドビューの ID。 |
    | MvName             | このジョブが管理するマテリアライズドビューの名前。 |
    | MvDatabaseId       | マテリアライズドビューを含むデータベースの ID。 |
    | MvDatabaseName     | マテリアライズドビューを含むデータベースの名前。 |
    | ExecuteType        | ジョブの実行種別。MV ジョブで使用できる値は `MANUAL` と `RECURRING` です。`MANUAL` は、更新タスクが手動操作、コミット、または内部イベントによってトリガーされることを意味します。`RECURRING` は、更新タスクが定期的にスケジュールされることを意味します。 |
    | RecurringStrategy  | `ExecuteType` から導出されるスケジュールの説明。`MANUAL TRIGGER` は、ジョブがタイマーで実行されないことを意味します。`EVERY ... STARTS ... [ENDS ...]` は、ジョブが定期的に実行されることを意味します。 |
    | Status             | ジョブの状態。`PENDING` はスケジュール待ち、`RUNNING` はタスクを生成できる状態、`PAUSED` は一時停止中で再開可能な状態、`STOPPED` は停止済みで再開できない状態、`FINISHED` は完了した状態を意味します。 |
    | CreateTime         | ジョブが作成された時刻。 |

### MV ジョブの列挙値フィールド

マテリアライズドビューの更新ジョブを確認する際、以下の列挙値フィールドがよく使用されます。

- `ExecuteType`：ジョブが更新タスクを作成する方法。
  - `MANUAL`：ジョブ自体のタイマーでは実行されません。手動操作、コミット、またはシステムによって更新がトリガーされた場合にのみ、タスクが作成されます。
  - `RECURRING`：ジョブはスケジュールに従って実行され、更新タスクを定期的に作成します。
- `RecurringStrategy`：`ExecuteType` から生成される、人が読める形式のスケジュール規則。
  - `MANUAL TRIGGER`：ジョブは定期的にスケジュールされません。通常、`ExecuteType` が `MANUAL` の場合にこの値になります。
  - `EVERY <interval> <unit> STARTS <time> [ENDS <time>]`：ジョブは定期的にスケジュールされます。例：`EVERY 10 MINUTE STARTS 2025-01-17 14:42:53`。
- `Status`：ジョブ自体の現在の状態。
  - `PENDING`：ジョブはスケジュール待ちです。
  - `RUNNING`：ジョブは稼働中で、更新タスクを作成できます。
  - `PAUSED`：ジョブは一時停止中です。再開されるまで新しい更新タスクは作成されません。
  - `STOPPED`：ジョブは停止済みで、再開できません。
  - `FINISHED`：ジョブは完了しています。長期間稼働する MV 更新ジョブではまれですが、汎用ジョブフレームワークでは表示される場合があります。

マテリアライズドビューには更新ジョブが一つあり、一つの更新ジョブは複数の更新タスクを作成できます。`jobs("type"="mv").Name` を使用すると、ジョブを `mv_infos("database"="...").JobName` および `tasks("type"="mv").JobName` に関連付けられます。


## 例

マテリアライズドビューの更新ジョブを表示します。

```sql
select *
from jobs("type"="mv")
where MvDatabaseName = "test" and MvName = "mv1"\G
```
```text
*************************** 1. row ***************************
               Id: 19508
             Name: inner_mtmv_19494
             MvId: 19494
           MvName: mv1
     MvDatabaseId: 16016
   MvDatabaseName: test
      ExecuteType: MANUAL
RecurringStrategy: MANUAL TRIGGER
           Status: RUNNING
       CreateTime: 2025-01-07 22:13:31
```

この結果では、各フィールドは次のように表されます。

- `Id` は MV 更新ジョブの ID です。`JobId`（`tasks("type"="mv")` のフィールド）と同じ値です。
- `Name` は MV 更新ジョブの名前です。`JobName`（`mv_infos("database"="test")` および `tasks("type"="mv")` のフィールド）と同じ値です。
- `MvId` と `MvName` は、このジョブが管理するマテリアライズドビューを識別します。
- `MvDatabaseId` と `MvDatabaseName` は、マテリアライズドビューを含むデータベースを識別します。
- `ExecuteType` が `MANUAL` であるため、このジョブは自身のタイマーでは実行されません。マテリアライズドビューが手動で更新された場合、コミット時に更新された場合、またはシステムによってトリガーされた場合に、更新タスクが作成されます。
- `RecurringStrategy` は `MANUAL TRIGGER` で、`ExecuteType = MANUAL` と一致します。スケジュールされたマテリアライズドビューの場合、このフィールドには `EVERY ... STARTS ...` と表示されます。
- `Status` が `RUNNING` であるため、ジョブは更新タスクを生成できます。`PAUSED` の場合、新しいタスクが作成されるにはマテリアライズドビューのジョブを再開する必要があります。
- `CreateTime` は、この MV 更新ジョブが作成された時刻です。

このジョブが生成したタスクを表示するには、ジョブ名を使用します。

```sql
select *
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc;
```

すべての INSERT ジョブを表示します。
```sql
select * from jobs("type"="insert");
```
```text
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| Id             | Name           | Definer | ExecuteType | RecurringStrategy                          | Status  | ExecuteSql                                                   | CreateTime          | SucceedTaskCount | FailedTaskCount | CanceledTaskCount | Comment |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
| 78533940810334 | insert_tab_job | root    | RECURRING   | EVERY 10 MINUTE STARTS 2025-01-17 14:42:53 | RUNNING | INSERT INTO test.insert_tab SELECT * FROM test.example_table | 2025-01-17 14:32:53 | 0                | 0               | 0                 |         |
+----------------+----------------+---------+-------------+--------------------------------------------+---------+--------------------------------------------------------------+---------------------+------------------+-----------------+-------------------+---------+
```
