---
{
    "title": "Jemalloc 内存分析",
    "language": "zh-CN",
    "description": "Doris 默认使用 Jemalloc 作为通用内存分配器，Jemalloc 自身占用的内存包括 Cache 和 Metadata 两部分，其中 Cache 包括 Thread Cache 和 Dirty Page 两部分，"
}
---

Doris 默认使用 Jemalloc 作为通用内存分配器，Jemalloc 自身占用的内存包括 Cache 和 Metadata 两部分，其中 Cache 包括 Thread Cache 和 Dirty Page 两部分，在 http://{be_host}:{be_web_server_port}/memz 可以实时查看到内存分配器原始的 profile。

## Jemalloc Cache 内存分析

如果看到 `Label=tc/jemalloc_cache, Type=overview` Memory Trakcer 的值较大，说明 Jemalloc 或 TCMalloc Cache 内存使用多，Doris 使用 Jemalloc 作为默认的 Allocator，所以这里只分析 Jemalloc Cache 内存使用多的情况。

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```

> Doris 2.1.6 之前 `Label=tc/jemalloc_cache` 还包括 Jemalloc Metadata，而且大概率是因为 Jemalloc Metadata 内存占用大导致 `Label=tc/jemalloc_cache` 过大，参考对 `Label=tc/jemalloc_metadata` Memory Tracker 的分析。

BE 进程运行过程中，Jemalloc Cache 包括两部分。

- Thread Cache，在 Thread Cache 中缓存指定数量的 Page，参考 [Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache)。

- Dirty Page，所有 Arena 中可以被复用的内存 Page。

### Jemalloc Cache 查看方法

查看 Doris BE 的 Web 页面 `http://{be_host}:{be_web_server_port}/memz`（webserver_port 默认 8040）可以获得 Jemalloc Profile，根据几组关键信息解读 Jemalloc Cache 的使用。

- Jemalloc Profile 中的 `tcache_bytes`是 Jemalloc Thread Cache 的总字节数。如果 `tcache_bytes` 值较大，说明 Jemalloc Thread Cache 使用的内存过大。

- Jemalloc Profile 中 `extents` 表中 `dirty` 列的值总和较大，说明 Jemalloc Dirty Page 使用的内存过大。

### Thread Cache 内存过大

可能是 Thread Cache 缓存了大量大 Page，因为 Thread Cache 的上限是 Page 个数，而不是 Page 的总字节数。

考虑减小 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_tcache_max`，`lg_tcache_max` 是允许缓存的 Page 字节大小上限，默认是 15，即 32 KB (2^15)，超过这个大小的 Page 将不会缓存到 Thread Cache 中。`lg_tcache_max` 对应 Jemalloc Profile 中的 `Maximum thread-cached size class`。

> Doris 2.1 之前 `be.conf` 中 `JEMALLOC_CONF` 的 `lg_tcache_max` 默认是 20，在某些场景会导致 Jemalloc Cache 过大，Doris 2.1 之后已经改回了 Jemalloc 的默认值 15。

这通常是 BE 进程中的查询或导入正在申请大量大 Size Class 的内存 Page，或者执行完一个大内存查询或导入后，Thread Cache 中缓存了大量大 Size Class 的内存 Page。Thread Cache 有两个清理时机，一是内存申请和释放到达一定次数时，回收长时间未使用的内存块；二是线程退出时回收全部 Page。此时存在一个 Bad Case，若线程后续一直没有执行新的查询或导入，从此不再分配内存，陷入一种所谓的 `idle` 状态。用户预期是查询结束后，内存是可以释放掉的，但实际上此场景下若线程没有退出，Thread Cache 并不会清理。

不过通常无需关注 Thread Cache，在进程可用内存不足时，若 Thread Cache 的大小超过 1G，Doris 将手动 Flush Thread Cache。

### Dirty Page 内存过大

```
extents:        size ind       ndirty        dirty       nmuzzy        muzzy    nretained     retained       ntotal        total
                4096   0            7        28672            1         4096           21        86016           29       118784
                8192   1           11        90112            2        16384           11        90112           24       196608
               12288   2            2        24576            4        49152           45       552960           51       626688
               16384   3            0            0            1        16384            6        98304            7       114688
               20480   4            0            0            1        20480            5       102400            6       122880
               24576   5            0            0           43      1056768            2        49152           45      1105920
               28672   6            0            0            0            0           13       372736           13       372736
               32768   7            0            0            1        32768           13       425984           14       458752
               40960   8            0            0           31      1150976           35      1302528           66      2453504
               49152   9            4       196608            2        98304            3       139264            9       434176
               57344  10            0            0            1        57344            9       512000           10       569344
               65536  11            3       184320            0            0            6       385024            9       569344
               81920  12            2       147456            3       241664           38      2809856           43      3198976
               98304  13            0            0            1        86016            6       557056            7       643072
              114688  14            1       102400            1       106496           15      1642496           17      185139
