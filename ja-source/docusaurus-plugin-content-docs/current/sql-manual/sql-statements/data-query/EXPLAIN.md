---
{
  "title": "説明",
  "language": "ja",
  "description": "EXPLAIN文は、指定されたクエリに対するDorisのクエリ実行計画を表示します。"
}
---
## 説明

EXPLAIN文は、指定されたクエリに対するDorisのクエリ実行計画を表示します。Dorisのクエリオプティマイザーは、統計データ、データ特性、およびHASH JOIN、パーティション分割、バケット分割などの機能を使用して効率的な計画を作成することを目的としています。しかし、理論的および実用的な制約により、計画のパフォーマンスが低下する場合があります。

パフォーマンスを向上させるには、現在の計画を分析することが不可欠です。この記事では、最適化のためにEXPLAIN文を使用する方法について説明します。



## 構文

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```
## 必須パラメータ

**<query_block>**

> これは、実行計画を取得したいクエリ文です。

## オプションパラメータ

**[VERBOSE]**

> 詳細情報を表示するかどうかは、`VERBOSE`指定によって決まります。`VERBOSE`を指定すると、各オペレータの詳細、それらが使用するタプルID、および各タプルの詳細な説明を含む包括的な詳細が表示されます。指定しない場合は、簡潔な情報が提供されます。


## 戻り値

### 基本概念

`EXPLAIN`で表示される情報をより良く理解するために、Doris実行計画のいくつかの中核概念を紹介します。

| 名前      | 説明                                                  |
| :-------- | :----------------------------------------------------------- |
| PLAN      | 実行計画。クエリは実行プランナーによって実行計画に変換され、その後実行エンジンによって実行されます。 |
| FRAGMENT  | 実行フラグメント。Dorisは分散実行エンジンであるため、完全な実行計画は複数の単一ノード実行フラグメントに分割されます。FRAGMENTテーブルは完全な単一ノード実行フラグメントを表します。複数のFRAGMENTが組み合わさって完全なPLANを形成します。 |
| PLAN NODE | オペレータ。実行計画の最小単位。FRAGMENTは複数のオペレータで構成されます。各オペレータは、集約、結合などの特定の実行ロジックを担当します。 |

### 戻り値の構造

Doris `EXPLAIN`文の結果は完全なPLANです。PLAN内では、FRAGMENTは実行順序に基づいて後ろから前に並べられます。各FRAGMENT内では、オペレータ（PLAN NODES）も実行順序に基づいて後ろから前に並べられます。

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
オペレーターは破線で子ノードに接続されます。オペレーターが複数の子を持つ場合、それらは垂直に配置され、右から左への順序を表します。上記の例では、オペレーター6（VHASH JOIN）は、オペレーター5（EXCHANGE）を左の子として、オペレーター4（EXCHANGE）を右の子として持ちます。


### Fragment フィールドの説明


| Name               | Description                                                  |
| :----------------- | :----------------------------------------------------------- |
| PARTITION          | 現在のFragmentのデータ分散を表示します                        |
| HAS_COLO_PLAN_NODE | fragmentがcolocateオペレーターを含んでいるかどうかを示します     |
| Sink               | fragmentデータ出力の方法、詳細は下記の表を参照してください        |



**Sink メソッド**



| Name               | Description                                                  |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | 次のFragmentにデータを出力します。2行の情報が含まれます。<br />1行目：データが送信される下流のEXCHANGE NODE。<br />2行目：データ分散の方法。<br />  - UNPARTITIONEDは、各下流インスタンスが完全なデータセットを受信することを意味します。これは通常、broadcast joinや、global limitやorder byなどの単一インスタンスロジックが必要な場合に発生します。<br /> - RANDOMは、各下流インスタンスが重複のないランダムなデータサブセットを受信することを意味します。<br /> - HASH_PARTITIONEDは、リストされたslotをキーとして使用してハッシュ化し、データシャードを同じ下流インスタンスに送信します。これは、partition hash joinの上流や2段階集計の第2段階でよく使用されます。 |
| RESULT SINK        | 結果データをFEに送信します。1行目はデータ送信に使用されるプロトコルを示し、現在はMySQLとarrowプロトコルをサポートしています。 |
| OLAP TABLE SINK    | OLAPテーブルにデータを書き込みます。                           |
| MultiCastDataSinks | 複数のSTREAM DATA SINKを含むマルチキャストオペレーターです。各STREAM DATA SINKは、完全なデータセットをその下流に送信します。 |



### Tuple 情報の説明

VERBOSEモードを使用する場合、Tuple情報が出力されます。Tuple情報は、SLOT型、null許可ステータスなどを含む、データ行内のSLOTの詳細を記述します。

出力には複数のTupleDescriptorが含まれ、それぞれに複数のSlotDescriptorが含まれます。例を以下に示します：

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
```
#### TupleDescriptor

