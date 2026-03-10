---
{
  "title": "メモリ制御戦略",
  "language": "ja",
  "description": "Doris Allocatorは、システム内の大ブロックメモリアプリケーションの統一エントリポイントです。"
}
---
Doris Allocatorは、システム内の大容量ブロックメモリアプリケーションの統一エントリポイントです。適切なタイミングでメモリ割り当てを制限するプロセスに介入し、効率的で制御可能なメモリアプリケーションを保証します。

Doris MemoryArbitratorは、Doris BEプロセスのメモリ使用量をリアルタイムで監視し、定期的にメモリステータスを更新してメモリ関連統計のスナップショットを収集するメモリアービトレーターです。

Doris MemoryReclamationは、利用可能メモリが不足した際にメモリGCをトリガーしてメモリの一部を回収し、クラスタ上のほとんどのタスク実行の安定性を保証するメモリリクレイマーです。

## Doris Allocator

![Memory Management Overview](/images/memory-management-overview.png)

Allocatorは、システムからメモリを申請し、MemTrackerを使用してアプリケーション過程でのメモリ申請と解放のサイズを追跡します。オペレーターをバッチで実行するために必要な大容量メモリは、異なるデータ構造によって管理されます。

クエリ実行過程において、大容量ブロックメモリの割り当ては主にArena、HashTable、PODArrayデータ構造によって管理されます。AllocatorはArena、PODArray、HashTableの統一メモリインターフェースとして機能し、統一メモリ管理とローカルメモリ再利用を実現します。

![Memory Allocator](/images/memory-allocator.png)

Allocatorは汎用メモリアロケータを使用してメモリを申請します。JemallocとTCMallocの選択において、Dorisは以前、高並行テストでTCMallocのCentralFreeListのSpin Lockが総クエリ時間の40%を占める問題がありました。aggressive memory decommitをオフにすることで性能を効果的に改善できますが、多くのメモリを無駄にします。このため、TCMallocキャッシュを定期的に回収する専用スレッドを使用する必要がありました。Jemallocは高並行下でTCMallocより優れた性能を示し、成熟して安定しています。Doris 1.2.2では、Jemallocに切り替えました。チューニング後、ほとんどのシナリオでTCMallocと同等の性能を示し、メモリ使用量も少なくなります。高並行シナリオの性能も大幅に改善されました。

### Arena

Arenaは、メモリブロックのリストを維持し、そこからメモリを割り当ててalloc要求に応答するメモリプールです。これにより、システムからメモリを要求する回数を削減して性能を向上させます。メモリブロックはChunkと呼ばれ、メモリプールのライフサイクル全体を通して存在し、破棄時に統一的に解放されます。これは通常、クエリライフサイクルと同じです。また、メモリアライメントをサポートし、主にShuffleプロセス中のシリアル化/デシリアル化データ、HashTable内のシリアル化Keyなどを保存するために使用されます。

Chunkは初期4096バイトで、内部でカーソルを使用して割り当て済みメモリ位置を記録します。現在のChunkの残りサイズが現在のメモリ要求を満たせない場合、新しいChunkが要求されてリストに追加されます。システムからメモリを要求する回数を削減するため、現在のChunkが128M未満の場合、新たに要求される各Chunkのサイズは倍になります。現在のChunkが128Mを超える場合、新たに要求されるChunkのサイズは、現在のメモリ要求を満たすことを前提として最大128Mまで割り当てられ、過度なメモリ浪費を避けます。デフォルトでは、前のChunkは以降のallocに参加しなくなります。

### HashTable

DorisのHashTableは主にHash Join、集約、集合演算、ウィンドウ関数で使用されます。主に使用されるPartitionedHashTableは最大16のサブHashTableを含み、2つのHashTableの並列マージをサポートし、各サブHash Joinは独立して拡張され、総メモリ使用量の削減と拡張時の遅延の分散が期待されます。

