---
{
  "title": "機能詳細",
  "language": "ja",
  "description": "DorisのCross-Cluster Replication（CCR）機能は、主に複数のクラスター間でデータを効率的に同期するために使用されます。"
}
---
DorisのCross-Cluster Replication（CCR）機能は、複数のクラスター間でデータを効率的に同期するために主に使用され、ビジネス継続性と災害復旧能力を向上させます。CCRはDorisの様々な操作をサポートし、異なるクラスター間でのデータ整合性を保証します。以下は、CCRがサポートするDorisの主要操作の詳細です。

:::note

1. Doris Versionの`-`は、Doris version 2.0以降、CCRの全バージョンを示します。Doris version 2.0.15または2.1.6以降の使用を推奨します。
2. CCR SyncerとDorisのバージョン要件：Syncer Version >= Downstream Doris Version >= Upstream Doris Version。従って、Syncerを最初に、次にdownstream Doris、最後にupstream Dorisをアップグレードしてください。
3. CCRは現在、ストレージと計算の分離をサポートしていません。

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
| replication_allocation  | Not Supported | No                 | No                     | 両側での操作により、CCRジョブが中断される原因となります |
| data quota              | Not Supported | Yes                | Yes                    |                                          |
| replica quota           | Not Supported | Yes                | Yes                    |                                          |

### Rename Database

upstreamとdownstreamでのリネームはサポートされていません。実行すると、viewが動作を停止する可能性があります。

## Table
### Table Properties

| Property                                      | Supported | Doris Version | Sync Method | Description                                                     |
| --------------------------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| Table Model (duplicate, unique, aggregate)    | Supported | -             | SQL         |                                                                |
| Partition and Bucketing                        | Supported | -             | SQL         |                                                                |
| replication_num                               | Supported | -             | SQL         |                                                                |
| replication_allocation (resource group)       | Supported | -             | SQL         | Upstreamはdownstreamと一致している必要があり、BEタグが一致する必要があります。そうでなければ、CCRジョブは失敗します |
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
| create table   | Supported | -             | SQL/Partial Sync | CCRジョブによって同期されたテーブルでは操作できません。 | テーブル作成のプロパティを参照してください。ほとんどの場合、同期にはSQLを使用します。ユーザーが特定のセッション変数を設定した場合やcreate table文に転置インデックスが含まれる場合など、一部の操作ではpartial syncを使用します |
| drop table     | Supported | -             | SQL/Full Sync | 上記と同じ | 2.0.15/2.1.6より前：Full Sync、後：SQL |
| rename table   | Table-levelジョブはdatabase-levelジョブをサポートしません | 2.1.8/3.0.4 | SQL | 上記と同じ | Table-levelジョブのリネームはCCRジョブを停止させます |
| replace table  | Supported | 2.1.8/3.0.4 | SQL/Full Sync | 上記と同じ | database-level同期ではSQLを使用、table-levelではfull synchronizationをトリガーします |
| truncate table | Supported | -             | SQL | 上記と同じ | |
| restore table  | Not Supported | | | 上記と同じ | |

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
| row_store                      | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通じて |
| bloom_filter_columns           | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通じて |
| bloom_filter_fpp               | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通じて |
| bucket num                     | Not Supported |           | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| isBeingSynced                  | Not Supported |           | No                   | No                     |                                                |
| compaction series properties    | Not Supported |           | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| skip_write_index_on_load       | Not Supported |           | Yes                  | Same                   |                                                |
| seq column                     | Supported | -             | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |
| delete sign column             | Supported | -             | Yes                  | Same                   |                                                |
| comment                        | Supported | 2.1.8/3.0.4 | Yes                  | No                     | downstream操作でfull syncをトリガーするとデータ損失が発生します |

### Column Operations

テーブル内のBase Indexでのカラム操作。

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

value columnの追加/削除には、テーブル作成時にプロパティ`"light_schema_change" = "true"`の設定が必要です。

:::

テーブル内のRollup Indexでのカラム操作。

| Operation          | Supported | Doris Version | Sync Method           | Remarks              |
| ------------------ | --------- | ------------- | --------------------- | -------------------- |
| add key column     | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| add value column   | Supported | 2.1.8/3.0.4  | SQL                   | lightning schema changeの有効化が必要 |
| drop column        | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| modify column      | Unknown   | 2.1.8/3.0.4  | Partial Sync          | Dorisはrollupカラムタイプの直接変更をサポートしていません |
| order by           | Supported | 2.1.8/3.0.4  | Partial sync          |                      |

### Rollup

