---
{
  "title": "メモリトラッカー",
  "language": "ja",
  "description": "Doris BEはMemory Trackerを使用してプロセスのメモリ使用量を記録します。これには、query、load、compactionなどのタスクのライフサイクルで使用されるメモリが含まれます。"
}
---
Doris BEはMemory Trackerを使用してプロセスメモリ使用量を記録します。これには、query、load、compaction、schema changeなどのタスクのライフサイクルで使用されるメモリや、様々なキャッシュが含まれます。Webページでのリアルタイム表示をサポートし、メモリ関連のエラーが報告された際にはBEログに出力され、メモリ分析とメモリ問題のトラブルシューティングに使用されます。

Memory Trackerの表示方法、異なるMemory Trackerによって表される過度なメモリ使用量の理由、およびそれらのメモリ使用量を削減するための分析方法については、Doris BEメモリ構造と合わせて[概要](./../overview.md)で紹介されています。本記事では、Memory Trackerの原理、構造、および一般的な問題のみを紹介します。

## メモリ追跡の原理

Memory TrackerはDoris Allocatorに依存して、各メモリのアプリケーションとリリースを追跡します。Doris Allocatorの紹介については、[Memory Control ストラテジー](./memory-control-strategy.md)を参照してください。

プロセスメモリ：Doris BEは定期的にシステムからDoris BEプロセスメモリを取得し、Cgroupと互換性があります。

タスクメモリ：query、load、compactionなどの各タスクは、初期化時に独自のMemory Trackerを作成し、実行中にMemory TrackerをTLS（Thread Local Storage）に配置します。Dorisの主要なメモリデータ構造はAllocatorから継承されています。AllocatorはTLSのMemory Trackerに各メモリのアプリケーションとリリースを記録します。

オペレータメモリ：タスクの異なる実行オペレータもJoin/Agg/Sinkなど、独自のMemory Trakkerを作成します。これは手動メモリ追跡をサポートするか、TLSに配置され`Doris Allocator`によって記録され、実行ロジック制御とQuery Profileでの異なるオペレータのメモリ使用量分析に使用されます。

グローバルメモリ：グローバルメモリは主にCacheとメタデータを含み、異なるタスク間で共有されます。各Cacheは独自のMemory Trackerを持ち、`Doris Allocator`によって追跡されるか手動で追跡されます。メタデータメモリは現在完全にカウントされておらず、より多くの分析はMetricsとBvarによってカウントされる様々なメタデータCountersに依存します。

このうち、Doris BEプロセスメモリはオペレーティングシステムから取得され、完全に正確であると考えることができます。実装の制限により、他のMemory Trackerによって追跡されるメモリは通常、実際のメモリのサブセットに過ぎないため、すべてのMemory Trackerの合計が大部分の場合でDoris BEプロセスの物理メモリより少なくなります。一定の漏れがありますが、Memory Trackerによって記録されるメモリはほとんどの場合で信頼性が高く、安心してメモリ分析に使用できます。また、Memory Trackerは実際には仮想メモリを追跡し、通常より注目される物理メモリではないため、それらの間には一定の誤差があります。

## Memory Tracker構造

使用法に基づいて、Memory Trackerは2つのカテゴリに分けられます。第1のカテゴリであるMemory Tracker Limiterは、各query、load、CompactionなどのタスクとグローバルCache、TabletMetaで一意であり、メモリ使用量の観察と制御に使用されます。第2のカテゴリであるMemory Trackerは、主にクエリ実行中のメモリホットスポットを追跡するために使用され、Join/Aggregation/Sort/ウィンドウ関数のHashTable、シリアル化された中間データなどを含み、クエリ内の異なるオペレータのメモリ使用量を分析し、ロードデータフラッシングのメモリ制御に使用されます。

両者間の親子関係はスナップショット印刷にのみ使用され、ラベル名と関連付けられ、ソフトリンクに相当します。同時消費のために親子関係に依存せず、ライフサイクルは互いに影響しないため、理解と使用のコストが削減されます。すべてのメモリトラッカーはマップのセットに格納され、すべてのメモリトラッカータイプのスナップショット印刷、query/load/compactionなどのタスクのスナップショット印刷、現在最も多くのメモリを使用するquery/loadのグループの取得、現在最も過度なメモリを使用するquery/loadのグループの取得などのメソッドを提供します。

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker統計の欠落

Memory Tracker統計の欠落現象は、Doris 2.1前後のバージョンで異なります。

### Memory Tracker統計欠落現象

1. Doris 2.1以降でMemory Tracker統計欠落の現象は2つあります。

- `Label=process resident memory`Memory Trackerと`Label=sum of all trackers`Memory Trackerの差が大きすぎる。

- Orphan Memory Trackerの値が大きすぎる。

2. Doris 2.1以前では、Orphan Memory Trackerの値が大きすぎることは、Memory Tracker統計が欠落していることを意味します。

### Memory Tracker統計欠落分析

