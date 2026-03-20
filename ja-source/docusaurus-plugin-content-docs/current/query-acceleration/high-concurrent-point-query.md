---
{
  "title": "高同時実行ポイントクエリ最適化",
  "language": "ja",
  "description": "Dorisは列指向ストレージフォーマットエンジン上に構築されています。高並行性サービスシナリオにおいて、"
}
---
:::tip Tips
この機能は Apache Doris 2.0 バージョンから対応しています
:::

## 説明

Doris は列指向ストレージフォーマットエンジン上に構築されています。高同時実行サービスシナリオでは、ユーザーは常にシステムから行全体のデータを取得したいと考えます。しかし、テーブルが幅広い場合、列指向フォーマットはランダム読み取り IO を大幅に増幅させます。Doris クエリエンジンとプランナーは、ポイントクエリなどの一部のシンプルなクエリには重すぎます。このようなクエリを処理するには、FE のクエリプランでショートパスを計画する必要があります。FE は SQL クエリのアクセス層サービスで、Java で書かれています。SQL の解析と分析も、高同時実行クエリに対して高い CPU オーバーヘッドをもたらします。これらの問題を解決するために、Doris に行ストレージ、ショートクエリパス、PreparedStatement を導入しました。以下は、これらの最適化を有効にするためのガイドです。

## Row Store Format

ポイントルックアップの IO コストを削減するために olap table の行フォーマットをサポートしていますが、このフォーマットを有効にするには、行フォーマットストア用により多くのディスク容量を費やす必要があります。
現在、簡単のために `row column` と呼ばれる追加の列に行を格納しています。
Row Storage モードはテーブル作成時にのみ有効にできます。テーブル作成文の property で以下のプロパティを指定する必要があります：

```
"store_row_column" = "true"
```
## Unique モデルでのポイントクエリの高速化

上記の行ストレージは、Unique モデルでの Merge-On-Write 戦略を有効にし、列挙中の IO オーバーヘッドを削減するために使用されます。Unique テーブル作成時に `enable_unique_key_merge_on_write` と `store_row_column` が有効になっている場合、プライマリキーのクエリはショートパスを通って SQL 実行を最適化し、1回の RPC のみでクエリを完了できます。以下は、クエリと行の存在を組み合わせることで、Unique モデルでの Merge-On-Write 戦略を有効にする例です：

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
1. ストレージエンジンでの高速なポイントルックアップには主キーが必要なため、`enable_unique_key_merge_on_write`を有効にする必要があります

2. 条件が`select * from tbl_point_query where key = 123`のように主キーのみを含む場合、そのようなクエリは短い高速パスを通ります

3. ポイントクエリを実行する際に各カラムの`column unique id`に依存するため、`light_schema_change`も有効にする必要があります。

4. 単一テーブルのキーカラムに対する等価クエリのみをサポートし、結合やネストされたサブクエリはサポートしません。WHERE条件はキーカラムのみで構成され、等価比較である必要があります。これはkey-valueクエリの一種と考えることができます。

5. rowstoreを有効にすると容量が拡大し、より多くのディスク容量を占有する可能性があります。特定のカラムのみをクエリする必要があるシナリオでは、Doris 3.0以降、`"row_store_columns"="k1,v1,v2"`を使用して特定のカラムをrowstoreストレージに指定することを推奨します。その後、クエリはこれらのカラムに選択的にアクセスできます。例えば:

   ```sql
   SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1
   ```
## `PreparedStatement`の使用

クエリSQLとSQL式の解析にかかるCPUコストを削減するため、FEではmysqlプロトコルと完全互換の`PreparedStatement`機能を提供しています（現在は前述のようなポイントクエリのみサポート）。これを有効にすると、PreparedStatement SQLと式が事前計算され、セッションレベルのメモリバッファにキャッシュされ、後で再利用されます。このようなクエリでCPUがボトルネックになった場合、`PreparedStatement`を使用することで4倍以上のパフォーマンス向上が可能です。以下は`PreparedStatement`を使用するJDBCの例です。

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
## 行キャッシュの有効化
Dorisには、各ページの特定の列のデータを保存するページレベルキャッシュがあります。そのため、ページキャッシュは列ベースのキャッシュです。前述の行ストレージでは、1つの行に複数の列のデータが含まれており、キャッシュが大きなクエリによって削除される可能性があり、ヒット率が低下する場合があります。行キャッシュのヒット率を向上させるため、別の行キャッシュが導入されており、DorisのLRUキャッシュメカニズムを再利用してメモリ使用量を確保します。以下のBE設定を指定することで有効にできます：

