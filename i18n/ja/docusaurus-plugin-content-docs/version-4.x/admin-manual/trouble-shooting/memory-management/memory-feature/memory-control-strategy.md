---
{
  "title": "メモリ制御戦略",
  "language": "ja",
  "description": "Doris Allocatorは、システム内の大容量ブロックメモリアプリケーションの統一エントリーポイントです。"
}
---
Doris Allocatorは、システム内の大容量ブロックメモリアプリケーションの統一エントリポイントです。適切なタイミングでメモリ割り当て制限のプロセスに介入し、効率的で制御可能なメモリアプリケーションを確保します。

Doris MemoryArbitratorは、Doris BEプロセスのメモリ使用量をリアルタイムで監視し、定期的にメモリステータスを更新してメモリ関連統計のスナップショットを収集するメモリアービトレータです。

Doris MemoryReclamationは、利用可能メモリが不足した際にメモリGCをトリガーしてメモリの一部を回収し、クラスタ上のほとんどのタスク実行の安定性を確保するメモリリクレイマです。

## Doris Allocator

![Memory Management 概要](/images/memory-management-overview.png)

Allocatorはシステムからメモリを申請し、MemTrackerを使用してアプリケーションプロセス中のメモリアプリケーションと解放のサイズを追跡します。オペレータをバッチで実行するために必要な大容量メモリは、異なるデータ構造によって管理されます。

クエリ実行プロセス中、大容量ブロックメモリの割り当ては主にArena、HashTable、PODArrayデータ構造によって管理されます。AllocatorはArena、PODArray、HashTableの統一メモリインターフェースとして機能し、統一メモリ管理とローカルメモリ再利用を実現します。

![Memory Allocator](/images/memory-allocator.png)

Allocatorは汎用メモリアロケータを使用してメモリを申請します。JemallocとTCMallocの選択において、DorisはTCMallocのCentralFreeListのSpin Lockが高同時性テストでクエリ総時間の40%を占めていました。aggressive memory decommitをオフにすることで効果的にパフォーマンスを改善できますが、多くのメモリを浪費します。このため、TCMallocキャッシュを定期的にリサイクルするために別スレッドを使用する必要がありました。Jemallocは高同時性下でTCMallocを上回り、成熟して安定しています。Doris 1.2.2でJemallocに切り替えました。チューニング後、ほとんどのシナリオでTCMallocと同等のパフォーマンスを持ち、より少ないメモリを使用します。高同時性シナリオのパフォーマンスも大幅に改善されました。

### Arena

Arenaは、メモリブロックのリストを維持し、そこからメモリを割り当ててallocリクエストに応答するメモリプールで、システムからメモリがリクエストされる回数を減らしてパフォーマンスを向上させます。メモリブロックはChunkと呼ばれ、メモリプールのライフサイクル全体を通じて存在し、破棄時に統一的に解放されます。これは通常クエリライフサイクルと同じです。メモリアライメントもサポートし、主にShuffleプロセス中のシリアル化/デシリアル化データ、HashTable内のシリアル化Keyなどを保存するために使用されます。

Chunkは初期状態で4096バイトで、内部でカーソルを使用して割り当てられたメモリ位置を記録します。現在のChunkの残りサイズが現在のメモリリクエストを満たせない場合、新しいChunkがリクエストされてリストに追加されます。システムからメモリがリクエストされる回数を減らすため、現在のChunkが128M未満の場合、新しくリクエストされる各Chunkのサイズは倍になります。現在のChunkが128Mを超える場合、現在のメモリリクエストを満たす前提で、新しくリクエストされるChunkのサイズは最大128Mまで割り当てられ、メモリの浪費を避けます。デフォルトでは、前のChunkはその後のallocに参加しません。

### HashTable

DorisのHashTableは主にHash Join、集約、集合演算、ウィンドウ関数で使用されます。主に使用されるPartitionedHashTableは最大16のサブHashTableを含み、2つのHashTableの並列マージをサポートし、各サブHash Joinは独立して拡張され、総メモリ使用量の削減が期待され、拡張時の遅延も償却されます。

