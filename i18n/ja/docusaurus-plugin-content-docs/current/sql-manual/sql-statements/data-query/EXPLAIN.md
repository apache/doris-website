---
{
    "title": "EXPLAIN",
    "language": "ja",
    "description": "EXPLAIN ステートメントは、指定したクエリに対する Doris のクエリ実行計画を表示します。"
}
---

## 説明

EXPLAIN ステートメントは、指定したクエリに対する Doris のクエリ実行計画を表示します。Doris のクエリオプティマイザは、統計データ、データの特性、HASH JOIN、パーティショニング、バケット分割などを利用して効率的な計画を作成しようとします。ただし、理論上および実装上の制約により、計画の性能が十分でない場合もあります。

性能を改善するには、現在の実行計画を分析することが重要です。このページでは、最適化のために EXPLAIN ステートメントを使用する方法を説明します。



## 構文

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```

## 必須パラメータ

**<query_block>**

> 実行計画を確認する対象のクエリ文です。

## オプションパラメータ

**[VERBOSE]**

> `VERBOSE` の指定によって、詳細情報を表示するかどうかが決まります。`VERBOSE` を指定すると、各オペレータの詳細、使用するタプル ID、各タプルの詳細な説明などが表示されます。指定しない場合は、簡潔な情報が表示されます。


## 戻り値

### 基本概念

`EXPLAIN` が表示する情報を理解するために、Doris の実行計画に関する基本概念を説明します。

| 名称 | 説明 |
| :-------- | :----------------------------------------------------------- |
| PLAN | 実行計画。実行プランナがクエリを実行計画に変換し、実行エンジンがその計画を実行します。 |
| FRAGMENT | 実行フラグメント。Doris は分散実行エンジンであるため、完全な実行計画は複数の単一ノード実行フラグメントに分割されます。FRAGMENT テーブルは、完全な単一ノード実行フラグメントを表します。複数の FRAGMENT が組み合わさって完全な PLAN を構成します。 |
| PLAN NODE | オペレータ。実行計画の最小単位です。FRAGMENT は複数のオペレータで構成されます。各オペレータは、集約や結合などの特定の実行処理を担当します。 |

### 結果の構造

Doris の `EXPLAIN` ステートメントは、完全な PLAN を結果として返します。PLAN 内の FRAGMENT は、実行順序に対して後ろから前の順に並びます。各 FRAGMENT 内のオペレータ（PLAN NODE）も、実行順序に対して後ろから前の順に並びます。

次に例を示します。


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

オペレータとその子ノードは破線で結ばれます。オペレータに複数の子がある場合、子は縦に並び、右から左への順序を表します。上の例では、オペレータ 6（VHASH JOIN）の左の子はオペレータ 5（EXCHANGE）、右の子はオペレータ 4（EXCHANGE）です。


### Fragment のフィールドの説明


| 名称 | 説明 |
| :----------------- | :----------------------------------------------------------- |
| PARTITION | 現在の Fragment のデータ分散を表示します。 |
| HAS_COLO_PLAN_NODE | Fragment にコロケーションオペレータが含まれるかどうかを示します。 |
| Sink | Fragment のデータ出力方法です。詳細は次の表を参照してください。 |



**Sink の種類**



| 名称 | 説明 |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK | 次の Fragment にデータを出力します。次の二行の情報が含まれます。<br />一行目: データの送信先となる下流の EXCHANGE NODE。<br />二行目: データの分散方法。<br />  - UNPARTITIONED は、下流の各インスタンスがデータセット全体を受け取ることを意味します。通常、ブロードキャスト結合や、グローバルな limit や order by など単一インスタンスでの処理が必要な場合に使用されます。<br /> - RANDOM は、下流の各インスタンスが重複のないランダムなデータの一部を受け取ることを意味します。<br /> - HASH_PARTITIONED は、記載されたスロットをキーとしてハッシュ計算し、データを分割して同じ下流インスタンスに送ります。多くの場合、パーティションハッシュ結合の上流や、二段階集約の第二段階で使用されます。 |
| RESULT SINK | 結果データを FE に送信します。一行目はデータ転送に使用するプロトコルを示します。現在は MySQL と arrow のプロトコルに対応しています。 |
| OLAP TABLE SINK | OLAP テーブルにデータを書き込みます。 |
| MultiCastDataSinks | 複数の STREAM DATA SINK を含むマルチキャストオペレータです。各 STREAM DATA SINK は、データセット全体をそれぞれの下流に送ります。 |



### タプル情報の説明

VERBOSE モードでは、タプル情報が出力されます。タプル情報には、データの行に含まれる SLOT の型や NULL 許容の有無など、各 SLOT の詳細が記載されます。

出力には複数の TupleDescriptor が含まれ、各 TupleDescriptor には複数の SlotDescriptor が含まれます。次に例を示します。

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
```

