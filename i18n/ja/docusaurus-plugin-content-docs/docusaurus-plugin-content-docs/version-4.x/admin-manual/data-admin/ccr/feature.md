---
{
  "title": "機能詳細",
  "language": "ja",
  "description": "DorisのCross-Cluster Replication（CCR）機能は、主に複数のクラスター間でデータを効率的に同期するために使用されます。"
}
---
DorisのCross-Cluster Replication（CCR）機能は、複数のクラスタ間でデータを効率的に同期するために主に使用され、ビジネス継続性と災害復旧機能を強化します。CCRはDorisの様々な操作をサポートし、異なるクラスタ間でデータの一貫性を確保します。以下は、CCRでサポートされる主要なDoris操作の詳細です。

:::note

1. Doris Versionの`-`は、Doris version 2.0以降のCCRの全バージョンを示します。Doris version 2.0.15または2.1.6以降の使用を推奨します。
2. CCR SyncerとDorisのバージョン要件：Syncer Version >= Downstream Doris Version >= Upstream Doris Version。そのため、最初にSyncer、次にdownstream Doris、最後にupstream Dorisをアップグレードしてください。
3. CCRは現在、ストレージとコンピュートの分離をサポートしていません。

:::

## Database

### Database Properties

データベースレベルのジョブは、Full Sync中にデータベースのプロパティを同期します。

| Property                | Supported | Doris Version | Sync Method | Description |
| ----------------------- | --------- | ------------- | ----------- | ----------- |
| replication_allocation  | Supported | -             | Full Sync   |             |
| data quota              | Not Supported |           |             |             |
| replica quota           | Not Supported |           |             |             |

### Modify Database Properties

CCRジョブは、データベースプロパティを変更する操作を同期しません。

| Property                | Supported | Can Upstream Operate | Can Downstream Operate | Description                              |
| ----------------------- | --------- | -------------------- | ---------------------- | ---------------------------------------- |
| replication_allocation  | Not Supported | No                 | No                     | 両側での操作はCCRジョブの中断を引き起こします |
| data quota              | Not Supported | Yes                | Yes                    |                                          |
| replica quota           | Not Supported | Yes                | Yes                    |                                          |

### Rename Database

upstreamとdownstreamでのリネームはサポートされていません。実行するとビューが動作しなくなる可能性があります。

## Table
### Table Properties

| Property                                      | Supported | Doris Version | Sync Method | Description                                                     |
| --------------------------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| Table Model (duplicate, unique, aggregate)    | Supported | -             | SQL         |                                                                |
| Partition and Bucketing                        | Supported | -             | SQL         |                                                                |
| replication_num                               | Supported | -             | SQL         |                                                                |
| replication_allocation (resource group)       | Supported | -             | SQL         | upstreamはdownstreamと一致する必要があり、BEタグが一致する必要があります。そうでなければCCRジョブは失敗します |
| colocate_with                                 | Not Supported |           |             |                                                                |
| storage_policy                                 | Not Supported |           |             |                                                                |
| dynamic_partition                              | Supported | -             | SQL         |                                                                |
| storage_medium                                 | Supported | -             | SQL         |                                                                |
| auto_bucket                                    | Supported | -             | SQL         |                                                                |
| group_commit series                           | Supported | -             | SQL         |                                                                |
| enable_unique_key_merge_on_write              | Supported | -             | SQL         |                                                                |
| enable_single_replica_compaction              | Supported | -             | SQL         |                                                                |
| disable_auto_compaction                       | Supported | -             | SQL         |                                                                |
| compaction_policy                             | Supported | -             | SQL         |                                                                |
| time_series_compaction series                 | Supported | -             | SQL         |                                                                |
| binlog series                                 | Supported | -             | SQL         |                                                                |
| variant_enable_flatten_nested                 | Supported | -             | SQL         |                                                                |
| skip_write_index_on_load                      | Supported | -             | SQL         |                                                                |
| row_store series                               | Supported | -             | SQL         |                                                                |
| seq column                                    | Supported | -             | SQL         |                                                                |
| enable_light_schema_change                    | Supported | -             | SQL         |                                                                |
| compression_type                              | Supported | -             | SQL         |                                                                |
| index                                         | Supported | -             | SQL         |                                                                |
| bloom_filter_columns                          | Supported | -             | SQL         |                                                                |
| bloom_filter_fpp                              | Supported |               |             |                                                                |
| storage_cooldown_time                         | Not Supported |           |             |                                                                |
| generated column                               | Supported | -             | SQL         |                                                                |
| auto-increment id                             | Not Supported |           |             | 問題があります                                                   |

### Basic Table Operations

