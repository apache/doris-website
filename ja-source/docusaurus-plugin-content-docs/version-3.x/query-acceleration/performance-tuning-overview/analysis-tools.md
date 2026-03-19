---
{
  "title": "解析ツール",
  "description": "前のセクションの診断ツールに関する説明は、ビジネスおよび運用担当者が特定の低速なSQLクエリを特定するのに役立ちました。",
  "language": "ja"
}
---
## 概要

[diagnostic tools](diagnostic-tools.md)に関する前のセクションでは、ビジネスおよび運用担当者が特定の低速SQLクエリを特定するのに役立ちました。このセクションでは、低速SQLのパフォーマンスボトルネックを分析して、SQL実行プロセスのどの部分が速度低下を引き起こしているかを判断する方法を紹介します。

SQLクエリの実行プロセスは、大まかに2つの段階に分けることができます：プラン生成とプラン実行です。前者は実行プランの生成を担当し、後者は特定のプランを実行します。どちらの部分の問題もパフォーマンスボトルネックにつながる可能性があります。たとえば、不適切なプランが生成された場合、エグゼキュータがどれほど優秀であっても、良好なパフォーマンスを実現することはできません。同様に、正しいプランであっても、不適切な実行方法はパフォーマンスボトルネックにつながる可能性があります。さらに、エグゼキュータのパフォーマンスは現在のハードウェアとシステムアーキテクチャに密接に関連しています。インフラストラクチャの不備や不適切な設定もパフォーマンス問題を引き起こす可能性があります。

これら3つのタイプの問題はすべて、優れた分析ツールのサポートを必要とします。これに基づき、Dorisシステムは、プランニングと実行のボトルネックをそれぞれ分析するための2つのパフォーマンス分析ツールを提供しています。さらに、システムレベルでも、パフォーマンスボトルネックの特定を支援する対応するパフォーマンス監視ツールを提供しています。以下のセクションでは、これらの3つの側面を紹介します：

## Doris Explain

実行プランは、SQLクエリの特定の実行方法とプロセスを記述します。たとえば、2つのtableを結合するSQLクエリの場合、実行プランは、tableへのアクセス方法、結合方法、結合順序などの情報を表示します。

Dorisは、SQLクエリの実行プランに関する詳細情報を便利に表示するExplainツールを提供しています。Explainによって出力されるプランを分析することで、ユーザーはプランニングレベルでのボトルネックを迅速に特定し、さまざまな状況に基づいてプランレベルのチューニングを実行できます。

Dorisは、Explain Verbose、Explain All Plan、Explain Memo Plan、Explain Shape Planなど、さまざまな粒度レベルの複数のExplainツールを提供しており、これらは最終的な物理プラン、さまざまな段階での論理プラン、コスト最適化プロセスに基づくプラン、プラン形状をそれぞれ表示するために使用されます。詳細情報については、実行プランExplainセクションを参照して、さまざまなExplainツールの使用方法とその出力情報の解釈について学習してください。

Explainの出力を分析することで、ビジネス担当者とDBAは現在のプランのパフォーマンスボトルネックを迅速に特定できます。たとえば、実行プランを分析することで、フィルタがベースtableにプッシュダウンされていないため、データが早期にフィルタリングされず、過剰な量のデータが計算に関与してパフォーマンス問題が発生していることが発見される場合があります。別の例として、2つのtableのInner equi-joinにおいて、結合条件の一方側のフィルタ条件が他方側に導出されていないため、他方のtableのデータが早期にフィルタリングされず、最適でないパフォーマンスにつながる可能性があります。このようなパフォーマンスボトルネックは、Explainの出力を分析することで特定および解決できます。

Doris Explainの出力を使用してプランレベルのチューニングを実行するケースについては、[Plan Tuning](../tuning/tuning-plan/optimizing-table-schema.md)セクションを参照してください。

## Doris Profile

上記で説明したExplainツールは、SQLクエリの実行プランの概要を示します。たとえば、Tablet1とt2間の結合操作をHash Joinとして計画し、t1をbuild側、t2をprobe側として指定します。SQLクエリが実際に実行される際、各具体的な実行ステップにかかる時間を理解すること、たとえば、buildフェーズの継続時間やprobeフェーズの継続時間などを知ることは、パフォーマンス分析とチューニングにとって重要です。Profileツールは、この目的のために詳細な実行情報を提供します。以下のセクションでは、最初にProfileファイル構造の概要を説明し、次にMerged Profile、Execution Profile、PipelineTaskでの実行時間の意味を紹介します。

### Profileファイル構造

Profileファイルには、いくつかの主要なセクションが含まれています：

1. 基本クエリ情報：ID、時間、データベースなどを含む
2. SQLステートメントとその実行プラン
3. Frontend（FE）がPlan Time、Schedule Timeなどのタスクに費やした時間
4. Backend（BE）処理中の各オペレータが費やした実行時間（Merged ProfileとExecution Profileを含む）