#### TupleDescriptor



| 名称 | 説明 |
| :--- | :----------------------------------------------------------- |
| id | タプル記述子の ID です。 |
| tbl | タプルに対応するテーブルです。該当しない場合は `null` です。 |



#### SlotDescriptor

| 名称 | 説明 |
| :-------------- | :----------------------------------------------------------- |
| id | スロット記述子の ID です。 |
| col | スロットに対応するカラムです。該当しない場合は空欄です。 |
| colUniqueId | 対応するカラムの一意の ID です。該当しない場合は -1 です。 |
| type | スロットの型です。 |
| nullable | 対応するデータが NULL を取れるかどうかを示します。 |
| isAutoIncrement | カラムが自動インクリメントされるかどうかを示します。 |
| subColPath | カラム内のサブカラムのパスです。現在は variant 型にのみ適用されます。 |

### オペレータの説明

#### オペレータ一覧

| 名称 | 説明 |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE | 集約オペレータです。 |
| ANALYTIC | ウィンドウ関数オペレータです。 |
| ASSERT NUMBER OF ROWS | 下流の出力行数を確認するオペレータです。 |
| EXCHANGE | データ交換の受信オペレータです。 |
| MERGING-EXCHANGE | ソートと行数制限の機能を持つデータ交換の受信オペレータです。 |
| HASH JOIN | ハッシュ結合オペレータです。 |
| NESTED LOOP JOIN | ネストループ結合オペレータです。 |
| PartitionTopN | パーティション内のデータを事前にフィルタリングするオペレータです。 |
| REPEAT_NODE | データ複製オペレータです。 |
| DataGenScanNode | テーブル値関数オペレータです。 |
| EsScanNode | ES テーブルのスキャンオペレータです。 |
| HIVE_SCAN_NODE | Hive テーブルのスキャンオペレータです。 |
| HUDI_SCAN_NODE | Hudi テーブルのスキャンオペレータです。 |
| ICEBERG_SCAN_NODE | Iceberg テーブルのスキャンオペレータです。 |
| PAIMON_SCAN_NODE | Paimon テーブルのスキャンオペレータです。 |
| JdbcScanNode | Jdbc テーブルのスキャンオペレータです。 |
| OlapScanNode | Olap テーブルのスキャンオペレータです。 |
| SELECT | フィルタリングオペレータです。 |
| UNION | 集合の和を求めるオペレータです。 |
| EXCEPT | 集合の差を求めるオペレータです。 |
| INTERSECT | 集合の共通部分を求めるオペレータです。 |
| SORT | ソートオペレータです。 |
| TOP-N | ソートして上位 N 件の結果を返すオペレータです。 |
| TABLE FUNCTION NODE | テーブル関数オペレータ（lateral view）です。 |



#### 共通フィールド



