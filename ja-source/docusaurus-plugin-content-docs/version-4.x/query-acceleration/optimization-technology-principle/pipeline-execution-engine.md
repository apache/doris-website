---
{
  "title": "並列実行",
  "description": "Dorisの並列実行モデルはPipeline実行モデルであり、主にHyper論文で説明されている実装にインスパイアされています。",
  "language": "ja"
}
---
Dorisの並列実行モデルはPipeline実行モデルで、主に[Hyper](https://db.in.tum.de/~leis/papers/morsels.pdf)論文で説明されている実装にインスパイアされています。Pipeline実行モデルは、Dorisにおけるクエリスレッド数を制限しながらマルチコアCPUの計算能力を最大限に活用し、実行時のスレッド爆発問題を解決します。その設計、実装、効果の詳細については、[DSIP-027](DSIP-027: Support Pipeline Exec Engine - DORIS - Apache Software Foundation)と[DSIP-035](DSIP-035: PipelineX Execution Engine - DORIS - Apache Software Foundation)を参照してください。

Doris 3.0以降、Pipeline実行モデルは元のVolcanoモデルを完全に置き換えました。Pipeline実行モデルに基づいて、DorisはQuery、DDL、DMLステートメントの並列処理をサポートしています。

## 物理プラン

Pipeline実行モデルをより理解するために、まず物理クエリプランの2つの重要な概念であるPlanFragmentとPlanNodeを紹介する必要があります。以下のSQLステートメントを例として使用します：

```
SELECT k1, SUM(v1) FROM A,B WHERE A.k2 = B.k2 GROUP BY k1 ORDER BY SUM(v1);
```
FEはまず以下の論理プランに変換し、各ノードはPlanNodeを表します。各ノードタイプの詳細な意味は物理プランの説明で確認できます。

![pip_exec_1](/images/pip_exec_1.png)

DorisはMPPアーキテクチャ上に構築されているため、各クエリはクエリレイテンシを削減するために可能な限りすべてのBEを並列実行に関与させることを目指します。そのため、論理プランは物理プランに変換される必要があります。この変換は本質的に、論理プランにDataSinkとExchangeNodeを挿入することです。これら2つのノードは複数のBE間でのデータシャッフリングを促進します。

変換後、各PlanFragmentはPlanNodeの一部に対応し、独立したタスクとしてBEに送信できます。各BEはPlanFragment内に含まれるPlanNodeを処理し、その後DataSinkとExchangeNodeオペレータを使用して他のBEにデータをシャッフルして後続の計算を行います。

![pip_exec_2](/images/pip_exec_2.png)

Dorisのプランは3つの層に分かれています：

- PLAN: 実行プラン。SQL文はクエリプランナーによって実行プランに変換され、実行エンジンに提供されて実行されます。

- FRAGMENT: Dorisは分散実行エンジンであるため、完全な実行プランは複数の単一マシン実行フラグメントに分割されます。FRAGMENTは完全な単一マシン実行フラグメントを表します。複数のフラグメントが組み合わさって完全なPLANを形成します。

- PLAN NODE: オペレータであり、実行プランの最小単位です。FRAGMENTは複数のオペレータから構成され、各オペレータは集約やjoin操作などの特定の実行ロジックを担当します。

## Pipeline実行
PlanFragmentはFEがBEに実行のために送信するタスクの最小単位です。BEは同じクエリに対して複数の異なるPlanFragmentを受信する場合があり、各PlanFragmentは独立して処理されます。PlanFragmentを受信すると、BEはそれを複数のPipelineに分割し、その後複数のPipelineTaskを開始して並列実行を実現し、クエリ効率を向上させます。

![pip_exec_3](/images/pip_exec_3.png)

### Pipeline
Pipelineは1つのSourceOperator、1つのSinkOperator、および複数の中間オペレータから構成されます。SourceOperatorは外部ソースからのデータ読み取りを表し、Table（例：OlapTable）またはバッファ（例：Exchange）の場合があります。SinkOperatorはデータ出力を表し、ネットワーク経由で他のノードにシャッフルされる（例：DataStreamSinkOperator）か、ハッシュTableに出力される（例：集約オペレータ、joinビルドハッシュTableなど）場合があります。

![pip_exec_4](/images/pip_exec_4.png)

複数のPipelineは実際には相互依存関係にあります。JoinNodeを例に取ると、それは2つのPipelineに分割されます。Pipeline-0はExchangeからデータを読み取ってハッシュTableを構築し、Pipeline-1はTableからデータを読み取ってprobe操作を実行します。これら2つのPipelineは依存関係によって接続されており、Pipeline-1はPipeline-0が完了した後にのみ実行できることを意味します。この依存関係はDependencyと呼ばれます。Pipeline-0が実行を完了すると、Dependencyのset_readyメソッドを呼び出してPipeline-1に実行準備ができたことを通知します。

### PipelineTask
Pipelineは実際には論理的な概念であり、実行可能なエンティティではありません。Pipelineが定義されると、さらに複数のPipelineTaskにインスタンス化される必要があります。読み取る必要があるデータは異なるPipelineTaskに分散され、最終的に並列処理が実現されます。同じPipelineの複数のPipelineTask内のオペレータは同一ですが、それらの状態が異なります。例えば、異なるデータを読み取ったり、異なるハッシュTableを構築したりする場合があります。これらの異なる状態はLocalStateと呼ばれます。

各PipelineTaskは最終的にスレッドプールに送信され、独立したタスクとして実行されます。Dependencyトリガーメカニズムにより、このアプローチはマルチコアCPUをより適切に活用し、完全な並列処理を実現できます。

### Operator
ほとんどの場合、Pipeline内の各オペレータはPlanNodeに対応しますが、例外のある特別なオペレータがいくつかあります：
* JoinNodeはJoinBuildOperatorとJoinProbeOperatorに分割されます。
* AggNodeはAggSinkOperatorとAggSourceOperatorに分割されます。
* SortNodeはSortSinkOperatorとSortSourceOperatorに分割されます。
基本原則は、特定の「ブレーキング」オペレータ（計算を実行する前にすべてのデータを収集する必要があるもの）について、データ取り込み部分をSinkに分割し、オペレータからデータを取得する部分をSourceと呼ぶことです。

## 並列スキャン
データのスキャンは非常に重いI/O操作であり、ローカルディスクから大量のデータを読み取る必要があります（またはデータレイクシナリオの場合、HDFSやS3から読み取り、さらに長いレイテンシが発生します）、かなりの時間を消費します。そのため、ScanOperatorに並列スキャン技術を導入しました。ScanOperatorは動的に複数のScannerを生成し、各Scannerは約100万〜200万行のデータをスキャンします。スキャンを実行する間、各Scannerはデータの解凍、フィルタリング、その他の計算などのタスクを処理し、その後ScanOperatorが読み取るためにDataQueueにデータを送信します。

![pip_exec_5](/images/pip_exec_5.png)

並列スキャン技術を使用することで、不適切なバケティングやデータスキューにより特定のScanOperatorが過度に長い時間を要する問題を効果的に回避でき、そうでなければクエリレイテンシ全体が遅くなる可能性があります。

## Local Shuffle
Pipeline実行モデルにおいて、Local ShuffleはPipeline Breakerとして機能し、異なる実行タスク間でローカルにデータを再配布する技術です。HASHやRound Robinなどの方法を使用して、上流Pipelineによって出力されたすべてのデータを下流Pipelineのすべてのタスクに均等に分散します。これは実行中のデータスキューの問題を解決するのに役立ち、実行モデルがもはやデータストレージやクエリプランによって制限されないことを保証します。Local Exchangeがどのように機能するかを説明するための例を示します。

前の例のPipeline-1を使用して、Local Exchangeがどのようにデータスキューを防ぐことができるかをさらに説明します。

![pip_exec_6](/images/pip_exec_6.png)

上図に示すように、Pipeline-1にLocal Exchangeを挿入することで、Pipeline-1をPipeline-1-0とPipeline-1-1にさらに分割します。

現在の同時実行レベルが3（各Pipelineに3つのタスク）であり、各タスクがストレージ層から1つのバケットを読み取ると仮定します。3つのバケットの行数はそれぞれ1、1、7です。Local Exchangeを挿入する前後の実行は以下のように変化します：

![pip_exec_7](/images/pip_exec_7.png)

右図から分かるように、HashJoinとAggオペレータが処理する必要があるデータ量が（1、1、7）から（3、3、3）に変化し、データスキューを回避します。

Local Shuffleは一連のルールに基づいて計画されます。例えば、クエリがJoin、Aggregation、Window Functionsなどの時間のかかるオペレータを含む場合、Local Shuffleを使用してデータスキューを可能な限り最小化します。
