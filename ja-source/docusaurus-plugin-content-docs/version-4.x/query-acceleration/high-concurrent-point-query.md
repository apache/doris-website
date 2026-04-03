---
{
  "title": "高並行ポイントクエリ最適化",
  "description": "Dorisは列指向ストレージフォーマットエンジン上に構築されています。高並行性サービスシナリオにおいて、",
  "language": "ja"
}
---
:::tip Tips
この機能は Apache Doris 2.0 バージョン以降でサポートされています
:::

## 説明

Doris は列指向ストレージフォーマットエンジン上に構築されています。高並行性サービスシナリオでは、ユーザーは常にシステムから行全体のデータを取得したいと考えます。しかし、tableが幅広い場合、列指向フォーマットはランダムリード IO を大幅に増幅させます。Doris のクエリエンジンとプランナーは、ポイントクエリなどの単純なクエリには重すぎます。このようなクエリを処理するために、FE のクエリプランでショートパスを計画する必要があります。FE は SQL クエリのアクセス層サービスであり、Java で記述されています。SQL の解析と分析も、高並行性クエリに対して高い CPU オーバーヘッドをもたらします。これらの問題を解決するために、Doris に行ストレージ、ショートクエリパス、PreparedStatement を導入しました。以下は、これらの最適化を有効にするためのガイドです。

## Row Store Format

olap tableのポイントルックアップ IO コストを削減するために行フォーマットをサポートしていますが、このフォーマットを有効にするには、行フォーマットストレージ用により多くのディスク容量が必要です。現在、簡単にするために `row column` という追加の列に行を保存しています。Row Storage モードは、table作成時にのみ有効にできます。table作成文のプロパティで以下のプロパティを指定する必要があります：

```
"store_row_column" = "true"
```
## Unique モデルのポイントクエリの高速化

上記の行ストレージは、Unique モデルにおける Merge-On-Write 戦略を有効にして、列挙時の IO オーバーヘッドを削減するために使用されます。Unique Table作成時に `enable_unique_key_merge_on_write` と `store_row_column` が有効化されると、プライマリキーのクエリはショートパスを取って SQL 実行を最適化し、1 つの RPC のみでクエリを完了することができます。以下は、クエリと行の存在確認を組み合わせて Unique モデルで Merge-On-Write 戦略を有効にする例です：

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
**注記:**
1. ストレージエンジンでの高速ポイントルックアップにはプライマリキーが必要なため、`enable_unique_key_merge_on_write`を有効にする必要があります

2. `select * from tbl_point_query where key = 123`のように条件がプライマリキーのみを含む場合、そのようなクエリは短い高速パスを通ります

3. ポイントクエリを実行する際に各カラムの`column unique id`に依存するため、`light_schema_change`も有効にする必要があります。

4. 単一Tableのキーカラムに対する等価クエリのみをサポートし、結合やネストされたサブクエリはサポートしません。WHERE条件はキーカラム単体で構成され、等価比較である必要があります。これはkey-valueクエリの一種と考えることができます。

5. rowstoreを有効にすると容量拡張を招き、より多くのディスク容量を占有する可能性があります。特定のカラムのみをクエリする必要があるシナリオでは、Doris 3.0以降、`"row_store_columns"="k1,v1,v2"`を使用して特定のカラムをrowstoreストレージに指定することが推奨されます。その後、クエリでこれらのカラムを選択的にアクセスできます。例えば：

   ```sql
   SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1
   ```
## `PreparedStatement` の使用

クエリSQLおよびSQL式の解析にかかるCPUコストを削減するため、FEでmysqlプロトコルと完全に互換性のある`PreparedStatement`機能を提供しています（現在は前述のようなポイントクエリのみサポート）。これを有効にすると、PreparedStatementのSQLおよび式を事前計算し、セッションレベルのメモリバッファにキャッシュして、後で再利用されます。このようなクエリでCPUがボトルネックになった場合、`PreparedStatement`を使用することで4倍以上のパフォーマンス向上が可能です。以下は`PreparedStatement`を使用したJDBCの例です。

