---
{
    "title": "高同時実行ポイントクエリ",
    "language": "ja",
    "description": "Doris で高同時実行ポイントクエリを有効にする方法。行ストア、ショートサーキット経路、PreparedStatement、行キャッシュを使用して、主キーによるポイントクエリの QPS と応答速度を大幅に改善します。",
    "keywords": [
        "Doris 高同時実行ポイントクエリ",
        "主キーによるポイントクエリの最適化",
        "PreparedStatement",
        "行ストア store_row_column",
        "Merge-On-Write ポイントクエリ",
        "SHORT-CIRCUIT ショートサーキット経路",
        "行キャッシュ",
        "FE の高 CPU 使用率によるポイントクエリのボトルネック"
    ]
}
---

<!-- Knowledge type: Capability definition / Configuration parameter / Performance tuning -->
<!-- Applicable scenarios: High-concurrency primary-key point queries, KV-style queries, low-latency online services -->

## 高同時実行ポイントクエリとは

高同時実行ポイントクエリは、**主キーに対する等価条件のクエリ**向けに Doris が提供する専用の最適化機能です。多数のリクエストを同時に処理するサービスでは、主キーを使ってデータの行全体を取得することが求められます。しかし、Doris のデフォルトの列指向ストレージ形式とクエリプランニングの経路は、このような KV 形式のリクエストには適していません。

この問題に対処するため、Doris は次の各層で最適化を行います。

| 最適化 | 解決する問題 |
| -------------------- | ----------------------------------------------------------- |
| 行ストア | 幅の広いテーブルから行全体を読み取る際、列指向ストレージではランダム I/O が増えるため、行ストアによって I/O のオーバーヘッドを減らします |
| ショートサーキットクエリ経路（SHORT-CIRCUIT） | 単純なクエリに対して FE のクエリプランニングと解析は負荷が大きいため、通常のプランニング処理を迂回します |
| PreparedStatement | SQL の解析と式の評価は FE の CPU を消費するため、プランと式をキャッシュして負荷を減らします |
| 行キャッシュ | 大規模なクエリによって Page Cache の内容は退避されやすいため、専用の行キャッシュでヒット率を高めます |

## 有効化のためのクイックチェックリスト

高同時実行ポイントクエリを使用する前に、次の条件をすべて満たしていることを確認してください。

- テーブルが **Unique Key モデル**を使用し、`enable_unique_key_merge_on_write = true` が有効になっている
- 行ストアを有効にするため、テーブル作成時に `store_row_column = true` を設定している
- テーブル作成時に `light_schema_change = true` を有効にしている
- クエリには **Key 列に対する等価条件のみ**が含まれ、結合やネストしたサブクエリがない
- PreparedStatement を使用するため、JDBC URL で `useServerPrepStmts=true` を有効にしている
- （任意）行キャッシュを有効にするため、BE の設定で `disable_storage_row_cache = false` を指定している
- `EXPLAIN` を使用し、実行プランに `SHORT-CIRCUIT` マーカーが含まれることを確認している

## 行ストア

<!-- Knowledge type: Configuration parameter -->

行ストアモードは、幅の広いテーブルから行全体を読み取る際のランダム I/O のオーバーヘッドを減らすために使用します。現在の実装では、一行分のデータをエンコードし、別の列に格納します。

- 有効にできるのは**テーブル作成時のみ**で、作成後に変更することはできません。
- 次のプロパティを `PROPERTIES`（`CREATE TABLE` 文内）に指定します。

```sql
"store_row_column" = "true"
```

- 行ストアを有効にすると、必要なストレージ容量が増えます。**Doris 3.0 以降**では、一部の列だけをクエリする場合、`row_store_columns` を使用して必要な列だけを行ストアに含めることを推奨します。

```sql
"row_store_columns" = "key,v1,v2"
```

クエリでは、これらの列にアクセスするだけで済みます。例を次に示します。

```sql
SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1;
```

## Unique Key モデルでのポイントクエリ最適化

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Primary-key point-query table creation -->

Unique Key モデルで Merge-On-Write と行ストアの両方を有効にすると、主キーポイントクエリには自動的に**ショートサーキット経路**が適用されます。これにより SQL の実行が最適化され、一回の RPC だけでクエリを完了できます。

### テーブル作成例