HashTableが8M未満の場合、4倍で拡張されます。HashTableが8Mを超える場合、2倍で拡張されます。HashTableが2G未満の場合、拡張係数は50%、つまりHashTableが50%まで満たされると拡張がトリガーされます。HashTableが2Gを超えた後、拡張係数は75%に調整されます。メモリの浪費を避けるため、HashTableは通常、構築前にデータ量に応じて事前拡張されます。さらに、Dorisは異なるシナリオ用に異なるHashTableを設計しており、集約シナリオでPHmapを使用して同時パフォーマンスを最適化するなどです。

### PODArray

PODArrayはPOD型の動的配列です。std::vectorとは異なり、要素を初期化せず、一部のstd::vectorインターフェースをサポートし、メモリアライメントと2の倍数での拡張をサポートします。PODArrayが破棄される際、各要素のデストラクタを呼び出さず、メモリブロック全体を直接解放します。主にStringなどの列にデータを保存するために使用されます。また、関数計算や式フィルタリングでも広く使用されています。

### メモリ再利用

Dorisは実行層で多くのメモリ再利用を行っており、目に見えるメモリホットスポットは基本的にブロックされています。例えば、データブロックBlockの再利用はQuery実行を貫いています；例えば、ShuffleのSender側は常に1つのBlockを保持してデータを受信し、1つのBlockがRPC送信で交互に使用されます；ストレージ層では述語列を再利用して読み取り、フィルタリング、上位層Blockへのコピー、Tablet読み取り時のClearを行います；Aggregate Keyテーブルのload時、キャッシュデータのMemTableが一定サイズに達した後、事前集約後に縮小して書き込みを続行するなどです。

さらに、DorisはデータScan開始前にScannerとスレッド数に基づいてFree Blockのバッチを事前割り当てします。Scannerがスケジュールされるたびに、そこからBlockを取得してストレージ層に渡してデータを読み取ります。読み取り完了後、Blockはプロデューサキューに配置され、上位層オペレータによる消費と後続計算が行われます。上位層オペレータがデータをコピーした後、Blockは次のScannerスケジューリングのためにFree Blockに戻され、メモリ再利用を実現します。データScan完了後、Free Blockは以前事前割り当てされたスレッドで統一的に解放され、メモリ申請と解放が同じスレッドでないことによる余分なオーバーヘッドを避けます。Free Block数もデータScanの同時実行性をある程度制御します。

## Memory GC

Doris BEは定期的にシステムからプロセスの物理メモリと現在のシステム利用可能メモリを取得し、すべてのquery、load、compactionタスクMemTrackerのスナップショットを収集します。BEプロセスメモリが制限を超えるか、システムの利用可能メモリが不足すると、Dorisはキャッシュを解放し、一部のクエリやloadを終了してメモリを解放します。このプロセスは別のGCスレッドによって定期的に実行されます。

![Memory GC](/images/memory-gc.png)

Minor GCは、Doris BEプロセスメモリがSoftMemLimit（デフォルトでシステム総メモリの81%）を超えるか、残りのシステム利用可能メモリがWarning水位線を下回る（通常3.2GB以下）とトリガーされます。この時、Allocatorがメモリを割り当てる際にクエリが一時停止され、強制キャッシュのデータがloadされ、一部のData Page CacheとexpiredしたSegment Cacheが解放されます。解放されたメモリがプロセスメモリの10%未満の場合、クエリメモリオーバー発行が有効であれば、大きなメモリオーバー発行比率のクエリがキャンセルされ、プロセスメモリの10%が解放されるかキャンセル可能なクエリがなくなるまで続き、その後システムメモリステータス取得間隔とGC間隔が短縮されます。他のクエリは残りメモリが見つかった後に実行を継続します。

