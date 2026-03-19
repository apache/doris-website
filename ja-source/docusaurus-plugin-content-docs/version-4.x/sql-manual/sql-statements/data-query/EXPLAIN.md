---
{
  "title": "EXPLAIN",
  "description": "EXPLAIN文は、指定されたクエリに対するDorisのクエリ実行計画を表示します。",
  "language": "ja"
}
---
## 説明

EXPLAIN文は、与えられたクエリに対するDorisのクエリ実行プランを表示します。Dorisのクエリオプティマイザーは、統計データ、データ特性、およびHASH JOIN、パーティショニング、バケッティングなどの機能を使用して効率的なプランを作成することを目的としています。しかし、理論的および実用的な制約により、プランのパフォーマンスが期待を下回る場合があります。

パフォーマンスを向上させるには、現在のプランを分析することが重要です。この記事では、最適化のためのEXPLAIN文の使用方法を説明します。

## 構文

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```
## 必須パラメータ

**<query_block>**

> 実行計画を取得したいクエリステートメントです。

## オプションパラメータ

**[VERBOSE]**

> 詳細情報を表示するかどうかは`VERBOSE`の指定によって決まります。`VERBOSE`を指定すると、各オペレータの詳細、使用するタプルID、各タプルの詳細な説明を含む包括的な詳細が表示されます。指定しない場合は、簡潔な情報が提供されます。


## 戻り値

### 基本概念

`EXPLAIN`によって表示される情報をより理解するために、Doris実行計画のいくつかの核となる概念を紹介します。

| 名前      | 説明                                                  |
| :-------- | :----------------------------------------------------------- |
| PLAN      | 実行計画。クエリは実行プランナーによって実行計画に変換され、実行エンジンによって実行されます。 |
| FRAGMENT  | 実行フラグメント。Dorisは分散実行エンジンであるため、完全な実行計画は複数の単一ノード実行フラグメントに分割されます。FRAGMENTTableは完全な単一ノード実行フラグメントを表します。複数のFRAGMENTが組み合わさって完全なPLANを形成します。 |
| PLAN NODE | オペレータ。実行計画の最小単位。FRAGMENTは複数のオペレータで構成されます。各オペレータは、集約、結合などの特定の実行ロジックを担当します。 |

### 戻り値の構造

Doris `EXPLAIN`ステートメントの結果は完全なPLANです。PLAN内では、FRAGMENTは実行順序に基づいて後ろから前に並んでいます。各FRAGMENT内では、オペレータ（PLAN NODES）も実行順序に基づいて後ろから前に並んでいます。

以下に例を示します：

```sql
+--------------------------------------------------+
| Explain String(Nereids Planner)                  |
+--------------------------------------------------+
| PLAN FRAGMENT 0                                  |
|   OUTPUT EXPRS:                                  |
|     cnt[#10]                                     |
|     cnt[#11]                                     |
|   PARTITION: UNPARTITIONED                       |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   VRESULT SINK                                   |
|      MYSQL_PROTOCAL                              |
|                                                  |
|   7:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 1                                  |
|                                                  |
|   PARTITION: RANDOM                              |
|                                                  |
|   HAS_COLO_PLAN_NODE: false                      |
|                                                  |
|   STREAM DATA SINK                               |
|     EXCHANGE ID: 07                              |
|     UNPARTITIONED                                |
|                                                  |
|   6:VHASH JOIN(354)                              |
|   |  join op: INNER JOIN(BROADCAST)[]            |
|   |  equal join conjunct: cnt[#7] = cnt[#5]      |
|   |  cardinality=1                               |
|   |  vec output tuple id: 8                      |
|   |  vIntermediate tuple ids: 7                  |
|   |  hash output slot ids: 5 7                   |
|   |  distribute expr lists:                      |
|   |  distribute expr lists:                      |
|   |                                              |
|   |----4:VEXCHANGE                               |
|   |       offset: 0                              |
|   |       distribute expr lists:                 |
|   |                                              |
|   5:VEXCHANGE                                    |
|      offset: 0                                   |
|      distribute expr lists:                      |
|                                                  |
| PLAN FRAGMENT 2                                  |
|   ...                                            |
|                                                  |
| PLAN FRAGMENT 3                                  |
|   ...                                            |
+--------------------------------------------------+
```
オペレータは破線でその子ノードにリンクされています。オペレータが複数の子を持つ場合、それらは垂直に配置され、右から左への順序を表します。上記の例では、オペレータ 6 (VHASH JOIN) は左の子としてオペレータ 5 (EXCHANGE)、右の子としてオペレータ 4 (EXCHANGE) を持ちます。


### Fragment フィールド説明


| 名前               | 説明                                                  |
| :----------------- | :----------------------------------------------------------- |
| PARTITION          | 現在の Fragment のデータ分散を表示します       |
| HAS_COLO_PLAN_NODE | fragment が colocate オペレータを含むかどうかを示します        |
| Sink               | fragment データ出力の方法、詳細は下記表を参照 |



**Sink 方式**



| 名前               | 説明                                                  |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | 次の Fragment にデータを出力します。2行の情報を含みます。<br />1行目：データが送信される下流の EXCHANGE NODE。<br />2行目：データ分散の方法。<br />  - UNPARTITIONED は各下流インスタンスが完全なデータセットを受信することを意味します。これは通常、broadcast join や global limit や order by などの単一インスタンスロジックが必要な場合に発生します。<br /> - RANDOM は各下流インスタンスが重複なしでランダムなデータサブセットを受信することを意味します。<br /> - HASH_PARTITIONED は、リストされたスロットをキーとして使用してハッシュし、同じ下流インスタンスにデータシャードを送信します。これは partition hash join の上流や2段階集約の第2段階でよく使用されます。 |
| RESULT SINK        | 結果データを FE に送信します。1行目はデータ送信に使用されるプロトコルを示し、現在 MySQL と arrow プロトコルをサポートしています。 |
| OLAP TABLE SINK    | OLAP Tableにデータを書き込みます。                                |
| MultiCastDataSinks | 複数の STREAM DATA SINK を含むマルチキャストオペレータです。各 STREAM DATA SINK は完全なデータセットをその下流に送信します。 |



### Tuple 情報説明

VERBOSE モードを使用すると、Tuple 情報が出力されます。Tuple 情報は、SLOT タイプ、nullable ステータスなどを含む、データ行内の SLOT の詳細を記述します。

出力には複数の TupleDescriptor が含まれ、それぞれ複数の SlotDescriptor が含まれます。例を以下に示します。

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
```
#### TupleDescriptor



| Name | デスクリプション                                                  |
| :--- | :----------------------------------------------------------- |
| id   | タプルディスクリプタのid                               |
| tbl  | タプルの対応するTable、または適用できない場合は `null`  |



#### SlotDescriptor

| Name            | デスクリプション                                                  |
| :-------------- | :----------------------------------------------------------- |
| id              | スロットディスクリプタのid                                |
| col             | スロットの対応するカラム、または適用できない場合は空白 |
| colUniqueId     | 対応するカラムのユニークid、または適用できない場合は-1 |
| type            | スロットのタイプ                                         |
| nullable        | 対応するデータがnullになり得るかを示す              |
| isAutoIncrement | カラムが自動インクリメントされるかを示す                  |
| subColPath      | カラム内のサブカラムパス、現在はvariant型にのみ適用 |

### オペレータの説明

#### オペレータ一覧

| Name                  | デスクリプション                                                  |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE             | 集約オペレータ                                         |
| ANALYTIC              | ウィンドウ関数オペレータ                                     |
| ASSERT NUMBER OF ROWS | 下流出力行数をチェックするオペレータ       |
| EXCHANGE              | データ交換受信オペレータ                              |
| MERGING-EXCHANGE      | ソートと行制限機能を持つデータ交換受信オペレータ |
| HASH JOIN             | ハッシュ結合オペレータ                                           |
| NESTED LOOP JOIN      | ネストループ結合オペレータ                                    |
| PartitionTopN         | パーティション内データ事前フィルタリングオペレータ                  |
| REPEAT_NODE           | データ複製オペレータ                                    |
| DataGenScanNode       | Table値関数オペレータ                               |
| EsScanNode            | ESTableスキャンオペレータ                                       |
| HIVE_SCAN_NODE        | HiveTableスキャンオペレータ                                     |
| HUDI_SCAN_NODE        | HudiTableスキャンオペレータ                                  |
| ICEBERG_SCAN_NODE     | IcebergTableスキャンオペレータ                                  |
| PAIMON_SCAN_NODE      | PaimonTableスキャンオペレータ                                   |
| JdbcScanNode          | JdbcTableスキャンオペレータ                                     |
| OlapScanNode          | OlapTableスキャンオペレータ                                     |
| SELECT                | フィルタリングオペレータ                                           |
| UNION                 | 和集合オペレータ                                           |
| EXCEPT                | 差集合オペレータ                                      |
| INTERSECT             | 積集合オペレータ                                    |
| SORT                  | ソートオペレータ                                             |
| TOP-N                 | ソートしてトップN結果を返すオペレータ                       |
| TABLE FUNCTION NODE   | Table関数オペレータ (lateral view)                       |



#### 共通フィールド



| Name                    | デスクリプション                                                  |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | 出力行数を制限                             |
| offset                  | 出力前にスキップする行数                     |
| conjuncts               | 現在のノードの結果をフィルタリング。projectionより前に実行。 |
| projections             | 現在のオペレータ後のプロジェクション操作。conjunctsより後に実行。 |
| project output tuple id | プロジェクション後の出力タプル。データタプル内のスロット配置はtuple descで確認可能。 |
| cardinality             | オプティマイザによる推定行数                         |
| distribute expr lists   | 現在のノードの子ノードの元のデータ分散方法 |
| Expression's slot id    | slot idに対応する具体的なスロットはverboseモードのタプルリストで確認可能。このリストはスロットタイプやnullable属性などの情報を提供。式の後に`[#5]`として表現。 |



#### AGGREGATE



| Name                | デスクリプション                                                  |
| :------------------ | :----------------------------------------------------------- |
| (Aggregation Phase) | 集約フェーズは2つの用語で表される。<br /> 最初の用語はupdate（ローカル集約）またはmerge（グローバル集約）のいずれか。<br /> 2番目の用語は現在のデータがシリアル化されているか（serialize）、または最終計算が完了しているか（finalize）を示す。 |
| STREAMING           | 多段階集約切り詰めのローカル集約オペレータのみがこのフラグを持つ。現在の集約ノードがSTREAMINGモードを使用する可能性があることを示し、入力データは実際の計算なしに直接次の集約段階に渡される。 |
| output              | 現在の集約オペレータの出力。すべてのローカル事前集約関数にはpartialが前置される。 |
| group by            | 集約のキー                                      |



#### ANALYTIC



| Name         | デスクリプション                                                  |
| :----------- | :----------------------------------------------------------- |
| functions    | 現在のウィンドウ関数の名前                      |
| partition by | ウィンドウ関数のover句のpartition by句に対応。ウィンドウ化式。 |
| order by     | ウィンドウ内のソート式と順序               |
| window       | ウィンドウ範囲                                                 |



#### ASSERT NUMBER OF ROWS



| Name | デスクリプション                                                |
| :--- | :--------------------------------------------------------- |
| EQ   | 下流出力はこの行数制約に一致する必要がある |



#### HASH JOIN



| Name                  | デスクリプション                                                  |
| :-------------------- | :----------------------------------------------------------- |
| join op               | 結合のタイプ                                                 |
| equal join conjunct   | 結合条件の等価条件                     |
| other join predicates | 結合条件のうち等価以外の条件         |
| mark join predicates  | mark joinで使用される条件                                 |
| other predicates      | 結合実行後のフィルタリング述語                    |
| runtime filters       | 生成されるランタイムフィルタ                                    |
| output slot ids       | 最終出力スロットのリスト                                   |
| hash output slot ids  | ハッシュ結合実行後、ただし他の結合条件が適用される前の出力スロットのリスト |
| isMarkJoin            | mark joinかどうかを示す                          |


#### NESTED LOOP JOIN



| Name                 | デスクリプション                  |
| :------------------- | :--------------------------- |
| join op              | 結合操作のタイプ       |
| join conjuncts       | 結合の条件       |
| mark join predicates | mark joinで使用される条件 |
| predicates           | 結合後のフィルタ述語 |
| runtime filters      | 生成されるランタイムフィルタ    |
| output slot ids      | 最終出力スロットのリスト   |
| isMarkJoin           | mark joinかどうか    |



#### PartitionTopN



| Name                 | デスクリプション                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | グループ化フィルタ最適化を適用するウィンドウ関数        |
| has global limit     | 行数のグローバル制限の有無             |
| partition limit      | 各パーティション内の行数制限            |
| partition topn phase | 現在のフェーズ: TWO_PHASE_GLOBAL_PTOPNはパーティションキーによるシャッフル後のグローバルフェーズ、TWO_PHASE_LOCAL_PTOPNはパーティションキーによるシャッフル前のローカルフェーズ |



#### REPEAT_NODE



| Name   | デスクリプション                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | 各行の繰り返し回数と集約カラムの対応するslot id |
| exprs  | 繰り返し後の出力データの式のリスト         |



#### DataGenScanNode



| Name                 | デスクリプション         |
| :------------------- | :------------------ |
| table value function | Table関数名 |



#### EsScanNode



| Name              | デスクリプション                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | 結果をソートするカラム    |
| LOCAL_PREDICATES  | Doris内で実行されるフィルタ  |
| REMOTE_PREDICATES | ES内で実行されるフィルタ     |
| ES index/type     | クエリ対象のESインデックスとタイプ |



#### HIVE_SCAN_NODE



| Name          | デスクリプション                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | スキャン分割数                      |
| totalFileSize | スキャン対象の総ファイルサイズ              |
| scanRanges    | スキャン分割の情報                 |
| partition     | スキャン対象のパーティション数         |
| backends      | 各BEがスキャンする具体的なデータ情報     |
| cardinality   | オプティマイザによる推定行数      |
| avgRowSize    | オプティマイザによる推定平均行サイズ    |
| numNodes      | 現在のオペレータが使用するBE数 |
| pushdown agg  | スキャンにプッシュダウンされた集約           |



#### HUDI_SCAN_NODE



| Name                 | デスクリプション                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | スキャン分割数                      |
| totalFileSize        | スキャン対象の総ファイルサイズ              |
| scanRanges           | スキャン分割の情報                 |
| partition            | スキャン対象のパーティション数         |
| backends             | 各BEがスキャンする具体的なデータ情報     |
| cardinality          | オプティマイザによる推定行数      |
| avgRowSize           | オプティマイザによる推定平均行サイズ    |
| numNodes             | 現在のオペレータが使用するBE数 |
| pushdown agg         | スキャンにプッシュダウンされた集約           |
| hudiNativeReadSplits | ネイティブメソッドを使用して読み取られた分割数  |



#### ICEBERG_SCAN_NODE



| Name                     | デスクリプション                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | スキャン分割数                      |
| totalFileSize            | スキャン対象の総ファイルサイズ              |
| scanRanges               | スキャン分割の情報                 |
| partition                | スキャン対象のパーティション数         |
| backends                 | 各BEがスキャンする具体的なデータ情報     |
| cardinality              | オプティマイザによる推定行数      |
| avgRowSize               | オプティマイザによる推定平均行サイズ    |
| numNodes                 | 現在のオペレータが使用するBE数 |
| pushdown agg             | スキャンにプッシュダウンされた集約           |
| icebergPredicatePushdown | iceberg APIにプッシュダウンされたフィルタ         |



#### PAIMON_SCAN_NODE

| Name                   | デスクリプション                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | スキャン分割数                      |
| totalFileSize          | スキャン対象の総ファイルサイズ              |
| scanRanges             | スキャン分割の情報                 |
| partition              | スキャン対象のパーティション数         |
| backends               | 各BEがスキャンする具体的なデータ情報     |
| cardinality            | オプティマイザによる推定行数      |
| avgRowSize             | オプティマイザによる推定平均行サイズ    |
| numNodes               | 現在のオペレータが使用するBE数 |
| pushdown agg           | スキャンにプッシュダウンされた集約           |
| paimonNativeReadSplits | ネイティブメソッドを使用して読み取られた分割数  |


#### NESTED LOOP JOIN



| Name                 | デスクリプション                  |
| :------------------- | :--------------------------- |
| join op              | 結合操作のタイプ       |
| join conjuncts       | 結合の条件       |
| mark join predicates | mark joinで使用される条件 |
| predicates           | 結合後のフィルタ述語 |
| runtime filters      | 生成されるランタイムフィルタ    |
| output slot ids      | 最終出力スロットのリスト   |
| isMarkJoin           | mark joinかどうか    |



#### PartitionTopN



| Name                 | デスクリプション                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | グループ化フィルタ最適化を適用するウィンドウ関数        |
| has global limit     | 行数のグローバル制限の有無             |
| partition limit      | 各パーティション内の行数制限            |
| partition topn phase | 現在のフェーズ: TWO_PHASE_GLOBAL_PTOPNはパーティションキーによるシャッフル後のグローバルフェーズ、TWO_PHASE_LOCAL_PTOPNはパーティションキーによるシャッフル前のローカルフェーズ |



#### REPEAT_NODE



| Name   | デスクリプション                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | 各行の繰り返し回数と集約カラムの対応するslot id |
| exprs  | 繰り返し後の出力データの式のリスト         |



#### DataGenScanNode



| Name                 | デスクリプション         |
| :------------------- | :------------------ |
| table value function | Table関数名 |



#### EsScanNode



| Name              | デスクリプション                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | 結果をソートするカラム    |
| LOCAL_PREDICATES  | Doris内で実行されるフィルタ  |
| REMOTE_PREDICATES | ES内で実行されるフィルタ     |
| ES index/type     | クエリ対象のESインデックスとタイプ |



#### HIVE_SCAN_NODE



| Name          | デスクリプション                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | スキャン分割数                      |
| totalFileSize | スキャン対象の総ファイルサイズ              |
| scanRanges    | スキャン分割の情報                 |
| partition     | スキャン対象のパーティション数         |
| backends      | 各BEがスキャンする具体的なデータ情報     |
| cardinality   | オプティマイザによる推定行数      |
| avgRowSize    | オプティマイザによる推定平均行サイズ    |
| numNodes      | 現在のオペレータが使用するBE数 |
| pushdown agg  | スキャンにプッシュダウンされた集約           |



#### HUDI_SCAN_NODE



| Name                 | デスクリプション                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | スキャン分割数                      |
| totalFileSize        | スキャン対象の総ファイルサイズ              |
| scanRanges           | スキャン分割の情報                 |
| partition            | スキャン対象のパーティション数         |
| backends             | 各BEがスキャンする具体的なデータ情報     |
| cardinality          | オプティマイザによる推定行数      |
| avgRowSize           | オプティマイザによる推定平均行サイズ    |
| numNodes             | 現在のオペレータが使用するBE数 |
| pushdown agg         | スキャンにプッシュダウンされた集約           |
| hudiNativeReadSplits | ネイティブメソッドを使用して読み取られた分割数  |



#### ICEBERG_SCAN_NODE



| Name                     | デスクリプション                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | スキャン分割数                      |
| totalFileSize            | スキャン対象の総ファイルサイズ              |
| scanRanges               | スキャン分割の情報                 |
| partition                | スキャン対象のパーティション数         |
| backends                 | 各BEがスキャンする具体的なデータ情報     |
| cardinality              | オプティマイザによる推定行数      |
| avgRowSize               | オプティマイザによる推定平均行サイズ    |
| numNodes                 | 現在のオペレータが使用するBE数 |
| pushdown agg             | スキャンにプッシュダウンされた集約           |
| icebergPredicatePushdown | iceberg APIにプッシュダウンされたフィルタ         |



#### PAIMON_SCAN_NODE



| Name                   | デスクリプション                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | スキャン分割数                      |
| totalFileSize          | スキャン対象の総ファイルサイズ              |
| scanRanges             | スキャン分割の情報                 |
| partition              | スキャン対象のパーティション数         |
| backends               | 各BEがスキャンする具体的なデータ情報     |
| cardinality            | オプティマイザによる推定行数      |
| avgRowSize             | オプティマイザによる推定平均行サイズ    |
| numNodes               | 現在のオペレータが使用するBE数 |
| pushdown agg           | スキャンにプッシュダウンされた集約           |
| paimonNativeReadSplits | ネイティブメソッドを使用して読み取られた分割数  |

#### JdbcScanNode



| Name  | デスクリプション                  |
| :---- | :--------------------------- |
| TABLE | スキャンするJDBC側のTable名 |
| QUERY | スキャンに使用するクエリ      |



#### OlapScanNode



| Name           | デスクリプション                                                  |
| :------------- | :----------------------------------------------------------- |
| TABLE          | スキャン対象のTable。括弧内はヒットした同期マテリアライズドビューの名前を示す。 |
| SORT INFO      | SCAN事前ソートが計画されている場合に存在。SCAN出力の部分的事前ソートと事前切り詰めを示す。 |
| SORT LIMIT     | SCAN事前ソートが計画されている場合に存在。事前切り詰めの切り詰め長を示す。 |
| TOPN OPT       | TOP-N Runtime Filterが計画されている場合に存在。                |
| PREAGGREGATION | 事前集約が有効かどうかを示す。MOR集約とプライマリキーモデルに関連。ONは、ストレージ層のデータが上位層のニーズを満たし、追加の集約が不要なことを意味する。OFFは追加の集約が実行されることを意味する。 |
| partitions     | 現在スキャンされているパーティション数、総パーティション数、およびスキャン対象のパーティション名のリスト。 |
| tablets        | スキャンされるタブレット数とTable内の総タブレット数。    |
| tabletList     | スキャンされるタブレットのリスト。                                     |
| avgRowSize     | オプティマイザによる推定行サイズ。                         |
| numNodes       | 現在のスキャンに割り当てられたBE数。                  |
| pushAggOp      | zonemapメタデータを読み取ることで結果が返される。MIN、MAX、COUNT集約情報をサポート。 |



#### UNION



| Name           | デスクリプション                                                  |
| :------------- | :----------------------------------------------------------- |
| constant exprs | 出力に含める定数式のリスト。   |
| child exprs    | 子要素の出力をこの式リストを通じてプロジェクションし、集合演算への入力とする。 |



#### EXCEPT



| Name        | デスクリプション                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | 子要素の出力をこの式リストを通じてプロジェクションし、集合演算への入力とする。 |



#### INTERSECT



| Name        | デスクリプション                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | 子要素の出力をこの式リストを通じてプロジェクションし、集合演算への入力とする。 |



#### SORT



| Name     | デスクリプション                          |
| :------- | :----------------------------------- |
| order by | ソートキーと具体的なソート順序。 |



#### TABLE FUNCTION NODE



| Name                  | デスクリプション                                               |
| :-------------------- | :-------------------------------------------------------- |
| table function        | 使用されるTable関数の名前。                          |
| lateral view tuple id | 新しく生成されたカラムに対応するタプルID。        |
| output slot id        | カラムプルーニング後に出力されるカラムのスロットIDのリスト。 |



#### TOP-N



| Name          | デスクリプション                                            |
| :------------ | :----------------------------------------------------- |
| order by      | ソートキーと具体的なソート順序。                   |
| TOPN OPT      | TOP-Nランタイムフィルタ最適化がヒットした場合に存在。 |
| OPT TWO PHASE | TOP-N遅延マテリアライゼーションがヒットした場合に存在。    |
