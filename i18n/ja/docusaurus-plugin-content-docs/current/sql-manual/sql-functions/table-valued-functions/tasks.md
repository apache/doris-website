---
{
    "title": "TASKS",
    "language": "ja",
    "description": "タスクの一時テーブルを生成するテーブル関数"
}
---

## 説明

現在の Doris クラスターでジョブによって生成されたタスクの情報を確認できる、一時テーブルを生成するテーブル関数です。

## 構文
```sql
TASKS(
    "type"="<type>"
)
```

## 必須パラメータ
| フィールド     | 説明                                                                                       |
|---------------|---------------------------------------------------------------------------------------------------|
| **`<type>`**  | タスクの種類：<br/> `insert`：insert タイプのタスク。<br/> `mv`：マテリアライズドビュータイプのタスク。 |


## 戻り値

-  **`tasks("type"="insert")`** で返される insert タイプのタスク

   | フィールド名   | 説明                        |
   |--------------|------------------------------------|
   | **TaskId**   | タスク ID                            |
   | **JobId**    | ジョブ ID                             |
   | **JobName**  | ジョブ名                           |
   | **Label**    | ラベル                              |
   | **Status**   | タスクのステータス                        |
   | **ErrorMsg** | タスクの失敗に関する情報          |
   | **CreateTime**| タスクの作成時刻                |
   | **FinishTime**| タスクの完了時刻              |
   | **TrackingUrl**| トラッキング URL                     |
   | **LoadStatistic**| ロード統計情報                |
   | **User**     | ユーザー                               |

