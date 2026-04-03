---
{
  "title": "分析ツール",
  "language": "ja",
  "description": "診断ツールに関する前のセクションでは、ビジネスおよび運用担当者が特定の低速なSQLクエリを特定するのに役立ちました。"
}
---
## 概要

前のセクションの[診断ツール](diagnostic-tools.md)は、ビジネスや運用担当者が特定の低速SQLクエリを特定するのに役立ちました。このセクションでは、低速SQLのパフォーマンスボトルネックを分析し、SQL実行プロセスのどの部分が速度低下を引き起こしているかを判断する方法を紹介します。

SQLクエリの実行プロセスは、大まかにプラン生成とプラン実行の2つのステージに分けることができます。前者は実行プランの生成を担当し、後者は具体的なプランを実行します。どちらの部分の問題もパフォーマンスボトルネックにつながる可能性があります。例えば、不適切なプランが生成された場合、executorがどんなに優秀でも良いパフォーマンスは実現できません。同様に、正しいプランがあっても、不適切な実行方法もパフォーマンスボトルネックにつながる可能性があります。さらに、executorのパフォーマンスは現在のハードウェアとシステムアーキテクチャと密接に関連しています。インフラストラクチャの不備や不正確な設定もパフォーマンス問題を引き起こす可能性があります。

これら3種類の問題すべてに、優れた分析ツールのサポートが必要です。これに基づいて、Dorisシステムは計画と実行それぞれのボトルネックを分析するための2つのパフォーマンス分析ツールを提供します。さらに、システムレベルでもパフォーマンスボトルネックの特定を支援する対応するパフォーマンス監視ツールを提供しています。以下のセクションでは、これら3つの側面を紹介します：

## Doris Explain

実行プランは、SQLクエリの具体的な実行方法とプロセスを記述します。例えば、2つのテーブルを結合するSQLクエリの場合、実行プランはテーブルのアクセス方法、結合方法、結合順序などの情報を表示します。

DorisはExplainツールを提供し、SQLクエリの実行プランに関する詳細情報を便利に表示します。Explainが出力するプランを分析することで、ユーザーは計画レベルでのボトルネックを迅速に特定し、さまざまな状況に基づいてプランレベルのチューニングを実行できます。

Dorisは、Explain Verbose、Explain All Plan、Explain Memo Plan、Explain Shape Planなど、さまざまな粒度レベルの複数のExplainツールを提供しており、これらはそれぞれ最終的な物理プラン、さまざまなステージでの論理プラン、コスト最適化プロセスに基づくプラン、プランシェイプを表示するために使用されます。詳細については、実行プランExplainセクションを参照して、さまざまなExplainツールの使用方法とその出力情報の解釈について学んでください。

Explainの出力を分析することで、ビジネス担当者やDBAは現在のプランでのパフォーマンスボトルネックを迅速に特定できます。例えば、実行プランを分析することで、フィルターがベーステーブルにプッシュダウンされておらず、データが早期にフィルタリングされずに過度の量のデータが計算に関与し、パフォーマンス問題につながっていることが判明する場合があります。別の例として、2つのテーブルのInner equi-joinにおいて、結合条件の一方のフィルター条件が他方に導出されておらず、他方のテーブルのデータが早期にフィルタリングされないため、これも最適でないパフォーマンスにつながる可能性があります。このようなパフォーマンスボトルネックは、Explainの出力を分析することで特定し、解決することができます。

Doris Explainの出力を使用してプランレベルのチューニングを実行するケースについては、[プランチューニング](../tuning/tuning-plan/optimizing-table-schema.md)セクションを参照してください。

## Doris Profile

上記で説明したExplainツールは、SQLクエリの実行プランの概要を示します。例えば、テーブルt1とt2間の結合操作をHash Joinとして計画し、t1をbuild側、t2をprobe側として指定する場合です。SQLクエリが実際に実行される際、各具体的な実行ステップにかかる時間、例えばbuildフェーズがどのくらい続き、probeフェーズがどのくらい続くかを理解することは、パフォーマンス分析とチューニングにとって重要です。Profileツールはこの目的のために詳細な実行情報を提供します。以下のセクションでは、まずProfileファイル構造の概要を示し、次にMerged Profile、Execution Profile、およびPipelineTaskでの実行時間の意味を紹介します。