HashTableが8M未満の場合、4倍の倍数で拡張されます。HashTableが8Mを超える場合、2倍の倍数で拡張されます。HashTableが2G未満の場合、拡張係数は50%、つまりHashTableが50%まで埋まると拡張がトリガーされます。HashTableが2Gを超えると、拡張係数は75%に調整されます。過度なメモリ浪費を避けるため、HashTableは通常、構築前にデータ量に応じて事前拡張されます。さらに、Dorisは異なるシナリオ用に異なるHashTableを設計し、たとえば集約シナリオではPHmapを使用して並行性能を最適化します。

### PODArray

PODArrayはPOD型の動的配列です。std::vectorとは異なり、要素を初期化せず、一部のstd::vectorインターフェースをサポートし、メモリアライメントと2の倍数での拡張をサポートします。PODArrayが破棄される際、各要素のデストラクタを呼び出さず、メモリブロック全体を直接解放します。主にStringなどの列にデータを保存するために使用されます。さらに、関数計算や式フィルタリングでも広く使用されます。

### メモリ再利用

Dorisは実行レイヤーで多くのメモリ再利用を行い、目に見えるメモリホットスポットは基本的にブロックされています。たとえば、データブロックBlockの再利用はQuery実行を貫きます。たとえば、ShuffleのSender側は常に1つのBlockを保持してデータを受信し、1つのBlockがRPC伝送で交互に使用されます。ストレージレイヤーは述語列の再利用を行い、読み取り、フィルタリング、上位レイヤーBlockへのコピー、Tablet読み取り時のClearを行います。Aggregate Keyテーブルをロードする際、キャッシュされたデータのMemTableが一定サイズに達した後、事前集約後に収縮して書き込みを継続するなどです。

さらに、Dorisはデータスキャン開始前に、Scannerとスレッド数に基づいて一連のFree Blockを事前割り当てします。Scannerがスケジュールされるたびに、そこからBlockを取得してストレージレイヤーに渡してデータを読み取ります。読み取り完了後、Blockはプロデューサーキューに置かれ、上位レイヤーオペレーターによる消費と後続計算に使用されます。上位レイヤーオペレーターがデータをコピーした後、Blockを次のSchedulerスケジューリング用にFree Blockに戻し、メモリ再利用を実現します。データスキャン完了後、Free Blockは事前割り当てされたスレッドで統一的に解放され、メモリ申請と解放が同じスレッドでないことによる追加オーバーヘッドを避けます。Free Block数はまた、データスキャンの並行性をある程度制御します。

## Memory GC

Doris BEは定期的にシステムからプロセスの物理メモリと現在の利用可能メモリを取得し、すべてのクエリ、ロード、コンパクションタスクMemTrackerのスナップショットを収集します。BEプロセスメモリが制限を超えるか、システムの利用可能メモリが不足する場合、Dorisはキャッシュを解放し、一部のクエリやロードを終了してメモリを解放します。このプロセスは専用のGCスレッドによって定期的に実行されます。

![Memory GC](/images/memory-gc.png)

Minor GCは、Doris BEプロセスメモリがSoftMemLimit（デフォルトではシステム総メモリの81%）を超えるか、残りの利用可能システムメモリがWarning watermark（通常3.2GB以下）を下回る際にトリガーされます。この時、Allocatorがメモリを割り当てる際にクエリが一時停止され、強制キャッシュ内のデータがロードされ、一部のData Page Cacheと期限切れのSegment Cacheが解放されます。解放されたメモリがプロセスメモリの10%未満の場合、クエリメモリオーバー発行が有効であれば、メモリオーバー発行比率の大きいクエリが、プロセスメモリの10%が解放されるかキャンセル可能なクエリがなくなるまでキャンセルされ、その後システムメモリステータス取得間隔とGC間隔が短縮されます。他のクエリは残りメモリが確認された後に実行を継続します。

