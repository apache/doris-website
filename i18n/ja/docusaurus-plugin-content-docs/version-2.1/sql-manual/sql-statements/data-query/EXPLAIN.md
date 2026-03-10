---
{
  "title": "説明",
  "language": "ja",
  "description": "EXPLAIN文は、指定されたクエリに対するDorisのクエリ実行計画を表示します。"
}
---
## 説明

EXPLAIN文は、指定されたクエリに対するDorisのクエリ実行計画を表示します。Dorisのクエリオプティマイザーは、統計データ、データ特性、およびHASH JOIN、パーティショニング、バケッティングなどの機能を使用して効率的な計画を作成することを目指しています。しかし、理論的および実用的な制約により、計画が期待を下回る性能を示すことがあります。

パフォーマンスを向上させるには、現在の計画を分析することが不可欠です。この記事では、最適化のためにEXPLAIN文を使用する方法を説明します。



## 構文

```plain text
{EXPLAIN | DESC} [VERBOSE] <query_block>
```
## 必須パラメータ

**<query_block>**

> explain planを取得したいクエリステートメントです。

## オプションパラメータ

**[VERBOSE]**

> 詳細情報を表示するかどうかは`VERBOSE`指定によって決まります。`VERBOSE`を指定すると、各オペレータの詳細、それらが使用するtuple ID、各tupleの詳細説明を含む包括的な詳細が表示されます。指定しない場合は、簡潔な情報が提供されます。


## 戻り値

### 基本概念

`EXPLAIN`で表示される情報をより理解するために、Doris実行計画のいくつかの中核概念を紹介します。

| 名前      | 説明                                                  |
| :-------- | :----------------------------------------------------------- |
| PLAN      | 実行計画。クエリは実行プランナーによって実行計画に変換され、実行エンジンによって実行されます。 |
| FRAGMENT  | 実行フラグメント。Dorisは分散実行エンジンであるため、完全な実行計画は複数の単一ノード実行フラグメントに分割されます。FRAGMENTテーブルは完全な単一ノード実行フラグメントを表します。複数のFRAGMENTが組み合わさって完全なPLANを形成します。 |
| PLAN NODE | オペレータ。実行計画の最小単位。FRAGMENTは複数のオペレータで構成されます。各オペレータは集約、結合などの特定の実行ロジックを担当します。 |

### 戻り値の構造

Doris `EXPLAIN`ステートメントの結果は完全なPLANです。PLAN内では、FRAGMENTは実行順序に基づいて後ろから前に並べられます。各FRAGMENT内では、オペレータ（PLAN NODE）も実行順序に基づいて後ろから前に並べられます。

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
オペレータはその子ノードと破線で接続されています。オペレータが複数の子を持つ場合、それらは垂直に配置され、右から左の順序を表します。上記の例では、オペレータ6（VHASH JOIN）はオペレータ5（EXCHANGE）を左の子として、オペレータ4（EXCHANGE）を右の子として持っています。


### Fragment フィールドの説明


| 名前               | 説明                                                  |
| :----------------- | :----------------------------------------------------------- |
| PARTITION          | 現在のFragmentのデータ分散を表示します       |
| HAS_COLO_PLAN_NODE | fragmentにcolocateオペレータが含まれているかを示します        |
| Sink               | fragmentデータ出力の方法、詳細は以下の表を参照 |



**Sink方式**


| 名前               | 説明                                                  |
| :----------------- | :----------------------------------------------------------- |
| STREAM DATA SINK   | 次のFragmentにデータを出力します。2行の情報が含まれます。<br />1行目：データが送信される下流のEXCHANGE NODE。<br />2行目：データ分散の方法。<br />  - UNPARTITIONEDは、各下流インスタンスが完全なデータセットを受信することを意味します。これは通常、broadcast joinや、global limitやorder byなどの単一インスタンスロジックが必要な場合に発生します。<br /> - RANDOMは、各下流インスタンスが重複なしにランダムなデータのサブセットを受信することを意味します。<br /> - HASH_PARTITIONEDは、リストされたslotをキーとして使用してハッシュし、データシャードを同じ下流インスタンスに送信します。これはpartition hash joinの上流や、2段階集約の第2段階でよく使用されます。 |
| RESULT SINK        | 結果データをFEに送信します。1行目は、データ送信に使用されるプロトコルを示し、現在MySQLとarrowプロトコルをサポートしています。 |
| OLAP TABLE SINK    | OLAPテーブルにデータを書き込みます。                                |
| MultiCastDataSinks | 複数のSTREAM DATA SINKを含むマルチキャストオペレータです。各STREAM DATA SINKは完全なデータセットをその下流に送信します。 |



