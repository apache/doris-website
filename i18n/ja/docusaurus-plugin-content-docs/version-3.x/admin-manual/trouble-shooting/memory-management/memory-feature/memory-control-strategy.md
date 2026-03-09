---
{
  "title": "メモリ制御戦略",
  "language": "ja",
  "description": "Doris Allocatorは、システム内の大容量ブロックメモリアプリケーションの統合エントリーポイントです。"
}
---
Doris Allocatorは、システムにおける大容量メモリアプリケーションの統一エントリポイントです。適切なタイミングでメモリ割り当て制限のプロセスに介入し、効率的で制御可能なメモリアプリケーションを確保します。

Doris MemoryArbitratorは、Doris BEプロセスのメモリ使用量をリアルタイムで監視し、定期的にメモリ状態を更新してメモリ関連統計のスナップショットを収集するメモリアービトレーターです。

Doris MemoryReclamationは、利用可能メモリが不足した際にメモリGCをトリガーしてメモリの一部を回収し、クラスター上でのほとんどのタスク実行の安定性を確保するメモリリクレイマーです。

## Doris Allocator

![Memory Management Overview](/images/memory-management-overview.png)

Allocatorは、システムからメモリを申請し、MemTrackerを使用してアプリケーションプロセス中のメモリ申請とリリースのサイズを追跡します。バッチでオペレーターを実行するために必要な大容量メモリは、異なるデータ構造によって管理されます。

クエリ実行プロセス中、大容量メモリブロックの割り当ては主にArena、HashTable、PODArrayデータ構造によって管理されます。AllocatorはArena、PODArray、HashTableの統一メモリインターフェースとして機能し、統一メモリ管理とローカルメモリ再利用を実現します。

![Memory Allocator](/images/memory-allocator.png)

Allocatorは、一般的なメモリアロケーターを使用してメモリを申請します。JemallocとTCMallocの選択において、DorisはかつてTCMallocのCentralFreeListのSpin Lockが高同時実行テストでクエリ総時間の40％を占めることがありました。積極的なメモリデコミットを無効にすることで性能を効果的に向上させることができますが、大量のメモリを無駄にすることになります。このため、専用スレッドを使用してTCMallocキャッシュを定期的に回収する必要がありました。Jemallocは高同時実行下でTCMallocを上回る性能を発揮し、成熟して安定しています。Doris 1.2.2でJemallocに切り替えられました。調整後、ほとんどのシナリオでTCMallocと同等の性能を発揮し、使用メモリも少なくなりました。高同時実行シナリオの性能も大幅に改善されました。

### Arena

Arenaは、メモリブロックのリストを維持し、そこからメモリを割り当ててalloc要求に応答するメモリプールで、システムからメモリを要求する回数を減らして性能を向上させます。メモリブロックはChunkと呼ばれ、メモリプールのライフサイクル全体を通して存在し、破棄時に統一的にリリースされます。これは通常クエリのライフサイクルと同じです。メモリアライメントもサポートし、主にShuffleプロセス中のシリアライズ/デシリアライズデータ、HashTableのシリアライズKeyなどの保存に使用されます。

Chunkは最初4096バイトで、内部でカーソルを使用して割り当て済みメモリ位置を記録します。現在のChunkの残りサイズが現在のメモリ要求を満たせない場合、新しいChunkが要求されてリストに追加されます。システムからメモリを要求する回数を減らすため、現在のChunkが128M未満の場合、新しく要求される各Chunkのサイズは倍増されます。現在のChunkが128Mを超える場合、新しく要求されるChunkのサイズは、現在のメモリ要求を満たすことを前提として最大128Mまで割り当てられ、メモリの無駄を過度に避けます。デフォルトでは、以前のChunkは以降のallocに参加しません。

### HashTable

DorisのHashTableは主にHash Join、集約、集合演算、ウィンドウ関数で使用されます。主に使用されるPartitionedHashTableは最大16のサブHashTableを含み、2つのHashTableの並列マージをサポートし、各サブHash Joinは独立して拡張され、総メモリ使用量の削減が期待され、拡張時の遅延も分散されます。

