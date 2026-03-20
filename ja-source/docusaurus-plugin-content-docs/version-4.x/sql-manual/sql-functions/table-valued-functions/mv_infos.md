---
{
  "title": "MV_INFOS",
  "description": "table関数、非同期マテリアライズドビューのための一時tableを生成する、",
  "language": "ja"
}
---
## デスクリプション

非同期マテリアライズドビューの一時tableを生成するtable関数で、特定のデータベース内に作成された非同期マテリアライズドビューに関する情報を表示できます。

## Syntax

```sql
MV_INFOS("database"="<database>")
```
## 必須パラメータ
**`<database>`**
> クエリ対象のクラスターデータベース名を指定します


## 戻り値

| フィールド               | 型      | 説明                                                         |
|------------------------|---------|---------------------------------------------------------------------|
| Id                     | BIGINT  | Materialized view ID                                                |
| Name                   | TEXT    | Materialized view名                                              |
| JobName                | TEXT    | Materialized viewに対応するJob名                      |
| State                  | TEXT    | Materialized viewの状態                                       |
| SchemaChangeDetail     | TEXT    | SchemaChangeへの状態変更の理由                         |
| RefreshState           | TEXT    | Materialized viewのリフレッシュ状態                               |
| RefreshInfo            | TEXT    | Materialized viewに定義されたリフレッシュ戦略情報       |
| QuerySql               | TEXT    | Materialized viewに定義されたSQLクエリ                          |
| EnvInfo                | TEXT    | Materialized view作成時の環境情報       |
| MvProperties           | TEXT    | Materialized viewプロパティ                                         |
| MvPartitionInfo        | TEXT    | Materialized viewのパーティション情報                       |
| SyncWithBaseTables     | BOOLEAN | ベースTableとデータが同期されているかどうか。どのパーティションが同期されていないかを確認するには、[SHOW PARTITIONS](../../sql-statements/table-and-view/table/SHOW-PARTITIONS)を使用します |

## 例

testの下にあるすべてのmaterialized viewを表示

```sql
select * from mv_infos("database"="test");
```
```text
+-------+--------------------------+------------------+--------+--------------------+--------------+---------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| Id    | Name                     | JobName          | State  | SchemaChangeDetail | RefreshState | RefreshInfo                           | QuerySql                                                                                                                                                         | MvProperties                                              | MvPartitionInfo                                                                                           | SyncWithBaseTables |
+-------+--------------------------+------------------+--------+--------------------+--------------+---------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| 19494 | mv1                      | inner_mtmv_19494 | NORMAL |                    | SUCCESS      | BUILD DEFERRED REFRESH AUTO ON MANUAL | SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user`                                                                      | {partition_sync_limit=100, partition_sync_time_unit=YEAR} | MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'} |                  1 |
| 21788 | test_tablet_type_mtmv_mv | inner_mtmv_21788 | NORMAL |                    | SUCCESS      | BUILD DEFERRED REFRESH AUTO ON MANUAL | SELECT `internal`.`test`.`test_tablet_type_mtmv_table`.`k2`, `internal`.`test`.`test_tablet_type_mtmv_table`.`k3` from `internal`.`test`.`test_tablet_type_mtmv_table` | {}                                                        | MTMVPartitionInfo{partitionType=SELF_MANAGE}                                                              |                  0 |
+-------+--------------------------+------------------+--------+--------------------+--------------+---------------------------------------+------------------------------------------------------------------------------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
```
test配下のmv1という名前のマテリアライズドビューを表示する

```sql
select * from mv_infos("database"="test") where Name = "mv1";
```
```text
+-------+------+------------------+--------+--------------------+--------------+---------------------------------------+---------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| Id    | Name | JobName          | State  | SchemaChangeDetail | RefreshState | RefreshInfo                           | QuerySql                                                                                    | MvProperties                                              | MvPartitionInfo                                                                                           | SyncWithBaseTables |
+-------+------+------------------+--------+--------------------+--------------+---------------------------------------+---------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
| 19494 | mv1  | inner_mtmv_19494 | NORMAL |                    | SUCCESS      | BUILD DEFERRED REFRESH AUTO ON MANUAL | SELECT `internal`.`test`.`user`.`k2`, `internal`.`test`.`user`.`k3` FROM `internal`.`test`.`user` | {partition_sync_limit=100, partition_sync_time_unit=YEAR} | MTMVPartitionInfo{partitionType=FOLLOW_BASE_TABLE, relatedTable=user, relatedCol='k2', partitionCol='k2'} |                  1 |
+-------+------+------------------+--------+--------------------+--------------+---------------------------------------+---------------------------------------------------------------------------------------------+-----------------------------------------------------------+-----------------------------------------------------------------------------------------------------------+--------------------+
```
