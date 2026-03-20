---
{
  "title": "メモリトラッカー",
  "language": "ja",
  "description": "Doris BEはMemory Trackerを使用してプロセスのメモリ使用量を記録します。これには、query、load、compactionなどのタスクのライフサイクルで使用されるメモリが含まれます。"
}
---
Doris BEは、Memory Trackerを使用してプロセスメモリ使用量を記録します。これには、query、load、compaction、schema changeなどのタスクのライフサイクルで使用されるメモリや、さまざまなキャッシュが含まれます。Webページでのリアルタイム表示をサポートし、メモリ関連エラーが報告された際にBEログに出力することで、メモリ分析とメモリ問題のトラブルシューティングに使用されます。

Memory Trackerの表示方法、異なるMemory Trackerで表される過度なメモリ使用の原因、およびそれらのメモリ使用量を削減するための分析方法については、Doris BEメモリ構造と併せて[概要](./../overview.md)で紹介されています。この記事では、Memory Trackerの原理、構造、および一般的な問題のみを紹介します。

## Memory Tracking原理

Memory Trackerは、各メモリのアプリケーションと解放を追跡するためにDoris Allocatorに依存しています。Doris Allocatorの紹介については、[Memory Control ストラテジー](./memory-control-strategy.md)を参照してください。

プロセスメモリ：Doris BEは定期的にシステムからDoris BEプロセスメモリを取得し、Cgroupと互換性があります。

タスクメモリ：query、load、compactionなどの各タスクは、初期化時に独自のMemory Trackerを作成し、実行中にMemory TrackerをTLS（Thread Local Storage）に配置します。Dorisの主要なメモリデータ構造はAllocatorを継承しています。AllocatorはTLSのMemory Trackerで各メモリのアプリケーションと解放を記録します。

オペレーターメモリ：タスクの異なる実行オペレーターも、Join/Agg/Sinkなど、独自のMemory Trakkerを作成します。これらは手動メモリ追跡をサポートするか、TLSに配置して`Doris Allocator`によって記録され、実行ロジック制御とQuery Profileでの異なるオペレーターのメモリ使用量分析に使用されます。

グローバルメモリ：グローバルメモリは主にCacheとmetadataを含み、異なるタスク間で共有されます。各Cacheは独自のMemory Trackerを持ち、`Doris Allocator`によって追跡されるか手動で追跡されます。metadataメモリは現在完全にカウントされておらず、より多くの分析はMetricsとBvarによってカウントされるさまざまなmetadata Countersに依存しています。

その中で、Doris BEプロセスメモリはオペレーティングシステムから取得され、完全に正確と考えることができます。実装の制限により、他のMemory Trackerによって追跡されるメモリは通常、実際のメモリのサブセットのみであり、結果として、すべてのMemory Trackerの合計がほとんどの場合、Doris BEプロセスの物理メモリより少なくなります。一定の漏れがありますが、Memory Trackerによって記録されるメモリはほとんどの場合より信頼性があり、安心してメモリ分析に使用できます。さらに、Memory Trackerは実際には仮想メモリを追跡し、通常より関心のある物理メモリではなく、それらの間には一定の誤差があります。

## Memory Tracker構造

使用方法に基づいて、Memory Trackerは2つのカテゴリに分けられます。最初のカテゴリであるMemory Tracker Limiterは、各query、load、CompactionなどのタスクやグローバルCache、TabletMetaでユニークであり、メモリ使用量の観察と制御に使用されます。2番目のカテゴリであるMemory Trackerは、主にquery実行中のメモリホットスポットを追跡するために使用され、Join/Aggregation/Sort/window functionsのHashTable、シリアル化された中間データなどが含まれ、queryでの異なるオペレーターのメモリ使用量を分析し、loadデータのflushing用のメモリ制御に使用されます。

両者間の親子関係はスナップショット印刷にのみ使用され、ラベル名と関連付けられ、ソフトリンクに相当します。同時消費のための親子関係に依存せず、ライフサイクルは互いに影響せず、理解と使用のコストを削減します。すべてのmemory trackerはマップのセットに保存され、すべてのmemory trackerタイプのスナップショット印刷、query/load/compactionなどのタスクのスナップショット印刷、現在最もメモリを使用するqueriesまたはloadsのグループの取得、現在最も過度にメモリを使用するqueriesまたはloadsのグループの取得などの方法を提供します。

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker統計漏れ

Memory Tracker統計漏れの現象は、Doris 2.1前後のバージョンで異なります。

### Memory Tracker統計漏れ現象

1. Doris 2.1以降、Memory Tracker統計漏れには2つの現象があります。