| 名称 | 説明 |
| :---------------------- | :----------------------------------------------------------- |
| limit | 出力行数を制限します。 |
| offset | 出力前にスキップする行数です。 |
| conjuncts | 現在のノードの結果をフィルタリングします。projections より前に実行されます。 |
| projections | 現在のオペレータの後に行う射影処理です。conjuncts の後に実行されます。 |
| project output tuple id | 射影後の出力タプルです。データタプル内のスロット配置は tuple desc で確認できます。 |
| cardinality | オプティマイザが推定した行数です。 |
| distribute expr lists | 現在のノードの子ノードにおける元のデータ分散方法です。 |
| Expression's slot id | スロット ID に対応する具体的なスロットは、verbose モードのタプル一覧で確認できます。この一覧にはスロットの型や NULL 許容属性などの情報が含まれます。式の後に `[#5]` のように表示されます。 |



#### AGGREGATE



| 名称 | 説明 |
| :------------------ | :----------------------------------------------------------- |
| (Aggregation Phase) | 集約フェーズは二つの用語で表されます。<br />一つ目は update（ローカル集約）または merge（グローバル集約）です。<br />二つ目は、現在のデータがシリアライズされている（serialize）か、最終計算が完了している（finalize）かを示します。 |
| STREAMING | 多段階集約の打ち切りにおけるローカル集約オペレータだけが持つフラグです。現在の集約ノードが STREAMING モードを使用し、実際の計算を行わずに入力データを次の集約段階へ直接渡す場合があることを示します。 |
| output | 現在の集約オペレータの出力です。ローカル事前集約のすべての関数には partial という接頭辞が付きます。 |
| group by | 集約キーです。 |



#### ANALYTIC



| 名称 | 説明 |
| :----------- | :----------------------------------------------------------- |
| functions | 現在のウィンドウ関数の名前です。 |
| partition by | ウィンドウ関数の over 句にある partition by 句に対応します。ウィンドウの分割式です。 |
| order by | ウィンドウ内のソート式と順序です。 |
| window | ウィンドウの範囲です。 |



#### ASSERT NUMBER OF ROWS



| 名称 | 説明 |
| :--- | :--------------------------------------------------------- |
| EQ | 下流の出力は、この行数制約に一致する必要があります。 |



#### HASH JOIN



| 名称 | 説明 |
| :-------------------- | :----------------------------------------------------------- |
| join op | 結合の種類です。 |
| equal join conjunct | 結合条件内の等価条件です。 |
| other join predicates | 結合条件のうち、等価条件以外の条件です。 |
| mark join predicates | マーク結合で使用する条件です。 |
| other predicates | 結合の実行後に適用するフィルタ述語です。 |
| runtime filters | 生成されたランタイムフィルタです。 |
| output slot ids | 最終出力スロットの一覧です。 |
| hash output slot ids | ハッシュ結合の実行後、ほかの結合条件を適用する前の出力スロットの一覧です。 |
| isMarkJoin | マーク結合かどうかを示します。 |


#### NESTED LOOP JOIN



| 名称 | 説明 |
| :------------------- | :--------------------------- |
| join op | 結合処理の種類です。 |
| join conjuncts | 結合に使用する条件です。 |
| mark join predicates | マーク結合で使用する条件です。 |
| predicates | 結合後に適用するフィルタ述語です。 |
| runtime filters | 生成されたランタイムフィルタです。 |
| output slot ids | 最終出力スロットの一覧です。 |
| isMarkJoin | マーク結合かどうかを示します。 |



#### PartitionTopN



| 名称 | 説明 |
| :------------------- | :----------------------------------------------------------- |
| functions | グループ化されたフィルタの最適化を適用するウィンドウ関数です。 |
| has global limit | 全体の行数制限の有無です。 |
| partition limit | 各パーティション内の行数制限です。 |
| partition topn phase | 現在のフェーズです。TWO_PHASE_GLOBAL_PTOPN はパーティションキーによるシャッフル後のグローバルフェーズ、TWO_PHASE_LOCAL_PTOPN はシャッフル前のローカルフェーズを表します。 |



#### REPEAT_NODE