### Tuple情報の説明

VERBOSEモードを使用する場合、Tuple情報が出力されます。Tuple情報は、SLOTタイプ、nullable状態など、データ行内のSLOTの詳細を説明します。

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
| id   | tuple descriptorのid                               |
| tbl  | tupleに対応するテーブル、該当しない場合は`null`  |

#### SlotDescriptor

| Name            | Description                                                  |
| :-------------- | :----------------------------------------------------------- |
| id              | slot descriptorのid                                |
| col             | slotに対応するカラム、該当しない場合は空白 |
| colUniqueId     | 対応するカラムの一意のid、該当しない場合は-1 |
| type            | slotのタイプ                                         |
| nullable        | 対応するデータがnullになり得るかを示す              |
| isAutoIncrement | カラムが自動増分されるかを示す                  |
| subColPath      | カラム内のサブカラムパス、現在はvariant型にのみ適用 |

### オペレータの説明

#### オペレータリスト

| Name                  | Description                                                  |
| :-------------------- | :----------------------------------------------------------- |
| AGGREGATE             | 集約オペレータ                                         |
| ANALYTIC              | ウィンドウ関数オペレータ                                     |
| ASSERT NUMBER OF ROWS | 下流の出力行数をチェックするオペレータ       |
| EXCHANGE              | データ交換レシーバオペレータ                              |
| MERGING-EXCHANGE      | ソート機能と行数制限機能付きデータ交換レシーバ |
| HASH JOIN             | ハッシュ結合オペレータ                                           |
| NESTED LOOP JOIN      | ネストループ結合オペレータ                                    |
| PartitionTopN         | パーティション内データ事前フィルタリングオペレータ                  |
| REPEAT_NODE           | データ複製オペレータ                                    |
| DataGenScanNode       | テーブル値関数オペレータ                               |
| EsScanNode            | ESテーブルスキャンオペレータ                                       |
| HIVE_SCAN_NODE        | Hiveテーブルスキャンオペレータ                                     |
| HUDI_SCAN_NODE        | Hudiテーブルスキャンオペレータ                                  |
| ICEBERG_SCAN_NODE     | Icebergテーブルスキャンオペレータ                                  |
| PAIMON_SCAN_NODE      | Paimonテーブルスキャンオペレータ                                   |
| JdbcScanNode          | Jdbcテーブルスキャンオペレータ                                     |
| OlapScanNode          | Olapテーブルスキャンオペレータ                                     |
| SELECT                | フィルタリングオペレータ                                           |
| UNION                 | 集合の和演算オペレータ                                           |
| EXCEPT                | 集合の差演算オペレータ                                      |
| INTERSECT             | 集合の積演算オペレータ                                    |
| SORT                  | ソートオペレータ                                             |
| TOP-N                 | ソートして上位N件の結果を返すオペレータ                       |
| TABLE FUNCTION NODE   | テーブル関数オペレータ（lateral view）                       |

#### 共通フィールド

| Name                    | Description                                                  |
| :---------------------- | :----------------------------------------------------------- |
| limit                   | 出力行数を制限                             |
| offset                  | 出力前にスキップする行数                     |
| conjuncts               | 現在のノードの結果をフィルタする。projectionの前に実行される。 |
| projections             | 現在のオペレータ後のプロジェクション操作。conjunctsの後に実行される。 |
| project output tuple id | プロジェクション後の出力tuple。データtuple内のslotの配置はtuple descで確認できる。 |
| cardinality             | オプティマイザによる推定行数                         |
| distribute expr lists   | 現在のノードの子ノードに対する元のデータ分散方法 |
| Expression's slot id    | slot idに対応する具体的なslotは、verboseモードのtupleリストで確認できる。このリストはslot typeやnullable属性などの情報を提供する。式の後に`[#5]`として表現される。 |

#### AGGREGATE

| Name                | Description                                                  |
| :------------------ | :----------------------------------------------------------- |
| (Aggregation Phase) | 集約フェーズは2つの用語で表現される。<br />最初の用語はupdate（ローカル集約）またはmerge（グローバル集約）のいずれか。<br />2番目の用語は、現在のデータがシリアライズされているか（serialize）、最終計算が完了しているか（finalize）を示す。 |
| STREAMING           | 多段階集約トランケーションのローカル集約オペレータのみがこのフラグを持つ。現在の集約ノードがSTREAMINGモードを使用する可能性があることを示し、入力データは実際の計算を行わずに直接次段階の集約に渡される。 |
| output              | 現在の集約オペレータの出力。すべてのローカル事前集約関数にはpartialプレフィックスが付く。 |
| group by            | 集約のキー                                      |

