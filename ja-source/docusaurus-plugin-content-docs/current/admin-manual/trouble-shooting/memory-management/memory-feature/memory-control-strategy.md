---
{
  "title": "メモリ制御戦略",
  "language": "ja",
  "description": "Doris Allocatorは、システム内の大容量ブロックメモリアプリケーション用の統一エントリポイントです。"
}
---
Doris Allocatorは、システム内の大きなブロックメモリアプリケーション用の統一エントリーポイントです。適切なタイミングでメモリ割り当て制限のプロセスに介入し、効率的で制御可能なメモリアプリケーションを保証します。

Doris MemoryArbitratorは、Doris BEプロセスのメモリ使用量をリアルタイムで監視し、定期的にメモリステータスを更新してメモリ関連統計のスナップショットを収集するメモリアービトレーターです。

Doris MemoryReclamationは、利用可能なメモリが不足した際にメモリGCをトリガーしてメモリの一部を回収し、クラスター上でのほとんどのタスク実行の安定性を確保するメモリリクレーマーです。

## Doris Allocator

![Memory Management 概要](/images/memory-management-overview.png)

Allocatorはシステムからメモリを申請し、MemTrackerを使用してアプリケーションプロセス中のメモリ申請とリリースのサイズを追跡します。オペレーターをバッチで実行するのに必要な大きなメモリは、異なるデータ構造によって管理されます。

クエリ実行プロセス中、大きなブロックのメモリ割り当ては主にArena、HashTable、およびPODArrayデータ構造によって管理されます。AllocatorはArena、PODArray、およびHashTableの統一メモリインターフェースとして機能し、統一メモリ管理とローカルメモリ再利用を実現します。

![Memory Allocator](/images/memory-allocator.png)

Allocatorは汎用メモリアロケーターを使用してメモリを申請します。JemallocとTCMallocの選択において、DorisはこれまでTCMallocのCentralFreeListのSpin Lockを使用していましたが、高並行テストでは総クエリ時間の40%を占めていました。アグレッシブメモリデコミットをオフにすることで効果的にパフォーマンスを改善できますが、多くのメモリを無駄にします。このため、TCMallocキャッシュを定期的にリサイクルするために別のスレッドを使用する必要がありました。Jemallocは高並行下でTCMallocを上回り、成熟して安定しています。Doris 1.2.2でJemallocに切り替えました。チューニング後、ほとんどのシナリオでTCMallocと同等のパフォーマンスを発揮し、メモリ使用量が少なく、高並行シナリオのパフォーマンスも大幅に改善されました。

### Arena

Arenaは、メモリブロックのリストを維持し、それらからメモリを割り当ててalloc要求に応答することで、システムからメモリを要求する回数を減らしてパフォーマンスを改善するメモリプールです。メモリブロックはChunkと呼ばれ、メモリプールのライフサイクル全体を通じて存在し、破棄時に統一的に解放されます。これは通常クエリライフサイクルと同じです。また、メモリアライメントをサポートし、主にShuffleプロセス中の直列化/非直列化データ、HashTableの直列化Key等を保存するために使用されます。

Chunkは最初4096バイトで、内部でカーソルを使用して割り当てられたメモリ位置を記録します。現在のChunkの残りサイズが現在のメモリ要求を満たせない場合、新しいChunkが要求されリストに追加されます。システムからメモリを要求する回数を減らすため、現在のChunkが128M未満の場合、新しく要求される各Chunkのサイズは倍になります。現在のChunkが128Mを超える場合、新しく要求されるChunkのサイズは、現在のメモリ要求を満たすことを前提として最大128Mまで割り当てられ、メモリの過度な無駄を避けます。デフォルトでは、前のChunkはその後のallocに参加しなくなります。

### HashTable

DorisのHashTableは主にHash Join、集約、集合演算、ウィンドウ関数で使用されます。主に使用されるPartitionedHashTableは最大16個のサブHashTableを含み、2つのHashTableの並列マージをサポートし、各サブHash Joinは独立して拡張され、総メモリ使用量の削減が期待され、拡張中の遅延も償却されます。

