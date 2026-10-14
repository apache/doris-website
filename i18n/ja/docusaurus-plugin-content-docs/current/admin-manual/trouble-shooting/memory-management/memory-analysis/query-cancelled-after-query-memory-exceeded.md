---
{
    "title": "クエリエラー: Memory Tracker Limit Exceeded",
    "language": "ja",
    "description": "クエリまたはロードのエラーメッセージに MEMLIMITEXCEEDED が表示され、memory tracker limit exceeded が含まれる場合"
}
---

クエリまたはロードのエラーメッセージに `MEM_LIMIT_EXCEEDED` と `memory tracker limit exceeded` が含まれる場合、そのタスクが単一実行のメモリ上限を超えたことを意味します。

## エラーメッセージの分析

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED] failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label :Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN _NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

エラーメッセージは次の二つの部分に分かれます。

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`: クエリ `f78208b15e064527-a84c5c0b04c04fcf` は現在実行中です。1.03 MB のメモリを確保しようとした際、クエリが単一実行のメモリ上限を超えていることが判明しました。クエリのメモリ上限は 100 MB（セッション変数 `exec_mem_limit`）です。現在の使用量は 99.25 MB、ピーク使用量は 99.29 MB です。

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`: メモリ確保が行われた箇所は `VHASH_JOIN_NODE (id=4)` です。また、`set exec_mem_limit` で単一クエリのメモリ上限を引き上げられることを示しています。

## 単一実行のメモリ上限とメモリのオーバーコミット

`show variables;` で Doris のセッション変数を確認できます。`exec_mem_limit` は単一のクエリまたはロードの実行時メモリ上限です。ただし、Doris 1.2 以降はクエリメモリのオーバーコミットがサポートされ、クエリにより柔軟なメモリ上限を設定できます。メモリに余裕があれば、クエリのメモリ使用量が上限を超えてもキャンセルされないため、通常はクエリのメモリ使用量を気にする必要はありません。メモリが不足すると、クエリは新たなメモリの確保を試みながらしばらく待機します。このとき、一定のルールに基づき、`mem_used` を `exec_mem_limit` で割った比率が大きいクエリから先にキャンセルされます。待機中に解放されたメモリが必要量に達すれば、クエリは実行を続けます。達しない場合は例外が発生し、クエリは終了します。
## クエリメモリの分析

クエリのメモリ使用量を分析するには、[クエリメモリの分析](./query-memory-analysis.md)を参照してください。

`set enable_profile=true` で Query Profile を有効にすると、タスクが単一実行のメモリ上限を超えた際に、メモリを要求したクエリのコールスタックが `be/log/be.INFO` に出力されます。また、クエリ内の各オペレーターの現在のメモリ使用量とピーク値を確認できます。[メモリログの分析](./memory-log-analysis.md)を参照し、`Process Memory Summary` と `Memory Tracker Summary` を分析すると、現在のクエリのメモリ使用量が想定どおりか確認するのに役立ちます。

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
