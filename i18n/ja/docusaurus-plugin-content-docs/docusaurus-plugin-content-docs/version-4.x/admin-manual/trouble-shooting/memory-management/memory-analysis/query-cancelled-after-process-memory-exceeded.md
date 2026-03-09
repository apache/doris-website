---
{
  "title": "クエリエラー プロセスメモリが不足しています",
  "language": "ja",
  "description": "クエリのエラーメッセージにMEMLIMITEXCEEDEDが表示され、Process memory not enoughが含まれている場合、"
}
---
`MEM_LIMIT_EXCEEDED`がクエリのエラーメッセージに現れ、`Process memory not enough`が含まれている場合、利用可能メモリ不足によりプロセスがキャンセルされたことを意味します。

まず、エラーメッセージを解析してCancelの理由、Cancelされた時点でのクエリ自体が使用していたメモリサイズ、プロセスのメモリ状況を確認してください。クエリのCancelには通常3つの理由があります：

1. CancelされたQuery自体のメモリが大きすぎる。

2. CancelされたQuery自体のメモリは小さく、他により大きなメモリを持つクエリがある。

3. グローバルに共有されるCahce、メタデータなどのメモリが大きすぎる、またはクエリやロードタスク以外の他のタスクのメモリが大きすぎる

## エラーメッセージ解析

プロセスの利用可能メモリが不足する状況は2つあります。1つはプロセスの現在のメモリが設定されたメモリ制限を超えている場合、もう1つはシステムの残り利用可能メモリがwatermarkを下回っている場合です。クエリなどのタスクをキャンセルするパスは3つあります：

- エラーメッセージに`cancel top memory used`が含まれている場合、メモリFull GCでタスクがキャンセルされたことを意味します。

- エラーメッセージに`cancel top memory overcommit`が含まれている場合、メモリMinor GCでタスクがキャンセルされたことを意味します。

- エラーメッセージに`Allocator sys memory check failed`が含まれている場合、`Doris Allocator`からのメモリ申請に失敗した後にタスクがキャンセルされたことを意味します。

以下のエラーメッセージを解析した後、

- クエリとロード自体が使用するメモリがプロセスメモリの大部分を占めている場合は、[Query own memory is too large]を参照してクエリとロードのメモリ使用量を解析し、パラメータの調整やSQLの最適化により実行に必要なメモリを削減してください。

- タスク自体が使用するメモリが非常に少ない場合は、[Process memory other than query and load is too large]を参照して、プロセス内の他の場所でのメモリ使用量を削減し、クエリや他のタスク実行のためにより多くのメモリを確保してください。

メモリ制限、watermark計算方法、メモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください

### 1 メモリFull GCでのCancel

BEプロセスメモリがプロセスメモリ上限（MemLimit）を超えるか、システムの残り利用可能メモリがメモリlow watermark（LowWaterMark）を下回った場合、Full GCがトリガーされます。この時、最もメモリを使用するタスクが最初にキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```
エラーメッセージ分析:

1. `(10.16.10.8)`: クエリ実行中にメモリが不足したBEノード。

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`: 現在キャンセルされたqueryID、クエリ自体は866.97 MBのメモリを使用しています。

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` プロセスメモリが制限を超えた理由は、BEプロセスが使用する物理メモリ3.12 GBがMemLimitの3.01 GBを超えているためです。現在のオペレーティングシステムには、BEが使用可能なメモリが191.25 GBあり、これはLowWaterMarkの3.20 GBよりもまだ高い値です。

### 2 Minor GCのメモリでキャンセル

Doris BEプロセスメモリがプロセスメモリソフト制限（SoftMemLimit）を超えるか、システムの残り利用可能メモリがメモリ警告ウォーターマーク（WarningWaterMark）を下回ると、Minor GCがトリガーされます。この時、メモリ制限比率が最も大きいクエリが最初にキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```
エラーメッセージ分析: `process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` プロセスメモリが制限を超える理由は、現在のオペレーティングシステムでBEが利用可能な残りメモリが3.25 GBであり、これがWarningWaterMarkの6.40 GBを下回っており、BEプロセスが使用している物理メモリが2.12 GBで、SoftMemLimitの2.71 GBを超えていないためです。