- `Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きすぎる。

- Orphan Memory Trackerの値が大きすぎる。

2. Doris 2.1以前では、Orphan Memory Trackerの値が大きすぎることは、Memory Tracker統計が漏れていることを意味します。

### Memory Tracker統計漏れ分析

> Doris 2.1.5以前のバージョンで、Memory Tracker統計が漏れている、またはBEプロセスメモリが減少しない場合は、[Cache Memory Analysis](./../memory-analysis/doris-cache-memory-analysis.md)を参照してSegmentCacheメモリ使用量を分析し、テストを継続する前にSegment Cacheを閉じることを試してください。

> Doris 2.1.5以前のバージョンでは、Segment Cache Memory Tackerは不正確です。これは、Primary Key Indexを含む一部のIndexメモリ統計が不正確であることが原因で、結果としてSegment Cacheメモリが効果的に制限されず、しばしば過度のメモリを占有し、特に数百または数千の列を持つ大きなwide tableで発生します。[Metadata Memory Analysis](./../memory-analysis/metadata-memory-analysis.md)を参照してください。Doris BE Metricsの`doris_be_cache_usage{name="SegmentCache"}`が大きくないが、Doris BE Bvarの`doris_column_reader_num`が大きい場合は、Segment Cacheのメモリ使用量を疑う必要があります。Heap Profileでメモリ使用量の大きなコールスタックに`Segment`と`ColumnReader`フィールドが見える場合、Segment Cacheが大量のメモリを占有していることが基本的に確認できます。

上記の現象が観察された場合、クラスターを簡単に再起動でき、現象を再現できる場合は、[Heap Profile Memory Analysis](./../memory-analysis/heap-profile-memory-analysis.md)を参照してJemalloc Heap Profileを使用してプロセスメモリを分析してください。

そうでなければ、まず[Metadata Memory Analysis](./../memory-analysis/metadata-memory-analysis.md)を参照してDoris BEのmetadataメモリを分析できます。

### Memory Tracker統計漏れの理由

以下では、Memory Tracker統計漏れの理由を紹介します。これはMemory Trackerの実装に関わり、通常は注意を払う必要はありません。

#### Doris 2.1以降

1. `Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きすぎる。

`Label=sum of all trackers` Memory Trackerの値が`Label=process resident memory` Memory Trackerの70%以上を占める場合、通常、Memory TrackerがDoris BEプロセスのメモリの大部分をカウントしていることを意味し、通常はMemory Trackerを分析するだけでメモリの場所を特定できます。

`Label=sum of all trackers` Memory Trackerの値が`Label=process resident memory` Memory Trackerの70%未満を占める場合、Memory Tracker統計が漏れていることを意味し、Memory Trackerではメモリの場所を正確に特定できない可能性があります。

`Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差は、`Doris Allocator`によって割り当てられていないメモリです。Dorisの主要なメモリデータ構造は`Doris Allocator`を継承していますが、metadataメモリ、RPCメモリなど、`Doris Allocator`によって割り当てられていないメモリの一部がまだあり、これもメモリリークの可能性があります。この場合、大きなメモリ値のMemory Trackerを分析することに加えて、通常、metadataメモリが妥当かどうか、メモリリークがあるかどうかに注意を払う必要があります。

2. Orphan Memory Trackerの値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```
Orphan Memory TrackerはデフォルトのMemory Trackerです。正または負の値は、Doris Allocatorによって割り当てられたメモリが正確に追跡されていないことを意味します。値が大きいほど、Memory Trackerの全体的な統計結果の信頼性は低くなります。その統計値は2つのソースから得られます：

- スレッドの開始時にMemory TrackerがTLSにバインドされていない場合、Doris AllocatorはデフォルトでメモリをOrphan Memory Trackerに記録します。これは、このメモリの一部が不明であることを意味します。Doris Allocatorがメモリを記録する原理については、上記の[Memory Tracking Principle]を参照してください。

- QueryやLoadなどのタスクのMemory Trackerの値が破棄時に0と等しくない場合、通常、このメモリの一部が解放されていないことを意味します。残りのメモリはOrphan Memory Trackerに記録され、これは残りのメモリをOrphan Memory Trackerによって引き続き追跡させることと等価です。これにより、Orphan Memory Trackerと他のMemory Trackersの合計がDoris Allocatorによって割り当てられたすべてのメモリと等しくなることが保証されます。

理想的には、Orphan Memory Trackerの値は0に近いことが期待されます。そのため、すべてのスレッドが開始時にOrphan以外のMemory Tracker（QueryやLoad Memory Trackerなど）をアタッチすることを希望します。そして、すべてのQueryまたはLoad Memory Trackersが破棄時に0と等しくなることを希望します。これは、QueryまたはLoadの実行中に使用されたメモリが破棄時に解放されたことを意味します。

Orphan Memory Trackerが0と等しくなく、大きな値を持つ場合、大量の不明なメモリが解放されていない、またはクエリとロードの実行後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1以前

Doris 2.1以前は、すべての不明なメモリが`Label=Orphan` Memory Trackerでカウントされていたため、Orphan Memory Trackerの値が大きいということは、Memory Tracker統計が不足していることを意味します。