-  **`tasks("type"="mv")`** で返される MV タイプのタスク

   | フィールド名 | 説明 |
   |------------|-------------|
   | **TaskId** | 更新タスクの一意の ID。マテリアライズドビューが更新されるたびに、新しいタスクレコードが作成されます。 |
   | **JobId** | このタスクを生成したジョブの ID。`jobs("type"="mv").Id` に対応します。 |
   | **JobName** | このタスクを生成したジョブの名前。`mv_infos("database"="...").JobName` および `jobs("type"="mv").Name` に対応します。 |
   | **MvId** | このタスクで更新されたマテリアライズドビューの ID。 |
   | **MvName** | このタスクで更新されたマテリアライズドビューの名前。 |
   | **MvDatabaseId** | マテリアライズドビューを含むデータベースの ID。 |
   | **MvDatabaseName** | マテリアライズドビューを含むデータベースの名前。 |
   | **Status** | タスクのステータス。指定可能な値：`PENDING` は実行待ち、`RUNNING` は実行中、`SUCCESS` は正常終了、`FAILED` は失敗、`CANCELED` はキャンセルを意味します。 |
   | **ErrorMsg** | `Status` が `FAILED` または `CANCELED` の場合のエラーメッセージ。タスクが成功した場合は空です。 |
   | **CreateTime** | タスクレコードが作成された時刻。 |
   | **StartTime** | タスクの実行が開始された時刻。タスクが未開始の場合は `\N` になることがあります。 |
   | **FinishTime** | タスクが終了した時刻。保留中または実行中の場合は `\N` になることがあります。 |
   | **DurationMs** | `FinishTime - StartTime` として計算される実行時間（ミリ秒）。タスクが未終了の場合は `\N` になることがあります。 |
   | **TaskContext** | タスクの起動方法とユーザーの要求を表す JSON 文字列。一般的なフィールドには `triggerMode`、`partitions`、`isComplete` があります。`triggerMode` の値は `MANUAL`、`COMMIT`、`SYSTEM` です。 |
   | **RefreshMode** | このタスクで決定された実際の更新範囲。指定可能な値：`COMPLETE` はマテリアライズドビューのすべてのパーティションを更新、`PARTIAL` は一部のパーティションのみを更新、`NOT_REFRESH` は更新が必要なパーティションがなかったことを意味します。 |
   | **NeedRefreshPartitions** | このタスクで更新が必要だったマテリアライズドビューのパーティションを示す JSON 配列。空の配列は、更新が必要なパーティションがなかったことを意味します。 |
   | **CompletedPartitions** | 正常に更新されたパーティションを示す JSON 配列。`NeedRefreshPartitions` と比較すると、必要なすべてのパーティションの更新が完了したか確認できます。 |
   | **Progress** | `percentage (completed/total)` 形式の更新進捗状況。例：`100.00% (1/1)`。更新対象のパーティションがない場合は `\N` になることがあります。 |
   | **LastQueryId** | 更新タスクが実行した SQL 文のクエリ ID。タスクの失敗を調査する際に、この ID を使って FE または BE のログを検索できます。更新 SQL が実行されていない場合は空になることがあります。このフィールドは Doris 3.0.0 以降でサポートされています。 |
   | **ComputeGroup** | 更新タスクが使用した Compute Group。指定されていない場合や、コンピューティングとストレージを分離していない環境では空になることがあります。 |
   | **IvmFallbackReason** | IVM を実行できずフォールバックした場合、または厳密な IVM 更新が失敗した場合に記録される安定した理由。IVM のフォールバックが発生しなかった場合は空です。 |
   | **IvmRebuiltPartitions** | 更新要求で再構築が指定されていなくても、この更新で全体を再構築した IVM マテリアライズドビューのパーティション数。マテリアライズドビューの初回更新時、またはそのベースラインが無効になった場合に発生します。`COMPLETE` 更新が要求された場合、またはマテリアライズドビューが IVM ではない場合は 0 です。発生条件については、[初回更新とベースラインの再構築](../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#first-refresh-and-baseline-rebuild)を参照してください。 |

### MV タスクの列挙値フィールド

マテリアライズドビューの更新タスクを確認する際には、次の列挙値フィールドがよく使われます。

- `Status`：タスクのライフサイクル上の状態。
  - `PENDING`：タスクは作成されていますが、実行はまだ始まっていません。スケジュールまたはリソースを待っています。
  - `RUNNING`：タスクは現在実行中です。
  - `SUCCESS`：タスクは正常に終了しました。
  - `FAILED`：タスクは失敗しました。まず `ErrorMsg` を確認し、`LastQueryId` が空でなければ、その ID でログを検索してください。
  - `CANCELED`：タスクは終了前にキャンセルされました。
- `TaskContext.triggerMode`：タスクが作成された理由。
  - `MANUAL`：`REFRESH MATERIALIZED VIEW` などの手動更新コマンドによって作成されました。
  - `COMMIT`：関連するベーステーブルのデータ変更によって更新がトリガーされ、作成されました。
  - `SYSTEM`：内部のシステム操作によって作成されました。たとえば、即時ビルドで作成されたマテリアライズドビューの初期ビルドが該当します。
- `TaskContext.isComplete`：更新要求で完全更新が指定されているかどうか。
  - `true`：すべてのマテリアライズドビューパーティションの更新を Doris に要求します。
  - `false`：完全更新を強制しません。Doris はパーティションの鮮度に基づいて、実際の更新範囲を決定できます。
- `TaskContext.refreshMode`：ユーザーが要求した更新方法。`AUTO`、`COMPLETE`、`PARTITIONS`、`INCREMENTAL` のいずれかです。古いタスクにはこのフィールドがない場合があります。
- `TaskContext.af`：`FALLBACK` に対応する、フォールバックが許可されているかどうかを示す値。互換性のための名前である `allowFallback` として表示される場合もあります。古いタスクにはこのフィールドがない場合があります。
- `RefreshMode`：パーティションを確認した後にタスクが選択した実際の更新範囲。
  - `COMPLETE`：MV に属するすべてのマテリアライズドビューパーティションが更新対象として選択されました。
  - `PARTIAL`：一部のマテリアライズドビューパーティションのみが更新対象として選択されました。
  - `NOT_REFRESH`：更新が必要なパーティションはありませんでした。この場合、`NeedRefreshPartitions` は通常空で、`Progress` は `\N` になることがあります。
- `IvmFallbackReason`：IVM の事前実行がフォールバックした理由、または厳密な増分更新が失敗した理由です。例として、`STREAM_UNSUPPORTED`、`MIN_MAX_BOUNDARY_HIT`、`BITMAP_AGG_DELETE`、`PLAN_SIGNATURE_MISMATCH` があります。問題の調査については、[増分ビューの保守（IVM）](../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#fallback-order)を参照してください。

:::info バージョン

`LastQueryId` は Doris 3.0.0 以降でサポートされています。Doris 2.1.x では使用できません。

:::


## 例

マテリアライズドビューの最新の更新タスクを表示します。

```sql
select *
from tasks("type"="mv")
where MvDatabaseName = "test" and MvName = "mv1"
order by CreateTime desc
limit 1\G
```
```text
*************************** 1. row ***************************
               TaskId: 437156301250803
                JobId: 19508
              JobName: inner_mtmv_19494
                 MvId: 19494
               MvName: mv1
         MvDatabaseId: 16016
       MvDatabaseName: test
               Status: SUCCESS
             ErrorMsg:
           CreateTime: 2025-01-07 22:13:48
            StartTime: 2025-01-07 22:13:48
           FinishTime: 2025-01-07 22:17:45
           DurationMs: 236985
          TaskContext: {"triggerMode":"MANUAL","partitions":[],"isComplete":false}
          RefreshMode: COMPLETE
NeedRefreshPartitions: ["p_20210101_MAXVALUE","p_20200101_20210101"]
  CompletedPartitions: ["p_20210101_MAXVALUE","p_20200101_20210101"]
             Progress: 100.00% (2/2)
          LastQueryId: 7965b4ddce8a4480-8884e9701679c1c4
          ComputeGroup: \N
     IvmFallbackReason: \N
  IvmRebuiltPartitions: 0
```

この結果では、次のことが分かります。

- `TaskId` は、この更新の実行を識別します。更新のたびに異なる値になります。
- `JobId` と `JobName` は MV 更新ジョブを識別します。このジョブは `select * from jobs("type"="mv") where Name = "inner_mtmv_19494";` で照会できます。
- `MvId`、`MvName`、`MvDatabaseId`、`MvDatabaseName` は、タスクによって更新されたマテリアライズドビューを識別します。
- `Status` は `SUCCESS` なので、タスクは正常に終了しています。`FAILED` の場合は、まず `ErrorMsg` を確認してください。
- `CreateTime`、`StartTime`、`FinishTime`、`DurationMs` は、それぞれタスクの作成時刻、開始時刻、終了時刻、実行時間を示します。
- `TaskContext` は、このタスクが手動で起動されたことを示します。`partitions: []` は、ユーザーが更新コマンドでパーティションのリストを指定しなかったことを意味します。
- `RefreshMode` は `COMPLETE` なので、このタスクはマテリアライズドビューで更新が必要だったすべてのパーティションを更新しました。
- `NeedRefreshPartitions` には更新が必要だった二つのパーティションが列挙されており、`CompletedPartitions` にも同じ二つのパーティションが列挙されているため、必要なパーティションの更新はすべて完了しています。
- `Progress` は `100.00% (2/2)` で、必要な二つのパーティションのうち二つが完了したことも示しています。
- `LastQueryId` は更新 SQL のクエリ ID です。タスクが失敗した場合や実行に時間がかかる場合は、この ID を使って Doris のログを検索してください。
- `ComputeGroup` は空で、この例では専用の Compute Group が記録されていないことを意味します。
- `IvmFallbackReason` は空で、このタスクでは IVM のフォールバックが発生しなかったことを意味します。
- `IvmRebuiltPartitions` は 0 で、このタスクでは追加のパーティションを再構築しなかったことを意味します。

:::info 注意

保存および表示されるタスクレコードの数は、FE の設定項目 `max_persistence_task_count` によって制御されます。デフォルト値は 100 です。タスクレコードの数がこの上限を超えると、古いタスクレコードは破棄されます。値が 1 未満の場合、タスクレコードは永続化されません。この設定を変更した後は FE を再起動してください。

:::

すべての insert タスクを表示します。

```sql
select * from tasks("type"="insert");
```
```text
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| TaskId         | JobId          | JobName        | Label                         | Status  | ErrorMsg | CreateTime          | StartTime           | FinishTime          | TrackingUrl | LoadStatistic | User |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
| 79133848479750 | 78533940810334 | insert_tab_job | 78533940810334_79133848479750 | SUCCESS |          | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 | 2025-01-17 14:42:54 |             |               | root |
+----------------+----------------+----------------+-------------------------------+---------+----------+---------------------+---------------------+---------------------+-------------+---------------+------+
```