### 3 Allocatorからのメモリ割り当てに失敗

Doris BEの大容量メモリ要求は`Doris Allocator`を通じて割り当てられ、割り当て時にメモリサイズがチェックされます。プロセスで利用可能なメモリが不足している場合、例外がスローされ、現在のクエリのキャンセルが試行されます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3 b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```
エラーメッセージの分析：

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`：現在キャンセルされているqueryID、クエリが現在使用している386704704バイトのメモリ、クエリメモリのピークは405956032バイト、実行中のオペレーターは`VAGGREGATION_NODE (id=7)>`です。

2. `Cannot alloc:4294967296`：現在の4GBメモリの申請が失敗しました。現在のプロセスメモリ2.23GBに4GBを加えると、MemLimitの3.01GBを超えるためです。

## CanceledされたQueryのメモリ使用量が大きすぎる

[Query Memory Analysis](./query-memory-analysis.md)または[Load Memory Analysis](./load-memory-analysis.md)を参照してクエリとロードのメモリ使用量を分析し、パラメータの調整やSQLの最適化を試して実行に必要なメモリを削減してください。

タスクがAllocatorからのメモリ申請に失敗してCanceledされた場合、`Cannot alloc`または`try alloc`にはQueryが現在申請しているメモリが大きすぎることが示されることに注意してください。この時、ここでのメモリ申請が妥当かどうかに注意する必要があります。`be/log/be.INFO`で`Allocator sys memory check failed`を検索して、メモリ申請のスタックを見つけてください。

## CanceledされたQuery自体のメモリは少なく、より大きなメモリを持つ他のクエリが存在する

通常、メモリ使用量の大きいクエリがCancel段階でスタックし、メモリをタイムリーに解放できないことが原因です。Full GCはまずメモリ使用量の順序でクエリをキャンセルし、次にメモリ使用量の順序でロードをキャンセルします。メモリFull GCでクエリがキャンセルされたが、BEプロセス内に現在キャンセルされたクエリよりも多くのメモリを使用する他のクエリがある場合、これらのメモリ使用量の大きいクエリがキャンセルプロセス中にスタックしていないかどうかに注意する必要があります。

まず、`grep {queryID} be/log/be.INFO`を実行してクエリがキャンセルされた時刻を見つけ、次にコンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。`Memory Tracker Summary`により多くのメモリを使用するクエリがある場合、`grep {queryID with larger memory} be/log/be.INFO`を実行して`Cancel`キーワードを含むログがあるかどうかを確認します。対応する時刻がクエリがキャンセルされた時刻です。そのクエリもキャンセルされており、メモリ使用量の大きいクエリがキャンセルされた時刻と現在のクエリがキャンセルされた時刻が異なる場合、[Memory Issue FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]を参照して、メモリ使用量の大きいクエリがキャッシュプロセスでスタックしていないかを分析してください。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

## クエリおよびロードタスク以外のプロセスメモリが大きすぎる

メモリの場所を特定し、メモリ使用量を削減してクエリとロード実行により多くのメモリを確保することを検討してください。

利用可能メモリ不足によりタスクがキャンセルされた時刻は、`be/log/be.INFO`のプロセスメモリ統計ログで確認できます。`grep queryID be/log/be.INFO`を実行してクエリがキャンセルされた時刻を見つけ、次にコンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。その後、[Memory Log Analysis](./memory-log-analysis.md)の[Process Memory Statistics Log Analysis]セクションを参照してさらなる分析を行ってください。分析前に、[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照して、Memory Trackerに統計の欠落があるかどうかを分析してください。

Memory Trackerに統計の欠落がある場合は、[Memory Tracker Statistics Missing]セクションを参照してさらなる分析を行ってください。そうでなければ、Memory Trackerがほとんどのメモリをカウントしており、統計の欠落はありません。[Overview](./../overview.md)を参照して、Doris BEプロセスの異なる部分があまりに多くのメモリを占有する理由と、そのメモリ使用量を削減する方法を分析してください。
