---
{
    "title": "MV_INFOS",
    "language": "ja",
    "description": "非同期マテリアライズドビューの情報を参照するための一時テーブルを生成するテーブル関数。"
}
---

## 説明

非同期マテリアライズドビューのための一時テーブルを生成するテーブル関数です。指定したデータベースに作成された非同期マテリアライズドビューの情報を参照できます。

## 構文
```sql
MV_INFOS("database"="<database>")
```

## パラメータ

| パラメータ       | 説明 |
|------------------|-------------|
| **`<database>`** | 必須。文字列型。非同期マテリアライズドビューのメタデータを照会するデータベースの名前です。 |

## 戻り値

このテーブル関数は、非同期マテリアライズドビューを説明する行をゼロ行以上返します。関数自体は NULL を返しません。対応するメタデータが取得できない場合、個々のフィールドが空または `NULL` になることがあります。

| フィールド           | 型      | 説明                                                         |
|------------------------|---------|---------------------------------------------------------------------|
| Id                     | BIGINT  | マテリアライズドビューの ID                                                |
| Name                   | TEXT    | マテリアライズドビューの名前                                              |
| JobName                | TEXT    | マテリアライズドビューに対応するリフレッシュジョブの名前。`jobs("type"="mv")` と `tasks("type"="mv")` の照会に使用できます。 |
| State                  | TEXT    | マテリアライズドビューのメタデータの状態。取り得る値は `INIT`、`NORMAL`、`SCHEMA_CHANGE` です。 |
| SchemaChangeDetail     | TEXT    | `State` が `SCHEMA_CHANGE` になった理由。マテリアライズドビューがスキーマ変更状態にない場合は空です。 |
| RefreshState           | TEXT    | 最新のリフレッシュの状態。取り得る値は `INIT`、`SUCCESS`、`FAIL` です。 |
| RefreshInfo            | TEXT    | マテリアライズドビューに定義されたリフレッシュ方式。構築モード、リフレッシュ方法、トリガーモードを含みます。 |
| QuerySql               | TEXT    | マテリアライズドビューに定義された SQL クエリ                          |
| EnvInfo                | TEXT    | マテリアライズドビューの作成時の環境情報       |
| MvProperties           | TEXT    | マテリアライズドビューのプロパティ                                         |
| MvPartitionInfo        | TEXT    | マテリアライズドビューのパーティション情報                       |
| SyncWithBaseTables     | BOOLEAN | マテリアライズドビューのデータがベーステーブルと同期しているかどうか。同期していないパーティションを調べるには、[SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS) を使用します。 |

`RefreshInfo` は `BUILD <BuildMode> REFRESH <RefreshMethod> ON <RefreshTrigger> [schedule]` の形式で表示されます。各部分の意味は、以下の列挙値のセクションで説明します。

### MV 情報の列挙値フィールド

マテリアライズドビューの定義と状態を確認する際によく使用する列挙値フィールドは、次のとおりです。

- `State`：マテリアライズドビューのメタデータの状態。
  - `INIT`：マテリアライズドビューは作成されていますが、メタデータはまだ通常の使用可能な状態に達していません。
  - `NORMAL`：マテリアライズドビューのメタデータは正常です。通常はこの状態が想定されます。
  - `SCHEMA_CHANGE`：ベーステーブルまたは関連オブジェクトのスキーマ変更が、このマテリアライズドビューに影響しました。理由は `SchemaChangeDetail` で確認してください。通常、マテリアライズドビューを直接クエリできますが、リフレッシュが正常に完了するまでは透過的なリライトに使用できない場合があります。
- `RefreshState`：最新のリフレッシュの結果を示す状態。
  - `INIT`：リフレッシュ結果がまだ記録されていません。
  - `SUCCESS`：最新のリフレッシュは正常に完了しました。
  - `FAIL`：最新のリフレッシュは失敗しました。`JobName` を使用して `tasks("type"="mv")` を照会し、失敗したタスクの `ErrorMsg` を確認してください。
- `RefreshInfo.BuildMode`：Doris がマテリアライズドビューのデータを構築するタイミング。
  - `IMMEDIATE`：作成直後にマテリアライズドビューを構築します。
  - `DEFERRED`：作成時には構築しません。マテリアライズドビューが新しいデータを持つには、後でリフレッシュする必要があります。
- `RefreshInfo.RefreshMethod`：Doris がリフレッシュ対象のデータを選択する方法。
  - `COMPLETE`：常にマテリアライズドビュー全体をリフレッシュします。
  - `AUTO`：すべてのパーティションをリフレッシュするか、変更されたパーティションだけをリフレッシュするかを Doris が判断します。