> Doris 2.1.5以前のバージョンで、Memory Tracker統計が欠落しているか、BEプロセスメモリが減少しない場合は、[Cache Memory Analysis](./../memory-analysis/doris-cache-memory-analysis.md)を参照してSegmentCacheメモリ使用量を分析し、テストを続ける前にSegment Cacheを閉じてみてください。

> Doris 2.1.5以前のバージョンでは、Segment Cache Memory Tacterは不正確です。これは、Primary Key Indexを含む一部のIndexメモリ統計が不正確であるためで、Segment Cacheメモリが効果的に制限されず、特に数百または数千のカラムを持つ大きな幅広テーブルで過度なメモリを占有することが多いからです。[Metadata Memory Analysis](./../memory-analysis/metadata-memory-analysis.md)を参照してください。Doris BE Metricsの`doris_be_cache_usage{name="SegmentCache"}`が大きくないが、Doris BE Bvarの`doris_column_reader_num`が大きい場合は、Segment Cacheのメモリ使用量を疑う必要があります。Heap Profileで大きなメモリ使用量のコールスタックに`Segment`と`ColumnReader`フィールドが見られる場合、Segment Cacheが大量のメモリを占有していることがほぼ確認できます。

上記の現象が観察される場合、クラスターを簡単に再起動でき現象を再現できる場合は、[Heap Profile Memory Analysis](./../memory-analysis/heap-profile-memory-analysis.md)を参照してJemalloc Heap Profileを使用してプロセスメモリを分析してください。

そうでない場合は、まず[Metadata Memory Analysis](./../memory-analysis/metadata-memory-analysis.md)を参照してDoris BEのメタデータメモリを分析できます。

### Memory Tracker統計欠落の理由

以下では、Memory Tracker統計欠落の理由を紹介します。これはMemory Trackerの実装に関わり、通常は注意する必要がありません。

#### Doris 2.1以降

1. `Label=process resident memory`Memory Trackerと`Label=sum of all trackers`Memory Trackerの差が大きすぎる。

`Label=sum of all trackers`Memory Trackerの値が`Label=process resident memory`Memory Trackerの70%以上を占める場合、通常はMemory TrackerがDoris BEプロセスのメモリの大部分をカウントしていることを意味し、通常はMemory Trackerを分析するだけでメモリの場所を特定できます。

`Label=sum of all trackers`Memory Trackerの値が`Label=process resident memory`Memory Trackerの70%未満を占める場合、Memory Tracker統計が欠落していることを意味し、Memory Trackerではメモリの場所を正確に特定できない可能性があります。

`Label=process resident memory`Memory Trackerと`Label=sum of all trackers`Memory Trackerの差は、`Doris Allocator`によって割り当てられていないメモリです。Dorisの主要なメモリデータ構造は`Doris Allocator`から継承されていますが、メタデータメモリ、RPCメモリなど、`Doris Allocator`によって割り当てられていない部分のメモリがまだあり、これはメモリリークである可能性もあります。この場合、大きなメモリ値を持つMemory Trackerを分析することに加えて、通常はメタデータメモリが合理的かどうか、メモリリークがあるかどうかに注意する必要があります。

2. Orphan Memory Trackerの値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```
Orphan Memory TrackerはデフォルトのMemory Trackerです。正または負の値は、Doris Allocatorによって割り当てられたメモリが正確に追跡されていないことを意味します。値が大きいほど、Memory Trackerの全体的な統計結果の信頼性は低くなります。その統計値は2つのソースから取得されます：

- スレッド開始時にMemory TrackerがTLSにバインドされていない場合、Doris AllocatorはデフォルトでOrphan Memory Trackerにメモリを記録します。これは、この部分のメモリが不明であることを意味します。Doris Allocatorがメモリを記録する原理については、上記の[Memory Tracking Principle]を参照してください。

- QueryやLoadなどのタスクのMemory Trackerの値が破棄時に0と等しくない場合、通常はこの部分のメモリが解放されていないことを意味します。残りのメモリはOrphan Memory Trackerに記録され、これは残りのメモリをOrphan Memory Trackerによって追跡し続けることと同等です。これにより、Orphan Memory Trackerと他のMemory Trackersの合計がDoris Allocatorによって割り当てられたすべてのメモリと等しくなることが保証されます。

理想的には、Orphan Memory Trackerの値は0に近いことが期待されます。そのため、すべてのスレッドが開始時にOrphan以外のMemory Tracker（QueryやLoad Memory Trackerなど）をアタッチすることを希望します。そして、すべてのQueryまたはLoad Memory Trackersが破棄時に0と等しくなることで、QueryまたはLoadの実行中に使用されたメモリが破棄時に解放されたことを意味します。

Orphan Memory Trackerが0と等しくなく、大きな値を持つ場合、大量の不明なメモリが解放されていない、またはクエリとロードの実行後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1より前

Doris 2.1より前では、すべての不明なメモリは`Label=Orphan`のMemory Trackerでカウントされていたため、Orphan Memory Trackerの大きな値はMemory Tracker統計が欠落していることを意味します。
