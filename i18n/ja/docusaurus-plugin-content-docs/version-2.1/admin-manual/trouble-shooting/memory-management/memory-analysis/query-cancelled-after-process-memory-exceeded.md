---
{
  "title": "クエリエラー Process Memory が不足しています",
  "language": "ja",
  "description": "クエリのエラーメッセージにMEMLIMITEXCEEDEDが表示され、Process memory not enoughが含まれている場合、"
}
---
クエリのエラーメッセージに`MEM_LIMIT_EXCEEDED`が表示され、`Process memory not enough`が含まれている場合、使用可能メモリ不足によりプロセスがキャンセルされたことを意味します。

まず、エラーメッセージを解析して、Cancelの理由、Cancel時のクエリ自体が使用していたメモリサイズ、およびプロセスのメモリ状態を確認してください。通常、クエリのCancelには次の3つの理由があります：

1. CancelされたQuery自体のメモリが大きすぎる。

2. CancelされたQuery自体のメモリは小さく、より大きなメモリを持つ他のクエリが存在する。

3. グローバルに共有されるCahce、メタデータなどのメモリが大きすぎる、またはクエリやロードタスク以外の他のタスクのメモリが大きすぎる

## エラーメッセージ分析

プロセスの使用可能メモリが不足する状況には2つあります。1つは、プロセスの現在のメモリが設定されたメモリ制限を超えた場合、もう1つは、システムの残り使用可能メモリがwatermarkを下回った場合です。クエリなどのタスクをキャンセルする経路は3つあります：

- エラーメッセージに`cancel top memory used`が含まれている場合、そのタスクはメモリFull GCでキャンセルされたことを意味します。

- エラーメッセージに`cancel top memory overcommit`が含まれている場合、そのタスクはメモリMinor GCでキャンセルされたことを意味します。

- エラーメッセージに`Allocator sys memory check failed`が含まれている場合、`Doris Allocator`からのメモリ申請に失敗した後にタスクがキャンセルされたことを意味します。

以下のエラーメッセージを分析した後、

- クエリおよびロード自体が使用するメモリがプロセスメモリの大きな割合を占める場合は、[Query own memory is too large]を参照してクエリおよびロードのメモリ使用量を分析し、パラメータの調整やSQLの最適化を試して実行に必要なメモリを削減してください。

- タスク自体のメモリ使用量が非常に少ない場合は、[Process memory other than query and load is too large]を参照してプロセス内の他の場所でのメモリ使用量を削減し、クエリや他のタスク実行により多くのメモリを確保するようにしてください。

メモリ制限、watermark計算方法、およびメモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください

### 1 メモリFull GCでのCancel

BEプロセスメモリがプロセスメモリ上限（MemLimit）を超えるか、システムの残り使用可能メモリがメモリ低watermark（LowWaterMark）を下回った場合、Full GCがトリガーされます。この時、最大のメモリを持つタスクが最初にキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```
エラーメッセージ分析:

1. `(10.16.10.8)`: クエリ実行時にメモリ不足が発生したBEノード。

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`: 現在キャンセルされたqueryID、クエリ自体は866.97 MBのメモリを使用。

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` プロセスメモリが制限を超えた理由は、BEプロセスが使用している物理メモリ3.12 GBがMemLimitの3.01 GBを超過したため。現在のオペレーティングシステムにはBEが使用可能なメモリが191.25 GBあり、これはLowWaterMarkの3.20 GBよりも高い。

### 2 Minor GCのメモリでキャンセル

Doris BEプロセスメモリがプロセスメモリソフト制限（SoftMemLimit）を超えるか、システムの残り使用可能メモリがメモリ警告ウォーターマーク（WarningWaterMark）を下回った場合、Minor GCがトリガーされます。この時、メモリ制限比率が最も大きいクエリが最初にキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```
エラーメッセージ分析：`process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` プロセスメモリが制限を超過する理由は、現在のオペレーティングシステムでBEが利用可能な残りメモリが3.25 GBであり、これがWarningWaterMarkの6.40 GBを下回っており、BEプロセスが使用している物理メモリは2.12 GBで、SoftMemLimitの2.71 GBを超過していないためです。

