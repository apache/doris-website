---
{
  "title": "RuntimeFilter待機時間の調整",
  "description": "実際の本番環境では、不適切なRuntimeFilterの待機時間によってパフォーマンスの問題が発生する可能性があります。",
  "language": "ja"
}
---
# RuntimeFilter待機時間の調整

## 概要

実際の本番環境では、不適切なRuntimeFilter待機時間によるパフォーマンス問題が発生する可能性があります。RuntimeFilterは、実行時にフィルタ条件を生成するクエリ最適化技術であり、無関係なデータのスキャンを回避します。この最適化手法は、I/O操作と計算負荷を大幅に削減し、クエリ実行を高速化できます。以下のセクションでは、データスキューシナリオでの最適化に役立つ一般的なケースをいくつか紹介します。

## ケース：RuntimeFilter待機時間が短すぎる場合

以下のProfile情報を参照してください：

```SQL
OLAP_SCAN_OPERATOR (id=22. nereids_id=1764. table name = test_doris(test_doris)):(ExecTime: 62.870ms)
               - RuntimeFilters: : RuntimeFilter: (id = 6, type = minmax, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false, RuntimeFilter: (id = 7, type = in_or_bloomfilter, need_local_merge: true, is_broadcast: false, build_bf_cardinality: false, 
               - PushDownPredicates: []
               - KeyRanges: ScanKeys:ScanKey=[null(-9223372036854775808) : 9223372036854775807]
               - TabletIds: [1732763414173, 1732763414187, 1732763414201, 1732763414215]
               - UseSpecificThreadToken: False
               - AcquireRuntimeFilterTime: 969ns
               - BlocksProduced: 1.829K (1829)
               - CloseTime: 0ns
               - ExecTime: 62.870ms
               - InitTime: 75.703us
               - KeyRangesNum: 0
               - MaxScannerThreadNum: 32
               - MemoryUsage: 
                 - PeakMemoryUsage: 0.00 
               - NumScanners: 32
               - OpenTime: 19.276ms
               - ProcessConjunctTime: 30.360us
               - ProjectionTime: 0ns
               - RowsProduced: 7.433056M (7433056)
               - RowsRead: 0
               - RuntimeFilterInfo: 
               - ScannerWorkerWaitTime: 0ns
               - TabletNum: 4
               - TotalReadThroughput: 0
               - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: 0ns
               - WaitForRuntimeFilter: 1000ms
              RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
              RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```
Profileから、`WaitForRuntimeFilter: 1000ms`であることがわかります。ここで、RuntimeFilterは1000ms待機しましたが、このScanOperatorは対応するRuntimeFilterを受信せず、`RuntimeFilterState = NOT_READY`となっています。

```SQL
 RuntimeFilter: (id = 6, type = minmax):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
 RuntimeFilter: (id = 7, type = in_or_bloomfilter):
                 - Info: [IsPushDown = false, RuntimeFilterState = NOT_READY, HasRemoteTarget = true, HasLocalTarget = false, Ignored = false]
```
そのため、ID 6と7に対応するRuntimeFiltersは受信されませんでした。Profileを通じてRuntimeFilterを生成するJoinを特定することで、Joinに時間がかかっていることが判明しました：

```SQL
  HASH_JOIN_OPERATOR (id=26, nereids_id=37948):
                - PlanInfo
                   - join op: RIGHT OUTER JOIN(PARTITIONED)[]
                   - equal join conjunct: (id = ID)
                   - runtime filters: RF006[min_max] <- ID(6418/8192/1048576), RF007[in_or_bloom] <- ID(6418/8192/1048576)
                   - cardinality=6,418
                   - vec output tuple id: 27
                   - output tuple id: 27
                   - vIntermediate tuple ids: 25 
                   - hash output slot ids: 396 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 447 
                   - projections: USER_ID
                   - project output tuple id: 27
                - BlocksProduced: sum 1, avg 1, max 1, min 1
                - CloseTime: avg 10.111us, max 10.111us, min 10.111us
                - ExecTime: avg 364.497us, max 364.497us, min 364.497us
                - InitTime: avg 26.653us, max 26.653us, min 26.653us
                - MemoryUsage: sum, avg, max, min 
                  - PeakMemoryUsage: sum 0.00, avg 0.00, max 0.00, min 0.00 
                  - ProbeKeyArena: sum 0.00, avg 0.00, max 0.00, min 0.00 
                - OpenTime: avg 45.985us, max 45.985us, min 45.985us
                - ProbeRows: sum 0, avg 0, max 0, min 0
                - ProjectionTime: avg 211.930us, max 211.930us, min 211.930us
                - RowsProduced: sum 1, avg 1, max 1, min 1
                - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 1sec780ms, max 1sec780ms, min 1sec780ms
```
この Join には約 `1sec780ms` かかったことがわかるため、RuntimeFilter は 1s で待機しませんでした。したがって、RuntimeFilter の待機時間が調整されました：

```SQL
set runtime_filter_wait_time_ms = 3000;
```
調整後、クエリ時間は5秒から2秒に短縮されました。

## 概要

RuntimeFilterの待機時間はシナリオに応じて定義する必要があります。Dorisは適応的最適化と変換を進めています。EXPLAINとPROFILEツールを使用して実行ボトルネックを観察し、対応する問題を特定し、SQL Hintを通じてRuntimeFilterの待機時間を変更することで、対応する問題がパフォーマンスに与える影響を回避してください。