| Operation          | Supported | Doris Version | Sync Method           | Remarks         |
| ------------------ | --------- | ------------- | --------------------- | ---------------- |
| add rollup         | Supported | 2.1.8/3.0.4  | Partial Sync          |                  |
| drop rollup        | Supported | 2.1.8/3.0.4  | SQL                   |                  |
| rename rollup      | Supported | 2.1.8/3.0.4  | SQL                   |                  |

### Index

Inverted Index

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
| stream load        | Supported（一時パーティションを除く） | -             | TXN         | No、downstreamでインポートすると、その後のfullまたはPartial Syncのトリガーによりデータ損失が発生します | Upstreamトランザクションは可視、つまりbinlog生成時にデータが可視で、downstreamが同期を開始します。 |
| broker load        | Supported（一時パーティションを除く） | -             | TXN         | Same                                                         | Same                                                      |
| routine load       | Supported（一時パーティションを除く） | -             | TXN         | Same                                                         | Same                                                      |
| mysql load         | Supported（一時パーティションを除く） | -             | TXN         | Same                                                         | Same                                                      |
| group commit       | Supported（一時パーティションを除く） | 2.1           | TXN         | Same                                                         | Same                                                      |

### Data Operations

| Operation                      | Supported             | Doris Version | Sync Method     | Can Downstream Operate                                             | Description                                                 |
| ------------------------------- | -------------------- | ------------- | ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| delete                          | Supported             | -             | TXN              | No、downstream操作により、その後のfullまたはPartial Syncのトリガーでデータ損失が発生します | Upstreamトランザクションは可視、つまりbinlog生成時にデータが可視で、downstreamが同期を開始します。 |
| update                          | Supported             | -             | TXN              | Same                                                         | Same                                                      |
| insert                          | Supported             | -             | TXN              | Same                                                         | Same                                                      |
| insert into overwrite           | Supported（一時パーティションを除く） | 2.1.6         | Partial Sync | Same                                                         | Same                                                      |
| insert into overwrite           | Supported（一時パーティションを除く） | 2.0           | full sync    | Same                                                         | Same                                                      |
| Explicit transaction (3.0) begin commit | Not Supported |               |                  |                                                              |                                                          |

## Partition Operations

| Operation               | Supported                        | Doris Version | Sync Method            | Can Downstream Operate Independently                                        | Description                                                         |
| ----------------------- | ------------------------------- | ------------- | ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| add partition           | Supported                       | -             | SQL                    | No、その後のFull SyncまたはPartial Syncのトリガーによりdownstream操作が失われます | Cooldown timeプロパティとその動作は不明です |
| add temp partition      | Not Supported                   |               |                        | Same                                                         | Backupはtemp partitionをサポートしていません。Doris 2.1.8/3.0.4以降、upstream FE設定：`ignore_backup_tmp_partitions`を変更してこの問題を回避できます |
| drop partition          | Supported                       | -             | SQL/Full Sync          | Same                                                         | 2.0.15/2.1.6より前：Full Sync、後：SQL |
| replace partition       | Supported                       | 2.1.7/3.0.3  | Partial Sync           | Same                                                         | Partial Syncは**strict rangeと非temp partitionのreplace方法のみをサポート**、そうでなければFull Syncをトリガーします。 |
| modify partition        | Not Supported                   |               |                        | Same                                                         | パーティションのプロパティの変更を指します |
| rename partition        | Supported                       | 2.1.8/3.0.4  | SQL                    | Same                                                         | |

## Views

| Operation        | Supported | Doris Version | Sync Method | Remarks                             |
| ---------------- | --------- | ------------- | ----------- | ---------------------------------- |
| create view      | Supported | -             | SQL         | upstreamとdownstreamで同じ名前の場合に動作可能。downstreamに既に存在する場合、作成前に削除されます |
| alter view       | Supported | 2.1.8/3.0.4  | SQL         |                                    |
| drop view        | Supported | 2.1.8/3.0.4  | SQL         |                                    |

::: note

Doris実装の制限により、view内のカラム名/view名はデータベース名と同じにできません。

:::

## Materialized Views

Materialized viewの同期

| Operation                     | Supported | Doris Version | Sync Method | Remarks                                                         |
| ----------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| create materialized view      | Supported | 2.1.8/3.0.4  | Partial Sync | upstreamとdownstreamで同じ名前の場合に動作可能。異なる名前の場合、downstreamでviewの手動再構築が必要です。 |
| drop materialized view        | Supported | 2.1.8/3.0.4  | SQL         |                                                              |


非同期materialized view

| Operation                           | Supported |
| ----------------------------------- | --------- |
| create async materialized view      | Not Supported |
| alter async materialized view       | Not Supported |
| drop async materialized view        | Not Supported |
| refresh                             | Not Supported |
| pause                               | Not Supported |
| resume                              | Not Supported |

## Statistics

upstreamとdownstream間では同期されず、独立して操作します。

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
