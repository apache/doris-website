---
{
    "title": "概要 | メモリ管理",
    "language": "ja",
    "description": "メモリ管理は Doris の最も重要な構成要素の一つです。Doris の稼働中、",
    "sidebar_label": "概要"
}
---

# 概要

メモリ管理は Doris の最も重要な構成要素の一つです。Doris の運用では、データロードとクエリの両方で大量のメモリ操作が行われます。メモリ管理の品質は、Doris の安定性と性能に直接影響します。

Apache Doris は MPP アーキテクチャに基づく OLAP データベースです。ディスクからメモリにデータを読み込んだ後、オペレーター間でデータをストリーミングしながら計算し、その中間結果をメモリに保持します。この方法は頻繁なディスク I/O を減らし、複数のマシンと複数のコアによる並列計算能力を十分に活用するため、性能面で大きな利点があります。

複雑な計算や大規模な処理では大量のメモリリソースを消費するため、効果的なメモリの割り当て、統計、制御がシステムの安定性にとって非常に重要です。メモリ割り当てを高速化するとクエリ性能が向上します。また、メモリの割り当て、追跡、制限によってメモリの使用集中を防ぎ、メモリ不足に適時かつ正確に対応して、OOM やクエリの失敗を可能な限り回避できます。こうした仕組みはシステムの安定性を大幅に高めます。同時に、より正確なメモリ統計は、大規模なクエリでディスクへの退避を行うための基盤にもなります。

## Doris BE のメモリ構造

![Doris BE のメモリ構造](/images/memory-structure.png)

```
Server physical memory: The physical memory used by all processes on the server, MemTotal seen by `cat /proc/meminfo` or `free -h`.
    |
    |---> Linux Kernel Memory And Other Process Memory: Memory used by the Linux kernel and other processes.
    |
    |---> Doris BE Process Memory: The memory used by the Doris BE process. The upper limit is the server physical memory minus the memory used by the Linux kernel and other processes, or the memory size configured by the Cgroup.
            |
            |---> Untracked: Memory that is not tracked and managed, including RPC, JVM, some metadata, etc. JVM is used when accessing external tables or using Java UDF.
            |
            |---> tracked: Memory that is tracked and managed, allowing real-time viewing, automatic memory recycling, and size control through parameters.
                    |
                    |---> jemalloc: The cache and metadata managed by jemalloc support parameter control and are automatically recycled when memory is insufficient.
                    |
                    |---> global: Doris globally shared memory, mainly including cache and metadata.
                    |       |
                    |       |---> doris cache: Doris manages its own cache, which supports controlling capacity and elimination time through parameters separately, and automatically reclaims when memory is insufficient.
                    |       |
                    |       |---> doris metadata: metadata of data stored on BE, including a series of memory data structures such as data schema and their caches.
                    |
                    |---> Task: The memory used by the tasks executed on Doris, which is expected to be released after the task is completed, including query, load, compaction, etc.
                    |       |
                    |       |---> query: Memory used during the query. A query is split into multiple fragments and executed separately, connected by data shuffle.
                    |       |       |
                    |       |       |---> Fragment: A fragment is split into multiple operators and executed in the form of a pipeline.
                    |       |       |       |
                    |       |       |       |---> operator: includes memory data structures such as data block, hash table, arena, exchange sink buffer, etc.
                    |       |
                    |       |---> load: Memory used during data load. Data load includes two stages: fragment reading and channel writing data.
                    |       |       |
                    |       |       |---> fragment: Same as query fragment execution, stream load usually only has scan operator.
                    |       |       |
                    |       |       |---> channel: The tablet channel writes data to a temporary data structure called memtable, and then the delta writer compresses the data and writes it to the file.
```

---

## メモリの確認

Doris BE は Memory Tracker を使用してプロセスのメモリ使用量を記録します。Web ページで確認できるほか、メモリ関連のエラーが報告された際には BE のログにも出力され、メモリ分析とトラブルシューティングに利用できます。

### リアルタイムのメモリ統計

リアルタイムのメモリ統計は、Doris BE の Web ページ `http://{be_host}:{be_web_server_port}/mem_tracker` で確認できます。このページには、`type=overview` の Memory Tracker が追跡する現在のメモリ使用量とピーク使用量が表示され、Query/Load/Compaction/Global などが含まれます。`be_web_server_port` のデフォルト値は 8040 です。

![サブシステム別のメモリ使用量](/images/memory-used-by-subsystem.png)

Memory Tracker は種類ごとに分かれています。type=overview の Memory Tracker のうち、`process resident memory`、`process virtual memory`、`sum of all trackers` を除く、type=overview の各 Memory Tracker の詳細は、`http://{be_host}:{be_web_server_port}/mem_tracker?type=Lable` で確認できます。

Memory Tracker には次の属性があります。

1. Label: Memory Tracker の名前。
2. Current Consumption(Bytes): 現在のメモリ使用量。単位は B。
3. Current Consumption(Normalize): 現在のメモリ使用量を .G.M.K 形式で表示した値。
4. Peak Consumption (Bytes): BE プロセスの起動後に記録されたメモリ使用量のピーク値。単位は B で、BE の再起動後にリセットされます。
5. Peak Consumption (Normalize): BE プロセスの起動後に記録されたメモリ使用量のピーク値を .G.M.K 形式で表示した値。BE の再起動後にリセットされます。
6. Parent Label: 二つの Memory Tracker の親子関係を示します。子 Tracker が記録するメモリは親 Tracker が記録するメモリの一部です。同じ親を持つ異なる Tracker が記録するメモリには重複が生じる場合があります。

