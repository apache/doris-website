---
{
  "title": "ファイルキャッシュ",
  "language": "ja",
  "description": "疎結合アーキテクチャでは、データはリモートストレージに格納されます。"
}
---
分離アーキテクチャでは、データはリモートストレージに保存されます。Dorisデータベースは、ローカルディスク上のキャッシュを利用してデータアクセスを高速化し、高度なマルチキューLRU（Least Recently Used）戦略を採用してキャッシュスペースを効率的に管理します。この戦略は特にインデックスとメタデータのアクセスパスを最適化し、頻繁にアクセスされるユーザーデータのキャッシュを最大化することを目的としています。マルチCompute Group（Compute Group）シナリオでは、Dorisは新しいcompute groupが確立された際に特定のデータ（テーブルやパーティションなど）をキャッシュに素早くロードするキャッシュウォーミング機能も提供し、それによりクエリパフォーマンスを向上させます。

## キャッシュの役割

分離アーキテクチャでは、データは通常、オブジェクトストレージS3、HDFSなどのリモートストレージシステムに保存されます。このシナリオでは、Dorisデータベースはローカルディスクスペースをキャッシュとして活用して一部のデータをローカルに保存することで、リモートストレージへのアクセス頻度を削減し、データアクセス効率を向上させ、運用コストを削減できます。

リモートストレージ（オブジェクトストレージなど）は通常、より高いアクセス待機時間を持ち、QPS（queries per second）や帯域幅制限の制約を受ける可能性があります。例えば、オブジェクトストレージのQPS制限は高並行クエリ時のボトルネックを引き起こす可能性があり、ネットワーク帯域幅制限はデータ転送速度に影響を与える可能性があります。ローカルファイルキャッシングを使用することで、Dorisはホットデータをローカルディスクに保存でき、それによりクエリ待機時間を大幅に削減し、クエリパフォーマンスを向上させることができます。

一方で、オブジェクトストレージサービスは通常、リクエスト数と転送されるデータ量に基づいて課金されます。頻繁なアクセスと大量のデータダウンロードはクエリコストを増加させる可能性があります。キャッシングメカニズムにより、オブジェクトストレージへのアクセス数と転送されるデータ量を削減でき、それによりコストを削減できます。

Dorisのファイルキャッシュは、分離アーキテクチャにおいて通常以下の2種類のファイルをキャッシュします：

- Segmentデータファイル：Dorisの内部テーブルにおけるデータストレージの基本単位。これらのファイルをキャッシュすることで、データ読み取り操作を高速化し、クエリパフォーマンスを向上させることができます。

- 転置インデックスファイル：クエリでのフィルタリング操作を高速化するために使用されます。これらのファイルをキャッシュすることで、クエリ条件を満たすデータをより迅速に特定でき、クエリ効率をさらに向上させ、複雑なクエリシナリオをサポートします。

## キャッシュ設定

Dorisは、ユーザーがファイルキャッシングを柔軟に管理するのに役立つ幅広い設定オプションを提供します。これらの設定オプションには、キャッシュの有効化/無効化、キャッシュパスとサイズの設定、キャッシュブロックサイズの設定、自動クリーンアップの有効化/無効化、事前退避メカニズムなどが含まれます。詳細な設定手順は以下の通りです：

1. ファイルキャッシュの有効化

```plaintext
enable_file_cache Default: "false"
```
パラメータの説明：この設定項目は、ファイルキャッシュ機能が有効かどうかを制御します。`true`に設定すると、ファイルキャッシュが有効になります。`false`に設定すると、ファイルキャッシュが無効になります。

2. ファイルキャッシュのパスとサイズの設定

```plaintext
file_cache_path Default: storage directory under the BE deployment path
```
パラメータ説明: この設定項目は、ファイルキャッシュのパスとサイズを指定します。形式はJSON配列で、各要素は以下のフィールドを含むJSONオブジェクトです：

- `path`: キャッシュファイルが保存されるパス。
- `total_size`: このパス下でのキャッシュの総サイズ（バイト単位）。
- `ttl_percent`: TTLキューの割合（パーセンテージ）。
- `normal_percent`: Normalキューの割合（パーセンテージ）。
- `disposable_percent`: Disposableキューの割合（パーセンテージ）。
- `index_percent`: Indexキューの割合（パーセンテージ）。
- `storage`: キャッシュストレージのタイプ。`disk`または`memory`を指定可能。デフォルト値は`disk`です。