HashTableが8M未満の場合、4倍で拡張されます。HashTableが8Mを超える場合、2倍で拡張されます。HashTableが2G未満の場合、拡張係数は50％、つまりHashTableが50％まで埋まった時に拡張がトリガーされます。HashTableが2Gを超えた後、拡張係数は75％に調整されます。メモリの過度な無駄を避けるため、HashTableは通常、構築前にデータ量に応じて事前拡張されます。さらに、DorisはさまざまなシナリオのためにdifferentHashTableを設計しており、集約シナリオでの並行性能を最適化するためにPHmapを使用するなどがあります。

### PODArray

PODArrayはPOD型の動的配列です。要素を初期化せず、一部のstd::vectorインターフェースをサポートし、メモリアライメントと2の倍数での拡張をサポートする点でstd::vectorと異なります。PODArrayが破棄される際、各要素のデストラクターを呼び出さず、メモリブロック全体を直接リリースします。主にStringなどのカラムのデータ保存に使用されます。さらに、関数計算と式フィルタリングでも広く使用されます。

### メモリ再利用

Dorisは実行レイヤーで多くのメモリ再利用を行っており、可視的なメモリホットスポットは基本的にブロックされています。例えば、データブロックBlockの再利用はQueryの実行を貫通します。例えば、ShuffleのSender側は常に1つのBlockを保持してデータを受信し、1つのBlockがRPC送信で交互に使用されます。ストレージレイヤーは述語カラムを再利用して読み取り、フィルタリング、上位レイヤーのBlockへのコピー、Tablet読み取り時のClearを行います。Aggregate Keyテーブルをロードする際、キャッシュデータのMemTableが一定サイズに達した後、事前集約後に縮小して書き込みを継続するなどです。

さらに、Dorisはデータスキャン開始前にScannerとスレッド数に基づいてFree Blockのバッチを事前割り当てします。Schedulerがスケジュールされる度に、そこからBlockを取得してストレージレイヤーに渡してデータを読み取ります。読み取り完了後、Blockは上位レイヤーオペレーターによる消費と後続計算のためにプロデューサーキューに配置されます。上位レイヤーオペレーターがデータをコピーした後、次回のSchedulerスケジューリングのためにBlockをFree Blockに戻し、メモリ再利用を実現します。データスキャン完了後、Free Blockは以前に事前割り当てされたスレッドで統一的にリリースされ、メモリ申請とリリースが同じスレッドでないことによる余分なオーバーヘッドを回避します。Free Blockの数はデータスキャンの同時実行性をある程度制御します。

## Memory GC

Doris BEは定期的にシステムからプロセスの物理メモリと現在のシステム利用可能メモリを取得し、すべてのクエリ、ロード、コンパクションタスクのMemTrackerのスナップショットを収集します。BEプロセスメモリが制限を超えるか、システムの利用可能メモリが不足した場合、Dorisはキャッシュをリリースし、一部のクエリやロードを終了してメモリをリリースします。このプロセスは専用のGCスレッドによって定期的に実行されます。

![Memory GC](/images/memory-gc.png)

Minor GCは、Doris BEプロセスメモリがSoftMemLimit（デフォルトではシステム総メモリの81％）を超えるか、システムの残り利用可能メモリがWarning水位（通常3.2GB以下）を下回った時にトリガーされます。この時、Allocatorがメモリを割り当てる際にクエリが一時停止され、強制キャッシュのデータがロードされ、一部のData Page Cacheと期限切れのSegment Cacheがリリースされます。リリースされたメモリがプロセスメモリの10％未満の場合、クエリメモリオーバーイシュアンスが有効であれば、メモリオーバーイシュアンス比の大きいクエリが、プロセスメモリの10％がリリースされるかキャンセル可能なクエリがなくなるまでキャンセルされ、その後システムメモリ状態取得間隔とGC間隔が下げられます。他のクエリは残りメモリが確認された後に実行を継続します。

