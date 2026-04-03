---
{
  "title": "メモリトラッカー",
  "language": "ja",
  "description": "Doris BEはMemory Trackerを使用してプロセスメモリ使用量を記録します。これにはquery、load、compactionなどのタスクのライフサイクルで使用されるメモリが含まれます。"
}
---
Doris BEはMemory Trackerを使用してプロセスのメモリ使用量を記録します。これには、query、load、compaction、schema changeなどのタスクのライフサイクルで使用されるメモリや、各種キャッシュが含まれます。Webページでのリアルタイム表示をサポートし、メモリ関連のエラーが報告された際にBEログに出力することで、メモリ分析とメモリ問題のトラブルシューティングに使用されます。

Memory Trackerの表示方法、異なるMemory Trackerで表現される過度なメモリ使用の原因、およびそれらのメモリ使用量を削減する分析方法については、Doris BEのメモリ構造と合わせて[概要](./../overview.md)で紹介されています。本記事では、Memory Trackerの原理、構造、および一般的な問題のみを紹介します。

## メモリ追跡の原理

Memory TrackerはDiris Allocatorに依存してメモリの各申請と解放を追跡します。Doris Allocatorの紹介については、[Memory Control ストラテジー](./memory-control-strategy.md)を参照してください。

プロセスメモリ：Doris BEは定期的にシステムからDoris BEプロセスのメモリを取得し、Cgroupとの互換性があります。

タスクメモリ：各query、load、compactionおよびその他のタスクは、初期化時に独自のMemory Trackerを作成し、実行中にMemory TrackerをTLS（Thread Local Storage）に配置します。Dorisのメインメモリデータ構造はAllocatorから継承されています。AllocatorはTLSのMemory Trackerでメモリの各申請と解放を記録します。

オペレータメモリ：タスクの異なる実行オペレータも、Join/Agg/Sinkなど独自のMemory Trackerを作成します。これらは手動メモリ追跡をサポートするか、TLSに配置して`Doris Allocator`によって記録され、実行ロジック制御とQuery Profileでの異なるオペレータのメモリ使用量分析に使用されます。

グローバルメモリ：グローバルメモリには主にCacheとメタデータが含まれ、異なるタスク間で共有されます。各Cacheは独自のMemory Trackerを持ち、`Doris Allocator`または手動で追跡されます。メタデータメモリは現在完全にカウントされておらず、より多くの分析はMetricsとBvarでカウントされる各種メタデータCountersに依存しています。

このうち、Doris BEプロセスメモリはオペレーティングシステムから取得され、完全に正確であると考えることができます。実装の制限により、他のMemory Trackerで追跡されるメモリは通常、実際のメモリのサブセットであり、すべてのMemory Trackerの合計がほとんどの場合Doris BEプロセスの物理メモリより少なくなる結果となります。一定の漏れがありますが、Memory Trackerで記録されるメモリはほとんどの場合より信頼性が高く、安心してメモリ分析に使用できます。さらに、Memory Trackerは実際には仮想メモリを追跡しており、通常より懸念される物理メモリではなく、それらの間には一定の誤差があります。

## Memory Tracker構造

用途に基づき、Memory Trackerは2つのカテゴリに分類されます。第1のカテゴリであるMemory Tracker Limiterは、各query、load、Compactionおよびその他のタスクとグローバルCache、TabletMetaで一意であり、メモリ使用量の観察と制御に使用されます。第2のカテゴリであるMemory Trackerは、主にクエリ実行中のメモリホットスポットを追跡するために使用されます。例えば、Join/Aggregation/Sort/window functionsのHashTable、シリアライズされた中間データなどで、クエリ内の異なるオペレータのメモリ使用量を分析し、ロードデータのフラッシングのメモリ制御に使用されます。

両者の親子関係はスナップショット印刷にのみ使用され、ラベル名と関連付けられ、ソフトリンクに相当します。同時消費のための親子関係に依存せず、ライフサイクルが互いに影響しないため、理解と使用のコストを削減します。すべてのmemory trackerはマップのセットに格納され、すべてのmemory trackerタイプのスナップショット印刷、query/load/compactionなどのタスクのスナップショット印刷、現在最もメモリを使用するquerys/loadsのグループ取得、現在最も過度にメモリを使用するquerys/loadsのグループ取得などの方法を提供します。

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker統計の欠損

Memory Tracker統計欠損の現象は、Doris 2.1前後のバージョンで異なります。

### Memory Tracker統計欠損現象

1. Doris 2.1以降では、Memory Tracker統計欠損には2つの現象があります。

