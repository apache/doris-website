---
{
    "title": "メモリトラッカー（Memory Tracker）",
    "language": "ja",
    "description": "Doris BE は Memory Tracker を使用してプロセスのメモリ使用量を記録します。これには、クエリ、データロード、Compaction、Schema Change などのタスクのライフサイクルで使用されるメモリが含まれます。"
}
---

Doris BE は Memory Tracker を使用してプロセスのメモリ使用量を記録します。これには、クエリ、データロード、Compaction、Schema Change などのタスクのライフサイクルで使用されるメモリや、各種キャッシュが含まれます。Web ページでリアルタイムに表示でき、メモリ関連エラーが報告された際には BE ログに出力されます。これはメモリ分析とメモリ問題のトラブルシューティングに使用されます。

Memory Tracker の表示方法、各 Memory Tracker が示す過剰なメモリ使用の理由、およびそのメモリ使用量を減らすための分析方法については、Doris BE のメモリ構造と併せて [概要](./../overview.md) で説明しています。本記事では Memory Tracker の原理、構造、および一般的な問題の一部のみを説明します。

## メモリ追跡の原理 {#memory-tracking-principle}

Memory Tracker は Doris Allocator に依存して、メモリの各割り当てと解放を追跡します。Doris Allocator については [メモリ制御戦略](./memory-control-strategy.md) を参照してください。

プロセスメモリ：Doris BE はシステムから Doris BE プロセスのメモリを定期的に取得し、Cgroup と互換性があります。

タスクメモリ：各クエリ、データロード、Compaction などのタスクは、初期化時に固有の Memory Tracker を作成し、実行中に Memory Tracker を TLS（Thread Local Storage）へ格納します。Doris の主要なメモリデータ構造は Allocator を継承しており、Allocator はメモリの各割り当てと解放を TLS の Memory Tracker に記録します。

オペレータメモリ：タスクの異なる実行オペレータも独自の Memory Trakcer を作成します。たとえば Join/Agg/Sink などです。手動でメモリ追跡を行うか、TLS に格納して `Doris Allocator` に記録させることができ、実行ロジックの制御や、Query Profile で異なるオペレータのメモリ使用状況を分析するために使用します。

グローバルメモリ：主に Cache とメタデータなど、異なるタスク間で共有されるメモリが含まれます。各 Cache には固有の Memory Tracker があり、`Doris Allocator` または手動で追跡します。メタデータメモリは現時点では完全にはカウントされず、Metrics と Bvar がカウントする各種メタデータ Counter による分析に依存する部分が多くなります。

Doris BE プロセスのメモリはオペレーティングシステムから取得されるため、完全に正確とみなせます。一方、他の Memory Tracker が追跡するメモリは実装上の制約により通常は実メモリの一部にすぎず、その結果、ほとんどの場合、すべての Memory Tracker の合計は Doris BE プロセスの物理メモリより小さくなります。一定の欠落はありますが、Memory Tracker に記録されたメモリはほとんどの場合信頼性が高く、メモリ分析に安心して使用できます。さらに、Memory Tracker が実際に追跡するのは仮想メモリであり、通常より重視される物理メモリではないため、両者の間にも一定の誤差があります。

## Memory Tracker の構造 {#memory-tracker-structure}

使用方法に基づき、Memory Tracker は二つのカテゴリに分けられます。第一のカテゴリである Memory Tracker Limiter は、各クエリ、データロード、Compaction などのタスク、およびグローバルな Cache、TabletMeta ごとに一意で、メモリ使用量の監視と制御に使用されます。第二のカテゴリである Memory Tracker は、主にクエリ実行中のメモリホットスポットを追跡するために使用されます。たとえば、Join/Aggregation/Sort/ウィンドウ関数の HashTable、シリアライズされた中間データなどを追跡し、クエリ内の異なるオペレータのメモリ使用状況を分析するとともに、ロードデータのフラッシュ処理のメモリ制御にも使用されます。

両者の親子関係はスナップショットの出力にのみ使用され、ラベル名で関連付けられる、いわばソフトリンクです。親子関係に依存して同時に消費することはなく、ライフサイクルも互いに影響しないため、理解と利用のコストを抑えられます。すべての Memory Tracker は一連の Map に格納され、すべての Memory Tracker Type のスナップショットの出力、query/load/compaction などの Task のスナップショットの出力、現在最も多くメモリを使用している Query/Load のグループの取得、現在最も過剰にメモリを使用している Query/Load のグループの取得などのメソッドを提供します。

![Memory Tracker の実装](/images/memory-tracker-implement.png)

## Memory Tracker の統計情報の欠落 {#memory-tracker-statistics-missing}

Doris 2.1 より前と以降のバージョンでは、Memory Tracker の統計情報が欠落する現象が異なります。

### Memory Tracker の統計情報が欠落する現象 {#memory-tracker-statistics-missing-phenomenon}

1. Doris 2.1 以降では、Memory Tracker の統計情報の欠落に二つの現象があります。

- `Label=process resident memory` Memory Tracker と `Label=sum of all trackers` Memory Tracker の差が大きすぎる。

- Orphan Memory Tracker の値が大きすぎる。

2. Doris 2.1 より前では、Orphan Memory Tracker の値が大きいことは、Memory Tracker の統計情報が欠落していることを意味します。