#### ANALYTIC

| Name         | Description                                                  |
| :----------- | :----------------------------------------------------------- |
| functions    | 現在のウィンドウ関数の名前                      |
| partition by | ウィンドウ関数のover句のpartition by句に対応。ウィンドウ式。 |
| order by     | ウィンドウ内のソート式と順序               |
| window       | ウィンドウ範囲                                                 |

#### ASSERT NUMBER OF ROWS

| Name | Description                                                |
| :--- | :--------------------------------------------------------- |
| EQ   | 下流の出力がこの行数制約と一致する必要がある |

#### HASH JOIN

| Name                  | Description                                                  |
| :-------------------- | :----------------------------------------------------------- |
| join op               | 結合のタイプ                                                 |
| equal join conjunct   | 結合条件内の等価条件                     |
| other join predicates | 結合条件内の等価以外の条件         |
| mark join predicates  | mark joinで使用される条件                                 |
| other predicates      | 結合実行後のフィルタリング述語                    |
| runtime filters       | 生成されたランタイムフィルタ                                    |
| output slot ids       | 最終出力slotのリスト                                   |
| hash output slot ids  | ハッシュ結合実行後の出力slotのリスト、ただし他の結合条件が適用される前 |
| isMarkJoin            | mark joinかどうかを示す                          |

#### NESTED LOOP JOIN

| Name                 | Description                  |
| :------------------- | :--------------------------- |
| join op              | 結合操作のタイプ       |
| join conjuncts       | 結合の条件       |
| mark join predicates | mark joinで使用される条件 |
| predicates           | 結合後のフィルタ述語 |
| runtime filters      | 生成されたランタイムフィルタ    |
| output slot ids      | 最終出力slotのリスト   |
| isMarkJoin           | mark joinかどうか    |

#### PartitionTopN

| Name                 | Description                                                  |
| :------------------- | :----------------------------------------------------------- |
| functions            | グループ化フィルタ最適化を適用するウィンドウ関数        |
| has global limit     | 行数のグローバル制限の存在             |
| partition limit      | 各パーティション内の行数制限            |
| partition topn phase | 現在のフェーズ：パーティションキーによるシャッフル後のグローバルフェーズはTWO_PHASE_GLOBAL_PTOPN、パーティションキーによるシャッフル前のローカルフェーズはTWO_PHASE_LOCAL_PTOPN |

#### REPEAT_NODE

| Name   | Description                                                  |
| :----- | :----------------------------------------------------------- |
| repeat | 各行の繰り返し回数と集約カラムに対応するslot id |
| exprs  | 繰り返し後の出力データの式のリスト         |

#### DataGenScanNode

| Name                 | Description         |
| :------------------- | :------------------ |
| table value function | テーブル関数名 |

#### EsScanNode

| Name              | Description                    |
| :---------------- | :----------------------------- |
| SORT COLUMN       | 結果ソート用のカラム    |
| LOCAL_PREDICATES  | Doris内で実行されるフィルタ  |
| REMOTE_PREDICATES | ES内で実行されるフィルタ     |
| ES index/type     | クエリ用のESインデックスとタイプ |

#### HIVE_SCAN_NODE

| Name          | Description                                |
| :------------ | :----------------------------------------- |
| inputSplitNum | スキャン分割数                      |
| totalFileSize | スキャンされるファイルの総サイズ              |
| scanRanges    | スキャン分割の情報                 |
| partition     | スキャンされるパーティション数         |
| backends      | 各BEがスキャンする具体的なデータ情報     |
| cardinality   | オプティマイザによる推定行数      |
| avgRowSize    | オプティマイザによる平均行サイズの推定    |
| numNodes      | 現在のオペレータが使用するBE数 |
| pushdown agg  | スキャンにプッシュダウンされた集約           |

#### HUDI_SCAN_NODE

| Name                 | Description                                |
| :------------------- | :----------------------------------------- |
| inputSplitNum        | スキャン分割数                      |
| totalFileSize        | スキャンされるファイルの総サイズ              |
| scanRanges           | スキャン分割の情報                 |
| partition            | スキャンされるパーティション数         |
| backends             | 各BEがスキャンする具体的なデータ情報     |
| cardinality          | オプティマイザによる推定行数      |
| avgRowSize           | オプティマイザによる平均行サイズの推定    |
| numNodes             | 現在のオペレータが使用するBE数 |
| pushdown agg         | スキャンにプッシュダウンされた集約           |
| hudiNativeReadSplits | ネイティブメソッドで読み取られる分割数  |

#### ICEBERG_SCAN_NODE

