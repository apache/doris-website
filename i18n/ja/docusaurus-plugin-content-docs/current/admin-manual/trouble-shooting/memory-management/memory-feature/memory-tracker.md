---
{
    "title": "Memory Tracker（メモリトラッカー）",
    "language": "ja",
    "description": "Doris BE は Memory Tracker を使用して、クエリ、ロード、コンパクションなどのタスクのライフサイクル中に使用されるメモリを含む、プロセスのメモリ使用量を記録します。"
}
---

Doris BE は Memory Tracker を使用して、クエリ、ロード、コンパクション、スキーマ変更などのタスクのライフサイクル中に使用されるメモリや、各種キャッシュのメモリを含む、プロセスのメモリ使用量を記録します。メモリ使用量は Web ページでリアルタイムに確認でき、メモリ関連のエラーが報告されると BE ログにも出力されます。これらの情報はメモリの分析やメモリ問題のトラブルシューティングに使用します。

Memory Tracker の確認方法、各 Memory Tracker のメモリ使用量が過大になる原因、および使用量を減らすための分析方法は、Doris BE のメモリ構造と合わせて[概要](./../overview.md)で説明しています。このページでは、Memory Tracker の仕組み、構造、およびよくある問題のみを説明します。

## メモリ追跡の仕組み

Memory Tracker は Doris Allocator を利用して、メモリの割り当てと解放をそれぞれ追跡します。Doris Allocator については、[メモリ制御戦略](./memory-control-strategy.md)を参照してください。

プロセスメモリ：Doris BE は、Doris BE プロセスのメモリ使用量を定期的にシステムから取得します。Cgroup にも対応しています。

タスクメモリ：各クエリ、ロード、コンパクションなどのタスクは、初期化時に固有の Memory Tracker を作成し、実行中はその Memory Tracker を TLS（Thread Local Storage）に配置します。Doris の主要なメモリデータ構造は Allocator を継承しています。Allocator はメモリの割り当てと解放を TLS 内の Memory Tracker に記録します。

オペレータメモリ：Join、Agg、Sink など、タスク内の実行オペレータもそれぞれ Memory Tracker を作成します。メモリを手動で追跡するか、Memory Tracker を TLS に配置して `Doris Allocator` に記録させることで、実行ロジックを制御し、Query Profile で各オペレータのメモリ使用量を分析できます。

グローバルメモリ：グローバルメモリは主に、タスク間で共有される Cache とメタデータで構成されます。各 Cache には固有の Memory Tracker があり、`Doris Allocator` または手動で追跡されます。現時点ではメタデータのメモリ使用量は完全には集計されていないため、その分析には主に Metrics と Bvar が集計する各種メタデータの Counter を使用します。

このうち、Doris BE のプロセスメモリはオペレーティングシステムから取得するため、完全に正確とみなせます。一方、実装上の制約により、ほかの Memory Tracker が追跡するメモリは通常、実際のメモリの一部にとどまります。そのため、ほとんどの場合、すべての Memory Tracker の合計は Doris BE プロセスの物理メモリ使用量より少なくなります。集計漏れはありますが、Memory Tracker が記録する値は多くの場合信頼でき、メモリ分析に使用できます。また、Memory Tracker が実際に追跡するのは仮想メモリであり、通常より重視される物理メモリではないため、両者には一定の差があります。

## Memory Tracker の構造

Memory Tracker は用途に応じて二種類に分かれます。一つ目の Memory Tracker Limiter は、各クエリ、ロード、コンパクションなどのタスク、およびグローバルな Cache や TabletMeta に固有のもので、メモリ使用量の監視と制御に使用します。二つ目の Memory Tracker は、主にクエリ実行中のメモリ使用量が集中する箇所を追跡します。たとえば、Join、Aggregation、Sort、ウィンドウ関数の HashTable や、シリアライズされた中間データなどを追跡し、クエリ内の各オペレータのメモリ使用量の分析や、ロードデータのフラッシュ時のメモリ制御に使用します。

両者の親子関係はスナップショットの出力にのみ使用され、ラベル名で関連付けられます。これはソフトリンクに相当します。メモリ消費量を同時に計上するために親子関係を使うことはなく、ライフサイクルも互いに影響しないため、理解と利用にかかる負担を軽減できます。すべての Memory Tracker はマップの集合に格納されます。また、すべての Memory Tracker タイプのスナップショットや、クエリ、ロード、コンパクションなどのタスクのスナップショットを出力するメソッド、現在のメモリ使用量が最も大きいクエリやロードのグループ、メモリ超過量が最も大きいクエリやロードのグループを取得するメソッドが用意されています。

![Memory Tracker の実装](/images/memory-tracker-implement.png)

## Memory Tracker の集計漏れ

Memory Tracker の集計漏れの現れ方は、Doris 2.1 より前と以降で異なります。

### Memory Tracker の集計漏れの現れ方

1. Doris 2.1 以降では、Memory Tracker の集計漏れは次の二つの形で現れます。

- `Label=process resident memory` の Memory Tracker と `Label=sum of all trackers` の Memory Tracker の差が大きすぎる。

- Orphan Memory Tracker の値が大きすぎる。

2. Doris 2.1 より前では、Orphan Memory Tracker の値が大きすぎる場合、Memory Tracker の集計漏れを意味します。