Memory Tracker の詳細については、[Memory Tracker](./memory-feature/memory-tracker.md) を参照してください。

### 過去のメモリ統計

過去のメモリ統計は、Doris BE の Bvar ページ `http://{be_host}:{brpc_port}/vars/*memory_*` で確認できます。リアルタイムのメモリ統計ページ `http://{be_host}:{be_web_server_port}/mem_tracker` で Memory Tracker の Label の下にある Bvar ページを探すと、対応する Memory Tracker が追跡するメモリ使用量の推移を確認できます。`brpc_port` のデフォルト値は 8060 です。

![過去のメモリ統計を示す Bvar Memory](/images/bvar-memory.png)

プロセスのメモリ使用量が上限を超えた、または使用可能なメモリが不足したというエラーが発生した場合は、`Memory Tracker Summary` を `be/log/be.INFO` ログで確認できます。ここには `Type=overview` と `Type=global` のすべての Memory Tracker が含まれており、その時点のメモリ状況の分析に役立ちます。詳細については、[メモリログの分析](./memory-analysis/memory-log-analysis.md)を参照してください。

---

## メモリ分析

`type=overview` の Memory Tracker と、上記のメモリ構造で `tracked` に含まれる各メモリ領域との対応は次のとおりです。

```
Doris BE Process Memory
    |
    |---> tracked: corresponds to `MemTrackerLimiter Label=sum of all trackers, Type=overview`, which is all the memory counted by the Memory Tracker, that is, the sum of the Current Consumption of other Memory Trackers with `type=overview` except `Label=process resident memory` and `Label=process virtual memory`.
            |
            |---> jemalloc
            |       |
            |       |---> jemalloc cache: corresponds to `MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview`. The Jemalloc cache includes two parts: Dirty Page and Thread Cache.
            |       |
            |       |---> jemalloc metadata: Corresponding to `MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview`, Metadata of Jemalloc.
            |
            |---> global: corresponds to `MemTrackerLimiter Label=global, Type=overview`, including global Memory Trackers with the same life cycle and process such as Cache, metadata, and decompression. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` displays all Memory Trackers of `type=global`.
            |
            |---> task
            |       |
            |       |---> query: corresponds to `MemTrackerLimiter Label=query, Type=overview`, which is the sum of Current Consumption of all Query Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` displays all Memory Trackers of `type=query`.
            |       |
            |       |---> load: corresponds to `MemTrackerLimiter Label=load, Type=overview`, the sum of Current Consumption of all Load Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=load` displays all Memory Trackers of `type=load`.
            |       |
            |       |---> reserved: corresponds to `MemTrackerLimiter Label=reserved_memory, Type=overview`. The reserved memory is used when query the Hash Table and other memory-intensive behaviors. Before query the Hash Table, the memory of the Hash Table to be constructed will be reserved from the Memory Tracker to ensure that subsequent memory requests can be met.
            |       |
            |       |---> compaction: corresponds to `MemTrackerLimiter Label=compaction, Type=overview`, the sum of Current Consumption of all Compaction Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=compaction` displays all Memory Trackers of `type=compaction`.
            |       |
            |       |---> schema_change: corresponds to `MemTrackerLimiter Label=schema_change, Type=overview`, the sum of Current Consumption of all Schema Change Memory Trackers. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=schema_change` displays all Memory Trackers of `type=schema_change`.

            |       |
            |       |---> other: corresponds to `MemTrackerLimiter Label=other, Type=overview`, the total memory of other tasks except the above, such as EngineAlterTabletTask, EngineCloneTask, CloudEngineCalcDeleteBitmapTask, SnapshotManager, etc. The web page `http://{be_host}:{be_web_server_port}/mem_tracker?type=other` displays all Memory Trackers of `type=other`.
    |
    |---> Doris BE process physical memory, corresponding to `MemTrackerLimiter Label=process resident memory, Type=overview`, Current Consumption is taken from VmRSS in `/proc/self/status`, Peak Consumption is taken from VmHWM in `/proc/self/status`.
    |
    |---> Doris BE process virtual memory, corresponding to `MemTrackerLimiter Label=process virtual memory, Type=overview`, Current Consumption is taken from VmSize in `/proc/self/status`, and Peak Consumption is taken from VmPeak in `/proc/self/status`.
```

上記のメモリ構造における各領域の分析方法は次のとおりです。

1. [Jemalloc のメモリ分析](./memory-analysis/jemalloc-memory-analysis.md)

2. [グローバルメモリの分析](./memory-analysis/global-memory-analysis.md)

3. [クエリメモリの分析](./memory-analysis/query-memory-analysis.md)

4. [ロードメモリの分析](./memory-analysis/load-memory-analysis.md)

---

## メモリ問題の FAQ

一般的なメモリ問題の分析については、[メモリ問題の FAQ](./memory-issue-faq.md) を参照してください。

---

## メモリ制御戦略

Doris BE プロセスのメモリを効率的に使用し、制御可能にするためのメモリの割り当て、監視、回収については、[メモリ制御戦略](./memory-feature/memory-control-strategy.md) を参照してください。