| Name                     | Description                                |
| :----------------------- | :----------------------------------------- |
| inputSplitNum            | スキャン分割数                      |
| totalFileSize            | スキャンされるファイルの総サイズ              |
| scanRanges               | スキャン分割の情報                 |
| partition                | スキャンされるパーティション数         |
| backends                 | 各BEがスキャンする具体的なデータ情報     |
| cardinality              | オプティマイザによる推定行数      |
| avgRowSize               | オプティマイザによる平均行サイズの推定    |
| numNodes                 | 現在のオペレータが使用するBE数 |
| pushdown agg             | スキャンにプッシュダウンされた集約           |
| icebergPredicatePushdown | iceberg APIにプッシュダウンされたフィルタ         |

#### PAIMON_SCAN_NODE

| Name                   | Description                                |
| :--------------------- | :----------------------------------------- |
| inputSplitNum          | スキャン分割数                      |
| totalFileSize          | スキャンされるファイルの総サイズ              |
| scanRanges             | スキャン分割の情報                 |
| partition              | スキャンされるパーティション数         |
| backends               | 各BEがスキャンする具体的なデータ情報     |
| cardinality            | オプティマイザによる推定行数      |
| avgRowSize             | オプティマイザによる平均行サイズの推定    |
| numNodes               | 現在のオペレータが使用するBE数 |
| pushdown agg           | スキャンにプッシュダウンされた集約           |
| paimonNativeReadSplits | ネイティブメソッドで読み取られる分割数  |

#### JdbcScanNode

| Name  | Description                  |
| :---- | :--------------------------- |
| TABLE | スキャンするJDBC側のテーブル名 |
| QUERY | スキャンに使用されるクエリ      |

#### OlapScanNode

| Name           | Description                                                  |
| :------------- | :----------------------------------------------------------- |
| TABLE          | スキャンされるテーブル。括弧内は該当した同期マテリアライズドビューの名前を示す。 |
| SORT INFO      | SCAN事前ソートが計画されている場合に表示される。SCAN出力の部分的な事前ソートと事前トランケーションを示す。 |
| SORT LIMIT     | SCAN事前ソートが計画されている場合に表示される。事前トランケーションのトランケーション長を示す。 |
| TOPN OPT       | TOP-N Runtime Filterが計画されている場合に表示される。                |
| PREAGGREGATION | 事前集約が有効かどうかを示す。MOR集約と主キーモデルに関連。ONはストレージレイヤーのデータが上位レイヤーのニーズを満たし、追加の集約が不要であることを意味する。OFFは追加の集約が実行されることを意味する。 |
| partitions     | 現在スキャンされるパーティション数、総パーティション数、スキャンされるパーティション名のリスト。 |
| tablets        | スキャンされるタブレット数とテーブル内の総タブレット数。    |
| tabletList     | スキャンされるタブレットのリスト。                                     |
| avgRowSize     | オプティマイザによる推定行サイズ。                         |
| numNodes       | 現在のスキャンに割り当てられたBE数。                  |
| pushAggOp      | zonemapメタデータを読み取って結果を返す。MIN、MAX、COUNT集約情報をサポート。 |

#### UNION

| Name           | Description                                                  |
| :------------- | :----------------------------------------------------------- |
| constant exprs | 出力に含める定数式のリスト。   |
| child exprs    | この式のリストを通してプロジェクトされる子の出力を集合演算子への入力とする。 |

#### EXCEPT

| Name        | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | この式のリストを通してプロジェクトされる子の出力を集合演算子への入力とする。 |

#### INTERSECT

| Name        | Description                                                  |
| :---------- | :----------------------------------------------------------- |
| child exprs | この式のリストを通してプロジェクトされる子の出力を集合演算子への入力とする。 |

#### SORT

| Name     | Description                          |
| :------- | :----------------------------------- |
| order by | ソートキーと具体的なソート順序。 |

#### TABLE FUNCTION NODE

| Name                  | Description                                               |
| :-------------------- | :-------------------------------------------------------- |
| table function        | 使用されるテーブル関数の名前。                          |
| lateral view tuple id | 新しく生成されるカラムに対応するTuple ID。        |
| output slot id        | カラムプルーニング後に出力されるカラムのslot IDのリスト。 |

#### TOP-N

| Name          | Description                                            |
| :------------ | :----------------------------------------------------- |
| order by      | ソートキーと具体的なソート順序。                   |
| TOPN OPT      | TOP-Nランタイムフィルタ最適化が該当した場合に表示される。 |
| OPT TWO PHASE | TOP-N遅延マテリアライゼーションが該当した場合に表示される。    |
