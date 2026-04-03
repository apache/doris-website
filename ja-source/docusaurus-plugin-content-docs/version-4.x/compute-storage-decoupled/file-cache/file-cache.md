---
{
  "title": "ファイルキャッシュ",
  "language": "ja",
  "description": "疎結合アーキテクチャでは、データはリモートストレージに格納されます。"
}
---
分散アーキテクチャでは、データはリモートストレージに保存されます。Dorisデータベースは、ローカルディスク上のキャッシュを利用してデータアクセスを高速化し、高度なマルチキューLRU（Least Recently Used）戦略を採用してキャッシュ領域を効率的に管理します。この戦略は特にインデックスとメタデータのアクセスパスを最適化し、頻繁にアクセスされるユーザーデータのキャッシュを最大化することを目指しています。マルチCompute Group（Compute Group）シナリオでは、Dorisは新しいcompute groupが確立された際に特定のデータ（テーブルやパーティションなど）をキャッシュに素早くロードするキャッシュウォーミング機能も提供し、クエリパフォーマンスを向上させます。

## キャッシュの役割

分散アーキテクチャでは、データは通常、オブジェクトストレージS3、HDFSなどのリモートストレージシステムに保存されます。このシナリオでは、Dorisデータベースはローカルディスク領域をキャッシュとして活用し、一部のデータをローカルに保存することで、リモートストレージへのアクセス頻度を削減し、データアクセス効率を向上させ、運用コストを削減できます。

リモートストレージ（オブジェクトストレージなど）は通常、高いアクセス遅延を有し、QPS（queries per second）や帯域幅制限の制約を受ける可能性があります。例えば、オブジェクトストレージのQPS制限は高同時実行クエリ時にボトルネックを引き起こす可能性があり、ネットワーク帯域幅制限はデータ転送速度に影響を与える可能性があります。ローカルファイルキャッシュを使用することで、Dorisはホットデータをローカルディスクに保存し、クエリ遅延を大幅に削減してクエリパフォーマンスを向上させることができます。

一方、オブジェクトストレージサービスは通常、リクエスト数と転送されるデータ量に基づいて課金されます。頻繁なアクセスと大容量のデータダウンロードはクエリコストを増加させる可能性があります。キャッシュメカニズムを通じて、オブジェクトストレージへのアクセス回数と転送されるデータ量を削減し、コストを削減できます。

Dorisのファイルキャッシュは通常、分散アーキテクチャにおいて以下の2種類のファイルをキャッシュします：

- Segmentデータファイル：Dorisの内部テーブルにおけるデータストレージの基本単位。これらのファイルをキャッシュすることで、データ読み取り操作を高速化し、クエリパフォーマンスを向上させることができます。

- 転置インデックスファイル：クエリにおけるフィルタリング操作を高速化するために使用されます。これらのファイルをキャッシュすることで、クエリ条件を満たすデータをより迅速に特定でき、クエリ効率をさらに向上させ、複雑なクエリシナリオをサポートします。

## キャッシュ設定

Dorisは、ユーザーがファイルキャッシュを柔軟に管理できるよう、幅広い設定オプションを提供します。これらの設定オプションには、キャッシュの有効化/無効化、キャッシュパスとサイズの設定、キャッシュブロックサイズの設定、自動クリーンアップの有効化/無効化、事前退避メカニズムなどが含まれます。詳細な設定手順は以下の通りです：

1. ファイルキャッシュの有効化

```plaintext
enable_file_cache Default: "false"
```
パラメータ説明：この設定項目は、ファイルキャッシュ機能が有効かどうかを制御します。`true`に設定した場合、ファイルキャッシュが有効になります。`false`に設定した場合、ファイルキャッシュが無効になります。

2. ファイルキャッシュパスとサイズの設定

```plaintext
file_cache_path Default: storage directory under the BE deployment path
```
パラメータ説明：この設定項目は、ファイルキャッシュのパスとサイズを指定します。形式はJSON配列で、各要素は以下のフィールドを含むJSONオブジェクトです：