BEプロセスメモリがMemLimit（デフォルトでシステム総メモリの90%）を超えるか、残りのシステム利用可能メモリがLow水位線を下回る（通常1.6GB以下）場合、Full GCがトリガーされます。上記操作に加えて、キャッシュデータの強制フラッシュ時にloadも一時停止され、すべてのData Page Cacheと他のキャッシュの大部分が解放されます。解放されたメモリが20%未満の場合、すべてのクエリとloadのMemTrackerリストで一定の戦略に従って検索を開始し、メモリ使用量の大きなクエリ、メモリオーバー発行比率の大きなload、メモリ使用量の大きなloadを順番にキャンセルし、プロセスメモリの20%が解放されるまで続けます。その後、システムメモリステータス取得間隔とGC間隔が増加され、他のクエリとloadは実行を継続します。GC時間は通常数百usから数十ms間です。

## メモリ制限と水位線計算方法

- プロセスメモリ制限MemLimit = `be.conf/mem_limit * PhysicalMemory`、デフォルトはシステム総メモリの90%、詳細は参照。

- プロセスメモリソフト制限SoftMemLimit = `be.conf/mem_limit * PhysicalMemory * be.conf/soft_mem_limit_frac`、デフォルトはシステム総メモリの81%。

- システム残り利用可能メモリ低水位線LowWaterMark = `be.conf/max_sys_mem_available_low_water_mark_bytes`、デフォルトは-1、その場合LowWaterMark = `min(PhysicalMemory - MemLimit, PhysicalMemory * 0.05)`、64Gメモリマシンでは、LowWaterMarkの値は3.2GB弱（実際の`PhysicalMemory`の値は64G未満のことが多いため）。

- システム残り利用可能メモリ警告水位線WarningWaterMark = `2 * LowWaterMark`、64Gメモリマシンでは、`WarningWaterMark`はデフォルトで6.4GB弱。

## システム残り利用可能メモリの計算

エラーメッセージ内の利用可能メモリが低水位線を下回る場合も、プロセスメモリオーバーランとして扱われます。システム内の利用可能メモリの値は`/proc/meminfo`の`MemAvailable`から取得されます。`MemAvailable`が不足すると、メモリリクエストを続行するとstd::bad_allocが返されるかBEプロセスOOMが発生する可能性があります。プロセスメモリ統計の更新とBEメモリGCには一定の遅延があるため、OOMをできるだけ避けるために低水位線としてメモリバッファの小さな部分が予約されます。

その中で、`MemAvailable`は現在のfreeメモリ、buffer、cache、メモリ断片化などの要因に基づいてオペレーティングシステムが提供する、可能な限りswapをトリガーせずにユーザープロセスに提供できるメモリの総量です。簡単な計算式は：`MemAvailable = MemFree - LowWaterMark + (PageCache - min(PageCache / 2, LowWaterMark))`で、cmd `free`で見られる`available`値と同じです。詳細は参照：

[why-is-memavailable-a-lot-less-than-memfreebufferscached](https://serverfault.com/questions/940196/why-is-memavailable-a-lot-less-than-memfreebufferscached)

[Linux MemAvailable](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=34e431b0ae398fc54ea69ff85ec700722c9da773)

デフォルトの低水位線は3.2G（2.1.5以前は1.6G）で、`MemTotal`、`vm/min_free_kbytes`、`confg::mem_limit`、`config::max_sys_mem_available_low_water_mark_bytes`に基づいて計算され、メモリの浪費を避けます。その中で、`MemTotal`はシステム総メモリで、値も`/proc/meminfo`から取得；`vm/min_free_kbytes`はオペレーティングシステムがメモリGCプロセス用に予約するバッファで、値は通常0.4%から5%間です。一部のクラウドサーバーでは、`vm/min_free_kbytes`が5%になる可能性があり、システム利用可能メモリが実際の値より少なく見える原因となります；`config::max_sys_mem_available_low_water_mark_bytes`を増やすと64Gを超えるメモリのマシンでFull GC用により多くのメモリバッファが予約され、そうでなければ減らすことでメモリを可能な限り最大限活用します。
