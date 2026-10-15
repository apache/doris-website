---
{
    "title": "遅い SQL の分析ツール：Explain と Profile",
    "language": "ja",
    "description": "Doris で遅い SQL の性能ボトルネックをどう分析するかを説明します。Explain、Profile、システムレベルのツールを使い、プランと実行の各段階で問題を特定する方法を紹介します。",
    "keywords": ["Doris の性能分析", "Doris Explain", "Doris Profile", "遅い SQL の分析", "Merged Profile", "Execution Profile", "PipelineTask"]
}
---

<!-- Knowledge type: concept + tool usage guide -->
<!-- Applicable scenario: After a slow SQL has been located, further analysis is needed to determine whether the bottleneck lies in the plan layer, execution layer, or system layer -->

性能分析ツールは、遅い SQL を特定した後、性能ボトルネックの所在をさらに絞り込むために使用します。前のセクションの[診断ツール](diagnostic-tools.md)は、業務担当者や運用担当者が具体的な遅い SQL を特定するのに役立ちます。この章では、その SQL の性能ボトルネックを分析する方法を説明します。

**分析開始前の確認事項**：分析を始める前に、次の点を確認してください。

- 診断ツールを使って、分析対象の遅い SQL を特定していること。
- Doris FE にアクセスでき、`EXPLAIN` を実行する権限があること。
- 対象 SQL の Profile を取得できること（Profile の収集が有効になっていること）。
- BE ノードにアクセスして、システムレベルの性能指標（CPU、メモリ、IO、ネットワーク）を確認できること。

### SQL 実行の二段階と三種類のボトルネック

SQL 文の実行は、次の二段階に分かれます。

1. **プラン生成段階**：実行プランを生成します。
2. **プラン実行段階**：生成されたプランを実行します。

どちらの段階の問題も、性能ボトルネックにつながります。

- **適切でないプラン**：実行エンジンがどれほど優れていても、良好な性能は得られません。
- **適切でない実行方法**：プランが正しくても、ボトルネックが生じやすくなります。
- **インフラストラクチャの欠陥や設定ミス**：実行エンジンの性能は、ハードウェアやシステム構成と密接に関係します。

### ツールとボトルネックの種類の対応

| ボトルネックの種類 | 推奨する分析ツール | 主な用途 |
| ------------------- | ------------------------- | ------------------------------------------------------- |
| プラン層のボトルネック | Doris Explain | SQL の実行プランを確認し、プラン生成時の問題を特定する |
| 実行層のボトルネック | Doris Profile | 各オペレーターの実行時の詳細情報を確認する |
| システムレベルのボトルネック | top/free/perf/sar など | システムの CPU、メモリ、IO、ネットワークの実行時の状態を確認する |

以下のセクションで、これら三種類のツールを説明します。

## Doris Explain：プラン層のボトルネックを分析する

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When a slow SQL is suspected to be caused by a suboptimal plan, and the execution plan details need to be examined -->

### 概要

実行プランは、SQL 文をどのような方法と手順で実行するかを示します。たとえば、二つのテーブルを結合する SQL 文の場合、実行プランには各テーブルへのアクセス方法、結合方法、結合順序が示されます。

### 用途

Doris Explain ツールを使うと、SQL 実行プランの詳細を確認できます。Explain の出力を分析することで、プラン層のボトルネックを特定し、状況に応じてプランをチューニングできます。

### Explain の種類の比較

Doris は、分析場面に応じて粒度の異なる Explain を提供します。

| Explain の種類 | 出力内容 | 適用場面 |
| -------------------- | ------------------------------------ | ------------------------------------ |
| Explain Verbose | 最終的な物理プラン | BE に渡される実際の物理プランを確認する |
| Explain All Plan | 各段階の論理プラン | 論理プランの変化を追跡する |
| Explain Memo Plan | コストベース最適化の過程におけるプラン | CBO オプティマイザーの判断を分析する |
| Explain Shape Plan | プランの形状 | プランの骨格と構造をすばやく確認する |

各種 Explain の具体的な使用方法と出力の説明については、実行プランの Explain に関するドキュメントを参照してください。

### プラン層でよくあるボトルネック

Explain の出力を分析すると、次のような一般的なプラン層のボトルネックを特定できます。