### 3 Allocatorからのメモリ申請の失敗

Doris BEの大きなメモリリクエストは`Doris Allocator`を通じて割り当てられ、割り当て時にメモリサイズがチェックされます。プロセスで利用可能なメモリが不足している場合、例外がスローされ、現在のクエリのキャンセルが試行されます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3 b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```
エラーメッセージ分析:

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`: 現在キャンセルされているqueryID、クエリは現在386704704 Bytesのメモリを使用し、クエリメモリのピークは405956032 Bytes、実行中のオペレーターは`VAGGREGATION_NODE (id=7)>`です。

2. `Cannot alloc:4294967296`: 現在のプロセスメモリ2.23 GBに4 GBを加えると3.01 GBのMemLimitを超えるため、現在の4 GBメモリ申請が失敗しました。

## キャンセルされたクエリのメモリ使用量が大きすぎる

[Query Memory Analysis](./query-memory-analysis.md)または[Load Memory Analysis](./load-memory-analysis.md)を参照してクエリとロードのメモリ使用量を分析し、パラメータの調整またはSQLの最適化により実行に必要なメモリを削減してください。

タスクがAllocatorからのメモリ申請に失敗してキャンセルされた場合、`Cannot alloc`または`try alloc`はクエリが現在申請中のメモリが大きすぎることを示すことに注意してください。この場合、ここでのメモリ申請が妥当かどうかに注意する必要があります。`be/log/be.INFO`で`Allocator sys memory check failed`を検索してメモリ申請のスタックを見つけてください。

## キャンセルされたクエリ自体のメモリは小さく、より大きなメモリを使用する他のクエリがある

通常、メモリ使用量の多いクエリがキャンセル段階で停止し、メモリを適時に解放できないことが原因です。Full GCはまずメモリ使用量順にクエリをキャンセルし、その後メモリ使用量順にロードをキャンセルします。メモリFull GCでクエリがキャンセルされたが、BEプロセス内に現在キャンセルされたクエリよりも多くのメモリを使用する他のクエリがある場合、これらの大きなメモリ使用量のクエリがキャンセル処理中に停止していないかに注意する必要があります。

まず`grep {queryID} be/log/be.INFO`を実行してクエリがキャンセルされた時刻を見つけ、その後コンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけてください。`Memory Tracker Summary`により多くのメモリを使用するクエリがある場合、`grep {queryID with larger memory} be/log/be.INFO`を実行して`Cancel`キーワードを含むログがあるかを確認してください。対応する時点はクエリがキャンセルされた時刻です。そのクエリもキャンセルされ、より大きなメモリのクエリがキャンセルされた時点が現在のクエリがキャンセルされた時点と異なる場合、[Memory Issue FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]を参照してより大きなメモリのクエリがキャッシュプロセスで停止していないかを分析してください。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

## クエリとロードタスク以外のプロセスメモリが大きすぎる

メモリ位置を特定し、メモリ使用量を削減してクエリとロード実行により多くのメモリを確保することを検討してください。

利用可能メモリ不足によりタスクがキャンセルされた時刻は、`be/log/be.INFO`のプロセスメモリ統計ログで確認できます。`grep queryID be/log/be.INFO`を実行してクエリがキャンセルされた時刻を見つけ、その後コンテキストで`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけてください。その後、[Memory Log Analysis](./memory-log-analysis.md)の[Process Memory Statistics Log Analysis]セクションを参照してさらなる分析を行ってください。分析前に、[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照してMemory Trackerに統計の欠損があるかを分析してください。

Memory Trackerに統計の欠損がある場合、[Memory Tracker Statistics Missing]セクションを参照してさらなる分析を行ってください。それ以外の場合、Memory Trackerはほとんどのメモリをカウントしており、統計の欠損はありません。[Overview](./../overview.md)を参照してDoris BEプロセスのさまざまな部分がメモリを過度に占有する理由とそのメモリ使用量を削減する方法を分析してください。
