---
{
  "title": "EXPLAIN",
  "description": "EXPLAIN文は、指定されたクエリに対するDorisのクエリ実行プランを表示します。",
  "language": "ja"
}
---
## 説明

EXPLAINステートメントは、指定されたクエリに対するDorisのクエリ実行プランを表示します。Dorisのクエリオプティマイザーは、統計データ、データ特性、およびHASH JOIN、パーティショニング、バケッティングなどの機能を使用して効率的なプランを作成することを目的としています。しかし、理論的および実践的な制約により、プランのパフォーマンスが期待を下回る場合があります。

パフォーマンスを向上させるためには、現在のプランを分析することが不可欠です。この記事では、最適化のためのEXPLAINステートメントの使用方法を説明します。



## 構文

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```
## 必須パラメーター

**<query_block>**

> これは実行プランを取得したいクエリステートメントです。

## オプションパラメーター

**[VERBOSE]**

> 詳細情報を表示するかどうかは`VERBOSE`指定によって決まります。`VERBOSE`を指定すると、各オペレーターの詳細、使用するtuple ID、各tupleの詳細な説明を含む包括的な詳細が表示されます。指定しない場合は、簡潔な情報が提供されます。


## 戻り値

### 基本概念

`EXPLAIN`で表示される情報をより理解するために、Doris実行プランのいくつかの中核概念を紹介します。

| 名前      | 説明                                                  |
| :-------- | :----------------------------------------------------------- |
| PLAN      | 実行プラン。クエリは実行プランナーによって実行プランに変換され、実行エンジンによって実行されます。 |
| FRAGMENT  | 実行フラグメント。Dorisは分散実行エンジンであるため、完全な実行プランは複数の単一ノード実行フラグメントに分割されます。FRAGMENTTableは完全な単一ノード実行フラグメントを表します。複数のFRAGMENTが組み合わされて完全なPLANを形成します。 |
| PLAN NODE | オペレーター。実行プランの最小単位。FRAGMENTは複数のオペレーターで構成されます。各オペレーターは集約、結合などの特定の実行ロジックを担当します。 |

### 戻り値の構造

Doris `EXPLAIN`ステートメントの結果は完全なPLANです。PLAN内では、FRAGMENTは実行順序に基づいて後ろから前へ順序付けされます。各FRAGMENT内では、オペレーター（PLAN NODES）も実行順序に基づいて後ろから前へ順序付けされます。

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
オペレータは破線で子ノードとリンクされています。オペレータが複数の子を持つ場合、それらは垂直に配置され、右から左への順序を表します。上記の例では、オペレータ6（VHASH JOIN）は左の子としてオペレータ5（EXCHANGE）を、右の子としてオペレータ4（EXCHANGE）を持っています。


### Fragment フィールド説明


| Name               | デスクリプション                                                  |
| :----------------- | :----------------------------------------------------------- |
| PARTITION          | 現在のFragmentのデータ分散を表示します       |
| HAS_COLO_PLAN_NODE | fragmentがcolocateオペレータを含むかどうかを示します        |
| Sink               | fragmentデータ出力の方法です。詳細は下表を参照してください |



**Sink メソッド**



| Name               | デスクリプション                                                  |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | 次のFragmentにデータを出力します。2行の情報が含まれます。<br />1行目：データが送信される下流のEXCHANGE NODE。<br />2行目：データ分散の方法。<br />  - UNPARTITIONEDは、各下流インスタンスが完全なデータセットを受信することを意味します。これは通常、ブロードキャストジョインや、グローバルlimitやorder byなどの単一インスタンスロジックが必要な場合に発生します。<br /> - RANDOMは、各下流インスタンスが重複なしでランダムなデータのサブセットを受信することを意味します。<br /> - HASH_PARTITIONEDは、リストされたslotをキーとして使用してハッシュ化し、データのシャードを同じ下流インスタンスに送信します。これは、パーティションハッシュジョインの上流や、2フェーズ集約の第2段階でよく使用されます。 |
| RESULT SINK        | 結果データをFEに送信します。1行目は、データ転送に使用されるプロトコルを示し、現在MySQLとarrowプロトコルをサポートしています。 |
| OLAP TABLE SINK    | OLAPTableにデータを書き込みます。                                |
| MultiCastDataSinks | 複数のSTREAM DATA SINKを含むマルチキャストオペレータです。各STREAM DATA SINKは完全なデータセットをその下流に送信します。 |



### Tuple情報説明

VERBOSEモードを使用する場合、Tuple情報が出力されます。Tuple情報は、SLOTタイプ、null許可ステータスなどを含む、データの1行内のSLOTの詳細を説明します。

出力には複数のTupleDescriptorが含まれ、それぞれが複数のSlotDescriptorを含んでいます。例を以下に示します：

```sql
Tuples:
TupleDescriptor{id=0, tbl=t1}
  SlotDescriptor{id=0, col=c1, colUniqueId=0, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
  SlotDescriptor{id=2, col=c3, colUniqueId=2, type=int, nullable=true, isAutoIncrement=false, subColPath=null}
```
#### TupleDescriptor

| Name | デスクリプション                                                  |
| :--- | :----------------------------------------------------------- |
| id   | tuple descriptorのid                               |
| tbl  | tupleの対応するTable、または適用されない場合は`null`  |

#### SlotDescriptor

| Name            | デスクリプション                                                  |
| :-------------- | :----------------------------------------------------------- |
| id              | slot descriptorのid                                |
| col             | slotの対応するカラム、または適用されない場合は空白 |
| colUniqueId     | 対応するカラムの一意ID、または適用されない場合は-1 |
| type            | slotのタイプ                                         |
| nullable        | 対応するデータがnullになることができるかを示す              |
| isAutoIncrement | カラムが自動インクリメントされるかを示す                  |
| subColPath      | カラム内のサブカラムパス、現在はvariantタイプにのみ適用される |

### オペレータの説明

#### オペレータリスト

| Name                  | デスクリプション                                                  |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE             | 集約オペレータ                                         |
| ANALYTIC              | ウィンドウ関数オペレータ                                     |
| ASSERT NUMBER OF ROWS | ダウンストリーム出力行数をチェックするオペレータ       |
| EXCHANGE              | データ交換レシーバオペレータ                              |
| MERGING-EXCHANGE      | ソートと行制限機能を持つデータ交換レシーバ |
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
| TABLE FUNCTION NODE   | Table関数オペレータ（lateral view）                       |

#### 共通フィールド

| Name                    | デスクリプション                                                  |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | 出力行数を制限する                             |
| offset                  | 出力前にスキップする行数                     |
| conjuncts               | 現在のノードの結果をフィルタリングする。projectionsより前に実行される。 |
| projections             | 現在のオペレータ後のプロジェクション操作。conjunctsの後に実行される。 |
| project output tuple id | プロジェクション後の出力tuple。データtuple内のslot配置はtuple descで確認できる。 |
| cardinality             | オプティマイザによる推定行数                         |
| distribute expr lists   | 現在のノードの子ノードの元のデータ分散方法 |
| Expression's slot id    | slot idに対応する具体的なslotは、verboseモードのtupleリストで確認できる。このリストはslotタイプやnullable属性などの情報を提供する。式の後に`[#5]`として表される。 |

#### AGGREGATE

| Name                | デスクリプション                                                  |
| :------------------ | :----------------------------------------------------------- |
| (Aggregation Phase) | 集約フェーズは2つの用語で表される。<br /> 最初の用語はupdate（ローカル集約）またはmerge（グローバル集約）のいずれか。<br /> 2番目の用語は現在のデータがシリアル化されている（serialize）か最終計算が完了している（finalize）かを示す。 |
| STREAMING           | 多段階集約打ち切りのローカル集約オペレータのみにこのフラグがある。現在の集約ノードがSTREAMINGモードを使用する可能性があることを示し、入力データが実際の計算なしで次の集約段階に直接渡される。 |
| output              | 現在の集約オペレータの出力。すべてのローカル事前集約関数にはpartialが接頭辞として付く。 |
| group by            | 集約のキー                                      |

#### ANALYTIC

| Name         | デスクリプション                                                  |
| :----------- | :----------------------------------------------------------- |
| functions    | 現在のウィンドウ関数の名前                      |
| partition by | ウィンドウ関数のover句のpartition by句に対応。ウィンドウ式。 |
| order by     | ウィンドウ内のソート式と順序               |
| window       | ウィンドウ範囲                                                 |

#### ASSERT NUMBER OF ROWS

| Name | デスクリプション                                                |
| :--- | :--------------------------------------------------------- |
| EQ   | ダウンストリーム出力はこの行数制約と一致する必要がある |

#### HASH JOIN

| Name                  | デスクリプション                                                  |
| :-------------------- | :----------------------------------------------------------- |
| join op               | 結合のタイプ                                                 |
| equal join conjunct   | 結合条件の等価条件                     |
| other join predicates | 結合条件の条件（等価条件を除く）         |
| mark join predicates  | mark joinで使用される条件                                 |
| other predicates      | 結合実行後のフィルタリング述語                    |
| runtime filters       | 生成されるランタイムフィルタ                                    |
| output slot ids       | 最終出力slotのリスト                                   |
| hash output slot ids  | ハッシュ結合実行後、他の結合条件が適用される前の出力slotのリスト |
| isMarkJoin            | mark joinかどうかを示す                          |

#### NESTED LOOP JOIN

| Name                 | デスクリプション                  |
| :------------------- | :--------------------------- |
| join op              | 結合操作のタイプ       |
| join conjuncts       | 結合の条件       |
| mark join predicates | mark joinで使用される条件 |
| predicates           | 結合後のフィルタ述語 |
| runtime filters      | 生成されるランタイムフィルタ    |
| output slot ids      | 最終出力slotのリスト   |
| isMarkJoin           | mark joinかどうか    |

#### PartitionTopN

| Name                 | デスクリプション                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | グループフィルタ最適化を適用するウィンドウ関数        |
| has global limit     | 行数のグローバル制限の有無             |
| partition limit      | 各パーティション内の行数制限            |
| partition topn phase | 現在のフェーズ：パーティションキーによるシャッフル後のグローバルフェーズはTWO_PHASE_GLOBAL_PTOPN、パーティションキーによるシャッフル前のローカルフェーズはTWO_PHASE_LOCAL_PTOPN |

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
| inputSplitNum | スキャン分割の数                      |
| totalFileSize | スキャンされる総ファイルサイズ              |
| scanRanges    | スキャン分割の情報                 |
| partition     | スキャンされるパーティション数         |
| backends      | 各BEがスキャンする具体的なデータ情報     |
| cardinality   | オプティマイザによる推定行数      |
| avgRowSize    | オプティマイザによる推定平均行サイズ    |
| numNodes      | 現在のオペレータが使用するBE数 |
| pushdown agg  | スキャンにプッシュダウンされる集約           |

#### HUDI_SCAN_NODE

| Name                 | デスクリプション                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | スキャン分割の数                      |
| totalFileSize        | スキャンされる総ファイルサイズ              |
| scanRanges           | スキャン分割の情報                 |
| partition            | スキャンされるパーティション数         |
| backends             | 各BEがスキャンする具体的なデータ情報     |
| cardinality          | オプティマイザによる推定行数      |
| avgRowSize           | オプティマイザによる推定平均行サイズ    |
| numNodes             | 現在のオペレータが使用するBE数 |
| pushdown agg         | スキャンにプッシュダウンされる集約           |
| hudiNativeReadSplits | ネイティブメソッドを使用して読み取られる分割数  |

#### ICEBERG_SCAN_NODE

| Name                     | デスクリプション                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | スキャン分割の数                      |
| totalFileSize            | スキャンされる総ファイルサイズ              |
| scanRanges               | スキャン分割の情報                 |
| partition                | スキャンされるパーティション数         |
| backends                 | 各BEがスキャンする具体的なデータ情報     |
| cardinality              | オプティマイザによる推定行数      |
| avgRowSize               | オプティマイザによる推定平均行サイズ    |
| numNodes                 | 現在のオペレータが使用するBE数 |
| pushdown agg             | スキャンにプッシュダウンされる集約           |
| icebergPredicatePushdown | iceberg APIにプッシュダウンされるフィルタ         |

#### PAIMON_SCAN_NODE

| Name                   | デスクリプション                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | スキャン分割の数                      |
| totalFileSize          | スキャンされる総ファイルサイズ              |
| scanRanges             | スキャン分割の情報                 |
| partition              | スキャンされるパーティション数         |
| backends               | 各BEがスキャンする具体的なデータ情報     |
| cardinality            | オプティマイザによる推定行数      |
| avgRowSize             | オプティマイザによる推定平均行サイズ    |
| numNodes               | 現在のオペレータが使用するBE数 |
| pushdown agg           | スキャンにプッシュダウンされる集約           |
| paimonNativeReadSplits | ネイティブメソッドを使用して読み取られる分割数  |

#### JdbcScanNode

| Name  | デスクリプション                  |
| :---- | :--------------------------- |
| TABLE | スキャンするJDBC側Table名 |
| QUERY | スキャンに使用されるクエリ      |

#### OlapScanNode

| Name           | デスクリプション                                                  |
| :------------- | :----------------------------------------------------------- |
| TABLE          | スキャンされるTable。括弧内はヒットした同期マテリアライズドビューの名前を示す。 |
| SORT INFO      | SCANプリソートが計画されている場合に表示される。SCAN出力の部分的プリソートとプリ切り捨てを示す。 |
| SORT LIMIT     | SCANプリソートが計画されている場合に表示される。プリ切り捨ての切り捨て長を示す。 |
| TOPN OPT       | TOP-N Runtime Filterが計画されている場合に表示される。                |
| PREAGGREGATION | 事前集約が有効かどうかを示す。MOR集約とプライマリキーモデルに関連。ONはストレージ層のデータが上位層のニーズを満たし、追加の集約が不要であることを意味する。OFFは追加の集約が実行されることを意味する。 |
| partitions     | 現在スキャンされるパーティション数、総パーティション数、スキャンされるパーティション名のリスト。 |
| tablets        | スキャンされるtablet数とTable内の総tablet数。    |
| tabletList     | スキャンされるtabletのリスト。                                     |
| avgRowSize     | オプティマイザによる推定行サイズ。                         |
| numNodes       | 現在のスキャンに割り当てられるBE数。                  |
| pushAggOp      | zonemapメタデータを読み取ることで結果が返される。MIN、MAX、COUNT集約情報をサポート。 |

#### UNION

| Name           | デスクリプション                                                  |
| :------------- | :----------------------------------------------------------- |
| constant exprs | 出力に含まれる定数式のリスト。   |
| child exprs    | 子の出力がこの式リストを通じてプロジェクションされ、集合演算子への入力となる。 |

#### EXCEPT

| Name        | デスクリプション                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | 子の出力がこの式リストを通じてプロジェクションされ、集合演算子への入力となる。 |

#### INTERSECT

| Name        | デスクリプション                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | 子の出力がこの式リストを通じてプロジェクションされ、集合演算子への入力となる。 |

#### SORT

| Name     | デスクリプション                          |
| :------- | :----------------------------------- |
| order by | ソートキーと具体的なソート順序。 |

#### TABLE FUNCTION NODE

| Name                  | デスクリプション                                               |
| :-------------------- | :-------------------------------------------------------- |
| table function        | 使用されるTable関数の名前。                          |
| lateral view tuple id | 新しく生成されるカラムに対応するtuple ID。        |
| output slot id        | カラム刈り込み後に出力されるカラムのslot IDのリスト。 |

#### TOP-N

| Name          | デスクリプション                                            |
| :------------ | :----------------------------------------------------- |
| order by      | ソートキーと具体的なソート順序。                   |
| TOPN OPT      | TOP-Nランタイムフィルタ最適化がヒットした場合に表示される。 |
| OPT TWO PHASE | TOP-N遅延マテリアライゼーションがヒットした場合に表示される。    |
