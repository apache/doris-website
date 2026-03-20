---
{
  "title": "クエリエラー Memory Tracker制限を超過",
  "language": "ja",
  "description": "MEMLIMITEXCEEDED がクエリまたはロードエラーメッセージに表示され、memory tracker limit exceeded が含まれている場合、"
}
---
`MEM_LIMIT_EXCEEDED`がクエリまたはロードエラーメッセージに表示され、`memory tracker limit exceeded`が含まれている場合、タスクが単一実行メモリ制限を超えていることを意味します。

## エラーメッセージ分析

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED] failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label :Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN _NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```
エラーメッセージは2つの部分に分かれています：

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`：クエリ`f78208b15e064527-a84c5c0b04c04fcf`が現在実行中です。1.03 MBのメモリを申請しようとしたとき、クエリが単一実行のメモリ制限を超えていることが判明しました。クエリメモリ制限は100 MB（Session Variablesの`exec_mem_limit`）です。現在99.25 MBが使用されており、ピークメモリは99.29 MBです。

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`：このメモリ申請の場所は`VHASH_JOIN_NODE (id=4)`で、`set exec_mem_limit`により単一クエリのメモリ制限を増加できることが示されています。

## 単一実行メモリ制限とメモリオーバー発行

`show variables;`でDoris Session Veriableを表示できます。ここで`exec_mem_limit`は単一クエリとloadの実行メモリ制限ですが、Doris 1.2以降、クエリメモリオーバー発行（overcommit）がサポートされており、クエリがより柔軟なメモリ制限を設定できることを目的としています。十分なメモリがある場合、クエリメモリが上限を超えてもCancelされないため、ユーザーは通常クエリメモリ使用量に注意を払う必要がありません。メモリが不足するまで、クエリは新しいメモリを割り当てようとしながらしばらく待機します。この時、特定のルールに基づいて、`mem_used`と`exec_mem_limit`の比率が大きいクエリが最初にキャンセルされます。待機プロセス中に解放されるメモリ量が要件を満たす場合、クエリは実行を継続し、そうでなければ例外がスローされクエリが終了されます。

## クエリメモリ分析

クエリのメモリ使用量を分析する必要がある場合は、[Query Memory Analysis](./query-memory-analysis.md)を参照してください。

`set enable_profile=true`を使用してQuery Profileを有効にした後、タスクが単一実行のメモリ制限を超えた場合、クエリがメモリを要求するコールスタックが`be/log/be.INFO`に出力され、クエリ内の各オペレータの現在のメモリ使用量とピーク値を確認できます。[Memory Log Analysis](./memory-log-analysis.md)を参照して`Process Memory Summary`と`Memory Tracker Summary`を分析し、現在のクエリメモリ使用量が期待に合うかどうかの確認に役立ててください。

```sql
Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED]failed alloc size 32.00 MB, memory tracker limit exceeded, tracker label:Query#I
d=41363cb6ba734ad5-bc8720bdf9b3090d, type:query, limit 100.00 MB, peak used 75.32 MB, current used 72.62 MB. backend 10.16.10.8, process memory used 2.33 GB. exec node:<>, can `set exec_mem_limit=8G`
 to change limit, details see be.INFO.
Process Memory Summary:
    os physical memory 375.81 GB. process memory used 2.33 GB(= 2.60 GB[vm/rss] - 280.53 MB[tc/jemalloc_cache] + 0[reserved] + 0B[waiting_refresh]), limit 338.23 GB, soft limit 304.41 GB. sys availab
le memory 337.33 GB(= 337.33 GB[proc/available] - 0[reserved] - 0B[waiting_refresh]), low water mark 6.40 GB, warning water mark 12.80 GB.
Memory Tracker Summary:    MemTrackerLimiter Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Type=query, Limit=100.00 MB(104857600 B), Used=72.62 MB(76146688 B), Peak=75.32 MB(78981248 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=122.00 B(122 B), Peak=122.00 B(122 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=384.00 B(384 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=21.73 MB(22790276 B), Peak=21.73 MB(22790276 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=0(0 B), Peak=2.23 MB(2342912 B)
    MemTracker Label=HASH_JOIN_SINK_OPERATOR, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=24.03 MB(25201284 B), Peak=24.03 MB(25201284 B)
    MemTracker Label=VDataStreamRecvr:41363cb6ba734ad5-bc8720bdf9b309fe, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
    MemTracker Label=local data queue mem tracker, Parent Label=Query#Id=41363cb6ba734ad5-bc8720bdf9b3090d, Used=1.08 MB(1130496 B), Peak=7.17 MB(7520256 B)
```