### Memory Tracker の集計漏れの分析

> Doris 2.1.5 より前のバージョンで、Memory Tracker の集計に漏れがある場合や BE プロセスのメモリ使用量が減らない場合は、[キャッシュメモリの分析](./../memory-analysis/doris-cache-memory-analysis.md)を参照して SegmentCache のメモリ使用量を分析し、テストを続ける前に Segment Cache を無効にしてみてください。

> Doris 2.1.5 より前のバージョンでは、Segment Cache Memory Tracker の値は正確ではありません。Primary Key Index を含む一部の Index メモリが正確に集計されないため、Segment Cache のメモリ使用量を効果的に制限できず、特に数百から数千列を持つ幅の広いテーブルでは、メモリを過剰に使用することがよくあります。[メタデータメモリの分析](./../memory-analysis/metadata-memory-analysis.md)を参照してください。Doris BE Metrics の `doris_be_cache_usage{name="SegmentCache"}` が大きくない一方で、Doris BE Bvar の `doris_column_reader_num` が大きい場合は、Segment Cache のメモリ使用量を疑ってください。Heap Profile でメモリ使用量の大きいコールスタックに `Segment` フィールドと `ColumnReader` フィールドがあれば、Segment Cache が大量のメモリを使用しているとほぼ判断できます。

上記の現象が見られ、クラスターを容易に再起動でき、現象も再現できる場合は、[Heap Profile によるメモリ分析](./../memory-analysis/heap-profile-memory-analysis.md)を参照し、Jemalloc Heap Profile を使用してプロセスメモリを分析してください。

それ以外の場合は、まず[メタデータメモリの分析](./../memory-analysis/metadata-memory-analysis.md)を参照して、Doris BE のメタデータメモリを分析できます。

### Memory Tracker の集計漏れの原因

以下では、Memory Tracker の集計漏れの原因を説明します。これらは Memory Tracker の実装に関するもので、通常は意識する必要はありません。

#### Doris 2.1 以降

1. `Label=process resident memory` の Memory Tracker と `Label=sum of all trackers` の Memory Tracker の差が大きすぎる。

`Label=sum of all trackers` の Memory Tracker の値が `Label=process resident memory` の Memory Tracker の値の 70% を超えている場合、通常は Doris BE プロセスのメモリの大半が Memory Tracker によって集計されていることを意味します。通常は Memory Tracker を分析するだけで、メモリが使用されている箇所を特定できます。

`Label=sum of all trackers` の Memory Tracker の値が `Label=process resident memory` の Memory Tracker の値の 70% 未満の場合、Memory Tracker の集計に漏れがあり、Memory Tracker ではメモリが使用されている箇所を正確に特定できない可能性があります。

`Label=process resident memory` の Memory Tracker と `Label=sum of all trackers` の Memory Tracker の差は、`Doris Allocator` によって割り当てられていないメモリです。Doris の主要なメモリデータ構造は `Doris Allocator` を継承していますが、メタデータメモリや RPC メモリなど、`Doris Allocator` によって割り当てられないメモリもあります。メモリリークの可能性もあります。この場合、メモリ使用量の大きい Memory Tracker を分析するだけでなく、通常はメタデータのメモリ使用量が妥当かどうか、メモリリークがないかどうかにも注意する必要があります。

2. Orphan Memory Tracker の値が大きすぎる

```
MemTrackerLimiter Label=Orphan, Type=global, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Orphan Memory Tracker はデフォルトの Memory Tracker です。値が正または負である場合、Doris Allocator が割り当てたメモリを正確に追跡できていないことを意味します。値が大きいほど、Memory Tracker 全体の集計結果の信頼性は低くなります。この集計値には、次の二つの由来があります。

- スレッドの開始時に Memory Tracker が TLS にバインドされていない場合、Doris Allocator はデフォルトでそのメモリを Orphan Memory Tracker に記録します。これは、そのメモリの帰属先が不明であることを意味します。Doris Allocator によるメモリ記録の仕組みについては、上記の[メモリ追跡の仕組み]を参照してください。

- Query や Load などのタスクの Memory Tracker の値が破棄時に 0 でない場合、通常はそのメモリが解放されていないことを意味します。残ったメモリは Orphan Memory Tracker に記録され、Orphan Memory Tracker が引き続き追跡します。これにより、Orphan Memory Tracker とほかの Memory Tracker の合計が、Doris Allocator によって割り当てられたすべてのメモリに等しくなります。

理想的には、Orphan Memory Tracker の値は 0 に近い状態が望まれます。そのため、すべてのスレッドが開始時に Query や Load の Memory Tracker など、Orphan 以外の Memory Tracker を関連付けることが期待されます。また、Query や Load の Memory Tracker は破棄時にすべて 0 になることが期待されます。これは、Query や Load の実行中に使用されたメモリが、破棄時までに解放されたことを意味します。

Orphan Memory Tracker の値が 0 でなく大きい場合は、大量の帰属先不明のメモリが解放されていないか、クエリやロードの実行後に大量のメモリが解放されていないことを意味します。

#### Doris 2.1 より前

Doris 2.1 より前では、帰属先不明のメモリはすべて `Label=Orphan` の Memory Tracker に集計されていました。そのため、Orphan Memory Tracker の値が大きい場合は、Memory Tracker の集計漏れを意味します。
