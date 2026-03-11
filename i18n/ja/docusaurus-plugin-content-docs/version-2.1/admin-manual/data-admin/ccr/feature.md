---
{
  "title": "機能詳細",
  "language": "ja",
  "description": "DorisのCross-クラスター Replication（CCR）機能は、主に複数のクラスター間でデータを効率的に同期するために使用されます。"
}
---
DorisのCross-クラスター Replication（CCR）機能は、主に複数のクラスター間でデータを効率的に同期させるために使用され、ビジネス継続性とディザスタリカバリ機能を向上させます。CCRはDorisの様々な操作をサポートし、異なるクラスター間でデータの一貫性を確保します。以下はCCRがサポートする主なDoris操作の詳細です。

:::note

1. Doris Versionの`-`は、Dorisバージョン2.0以上、CCRの全バージョンを示します。Dorisバージョン2.0.15または2.1.6以降の使用を推奨します。
2. CCR SyncerとDorisのバージョン要件：Syncerバージョン >= ダウンストリームDorisバージョン >= アップストリームDorisバージョン。そのため、まずSyncer、次にダウンストリームDoris、最後にアップストリームDorisをアップグレードしてください。
3. CCRは現在、ストレージとコンピューティングの分離をサポートしていません。

:::

## データベース

### データベースプロパティ

データベースレベルのジョブは、Full Sync中にデータベースのプロパティを同期します。

| Property                | Supported | Doris Version | Sync Method | 詳細 |
| ----------------------- | --------- | ------------- | ----------- | ----------- |
| replication_allocation  | Supported | -             | Full Sync   |             |
| data quota              | Not Supported |           |             |             |
| replica quota           | Not Supported |           |             |             |

### データベースプロパティの変更

CCRジョブは、データベースプロパティを変更する操作を同期しません。

| Property                | Supported | Can Upstream Operate | Can Downstream Operate | 詳細                              |
| ----------------------- | --------- | -------------------- | ---------------------- | ---------------------------------------- |
| replication_allocation  | Not Supported | No                 | No                     | 両側での操作はCCRジョブの中断を引き起こします |
| data quota              | Not Supported | Yes                | Yes                    |                                          |
| replica quota           | Not Supported | Yes                | Yes                    |                                          |

### データベースの名前変更

アップストリームとダウンストリームでの名前変更はサポートされていません。実行すると、ビューが機能しなくなる可能性があります。

## テーブル
### テーブルプロパティ

| Property                                      | Supported | Doris Version | Sync Method | 詳細                                                     |
| --------------------------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| table Model (duplicate, unique, aggregate)    | Supported | -             | SQL         |                                                                |
| パーティション and Bucketing                        | Supported | -             | SQL         |                                                                |
| replication_num                               | Supported | -             | SQL         |                                                                |
| replication_allocation (resource group)       | Supported | -             | SQL         | アップストリームはダウンストリームと一致している必要があり、BEタグが一致している必要があります。そうでなければ、CCRジョブは失敗します |
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

### 基本テーブル操作

| Operation      | Supported | Doris Version | Sync Method | Can Downstream Operate Independently | 詳細 |
| -------------- | --------- | ------------- | ----------- | ------------------------------------ | ----------- |
| create table   | Supported | -             | SQL/Partial Sync | CCRジョブによって同期されるテーブルで操作することはできません。 | テーブル作成のプロパティを参照してください。ほとんどの場合、同期にはSQLを使用します。ユーザーが特定のセッション変数を設定した場合やcreate tableステートメントに転置インデックスが含まれている場合など、一部の操作ではpartial syncを使用します |
| drop table     | Supported | -             | SQL/Full Sync | 上記と同じ | 2.0.15/2.1.6より前：Full Sync、以降：SQL |
| rename table   | テーブルレベルジョブはデータベースレベルジョブをサポートしません | 2.1.8/3.0.4 | SQL | 上記と同じ | テーブルレベルジョブの名前変更はCCRジョブの停止を引き起こします |
| replace table  | Supported | 2.1.8/3.0.4 | SQL/Full Sync | 上記と同じ | データベースレベル同期にはSQLを使用し、テーブルレベルでは完全同期をトリガーします |
| truncate table | Supported | -             | SQL | 上記と同じ | |
| restore table  | Not Supported | | | 上記と同じ | |

