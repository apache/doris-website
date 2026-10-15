---
{
    "title": "partitions",
    "language": "ja",
    "description": "データベース内のすべてのテーブルのパーティション状態を表示します。"
}
---

## 概要

データベース内のすべてのテーブルのパーティション状態を表示します。

## データベース

`information_schema`

## テーブル情報

| カラム名                      | 型            | 説明 |
| ----------------------------- | ------------- | ---- |
| PARTITION_ID                  | bigint        | パーティション ID |
| TABLE_CATALOG                 | varchar(64)   | カタログ名 |
| TABLE_SCHEMA                  | varchar(64)   | データベース名 |
| TABLE_NAME                    | varchar(64)   | テーブル名 |
| PARTITION_NAME                | varchar(64)   | パーティション名 |
| SUBPARTITION_NAME             | varchar(64)   | 常に空です |
| PARTITION_ORDINAL_POSITION    | int           | パーティションの順序位置 |
| SUBPARTITION_ORDINAL_POSITION | int           | 常に空です |
| PARTITION_METHOD              | varchar(13)   | パーティション方式 |
| SUBPARTITION_METHOD           | varchar(13)   | 常に空です |
| PARTITION_EXPRESSION          | varchar(2048) | パーティション式 |
| SUBPARTITION_EXPRESSION       | varchar(2048) | 常に空です |
| PARTITION_DESCRIPTION         | text          | パーティションの説明 |
| TABLE_ROWS                    | bigint        | |
| AVG_ROW_LENGTH                | bigint        | |
| DATA_LENGTH                   | bigint        | |
| MAX_DATA_LENGTH               | bigint        | |
| INDEX_LENGTH                  | bigint        | |
| DATA_FREE                     | bigint        | |
| CREATE_TIME                   | bigint        | |
| UPDATE_TIME                   | datetime      | |
| CHECK_TIME                    | datetime      | |
| CHECKSUM                      | bigint        | |
| PARTITION_COMMENT             | text          | |
| NODEGROUP                     | varchar(256)  | |
| TABLESPACE_NAME               | varchar(268)  | |
| LOCAL_DATA_SIZE               | text          | パーティションのローカルデータサイズ。コンピュート・ストレージ分離モードでは通常 `0` です。詳細は以下を参照してください |
| REMOTE_DATA_SIZE              | text          | パーティションのリモートデータサイズ（クラウド） |
| STATE                         | text          | パーティションの状態 |
| REPLICA_ALLOCATION            | text          | タブレットのレプリカの配置。コンピュート・ストレージ分離モードでは `NULL` です |
| REPLICA_NUM                   | int           | レプリカ数 |
| STORAGE_POLICY                | text          | ストレージポリシー |
| STORAGE_MEDIUM                | text          | ストレージメディア |
| COOLDOWN_TIME_MS              | text          | クールダウン時間 |
| LAST_CONSISTENCY_CHECK_TIME   | text          | 最後に整合性をチェックした時刻 |
| BUCKET_NUM                    | int           | パーティションのバケット数 |
| COMMITTED_VERSION             | bigint        | 最後にコミットされたバージョン |
| VISIBLE_VERSION               | bigint        | 現在参照可能なバージョン |
| PARTITION_KEY                 | text          | パーティションキー |
| RANGE                         | text          | パーティションの範囲（最小値と最大値） |
| DISTRIBUTION                  | text          | 分散方式 |

## コンピュート・ストレージ分離モードでのデータサイズの扱い

<!-- Knowledge type: Behavior description -->
<!-- Applicable scenarios: Capacity reconciliation in decoupled deployments / Partition data size statistics -->

:::caution 動作変更（4.0.8）

バージョン 4.0.8 以降、コンピュート・ストレージ分離モードでのパーティションのデータサイズは、一貫して**リモート**として報告されます。レプリカ統計でリモートとして記録されていないデータサイズも `REMOTE_DATA_SIZE` に計上され、対応する `LOCAL_DATA_SIZE` は `0` と報告されます。このため、分離構成のクラスターでは通常 `LOCAL_DATA_SIZE` が `0` となり、実際のパーティションのデータサイズは `REMOTE_DATA_SIZE` に表示されます。

4.0.8 より前は、そのデータサイズが `LOCAL_DATA_SIZE` に計上されていたため、ローカルとリモートの区分について、`information_schema.partitions`、[`SHOW TABLETS`](../../../sql-manual/sql-statements/table-and-view/data-and-status-management/SHOW-TABLET)、[`information_schema.backend_tablets`](./backend_tablets) の表示に矛盾が生じていました。この変更はデータサイズの報告方法だけを調整するもので、データの保存場所やデータ量は変わりません。

同じ変更により、分離モードでは `REPLICA_ALLOCATION` が `information_schema.partitions` で `NULL` と表示されます（以前は内部プレースホルダーの `\N`）。レプリカの配置は分離アーキテクチャ自体が管理するため、一体型モードのレプリカ割り当ての扱いには従わなくなります。

:::

パーティションが実際に占有する容量を計算する際は、分離モードでは `REMOTE_DATA_SIZE` を使用します。

```sql
SELECT
    TABLE_SCHEMA,
    TABLE_NAME,
    PARTITION_NAME,
    LOCAL_DATA_SIZE,
    REMOTE_DATA_SIZE
FROM information_schema.partitions
WHERE TABLE_SCHEMA = 'your_db';
```