| 名称 | 説明 |
| :----- | :----------------------------------------------------------- |
| repeat | 各行の繰り返し回数と、集約カラムに対応するスロット ID です。 |
| exprs | 繰り返し後の出力データの式の一覧です。 |



#### DataGenScanNode



| 名称 | 説明 |
| :------------------- | :------------------ |
| table value function | テーブル関数の名前です。 |



#### EsScanNode



| 名称 | 説明 |
| :---------------- | :----------------------------- |
| SORT COLUMN | 結果のソートに使用するカラムです。 |
| LOCAL_PREDICATES | Doris 内で実行されるフィルタです。 |
| REMOTE_PREDICATES | ES 内で実行されるフィルタです。 |
| ES index/type | クエリ対象の ES のインデックスと型です。 |



#### HIVE_SCAN_NODE



| 名称 | 説明 |
| :------------ | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |



#### HUDI_SCAN_NODE



| 名称 | 説明 |
| :------------------- | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |
| hudiNativeReadSplits | ネイティブ方式で読み取る分割の数です。 |



#### ICEBERG_SCAN_NODE



| 名称 | 説明 |
| :----------------------- | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |
| icebergPredicatePushdown | iceberg API にプッシュダウンされるフィルタです。 |



#### PAIMON_SCAN_NODE

| 名称 | 説明 |
| :--------------------- | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |
| paimonNativeReadSplits | ネイティブ方式で読み取る分割の数です。 |


#### NESTED LOOP JOIN



| 名称 | 説明 |
| :------------------- | :--------------------------- |
| join op | 結合処理の種類です。 |
| join conjuncts | 結合に使用する条件です。 |
| mark join predicates | マーク結合で使用する条件です。 |
| predicates | 結合後に適用するフィルタ述語です。 |
| runtime filters | 生成されたランタイムフィルタです。 |
| output slot ids | 最終出力スロットの一覧です。 |
| isMarkJoin | マーク結合かどうかを示します。 |



#### PartitionTopN



| 名称 | 説明 |
| :------------------- | :----------------------------------------------------------- |
| functions | グループ化されたフィルタの最適化を適用するウィンドウ関数です。 |
| has global limit | 全体の行数制限の有無です。 |
| partition limit | 各パーティション内の行数制限です。 |
| partition topn phase | 現在のフェーズです。TWO_PHASE_GLOBAL_PTOPN はパーティションキーによるシャッフル後のグローバルフェーズ、TWO_PHASE_LOCAL_PTOPN はシャッフル前のローカルフェーズを表します。 |



#### REPEAT_NODE



| 名称 | 説明 |
| :----- | :----------------------------------------------------------- |
| repeat | 各行の繰り返し回数と、集約カラムに対応するスロット ID です。 |
| exprs | 繰り返し後の出力データの式の一覧です。 |



#### DataGenScanNode



| 名称 | 説明 |
| :------------------- | :------------------ |
| table value function | テーブル関数の名前です。 |



#### EsScanNode



| 名称 | 説明 |
| :---------------- | :----------------------------- |
| SORT COLUMN | 結果のソートに使用するカラムです。 |
| LOCAL_PREDICATES | Doris 内で実行されるフィルタです。 |
| REMOTE_PREDICATES | ES 内で実行されるフィルタです。 |
| ES index/type | クエリ対象の ES のインデックスと型です。 |



#### HIVE_SCAN_NODE



| 名称 | 説明 |
| :------------ | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |



#### HUDI_SCAN_NODE



| 名称 | 説明 |
| :------------------- | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |
| hudiNativeReadSplits | ネイティブ方式で読み取る分割の数です。 |



#### ICEBERG_SCAN_NODE



| 名称 | 説明 |
| :----------------------- | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |
| icebergPredicatePushdown | iceberg API にプッシュダウンされるフィルタです。 |



#### PAIMON_SCAN_NODE



