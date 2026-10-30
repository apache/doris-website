---
{
    "title": "Memory Tracker",
    "language": "ja",
    "description": "Doris BE は Memory Tracker を使用してプロセスメモリ使用量を記録します。クエリ、データロード、Compaction などのタスクのライフサイクル中に使用されるメモリを含みます。"
}
---

Doris BE は Memory Tracker を使用してプロセスメモリ使用量を記録します。これには、クエリ、データロード、Compaction、Schema Change などのタスクのライフサイクル中に使用されるメモリと、各種キャッシュが含まれます。Web ページでリアルタイムに表示でき、メモリ関連エラーが報告されたときは BE ログに出力されるため、メモリ分析やメモリ問題のトラブルシューティングに利用できます。

Memory Tracker の表示方法、異なる Memory Tracker が示す過剰なメモリ使用量の原因、およびそのメモリ使用量を削減する分析方法については、Doris BE のメモリ構造と併せて [概要](./../overview.md) で説明しています。この記事では Memory Tracker の原理、構造、およびいくつかの一般的な問題のみを説明します。

## メモリ追跡の原理 {#memory-tracking-principle}

Memory Tracker は Doris Allocator に依存して、メモリの各割り当てと解放を追跡します。Doris Allocator の概要については [メモリ制御戦略](./memory-control-strategy.md) を参照してください。

プロセスメモリ：Doris BE はシステムから Doris BE プロセスのメモリを定期的に取得し、Cgroup と互換性があります。

タスクメモリ：各クエリ、データロード、Compaction などのタスクは初期化時に固有の Memory Tracker を作成し、実行中に Memory Tracker を TLS（Thread Local Storage）に格納します。Doris の主要なメモリデータ構造は Allocator を継承しており、Allocator はメモリの各割り当てと解放を TLS の Memory Tracker に記録します。

オペレータメモリ：タスクの異なる実行オペレータも独自の Memory Trakcer を作成します。Join/Agg/Sink などがその例で、メモリ追跡を手動で行うか、TLS に格納して `Doris Allocator` に記録させ、実行ロジックの制御や Query Profile で各オペレータのメモリ使用量を分析できます。

グローバルメモリ：グローバルメモリには主に、異なるタスク間で共有される Cache とメタデータが含まれます。各 Cache には固有の Memory Tracker があり、`Doris Allocator` または手動で追跡します。メタデータメモリは現時点では完全にはカウントされず、Metrics と Bvar でカウントされた各種メタデータ Counter による分析により多くを依存します。

このうち、Doris BE プロセスメモリはオペレーティングシステムから取得されるため、完全に正確とみなせます。その他の Memory Tracker が追跡するメモリは実装上の制約により通常は実メモリの一部にすぎず、多くの場合、すべての Memory Tracker の合計は Doris BE プロセスの物理メモリより小さくなります。一定の漏れはありますが、Memory Tracker が記録するメモリは多くの場合信頼性が高く、安心してメモリ分析に使用できます。さらに、Memory Tracker が実際に追跡するのは仮想メモリであり、通常より重視される物理メモリではないため、両者の間には一定の誤差があります。

## Memory Tracker の構造 {#memory-tracker-structure}

用途に基づき、Memory Tracker は二種類に分類されます。最初の Memory Tracker Limiter は、各クエリ、データロード、Compaction などのタスク、およびグローバルな Cache と TabletMeta ごとに固有で、メモリ使用量の監視と制御に使用されます。次の Memory Tracker は主に、クエリ実行中のメモリホットスポット（Join/Aggregation/Sort/ウィンドウ関数の HashTable、シリアライズされた中間データなど）を追跡し、クエリ内の各オペレータのメモリ使用量を分析するとともに、ロードデータのフラッシュ時のメモリ制御に使用されます。

両者の親子関係はスナップショットの出力にのみ使用され、ラベル名で関連付けられるソフトリンクに相当します。親子関係に依存して同時に消費することはなく、ライフサイクルも互いに影響しないため、理解と利用のコストを削減できます。すべての Memory Tracker は一連の Map に格納され、すべての Memory Tracker Type のスナップショット、クエリ/ロード/Compaction などのタスクのスナップショットを出力するメソッド、現在最も多くのメモリを使用しているクエリ/ロードのグループを取得するメソッド、および現在最も過剰にメモリを使用しているクエリ/ロードのグループを取得するメソッドなどを提供します。

![Memory Tracker の実装](/images/memory-tracker-implement.png)

## Memory Tracker 統計情報の欠落 {#memory-tracker-statistics-missing}

Doris 2.1 より前と後のバージョンでは、Memory Tracker 統計情報の欠落現象が異なります。

### Memory Tracker 統計情報の欠落現象 {#memory-tracker-statistics-missing-phenomenon}

1. Doris 2.1 以降では、Memory Tracker 統計情報の欠落に二つの現象があります。

- `Label=process resident memory` Memory Tracker と `Label=sum of all trackers` Memory Tracker の差が大きすぎる。

- Orphan Memory Tracker の値が大きすぎる。

2. Doris 2.1 より前では、Orphan Memory Tracker の値が大きいことが Memory Tracker 統計情報の欠落を意味します。

