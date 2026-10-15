---
{
    "title": "クエリエラー：Process Memory Not Enough",
    "language": "ja",
    "description": "クエリのエラーメッセージに MEMLIMITEXCEEDED と Process memory not enough が含まれる場合、"
}
---

クエリのエラーメッセージに `MEM_LIMIT_EXCEEDED` と `Process memory not enough` が含まれる場合、利用可能なメモリが不足したためにプロセスがキャンセルされたことを意味します。

まず、エラーメッセージを読み取り、キャンセルの理由、キャンセル時にクエリ自体が使用していたメモリ量、プロセスのメモリ状態を確認します。クエリがキャンセルされる理由は、通常、次の三つです。

1. キャンセルされたクエリ自体のメモリ使用量が大きすぎる。

2. キャンセルされたクエリ自体のメモリ使用量は小さいが、より多くのメモリを使用する別のクエリがある。

3. グローバル共有キャッシュやメタデータなどのメモリ使用量が大きすぎる、またはクエリとロード以外のタスクのメモリ使用量が大きすぎる。

## エラーメッセージの分析

プロセスの利用可能なメモリが不足する状況は二つあります。プロセスの現在のメモリ使用量が設定されたメモリ上限を超える場合と、システムの残りの利用可能なメモリがウォーターマークを下回る場合です。クエリなどのタスクがキャンセルされる経路は三つあります。

- エラーメッセージに `cancel top memory used` が含まれる場合、メモリの Full GC 中にタスクがキャンセルされたことを意味します。

- エラーメッセージに `cancel top memory overcommit` が含まれる場合、メモリの Minor GC 中にタスクがキャンセルされたことを意味します。

- エラーメッセージに `Allocator sys memory check failed` が含まれる場合、`Doris Allocator` によるメモリ確保に失敗した後でタスクがキャンセルされたことを意味します。

以下のエラーメッセージを分析した後、次のように対応します。

- クエリまたはロード自体が使用するメモリがプロセスメモリの大きな割合を占める場合は、[クエリ自体のメモリ使用量が大きすぎる]を参照してクエリとロードのメモリ使用量を分析し、パラメータの調整や SQL の最適化によって実行に必要なメモリを減らします。

- タスク自体のメモリ使用量がごく小さい場合は、[クエリとロード以外のプロセスメモリ使用量が大きすぎる]を参照し、プロセス内のほかの領域のメモリ使用量を減らして、クエリなどのタスクの実行に使えるメモリを増やします。

メモリ制限、ウォーターマークの計算方法、メモリ GC の詳細については、[メモリ制御戦略](./../memory-feature/memory-control-strategy.md)を参照してください。

### 1 メモリの Full GC 中にキャンセルされた場合

BE プロセスのメモリ使用量がプロセスメモリの上限（MemLimit）を超えるか、システムの残りの利用可能なメモリがメモリの低ウォーターマーク（LowWaterMark）を下回ると、Full GC がトリガーされます。このとき、メモリ使用量が最も大きいタスクからキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```

エラーメッセージの分析：

1. `(10.16.10.8)`：クエリ実行中にメモリが不足した BE ノードです。

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`：現在キャンセルされたクエリの ID を示します。このクエリ自体のメモリ使用量は 866.97 MB です。

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB`：プロセスメモリが上限を超えた理由は、BE プロセスが使用する物理メモリ 3.12 GB が MemLimit の 3.01 GB を超えたためです。現在のオペレーティングシステムには、BE が使用できるメモリが 191.25 GB あり、LowWaterMark の 3.20 GB を上回っています。

### 2 メモリの Minor GC 中にキャンセルされた場合

Doris BE プロセスのメモリ使用量がプロセスメモリのソフトリミット（SoftMemLimit）を超えるか、システムの残りの利用可能なメモリがメモリの警告ウォーターマーク（WarningWaterMark）を下回ると、Minor GC がトリガーされます。このとき、メモリ上限に対する使用率が最も高いクエリからキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```

エラーメッセージの分析：`process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` プロセスメモリが上限を超えた理由は、現在のオペレーティングシステムで BE が使用できる残りのメモリが 3.25 GB であり、WarningWaterMark の 6.40 GB を下回ったためです。BE プロセスが使用する物理メモリは 2.12 GB で、SoftMemLimit の 2.71 GB は超えていません。

