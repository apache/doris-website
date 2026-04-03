---
{
  "title": "高同時実行ポイントクエリ最適化",
  "language": "ja",
  "description": "Dorisはカラムストレージフォーマットエンジン上に構築されています。高並行性サービスシナリオにおいて、"
}
---
<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->


:::tip Tips
この機能はApache Doris 2.0バージョン以降でサポートされています
:::

## 説明

Dorisはカラムナストレージ形式のエンジン上に構築されています。高並行サービスのシナリオでは、ユーザーは常にシステムから行全体のデータを取得したいと考えます。しかし、テーブルが幅広い場合、カラムナー形式はランダムリードIOを大幅に増幅させます。Dorisのクエリエンジンとプランナーは、ポイントクエリなどの単純なクエリには重すぎます。このようなクエリを処理するために、FEのクエリプランにショートパスを計画する必要があります。FEはSQLクエリのアクセス層サービスで、Javaで書かれています。SQLの解析と分析も、高並行クエリに対して高いCPUオーバーヘッドを招きます。これらの問題を解決するために、DorisにはRow Storage、ショートクエリパス、およびPreparedStatementを導入しました。以下は、これらの最適化を有効にするためのガイドです。

## Row Store形式

olap tableに対してポイントルックアップのIOコストを削減するため、row形式をサポートしていますが、この形式を有効にするには、row形式ストレージのためにより多くのディスクスペースを消費する必要があります。
現在、簡単にするために`row column`と呼ばれる追加のカラムにrowを格納しています。
Row Storageモードはテーブル作成時にのみ有効にできます。テーブル作成文のpropertyで以下のプロパティを指定する必要があります：

```
"store_row_column" = "true"
```
## Uniqueモデルのポイントクエリを高速化

上記の行ストレージは、Uniqueモデルの下でMerge-On-Write戦略を有効にし、列挙時のIOオーバーヘッドを削減するために使用されます。Uniqueテーブルの作成時に`enable_unique_key_merge_on_write`と`store_row_column`が有効になっている場合、プライマリキーのクエリはSQL実行を最適化するためのショートパスを取り、1つのRPCのみでクエリを完了できます。以下は、クエリと行の存在を組み合わせて、UniqueモデルでMerge-On-Write戦略を有効にする例です：

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
1. `enable_unique_key_merge_on_write`を有効にする必要があります。ストレージエンジンでの高速ポイント検索にはプライマリキーが必要だからです

2. 条件が`select * from tbl_point_query where key = 123`のようにプライマリキーのみを含む場合、このようなクエリは短い高速パスを通ります

3. ポイントクエリを実行する際に各列の`column unique id`に依存するため、`light_schema_change`も有効にする必要があります。

4. 単一テーブルのキー列に対する等価クエリのみをサポートし、結合やネストしたサブクエリはサポートしません。WHERE条件はキー列のみで構成され、等価比較である必要があります。これはキーバリュークエリの一種と考えることができます。

5. rowstoreを有効にすると容量が拡張され、より多くのディスク容量を占有する可能性があります。特定の列のみをクエリする必要があるシナリオでは、Doris 3.0以降、`"row_store_columns"="k1,v1,v2"`を使用して特定の列をrowstoreストレージに指定することが推奨されます。その後、クエリはこれらの列に選択的にアクセスできます。例えば:

   ```sql
   SELECT k1, v1, v2 FROM tbl_point_query WHERE k1 = 1
   ```
## `PreparedStatement`の使用

クエリSQLとSQL式の解析にかかるCPUコストを削減するため、mysql プロトコルと完全に互換性のある `PreparedStatement` 機能をFEで提供しています（現在は上記で言及したようなポイントクエリのみをサポート）。これを有効にすると、PreparedStatement SQLと式を事前計算し、セッションレベルのメモリバッファにキャッシュして、後で再利用されます。このようなクエリでCPUがボトルネックになる場合、`PreparedStatement`を使用することで4倍以上のパフォーマンス向上が可能です。以下は`PreparedStatement`を使用したJDBCの例です。

1. JDBC urlを設定し、サーバーサイドprepared statementを有効化

   ```
   url = jdbc:mysql://127.0.0.1:9030/ycsb?useServerPrepStmts=true
   ```
2. `PreparedStatement`を使用する

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
Dorisには、各ページ内の特定のカラムのデータを格納するページレベルのキャッシュがあります。そのため、ページキャッシュはカラムベースのキャッシュです。前述の行ストレージでは、1つの行に複数のカラムのデータが含まれており、大きなクエリによってキャッシュが退避される可能性があり、ヒット率が低下する場合があります。row cacheのヒット率を向上させるために、別途row cacheが導入されており、DorisのLRUキャッシュメカニズムを再利用してメモリ使用量を確保します。以下のBE設定を指定することで有効化できます：