5. 実行側に関する詳細情報は主に最後の部分に含まれています。次に、Profileがパフォーマンス分析に提供できる情報について主に紹介します。

### Merged Profile

ユーザーがパフォーマンスボトルネックをより正確に分析できるよう、Dorisは各オペレータに対する集約されたprofile結果を提供しています。EXCHANGE_OPERATORを例に取ると：

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

| Metric Name           | Metric Definition                                          |
| --------------------- |------------------------------------------------------------|
| BlocksProduced        | 生成されたData Blockの数                                    |
| CloseTime             | closeフェーズでOperatorが費やした時間                        |
| ExecTime              | 全フェーズにわたるOperatorの総実行時間                       |
| InitTime              | 初期化フェーズでOperatorが費やした時間                       |
| MemoryUsage           | 実行中のOperatorのメモリ使用量                              |
| OpenTime              | openフェーズでOperatorが費やした時間                         |
| ProjectionTime        | Operatorがprojectionに費やした時間                          |
| RowsProduced          | Operatorによって返される行数                                |
| WaitForDependencyTime | Operatorが実行依存関係を待機する時間                         |

Dorisでは、各operatorはユーザーが設定した並行性レベルに基づいて並行実行されます。そのため、Merged Profileは全ての並行実行にわたって各メトリクスのMax、Avg、Min値を計算します。

WaitForDependencyTimeは各Operatorによって異なります。実行依存関係が異なるためです。例えば、EXCHANGE_OPERATORの場合、依存関係は上流のoperatorがRPC経由でデータを送信することにあります。したがって、この文脈におけるWaitForDependencyTimeは、具体的には上流のoperatorがデータを送信するのを待機する時間を指します。

### Execution Profile

Merged Profileとは異なり、Execution Profileは特定の並行実行に関する詳細なメトリクスを表示します。id=4のexchange operatorを例にとると：

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
このプロファイルにおいて、例えば、LocalBytesReceivedはexchange operatorに固有のメトリックであり、他のoperatorには存在しないため、Merged Profileには含まれません。

### PipelineTask実行時間

Dorisにおいて、PipelineTaskは複数のoperatorで構成されます。PipelineTaskの実行時間を分析する際は、以下のいくつかの重要な側面に注目する必要があります：
1. ExecuteTime：PipelineTask全体の実際の実行時間であり、このタスク内のすべてのoperatorのExecTimeの合計にほぼ等しくなります
2. WaitWorkerTime：タスクがworkerによる実行を待つ時間です。タスクが実行可能状態にあるとき、アイドル状態のworkerが実行するのを待つ必要があります。この時間は主にクラスターの負荷に依存します。
3. 実行依存関係の待機時間：タスクは各operatorのすべての依存関係が実行条件を満たした場合にのみ実行でき、タスクが実行依存関係を待機する時間は、これらの依存関係の待機時間の合計となります。例えば、この例のタスクの1つを簡素化すると：

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
このタスクは2つのオペレーター（DATA_STREAM_SINK_OPERATOR - AGGREGATION_OPERATOR）を含んでおり、そのうちDATA_STREAM_SINK_OPERATORは2つの依存関係（WaitForBroadcastBufferとWaitForRpcBufferQueue）を持ち、AGGREGATION_OPERATORは1つの依存関係（AGGREGATION_OPERATOR_DEPENDENCY）を持つため、現在のタスクの時間消費は以下のように分散されています：

    1. ExecuteTime: 1.656ms（PipelineTask全体の実際の実行時間で、タスク内のすべてのオペレーターのExecTimeの合計におおよそ等しい）。
    2. WaitWorkerTime: 63.868us（タスクが実行ワーカーを待つ時間。タスクが実行可能状態にある時、実行する利用可能なワーカーを待つ時間で、この期間は主にクラスターの負荷に依存する）。
    3. Time Waiting for Execution Dependencies: 10.495ms（WaitForBroadcastBuffer + WaitForRpcBufferQueue + WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time）。タスクが実行依存関係を待つ時間は、これらの依存関係の待機時間の合計です。

Profileを使用した実行レベルのチューニングのケースについては、[Tuning Execution](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)セクションを参照してください。

## システムレベルのパフォーマンスツール

一般的に使用されるシステムツールは、実行中のパフォーマンスボトルネックの特定に役立ちます。例えば、top、free、perf、sar、iostatなどの広く使用されているLinuxツールを利用して、SQL実行中のシステムのCPU、メモリ、I/O、ネットワークステータスを観察し、パフォーマンスボトルネックの特定を支援できます。

## まとめ

効果的なパフォーマンス分析ツールは、パフォーマンスボトルネックの迅速な特定に不可欠です。DorisはExplainとProfileを提供し、実行プランの問題分析と実行中に最も時間を消費する操作の特定に対して強力なサポートを提供します。さらに、システムレベルの分析ツールの熟練した使用は、パフォーマンスボトルネックの特定に大いに役立ちます。