例：
- 単一パス設定：

```json
[{"path":"/path/to/file_cache","total_size":21474836480}]
```
- マルチパス設定:

```json
[{"path":"/path/to/file_cache","total_size":21474836480},{"path":"/path/to/file_cache2","total_size":21474836480}]
```
- メモリストレージ設定:

```json
[{"path": "xxx", "total_size":53687091200, "storage": "memory"}]
```
3. 自動キャッシュクリーンアップ

```plaintext
clear_file_cache Default: "false"
```
パラメータの説明: この設定項目はBE再起動時にキャッシュされたデータを自動的にクリアするかどうかを制御します。`true`に設定すると、BE再起動のたびにキャッシュが自動的にクリアされます。`false`に設定すると、キャッシュは自動的にクリアされません。

4. Pre-eviction Mechanism

```plaintext
enable_evict_file_cache_in_advance Default: "true"
```
- パラメータ説明：この設定項目は、事前削除メカニズムが有効になっているかどうかを制御します。`true`に設定された場合、キャッシュ領域が特定の閾値に達すると、システムは将来のクエリのための領域を解放するために積極的に事前削除を実行します。`false`に設定された場合、事前削除は実行されません。

```plaintext
file_cache_enter_need_evict_cache_in_advance_percent Default: "88"
```
- パラメータの説明：この設定項目は、事前削除をトリガーするしきい値の割合を設定します。キャッシュ領域/inode数がこの割合に達すると、システムは事前削除を開始します。

```plaintext
file_cache_exit_need_evict_cache_in_advance_percent Default: "85"
```
- パラメータ説明: この設定項目は、事前退避を停止する閾値パーセンテージを設定します。キャッシュ容量がこのパーセンテージまで低下すると、システムは事前退避を停止します。

## Cache Query Limit

> この機能はバージョン4.0.3以降でサポートされています。

Cache Query Limit機能により、ユーザーは単一のクエリが使用できるファイルキャッシュのパーセンテージを制限できます。複数のユーザーや複雑なクエリがキャッシュリソースを共有するシナリオでは、単一の大きなクエリがキャッシュ容量を過度に占有し、他のクエリのホットデータが退避される可能性があります。クエリ制限を設定することで、公平なリソース使用を確保し、キャッシュスラッシングを防げます。

クエリが占有するキャッシュ容量とは、キャッシュミスによりキャッシュに投入されたデータの総サイズを指します。クエリによって投入された総サイズがクォータ制限に達した場合、そのクエリによる後続のデータ投入は、LRUアルゴリズムに基づいて以前に投入されたデータを置換します。

### 設定

この機能には、BEとFEでの設定、およびセッション変数の設定が関わります。

**1. BE設定**

- `enable_file_cache_query_limit`:
  - タイプ: Boolean
  - デフォルト: `false`
  - 説明: BE側のfile cache query limit機能のマスタースイッチです。有効化された場合のみ、BEはFEから渡されたクエリ制限パラメータを処理します。

**2. FE設定**

- `file_cache_query_limit_max_percent`:
  - タイプ: Integer
  - デフォルト: `100`
  - 説明: セッション変数の上限値を検証するために使用される最大クエリ制限制約です。ユーザーが設定するクエリ制限がこの値を超えないことを保証します。

**3. セッション変数**

- `file_cache_query_limit_percent`:
  - タイプ: Integer (1-100)
  - 説明: ファイルキャッシュクエリ制限パーセンテージです。クエリが使用できるキャッシュの最大パーセンテージを設定します。この値は`file_cache_query_limit_max_percent`により制約されます。計算されたキャッシュクォータが256MB未満にならないことを推奨します。この値未満の場合、BEはログに警告を出力します。

**使用例**

```sql
-- Set session variable to limit a query to use at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute query
SELECT * FROM large_table;
```
**注意:**
1. 値は[0, `file_cache_query_limit_max_percent`]の範囲内である必要があります。

## Cache Warm Up