HashTableが8M未満の場合、4倍で拡張されます。HashTableが8Mを超える場合、2倍で拡張されます。HashTableが2G未満の場合、拡張係数は50%、つまりHashTableが50%まで満たされると拡張がトリガーされます。HashTableが2Gを超えると、拡張係数は75%に調整されます。メモリの過度な無駄を避けるため、HashTableは通常構築前にデータ量に応じて事前拡張されます。さらに、Dorisは異なるシナリオ用に異なるHashTableを設計し、例えば集約シナリオではPHmapを使用して並行パフォーマンスを最適化します。

### PODArray

PODArrayはPOD型の動的配列です。std::vectorとは異なり要素を初期化せず、一部のstd::vectorインターフェースをサポートし、メモリアライメントと2の倍数での拡張をサポートします。PODArrayが破棄される際、各要素のデストラクタを呼び出さず、メモリブロック全体を直接解放します。主にString等の列のデータ保存に使用されます。さらに、関数計算と式フィルタリングでも広く使用されます。

### メモリ再利用

Dorisは実行層で多くのメモリ再利用を行い、可視的なメモリホットスポットは基本的にブロックされています。例えば、データブロックBlockの再利用はQuery実行を通して行われ、ShuffleのSender側では常に1つのBlockがデータ受信用に保持され、RPC伝送では1つのBlockが交互に使用されます。ストレージ層では述語列を再利用して読み込み、フィルタ、上層Blockへのコピーを行い、Tablet読み込み時にClearします。Aggregate Keyテーブルをロードする際、キャッシュデータのMemTableが一定サイズに達すると事前集約後に縮小し、書き込みを継続します等。

さらに、Dorisはデータスキャン開始前にScannerとスレッド数に基づいてFree Blockのバッチを事前割り当てします。Scannerがスケジュールされる度に、Blockを取得してストレージ層に渡してデータを読み込みます。読み込み完了後、Blockはプロデューサーキューに置かれ、上層オペレーターによる消費と後続計算に使用されます。上層オペレーターがデータをコピー後、Blockを次のScheduler スケジューリング用にFree Blockに戻し、メモリ再利用を実現します。データスキャン完了後、Free Blockは事前割り当てされたスレッドで統一的に解放され、メモリ申請とリリースが同じスレッドで行われないことによる追加オーバーヘッドを回避します。Free Block数はデータスキャンの並行性もある程度制御します。

## Memory GC

Doris BEは定期的にシステムからプロセスの物理メモリと現在のシステム利用可能メモリを取得し、すべてのクエリ、ロード、コンパクションタスクのMemTrackerのスナップショットを収集します。BEプロセスメモリが制限を超えるかシステムの利用可能メモリが不足すると、Dorisはキャッシュを解放し、一部のクエリやロードを終了してメモリを解放します。このプロセスは別のGCスレッドによって定期的に実行されます。

![Memory GC](/images/memory-gc.png)

Minor GCは、Doris BEプロセスメモリがSoftMemLimit（デフォルトでシステム総メモリの81%）を超えるか、システム残り利用可能メモリがWarning watermark（通常3.2GB以下）を下回ると発動します。この時、Allocatorがメモリを割り当てる際にクエリが一時停止され、強制キャッシュ内のデータがロードされ、一部のData Page CacheとexpiredしたSegment Cacheが解放されます。解放されたメモリがプロセスメモリの10%未満の場合、クエリメモリ過剰発行が有効であれば、メモリ過剰発行率の大きなクエリがキャンセルされ、プロセスメモリの10%が解放されるかキャンセル可能なクエリがなくなるまで続きます。その後、システムメモリ状態取得間隔とGC間隔が下げられます。他のクエリは残りメモリが見つかった後に実行を継続します。

