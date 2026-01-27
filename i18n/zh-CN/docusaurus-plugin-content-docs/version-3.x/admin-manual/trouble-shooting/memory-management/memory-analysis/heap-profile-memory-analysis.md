---
{
    "title": "Heap Profile 分析内存",
    "language": "zh-CN",
    "description": "Heap Profile 支持实时查看进程内存使用，并可以看到调用栈，所以这通常需要对代码有一些了解，需要注意的是 Heap Profile 记录的是虚拟内存，需要修改配置后重启 Doris BE 进程，并且现象可以被复现。"
}
---

Heap Profile 支持实时查看进程内存使用，并可以看到调用栈，所以这通常需要对代码有一些了解，需要注意的是 Heap Profile 记录的是虚拟内存，需要修改配置后重启 Doris BE 进程，并且现象可以被复现。

Doris 使用 Jemalloc 作为默认的 Allocator，参照下面的方法使用 Heap Profile。

1. 将 `be.conf` 中 `JEMALLOC_CONF` 的 `prof_active:false` 修改为 `prof_active:true` 并重启 Doris BE。

2. 执行 `curl http://be_host:8040/jeheap/dump` 后会在 `${DORIS_HOME}/log` 目录看到生成的 `profile` 文件。

3. 执行 `jeprof --dot ${DORIS_HOME}/lib/doris_be ${DORIS_HOME}/log/profile_file` 后将终端输出的文本贴到[在线dot绘图网站](http://www.webgraphviz.com/)，生成内存分配图。

以上流程基于 Doris 2.1.8 和 3.0.4 及之后的版本，用于实时的分析内存，如需长时间观测内存，或观测内存申请的累积值，更多有关 Jemalloc Heap Profile 的使用方法参考 [Jemalloc Heap Profile](https://doris.apache.org/community/developer-guide/debug-tool/?_highlight=debug#jemalloc-1)

如果在 Heap Profile 内存占比大的调用栈中看到 `Segment`，`TabletSchema`、`ColumnReader` 字段，说明元数据占用内存大。

如果集群运行一段时间后静置时 BE 内存不下降，此时在 Heap Profile 内存占比大的调用栈中看到 `Agg`，`Join`，`Filter`，`Sort`，`Scan` 等字段，查看对应时间段的 BE 进程内存监控若呈现持续上升的趋势，那么有理由怀疑存在内存泄漏，依据调用栈对照代码继续分析。

如果集群上任务执行期间在 Heap Profile 内存占比大的调用栈中看到 `Agg`，`Join`，`Filter`，`Sort`，`Scan` 等字段，任务结束后内存正常释放，说明大部分内存被正在运行的任务使用，不存在泄漏，如果此时 `Label=query, Type=overview` Memory Tracker 的值占总内存的比例，小于 Heap Profile 中包含上述字段的内存调用栈占总内存的比例，说明 `Label=query, Type=overview` Memory Tracker 统计的不准确，可以在社区及时反馈。