| Name | Description                                                  |
| :--- | :----------------------------------------------------------- |
| id   | タプル記述子のid                               |
| tbl  | タプルに対応するテーブル、または該当しない場合は`null`  |

#### SlotDescriptor

| Name            | Description                                                  |
| :-------------- | :----------------------------------------------------------- |
| id              | スロット記述子のid                                |
| col             | スロットに対応するカラム、または該当しない場合は空白 |
| colUniqueId     | 対応するカラムのユニークid、または該当しない場合は-1 |
| type            | スロットの型                                         |
| nullable        | 対応するデータがnullになり得るかを示す              |
| isAutoIncrement | カラムが自動インクリメントかどうかを示す                  |
| subColPath      | カラム内のサブカラムパス、現在はvariant型のみに適用 |

### オペレーター説明

#### オペレーターリスト

| Name                  | Description                                                  |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE             | 集約オペレーター                                         |
| ANALYTIC              | ウィンドウ関数オペレーター                                     |
| ASSERT NUMBER OF ROWS | 下流出力行数をチェックするオペレーター       |
| EXCHANGE              | データ交換受信オペレーター                              |
| MERGING-EXCHANGE      | ソートと行制限機能を持つデータ交換受信オペレーター |
| HASH JOIN             | ハッシュ結合オペレーター                                           |
| NESTED LOOP JOIN      | ネストループ結合オペレーター                                    |
| PartitionTopN         | パーティション内データ事前フィルタリングオペレーター                  |
| REPEAT_NODE           | データ複製オペレーター                                    |
| DataGenScanNode       | テーブル値関数オペレーター                               |
| EsScanNode            | ESテーブルスキャンオペレーター                                       |
| HIVE_SCAN_NODE        | Hiveテーブルスキャンオペレーター                                     |
| HUDI_SCAN_NODE        | Hudiテーブルスキャンオペレーター                                  |
| ICEBERG_SCAN_NODE     | Icebergテーブルスキャンオペレーター                                  |
| PAIMON_SCAN_NODE      | Paimonテーブルスキャンオペレーター                                   |
| JdbcScanNode          | Jdbcテーブルスキャンオペレーター                                     |
| OlapScanNode          | Olapテーブルスキャンオペレーター                                     |
| SELECT                | フィルタリングオペレーター                                           |
| UNION                 | 集合和集合オペレーター                                           |
| EXCEPT                | 集合差集合オペレーター                                      |
| INTERSECT             | 集合積集合オペレーター                                    |
| SORT                  | ソートオペレーター                                             |
| TOP-N                 | ソートして上位N件を返すオペレーター                       |
| TABLE FUNCTION NODE   | テーブル関数オペレーター (lateral view)                       |

#### 共通フィールド

| Name                    | Description                                                  |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | 出力行数を制限                             |
| offset                  | 出力前にスキップする行数                     |
| conjuncts               | 現在のノードの結果をフィルタリング。プロジェクション前に実行。 |
| projections             | 現在のオペレーター後のプロジェクション操作。conjuncts後に実行。 |
| project output tuple id | プロジェクション後の出力タプル。データタプル内のスロット配置はtuple descで確認可能。 |
| cardinality             | オプティマイザーによる推定行数                         |
| distribute expr lists   | 現在のノードの子ノード向けの元データ分散方法 |
| Expression's slot id    | スロットidに対応する具体的スロットはverboseモードのタプルリストで確認可能。このリストはスロット型やnullable属性などの情報を提供。式の後に`[#5]`として表現される。 |

#### AGGREGATE

| Name                | Description                                                  |
| :------------------ | :----------------------------------------------------------- |
| (Aggregation Phase) | 集約フェーズは2つの項で表現される。<br />最初の項はupdate（ローカル集約）またはmerge（グローバル集約）。<br />2番目の項は現在のデータがシリアル化（serialize）されているか最終計算が完了（finalize）しているかを示す。 |
| STREAMING           | 多段階集約トランケーションのローカル集約オペレーターのみがこのフラグを持つ。現在の集約ノードがSTREAMINGモードを使用する可能性があることを示し、入力データは実際の計算なしで直接次段階の集約に渡される。 |
| output              | 現在の集約オペレーターの出力。すべてのローカル事前集約関数にはpartialのプレフィックスが付く。 |
| group by            | 集約のキー                                      |