| 名称 | 説明 |
| :--------------------- | :----------------------------------------- |
| inputSplitNum | スキャン分割の数です。 |
| totalFileSize | スキャン対象ファイルの合計サイズです。 |
| scanRanges | スキャン分割に関する情報です。 |
| partition | スキャン対象のパーティション数です。 |
| backends | 各 BE がスキャンするデータの詳細情報です。 |
| cardinality | オプティマイザが推定した行数です。 |
| avgRowSize | オプティマイザが推定した平均行サイズです。 |
| numNodes | 現在のオペレータで使用する BE の数です。 |
| pushdown agg | スキャンにプッシュダウンされる集約です。 |
| paimonNativeReadSplits | ネイティブ方式で読み取る分割の数です。 |

#### JdbcScanNode



| 名称 | 説明 |
| :---- | :--------------------------- |
| TABLE | スキャンする JDBC 側のテーブル名です。 |
| QUERY | スキャンに使用するクエリです。 |



#### OlapScanNode



| 名称 | 説明 |
| :------------- | :----------------------------------------------------------- |
| TABLE | スキャン対象のテーブルです。括弧内は、適合した同期マテリアライズドビューの名前を示します。 |
| SORT INFO | SCAN の事前ソートが計画されている場合に表示されます。SCAN 出力の部分的な事前ソートと事前切り詰めを示します。 |
| SORT LIMIT | SCAN の事前ソートが計画されている場合に表示されます。事前切り詰めの長さを示します。 |
| TOPN OPT | TOP-N Runtime Filter が計画されている場合に表示されます。 |
| PREAGGREGATION | 事前集約が有効かどうかを示します。MOR 集約モデルと主キーモデルに関係します。ON は、ストレージ層のデータが追加の集約なしで上位層の要件を満たすことを意味します。OFF は、追加の集約が実行されることを意味します。 |
| partitions | 現在スキャンしているパーティション数、パーティションの総数、スキャン対象のパーティション名の一覧です。 |
| tablets | スキャン対象の tablet 数と、テーブル内の tablet の総数です。 |
| tabletList | スキャン対象の tablet の一覧です。 |
| avgRowSize | オプティマイザが推定した行サイズです。 |
| numNodes | 現在のスキャンに割り当てられた BE の数です。 |
| pushAggOp | zonemap メタデータを読み取って結果を返します。MIN、MAX、COUNT の集約情報に対応します。 |



#### UNION



| 名称 | 説明 |
| :------------- | :----------------------------------------------------------- |
| constant exprs | 出力に含める定数式の一覧です。 |
| child exprs | この式の一覧を通して子ノードの出力を射影し、集合演算子への入力とします。 |



#### EXCEPT



| 名称 | 説明 |
| :---------- | :----------------------------------------------------------- |
| child exprs | この式の一覧を通して子ノードの出力を射影し、集合演算子への入力とします。 |



#### INTERSECT



| 名称 | 説明 |
| :---------- | :----------------------------------------------------------- |
| child exprs | この式の一覧を通して子ノードの出力を射影し、集合演算子への入力とします。 |



#### SORT



| 名称 | 説明 |
| :------- | :----------------------------------- |
| order by | ソートキーと具体的なソート順です。 |



#### TABLE FUNCTION NODE



| 名称 | 説明 |
| :-------------------- | :-------------------------------------------------------- |
| table function | 使用するテーブル関数の名前です。 |
| lateral view tuple id | 新たに生成されたカラムに対応するタプル ID です。 |
| output slot id | カラムプルーニング後に出力されるカラムのスロット ID の一覧です。 |



#### TOP-N



| 名称 | 説明 |
| :------------ | :----------------------------------------------------- |
| order by | ソートキーと具体的なソート順です。 |
| TOPN OPT | TOP-N ランタイムフィルタの最適化が適用される場合に表示されます。 |
| OPT TWO PHASE | TOP-N の遅延マテリアライズが適用される場合に表示されます。 |
