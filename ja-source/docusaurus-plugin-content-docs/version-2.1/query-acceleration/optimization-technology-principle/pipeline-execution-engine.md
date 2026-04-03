---
{
  "title": "並列実行",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "DorisのパラレルExecution ModelはPipeline Execution Modelであり、主にHyper論文で記述された実装にインスパイアされています。"
}
---
DorisのParallel実行モデルは、主に[Hyper](https://db.in.tum.de/~leis/papers/morsels.pdf)論文で説明されている実装にインスパイアされたPipeline実行モデルです。Pipeline実行モデルは、Doris内のクエリスレッド数を制限しながらマルチコアCPUの計算能力を最大限に活用し、実行中のスレッド爆発の問題を解決します。その設計、実装、有効性の詳細については、[DSIP-027](DSIP-027: Support Pipeline Exec Engine - DORIS - Apache Software Foundation)と[DSIP-035](DSIP-035: PipelineX Execution Engine - DORIS - Apache Software Foundation)を参照してください。

Doris 3.0以降、Pipeline実行モデルは元のVolcanoモデルを完全に置き換えました。Pipeline実行モデルに基づいて、DorisはQuery、DDL、DMLステートメントの並列処理をサポートしています。

## 物理プラン

Pipeline実行モデルをより良く理解するために、まず物理クエリプランにおける2つの重要な概念であるPlanFragmentとPlanNodeを紹介する必要があります。以下のSQLステートメントを例として使用します：

```
SELECT k1, SUM(v1) FROM A,B WHERE A.k2 = B.k2 GROUP BY k1 ORDER BY SUM(v1);
```
FEは最初にこれを以下の論理プランに変換し、各ノードはPlanNodeを表します。各ノードタイプの詳細な意味は、物理プランの説明で確認できます。

![pip_exec_1](/images/pip_exec_1.png)

DorisはMPPアーキテクチャ上に構築されているため、各クエリはクエリレイテンシを削減するために、可能な限りすべてのBEを並列実行に関与させることを目的としています。そのため、論理プランは物理プランに変換される必要があります。この変換は本質的に、DataSinkとExchangeNodeを論理プランに挿入することです。これら2つのノードは、複数のBE間でのデータのシャッフリングを促進します。

変換後、各PlanFragmentはPlanNodeの一部に対応し、独立したタスクとしてBEに送信できます。各BEは、PlanFragment内に含まれるPlanNodeを処理し、その後DataSinkとExchangeNodeオペレータを使用して、後続の計算のために他のBEにデータをシャッフルします。

![pip_exec_2](/images/pip_exec_2.png)

Dorisのプランは3つの層に分かれています：

- PLAN: 実行プラン。SQL文がクエリプランナーによって実行プランに変換され、実行エンジンに実行のために提供されます。

- FRAGMENT: Dorisは分散実行エンジンであるため、完全な実行プランは複数の単一マシン実行フラグメントに分割されます。FRAGMENTは完全な単一マシン実行フラグメントを表します。複数のフラグメントが組み合わさって完全なPLANを形成します。

- PLAN NODE: オペレータであり、実行プランの最小単位です。FRAGMENTは複数のオペレータで構成され、各オペレータは集約や結合操作など、特定の実行ロジックを担当します。

## Pipeline実行
PlanFragmentは、FEからBEに実行のために送信されるタスクの最小単位です。BEは同じクエリに対して複数の異なるPlanFragmentを受信する場合があり、各PlanFragmentは独立して処理されます。PlanFragmentを受信すると、BEはそれを複数のPipelineに分割し、その後複数のPipelineTaskを開始して並列実行を実現し、クエリ効率を向上させます。

![pip_exec_3](/images/pip_exec_3.png)

### Pipeline
PipelineはSourceOperator、SinkOperator、および複数の中間オペレータで構成されます。SourceOperatorは外部ソースからのデータ読み取りを表し、テーブル（例：OlapTable）またはバッファ（例：Exchange）のいずれかになります。SinkOperatorはデータ出力を表し、ネットワーク経由で他のノードにシャッフルする（例：DataStreamSinkOperator）か、ハッシュテーブルに出力する（例：集約オペレータ、結合ビルドハッシュテーブルなど）かのいずれかです。

![pip_exec_4](/images/pip_exec_4.png)

複数のPipelineは実際には相互依存しています。JoinNodeを例に取ると、それは2つのPipelineに分割されます。Pipeline-0はExchangeからデータを読み取ってハッシュテーブルを構築し、Pipeline-1はテーブルからデータを読み取ってプローブ操作を実行します。これら2つのPipelineは依存関係によって接続されており、Pipeline-1はPipeline-0が完了した後にのみ実行できることを意味します。この依存関係はDependencyと呼ばれます。Pipeline-0が実行を完了すると、DependencyのSet_readyメソッドを呼び出してPipeline-1に実行準備が整ったことを通知します。

### PipelineTask
Pipelineは実際には論理的な概念であり、実行可能なエンティティではありません。Pipelineが定義されると、複数のPipelineTaskにさらにインスタンス化される必要があります。読み取る必要があるデータは、異なるPipelineTaskに分散され、最終的に並列処理を実現します。同じPipelineの複数のPipelineTask内のオペレータは同一ですが、状態が異なります。例えば、異なるデータを読み取ったり、異なるハッシュテーブルを構築したりする場合があります。これらの異なる状態はLocalStateと呼ばれます。

各PipelineTaskは最終的にスレッドプールに送信され、独立したタスクとして実行されます。Dependencyトリガーメカニズムにより、このアプローチはマルチコアCPUをより効率的に利用し、完全な並列処理を実現できます。

### Operator
ほとんどの場合、Pipeline内の各オペレータはPlanNodeに対応しますが、例外のある特別なオペレータがいくつかあります：
* JoinNodeはJoinBuildOperatorとJoinProbeOperatorに分割されます。
* AggNodeはAggSinkOperatorとAggSourceOperatorに分割されます。
* SortNodeはSortSinkOperatorとSortSourceOperatorに分割されます。
基本原則は、特定の「ブレーキング」オペレータ（計算を実行する前にすべてのデータを収集する必要があるもの）について、データ取り込み部分はSinkに分割され、オペレータからデータを取得する部分はSourceと呼ばれることです。

## 並列スキャン
データのスキャンは非常に重いI/O操作であり、ローカルディスクから大量のデータを読み取る必要があり（データレイクシナリオでHDFSやS3から読み取る場合はさらに長いレイテンシが発生）、相当な時間を消費します。そのため、ScanOperatorに並列スキャン技術を導入しました。ScanOperatorは動的に複数のScannerを生成し、各Scannerは約100万から200万行のデータをスキャンします。スキャンを実行しながら、各Scannerはデータ圧縮解除、フィルタリング、その他の計算などのタスクを処理し、その後ScanOperatorが読み取るためにDataQueueにデータを送信します。

![pip_exec_5](/images/pip_exec_5.png)

並列スキャン技術を使用することで、不適切なバケティングやデータスキューにより特定のScanOperatorが過度に長い時間を要し、クエリレイテンシ全体を遅くするという問題を効果的に回避できます。

## Local Shuffle
Pipeline実行モデルでは、Local ShuffleはPipeline Breakerとして機能し、異なる実行タスク間でローカルにデータを再分散する技術です。上流Pipelineによって出力されるすべてのデータを、HASHやRound Robinなどの方法を使用して、下流Pipelineのすべてのタスクに均等に分散します。これにより、実行中のデータスキューの問題を解決し、実行モデルがデータストレージやクエリプランによって制限されなくなります。Local Exchangeの動作を説明するために例を示します。

前の例のPipeline-1を使用して、Local Exchangeがデータスキューをどのように防ぐかをさらに説明します。

![pip_exec_6](/images/pip_exec_6.png)

上図に示すように、Pipeline-1にLocal Exchangeを挿入することで、Pipeline-1をPipeline-1-0とPipeline-1-1にさらに分割します。

現在の並行性レベルが3（各Pipelineに3つのタスク）で、各タスクがストレージ層から1つのバケットを読み取ると仮定します。3つのバケットの行数はそれぞれ1、1、7です。Local Exchangeの挿入前後の実行は以下のように変化します：

![pip_exec_7](/images/pip_exec_7.png)

右の図からわかるように、HashJoinとAggオペレータが処理する必要があるデータ量が（1、1、7）から（3、3、3）に変化し、データスキューを回避します。

Local Shuffleは一連のルールに基づいて計画されます。例えば、クエリにJoin、Aggregation、Window Functionsなどの時間のかかるオペレータが含まれる場合、Local Shuffleを使用してデータスキューを可能な限り最小化します。