- `path`：キャッシュファイルが保存されるパス。
- `total_size`：このパス下のキャッシュの総サイズ（バイト単位）。
- `ttl_percent`：TTLキューの割合（パーセンテージ）。
- `normal_percent`：Normalキューの割合（パーセンテージ）。
- `disposable_percent`：Disposableキューの割合（パーセンテージ）。
- `index_percent`：Indexキューの割合（パーセンテージ）。
- `storage`：キャッシュストレージのタイプで、`disk`または`memory`を指定できます。デフォルト値は`disk`です。

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
パラメータ説明：この設定項目は、BE再起動時にキャッシュデータを自動的にクリアするかどうかを制御します。`true`に設定すると、BE再起動のたびにキャッシュが自動的にクリアされます。`false`に設定すると、キャッシュは自動的にクリアされません。

4. 事前削除メカニズム

```plaintext
enable_evict_file_cache_in_advance Default: "true"
```
- パラメータ説明：この設定項目は事前退避メカニズムが有効かどうかを制御します。`true`に設定した場合、キャッシュ容量が特定の閾値に達すると、システムは将来のクエリのための領域を確保するために事前退避を積極的に実行します。`false`に設定した場合、事前退避は実行されません。

```plaintext
file_cache_enter_need_evict_cache_in_advance_percent Default: "88"
```
- パラメータ説明：この設定項目は、事前削除をトリガーする閾値パーセンテージを設定します。キャッシュ容量/inode数がこのパーセンテージに達すると、システムは事前削除を開始します。

```plaintext
file_cache_exit_need_evict_cache_in_advance_percent Default: "85"
```
- パラメータの説明：この設定項目は、事前退避を停止するための閾値パーセンテージを設定します。キャッシュ領域がこのパーセンテージまで減少すると、システムは事前退避を停止します。

## Cache Query Limit

> この機能はバージョン4.0.3以降でサポートされています。

Cache Query Limit機能により、ユーザーは単一のクエリが使用できるファイルキャッシュのパーセンテージを制限することができます。複数のユーザーや複雑なクエリがキャッシュリソースを共有するシナリオでは、単一の大きなクエリが過剰なキャッシュ領域を占有し、他のクエリのホットデータが退避される原因となる可能性があります。クエリ制限を設定することで、公平なリソース使用を確保し、キャッシュスラッシングを防ぐことができます。

クエリによって占有されるキャッシュ領域とは、キャッシュミスによりキャッシュに投入されたデータの合計サイズを指します。クエリによって投入された合計サイズがクォータ制限に達した場合、そのクエリによって後続に投入されるデータは、LRUアルゴリズムに基づいて以前に投入されたデータを置き換えます。

### 設定

この機能は、BEとFEでの設定、およびセッション変数の設定を含みます。

**1. BE設定**

- `enable_file_cache_query_limit`:
  - 型: Boolean
  - デフォルト: `false`
  - 説明: BE側でのfile cache query limit機能のマスタースイッチです。有効にした場合のみ、BEはFEから渡されるクエリ制限パラメータを処理します。

**2. FE設定**

- `file_cache_query_limit_max_percent`:
  - 型: Integer
  - デフォルト: `100`
  - 説明: セッション変数の上限を検証するために使用される最大クエリ制限制約です。ユーザーが設定するクエリ制限がこの値を超えないことを保証します。

**3. セッション変数**

- `file_cache_query_limit_percent`:
  - 型: Integer (1-100)
  - 説明: ファイルキャッシュクエリ制限パーセンテージです。クエリが使用できるキャッシュの最大パーセンテージを設定します。この値は`file_cache_query_limit_max_percent`によって制約されます。計算されたキャッシュクォータが256MB未満にならないことが推奨されます。この値を下回る場合、BEはログに警告を出力します。

**使用例**

```sql
-- Set session variable to limit a query to use at most 50% of the cache
SET file_cache_query_limit_percent = 50;

-- Execute query
SELECT * FROM large_table;
```
**注意:**
1. 値は [0, `file_cache_query_limit_max_percent`] の範囲内である必要があります。

## Cache Warm Up

Dorisは、ユーザーがリモートストレージからローカルキャッシュにデータを積極的に取得できるキャッシュウォーミング機能を提供します。この機能は以下の3つのモードをサポートします：

