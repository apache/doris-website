---
{
  "title": "概要 | メモリ管理",
  "language": "ja",
  "description": "メモリ管理は、Dorisの最も重要なコンポーネントの一つです。Dorisの動作中、",
  "sidebar_label": "Overview"
}
---
# 概要

メモリ管理はDorisの最も重要なコンポーネントの一つです。Dorisの動作中、ロードとクエリの両方が大量のメモリ操作に依存しています。メモリ管理の品質は、Dorisの安定性とパフォーマンスに直接影響を与えます。

MPPアーキテクチャに基づくOLAPデータベースとして、Apache Dorisは、ディスクからメモリにデータをロードした後、オペレータ間でストリーミングと計算を行い、計算の中間結果をメモリに格納します。この方法により、頻繁なディスクI/O操作が削減され、複数のマシンと複数のコアの並列計算機能を最大限に活用することで、パフォーマンスにおいて大きなメリットを示すことができます。

巨大なメモリリソース消費を伴う複雑な計算と大規模な操作に直面する際、効果的なメモリ割り当て、統計、制御は、システムの安定性において非常に重要な役割を果たします。より高速なメモリ割り当て速度により、クエリパフォーマンスが効果的に向上し、メモリ割り当て、追跡、制限により、メモリホットスポットが発生せず、メモリ不足に適時かつ正確に対応し、可能な限りOOMとクエリ失敗を回避できます。これらの一連のメカニズムにより、システム安定性が大幅に向上します。同時に、より正確なメモリ統計は、大きなクエリがディスクにフォールバックするための基盤でもあります。

## Doris BEメモリ構造

![Doris BEメモリ構造](/images/memory-structure.png)

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

## Memory View

Doris BEはMemory Trackerを使用してプロセスメモリ使用量を記録し、Webページでの表示をサポートし、メモリ関連エラーが報告された際にBEログに出力して、メモリ分析とトラブルシューティングを行います。

### リアルタイムメモリ統計

リアルタイムメモリ統計は、Doris BEのWebページ `http://{be_host}:{be_web_server_port}/mem_tracker` で表示できます。このページでは、Query/Load/Compaction/Globalなどを含む `type=overview` のMemory Trackerによって追跡される現在のメモリサイズとピークメモリサイズが表示されます。`be_web_server_port` のデフォルトは8040です。

![image](/images/memory-used-by-subsystem.png)

Memory Trackerは異なるタイプに分けられます。type=overviewのMemory Trackerのうち、`process resident memory`、`process virtual memory`、および `sum of all trackers` を除く他のtype=overviewのMemory Trackerの詳細は、`http://{be_host}:{be_web_server_port}/mem_tracker?type=Lable` で表示できます。

Memory Trackerには以下のプロパティがあります：

1. Label: Memory Trackerの名前
2. Current Consumption(Bytes): 現在のメモリ値、単位はB。
3. Current Consumption(Normalize): 現在のメモリ値の.G.M.K形式での出力。
4. Peak Consumption (Bytes): BEプロセス開始後のピークメモリ値、単位はB、BE再起動後にリセットされます。
5. Peak Consumption (Normalize): BEプロセス開始後のピークメモリ値の.G.M.K形式での出力、BE再起動後にリセットされます。
6. Parent Label: 2つのmemory tracker間の親子関係を示すために使用されます。Child Trackerで記録されるメモリはParent Trackerのサブセットです。同じParentを持つ異なるtrackerで記録されるメモリは重複する場合があります。

Memory Trackerの詳細については、[Memory Tracker](./memory-feature/memory-tracker.md) を参照してください。

### 履歴メモリ統計

履歴メモリ統計は、Doris BEのBvarページ `http://{be_host}:{brpc_port}/vars/*memory_*` で表示できます。リアルタイムメモリ統計ページ `http://{be_host}:{be_web_server_port}/mem_tracker` を使用してMemory Tracker Label配下のBvarページを検索し、対応するMemory Trackerで追跡されるメモリサイズの変化傾向を取得します。`brpc_port` のデフォルトは8060です。

![Historical memory statistics-Bvar Memory](/images/bvar-memory.png)

エラープロセスメモリが制限を超過したり利用可能メモリが不足したりした場合、`be/log/be.INFO` ログで `Memory Tracker Summary` を見つけることができます。これには `Type=overview` と `Type=global` のすべてのMemory Trackerが含まれており、ユーザーがその時のメモリ状況を分析するのに役立ちます。詳細については、[Memory Log Analysis](./memory-analysis/memory-log-analysis.md) を参照してください。

---

## Memory Analysis

上記のメモリ構造の `tracked` 配下の各メモリ部分に `type=overview` のMemory Trackerを対応させます：

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
上記のメモリ構造における各メモリ部分の分析方法:

1. [Jemallocメモリ分析](./memory-analysis/jemalloc-memory-analysis.md)

2. [グローバルメモリ分析](./memory-analysis/global-memory-analysis.md)

3. [クエリメモリ分析](./memory-analysis/query-memory-analysis.md)

4. [ロードメモリ分析](./memory-analysis/load-memory-analysis.md)

---

## メモリ問題FAQ

一般的なメモリ問題を分析するには、[メモリ問題FAQ](./memory-issue-faq.md)を参照してください。

---

## メモリ制御戦略

Doris BEプロセスの効率的で制御可能なメモリを確保するメモリ割り当て、監視、およびリサイクルの紹介については、[Memory Control Strategy](./memory-feature/memory-control-strategy.md)を参照してください。