- **フィルターが基になるテーブルまでプッシュダウンされていない**：データが事前に絞り込まれず、計算対象のデータ量が多くなります。
- **結合条件が結合相手側に導出されていない**：二つのテーブルを等価内部結合する場合、一方のフィルター条件がもう一方に導出されず、相手側のテーブルのデータが事前に絞り込まれません。

Doris Explain を使ったプラン層のチューニング事例については、[プランのチューニング](../tuning/tuning-plan/optimizing-table-schema.md)の章を参照してください。

## Doris Profile：実行層のボトルネックを分析する

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: The plan has no obvious issues, but the SQL executes slowly, and the runtime time consumption of each operator needs to be examined -->

### 概要

Profile は、SQL の実際の実行中における各オペレーターの所要時間と実行時指標を記録したもので、実行層の性能ボトルネックの特定に使用します。

### Explain との違い

Explain は SQL 実行の**計画**を示します（たとえば、t1 と t2 の結合を、t1 を build 側、t2 を probe 側とする Hash Join として計画する場合）。Profile は SQL 実行の**実際の過程**を示します（たとえば、build と probe にそれぞれどれだけ時間がかかったか）。

### Profile ファイルの構成

Profile ファイルは、主に次の部分で構成されます。

1. **クエリの基本情報**：ID、時刻、データベースなど。
2. **SQL 文と実行プラン**。
3. **FE の所要時間**：Plan Time、Schedule Time など。
4. **各 BE オペレーターの実行時間**：Merged Profile と Execution Profile を含みます。

実行側の詳細情報は、主に最後の部分にあります。以下では、Profile が提供する実行情報を中心に説明します。

### Merged Profile

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Quickly view the aggregated performance metrics of an operator across all concurrent instances -->

Merged Profile は、すべての並列インスタンスについて集計された各オペレーターの主要指標を示し、ボトルネックをすばやく特定するのに役立ちます。Doris では、各オペレーターはユーザーが設定した並列度に従って並列実行されます。Merged Profile は各指標の Max、Avg、Min を計算します。

**例**（EXCHANGE_OPERATOR を使用）：

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

**主な指標の説明**：

| 指標名 | 意味 |
| --------------------- | ----------------------------------------------------------- |
| BlocksProduced | 生成されたデータブロックの数 |
| CloseTime | オペレーターの close フェーズにかかった時間 |
| ExecTime | オペレーターの全フェーズを通じた合計実行時間 |
| InitTime | オペレーターの Init フェーズにかかった時間 |
| MemoryUsage | 実行フェーズにおけるオペレーターのメモリ使用量 |
| OpenTime | オペレーターの Open フェーズにかかった時間 |
| ProjectionTime | オペレーターの射影にかかった時間 |
| RowsProduced | オペレーターが返した行数 |
| WaitForDependencyTime | オペレーター自身の実行依存関係を待つ時間 |

`WaitForDependencyTime` が表す内容は、オペレーターによって異なります。たとえば、上記の EXCHANGE_OPERATOR では、依存先は RPC でデータを送信する上流オペレーターであるため、この指標は実質的に上流オペレーターからのデータ送信を待つ時間を表します。

### Execution Profile

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Locate fine-grained performance issues in a specific concurrent instance, or view operator-specialized metrics -->

Execution Profile は、特定の並列インスタンスの詳細な指標を示します。Merged Profile より粒度が細かく、オペレーター固有の指標も含まれます。

**例**（id=4 の EXCHANGE_OPERATOR を使用）：

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

たとえば、`LocalBytesReceived` は EXCHANGE_OPERATOR 固有の指標で、ほかのオペレーターにはありません。そのため、Merged Profile には含まれません。

### PipelineTask の実行時間

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: Analyze the time distribution of a single PipelineTask, distinguishing actual execution, waiting for a Worker, and waiting for dependencies -->

Doris では、PipelineTask は複数のオペレーターで構成されます。PipelineTask の実行時間を分析するには、次の三点に注目してください。

| 注目する項目 | 説明 |
| ----------------------- | -------------------------------------------------------------------------------------------- |
| ExecuteTime | PipelineTask の実際の実行時間。タスク内のすべてのオペレーターの ExecTime の合計にほぼ等しい |
| WaitWorkerTime | タスクが実行用 Worker を待つ時間。主にクラスターの負荷によって決まる |
| 実行依存関係を待つ時間 | すべてのオペレーターの依存関係を待つ時間の合計（すべての依存関係が満たされて初めてタスクを実行できる） |

