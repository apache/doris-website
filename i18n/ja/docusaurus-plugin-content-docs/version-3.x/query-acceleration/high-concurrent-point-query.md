---
{
  "title": "高同時実行ポイントクエリ最適化",
  "description": "Dorisは列指向ストレージフォーマットエンジン上に構築されています。高並行性サービスシナリオにおいて、",
  "language": "ja"
}
---
:::tip Tips
この機能はApache Doris 2.0バージョンから対応しています
:::

## 説明

Dorisはカラム型ストレージフォーマットエンジン上に構築されています。高並行性サービスシナリオにおいて、ユーザーは常にシステムから行全体のデータを取得したいと考えます。しかし、tableの幅が広い場合、カラム型フォーマットはランダム読み取りIOを大幅に増幅させます。Dorisクエリエンジンとプランナーは、ポイントクエリなどの一部の単純なクエリには重すぎます。このようなクエリを処理するために、FEのクエリプランでショートパスを計画する必要があります。FEはSQLクエリのアクセス層サービスで、Javaで記述されています。SQLの解析と分析も、高並行性クエリでは高いCPUオーバーヘッドを引き起こします。これらの問題を解決するために、Dorisにrow storage、short query path、PreparedStatementを導入しました。以下はこれらの最適化を有効にするためのガイドです。

## Row Store Format

olap tableのポイント検索IOコストを削減するためにrow formatをサポートしていますが、このフォーマットを有効にするには、row format store用により多くのディスク容量を消費する必要があります。現在、簡単にするために`row column`と呼ばれる追加のカラムにrowを格納しています。Row Storageモードはtable作成時のみ有効にできます。table作成ステートメントのpropertyで以下のプロパティを指定する必要があります：

```
"store_row_column" = "true"
```
## Unique modelのポイントクエリの高速化

上記の行ストレージは、Unique model下でのMerge-On-Write戦略を有効にし、列挙中のIOオーバーヘッドを削減するために使用されます。UniqueTableの作成時に`enable_unique_key_merge_on_write`と`store_row_column`が有効になっている場合、プライマリキーのクエリはSQL実行を最適化するためのショートパスを通り、1つのRPCのみでクエリを完了できます。以下は、クエリと行の存在を組み合わせてUnique model下でMerge-On-Write戦略を有効にする例です：

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
DISTRIBUTED BY HASH(`k1)` BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 1",
    "enable_unique_key_merge_on_write" = "true",
    "light_schema_change" = "true",
    "store_row_column" = "true"
);
```
**注意:**
1. ストレージエンジンでの高速なポイントルックアップにはプライマリキーが必要なため、`enable_unique_key_merge_on_write`を有効にする必要があります

2. `select * from tbl_point_query where key = 123`のように条件がプライマリキーのみを含む場合、そのようなクエリは短い高速パスを通ります

3. ポイントクエリ実行時に各カラムの`column unique id`に依存するため、`light_schema_change`も有効にする必要があります。

4. 単一Tableのキーカラムに対する等価クエリのみをサポートし、結合やネストしたサブクエリはサポートしません。WHERE条件はキーカラムのみで構成され、等価比較である必要があります。これはkey-valueクエリの一種と考えることができます。

5. rowstoreを有効にすると容量が拡張され、より多くのディスク容量を占有する可能性があります。特定のカラムのみをクエリする必要があるシナリオでは、Doris 2.1以降、`"row_store_columns"="k1,v1,v2"`（バージョン3.0以降）を使用して特定のカラムをrowstoreストレージに指定することを推奨します。その後、クエリはこれらのカラムに選択的にアクセスできます。例えば:

   ```sql
   SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1
   ```
## `PreparedStatement`の使用

クエリSQLとSQL式の解析によるCPU負荷を軽減するため、mysqlプロトコルと完全に互換性のある`PreparedStatement`機能をFEで提供しています（現在は上記で言及したポイントクエリのみサポート）。これを有効にすると、PreparedStatement SQLと式を事前計算し、セッションレベルのメモリバッファにキャッシュして後で再利用します。このようなクエリでCPUがボトルネックになった場合、`PreparedStatement`を使用することで4倍以上のパフォーマンス向上が可能です。以下は`PreparedStatement`を使用するJDBCの例です。

1. JDBC URLを設定し、サーバーサイドprepared statementを有効にする

   ```
   url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
   ```
2. `PreparedStatement`の使用

   ```java
   // use `?` for placement holders, readStatement should be reused
   PreparedStatement readStatement = conn.prepareStatement("select * from tbl_point_query where k1 = ?");
   ...
   readStatement.setInt(1,1234);
   ResultSet resultSet = readStatement.executeQuery();
   ...
   readStatement.setInt(1,1235);
   resultSet = readStatement.executeQuery();
   ...
   ```
## row cacheを有効にする
Dorisには、各ページの特定の列のデータを格納するページレベルのキャッシュがあります。そのため、ページキャッシュは列ベースのキャッシュです。前述の行ストレージでは、1つの行に複数の列のデータが含まれており、大きなクエリによってキャッシュが削除される可能性があり、ヒット率が低下する場合があります。row cacheのヒット率を向上させるために、別途row cacheが導入されており、Dorisの LRU cacheメカニズムを再利用してメモリ使用量を確保します。以下のBE設定を指定することで有効にできます：

- `disable_storage_row_cache`：row cacheを有効にするかどうか。デフォルトでは有効になっていません。

- `row_cache_mem_limit`：row cacheが占有するメモリの割合を指定します。デフォルトはメモリの20%です。

## パフォーマンスの最適化

1. 一般的に、Observerの数を増やすことでクエリ処理能力を向上させることが効果的です。

2. クエリの負荷分散：列挙中に、列挙リクエストを受け付けるFE CPUの使用率が高すぎる、またはリクエストの応答が遅くなることが判明した場合、jdbc load balanceを使用して負荷分散を行い、リクエストを複数のノードに分散して負荷を分散できます（また、Nginx、proxySQLなど、クエリの負荷分散設定に他の方法を使用することもできます）

3. クエリリクエストをObserver役割に向けることで、高い並行性を持つクエリのリクエスト負荷を分散し、fe masterに送信されるクエリリクエストの数を減らすことで、通常はFe Masterノードクエリの時間のかかる変動の問題を解決し、より良いパフォーマンスと安定性を得ることができます

## FAQ

#### **1. 設定が正しく、並行列挙を使用したショートパス最適化が使用されていることを確認する方法は？**

A: explain sqlで、実行計画にSHORT-CIRCUITが表示される場合、ショートパス最適化が使用されていることを証明します

```sql
mysql> explain select * from tbl_point_query where k1 = -2147481418 ;                                                                                                                                
   +-----------------------------------------------------------------------------------------------+                                                                                                       
   | Explain String(Old Planner)                                                                   |                                                                                                       
   +-----------------------------------------------------------------------------------------------+                                                                                                       
   | PLAN FRAGMENT 0                                                                               |                                                                                                       
   |   OUTPUT EXPRS:                                                                               |                                                                                                       
   |     `test`.`tbl_point_query`.`k1`                                                            |                                                                                                       
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
   |      PREDICATES: `k1` = -2147481418 AND `test`.`tbl_point_query`.`__DORIS_DELETE_SIGN__` = 0 |                                                                                                       
   |      partitions=1/1 (tbl_point_query), tablets=1/1, tabletList=360065                         |                                                                                                       
   |      cardinality=9452868, avgRowSize=833.31323, numNodes=1                                    |                                                                                                       
   |      pushAggOp=NONE                                                                           |                                                                                                       
   |      SHORT-CIRCUIT                                                                            |                                                                                                       
   +-----------------------------------------------------------------------------------------------+