### テーブルプロパティの変更

同期方法はSQLです。

| Property                       | Supported | Doris Version | Can Upstream Operate | Can Downstream Operate | 詳細                                    |
| ------------------------------ | --------- | ------------- | -------------------- | ---------------------- | ---------------------------------------------- |
| colocate                       | Not Supported |           | Yes                  | No                     | ダウンストリーム操作でfull syncをトリガーするとデータ損失を引き起こします |
| distribution type              | Not Supported |           | No                   | Same                   |                                                |
| dynamic partition              | Not Supported |           | Yes                  | Same                   |                                                |
| replication_num                | Not Supported |           | No                   | No                     |                                                |
| replication_allocation         | Not Supported |           | No                   |                        |                                                |
| storage policy                 | Not Supported |           | No                   | No                     |                                                |
| enable_light_schema_change     | Not Supported |           |                      |                        | CCRは軽量スキーマ変更のみを同期できます。 |
| row_store                      | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通じて |
| bloom_filter_columns           | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通じて |
| bloom_filter_fpp               | Supported | 2.1.8/3.0.4 |                      |                        | Partial Syncを通じて |
| bucket num                     | Not Supported |           | Yes                  | No                     | ダウンストリーム操作でfull syncをトリガーするとデータ損失を引き起こします |
| isBeingSynced                  | Not Supported |           | No                   | No                     |                                                |
| compaction series properties    | Not Supported |           | Yes                  | No                     | ダウンストリーム操作でfull syncをトリガーするとデータ損失を引き起こします |
| skip_write_index_on_load       | Not Supported |           | Yes                  | Same                   |                                                |
| seq column                     | Supported | -             | Yes                  | No                     | ダウンストリーム操作でfull syncをトリガーするとデータ損失を引き起こします |
| delete sign column             | Supported | -             | Yes                  | Same                   |                                                |
| comment                        | Supported | 2.1.8/3.0.4 | Yes                  | No                     | ダウンストリーム操作でfull syncをトリガーするとデータ損失を引き起こします |

### カラム操作

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

valueカラムの追加/削除には、テーブル作成時にプロパティ `"light_schema_change" = "true"` の設定が必要です。

:::

テーブル内のRollup Indexでのカラム操作。

| Operation          | Supported | Doris Version | Sync Method           | Remarks              |
| ------------------ | --------- | ------------- | --------------------- | -------------------- |
| add key column     | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| add value column   | Supported | 2.1.8/3.0.4  | SQL                   | 軽量スキーマ変更の有効化が必要 |
| drop column        | Supported | 2.1.8/3.0.4  | Partial Sync          |                      |
| modify column      | Unknown   | 2.1.8/3.0.4  | Partial Sync          | Dorisは直接rollupカラム型の変更をサポートしていません |
| order by           | Supported | 2.1.8/3.0.4  | Partial sync          |                      |

### Rollup

| Operation          | Supported | Doris Version | Sync Method           | Remarks         |
| ------------------ | --------- | ------------- | --------------------- | ---------------- |
| add rollup         | Supported | 2.1.8/3.0.4  | Partial Sync          |                  |
| drop rollup        | Supported | 2.1.8/3.0.4  | SQL                   |                  |
| rename rollup      | Supported | 2.1.8/3.0.4  | SQL                   |                  |

### インデックス

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

## データ

### インポート

| Import Method     | Supported             | Doris Version | Sync Method | Can Downstream Operate                                             | 詳細                                                 |
| ------------------ | -------------------- | ------------- | ----------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| stream load        | Supported（一時パーティションを除く） | -             | TXN         | いいえ、ダウンストリームがインポートする場合、その後のfullまたはPartial Syncのトリガーでデータ損失が発生します | アップストリームトランザクションが可視、つまりbinlog生成時にデータが可視になると、ダウンストリームが同期を開始します。 |
| broker load        | Supported（一時パーティションを除く） | -             | TXN         | 同じ                                                         | 同じ                                                      |
| routine load       | Supported（一時パーティションを除く） | -             | TXN         | 同じ                                                         | 同じ                                                      |
| mysql load         | Supported（一時パーティションを除く） | -             | TXN         | 同じ                                                         | 同じ                                                      |
| group commit       | Supported（一時パーティションを除く） | 2.1           | TXN         | 同じ                                                         | 同じ                                                      |

