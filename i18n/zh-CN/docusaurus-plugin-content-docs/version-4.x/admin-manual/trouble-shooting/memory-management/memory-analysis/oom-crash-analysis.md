---
{
    "title": "OOM Killer Crash 分析",
    "language": "zh-CN",
    "description": "如果 BE 进程 Crash 后 log/be.out 中没有报错信息，执行 dmesg -T 如果看到下面的日志，说明触发了 OOM Killer，可见 20240718 15:03:59 时 pid 为 360303 的 dorisbe 进程物理内存（anon-rss）约 60 GB。"
}
---

如果 BE 进程 Crash 后 `log/be.out` 中没有报错信息，执行 `dmesg -T` 如果看到下面的日志，说明触发了 OOM Killer，可见 `20240718 15:03:59` 时 pid 为 360303 的 doris_be 进程物理内存（anon-rss）约 60 GB。

```
[Thu Jul 18 15:03:59 2024] Out of memory: Killed process 360303 (doris_be) total-vm:213416916kB, anon-rss:62273128kB, file-rss:0kB, shmem-rss:0kB, UID:0 pgtables:337048kB oom_score_adj:0
```

理想情况下，Doris 会定时检测操作系统剩余可用内存，并在内存不足时采取包括阻止后续内存申请、触发内存 GC 在内的一系列操作来避免触发 OOM Killer，但刷新内存状态和内存 GC 都具有一定的滞后性，并且很难完全 Catch 所有大内存申请，在集群压力过大时仍有一定几率触发 OOM Killer，导致 BE 进程 Crash。此外如果进程内存状态异常，导致内存 GC 无法释放内存，导致进程实际可用内存减少，这将加剧集群的内存压力。

如果不幸触发了 OOM Killer，首先依据日志分析 BE 进程触发 OOM Killer 前的内存状态和任务执行情况，然后针对性调参让集群恢复稳定。

## 找到触发 OOM Killer 时间点前的内存日志

触发 OOM Killer 时意味着进程可用内存不足，参考 [内存日志分析](./memory-log-analysis.md) 在 `be/log/be.INFO` 触发 OOM Killer 时间点自下而上找到最后一次打印的 `Memory Tracker Summary` 关键词并分析 BE 进程的主要内存位置。

> `less be/log/be.INFO` 打开文件后，首先跳转到触发 OOM Killer 对应时间的日志，以上面 `dmesg -T` 的结果为例，输入 `/20240718 15:03:59` 后回车搜索对应时间，如果搜不到，可能是触发 OOM Killer 的时间有些偏差，可以搜索 `/20240718 15:03:`。日志跳转到对应时间后，输入 `/Memory Tracker Summary` 后回车搜素关键词，默认会在日志向下搜索，如果搜索不到或时间对应不上，需要 `shift + n` 先上搜索，找到最后一次打印的 `Memory Tracker Summary` 以及同时打印的 `Process Memory Summary` 内存日志。

## 集群内存压力过大导致触发 OOM Killer

若满足如下现象，那么可以认为是集群内存压力过大，导致在某一时刻进程内存状态没有及时刷新，内存 GC 没能及时释放内存，导致没能有效控制 BE 进程内存。

> Doris 2.1 之前 Memory GC 还不完善，内存持续紧张时往往更容易触发 OOM Killer。

- 对 `Memory Tracker Summary` 的分析发现查询和其他任务、各个 Cache、元数据等内存使用都合理。

- 对应时间段的 BE 进程内存监控显示长时间维持在较高的内存使用率，不存在内存泄漏的迹象

- 定位 `be/log/be.INFO` 中 OOM Killer 时间点前的内存日志，自下而上搜索 `GC` 关键字，发现 BE 进程频繁执行内存 GC。

此时参考 [BE 配置项](../../../config/be-config) 在`be/conf/be.conf`中调小`mem_limit`，调大 `max_sys_mem_available_low_water_mark_bytes`，有关内存限制和水位线计算方法、内存 GC 的更多介绍见 [内存控制策略](./../memory-feature/memory-control-strategy.md)。

此外还可以调节其他参数控制内存状态刷新和 GC，包括 `memory_gc_sleep_time_ms`，`soft_mem_limit_frac`，`memory_maintenance_sleep_time_ms`，`process_minor_gc_size`，`process_full_gc_size`，`enable_query_memory_overcommit`，`thread_wait_gc_max_milliseconds` 等。

## 一些异常问题导致触发 OOM Killer

若不满足集群内存压力过大的现象，那么可能此时内存状态异常，内存 GC 可能无法及时释放内存，下面列举一些常见的导致触发 OOM Killer 的异常问题。

### Memory Tracker 统计缺失

若日志 `Memory Tracker Summary` 中 `Label=process resident memory` Memory Tracker 减去 `Label=sum of all trackers` Memory Tracker 差值较大，或者 Orphan Memory Tracker 值过大，说明 Memory Tracker 存在统计缺失，参考 [内存跟踪器](./../memory-feature/memory-tracker.md) 中 [Memory Tracker 统计缺失] 章节进一步分析。

### Query Cancel 过程中卡住

再 `be/log/be.INFO` 日志中定位到 OOM Killer 的时间点，然后在上下文搜索 `Memory Tracker Summary` 找到进程内存统计日志，若 `Memory Tracker Summary` 中存在使用内存较大的 Query。执行 `grep {queryID} be/log/be.INFO` 确认是否有 `Cancel` 关键词的日志，对应时间点就是 Query 被 Cancel 的时间，若该 Query 已经被 Cancel，且 Query 被 Cancel 的时间点和触发 OOM Killer 的时间点相隔较久，参考 [内存问题 FAQ](../../../trouble-shooting/memory-management/memory-issue-faq) 中对 [Query Cancel 过程中卡住] 的分析。有关 `Memory Tracker Summary` 的分析参考 [内存日志分析](./memory-log-analysis.md)。

### Jemalloc Metadata 内存占用大

内存 GC 目前无法释放 Jemalloc Metadata，参考 [内存跟踪器](./../memory-feature/memory-tracker.md) 中对 `Label=tc/jemalloc_metadata` Memory Tracker 的分析，减少内存使用。

### Jemalloc Cache 内存占用大

> 常见于 Doris 2.0

Doris 2.0 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_tcache_max` 默认值是 20，这在某些场景会导致 Jemalloc Cache 太大且无法自动释放，参考 [Jemalloc 内存分析](./jemalloc-memory-analysis.md) 减少 Jemalloc Cache 内存占用。
