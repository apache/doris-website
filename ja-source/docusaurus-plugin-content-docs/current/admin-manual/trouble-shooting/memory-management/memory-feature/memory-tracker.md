---
{
  "title": "メモリトラッカー",
  "language": "ja",
  "description": "Doris BEはMemory Trackerを使用してプロセスのメモリ使用量を記録します。これには、query、load、compactionなどのタスクのライフサイクルで使用されるメモリが含まれます。"
}
---
Doris BEはMemory Trackerを使用してプロセスメモリ使用量を記録します。これにはクエリ、ロード、コンパクション、スキーマ変更などのタスクのライフサイクルで使用されるメモリや、さまざまなキャッシュが含まれます。Webページでのリアルタイム表示をサポートし、メモリ関連エラーが報告された際にはBEログに出力され、メモリ解析とメモリ問題のトラブルシューティングに使用されます。

Memory Trackerの表示方法、異なるMemory Trackerが示すメモリ使用量過多の理由、およびメモリ使用量を削減するための解析方法については、Doris BEメモリ構造と併せて[概要](./../overview.md)で紹介されています。本記事では、Memory Trackerの原理、構造、および一般的な問題のみを紹介します。

## メモリ追跡の原理

Memory TrackerはDoris Allocatorに依存して、メモリの各アプリケーションと解放を追跡します。Doris Allocatorの紹介については、[メモリ制御戦略](./memory-control-strategy.md)を参照してください。

プロセスメモリ：Doris BEは定期的にシステムからDoris BEプロセスメモリを取得し、Cgroupと互換性があります。

タスクメモリ：各クエリ、ロード、コンパクションなどのタスクは、初期化時に独自のMemory Trackerを作成し、実行中にMemory TrackerをTLS（Thread Local Storage）に配置します。Dorisの主要メモリデータ構造はAllocatorから継承されます。AllocatorはTLSのMemory Trackerで各アプリケーションとメモリの解放を記録します。

オペレーターメモリ：タスクの異なる実行オペレーターも独自のMemory Trakcer（Join/Agg/Sinkなど）を作成し、手動メモリ追跡をサポートするか、TLSに配置して`Doris Allocator`により記録され、実行ロジック制御とQuery Profileでの異なるオペレーターのメモリ使用量解析に使用されます。

グローバルメモリ：グローバルメモリは主にCacheとメタデータを含み、これらは異なるタスク間で共有されます。各Cacheは独自のMemory Trackerを持ち、`Doris Allocator`または手動で追跡されます。メタデータメモリは現在完全に計測されておらず、より多くの解析がMetricsとBvarによって計測されるさまざまなメタデータCounterに依存します。

このうち、Doris BEプロセスメモリはオペレーティングシステムから取得され、完全に正確であると考えることができます。実装の制限により、他のMemory Trackerによって追跡されるメモリは通常、実際のメモリの一部のみであり、大部分のケースではすべてのMemory Trackerの合計がDoris BEプロセスの物理メモリより少なくなります。一定の漏れがありますが、Memory Trackerによって記録されるメモリは大部分のケースでより信頼性が高く、安心してメモリ解析に使用できます。さらに、Memory Trackerは実際には仮想メモリを追跡しており、通常より注目される物理メモリではなく、それらの間には一定の誤差があります。

## Memory Tracker構造

用途に基づいて、Memory Trackerは2つのカテゴリに分かれます。第1カテゴリのMemory Tracker Limiterは、各クエリ、ロード、CompactionなどのタスクとグローバルCache、TabletMetaに固有であり、メモリ使用量の観察と制御に使用されます。第2カテゴリのMemory Trackerは、主にクエリ実行中のメモリホットスポットを追跡するために使用され、Join/Aggregation/Sort/ウィンドウ関数のHashTable、シリアル化された中間データなどが含まれ、クエリ内の異なるオペレーターのメモリ使用量を解析し、ロードデータフラッシュのメモリ制御に使用されます。

両者間の親子関係はスナップショット印刷にのみ使用され、ラベル名と関連付けられ、ソフトリンクに相当します。同時消費のための親子関係に依存せず、ライフサイクルは互いに影響しないため、理解と使用のコストを削減します。すべてのmemory trackerはマップのセットに保存され、すべてのmemory trackerタイプのスナップショット印刷、クエリ/ロード/コンパクションなどのタスクのスナップショット印刷、現在最もメモリを使用するクエリ/ロードのグループの取得、現在最も過剰にメモリを使用するクエリ/ロードのグループの取得などのメソッドを提供します。

![Memory Tracker Implement](/images/memory-tracker-implement.png)

## Memory Tracker統計漏れ

Memory Tracker統計漏れの現象は、Doris 2.1の前後のバージョンで異なります。

### Memory Tracker統計漏れ現象

1. Doris 2.1以降では、Memory Tracker統計漏れには2つの現象があります。

