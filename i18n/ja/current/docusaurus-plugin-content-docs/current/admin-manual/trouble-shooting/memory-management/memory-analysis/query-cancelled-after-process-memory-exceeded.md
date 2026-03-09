---
{
  "title": "クエリエラー プロセスメモリ不足",
  "language": "ja",
  "description": "クエリのエラーメッセージにMEMLIMITEXCEEDEDが表示され、Process memory not enoughが含まれている場合、"
}
---
`MEM_LIMIT_EXCEEDED`がクエリのエラーメッセージに表示され、`Process memory not enough`が含まれている場合、利用可能なメモリが不足したためプロセスがキャンセルされたことを意味します。

まず、エラーメッセージを解析してキャンセルの理由、キャンセル時にクエリ自体が使用していたメモリサイズ、プロセスのメモリ状況を確認します。通常、クエリのキャンセルには3つの理由があります：

1. キャンセルされたクエリ自体のメモリが大きすぎる。

2. キャンセルされたクエリ自体のメモリは小さいが、より大きなメモリを使用する他のクエリが存在する。

3. グローバルに共有されるCahce、メタデータなどのメモリが大きすぎる、またはクエリとロードタスク以外の他のタスクのメモリが大きすぎる

## エラーメッセージ分析

プロセスの利用可能メモリが不足する状況には2つあります。1つは現在のプロセスメモリが設定されたメモリ制限を超えた場合、もう1つはシステムの残り利用可能メモリがウォーターマークを下回った場合です。クエリなどのタスクをキャンセルするパスには3つあります：

- エラーメッセージに`cancel top memory used`が含まれている場合、メモリFull GCでタスクがキャンセルされたことを意味します。

- エラーメッセージに`cancel top memory overcommit`が含まれている場合、メモリMinor GCでタスクがキャンセルされたことを意味します。

- エラーメッセージに`Allocator sys memory check failed`が含まれている場合、`Doris Allocator`からのメモリ申請に失敗した後にタスクがキャンセルされたことを意味します。

以下のエラーメッセージを分析した後、

- クエリとロード自体が使用するメモリがプロセスメモリの大きな割合を占めている場合は、[Query own memory is too large]を参照してクエリとロードのメモリ使用量を分析し、パラメータの調整やSQLの最適化を試行して実行に必要なメモリを削減してください。

- タスク自体が使用するメモリが非常に少ない場合は、[Process memory other than query and load is too large]を参照して、プロセス内の他の場所でのメモリ使用量を削減し、クエリや他のタスク実行により多くのメモリを確保するようにしてください。

メモリ制限、ウォーターマーク計算方法、メモリGCの詳細については、[Memory Control Strategy](./../memory-feature/memory-control-strategy.md)を参照してください。

### 1 メモリFull GCでキャンセルされた場合

BEプロセスメモリがプロセスメモリ上限（MemLimit）を超えた場合、またはシステムの残り利用可能メモリがメモリ低水位（LowWaterMark）を下回った場合、Full GCがトリガーされます。この時、最もメモリを使用するタスクが最初にキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory used query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB. Execute again after enough memory, details see be.INFO.
```
エラーメッセージ解析:

1. `(10.16.10.8)`: クエリ実行中にメモリ不足が発生したBEノード。

2. `query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB`: 現在キャンセルされたqueryID、このクエリ自体が866.97 MBのメモリを使用している。

3. `process memory used 3.12 GB exceed limit 3.01 GB or sys available memory 191.25 GB less than low water mark 3.20 GB` プロセスメモリが制限を超えた理由は、BEプロセスが使用している物理メモリ3.12 GBがMemLimitの3.01 GBを超えているためです。現在のオペレーティングシステムにはBEが使用できるメモリが191.25 GB利用可能で、これはLowWaterMarkの3.20 GBより依然として高い値です。

### 2 Minor GCによるメモリのキャンセル

Doris BEプロセスメモリがプロセスメモリソフト制限（SoftMemLimit）を超えるか、システムの残り利用可能メモリがメモリ警告ウォーターマーク（WarningWaterMark）を下回った場合、Minor GCがトリガーされます。この時、メモリ制限比率が最大のクエリが最初にキャンセルされます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]Process memory not enough, cancel top memory overcommit query: <Query#Id=e862471398b14e71-9361a1ab8153cb29> consumption 866.97 MB, backend 10.16.10.8, process memory used 2.12 GB exceed soft limit 2.71 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB. Execute again after enough memory, details see be.INFO.
```
エラーメッセージ分析: `process memory used 3.12 GB exceed soft limit 6.02 GB or sys available memory 3.25 GB less than warning water mark 6.40 GB` プロセスメモリが制限を超過する理由は、現在のオペレーティングシステムでBEが利用可能な残りメモリが3.25 GBであり、これがWarningWaterMarkの6.40 GBを下回っており、BEプロセスが使用している物理メモリが2.12 GBで、SoftMemLimitの2.71 GBを超過していないことです。