```sql
CREATE TABLE `tbl_point_query` (
    `k1` int(11) NULL,
    `v1` decimal(27, 9) NULL,
    `v2` varchar(30) NULL,
    `v3` varchar(30) NULL,
    `v4` date NULL,
    `v5` datetime NULL,
    `v6` float NULL,
    `v7` datev2 NULL
) ENGINE=OLAP
UNIQUE KEY(`k1`)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(`k1`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true"
);
```

### 主な制約と注意点

| 制約 / プロパティ | 説明 |
| ---------------------------------- | -------------------------------------------------------------------- |
| `enable_unique_key_merge_on_write` | 有効にする必要があります。ストレージエンジンは、このプロパティを利用して主キーポイントクエリを高速に実行します |
| `light_schema_change` | 有効にする必要があります。主キーポイントクエリは、列を特定するためにこの機能の `column unique id` に依存します |
| クエリ条件 | Key 列に対する単一テーブルの**等価条件のクエリ**のみをサポートします。結合とネストしたサブクエリはサポートしません |
| 述語の形式 | `WHERE` 句には **Key 列に対する等価条件のみ**を含める必要があります。これは KV 形式のクエリとみなせます |
| 行ストアの容量 | 行ストアを有効にすると、必要なストレージ容量が増えます。3.0 以降では、`row_store_columns` を使用して列のサブセットを指定することを推奨します |

たとえば、`SELECT * FROM tbl_point_query WHERE k1 = 123` は条件を満たし、ショートサーキット最適化経路が適用されます。

## PreparedStatement の使用

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: FE CPU becomes the point-query bottleneck -->

SQL の解析と式の評価にかかる負荷を減らすため、Doris は MySQL プロトコルと**完全に互換性のある** FE 側の `PreparedStatement` 機能を提供します（現在サポートするのは主キーポイントクエリのみです）。

- 有効にすると、SQL と式が事前に計算され、セッション単位のメモリキャッシュに保存されます。
- 後続のクエリではキャッシュされたオブジェクトを直接再利用するため、解析と計算の繰り返しを避けられます。
- 主キーポイントクエリで CPU がボトルネックの場合、`PreparedStatement` を有効にすると性能が **4 倍以上**向上する可能性があります。

### ステップ 1: JDBC URL でサーバー側の PreparedStatement を有効にする

```text
url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
```

### ステップ 2: コードで PreparedStatement を使用する

```java
// use `?` for placement holders, readStatement should be reused
PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
...
readStatement.setInt(1, 1234);
ResultSet resultSet = readStatement.executeQuery();
...
readStatement.setInt(1, 1235);
resultSet = readStatement.executeQuery();
...
```

## 行キャッシュの有効化

<!-- Knowledge type: Configuration parameter -->
<!-- Applicable scenarios: Low row-store hit rate, Page Cache easily evicted -->

Doris はデフォルトで**ページ単位のキャッシュ**を提供します。各ページには単一の列のデータが格納されるため、Page Cache は列指向です。行ストアでは一行に複数の列が含まれ、キャッシュの内容が大規模なクエリによって退避される可能性があります。

ヒット率を高めるため、Doris はメモリ使用量の制御に LRU Cache の仕組みを再利用した、独立した**行キャッシュ**を導入しています。次の BE 設定で有効にします。

| 設定 | デフォルト値 | 説明 |
| ---------------------------- | ---------- | --------------------------------- |
| `disable_storage_row_cache` | `true`（デフォルトでは無効） | 行キャッシュを無効にするかどうか。`false` に設定すると有効になります |
| `row_cache_mem_limit` | `20%` | 行キャッシュが使用するメモリの割合 |

## 性能チューニングの推奨事項

<!-- Knowledge type: Performance tuning -->

上記の機能を有効にした後は、デプロイ構成に応じて、ポイントクエリのスループットと安定性をさらに改善できます。

1. **Observer ノードの数を増やす**: Observer を追加すると、通常はクエリの処理能力を効果的に高められます。
2. **クエリの負荷分散**: ポイントクエリのリクエストを受ける FE の CPU 使用率が高い場合や応答が遅い場合は、JDBC Load Balance を使用してリクエストを複数のノードに分散します。Nginx や ProxySQL なども使用できます。
3. **ポイントクエリのリクエストを Observer に送る**: FE Master に送るポイントクエリのリクエストを減らすと、通常は FE Master のクエリ遅延の変動が抑えられ、性能と安定性が向上します。

## よくある質問

### Q1: 設定が正しく、ポイントクエリにショートサーキット最適化が適用されていることを確認するには？