```

减小 `be.conf` 中 `JEMALLOC_CONF` 的 `dirty_decay_ms` 到 2000 ms 或更小，`be.conf` 中默认 `dirty_decay_ms` 为 5000 ms。Jemalloc 会在 `dirty_decay_ms` 指定的时间内依照平滑梯度曲线释放 Dirty Page，参考 [Jemalloc opt.dirty_decay_ms](https://jemalloc.net/jemalloc.3.html#opt.dirty_decay_ms)，当 BE 进程可用内存不足触发 Minor GC 或 Full GC 时会按照一定策略主动释放所有 Dirty Page。

> Doris 2.1 之前 `be.conf` 中 `JEMALLOC_CONF` 的 `dirty_decay_ms` 默认是 15000，在某些场景会导致 Jemalloc Cache 过大，Doris 2.1 之后默认值是 5000。

Jemalloc Profile 中的 `extents` 包含 Jemalloc 所有 `arena` 中不同 Page Size 的 Bucket 的统计值，其中 `ndirty` 是 Dirty Page 的个数，`dirty` 是 Dirty Page 的内存总和。参考 [Jemalloc](https://jemalloc.net/jemalloc.3.html) 中的 `stats.arenas.<i>.extents.<j>.{extent_type}_bytes` 将所有 Page Size 的 `dirty` 相加得到 Jemalloc 中 Dirty Page 的内存字节大小。

## Jemalloc Metadata 内存分析

若 `Label=tc/jemalloc_metadata, Type=overview` Memory Trakcer 的值较大，说明 Jemalloc 或 TCMalloc Metadata 内存使用多，Doris 使用 Jemalloc 作为默认的 Allocator，所以这里只分析 Jemalloc Metadata 内存使用多的情况。

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```

> `Label=tc/jemalloc_metadata` Memory Tracker 在 Doris 2.1.6 之后才被添加，过去 Jemalloc Metadata 被包含在 `Label=tc/jemalloc_cache` Memory Tracker 中。

### Jemalloc Metadata 查看方法

查看 Doris BE 的 Web 页面 `http://{be_host}:{be_web_server_port}/memz`（webserver_port 默认 8040）可以获得 Jemalloc Profile，查找 Jemalloc Profile 中关于 Jemalloc 整体的内存统计如下，其中 `metadata` 就是 Jemalloc Metadata 的内存大小。

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`

- `Allocated` Jemalloc 为 BE 进程分配的内存总字节数。

- `active` Jemalloc 为 BE 进程分配的所有 Page 总字节数，是 Page Size 的倍数，通常大于等于 `Allocated`。

- `metadata` Jemalloc 的元数据总字节数，和分配和缓存的 Page 个数、内存碎片 等因素都有关，参考文档 [Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata)

- `retained` Jemalloc 保留的虚拟内存映射大小，也没有通过 munmap 或类似方法返回给操作系统，也没有强关联物理内存。参考文档 [Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained)

### Jemalloc Metadata 内存过大

Jemalloc Metadata 大小和进程虚拟内存大小正相关，通常 Doris BE 进程虚拟内存大是因为 Jemalloc 保留了大量虚拟内存映射，即上面的 `retained`。返回给 Jemalloc 的虚拟内存默认都会缓存在 Retained 中，等待被复用，不会自动释放，也无法手动释放。

造成 Jemalloc Retained 大的根本原因是 Doris 代码层面内存复用不足，导致需要申请大量虚拟内存，这些虚拟内存释放后进入 Jemalloc Retained。通常虚拟内存和 Jemalloc Metadata 大小的比值在 300-500 之间，即若有 10T 的虚拟内存，Jemalloc Metadata 可能占用 20G。

如果遇到 Jemalloc Metadata 和 Retained 持续增大，以及进程虚拟内存过大的问题，建议考虑定时重启 Doris BE 进程，通常这只会在 Doris BE 长时间运行后出现，而且只有少数 Doris 集群会遇到。目前没有不损失性能的方法降低 Jemalloc Retained 保留的虚拟内存映射，Doris 正在持续优化内存使用。

如果频繁出现上述问题，参考下面的方法。

1. 一个根本解决方法是关闭 Jemalloc Retained 缓存虚拟内存映射，在 `be.conf` 中 `JEMALLOC_CONF` 后面增加 `retain:false` 后重启 BE，但查询性能可能会降低，关闭后观察一段时间集群的性能变化。

2. Doris 2.1 上可以关闭 Pipelinex 和 Pipeline，执行 `set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;`，因为 pipelinex 和 pipeline 会申请更多的虚拟内存。这同样会导致查询性能降低。