BEプロセスメモリがMemLimit（デフォルトではシステム総メモリの90%）を超えるか、残りの利用可能システムメモリがLow watermark（通常1.6GB以下）を下回る場合、Full GCがトリガーされます。上記操作に加えて、キャッシュデータの強制フラッシュ時にロードも一時停止され、すべてのData Page Cacheとほとんどの他のキャッシュが解放されます。解放されたメモリが20%未満の場合、すべてのクエリとロードのMemTrackerリストで一定の戦略に従って検索を開始し、メモリ使用量の大きいクエリ、メモリオーバー発行比率の大きいロード、メモリ使用量の大きいロードを順次キャンセルし、プロセスメモリの20%が解放されるまで続けます。その後、システムメモリステータス取得間隔とGC間隔が増加し、他のクエリとロードは実行を継続します。GC時間は通常数百usから数十msの間です。

## メモリ制限とwatermark計算方法

- プロセスメモリ制限MemLimit = `be.conf/mem_limit * PhysicalMemory`、デフォルトはシステム総メモリの90%、詳細は を参照。

- プロセスメモリソフト制限SoftMemLimit = `be.conf/mem_limit * PhysicalMemory * be.conf/soft_mem_limit_frac`、デフォルトはシステム総メモリの81%。

- システム残り利用可能メモリlow water mark LowWaterMark = `be.conf/max_sys_mem_available_low_water_mark_bytes`、デフォルトは-1、この場合LowWaterMark = `min(PhysicalMemory - MemLimit, PhysicalMemory * 0.05)`、64Gメモリのマシンでは、LowWaterMarkの値は3.2GB弱（`PhysicalMemory`の実際値は多くの場合64G未満のため）。

- システム残り利用可能メモリwarning water mark WarningWaterMark = `2 * LowWaterMark`、64Gメモリのマシンでは、`WarningWaterMark`はデフォルトで6.4GB弱。

## システム内残り利用可能メモリの計算

エラーメッセージ内の利用可能メモリがlow water markより少ない場合も、プロセスメモリオーバーランとして扱われます。システム内利用可能メモリの値は`/proc/meminfo`の`MemAvailable`から取得されます。`MemAvailable`が不足する場合、メモリ要求を続行するとstd::bad_allocが返されるかBEプロセスOOMを引き起こす可能性があります。プロセスメモリ統計の更新とBEメモリGCには一定の遅延があるため、OOMを可能な限り避けるために小さなメモリバッファがlow water markとして予約されています。

この中で、`MemAvailable`は、swapをできる限りトリガーせずにユーザープロセスに提供可能なメモリの総量で、オペレーティングシステムが現在のフリーメモリ、バッファ、キャッシュ、メモリ断片化などの要因に基づいて算出します。簡単な計算式は：`MemAvailable = MemFree - LowWaterMark + (PageCache - min(PageCache / 2, LowWaterMark))`で、これはcmd `free`で見られる`available`値と同じです。詳細は以下を参照：

[why-is-memavailable-a-lot-less-than-memfreebufferscached](https://serverfault.com/questions/940196/why-is-memavailable-a-lot-less-than-memfreebufferscached)

[Linux MemAvailable](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=34e431b0ae398fc54ea69ff85ec700722c9da773)

デフォルトのlow water markは3.2G（2.1.5以前は1.6G）で、`MemTotal`、`vm/min_free_kbytes`、`confg::mem_limit`、`config::max_sys_mem_available_low_water_mark_bytes`に基づいて計算され、過度なメモリ浪費を避けます。この中で、`MemTotal`はシステム総メモリで、値は同じく`/proc/meminfo`から取得；`vm/min_free_kbytes`はオペレーティングシステムがメモリGCプロセス用に予約するバッファで、値は通常0.4%から5%の間。一部のクラウドサーバーでは、`vm/min_free_kbytes`が5%の場合があり、これによりシステム利用可能メモリが実際値より少なく見える；`config::max_sys_mem_available_low_water_mark_bytes`を増やすことで64Gを超えるメモリのマシンでFull GC用により多くのメモリバッファを予約し、そうでなければ削減することでメモリを可能な限り最適に使用します。