BEプロセスメモリがMemLimit（デフォルトでシステム総メモリの90%）を超えるか、システム残り利用可能メモリがLow watermark（通常1.6GB以下）を下回ると、Full GCが発動します。上記操作に加え、キャッシュデータが強制フラッシュされる際にロードも一時停止され、すべてのData Page Cacheとほとんどの他のキャッシュが解放されます。解放されたメモリが20%未満の場合、特定の戦略に従ってすべてのクエリとロードのMemTrackerリストで検索を開始し、メモリ使用量の大きなクエリ、メモリ過剰発行率の大きなロード、メモリ使用量の大きなロードを順次キャンセルし、プロセスメモリの20%が解放されるまで続けます。その後、システムメモリ状態取得間隔とGC間隔が増やされ、他のクエリとロードが実行を継続します。GC時間は通常数百マイクロ秒から数十ミリ秒です。

## メモリ制限とwatermark計算方法

- プロセスメモリ制限MemLimit = `be.conf/mem_limit * PhysicalMemory`、デフォルトはシステム総メモリの90%、詳細は参照。

- プロセスメモリソフト制限SoftMemLimit = `be.conf/mem_limit * PhysicalMemory * be.conf/soft_mem_limit_frac`、デフォルトはシステム総メモリの81%。

- システム残り利用可能メモリlow water mark LowWaterMark = `be.conf/max_sys_mem_available_low_water_mark_bytes`、デフォルトは-1、その場合LowWaterMark = `min(PhysicalMemory - MemLimit, PhysicalMemory * 0.05)`、64Gメモリマシンでは、LowWaterMarkの値は3.2GB弱（`PhysicalMemory`の実際値が64G未満であることが多いため）。

- システム残り利用可能メモリwarning water mark WarningWaterMark = `2 * LowWaterMark`、64Gメモリマシンでは、`WarningWaterMark`はデフォルトで6.4GB弱。

## システム残り利用可能メモリの計算

エラーメッセージの利用可能メモリがlow water markを下回る場合、プロセスメモリオーバーランとしても扱われます。システム利用可能メモリの値は`/proc/meminfo`の`MemAvailable`から取得されます。`MemAvailable`が不足すると、メモリ要求の継続はstd::bad_allocを返すかBEプロセスOOMを引き起こす可能性があります。プロセスメモリ統計の更新とBEメモリGCには一定の遅延があるため、OOMを可能な限り避けるために小さなメモリバッファがlow water markとして予約されています。

その中で、`MemAvailable`は可能な限りスワップをトリガーせずにユーザープロセスに提供できるメモリ総量で、現在のフリーメモリ、バッファ、キャッシュ、メモリ断片化等の要因に基づいてオペレーティングシステムが提供します。簡単な計算式は：`MemAvailable = MemFree - LowWaterMark + (PageCache - min(PageCache / 2, LowWaterMark))`で、cmdの`free`で見える`available`値と同じです。詳細は参照：

[why-is-memavailable-a-lot-less-than-memfreebufferscached](https://serverfault.com/questions/940196/why-is-memavailable-a-lot-less-than-memfreebufferscached)

[Linux MemAvailable](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=34e431b0ae398fc54ea69ff85ec700722c9da773)

デフォルトのlow water markは3.2G（2.1.5以前は1.6G）で、`MemTotal`、`vm/min_free_kbytes`、`confg::mem_limit`、`config::max_sys_mem_available_low_water_mark_bytes`に基づいて計算され、メモリの過度な無駄を避けます。その中で、`MemTotal`はシステム総メモリで、値も`/proc/meminfo`から取得されます。`vm/min_free_kbytes`はメモリGCプロセス用にオペレーティングシステムが予約するバッファで、値は通常0.4%から5%です。一部のクラウドサーバーでは、`vm/min_free_kbytes`が5%の場合があり、システム利用可能メモリが実際値より少なく見える原因となります。`config::max_sys_mem_available_low_water_mark_bytes`を増やすことで64G以上のメモリマシンでFull GC用により多くのメモリバッファを予約し、そうでなければ減らすことでメモリを最大限に活用します。