| Operation      | Supported | Doris Version | Sync Method | Can Downstream Operate Independently | Description |
| -------------- | --------- | ------------- | ----------- | ------------------------------------ | ----------- |
| create table   | Supported | -             | SQL/Partial Sync | CCRジョブで同期されるテーブルでは操作できません | テーブル作成のプロパティを参照してください。ほとんどの場合SQLで同期を使用します。ユーザーが特定のセッション変数を設定した場合やcreate table文に転置インデックスが含まれている場合など、一部の操作ではPartial Syncを使用します |
| drop table     | Supported | -             | SQL/Full Sync | 上記と同様 | 2.0.15/2.1.6以前：Full Sync、以降：SQL |
| rename table   | テーブルレベルのジョブはデータベースレベルのジョブをサポートしません | 2.1.8/3.0.4 | SQL | 上記と同様 | テーブルレベルジョブのリネームはCCRジョブの停止を引き起こします |
| replace table  | Supported | 2.1.8/3.0.4 | SQL/Full Sync | 上記と同様 | データベースレベル同期ではSQLを使用し、テーブルレベルではfull syncをトリガーします |
| truncate table | Supported | -             | SQL | 上記と同様 | |
| restore table  | Not Supported | | | 上記と同様 | |

### Modify Table Properties

同期方法はSQLです。

| Property                       | Supported | Doris Version | Can Upstream Operate | Can Downstream Operate | Description                                    |
| ------------------------------ | --------- | ------------- | -------------------- | ---------------------- | ---------------------------------------------- |
| colocate                       | Not Supported |           | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| distribution type              | Not Supported |           | No                   | Same                   |                                                |
| dynamic partition              | Not Supported |           | Yes                  | Same                   |                                                |
| replication_num                | Not Supported |           | No                   | No                     |                                                |
| replication_allocation         | Not Supported |           | No                   |                        |                                                |
| storage policy                 | Not Supported |           | No                   | No                     |                                                |
| enable_light_schema_change     | Not Supported |           |                      |                        | CCRは軽量スキーマ変更のみ同期できます。 |
| row_store                      | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通して |
| bloom_filter_columns           | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通して |
| bloom_filter_fpp               | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通して |
| bucket num                     | Not Supported |           | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| isBeingSynced                  | Not Supported |           | No                   | No                     |                                                |
| compaction series properties    | Not Supported |           | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| skip_write_index_on_load       | Not Supported |           | Yes                  | Same                   |                                                |
| seq column                     | Supported | -             | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| delete sign column             | Supported | -             | Yes                  | Same                   |                                                |
| comment                        | Supported | 2.1.8/3.0.4 | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |

### Column Operations

テーブル内のBase Indexでの列操作。

| Operation          | Supported | Doris Version | Sync Method           | Can Downstream Operate | Remarks                            |
| ------------------ | --------- | ------------- | --------------------- | ---------------------- | ---------------------------------- |
| add key column     | Supported | -             | Partial Sync          | No                     |                                    |
| add value column   | Supported | -             | SQL                   | No                     |                                    |
| drop key column    | Supported | -             | Partial Sync          | Same                   |                                    |
| drop value column  | Supported | -             | SQL                   | Same                   |                                    |
| modify column      | Supported | -             | Partial Sync          | Same                   |                                    |
| order by           | Supported | -             | Partial Sync          | Same                   |                                    |
| rename             | Supported | 2.1.8/3.0.4  | SQL                   | Same                   |                                    |
| comment            | Supported | 2.1.8/3.0.4  | SQL                   | Same                   |                                    |

:::note

value列の追加/削除には、テーブル作成時にプロパティ`"light_schema_change" = "true"`の設定が必要です。

:::

テーブル内のRollup Indexでの列操作。

| Operation          | Supported | Doris Version | Sync Method           | Remarks              |
| ------------------ | --------- | ------------- | --------------------- | -------------------- |
| add key column     | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| add value column   | Supported | 2.1.8/3.0.4  | SQL                   | ライトニングスキーマ変更の有効化が必要 |
| drop column        | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| modify column      | Unknown   | 2.1.8/3.0.4  | Partial Sync          | DorisはRollup列タイプの直接変更をサポートしていません |
| order by           | Supported | 2.1.8/3.0.4  | Partial sync          |                      |

### Rollup

| Operation          | Supported | Doris Version | Sync Method           | Remarks         |
| ------------------ | --------- | ------------- | --------------------- | ---------------- |
| add rollup         | Supported | 2.1.8/3.0.4  | Partial Sync          |                  |
| drop rollup        | Supported | 2.1.8/3.0.4  | SQL                   |                  |
| rename rollup      | Supported | 2.1.8/3.0.4  | SQL                   |                  |

### Index

転置インデックス

| Operation         | Supported | Doris Version | Sync Method           | Remarks     |
| ------------------ | --------- | ------------- | --------------------- | ----------- |
| create index      | Supported | 2.1.8/3.0.4  | Partial Sync          |             |
| drop index        | Supported | 2.1.8/3.0.4  | SQL                   |             |
| build index       | Supported | 2.1.8/3.0.4  | SQL                   |             |

Bloom Filter

| Operation         | Supported | Doris Version | Sync Method           | Remarks     |
| ------------------ | --------- | ------------- | --------------------- | ----------- |
| add bloom filter   | Supported | 2.1.8/3.0.4  | Partial Sync          |             |
| alter bloom filter | Supported | 2.1.8/3.0.4  | Partial Sync          | これはbloom_filter_columnsの変更を指します |
| drop bloom filter  | Supported | 2.1.8/3.0.4  | Partial Sync          |             |