#### ANALYTIC

| Name         | Description                                                  |
| :----------- | :----------------------------------------------------------- |
| functions    | 現在のウィンドウ関数の名前                      |
| partition by | ウィンドウ関数のover句のpartition by句に対応。ウィンドウ化式。 |
| order by     | ウィンドウ内のソート式と順序               |
| window       | ウィンドウ範囲                                                 |

#### ASSERT NUMBER OF ROWS

| Name | Description                                                |
| :--- | :--------------------------------------------------------- |
| EQ   | 下流出力はこの行数制約に一致する必要がある |

#### HASH JOIN

| Name                  | Description                                                  |
| :-------------------- | :----------------------------------------------------------- |
| join op               | 結合の種類                                                 |
| equal join conjunct   | 結合条件内の等価条件                     |
| other join predicates | 結合条件内の条件（等価条件を除く）         |
| mark join predicates  | mark joinで使用される条件                 |
| other predicates      | 結合実行後のフィルタリング述語                    |
| runtime filters       | 生成されたランタイムフィルター                                    |
| output slot ids       | 最終出力スロットのリスト                                   |
| hash output slot ids  | ハッシュ結合実行後だが他の結合条件が適用される前の出力スロットのリスト |
| isMarkJoin            | mark joinかどうかを示す                          |

#### NESTED LOOP JOIN

| Name                 | Description                  |
| :------------------- | :--------------------------- |
| join op              | 結合操作の種類       |
| join conjuncts       | 結合の条件       |
| mark join predicates | mark joinで使用される条件 |
| predicates           | 結合後のフィルター述語 |
| runtime filters      | 生成されたランタイムフィルター    |
| output slot ids      | 最終出力スロットのリスト   |
| isMarkJoin           | mark joinかどうか    |

#### PartitionTopN

| Name                 | Description                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | グループ化フィルター最適化を適用するウィンドウ関数        |
| has global limit     | 行数のグローバル制限の有無             |
| partition limit      | 各パーティション内の行数制限            |
| partition topn phase | 現在のフェーズ：パーティションキーでシャッフル後のグローバルフェーズはTWO_PHASE_GLOBAL_PTOPN、パーティションキーでシャッフル前のローカルフェーズはTWO_PHASE_LOCAL_PTOPN |

#### REPEAT_NODE

| Name   | Description                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | 各行の繰り返し回数と集約カラムに対応するスロットid |
| exprs  | 繰り返し後の出力データの式のリスト         |

#### DataGenScanNode

| Name                 | Description         |
| :------------------- | :------------------ |
| table value function | テーブル関数名 |

#### EsScanNode

| Name              | Description                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | 結果ソートのカラム    |
| LOCAL_PREDICATES  | Doris内で実行されるフィルター  |
| REMOTE_PREDICATES | ES内で実行されるフィルター     |
| ES index/type     | クエリ用のESインデックスと型 |

#### HIVE_SCAN_NODE

| Name          | Description                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | スキャンスプリット数                      |
| totalFileSize | スキャン中の総ファイルサイズ              |
| scanRanges    | スキャンスプリットの情報                 |
| partition     | スキャン中のパーティション数         |
| backends      | 各BEがスキャンする具体的なデータ情報     |
| cardinality   | オプティマイザーによる推定行数      |
| avgRowSize    | オプティマイザーによる推定平均行サイズ    |
| numNodes      | 現在のオペレーターが使用するBE数 |
| pushdown agg  | スキャンにプッシュダウンされた集約           |

#### HUDI_SCAN_NODE

| Name                 | Description                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | スキャンスプリット数                      |
| totalFileSize        | スキャン中の総ファイルサイズ              |
| scanRanges           | スキャンスプリットの情報                 |
| partition            | スキャン中のパーティション数         |
| backends             | 各BEがスキャンする具体的なデータ情報     |
| cardinality          | オプティマイザーによる推定行数      |
| avgRowSize           | オプティマイザーによる推定平均行サイズ    |
| numNodes             | 現在のオペレーターが使用するBE数 |
| pushdown agg         | スキャンにプッシュダウンされた集約           |
| hudiNativeReadSplits | ネイティブ方式で読み込まれるスプリット数  |