### Memory Tracker の統計情報欠落の分析 {#memory-tracker-statistics-missing-analysis}

> Doris 2.1.5 より前のバージョンで Memory Tracker の統計情報が欠落している、または BE プロセスのメモリが減少しない場合は、まず [キャッシュメモリ分析](./../memory-analysis/doris-cache-memory-analysis.md) を参照して SegmentCache のメモリ使用量を分析し、Segment Cache を閉じてからテストを続行してください。

> Doris 2.1.5 より前のバージョンでは、Segment Cache Memory Tacker は不正確です。これは、Primary Key Index を含む一部の Index のメモリ統計が不正確であるため、Segment Cache のメモリが効果的に制限されず、過大なメモリを使用することが多いためです。特に、数百から数千の列を持つ大規模なワイドテーブルで顕著です。[メタデータメモリ分析](./../memory-analysis/metadata-memory-analysis.md) を参照してください。Doris BE Metrics の `doris_be_cache_usage{name="SegmentCache"}` が大きくない一方で、Doris BE Bvar の `doris_column_reader_num` が大きい場合は、Segment Cache のメモリ使用量を疑う必要があります。Heap Profile でメモリ使用量の大きいコールスタックに `Segment` および `ColumnReader` フィールドが表示される場合、Segment Cache が大量のメモリを使用していることをほぼ確認できます。

上記の現象が確認され、クラスターを容易に再起動でき、現象を再現できる場合は、[Heap Profile メモリ分析](./../memory-analysis/heap-profile-memory-analysis.md) を参照して Jemalloc Heap Profile でプロセスメモリを分析してください。

それ以外の場合は、まず [メタデータメモリ分析](./../memory-analysis/metadata-memory-analysis.md) を参照して Doris BE のメタデータメモリを分析してください。

### Memory Tracker の統計情報が欠落する原因 {#reasons-for-missing-memory-tracker-statistics}

以下では、Memory Tracker の統計情報が欠落する原因を説明します。これらは Memory Tracker の実装に関係しており、通常は注意を払う必要ありません。

#### Doris 2.1 以降 {#doris-21-and-later}

1. `Label=process resident memory` Memory Tracker と `Label=sum of all trackers` Memory Tracker の差が大きすぎる。

`Label=sum of all trackers` Memory Tracker の値が `Label=process resident memory` Memory Tracker の 70% 以上を占める場合、通常は Memory Tracker が Doris BE プロセスのメモリの大部分をカウントしていることを意味し、通常は Memory Tracker を分析してメモリの位置を特定するだけで済みます。

`Label=sum of all trackers` Memory Tracker の値が `Label=process resident memory` Memory Tracker の 70% 未満の場合、Memory Tracker の統計情報が欠落していることを意味し、この場合、Memory Tracker ではメモリの位置を正確に特定できない可能性があります。

`Label=process resident memory` Memory Tracker と `Label=sum of all trackers` Memory Tracker の差は、`Doris Allocator` を使用して割り当てられていないメモリです。Doris の主要なメモリデータ構造は `Doris Allocator` を継承していますが、メタデータメモリや RPC メモリなど、`Doris Allocator` を使用して割り当てられていないメモリも一部存在し、メモリリークである可能性もあります。この場合、メモリ値の大きい Memory Tracker を分析するだけでなく、通常はメタデータメモリが妥当かどうか、メモリリークが存在しないかどうかにも注意する必要があります。

2. Orphan Memory Tracker の値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Orphan Memory Tracker はデフォルトの Memory Tracker です。正または負の値は、Doris Allocator が割り当てたメモリを正確に追跡できていないことを意味します。値が大きいほど、Memory Tracker 全体の統計結果の信頼性が低くなります。その統計値には二つのソースがあります。

- スレッド開始時に TLS に Memory Tracker がバインドされていない場合、Doris Allocator はデフォルトでメモリを Orphan Memory Tracker に記録します。これは、このメモリの所属が不明であることを意味します。Doris Allocator がメモリを記録する原理については、上記の [メモリ追跡の原理] を参照してください。

- Query や Load などのタスクの Memory Tracker が破棄時に 0 でない場合、通常はこのメモリが解放されていないことを意味します。残りのメモリは Orphan Memory Tracker に記録され、残りのメモリの追跡が Orphan Memory Tracker に引き継がれます。これにより、Orphan Memory Tracker と他の Memory Tracker の合計が、Doris Allocator によって割り当てられたすべてのメモリと等しくなることが保証されます。

理想的には、Orphan Memory Tracker の値は 0 に近いことが望まれます。そのため、すべてのスレッドが開始時に、Orphan 以外の Memory Tracker（Query や Load の Memory Tracker など）を Attach することを期待します。また、すべての Query や Load の Memory Tracker は破棄時に 0 である必要があります。これは、Query や Load の実行中に使用されたメモリが破棄時までに解放されていることを意味します。

Orphan Memory Tracker が 0 ではなく、値が大きい場合、大量の所属不明メモリが解放されていないか、Query と Load の実行終了後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1 より前 {#before-doris-21}

Doris 2.1 より前では、所属不明のメモリはすべて `Label=Orphan` Memory Tracker にカウントされます。そのため、Orphan Memory Tracker の値が大きいことは、Memory Tracker の統計情報が欠落していることを意味します。