1. JDBC urlを設定し、サーバーサイドprepared statementを有効にする

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
## row cacheの有効化
Dorisには各ページ内の特定のカラムのデータを格納するページレベルのキャッシュがあります。そのため、ページキャッシュはカラムベースのキャッシュです。前述のrow storageでは、1つの行が複数のカラムのデータを含んでおり、大きなクエリによってキャッシュが排出される可能性があり、これがヒット率を低下させる可能性があります。row cacheのヒット率を向上させるため、別のrow cacheが導入されており、これはDorisのLRUキャッシュメカニズムを再利用してメモリ使用量を確保します。以下のBE設定を指定することで有効にできます：

- `disable_storage_row_cache`：row cacheを有効にするかどうか。デフォルトでは有効になっていません。

- `row_cache_mem_limit`：row cacheが占有するメモリの割合を指定します。デフォルトはメモリの20%です。

## パフォーマンス最適化

1. 一般的に、Observerの数を増やすことでクエリ処理能力を向上させることが効果的です。

2. クエリ負荷分散：列挙中に、列挙リクエストを受け付けるFE CPUの使用率が高すぎる、またはリクエスト応答が遅くなることが判明した場合、jdbcロードバランスを使用して負荷分散を行い、複数のノードにリクエストを分散して負荷を共有できます（また、Nginx、proxySQLなどの他の方法でクエリ負荷分散設定を行うこともできます）

3. クエリリクエストをObserverロールに向けることで、高同時実行クエリのリクエスト負荷を共有し、fe masterに送信されるクエリリクエスト数を減らすことで、通常Fe Masterノードクエリの時間のかかる変動の問題を解決し、より良いパフォーマンスと安定性を得ることができます

## FAQ

#### **1. 設定が正しく、同時列挙を使用したショートパス最適化が使用されていることを確認する方法は？**

A：explain sqlで、実行プランにSHORT-CIRCUITが表示された場合、ショートパス最適化が使用されていることを証明します

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
#### **2. prepared statementが有効であることを確認する方法**

A: Dorisにリクエストを送信した後、fe.audit.logで対応するクエリリクエストを見つけ、Stmt=EXECUTE()があることを確認してください。これはprepared statementが有効であることを示しています。

```text
2024-01-02 11:15:51,248 [query] |クライアント=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
   3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVaria
   bles=
```
#### **3. プライマリキー以外のクエリで高並行性ポイントルックアップの特別な最適化を使用できますか？**

A: いいえ、高並行性クエリはキー列の等価クエリのみを対象とし、クエリにjoinやネストされたサブクエリを含めることはできません。

#### **4. useServerPrepStmtsは通常のクエリで有用ですか？**

A: Prepared Statementは現在、プライマリキーがチェックされる場合にのみ有効になります。

#### **5. オプティマイザーの選択にはグローバル設定が必要ですか？**

A: クエリにprepared statementを使用する場合、Dorisは最高のパフォーマンスを持つクエリ方法を選択するため、手動でオプティマイザーを設定する必要はありません。

#### **6. FEがボトルネックになった場合はどうすればよいですか？**

A: FEがCPUを過度に消費している場合（つまり、%CPU使用率が高い場合）、JDBC URLで以下の設定を有効にしてください：

```
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```
- loadbalanceを有効にして、複数のFEがリクエストを処理できるようにし、FEインスタンスが多いほど良い（インスタンスごとに1つをデプロイ）。
- useServerPrepStmtsを有効にして、FEでの解析と計画のオーバーヘッドを削減する。
- cachePrepStmtsを有効にして、クライアントがプリペアドステートメントをキャッシュし、FEへのprepareリクエストを頻繁に送信する必要性を減らす。
- prepStmtCacheSizeを調整して、キャッシュされるクエリテンプレートの最大数を設定する。
- prepStmtCacheSqlLimitを調整して、単一のキャッシュされたSQLテンプレートの最大長を設定する。

#### **7. コンピュート・ストレージ分離アーキテクチャでクエリパフォーマンスを最適化するには？**

A:

- `set global enable_snapshot_point_query = false`。ポイントクエリはバージョンを取得するためにメタサービスへの追加のRPCが必要で、高QPSの下では容易にボトルネックになる可能性がある。これをfalseに設定するとクエリを高速化できるが、データの可視性が低下する（パフォーマンスと一貫性のトレードオフが必要）。

- BEパラメータenable_file_cache_keep_base_compaction_output=1を設定して、base compaction後の結果データをキャッシュに保存し、リモートアクセスによるクエリジッターを回避する。