- `disable_storage_row_cache`：行キャッシュを有効にするかどうか。デフォルトでは有効になっていません。

- `row_cache_mem_limit`：行キャッシュが占有するメモリの割合を指定します。デフォルトはメモリの20%です。

## パフォーマンス最適化

1. 一般的に、Observerの数を増やすことでクエリ処理能力を向上させることが効果的です。

2. クエリ負荷分散：列挙中に、列挙要求を受け付けるFE CPUの使用率が高すぎる、または要求応答が遅くなることが判明した場合、jdbc load balanceを使用して負荷分散を行い、複数のノードに要求を分散して負荷を共有できます（Nginx、proxySQLなどの他の方法をクエリ負荷分散設定に使用することも可能です）

3. クエリ要求をObserver役割に向けることで高並行クエリの要求負荷を共有し、fe masterに送信されるクエリ要求数を減らすことで、通常Fe Masterノードクエリの時間消費変動の問題を解決し、より良いパフォーマンスと安定性を得ることができます

## FAQ

#### **1. 設定が正しく、並行列挙を使用したショートパス最適化が使用されていることを確認する方法は？**

A：explain sqlで、実行計画にSHORT-CIRCUITが表示された場合、ショートパス最適化が使用されていることを証明します

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
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
   3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVaria
   bles=
```
#### **3. 主キー以外のクエリでは、高並行性ポイントルックアップの特別な最適化を使用できますか？**

A: いいえ、高並行性クエリはキー列の等価クエリのみを対象とし、クエリにjoinやネストされたサブクエリを含めることはできません。

#### **4. useServerPrepStmtsは通常のクエリで有用ですか？**

A: Prepared Statementは現在、主キーがチェックされる場合にのみ有効になります。

#### **5. オプティマイザーの選択にはグローバル設定が必要ですか？**

A: クエリにprepared statementを使用する場合、Dorisは最高のパフォーマンスを持つクエリ方法を選択するため、手動でオプティマイザーを設定する必要はありません。

#### **6. FEがボトルネックになった場合、どうすればよいですか？**

A: FEが過度にCPUを消費している場合（つまり、%CPU使用率が高い場合）、JDBC URLで以下の設定を有効にしてください：

```
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```
- 複数のFEがリクエストを処理できるようにloadbalanceを有効にし、FEインスタンスが多いほど良い（インスタンスごとに1つずつデプロイする）。
- FEでの解析と計画のオーバーヘッドを削減するためにuseServerPrepStmtsを有効にする。
- クライアントがプリペアドステートメントをキャッシュし、FEへのprepareリクエストを頻繁に送信する必要性を減らすためにcachePrepStmtsを有効にする。
- キャッシュされるクエリテンプレートの最大数を設定するためにprepStmtCacheSizeを調整する。
- 単一のキャッシュされるSQLテンプレートの最大長を設定するためにprepStmtCacheSqlLimitを調整する。

#### **7. コンピュート・ストレージ分離アーキテクチャにおけるクエリパフォーマンスの最適化方法は？**

回答：

- `set global enable_snapshot_point_query = false`。ポイントクエリはバージョンを取得するためにメタサービスへの追加RPCが必要で、高QPSの下でボトルネックになりやすい。falseに設定するとクエリを高速化できるが、データの可視性が低下する（パフォーマンスと整合性のトレードオフが必要）。

- BEパラメータenable_file_cache_keep_base_compaction_output=1を設定し、base compaction後の結果データがキャッシュに格納されるようにして、リモートアクセスによるクエリのジッターを回避する。
