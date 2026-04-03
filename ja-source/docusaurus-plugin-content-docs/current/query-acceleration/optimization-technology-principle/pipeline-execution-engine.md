---
{
  "title": "並列実行",
  "language": "ja",
  "toc_min_heading_level": 2,
  "toc_max_heading_level": 4,
  "description": "DorisのPipeline実行モデルは並列実行モデルであり、主にHyper論文で記述された実装からインスピレーションを得ている。"
}
---
DorisのParallel実行モデルはPipeline実行モデルであり、主に[Hyper](https://db.in.tum.de/~leis/papers/morsels.pdf)論文に記載された実装からインスピレーションを得ています。Pipeline実行モデルはマルチコアCPUの計算能力をフルに活用し、同時にDoris内のクエリスレッド数を制限することで、実行時のスレッド爆発の問題を解決します。設計、実装、効果の詳細については、[DSIP-027](DSIP-027: Support Pipeline Exec Engine - DORIS - Apache Software Foundation)と[DSIP-035](DSIP-035: PipelineX Execution Engine - DORIS - Apache Software Foundation)を参照してください。

Doris 3.0以降、Pipeline実行モデルは従来のVolcanoモデルを完全に置き換えました。Pipeline実行モデルに基づいて、DorisはQuery、DDL、DMLステートメントの並列処理をサポートします。

## 物理プラン

Pipeline実行モデルをより良く理解するために、まず物理クエリプランにおける2つの重要な概念、PlanFragmentとPlanNodeを紹介する必要があります。以下のSQLステートメントを例として使用します：

```
SELECT k1, SUM(v1) FROM A,B WHERE A.k2 = B.k2 GROUP BY k1 ORDER BY SUM(v1);
```
FEはまず以下の論理プランに変換し、各ノードはPlanNodeを表します。各ノードタイプの詳細な意味は、物理プランの紹介で確認できます。

![pip_exec_1](/images/pip_exec_1.png)

DorisはMPPアーキテクチャに基づいて構築されているため、各クエリはクエリレイテンシを削減するために、可能な限りすべてのBEを並列実行に関与させることを目的としています。そのため、論理プランは物理プランに変換される必要があります。この変換は本質的に、論理プランにDataSinkとExchangeNodeを挿入することです。これらの2つのノードは、複数のBE間でのデータのシャッフリングを促進します。

変換後、各PlanFragmentはPlanNodeの一部に対応し、独立したタスクとしてBEに送信できます。各BEはPlanFragment内に含まれるPlanNodeを処理し、その後DataSinkとExchangeNodeオペレータを使用して、後続の計算のために他のBEにデータをシャッフルします。

![pip_exec_2](/images/pip_exec_2.png)

Dorisのプランは3つの層に分けられます：

- PLAN：実行プラン。SQL文はクエリプランナーによって実行プランに変換され、その後実行エンジンに実行のために提供されます。

- FRAGMENT：Dorisは分散実行エンジンであるため、完全な実行プランは複数の単一マシン実行フラグメントに分割されます。FRAGMENTは完全な単一マシン実行フラグメントを表します。複数のフラグメントが結合して完全なPLANを形成します。

- PLAN NODE：オペレータであり、実行プランの最小単位です。FRAGMENTは複数のオペレータで構成され、各オペレータは集約や結合操作など、特定の実行ロジックを担当します。

## Pipeline実行
PlanFragmentは、FEがBEに実行のために送信するタスクの最小単位です。BEは同じクエリに対して複数の異なるPlanFragmentを受信する場合があり、各PlanFragmentは独立して処理されます。PlanFragmentを受信すると、BEはそれを複数のPipelineに分割し、その後複数のPipelineTaskを開始して並列実行を実現し、クエリ効率を向上させます。

![pip_exec_3](/images/pip_exec_3.png)

### Pipeline
PipelineはSourceOperator、SinkOperator、および複数の中間オペレータで構成されます。SourceOperatorは外部ソースからのデータ読み取りを表し、テーブル（例：OlapTable）やバッファ（例：Exchange）の場合があります。SinkOperatorはデータ出力を表し、ネットワーク経由で他のノードにシャッフルされる（例：DataStreamSinkOperator）か、ハッシュテーブルに出力される（例：集約オペレータ、結合ビルドハッシュテーブルなど）場合があります。

![pip_exec_4](/images/pip_exec_4.png)

複数のPipelineは実際に相互依存関係にあります。JoinNodeを例に取ると、それは2つのPipelineに分割されます。Pipeline-0はExchangeからデータを読み取ってハッシュテーブルを構築し、Pipeline-1はテーブルからデータを読み取ってプローブ操作を実行します。これらの2つのPipelineは依存関係によって接続されており、Pipeline-1はPipeline-0が完了した後にのみ実行できることを意味します。この依存関係はDependencyと呼ばれます。Pipeline-0が実行を完了すると、Dependencyのset_readyメソッドを呼び出してPipeline-1に実行準備ができたことを通知します。

### PipelineTask
Pipelineは実際には論理的な概念であり、実行可能なエンティティではありません。Pipelineが定義されると、さらに複数のPipelineTaskにインスタンス化される必要があります。読み取る必要があるデータは異なるPipelineTaskに分散され、最終的に並列処理を実現します。同じPipelineの複数のPipelineTask内のオペレータは同一ですが、状態が異なります。例えば、異なるデータを読み取ったり、異なるハッシュテーブルを構築したりする場合があります。これらの異なる状態はLocalStateと呼ばれます。

各PipelineTaskは最終的にスレッドプールに送信され、独立したタスクとして実行されます。Dependencyトリガーメカニズムにより、このアプローチはマルチコアCPUのより良い利用を可能にし、完全な並列性を実現します。

### Operator
ほとんどの場合、Pipeline内の各オペレータはPlanNodeに対応しますが、例外的な特殊なオペレータもあります：
* JoinNodeはJoinBuildOperatorとJoinProbeOperatorに分割されます。
* AggNodeはAggSinkOperatorとAggSourceOperatorに分割されます。
* SortNodeはSortSinkOperatorとSortSourceOperatorに分割されます。
基本原則は、特定の「ブレーキング」オペレータ（計算を実行する前にすべてのデータを収集する必要があるもの）に対して、データ取り込み部分がSinkに分割され、オペレータからデータを取得する部分がSourceと呼ばれることです。

## 並列スキャン
データのスキャンは非常に重いI/O操作であり、ローカルディスクから大量のデータを読み取る必要があります（データレイクシナリオの場合はHDFSやS3からで、さらに長いレイテンシが発生します）、かなりの時間を消費します。そのため、ScanOperatorに並列スキャニング技術を導入しました。ScanOperatorは動的に複数のScannerを生成し、各Scannerは約100万から200万行のデータをスキャンします。スキャンを実行する間、各Scannerはデータの解凍、フィルタリング、およびその他の計算などのタスクを処理し、その後ScanOperatorが読み取るためにDataQueueにデータを送信します。

![pip_exec_5](/images/pip_exec_5.png)

並列スキャニング技術を使用することで、不適切なバケット化やデータの偏りにより特定のScanOperatorが過度に長い時間を要し、クエリレイテンシ全体を遅くする問題を効果的に回避できます。

## Local Shuffle
Pipeline実行モデルでは、Local ShuffleはPipeline Breakerとして機能し、異なる実行タスク間でデータをローカルに再分散する技術です。HASHやRound Robinなどの方法を使用して、上流Pipelineによって出力されたすべてのデータを下流Pipelineのすべてのタスクに均等に分散します。これは実行中のデータの偏りの問題を解決し、実行モデルがデータストレージやクエリプランによって制限されないことを保証します。Local Exchangeがどのように機能するかを説明するための例を提供します。

前の例のPipeline-1を使用して、Local Exchangeがデータの偏りをどのように防ぐかをさらに説明します。

![pip_exec_6](/images/pip_exec_6.png)

上図に示すように、Pipeline-1にLocal Exchangeを挿入することで、Pipeline-1をPipeline-1-0とPipeline-1-1にさらに分割します。

現在の並行レベルが3（各Pipelineに3つのタスク）で、各タスクがストレージレイヤーから1つのバケットを読み取ると仮定しましょう。3つのバケットの行数はそれぞれ1、1、7です。Local Exchangeの挿入前後の実行は以下のように変化します：

![pip_exec_7](/images/pip_exec_7.png)

右の図から分かるように、HashJoinとAggオペレータが処理する必要があるデータ量が（1、1、7）から（3、3、3）に変化し、データの偏りを回避しています。

Local Shuffleは一連のルールに基づいて計画されます。例えば、クエリがJoin、Aggregation、Window Functionsなどの時間のかかるオペレータを含む場合、Local Shuffleを使用してデータの偏りを可能な限り最小化します。