### 3 Allocatorからのメモリ割り当てに失敗しました

Doris BEの大容量メモリリクエストは`Doris Allocator`を通じて割り当てられ、割り当て時にメモリサイズがチェックされます。プロセスの利用可能メモリが不足している場合、例外がスローされ、現在のクエリのキャンセルが試行されます。

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator sys memory check failed: Cannot alloc:4294967296, consuming tracker:<Query#Id=457efb1fdae74d3 b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:<>, process memory used 2.23 GB exceed limit 3.01 GB or sys available memory 181.67 GB less than low water mark 3.20 GB.
```
エラーメッセージの分析：

1. `consuming tracker:<Query#Id=457efb1fdae74d3b-b4fffdcfd4baaf32>, peak used 405956032, current used 386704704, exec node:VAGGREGATION_NODE (id=7)>`：現在キャンセルされているqueryID、クエリは現在386704704 Bytesのメモリを使用、クエリメモリのピークは405956032 Bytes、実行中のオペレータは`VAGGREGATION_NODE (id=7)>`です。

2. `Cannot alloc:4294967296`：現在の2.23 GBのプロセスメモリに4 GBを加えると3.01 GBのMemLimitを超えるため、現在の4 GBメモリの申請が失敗しました。

## キャンセルされたクエリのメモリ使用量が大きすぎる場合

[Query Memory Analysis](./query-memory-analysis.md)または[Load Memory Analysis](./load-memory-analysis.md)を参照してクエリとロードのメモリ使用量を分析し、パラメータの調整やSQLの最適化により実行に必要なメモリの削減を試してください。

タスクがAllocatorからのメモリ申請に失敗してキャンセルされた場合、`Cannot alloc`または`try alloc`でQueryが現在申請しているメモリが大きすぎることが表示されることに注意してください。この場合、ここでのメモリ申請が妥当かどうかに注意する必要があります。`be/log/be.INFO`で`Allocator sys memory check failed`を検索してメモリ申請のスタックを見つけてください。

## キャンセルされたクエリ自体のメモリは少ないが、他により大きなメモリを使用するクエリが存在する場合

通常、メモリ使用量の大きいクエリがキャンセル段階で停止し、メモリを適時に解放できないためです。Full GCはまずメモリ使用量順にクエリをキャンセルし、次にメモリ使用量順にロードをキャンセルします。メモリFull GCでクエリがキャンセルされたが、BEプロセス内に現在キャンセルされたクエリよりもメモリ使用量の多い他のクエリが存在する場合、これらのメモリ使用量の大きいクエリがキャンセルプロセス中に停止していないかに注意する必要があります。

まず、`grep {queryID} be/log/be.INFO`を実行してクエリがキャンセルされた時刻を見つけ、次にコンテキスト内で`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。`Memory Tracker Summary`により多くのメモリを使用するクエリがある場合、`grep {queryID with larger memory} be/log/be.INFO`を実行してキーワード`Cancel`を含むログがあるかを確認します。対応する時点がクエリがキャンセルされた時刻です。そのクエリもキャンセルされており、メモリ使用量の大きいクエリがキャンセルされた時点が現在のクエリがキャンセルされた時点と異なる場合、[Memory Issue FAQ](../../../trouble-shooting/memory-management/memory-issue-faq)の[Query Cancel process stuck]を参照してメモリ使用量の大きいクエリがキャッシュプロセスで停止していないかを分析します。`Memory Tracker Summary`の分析については、[Memory Log Analysis](./memory-log-analysis.md)を参照してください。

## クエリとロードタスク以外のプロセスメモリが大きすぎる場合

メモリの場所を特定し、メモリ使用量を削減してクエリとロード実行により多くのメモリを確保することを検討してください。

利用可能メモリ不足によりタスクがキャンセルされた時刻は、`be/log/be.INFO`のプロセスメモリ統計ログで確認できます。`grep queryID be/log/be.INFO`を実行してクエリがキャンセルされた時刻を見つけ、次にコンテキスト内で`Memory Tracker Summary`を検索してプロセスメモリ統計ログを見つけます。その後、[Memory Log Analysis](./memory-log-analysis.md)の[Process Memory Statistics Log Analysis]セクションを参照してさらに分析します。分析前に、[Memory Tracker](./../memory-feature/memory-tracker.md)の[Memory Tracker Statistics Missing]セクションを参照してMemory Trackerに統計の欠落があるかを分析してください。

Memory Trackerに統計の欠落がある場合、[Memory Tracker Statistics Missing]セクションを参照してさらに分析してください。そうでなければ、Memory Trackerがほとんどのメモリをカウントしており、統計の欠落はありません。[Overview](./../overview.md)を参照してDoris BEプロセスの異なる部分が過度にメモリを占有する理由とそのメモリ使用量を削減する方法を分析してください。