### データ操作

| Operation                      | Supported             | Doris Version | Sync Method     | Can Downstream Operate                                             | 詳細                                                 |
| ------------------------------- | -------------------- | ------------- | ---------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| delete                          | Supported             | -             | TXN              | いいえ、ダウンストリームが操作する場合、その後のfullまたはPartial Syncのトリガーでデータ損失が発生します | アップストリームトランザクションが可視、つまりbinlog生成時にデータが可視になると、ダウンストリームが同期を開始します。 |
| update                          | Supported             | -             | TXN              | 同じ                                                         | 同じ                                                      |
| insert                          | Supported             | -             | TXN              | 同じ                                                         | 同じ                                                      |
| insert into overwrite           | Supported（一時パーティションを除く） | 2.1.6         | Partial Sync | 同じ                                                         | 同じ                                                      |
| insert into overwrite           | Supported（一時パーティションを除く） | 2.0           | full sync    | 同じ                                                         | 同じ                                                      |
| 明示的トランザクション（3.0）begin commit | Not Supported |               |                  |                                                              |                                                          |

## パーティション操作

| Operation               | Supported                        | Doris Version | Sync Method            | Can Downstream Operate Independently                                        | 詳細                                                         |
| ----------------------- | ------------------------------- | ------------- | ---------------------- | ------------------------------------------------------------ | ---------------------------------------------------------- |
| add partition           | Supported                       | -             | SQL                    | いいえ、その後のFull SyncまたはPartial Syncのトリガーでダウンストリーム操作が失われます | cooldown timeプロパティとその動作は不明です |
| add temp partition      | Not Supported                   |               |                        | 同じ                                                         | backupはtemp partitionをサポートしていません。Doris 2.1.8/3.0.4以降、アップストリームFE設定を変更できます：`ignore_backup_tmp_partitions`でこの問題を回避 |
| drop partition          | Supported                       | -             | SQL/Full Sync          | 同じ                                                         | 2.0.15/2.1.6より前：Full Sync、以降：SQL |
| replace partition       | Supported                       | 2.1.7/3.0.3  | Partial Sync           | 同じ                                                         | Partial Sync **は厳密な範囲と非一時パーティション置換方法のみをサポート**、それ以外はFull Syncをトリガーします。 |
| modify partition        | Not Supported                   |               |                        | 同じ                                                         | パーティションのプロパティの変更を指します |
| rename partition        | Supported                       | 2.1.8/3.0.4  | SQL                    | 同じ                                                         | |

## ビュー

| Operation        | Supported | Doris Version | Sync Method | Remarks                             |
| ---------------- | --------- | ------------- | ----------- | ---------------------------------- |
| create view      | Supported | -             | SQL         | アップストリームとダウンストリームが同じ名前の場合に機能します。ダウンストリームに既に存在する場合は、作成前に削除されます |
| alter view       | Supported | 2.1.8/3.0.4  | SQL         |                                    |
| drop view        | Supported | 2.1.8/3.0.4  | SQL         |                                    |

::: note

Doris実装の制限により、ビュー内のカラム名/ビュー名をデータベース名と同じにすることはできません。

:::

## マテリアライズドビュー

マテリアライズドビューの同期

| Operation                     | Supported | Doris Version | Sync Method | Remarks                                                         |
| ----------------------------- | --------- | ------------- | ----------- | -------------------------------------------------------------- |
| create materialized view      | Supported | 2.1.8/3.0.4  | Partial Sync | アップストリームとダウンストリームが同じ名前の場合に機能します。名前が異なる場合、ダウンストリームでビューを手動で再構築する必要があります。 |
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

## 統計情報

アップストリームとダウンストリーム間で同期されず、独立して操作します。

## その他

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