- **Compute Group間ウォーミング**: Compute Group AのキャッシュデータをCompute Group Bにウォームします。Dorisは定期的に各compute groupで一定期間アクセスされたテーブル/パーティションのホットスポット情報を収集し、この情報に基づいて特定のテーブル/パーティションを選択的にウォームします。
- **テーブルデータウォーミング**: テーブルAのデータを新しいcompute groupにウォームすることを指定します。
- **パーティションデータウォーミング**: テーブルAのパーティション`p1`のデータを新しいcompute groupにウォームすることを指定します。

具体的な使用方法については、[WARM-UP SQLドキュメント](#)を参照してください。

## Cache Cleanup

Dorisは同期および非同期のクリーンアップ方法を両方提供します：

- 同期クリーンアップ：コマンドは`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=true'`です。コマンドが戻ると、クリーンアップが完了したことを示します。Dorisがキャッシュを即座にクリアする必要がある場合、ローカルファイルシステムディレクトリ内のキャッシュファイルを同期的に削除し、メモリ内の管理メタデータをクリーンアップします。この方法は迅速にスペースを解放できますが、進行中のクエリの効率性やシステムの安定性にある程度の影響を与える可能性があります。通常、迅速なテストに使用されます。
- 非同期クリーンアップ：コマンドは`curl 'http://BE_IP:WEB_PORT/api/file_cache?op=clear&sync=false'`です。コマンドは即座に戻り、クリーンアップステップは非同期で実行されます。非同期クリーンアップ中、Dorisはメモリ内の管理メタデータを走査し、対応するキャッシュファイルを1つずつ削除します。一部のキャッシュファイルがクエリで使用されていることが判明した場合、Dorisはそれらのファイルが使用されなくなるまで削除を遅延させます。この方法は進行中のクエリへの影響を軽減できますが、通常、同期クリーンアップと比較してキャッシュを完全にクリーンアップするのにより長い時間がかかります。

## Cache Observation

### ホットスポット情報

Dorisは各compute groupのキャッシュホットスポット情報を10分ごとに収集し、内部システムテーブルに保存します。このホットスポット情報はクエリステートメントを使用して表示できます。ユーザーはこの情報に基づいてキャッシュ使用をより良く計画できます。

:::info 注意
バージョン3.0.4より前では、`SHOW CACHE HOTSPOT`ステートメントを使用してキャッシュホットスポット情報統計を照会できました。バージョン3.0.4以降、`SHOW CACHE HOTSPOT`ステートメントはキャッシュホットスポット情報統計の照会でサポートされなくなりました。システムテーブル`__internal_schema.cloud_cache_hotspot`を直接照会してください。
:::

ユーザーは通常、compute groupsとデータベーステーブルの2つのレベルでキャッシュ使用情報に注目します。以下に、よく使用されるクエリステートメントと例を示します。

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

コンピュートグループ `compute_group_name0` 下で最も頻繁にアクセスされるテーブルを表示します。

注意: 条件 `cluster_name = "compute_group_name0"` を実際のコンピュートグループ名に置き換えてください。

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
#### 特定のCompute GroupとTableに対して最も頻繁にアクセスされるパーティションの表示

compute group `compute_group_name0`の下にあるテーブル`regression_test_cloud_load_copy_into_tpch_sf1_p1.customer`に対して最も頻繁にアクセスされるパーティションを表示します。

注意：条件`cluster_name = "compute_group_name0"`と`table_name = "regression_test_cloud_load_copy_into_tpch_sf1_p1.customer"`を実際のcompute group名とdatabaseのテーブル名に置き換えてください。

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

Doris BEノードは`curl {be_ip}:{brpc_port}/vars`を使用してキャッシュ統計を取得できます（brpc_portはデフォルトで8060）。メトリクス名はディスクパスで開始されます。

上記の例では、File Cacheのメトリクスプレフィックスはパスです。例えば、プレフィックス"_mnt_disk1_gavinchou_debug_doris_cloud_be0_storage_file_cache_"は"/mnt/disk1/gavinchou/debug/doris-cloud/be0_storage_file_cache/"を示します。
プレフィックス後の部分は統計メトリクスです。例えば、"file_cache_cache_size"はこのパスにあるFile Cacheの現在のサイズが26111バイトであることを示します。

以下の表は全メトリクスの意味を示しています（すべてのサイズ単位はバイト）：

| メトリクス名（パスプレフィックス除く）          | 意味                                                      |
| -------------------------------------------- | ------------------------------------------------------------ |
| file_cache_cache_size                        | File Cacheの現在の総サイズ                         |
| file_cache_disposable_queue_cache_size       | disposableキューの現在のサイズ                         |
| file_cache_disposable_queue_element_count    | disposableキューの現在の要素数           |
| file_cache_disposable_queue_evict_size       | 起動以降にdisposableキューから退避された総データ量 |
| file_cache_index_queue_cache_size            | indexキューの現在のサイズ                              |
| file_cache_index_queue_element_count         | indexキューの現在の要素数                |
| file_cache_index_queue_evict_size            | 起動以降にindexキューから退避された総データ量 |
| file_cache_normal_queue_cache_size           | normalキューの現在のサイズ                             |
| file_cache_normal_queue_element_count        | normalキューの現在の要素数               |
| file_cache_normal_queue_evict_size           | 起動以降にnormalキューから退避された総データ量 |
| file_cache_total_evict_size                  | 起動以降にFile Cache全体から退避された総データ量 |
| file_cache_ttl_cache_evict_size              | 起動以降にTTLキューから退避された総データ量 |
| file_cache_ttl_cache_lru_queue_element_count | TTLキューの現在の要素数                  |
| file_cache_ttl_cache_size                    | TTLキューの現在のサイズ                                |
| file_cache_evict_by_heat\_[A]\_to\_[B]       | キャッシュタイプBによる（時間ベース有効期限）キャッシュタイプAからのデータ退避 |
| file_cache_evict_by_size\_[A]\_to\_[B]       | キャッシュタイプBによる（容量ベース有効期限）キャッシュタイプAからのデータ退避 |
| file_cache_evict_by_self_lru\_[A]            | 新しいデータのための独自のLRUポリシーによるキャッシュタイプAからのデータ退避 |

### SQL Profile

SQL profileのキャッシュ関連メトリクスはSegmentIterator下にあり、以下が含まれます：

| メトリクス名            | 意味                                                      |
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

[Query Performance Analysis](../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)を通じてクエリパフォーマンス分析を表示できます。



## TTL使用方法

テーブル作成時に、対応するPROPERTYを設定してそのテーブルのデータのキャッシュにTTL戦略を使用します。

- `file_cache_ttl_seconds`：新しくインポートされたデータがキャッシュに残ることが期待される時間（秒単位）。

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
上記のテーブルでは、新しくインポートされたすべてのデータは300秒間キャッシュに保持されます。システムは現在、テーブルのTTL時間の変更をサポートしており、ユーザーは実際のニーズに基づいてTTL時間を延長または短縮することができます。

```SQL
ALTER TABLE customer set ("file_cache_ttl_seconds"="3000");
```
:::info Note

変更されたTTL値はすぐには有効になりません。一定の遅延があります。

テーブル作成時にTTLが設定されていない場合、ユーザーはALTER文を実行することでテーブルのTTL属性を変更することもできます。
:::


## 実例

あるユーザーは総データ量が3TBを超える一連のデータテーブルを持っていますが、利用可能なキャッシュ容量は1.2TBのみです。その中で、アクセス頻度が高い2つのテーブルがあります：1つはサイズ200MBのディメンションテーブル（`dimension_table`）、もう1つはサイズ100GBのファクトテーブル（`fact_table`）で、このテーブルは毎日新しいデータがインポートされ、T+1クエリ操作が必要です。さらに、他の大きなテーブルはアクセス頻度が低いです。

LRUキャッシング戦略では、大きなテーブルデータがクエリされると、キャッシュに残る必要のある小さなテーブルデータが置き換えられ、パフォーマンスの変動を引き起こす可能性があります。この問題を解決するために、ユーザーはTTLキャッシング戦略を採用し、2つのテーブルのTTL時間をそれぞれ1年と1日に設定します。

```shell
ALTER TABLE dimension_table set ("file_cache_ttl_seconds"="31536000");

ALTER TABLE fact_table set ("file_cache_ttl_seconds"="86400");
```
ディメンションテーブルについては、サイズが小さく変動性も少ないため、ユーザーは1年間のデータに迅速にアクセスできるようTTL時間を1年に設定します。ファクトテーブルについては、ユーザーは毎日テーブルバックアップを実行してから完全インポートを行う必要があるため、TTL時間は1日に設定されます。