#### ICEBERG_SCAN_NODE

| Name                     | Description                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | スキャンスプリット数                      |
| totalFileSize            | スキャン中の総ファイルサイズ              |
| scanRanges               | スキャンスプリットの情報                 |
| partition                | スキャン中のパーティション数         |
| backends                 | 各BEがスキャンする具体的なデータ情報     |
| cardinality              | オプティマイザーによる推定行数      |
| avgRowSize               | オプティマイザーによる推定平均行サイズ    |
| numNodes                 | 現在のオペレーターが使用するBE数 |
| pushdown agg             | スキャンにプッシュダウンされた集約           |
| icebergPredicatePushdown | iceberg APIにプッシュダウンされたフィルター         |

#### PAIMON_SCAN_NODE

| Name                   | Description                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | スキャンスプリット数                      |
| totalFileSize          | スキャン中の総ファイルサイズ              |
| scanRanges             | スキャンスプリットの情報                 |
| partition              | スキャン中のパーティション数         |
| backends               | 各BEがスキャンする具体的なデータ情報     |
| cardinality            | オプティマイザーによる推定行数      |
| avgRowSize             | オプティマイザーによる推定平均行サイズ    |
| numNodes               | 現在のオペレーターが使用するBE数 |
| pushdown agg           | スキャンにプッシュダウンされた集約           |
| paimonNativeReadSplits | ネイティブ方式で読み込まれるスプリット数  |

#### JdbcScanNode

| Name  | Description                  |
| :---- | :--------------------------- |
| TABLE | スキャンするJDBC側のテーブル名 |
| QUERY | スキャンに使用されるクエリ      |

#### OlapScanNode

| Name           | Description                                                  |
| :------------- | :----------------------------------------------------------- |
| TABLE          | スキャンされるテーブル。括弧内はヒットした同期マテリアライズドビューの名前を示す。 |
| SORT INFO      | SCANの事前ソートが計画されている場合に表示。SCAN出力の部分的事前ソートと事前トランケーションを示す。 |
| SORT LIMIT     | SCANの事前ソートが計画されている場合に表示。事前トランケーションのトランケーション長を示す。 |
| TOPN OPT       | TOP-N Runtime Filterが計画されている場合に表示。                |
| PREAGGREGATION | 事前集約が有効かどうかを示す。MOR集約と主キーモデルに関連。ONはストレージレイヤーのデータが上位レイヤーのニーズを追加集約なしで満たすことを意味する。OFFは追加集約が実行されることを意味する。 |
| partitions     | 現在スキャンされるパーティション数、総パーティション数、スキャンされるパーティション名のリスト。 |
| tablets        | スキャンされるタブレット数とテーブル内の総タブレット数。    |
| tabletList     | スキャンされるタブレットのリスト。                                     |
| avgRowSize     | オプティマイザーによる推定行サイズ。                         |
| numNodes       | 現在のスキャンに割り当てられたBE数。                  |
| pushAggOp      | zonemapメタデータを読み込んで結果を返す。MIN、MAX、COUNT集約情報をサポート。 |

#### UNION

| Name           | Description                                                  |
| :------------- | :----------------------------------------------------------- |
| constant exprs | 出力に含まれる定数式のリスト。   |
| child exprs    | この式のリストを通してプロジェクションされた子の出力を集合オペレーターへの入力とする。 |

#### EXCEPT

| Name        | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | この式のリストを通してプロジェクションされた子の出力を集合オペレーターへの入力とする。 |

#### INTERSECT

| Name        | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | この式のリストを通してプロジェクションされた子の出力を集合オペレーターへの入力とする。 |

#### SORT

| Name     | Description                          |
| :------- | :----------------------------------- |
| order by | ソートキーと具体的なソート順序。 |

#### TABLE FUNCTION NODE

| Name                  | Description                                               |
| :-------------------- | :-------------------------------------------------------- |
| table function        | 使用されるテーブル関数の名前。                          |
| lateral view tuple id | 新たに生成されたカラムに対応するタプルID。        |
| output slot id        | カラムプルーニング後に出力されるカラムのスロットIDのリスト。 |

#### TOP-N

| Name          | Description                                            |
| :------------ | :----------------------------------------------------- |
| order by      | ソートキーと具体的なソート順序。                   |
| TOPN OPT      | TOP-Nランタイムフィルター最適化がヒットした場合に表示。 |
| OPT TWO PHASE | TOP-N遅延マテリアライゼーションがヒットした場合に表示。    |
