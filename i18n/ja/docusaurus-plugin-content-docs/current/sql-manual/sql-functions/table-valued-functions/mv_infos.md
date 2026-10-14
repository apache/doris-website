---
{
    "title": "MV_INFOS",
    "language": "ja",
    "description": "非同期マテリアライズドビューの情報を含む一時テーブルを生成するテーブル関数",
}
---

## 説明

指定したデータベースに作成された非同期マテリアライズドビューの情報を確認できる一時テーブルを生成するテーブル関数です。

## 構文
```sql
MV_INFOS("database"="<database>")
```

## 必須パラメータ
**`<database>`**
> 照会するクラスタ内のデータベース名を指定します。


## 戻り値

| フィールド             | 型      | 説明                                                                |
|------------------------|---------|---------------------------------------------------------------------|
| Id                     | BIGINT  | マテリアライズドビューの ID                                          |
| Name                   | TEXT    | マテリアライズドビューの名前                                         |
| JobName                | TEXT    | マテリアライズドビューに対応する更新ジョブの名前。`jobs("type"="mv")` と `tasks("type"="mv")` の照会に使用できます。 |
| State                  | TEXT    | マテリアライズドビューのメタデータの状態。値は `INIT`、`NORMAL`、`SCHEMA_CHANGE` です。 |
| SchemaChangeDetail     | TEXT    | `State` が `SCHEMA_CHANGE` になった理由。マテリアライズドビューがスキーマ変更状態でない場合は空です。 |
| RefreshState           | TEXT    | 直近の更新の状態。値は `INIT`、`SUCCESS`、`FAIL` です。 |
| RefreshInfo            | TEXT    | マテリアライズドビューに定義された更新方針。構築モード、更新方法、トリガーモードを含みます。 |
| QuerySql               | TEXT    | マテリアライズドビューに定義された SQL クエリ                       |
| MvProperties           | TEXT    | マテリアライズドビューのプロパティ                                   |
| MvPartitionInfo        | TEXT    | マテリアライズドビューのパーティション情報                           |
| SyncWithBaseTables     | BOOLEAN | マテリアライズドビューのデータがベーステーブルと同期しているかどうか。同期していないパーティションを確認するには、[SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS) を使用します。 |
| IvmBaseTableStreams    | TEXT    | IVM のベーステーブルと、Doris が自動的に作成する内部 Table Streams の対応関係。IVM 以外のマテリアライズドビューでは通常は空です。 |

`RefreshInfo` は `BUILD <BuildMode> REFRESH <RefreshMethod> ON <RefreshTrigger> [schedule]` の形式で表示されます。各部分の意味は、以下の列挙値のセクションで説明します。

### MV 情報の列挙値フィールド

マテリアライズドビューの定義や状態を確認する際には、次の列挙値フィールドをよく使用します。

- `State`: マテリアライズドビューのメタデータの状態。
  - `INIT`: マテリアライズドビューは作成されていますが、メタデータが通常の利用可能な状態にはまだ達していません。
  - `NORMAL`: マテリアライズドビューのメタデータは正常です。通常はこの状態が期待されます。
  - `SCHEMA_CHANGE`: ベーステーブルまたは関連オブジェクトのスキーマ変更が、このマテリアライズドビューに影響を与えています。理由は `SchemaChangeDetail` で確認してください。通常、マテリアライズドビューは直接クエリできますが、更新が成功するまでは透過的なクエリ書き換えに使用できない場合があります。
- `RefreshState`: 直近の更新結果の状態。
  - `INIT`: 更新結果がまだ記録されていません。
  - `SUCCESS`: 直近の更新は正常に完了しました。
  - `FAIL`: 直近の更新は失敗しました。`JobName` を使って `tasks("type"="mv")` を照会し、失敗したタスクの `ErrorMsg` を確認してください。
- `RefreshInfo.BuildMode`: Doris がマテリアライズドビューのデータを構築するタイミング。
  - `IMMEDIATE`: 作成直後にマテリアライズドビューを構築します。
  - `DEFERRED`: 作成時には構築しません。新しいデータを得るには、後でマテリアライズドビューを更新する必要があります。
- `RefreshInfo.RefreshMethod`: Doris が更新するデータを選択する方法。
  - `COMPLETE`: 常にマテリアライズドビュー全体を更新します。
  - `PARTITIONS`: 変更があったマテリアライズドビューのパーティションを再計算します。
  - `INCREMENTAL`: 増分ビュー保守（IVM）を使用して、行単位の変更を処理します。
  - `AUTO`: Doris が IVM、パーティション単位の更新、または全体の更新を自動的に選択します。