## Data

### Import

| Import Method     | Supported             | Doris Version | Sync Method | Can Downstream Operate                                             | Description                                                 |
| ------------------ | -------------------- | ------------- | ----------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| stream load        | Supported（一時パーティションを除く） | -             | TXN         | No、downstreamがインポートした場合、その後のfullまたはPartial Syncのトリガーによりデータ損失が発生します | upstreamトランザクションが可視になると、つまりbinlog生成時にデータが可視になると、downstreamが同期を開始します。 |
| broker load        | Supported（一時パーティションを除く） | -             | TXN         | Same                                                         | Same                                                      |
| routine load       | Supported（一時パーティションを除く） | -             | TXN         | Same                                                         | Same                                                      |
| mysql load         | Supported（一時パーティションを除く） | -             | TXN         | Same                                                         | Same                                                      |
| group commit       | Supported（一時パーティションを除く） | 2.1           | TXN         | Same                                                         | Same                                                      |

### Data Operations

| Operation                      | Supported             | Doris Version | Sync Method     | Can Downstream Operate                                             | Description                                                 |
| ------------------------------- | -------------------- | ------------- | ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| delete                          | Supported             | -             | TXN              | No、downstream操作した場合、その後のfullまたはPartial Syncのトリガーによりデータ損失が発生します | upstreamトランザクションが可視になると、つまりbinlog生成時にデータが可視になると、downstreamが同期を開始します。 |
| update                          | Supported             | -             | TXN              | Same                                                         | Same                                                      |
| insert                          | Supported             | -             | TXN              | Same                                                         | Same                                                      |
| insert into overwrite           | Supported（一時パーティションを除く） | 2.1.6         | Partial Sync | Same                                                         | Same                                                      |
| insert into overwrite           | Supported（一時パーティションを除く） | 2.0           | full sync    | Same                                                         | Same                                                      |
| Explicit transaction (3.0) begin commit | Not Supported |               |                  |                                                              |                                                          |

## Partition Operations

| Operation               | Supported                        | Doris Version | Sync Method            | Can Downstream Operate Independently                                        | Description                                                         |
| ----------------------- | ------------------------------- | ------------- | ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| add partition           | Supported                       | -             | SQL                    | No、その後のFull SyncまたはPartial Syncのトリガーによりdownstream操作が失われます | cooldown timeプロパティとその動作は不明です |
| add temp partition      | Not Supported                   |               |                        | Same                                                         | バックアップはtemp partitionをサポートしません。Doris 2.1.8/3.0.4以降では、upstream FE設定：`ignore_backup_tmp_partitions`を変更してこの問題を回避できます |
| drop partition          | Supported                       | -             | SQL/Full Sync          | Same                                                         | 2.0.15/2.1.6以前：Full Sync、以降：SQL |
| replace partition       | Supported                       | 2.1.7/3.0.3  | Partial Sync           | Same                                                         | Partial Sync **strict rangeと非temp partition replace方法のみサポート**、そうでなければFull Syncをトリガーします。 |
| modify partition        | Not Supported                   |               |                        | Same                                                         | パーティションのプロパティ変更を指します |
| rename partition        | Supported                       | 2.1.8/3.0.4  | SQL                    | Same                                                         | |

## Views

| Operation        | Supported | Doris Version | Sync Method | Remarks                             |
| ---------------- | --------- | ------------- | ----------- | ---------------------------------- |
| create view      | Supported | -             | SQL         | upstreamとdownstreamが同じ名前の場合動作します。downstreamに既に存在する場合、作成前に削除されます |
| alter view       | Supported | 2.1.8/3.0.4  | SQL         |                                    |
| drop view        | Supported | 2.1.8/3.0.4  | SQL         |                                    |

::: note

Doris実装の制限により、ビュー内の列名/ビュー名はデータベース名と同じにできません。

:::

## Materialized Views

マテリアライズドビューの同期

| Operation                     | Supported | Doris Version | Sync Method | Remarks                                                         |
| ----------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| create materialized view      | Supported | 2.1.8/3.0.4  | Partial Sync | upstreamとdownstreamが同じ名前の場合動作します。名前が異なる場合、downstreamでビューを手動で再構築する必要があります。 |
| drop materialized view        | Supported | 2.1.8/3.0.4  | SQL         |                                                              |


非同期マテリアライズドビュー

| Operation                           | Supported |
| ----------------------------------- | --------- |
| create async materialized view      | Not Supported |
| alter async materialized view       | Not Supported |
| drop async materialized view        | Not Supported |
| refresh                             | Not Supported |
| pause                               | Not Supported |
| resume                              | Not Supported |

## Statistics

upstreamとdownstream間で同期されず、独立して操作されます。

## Others

| Operation             | Supported |
| --------------------- | --------- |
| external table        | Not Supported |
| recycle bin           | Not Supported |
| catalog               | Not Supported |
| workload group        | Not Supported |
| job                   | Not Supported |
| function              | Not Supported |
| policy                | Not Supported |
| user                  | Not Supported |
| cancel alter job      | Supported |