`EXPLAIN` を実行します。実行プランに `SHORT-CIRCUIT` が表示されれば、ショートサーキット最適化が適用されています。

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ;
+-----------------------------------------------------------------------------------------------+
| Explain String(Old Planner)                                                                   |
+-----------------------------------------------------------------------------------------------+
| PLAN FRAGMENT 0                                                                               |
|   OUTPUT EXPRS:                                                                               |
|     `test`.`tbl_point_query`.`k1`                                                             |
|     `test`.`tbl_point_query`.`v1`                                                             |
|     `test`.`tbl_point_query`.`v2`                                                             |
|     `test`.`tbl_point_query`.`v3`                                                             |
|     `test`.`tbl_point_query`.`v4`                                                             |
|     `test`.`tbl_point_query`.`v5`                                                             |
|     `test`.`tbl_point_query`.`v6`                                                             |
|     `test`.`tbl_point_query`.`v7`                                                             |
|   PARTITION: UNPARTITIONED                                                                    |
|                                                                                               |
|   HAS_COLO_PLAN_NODE: false                                                                   |
|                                                                                               |
|   VRESULT SINK                                                                                |
|      MYSQL_PROTOCAL                                                                           |
|                                                                                               |
|   0:VOlapScanNode                                                                             |
|      TABLE: test.tbl_point_query(tbl_point_query), PREAGGREGATION: ON                         |
|      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0  |
|      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         |
|      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |
|      pushAggOp=NONE                                                                           |
|      SHORT-CIRCUIT                                                                            |
+-----------------------------------------------------------------------------------------------+
```

### Q2: PreparedStatement が有効になっていることを確認するには？

Doris にリクエストを送信した後、`fe.audit.log` で対応するクエリリクエストを探します。`Stmt=EXECUTE()` が表示されれば、PreparedStatement が有効になっています。

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVariables=
```

### Q3: 主キーを使用しないクエリにも、高同時実行ポイントクエリ専用の最適化を適用できますか？

いいえ。高同時実行ポイントクエリの対象は **Key 列に対する等価条件のクエリ**だけであり、クエリに**結合やネストしたサブクエリを含めることはできません**。

### Q4: `useServerPrepStmts` は通常のクエリにも役立ちますか？

現在、PreparedStatement が効果を発揮するのは**主キーポイントクエリのみ**です。

### Q5: オプティマイザの選択をグローバルに設定する必要はありますか？

いいえ。クエリで PreparedStatement を使用すると、Doris が最も性能の高いクエリ方式を自動的に選択するため、オプティマイザを手動で設定する必要はありません。

### Q6: FE がボトルネックになった場合はどうすればよいですか？

FE の CPU 使用率が高すぎる（`%CPU` が高い）場合は、JDBC URL で次の負荷分散とキャッシュの設定を有効にすることを推奨します。

```text
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```

| パラメータ | 目的 |
| ----------------------- | ---------------------------------------------------------- |
| `loadbalance` | 複数の FE がリクエストを処理できるようにします。FE の数が多いほど効果的です（ノードごとに一つのインスタンスをデプロイします） |
| `useServerPrepStmts` | FE の解析とプランニングの負荷を減らします |
| `cachePrepStmts` | クライアント側で PreparedStatement をキャッシュし、FE に対する prepare リクエストの頻度を減らします |
| `prepStmtCacheSize` | キャッシュ可能なクエリテンプレートの最大数を設定します |
| `prepStmtCacheSqlLimit` | キャッシュされる SQL テンプレート一件の最大長を設定します |

### Q7: ストレージとコンピュートを分離した構成では、クエリ性能をどのように最適化できますか？

次の二つの方法で調整できます。

- **スナップショットポイントクエリを無効にする**:

    ```sql
    SET GLOBAL enable_snapshot_point_query = false;
    ```

    ポイントクエリで Meta Service からバージョンを取得すると追加の RPC が発生し、高い QPS では Meta Service がボトルネックになりやすくなります。`false` に設定するとクエリは高速になりますが、データの可視性は低下します（**性能と可視性のバランスを考慮してください**）。

- **Base Compaction の出力キャッシュを有効にする**: BE パラメータ `enable_file_cache_keep_base_compaction_output=1` を設定すると、Base Compaction 後の結果データがキャッシュに格納され、リモートアクセスによるクエリ遅延の変動を回避できます。
