---
{
    "title": "Ошибка запроса Memory Tracker Limit Exceeded",
    "language": "ru",
    "description": "Когда в сообщении об ошибке запроса или загрузки появляется MEMLIMITEXCEEDED и содержится memory tracker limit exceeded,"
}
---

Когда в сообщении об ошибке запроса или загрузки появляется `MEM_LIMIT_EXCEEDED` и содержится `memory tracker limit exceeded`, это означает, что задача превысила лимит памяти для одного выполнения.

## Анализ сообщения об ошибке {#error-message-analysis}

```sql
ERROR 1105 (HY000): errCode = 2, detailMessage = (10.16.10.8)[MEM_LIMIT_EXCEEDED]PreCatch error code:11, [E11] Allocator mem tracker check failed, [MEM_LIMIT_EXCEEDED] failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label :Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB. backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN _NODE (id=4)>>, can `set exec_mem_limit=8G` to change limit, details see be.INFO.
```

Сообщение об ошибке состоит из двух частей:

1. `failed alloc size 1.03 MB, memory tracker limit exceeded, tracker label:Query#Id=f78208b15e064527-a84c5c0b04c04fcf, type:query, limit 100.00 MB, peak used 99.29 MB, current used 99.25 MB`: в данный момент выполняется запрос `f78208b15e064527-a84c5c0b04c04fcf`. При попытке выделить 1.03 MB памяти обнаружено, что запрос превысил лимит памяти для одного выполнения. Лимит памяти запроса составляет 100 MB (переменная сеанса `exec_mem_limit`). На данный момент используется 99.25 MB, а пиковое потребление памяти составило 99.29 MB.

2. `backend 10.16.10.8, process memory used 2.65 GB. exec node:<execute:<ExecNode:VHASH_JOIN_NODE (id=4)>>, can set exec_mem_limit=8G to change limit, details see be.INFO.`: память запрашивается в узле `VHASH_JOIN_NODE (id=4)`. Сообщение также указывает, что лимит памяти отдельного запроса можно увеличить с помощью `set exec_mem_limit`.

## Лимит памяти для одного выполнения и выделение памяти сверх лимита {#single-execution-memory-limit-and-memory-over-issuance}

Команда `show variables;` позволяет просмотреть переменные сеанса Doris. Переменная `exec_mem_limit` задаёт лимит памяти для выполнения отдельного запроса или загрузки. Начиная с Doris 1.2 поддерживается выделение памяти для запросов сверх лимита (overcommit), что позволяет гибче настраивать ограничения памяти. Если памяти достаточно, запрос не отменяется даже при превышении заданного лимита, поэтому пользователям обычно не нужно следить за потреблением памяти запросами. При нехватке памяти запрос некоторое время ожидает, пытаясь выделить дополнительную память. При этом по определённым правилам в первую очередь отменяется запрос с большим отношением `mem_used` к `exec_mem_limit`. Если за время ожидания высвободится достаточно памяти, запрос продолжит выполняться. В противном случае будет выброшено исключение, и выполнение запроса прекратится.
## Анализ потребления памяти запросами {#query-memory-analysis}

Если необходимо проанализировать потребление памяти запросами, см. раздел [Анализ потребления памяти запросами](./query-memory-analysis.md).

После включения Query Profile с помощью `set enable_profile=true`, если задача превышает лимит памяти для одного выполнения, в `be/log/be.INFO` выводится стек вызовов запроса на выделение памяти. Также можно увидеть текущее и пиковое потребление памяти каждым оператором запроса. В разделе [Анализ журналов памяти](./memory-log-analysis.md) описано, как анализировать `Process Memory Summary` и `Memory Tracker Summary`, чтобы проверить, соответствует ли текущее потребление памяти запросом ожидаемому.

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