- `Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きすぎる。

- Orphan Memory Trackerの値が大きすぎる。

2. Doris 2.1以前では、Orphan Memory Trackerの値が大きすぎることは、Memory Tracker統計が欠損していることを意味します。

### Memory Tracker統計欠損分析

> Doris 2.1.5以前のバージョンでは、Memory Tracker統計が欠損している、またはBEプロセスメモリが減少しない場合は、[Cache Memory Analysis](./../memory-analysis/doris-cache-memory-analysis.md)を参照してSegmentCacheメモリ使用量を分析し、テストを継続する前にSegment Cacheを閉じてみてください。

> Doris 2.1.5以前のバージョンでは、Segment Cache Memory Tackerは不正確です。これは、Primary Key Indexを含む一部のIndexメモリ統計が不正確であるためで、Segment Cacheメモリが効果的に制限されず、特に数百または数千の列を持つ大きなワイドテーブルで、しばしば過度なメモリを占有する結果となります。[Metadata Memory Analysis](./../memory-analysis/metadata-memory-analysis.md)を参照してください。Doris BE Metricsで`doris_be_cache_usage{name="SegmentCache"}`が大きくないが、Doris BE Bvarで`doris_column_reader_num`が大きい場合は、Segment Cacheのメモリ使用量を疑う必要があります。Heap Profileでメモリ使用量が大きいコールスタックで`Segment`と`ColumnReader`フィールドが見られる場合、Segment Cacheが大量のメモリを占有していることが基本的に確認できます。

上記の現象が観察される場合、クラスターが簡単に再起動でき、現象が再現可能であれば、[Heap Profile Memory Analysis](./../memory-analysis/heap-profile-memory-analysis.md)を参照してJemalloc Heap Profileを使用してプロセスメモリを分析してください。

そうでなければ、まず[Metadata Memory Analysis](./../memory-analysis/metadata-memory-analysis.md)を参照してDoris BEのメタデータメモリを分析することができます。

### Memory Tracker統計欠損の理由

以下では、Memory Tracker統計欠損の理由を紹介します。これはMemory Trackerの実装に関わるもので、通常注意する必要はありません。

#### Doris 2.1以降

1. `Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きすぎる。

`Label=sum of all trackers` Memory Trackerの値が`Label=process resident memory` Memory Trackerの70%以上を占める場合、通常Memory TrackerがDoris BEプロセスのメモリの大部分をカウントしていることを意味し、通常Memory Trackerを分析するだけでメモリの場所を特定できます。

`Label=sum of all trackers` Memory Trackerの値が`Label=process resident memory` Memory Trackerの70%未満を占める場合、Memory Tracker統計が欠損していることを意味し、Memory Trackerがメモリの場所を正確に特定できない可能性があります。

`Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差は、`Doris Allocator`によって割り当てられていないメモリです。Dorisのメインメモリデータ構造は`Doris Allocator`から継承されていますが、メタデータメモリ、RPCメモリなど、`Doris Allocator`によって割り当てられていないメモリの一部がまだあり、これもメモリリークの可能性があります。この場合、メモリ値が大きいMemory Trackerを分析することに加えて、通常メタデータメモリが妥当かどうか、メモリリークがあるかどうかに注意する必要があります。

2. Orphan Memory Trackerの値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```
Orphan Memory TrackerはデフォルトのMemory Trackerです。正または負の値は、Doris Allocatorによって割り当てられたメモリが正確に追跡されていないことを意味します。値が大きいほど、Memory Trackerの全体的な統計結果の信頼性が低くなります。その統計値は2つのソースから得られます：

- スレッド開始時にMemory TrackerがTLSにバインドされていない場合、Doris AllocatorはデフォルトでメモリをOrphan Memory Trackerに記録します。これは、このメモリ部分が不明であることを意味します。Doris Allocatorがメモリを記録する原理については、上記の[Memory Tracking Principle]を参照してください。

- QueryやLoadなどのタスクのMemory Trackerの値が破棄時に0と等しくない場合、通常はこのメモリ部分が解放されていないことを意味します。残りのメモリはOrphan Memory Trackerに記録され、これは残りのメモリがOrphan Memory Trackerによって追跡され続けることと同等です。これにより、Orphan Memory Trackerと他のMemory Trackersの合計が、Doris Allocatorによって割り当てられた全メモリと等しくなることが保証されます。

理想的には、Orphan Memory Trackerの値は0に近いことが期待されます。そのため、すべてのスレッドが開始時にQueryやLoad Memory TrackerなどのOrphan以外のMemory Trackerをアタッチすることを望んでいます。そして、すべてのQueryまたはLoad Memory Trackersが破棄時に0と等しくなることで、QueryまたはLoadの実行中に使用されたメモリが破棄時に解放されていることを意味します。

Orphan Memory Trackerが0と等しくなく、大きな値を持つ場合、大量の不明なメモリが解放されていない、またはクエリとロードの実行後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1以前

Doris 2.1以前では、すべての不明なメモリが`Label=Orphan`のMemory Trackerでカウントされていたため、Orphan Memory Trackerの大きな値はMemory Trackerの統計が欠落していることを意味していました。