### Profileファイル構造

Profileファイルには、いくつかの主要セクションが含まれています：

1. 基本クエリ情報：ID、時間、データベースなどを含む
2. SQL文とその実行プラン
3. Frontend（FE）がPlan Time、Schedule Timeなどのタスクに費やした時間
4. Backend（BE）処理中の各operatorが費やした実行時間（Merged ProfileとExecution Profileを含む）

5. 実行側に関する詳細情報は主に最後の部分に含まれています。次に、Profileがパフォーマンス分析のためにどのような情報を提供できるかを主に紹介します。

### Merged Profile

ユーザーがパフォーマンスボトルネックをより正確に分析できるようにするため、Dorisは各operatorの集約されたprofile結果を提供します。EXCHANGE_OPERATORを例に取ると：

```sql
EXCHANGE_OPERATOR  (id=4):
    -  BlocksProduced:  sum  0,  avg  0,  max  0,  min  0
    -  CloseTime:  avg  34.133us,  max  38.287us,  min  29.979us
    -  ExecTime:  avg  700.357us,  max  706.351us,  min  694.364us
    -  InitTime:  avg  648.104us,  max  648.604us,  min  647.605us
    -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
    -  PeakMemoryUsage:  sum  0.00  ,  avg  0.00  ,  max  0.00  ,  min  0.00  
    -  OpenTime:  avg  4.541us,  max  5.943us,  min  3.139us
    -  ProjectionTime:  avg  0ns,  max  0ns,  min  0ns
    -  RowsProduced:  sum  0,  avg  0,  max  0,  min  0
    -  WaitForDependencyTime:  avg  0ns,  max  0ns,  min  0ns
    -  WaitForData0:  avg  9.434ms,  max  9.476ms,  min  9.391ms
```
Merged Profileは各operatorの主要なメトリクスを統合し、コアメトリクスとその意味を以下に示します：

| メトリクス名 | メトリクス定義 |
| --------------------- |------------------------------------------------------------|
| BlocksProduced        | 生成されたData Blockの数                             |
| CloseTime             | closeフェーズ中にOperatorが費やした時間          |
| ExecTime              | 全フェーズにわたるOperatorの総実行時間     |
| InitTime              | 初期化フェーズ中にOperatorが費やした時間 |
| MemoryUsage           | 実行中のOperatorのメモリ使用量              |
| OpenTime              | openフェーズ中にOperatorが費やした時間           |
| ProjectionTime        | projectionにOperatorが費やした時間                  |
| RowsProduced          | Operatorによって返された行数                    |
| WaitForDependencyTime | Operatorが実行依存関係を待つ時間     |

Dorisでは、各operatorはユーザーが設定した並行レベルに基づいて並行実行されます。そのため、Merged Profileは全ての並行実行にわたって各メトリクスのMax、Avg、Min値を計算します。

WaitForDependencyTimeは各Operatorで異なります。実行依存関係が異なるためです。例えば、EXCHANGE_OPERATORの場合、依存関係は上流のoperatorによってRPC経由でデータが送信されることです。したがって、この文脈でのWaitForDependencyTimeは特に上流のoperatorがデータを送信するのを待つ時間を指します。

### Execution Profile

Merged Profileとは異なり、Execution Profileは特定の並行実行の詳細なメトリクスを表示します。id=4のexchange operatorを例にとると：

```sql
EXCHANGE_OPERATOR  (id=4):(ExecTime:  706.351us)
      -  BlocksProduced:  0
      -  CloseTime:  38.287us
      -  DataArrivalWaitTime:  0ns
      -  DecompressBytes:  0.00  
      -  DecompressTime:  0ns
      -  DeserializeRowBatchTimer:  0ns
      -  ExecTime:  706.351us
      -  FirstBatchArrivalWaitTime:  0ns
      -  InitTime:  647.605us
      -  LocalBytesReceived:  0.00  
      -  MemoryUsage:  
      -  PeakMemoryUsage:  0.00  
      -  OpenTime:  5.943us
      -  ProjectionTime:  0ns
      -  RemoteBytesReceived:  0.00  
      -  RowsProduced:  0
      -  SendersBlockedTotalTimer(*):  0ns
      -  WaitForDependencyTime:  0ns
      -  WaitForData0:  9.476ms
```
このプロファイルでは、例えば、LocalBytesReceivedはexchangeオペレーター固有のメトリックであり、他のオペレーターには存在しないため、Merged Profileには含まれません。