### Memory Tracker 統計情報の欠落の分析 {#memory-tracker-statistics-missing-analysis}

> Doris 2.1.5 より前のバージョンで Memory Tracker 統計情報が欠落している、または BE プロセスメモリが減少しない場合は、[キャッシュメモリ分析](./../memory-analysis/doris-cache-memory-analysis.md) を参照して SegmentCache のメモリ使用量を分析し、Segment Cache を閉じてからテストを続行してください。

> Doris 2.1.5 より前のバージョンでは、Segment Cache Memory Tacker は不正確です。これは Primary Key Index を含む一部の Index のメモリ統計が不正確で、その結果 Segment Cache メモリが効果的に制限されず、特に数百列または数千列を持つ大規模なワイドテーブルで過剰なメモリを占有することが多いためです。[メタデータメモリ分析](./../memory-analysis/metadata-memory-analysis.md) を参照してください。Doris BE Metrics の `doris_be_cache_usage{name="SegmentCache"}` が大きくない一方、Doris BE Bvar の `doris_column_reader_num` が大きい場合は、Segment Cache のメモリ使用量を疑う必要があります。Heap Profile でメモリ使用量の大きいコールスタックに `Segment` と `ColumnReader` フィールドが表示される場合、Segment Cache が大量のメモリを占有していることをほぼ確認できます。

上記の現象が観察され、クラスターを容易に再起動でき、かつ現象を再現できる場合は、[Heap Profile メモリ分析](./../memory-analysis/heap-profile-memory-analysis.md) を参照して Jemalloc Heap Profile でプロセスメモリを分析してください。

それ以外の場合は、まず [メタデータメモリ分析](./../memory-analysis/metadata-memory-analysis.md) を参照して Doris BE のメタデータメモリを分析できます。

### Memory Tracker 統計情報が欠落する理由 {#reasons-for-missing-memory-tracker-statistics}

以下では Memory Tracker 統計情報が欠落する理由を説明します。これらは Memory Tracker の実装に関係するもので、通常は注意する必要はありません。

#### Doris 2.1 以降 {#doris-21-and-later}

1. `Label=process resident memory` Memory Tracker と `Label=sum of all trackers` Memory Tracker の差が大きすぎる。

`Label=sum of all trackers` Memory Tracker の値が `Label=process resident memory` Memory Tracker の70%以上を占める場合、通常、Memory Tracker が Doris BE プロセスのメモリの大部分をカウントしていることを意味し、通常は Memory Tracker を分析してメモリ位置を特定するだけで済みます。

`Label=sum of all trackers` Memory Tracker の値が `Label=process resident memory` Memory Tracker の70%未満を占める場合、Memory Tracker 統計情報が欠落していることを意味し、この時点では Memory Tracker でメモリ位置を正確に特定できない可能性があります。

`Label=process resident memory` Memory Tracker と `Label=sum of all trackers` Memory Tracker の差分は、`Doris Allocator` で割り当てられていないメモリです。Doris の主要なメモリデータ構造は `Doris Allocator` を継承していますが、メタデータメモリや RPC メモリなど、`Doris Allocator` で割り当てられていないメモリも一部存在し、メモリリークである可能性もあります。この場合、メモリ値の大きい Memory Tracker を分析するだけでなく、通常はメタデータメモリが妥当か、メモリリークが存在するかどうかにも注意する必要があります。

2. Orphan Memory Tracker の値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Orphan Memory Tracker はデフォルトの Memory Tracker です。値が正でも負でも、Doris Allocator によって割り当てられたメモリが正確に追跡されていないことを意味します。値が大きいほど、Memory Tracker 全体の統計結果の信頼性が低くなります。その統計値には二つのソースがあります。

- スレッド開始時に Memory Tracker が TLS にバインドされていない場合、Doris Allocator はデフォルトでメモリを Orphan Memory Tracker に記録します。これは、このメモリの所属が不明であることを意味します。Doris Allocator がメモリを記録する原理については、前述の [メモリ追跡の原理] を参照してください。

- Query や Load などのタスクの Memory Tracker が破棄時に0でない場合、通常、そのメモリの一部が解放されていないことを意味します。残りのメモリは Orphan Memory Tracker に記録され、残りのメモリの追跡を Orphan Memory Tracker に継続させるのと同じです。これにより、Orphan Memory Tracker と他の Memory Tracker の合計が、Doris Allocator によって割り当てられたすべてのメモリと等しくなります。

理想的には、Orphan Memory Tracker の値は0に近いことが期待されます。そこで、すべてのスレッドが開始時に Orphan 以外の Memory Tracker（Query または Load Memory Tracker など）をアタッチすることを望みます。また、すべての Query または Load Memory Tracker が破棄時に0であることも必要です。これは、Query または Load の実行中に使用されたメモリが、破棄時までに解放されていることを意味します。

Orphan Memory Tracker が0ではなく、値が大きい場合、大量の所属不明メモリが解放されていないか、クエリとロードの実行後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1 より前 {#before-doris-21}

Doris 2.1 より前では、所属不明のメモリをすべて `Label=Orphan` Memory Tracker にカウントしていたため、Orphan Memory Tracker の値が大きいことは Memory Tracker 統計情報が欠落していることを意味します。