### 3 Allocator によるメモリ確保に失敗した場合

Doris BE の大きなメモリ要求は `Doris Allocator` を通じて割り当てられ、割り当て時にメモリサイズが検査されます。プロセスで利用可能なメモリが不足している場合は例外がスローされ、現在のクエリのキャンセルが試みられます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3 b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```

エラーメッセージの分析：

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`：現在キャンセルされているクエリの ID を示します。このクエリの現在のメモリ使用量は 386704704 Bytes、ピーク時のメモリ使用量は 405956032 Bytes で、実行中のオペレーターは `VAGGREGATION_NODE (id=7)>` です。

2. `Cannot alloc:4294967296`：現在のプロセスメモリ使用量 2.23 GB に要求された 4 GB を加えると MemLimit の 3.01 GB を超えるため、4 GB のメモリ確保に失敗しました。

## キャンセルされたクエリのメモリ使用量が大きすぎる場合

[クエリメモリの分析](./query-memory-analysis.md)または[ロードメモリの分析](./load-memory-analysis.md)を参照してクエリとロードのメモリ使用量を分析し、パラメータの調整や SQL の最適化によって実行に必要なメモリを減らします。

タスクが Allocator によるメモリ確保に失敗してキャンセルされた場合、`Cannot alloc` または `try alloc` には、その時点でクエリが確保しようとしていたメモリ量が表示されます。このメモリ要求が妥当かどうかに注意してください。`Allocator sys memory check failed` を `be/log/be.INFO` で検索すると、メモリ確保要求のスタックを確認できます。

## キャンセルされたクエリ自体のメモリ使用量は小さいが、より多くのメモリを使用する別のクエリがある場合

通常、より多くのメモリを使用するクエリがキャンセル段階で停止し、メモリを速やかに解放できていないことが原因です。Full GC では、まずメモリ使用量の多い順にクエリをキャンセルし、次にメモリ使用量の多い順にロードをキャンセルします。メモリの Full GC 中にクエリがキャンセルされたにもかかわらず、BE プロセス内にそのクエリよりも多くのメモリを使用する別のクエリがある場合は、その別のクエリがキャンセル処理中に停止していないか確認してください。

まず、`grep {queryID} be/log/be.INFO` を実行してクエリがキャンセルされた時刻を調べ、前後のログから `Memory Tracker Summary` を検索してプロセスメモリの統計ログを見つけます。`Memory Tracker Summary` に、より多くのメモリを使用するクエリがある場合は、`grep {queryID with larger memory} be/log/be.INFO` を実行して `Cancel` を含むログがあるか確認します。そのログに記録された時刻が、そのクエリのキャンセル時刻です。そのクエリもキャンセルされており、そのキャンセル時刻が現在のクエリのキャンセル時刻と異なる場合は、[クエリのキャンセル処理が停止する場合]について[メモリ問題の FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)を参照し、メモリ使用量の多いクエリがキャッシュ処理中に停止していないか分析します。`Memory Tracker Summary` の分析については、[メモリログの分析](./memory-log-analysis.md)を参照してください。

## クエリとロード以外のプロセスメモリ使用量が大きすぎる場合

メモリを使用している箇所を特定し、使用量を減らして、クエリとロードの実行に使えるメモリを増やすことを検討してください。

利用可能なメモリの不足によってタスクがキャンセルされた時刻は、`be/log/be.INFO` のプロセスメモリ統計ログで確認できます。`grep queryID be/log/be.INFO` を実行してクエリのキャンセル時刻を調べ、前後のログから `Memory Tracker Summary` を検索してプロセスメモリの統計ログを見つけます。その後、[プロセスメモリ統計ログの分析]セクションについて[メモリログの分析](./memory-log-analysis.md)を参照し、さらに分析します。分析する前に、[Memory Tracker の統計情報の欠落]セクションについて[Memory Tracker](./../memory-feature/memory-tracker.md)を参照し、Memory Tracker の統計情報に欠落がないか確認してください。

Memory Tracker の統計情報に欠落がある場合は、[Memory Tracker の統計情報の欠落]セクションを参照して、さらに分析してください。欠落がない場合は、Memory Tracker がメモリの大部分を集計しています。[概要](./../overview.md)を参照し、Doris BE プロセスの各部分でメモリ使用量が大きくなる原因と、使用量を減らす方法を分析してください。