Dorisは、ユーザーがリモートストレージからローカルキャッシュにデータを積極的に取得できるキャッシュウォームアップ機能を提供しています。この機能は以下の3つのモードをサポートしています：

- **Inter-Compute Group Warming**: Compute Group AのキャッシュデータをCompute Group Bにウォームアップします。Dorisは定期的に各compute group内で一定期間にアクセスされたテーブル/パーティションのホットスポット情報を収集し、この情報に基づいて特定のテーブル/パーティションを選択的にウォームアップします。
- **Table Data Warming**: Table Aのデータを新しいcompute groupにウォームアップするよう指定します。
- **Partition Data Warming**: Table Aのパーティション`p1`のデータを新しいcompute groupにウォームアップするよう指定します。

具体的な使用方法については、[WARM-UP SQLドキュメント](#)を参照してください。

## Cache Cleanup

Dorisは同期と非同期の両方のクリーンアップ方法を提供しています：

- 同期クリーンアップ：コマンドは`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'`です。コマンドが戻ると、クリーンアップが完了したことを示します。Dorisがキャッシュを即座にクリアする必要がある場合、ローカルファイルシステムディレクトリ内のキャッシュファイルを同期的に削除し、メモリ内の管理メタデータをクリーンアップします。この方法はスペースを素早く解放できますが、進行中のクエリの効率やシステムの安定性にも一定の影響を与える可能性があります。通常は迅速なテスト用途で使用されます。
- 非同期クリーンアップ：コマンドは`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'`です。コマンドは即座に戻り、クリーンアップ手順は非同期で実行されます。非同期クリーンアップ中、Dorisはメモリ内の管理メタデータを走査し、対応するキャッシュファイルを1つずつ削除します。一部のキャッシュファイルがクエリで使用されていることを発見した場合、Dorisはそれらのファイルがもはや使用されなくなるまで削除を遅延させます。この方法は進行中のクエリへの影響を軽減できますが、通常は同期クリーンアップと比較してキャッシュを完全にクリーンアップするのにより長い時間がかかります。

## Cache Observation

### ホットスポット情報

Dorisは各compute groupのキャッシュホットスポット情報を10分ごとに収集し、内部システムテーブルに保存します。このホットスポット情報はクエリステートメントを使用して表示できます。ユーザーはこの情報に基づいてキャッシュ使用をより適切に計画できます。

:::info 注意
バージョン3.0.4以前では、`SHOW CACHE HOTSPOT`ステートメントを使用してキャッシュホットスポット情報の統計をクエリできました。バージョン3.0.4以降、`SHOW CACHE HOTSPOT`ステートメントはキャッシュホットスポット情報統計のクエリをサポートしなくなりました。システムテーブル`__internal_schema.cloud_cache_hotspot`を直接クエリしてください。
:::

ユーザーは通常、compute groupとデータベーステーブルの2つのレベルでキャッシュ使用情報に注目します。以下では、よく使用されるクエリステートメントと例を提供します。

#### 全Compute Groupで最も頻繁にアクセスされるテーブルの表示

```sql
-- Equivalent to SHOW CACHE HOTSPOT "/" before version 3.0.4
WITH t1 AS (
  SELECT
    cluster_id,
    cluster_name,
    table_id,
    table_name,
    insert_day,
    SUM(query_per_day) AS query_per_day_total,
    SUM(query_per_week) AS query_per_week_total
  FROM __internal_schema.cloud_cache_hotspot
  GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
  cluster_id AS ComputeGroupId,
  cluster_name AS ComputeGroupName,
  table_id AS TableId,
  table_name AS TableName
FROM (
  SELECT
    ROW_NUMBER() OVER (
      PARTITION BY cluster_id
      ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
    ) AS dr2,
    *
  FROM t1
) t2
WHERE dr2 = 1;
```
#### 特定のコンピュートグループ下で最も頻繁にアクセスされるテーブルの表示

コンピュートグループ`compute_group_name0`下で最も頻繁にアクセスされるテーブルを表示します。

注意：条件`cluster_name = "compute_group_name0"`を実際のコンピュートグループ名に置き換えてください。

```sql
-- Equivalent to SHOW CACHE HOTSPOT '/compute_group_name0' before version 3.0.4
WITH t1 AS (
  SELECT
    cluster_id,
    cluster_name,
    table_id,
    table_name,
    insert_day,
    SUM(query_per_day) AS query_per_day_total,
    SUM(query_per_week) AS query_per_week_total
  FROM __internal_schema.cloud_cache_hotspot
  WHERE cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g., "default_compute_group"
  GROUP BY cluster_id, cluster_name, table_id, table_name, insert_day
)
SELECT
  cluster_id AS ComputeGroupId,
  cluster_name AS ComputeGroupName,
  table_id AS TableId,
  table_name AS TableName
FROM (
  SELECT
    ROW_NUMBER() OVER (
      PARTITION BY cluster_id
      ORDER BY insert_day DESC, query_per_day_total DESC, query_per_week_total DESC
    ) AS dr2,
    *
  FROM t1
) t2
WHERE dr2 = 1;
```
#### 特定のCompute Groupとテーブルで最もアクセス頻度の高いパーティションの表示

compute group `compute_group_name0`配下のテーブル`regression_test_cloud_load_copy_into_tpch_sf1_p1.customer`で最もアクセス頻度の高いパーティションを表示します。

注意: 条件`cluster_name = "compute_group_name0"`と`table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer"`を実際のcompute group名とデータベーステーブル名に置き換えてください。

```sql
-- Equivalent to SHOW CACHE HOTSPOT '/compute_group_name0/regression_test_cloud_load_copy_into_tpch_sf1_p1.customer' before version 3.0.4
SELECT
  partition_id AS PartitionId,
  partition_name AS PartitionName
FROM __internal_schema.cloud_cache_hotspot
WHERE
  cluster_name = "compute_group_name0" -- Replace with the actual compute group name, e.g., "default_compute_group"
  AND table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer" -- Replace with the actual database table name, e.g., "db1.t1"
GROUP BY
  cluster_id,
  cluster_name,
  table_id,
  table_name,
  partition_id,
  partition_name;
```
### キャッシュ容量とヒット率

Doris BEノードは、`curl {be_ip}:{brpc_port}/vars`（brpc_portはデフォルトで8060）を使用してキャッシュ統計を取得でき、メトリック名はディスクパスで始まります。

上記の例では、File Cacheのメトリックプレフィックスはパスです。例えば、プレフィックス「_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_」は「/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/」を示します。
プレフィックスの後の部分は統計メトリックです。例えば、「file_cache_cache_size」は、このパスでのFile Cacheの現在のサイズが26111バイトであることを示します。

以下の表は、すべてのメトリックの意味を示しています（すべてのサイズ単位はバイト）：

| メトリック名（パスプレフィックスを除く）          | 意味                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| file_cache_cache_size                        | File Cacheの現在の総サイズ                         |
| file_cache_disposable_queue_cache_size       | disposableキューの現在のサイズ                         |
| file_cache_disposable_queue_element_count    | disposableキュー内の現在の要素数           |
| file_cache_disposable_queue_evict_size       | 起動以降にdisposableキューから削除されたデータの総量 |
| file_cache_index_queue_cache_size            | indexキューの現在のサイズ                              |
| file_cache_index_queue_element_count         | indexキュー内の現在の要素数                |
| file_cache_index_queue_evict_size            | 起動以降にindexキューから削除されたデータの総量 |
| file_cache_normal_queue_cache_size           | normalキューの現在のサイズ                             |
| file_cache_normal_queue_element_count        | normalキュー内の現在の要素数               |
| file_cache_normal_queue_evict_size           | 起動以降にnormalキューから削除されたデータの総量 |
| file_cache_total_evict_size                  | 起動以降にFile Cache全体から削除されたデータの総量 |
| file_cache_ttl_cache_evict_size              | 起動以降にTTLキューから削除されたデータの総量 |
| file_cache_ttl_cache_lru_queue_element_count | TTLキュー内の現在の要素数                  |
| file_cache_ttl_cache_size                    | TTLキューの現在のサイズ                                |
| file_cache_evict_by_heat\_[A]\_to\_[B]       | キャッシュタイプBによってキャッシュタイプAから削除されたデータ（時間ベースの期限切れ） |
| file_cache_evict_by_size\_[A]\_to\_[B]       | キャッシュタイプBによってキャッシュタイプAから削除されたデータ（容量ベースの期限切れ） |
| file_cache_evict_by_self_lru\_[A]            | 新しいデータのためにキャッシュタイプAが自身のLRUポリシーによって削除したデータ |

### SQL Profile

SQLプロファイル内のキャッシュ関連メトリックは、SegmentIterator配下にあります：

| メトリック名            | 意味                                                      |
| ---------------------- | ------------------------------------------------------------ |
| BytesScannedFromCache  | File Cacheから読み取られたデータ量                      |
| BytesScannedFromRemote | リモートストレージから読み取られたデータ量                      |
| BytesWriteIntoCache    | File Cacheに書き込まれたデータ量                   |
| LocalIOUseTimer        | File Cacheからの読み取りにかかった時間                       |
| NumLocalIOTotal        | File Cacheが読み取られた回数                      |
| NumRemoteIOTotal       | リモートストレージが読み取られた回数                      |
| NumSkipCacheIOTotal    | リモートストレージから読み取られたデータがFile Cacheに入らなかった回数 |
| RemoteIOUseTimer       | リモートストレージからの読み取りにかかった時間                       |
| WriteCacheIOUseTimer   | File Cacheへの書き込みにかかった時間                        |

[Query Performance Analysis](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)でクエリパフォーマンス分析を表示できます。



## TTL使用方法

テーブル作成時に、対応するPROPERTYを設定して、そのテーブルのデータのキャッシュにTTL戦略を使用します。

- `file_cache_ttl_seconds`：新しくインポートされたデータがキャッシュに残ることが期待される時間（秒）。

```shell
CREATE TABLE IF NOT EXISTS customer (
  C_CUSTKEY     INTEGER NOT NULL,
  C_NAME        VARCHAR(25) NOT NULL,
  C_ADDRESS     VARCHAR(40) NOT NULL,
  C_NATIONKEY   INTEGER NOT NULL,
  C_PHONE       CHAR(15) NOT NULL,
  C_ACCTBAL     DECIMAL(15,2)   NOT NULL,
  C_MKTSEGMENT  CHAR(10) NOT NULL,
  C_COMMENT     VARCHAR(117) NOT NULL
)
DUPLICATE KEY(C_CUSTKEY, C_NAME)
DISTRIBUTED BY HASH(C_CUSTKEY) BUCKETS 32
PROPERTIES(
    "file_cache_ttl_seconds"="300"
)
```
上記のテーブルでは、新しくインポートされたすべてのデータが300秒間キャッシュに保持されます。システムは現在、テーブルのTTL時間の変更をサポートしており、ユーザーは実際のニーズに基づいてTTL時間を延長または短縮できます。

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```
:::info Note

変更されたTTL値はすぐには有効にならず、一定の遅延があります。

テーブル作成時にTTLが設定されていない場合でも、ユーザーはALTER文を実行することでテーブルのTTL属性を変更できます。
:::


## 実用例

あるユーザーが一連のデータテーブルを持っており、総データ量は3TBを超えているものの、利用可能なキャッシュ容量は1.2TBのみです。その中で、アクセス頻度の高いテーブルが2つあります。1つは200MBのサイズのディメンションテーブル（`dimension_table`）で、もう1つは100GBのサイズのファクトテーブル（`fact_table`）です。このファクトテーブルには毎日新しいデータがインポートされ、T+1クエリ操作が必要です。さらに、その他の大きなテーブルはアクセス頻度が低くなっています。

LRUキャッシュ戦略の下では、大きなテーブルのデータがクエリされると、キャッシュに残る必要がある小さなテーブルのデータが置き換えられ、パフォーマンスの変動を引き起こす可能性があります。この問題を解決するために、ユーザーはTTLキャッシュ戦略を採用し、2つのテーブルのTTL時間をそれぞれ1年と1日に設定します。

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```
ディメンションテーブルについては、サイズが小さく変動も少ないため、ユーザーは1年間のデータに素早くアクセスできるようにTTL時間を1年に設定します。ファクトテーブルについては、ユーザーは毎日テーブルバックアップを実行してからフルインポートを行う必要があるため、TTL時間を1日に設定します。