- `Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きすぎる。

- Orphan Memory Trackerの値が大きすぎる。

2. Doris 2.1より前では、Orphan Memory Trackerの値が大きすぎることは、Memory Tracker統計が漏れていることを意味します。

### Memory Tracker統計漏れ解析

> Doris 2.1.5より前のバージョンで、Memory Tracker統計が漏れているか、BEプロセスメモリが減少しない場合は、[キャッシュメモリ解析](./../memory-analysis/doris-cache-memory-analysis.md)を参照してSegmentCacheメモリ使用量を解析し、テストを継続する前にSegment Cacheを閉じることを試してください。

> Doris 2.1.5より前のバージョンでは、Segment Cache Memory Tackerは不正確です。これは、Primary Key Indexを含む一部のIndexメモリ統計が不正確であるためで、Segment Cacheメモリが効果的に制限されず、特に数百または数千の列を持つ大きなワイドテーブルで過度にメモリを占有することがよくあります。[メタデータメモリ解析](./../memory-analysis/metadata-memory-analysis.md)を参照してください。Doris BE Metricsの`doris_be_cache_usage{name="SegmentCache"}`が大きくないが、Doris BE Bvarの`doris_column_reader_num`が大きい場合、Segment Cacheのメモリ使用量を疑う必要があります。Heap Profileでメモリ使用量の大きいコールスタックに`Segment`と`ColumnReader`フィールドが見られる場合、Segment Cacheが大量のメモリを占有していることが基本的に確認できます。

上記の現象が観察された場合、クラスターを簡単に再起動でき、現象が再現できるなら、[Heap Profileメモリ解析](./../memory-analysis/heap-profile-memory-analysis.md)を参照してJemalloc Heap Profileを使用してプロセスメモリを解析してください。

そうでなければ、まず[メタデータメモリ解析](./../memory-analysis/metadata-memory-analysis.md)を参照してDoris BEのメタデータメモリを解析できます。

### Memory Tracker統計漏れの理由

以下では、Memory Tracker統計漏れの理由を紹介します。これはMemory Trackerの実装に関わり、通常は注意を払う必要がありません。

#### Doris 2.1以降

1. `Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差が大きすぎる。

`Label=sum of all trackers` Memory Trackerの値が`Label=process resident memory` Memory Trackerの70%以上を占める場合、通常Memory TrackerがDoris BEプロセスのメモリの大部分を計測していることを意味し、通常Memory Trackerを解析するだけでメモリの位置を特定できます。

`Label=sum of all trackers` Memory Trackerの値が`Label=process resident memory` Memory Trackerの70%未満を占める場合、Memory Tracker統計が漏れていることを意味し、Memory Trackerがメモリの位置を正確に特定できない可能性があります。

`Label=process resident memory` Memory Trackerと`Label=sum of all trackers` Memory Trackerの差は、`Doris Allocator`によって割り当てられていないメモリです。Dorisの主要メモリデータ構造は`Doris Allocator`から継承されていますが、`Doris Allocator`によって割り当てられていないメモリの一部がまだ存在し、メタデータメモリ、RPCメモリなどが含まれ、これらもメモリリークの可能性があります。この場合、大きなメモリ値を持つMemory Trackerを解析することに加えて、通常メタデータメモリが合理的であるか、メモリリークがあるかに注意を払う必要があります。

2. Orphan Memory Trackerの値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```
Orphan Memory TrackerはデフォルトのMemory Trackerです。正または負の値は、Doris Allocatorによって割り当てられたメモリが正確に追跡されていないことを意味します。値が大きいほど、Memory Trackerの全体的な統計結果の信頼性が低くなります。その統計値は2つのソースから取得されます：

- スレッド開始時にMemory TrackerがTLSにバインドされていない場合、Doris AllocatorはデフォルトでメモリをOrphan Memory Trackerに記録します。これは、このメモリ部分が不明であることを意味します。Doris Allocatorがメモリを記録する原理については、上記の[Memory Tracking Principle]を参照してください。

- QueryやLoadなどのタスクのMemory Trackerの値が破棄時に0と等しくない場合、通常はこのメモリ部分が解放されていないことを意味します。残りのメモリはOrphan Memory Trackerに記録され、これは残りのメモリがOrphan Memory Trackerによって継続的に追跡されることと同等です。これにより、Orphan Memory Trackerと他のMemory Trackersの合計がDoris Allocatorによって割り当てられた全メモリと等しくなることが保証されます。

理想的には、Orphan Memory Trackerの値は0に近いことが期待されます。そのため、すべてのスレッドが開始時にOrphan以外のMemory Tracker（QueryやLoad Memory Trackerなど）をアタッチすることを希望します。そして、すべてのQueryまたはLoad Memory Trackersが破棄時に0と等しくなること、つまりQueryまたはLoadの実行中に使用されたメモリが破棄時に解放されていることを意味します。

Orphan Memory Trackerが0と等しくなく、大きな値を持つ場合、大量の不明なメモリが解放されていない、またはqueryとloadの実行後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1以前

Doris 2.1以前は、すべての不明なメモリが`Label=Orphan`のMemory Trackerでカウントされていたため、Orphan Memory Trackerの大きな値はMemory Tracker統計が欠落していることを意味します。