BEプロセスメモリがMemLimit（デフォルトではシステム総メモリの90％）を超えるか、システムの残り利用可能メモリがLow水位（通常1.6GB以下）を下回った場合、Full GCがトリガーされます。上記の操作に加えて、キャッシュデータの強制フラッシュ時にロードも一時停止され、すべてのData Page Cacheとその他のキャッシュの大部分がリリースされます。リリースされたメモリが20％未満の場合、すべてのクエリとロードのMemTrackerリストで一定の戦略に従って検索を開始し、メモリ使用量の大きいクエリ、メモリオーバーイシュアンス比の大きいロード、メモリ使用量の大きいロードを順次キャンセルし、プロセスメモリの20％がリリースされるまで続けます。その後、システムメモリ状態取得間隔とGC間隔が増加され、他のクエリとロードは実行を継続します。GC時間は通常数百μsから数十msです。

## メモリ制限と水位計算方法

- プロセスメモリ制限MemLimit = `be.conf/mem_limit * PhysicalMemory`、デフォルトはシステム総メモリの90％、詳細は参照。

- プロセスメモリソフト制限SoftMemLimit = `be.conf/mem_limit * PhysicalMemory * be.conf/soft_mem_limit_frac`、デフォルトはシステム総メモリの81％。

- システム残り利用可能メモリlow water mark LowWaterMark = `be.conf/max_sys_mem_available_low_water_mark_bytes`、デフォルトは-1、この場合LowWaterMark = `min(PhysicalMemory - MemLimit, PhysicalMemory * 0.05)`、64Gメモリマシンでは、LowWaterMarkの値は3.2GB弱（`PhysicalMemory`の実際の値が64G未満であることが多いため）。

- システム残り利用可能メモリwarning water mark WarningWaterMark = `2 * LowWaterMark`、64Gメモリマシンでは、`WarningWaterMark`はデフォルトで6.4GB弱。

## システム残り利用可能メモリの計算

エラーメッセージの利用可能メモリがlow water markを下回る場合も、プロセスメモリ超過として扱われます。システム利用可能メモリの値は`/proc/meminfo`の`MemAvailable`から取得されます。`MemAvailable`が不足すると、メモリ要求の継続でstd::bad_allocが返されるかBEプロセスOOMが発生する可能性があります。プロセスメモリ統計の更新とBEメモリGCに一定の遅延があるため、OOMを可能な限り回避するために少量のメモリバッファーがlow water markとして予約されます。

ここで、`MemAvailable`は、可能な限りスワップをトリガーすることなくユーザープロセスに提供できるメモリの総量で、現在の空きメモリ、バッファー、キャッシュ、メモリ断片化などの要因に基づいてオペレーティングシステムが提供します。簡単な計算式は：`MemAvailable = MemFree - LowWaterMark + (PageCache - min(PageCache / 2, LowWaterMark))`で、cmdの`free`で見える`available`値と同じです。詳細は参照：

[why-is-memavailable-a-lot-less-than-memfreebufferscached](https://serverfault.com/questions/940196/why-is-memavailable-a-lot-less-than-memfreebufferscached)

[Linux MemAvailable](https://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git/commit/?id=34e431b0ae398fc54ea69ff85ec700722c9da773)

デフォルトのlow water markは3.2G（2.1.5以前は1.6G）で、`MemTotal`、`vm/min_free_kbytes`、`confg::mem_limit`、`config::max_sys_mem_available_low_water_mark_bytes`に基づいて計算され、メモリの過度な無駄を回避します。ここで、`MemTotal`はシステム総メモリで、値は`/proc/meminfo`から取得されます。`vm/min_free_kbytes`はメモリGCプロセスのためにオペレーティングシステムが予約するバッファーで、値は通常0.4％から5％です。一部のクラウドサーバーでは、`vm/min_free_kbytes`が5％の場合があり、システム利用可能メモリが実際の値より少なく見えることがあります。`config::max_sys_mem_available_low_water_mark_bytes`を増やすことで、64G以上のメモリマシンでFull GCのためにより多くのメモリバッファーを予約し、逆に減らすことでメモリを最大限活用できます。