- `RefreshInfo.RefreshTrigger`: 更新タスクを起動する条件。
  - `MANUAL`: 手動で更新を起動します。
  - `COMMIT`: 関連するベーステーブルのデータ変更によって更新を起動します。
  - `SCHEDULE`: スケジュールによって更新を起動します。スケジュールの詳細は、`ON SCHEDULE` 以降の `RefreshInfo` に表示されます。
- `MvPartitionInfo.partitionType`: マテリアライズドビューのパーティション分割方法。
  - `FOLLOW_BASE_TABLE`: マテリアライズドビューのパーティションは、ベーステーブルのパーティション列に従います。
  - `SELF_MANAGE`: マテリアライズドビューが独自のパーティションを管理します。
  - `EXPR`: マテリアライズドビューのパーティションを式で定義します。
- `SyncWithBaseTables`: マテリアライズドビューのデータがベーステーブルと同期しているかどうか。
  - `1` または `true`: 同期しています。
  - `0` または `false`: 完全には同期していません。パーティション分割されたマテリアライズドビューでは、`SHOW PARTITIONS FROM <mv_name>` を使用してパーティション単位の同期状態を確認します。
- `IvmBaseTableStreams`: IVM で使用されるベーステーブルと内部 Streams の対応関係。内部 Streams は Doris が管理するため、手動で読み取ったり、リセットしたり、削除したりしないでください。[増分ビュー保守（IVM）](../../../query-acceleration/materialized-view/async-materialized-view/incremental-materialized-view#internal-table-streams) を参照してください。

## 例

データベース `test` 内のマテリアライズドビューを表示します。

```sql
select *
from mv_infos("database"="test")
where Name = "mv1"\G
```
```text
*************************** 1. row ***************************
                Id: 19494
              Name: mv1
           JobName: inner_mtmv_19494
             State: NORMAL
SchemaChangeDetail:
      RefreshState: SUCCESS
       RefreshInfo: BUILD DEFERRED REFRESH AUTO ON MANUAL
          QuerySql: SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user`
      MvProperties: {partition_sync_limit=100, partition_sync_time_unit=YEAR}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'}
SyncWithBaseTables: 1
IvmBaseTableStreams: \N
```

この結果では、次のことが分かります。

- `Id` と `Name` はマテリアライズドビューを識別します。
- `JobName` はこのマテリアライズドビューの更新ジョブ名です。ジョブや更新タスクの照会に使用できます。例えば、`select * from jobs("type"="mv") where Name = "inner_mtmv_19494";` と指定します。
- `State` は `NORMAL` で、マテリアライズドビューのメタデータが正常であることを示します。`INIT` はマテリアライズドビューが作成または初期化されたばかりであることを示します。`SCHEMA_CHANGE` はベーステーブルのスキーマ変更がこのマテリアライズドビューに影響したことを示します。この状態では `SchemaChangeDetail` を確認してください。
- `SchemaChangeDetail` が空なのは、`State` が `SCHEMA_CHANGE` ではないためです。
- `RefreshState` は `SUCCESS` で、直近の更新が成功したことを示します。`INIT` は更新の成功状態がまだ記録されていないことを示します。`FAIL` は直近の更新が失敗したことを示します。`tasks("type"="mv")` を `JobName` で照会し、失敗したタスクとその `ErrorMsg` を確認してください。
- `RefreshInfo` は `BUILD DEFERRED REFRESH AUTO ON MANUAL` です。`BUILD DEFERRED` は、マテリアライズドビューが作成時にすぐには構築されなかったことを示します。`REFRESH AUTO` は、すべてのパーティションを更新するか、変更されたパーティションのみを更新するかを Doris が決定することを示します。`ON MANUAL` は、スケジュールではなく手動で更新を起動することを示します。
- `QuerySql` はマテリアライズドビューのクエリ定義です。
- `MvProperties` はマテリアライズドビューのプロパティを示します。この例では、パーティションの同期が `partition_sync_limit=100` と `partition_sync_time_unit=YEAR` によって制限されています。
- `MvPartitionInfo` はマテリアライズドビューのパーティション分割方法を示します。`FOLLOW_BASE_TABLE` は、マテリアライズドビューがベーステーブルのパーティション列に従うことを示します。`SELF_MANAGE` は、マテリアライズドビューが独自のパーティションを管理することを示します。`EXPR` は、式を使ってマテリアライズドビューのパーティションを定義することを示します。
- `SyncWithBaseTables` は `1` で、マテリアライズドビューのデータがベーステーブルと同期していることを示します。`0` は完全には同期していないことを示します。パーティション分割されたマテリアライズドビューでは、`SHOW PARTITIONS FROM <mv_name>` を使用してパーティション単位の同期状態を確認してください。
- `IvmBaseTableStreams` が空なのは、この例が IVM ではないためです。

このマテリアライズドビューの直近の更新タスクを表示するには、次のクエリを実行します。

```sql
select *
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc
limit 1;
```