### PipelineTask実行時間

Dorisでは、PipelineTaskは複数のオペレーターで構成されています。PipelineTaskの実行時間を分析する際は、いくつかの重要な側面に焦点を当てる必要があります：
1. ExecuteTime：PipelineTask全体の実際の実行時間で、このタスク内のすべてのオペレーターのExecTimeの合計とほぼ等しくなります
2. WaitWorkerTime：タスクがworkerによる実行を待つ時間。タスクが実行可能状態にある際、アイドル状態のworkerによる実行を待つ必要があります。この時間は主にクラスタの負荷に依存します。
3. 実行依存関係の待機時間：タスクは、各オペレーターのすべての依存関係が実行条件を満たした場合にのみ実行でき、タスクが実行依存関係を待つ時間は、これらの依存関係の待機時間の合計です。例えば、この例のタスクの1つを簡略化すると：

    ```sql
    PipelineTask  (index=1):(ExecTime:  4.773ms)
      -  ExecuteTime:  1.656ms
          -  CloseTime:  90.402us
          -  GetBlockTime:  11.235us
          -  OpenTime:  1.448ms
          -  PrepareTime:  1.555ms
          -  SinkTime:  14.228us
      -  WaitWorkerTime:  63.868us
        DATA_STREAM_SINK_OPERATOR  (id=8,dst_id=8):(ExecTime:  1.688ms)
          -  WaitForDependencyTime:  0ns
              -  WaitForBroadcastBuffer:  0ns
              -  WaitForRpcBufferQueue:  0ns
        AGGREGATION_OPERATOR  (id=7  ,  nereids_id=648):(ExecTime:  398.12us)
          -  WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time:  10.495ms
    ```
このタスクは2つのオペレーター（DATA_STREAM_SINK_OPERATOR - AGGREGATION_OPERATOR）を含み、そのうちDATA_STREAM_SINK_OPERATORは2つの依存関係（WaitForBroadcastBufferとWaitForRpcBufferQueue）を持ち、AGGREGATION_OPERATORは1つの依存関係（AGGREGATION_OPERATOR_DEPENDENCY）を持つため、現在のタスクの時間消費は以下のように分散されます：

    1. ExecuteTime: 1.656ms（PipelineTask全体の実際の実行時間で、タスク内の全オペレーターのExecTimeの合計にほぼ等しい）
    2. WaitWorkerTime: 63.868us（タスクが実行ワーカーを待つ時間。タスクが実行可能状態にあるとき、利用可能なワーカーが実行するのを待つ時間で、この時間は主にクラスター負荷に依存する）
    3. 実行依存関係の待機時間: 10.495ms（WaitForBroadcastBuffer + WaitForRpcBufferQueue + WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time）。タスクが実行依存関係を待つ時間は、これらの依存関係の待機時間の合計です。

実行レベルのチューニングでProfileを使用する場合については、[Tuning Execution](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)セクションを参照してください。

## システムレベルのパフォーマンスツール

一般的に使用されるシステムツールは、実行中のパフォーマンスボトルネックの特定に役立ちます。例えば、top、free、perf、sar、iostatなどの広く使用されているLinuxツールを活用して、SQLの実行中にシステムのCPU、メモリ、I/O、ネットワーク状態を観察し、パフォーマンスボトルネックの特定を支援できます。

## まとめ

効果的なパフォーマンス分析ツールは、パフォーマンスボトルネックを迅速に特定するために不可欠です。DorisはExplainとProfileを提供し、実行プランの問題分析と実行中に最も時間を消費する操作の特定に対して強力なサポートを提供します。さらに、システムレベル分析ツールの熟練した使用は、パフォーマンスボトルネックの特定に大いに役立ちます。