**簡略化した例**：

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

このタスクには、DATA_STREAM_SINK_OPERATOR と AGGREGATION_OPERATOR の二つのオペレーターがあります。DATA_STREAM_SINK_OPERATOR には二つの依存関係（WaitForBroadcastBuffer と WaitForRpcBufferQueue）があり、AGGREGATION_OPERATOR には一つの依存関係（AGGREGATION_OPERATOR_DEPENDENCY）があります。このタスクの時間配分は次のとおりです。

| 時間の種類 | 値 | 説明 |
| ---------------------- | ---------- | ----------------------------------------------------------------- |
| 合計実行時間 | 1.656 ms | 二つのオペレーターの ExecTime の合計にほぼ等しい |
| Worker を待つ時間 | 63.868 us | 現在のクラスター負荷は高くなく、タスクの準備ができると Worker がすぐに実行する |
| 実行依存関係を待つ時間 | 10.495 ms | すべての依存関係を待つ時間の合計に等しい |

Profile を使った実行層のチューニング事例については、[実行のチューニング](../tuning/tuning-execution/adjustment-of-runtimefilter-wait-time.md)の章を参照してください。

## システムレベルの性能分析ツール

<!-- Knowledge type: tool usage -->
<!-- Applicable scenario: When the performance bottleneck is suspected to be at the system layer (CPU/memory/IO/network), to assist in locating issues during execution -->

システムレベルのツールは、システムリソースの実行時の状態を確認し、SQL 実行中の性能ボトルネックを特定するのに役立ちます。

| システムリソース | 一般的な Linux ツール | 主な用途 |
| --------------- | ------------------- | --------------------------------------------- |
| CPU | top, perf, sar | CPU 使用率と負荷の高い関数を確認する |
| メモリ | top, free, sar | メモリ使用量とスワップの動作を確認する |
| ディスク IO | iostat, sar | ディスクの読み書き速度と待機時間を確認する |
| ネットワーク | sar, netstat | ネットワークのトラフィックと接続状態を確認する |

## よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: Common questions encountered when using analysis tools -->

### Q1：Explain、Profile、システムツールのどれから使うべきですか？

優先順位の高い順に調べます。まず **Explain** でプランの問題を除外します。プランが妥当であれば、**Profile** で遅いオペレーターを特定します。オペレーター自体の所要時間は妥当なのに全体の実行がまだ遅い場合は、**システムツール**を確認します。

### Q2：Merged Profile と Execution Profile のどちらを選ぶべきですか？

まず **Merged Profile** でオペレーター間の所要時間の違いをすばやく確認します。特定の並列インスタンスに異常があると疑われる場合や、オペレーター固有の指標を確認する必要がある場合は、**Execution Profile** を確認します。

### Q3：PipelineTask 全体の実行が遅いのに、ExecuteTime が長くありません。なぜですか？

通常は、**WaitWorkerTime が長い**（クラスター負荷が高い）か、**依存関係を待つ時間が長い**（上流オペレーターが適時にデータを生成していない）ことが原因です。依存関係の名前を手がかりに、上流のボトルネックを特定してください。

### Q4：WaitForDependencyTime が 0 なのに、WaitForData0 が非常に長いのはなぜですか？

`WaitForData0` は、EXCHANGE_OPERATOR が上流からの RPC データを待つ特定の依存関係を表します。この指標が大きい場合は、通常、上流オペレーターによるデータ生成が遅いため、上流オペレーターをさらに調べてください。

## まとめ

<!-- Knowledge type: summary -->

性能分析ツールは、性能ボトルネックをすばやく特定するために重要です。

- **Doris Explain**：プラン層のボトルネックを特定します。
- **Doris Profile**：実行層のボトルネックを特定します（Merged Profile、Execution Profile、PipelineTask の時間）。
- **システムレベルのツール**：ハードウェアとオペレーティングシステムの層にあるボトルネックの特定を支援します。

これら三種類のツールを組み合わせると、Doris で遅い SQL の性能ボトルネックを実行の各段階にわたって特定し、解消できます。