```
#### **2. prepared statementが有効であることを確認する方法は？**

A: Dorisにリクエストを送信した後、fe.audit.logで対応するクエリリクエストを見つけ、Stmt=EXECUTE()を確認することで、prepared statementが有効であることを示します

```text
2024-01-02 11:15:51,248 [query] |クライアント=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
   3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVaria
   bles=
```
#### **3. プライマリキー以外のクエリで高並行ポイント検索の特別な最適化を使用できますか？**

A: いいえ、高並行クエリはkey列の等価クエリのみを対象とし、クエリにjoinやネストされたサブクエリを含めることはできません。

#### **4. useServerPrepStmtsは通常のクエリで有用ですか？**

A: Prepared Statementは現在、プライマリキーがチェックされる場合にのみ有効になります。

#### **5. オプティマイザ選択にはグローバル設定が必要ですか？**

A: クエリにprepared statementを使用する場合、Dorisは最高のパフォーマンスを持つクエリ方法を選択するため、手動でオプティマイザを設定する必要はありません。

#### **6. FEがボトルネックになった場合はどうすればよいですか？**

A: FEがCPUを過度に消費している場合（つまり、%CPU使用率が高い場合）、JDBC URLで以下の設定を有効にしてください：

```
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```
- loadbalanceを有効にして、複数のFEがリクエストを処理できるようにし、FEインスタンスが多いほど良い（インスタンスごとに1つずつデプロイする）。
- useServerPrepStmtsを有効にして、FEでの解析と計画のオーバーヘッドを削減する。
- cachePrepStmtsを有効にして、クライアントがプリペアドステートメントをキャッシュし、FEへのprepareリクエストを頻繁に送信する必要性を削減する。
- prepStmtCacheSizeを調整して、キャッシュされるクエリテンプレートの最大数を設定する。
- prepStmtCacheSqlLimitを調整して、単一のキャッシュされたSQLテンプレートの最大長を設定する。

#### **7. コンピュート・ストレージ分離アーキテクチャにおいてクエリパフォーマンスを最適化する方法は？**

A:

- `set global enable_snapshot_point_query = false`。ポイントクエリはバージョンを取得するためにメタサービスへの追加のRPCが必要であり、高QPSの下では容易にボトルネックになる可能性があります。falseに設定するとクエリを高速化できますが、データの可視性が低下します（パフォーマンスと整合性のトレードオフが必要）。

- BEパラメータenable_file_cache_keep_base_compaction_output=1を設定して、ベースコンパクション後の結果データがキャッシュに保存されるようにし、リモートアクセスによるクエリのジッターを回避する。