- `RefreshInfo.RefreshTrigger`：リフレッシュタスクのトリガー。
  - `MANUAL`：手動でリフレッシュを開始します。
  - `COMMIT`：関連するベーステーブルのデータ変更によってリフレッシュを開始します。
  - `SCHEDULE`：スケジュールによってリフレッシュを開始します。スケジュールの詳細は、`ON SCHEDULE` に続いて `RefreshInfo` に表示されます。
- `MvPartitionInfo.partitionType`：マテリアライズドビューのパーティション分割方法。
  - `FOLLOW_BASE_TABLE`：マテリアライズドビューのパーティションは、ベーステーブルのパーティション列に従います。
  - `SELF_MANAGE`：マテリアライズドビューが自身のパーティションを管理します。
  - `EXPR`：マテリアライズドビューのパーティションは式で定義されます。
- `SyncWithBaseTables`：マテリアライズドビューのデータがベーステーブルと同期しているかどうか。
  - `1` または `true`：同期しています。
  - `0` または `false`：完全には同期していません。パーティション分割されたマテリアライズドビューでは、`SHOW PARTITIONS FROM <mv_name>` を使用してパーティション単位の同期状態を確認します。

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
           EnvInfo: EnvInfo{ctlId='0', dbId='16813'}
      MvProperties: {partition_sync_limit=100, partition_sync_time_unit=YEAR}
   MvPartitionInfo: MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'}
SyncWithBaseTables: 1
```

この結果では、各フィールドは次の意味を持ちます。

- `Id` と `Name` はマテリアライズドビューを識別します。
- `JobName` は、このマテリアライズドビューのリフレッシュジョブ名です。ジョブやリフレッシュタスクの照会に使用します。たとえば、`select * from jobs("type"="mv") where Name = "inner_mtmv_19494";` のように照会します。
- `State` は `NORMAL` で、マテリアライズドビューのメタデータが正常であることを示します。`INIT` はマテリアライズドビューが作成または初期化されたばかりであることを示します。`SCHEMA_CHANGE` は、ベーステーブルのスキーマ変更がこのマテリアライズドビューに影響したことを示します。この状態では `SchemaChangeDetail` を確認してください。
- `SchemaChangeDetail` は、`State` が `SCHEMA_CHANGE` ではないため空です。
- `RefreshState` は `SUCCESS` で、最新のリフレッシュが成功したことを示します。`INIT` は成功したリフレッシュ状態がまだ記録されていないことを示します。`FAIL` は最新のリフレッシュが失敗したことを示します。`tasks("type"="mv")` を `JobName` で照会し、失敗したタスクとその `ErrorMsg` を確認してください。
- `RefreshInfo` は `BUILD DEFERRED REFRESH AUTO ON MANUAL` です。`BUILD DEFERRED` は、作成時にマテリアライズドビューがすぐには構築されなかったことを示します。`REFRESH AUTO` は、すべてのパーティションをリフレッシュするか、変更されたパーティションだけをリフレッシュするかを Doris が判断することを示します。`ON MANUAL` は、スケジュールではなく手動でリフレッシュを開始することを示します。
- `QuerySql` はマテリアライズドビューのクエリ定義です。
- `EnvInfo` は、マテリアライズドビューの作成時の環境情報を記録します。
- `MvProperties` はマテリアライズドビューのプロパティを示します。この例では、パーティションの同期は `partition_sync_limit=100` と `partition_sync_time_unit=YEAR` によって制限されます。
- `MvPartitionInfo` は、マテリアライズドビューのパーティション分割方法を示します。`FOLLOW_BASE_TABLE` は、マテリアライズドビューがベーステーブルのパーティション列に従うことを示します。`SELF_MANAGE` は、マテリアライズドビューが自身のパーティションを管理することを示します。`EXPR` は、マテリアライズドビューのパーティションが式で定義されることを示します。
- `SyncWithBaseTables` は `1` で、マテリアライズドビューのデータがベーステーブルと同期していることを示します。`0` は完全には同期していないことを示します。パーティション分割されたマテリアライズドビューでは、`SHOW PARTITIONS FROM <mv_name>` を使用してパーティション単位の同期状態を確認します。

このマテリアライズドビューの最新のリフレッシュタスクを表示するには、次のようにします。

```sql
select TaskId, JobName, MvName, Status, ErrorMsg, CreateTime, FinishTime
from tasks("type"="mv")
where JobName = "inner_mtmv_19494"
order by CreateTime desc
limit 1;
```
```text
+-----------------+------------------+--------+---------+----------+---------------------+---------------------+
| TaskId          | JobName          | MvName | Status  | ErrorMsg | CreateTime          | FinishTime          |
+-----------------+------------------+--------+---------+----------+---------------------+---------------------+
| 437156301250803 | inner_mtmv_19494 | mv1    | SUCCESS |          | 2025-01-07 22:13:48 | 2025-01-07 22:17:45 |
+-----------------+------------------+--------+---------+----------+---------------------+---------------------+
```