- `disable_storage_row_cache` : row cacheを有効にするかどうか。デフォルトでは有効になっていません。

- `row_cache_mem_limit` : row cacheが占有するメモリの割合を指定します。デフォルトはメモリの20%です。

## パフォーマンス最適化

1. 一般的に、Observerの数を増やすことでクエリ処理能力を向上させることが効果的です。

2. クエリの負荷分散：列挙中に、列挙リクエストを受け取るFE CPUの使用率が高すぎたり、リクエスト応答が遅くなったりすることが判明した場合、jdbc load balanceを使用して負荷分散を行い、リクエストを複数のノードに分散して負荷を分担できます（他の方法でクエリ負荷分散設定を行うこともできます。例：Nginx、proxySQL）

3. クエリリクエストをObserver役割に向けることで、高並行クエリのリクエスト負荷を分担し、fe masterに送信されるクエリリクエスト数を減らすことで、通常Fe Masterノードクエリの時間変動の問題を解決し、より良いパフォーマンスと安定性を得ることができます

## FAQ

#### **1. 設定が正しく、並行列挙を使用したshort path最適化が使用されていることを確認する方法は？**
   
A: explain sqlで、実行計画にSHORT-CIRCUITが現れた場合、short path最適化が使用されていることが証明されます

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

A: Dorisにリクエストを送信後、fe.audit.logで対応するクエリリクエストを見つけ、Stmt=EXECUTE()を確認することで、prepared statementが有効であることを示します

```text
2024-01-02 11:15:51,248 [query] |Client=192.168.1.82:53450|User=root|Db=test|State=EOF|ErrorCode=0|ErrorMessage=|Time(ms)=49|ScanBytes=0|ScanRows=0|ReturnRows=1|StmtId=51|QueryId=b63d30b908f04dad-ab4a
   3ba21d2c776b|IsQuery=true|isNereids=false|feIp=10.16.10.6|Stmt=EXECUTE(-2147481418)|CpuTimeMS=0|SqlHash=eee20fa2ac13a4f93bd4503a87921024|peakMemoryBytes=0|SqlDigest=|TraceId=|WorkloadGroup=|FuzzyVaria
   bles=
```
#### **3. 非主キークエリで高並行ポイントルックアップの特別な最適化を使用できますか？**

A: いいえ、高並行クエリはキー列の等価クエリのみを対象とし、クエリにjoinやネストされたサブクエリを含めることはできません。

#### **4. useServerPrepStmtsは通常のクエリで有用ですか？**

A: Prepared Statementは現在、主キーがチェックされる場合にのみ有効になります。

#### **5. オプティマイザの選択にはグローバル設定が必要ですか？**

A: クエリにprepared statementを使用する場合、Dorisは最高のパフォーマンスを持つクエリメソッドを選択し、オプティマイザを手動で設定する必要はありません。

#### **6. FEがボトルネックになった場合はどうすればよいですか？**

A: FEがCPUを過剰に消費している場合（つまり、%CPU使用率が高い場合）、JDBC URLで以下の設定を有効にしてください：

```
jdbc:mysql:loadbalance://[host1][:port],[host2][:port][,[host3][:port]]/${tbl_name}?useServerPrepStmts=true&cachePrepStmts=true&prepStmtCacheSize=500&prepStmtCacheSqlLimit=1024
```
- 複数のFEがリクエストを処理できるようにloadbalanceを有効にし、FEインスタンスの数が多いほど良い（インスタンスごとに1つをデプロイ）。
- FEでの解析と計画のオーバーヘッドを削減するためにuseServerPrepStmtsを有効にする。
- クライアントがprepared statementをキャッシュし、FEに頻繁にprepareリクエストを送信する必要性を減らすためにcachePrepStmtsを有効にする。
- キャッシュされるクエリテンプレートの最大数を設定するためにprepStmtCacheSizeを調整する。
- 単一のキャッシュされたSQLテンプレートの最大長を設定するためにprepStmtCacheSqlLimitを調整する。

#### **7. compute-storage separation アーキテクチャでクエリパフォーマンスを最適化する方法は？**

A:

- `set global enable_snapshot_point_query = false`。ポイントクエリは、バージョンを取得するためにmeta serviceへの追加RPCが必要で、高QPSの下では容易にボトルネックになる可能性があります。falseに設定することでクエリを高速化できますが、データの可視性が低下します（パフォーマンスと一貫性のトレードオフが必要）。

- base compaction後の結果データがキャッシュに保存されるように、BEパラメータenable_file_cache_keep_base_compaction_output=1を設定し、リモートアクセスによるクエリのジッターを回避します。
