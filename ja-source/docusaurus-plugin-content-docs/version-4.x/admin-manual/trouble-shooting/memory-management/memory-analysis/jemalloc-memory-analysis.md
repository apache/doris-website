---
{
  "title": "jemallocメモリ解析",
  "language": "ja",
  "description": "DorisはデフォルトでJemallocを汎用メモリアロケータとして使用します。Jemalloc自体が占有するメモリには、CacheとMetadataが含まれます。"
}
---
Dorisはデフォルトで一般的なメモリアロケータとしてJemallocを使用します。Jemalloc自体が占有するメモリには、CacheとMetadataが含まれます。CacheにはThread CacheとDirty Pageが含まれます。メモリアロケータの元のプロファイルは、http://{be_host}:{be_web_server_port}/memzでリアルタイムに確認できます。

## Jemalloc Cacheメモリ解析

`Label=tc/jemalloc_cache, Type=overview`のMemory Trakcerの値が大きい場合、JemallocまたはTCMalloc Cacheが大量のメモリを使用していることを意味します。DorisはデフォルトのAllocatorとしてJemallocを使用するため、ここではJemalloc Cacheが大量のメモリを使用している状況のみを解析します。

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```
> Doris 2.1.6以前では、`Label=tc/jemalloc_cache`にはJemalloc Metadataも含まれており、Jemalloc Metadataの大きなメモリ使用量により`Label=tc/jemalloc_cache`が過度に大きくなる可能性があります。`Label=tc/jemalloc_metadata` Memory Trackerの分析を参照してください。

BEプロセスの実行中、Jemalloc Cacheは2つの部分で構成されます。

- Thread Cache、指定された数のPageをThread Cacheにキャッシュします。[Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache)を参照してください。

- Dirty Page、Arena内で再利用可能なすべてのメモリPage。

### Jemalloc Cache確認方法

Doris BEのWebページ`http://{be_host}:{be_web_server_port}/memz`（webserver_portのデフォルトは8040）を表示してJemalloc Profileを取得し、いくつかの重要な情報セットに基づいてJemalloc Cacheの使用状況を解釈します。

- Jemalloc Profileの`tcache_bytes`は、Jemalloc Thread Cacheの総バイト数です。`tcache_bytes`の値が大きい場合、Jemalloc Thread Cacheが使用するメモリが過度に大きいことを意味します。

- Jemalloc Profileの`extents`テーブルの`dirty`列の値の合計が大きい場合、Jemalloc Dirty Pageが使用するメモリが過度に大きいことを示します。

### Thread Cacheメモリが大きすぎる場合

Thread Cacheが大量の大きなページをキャッシュしている可能性があります。これは、Thread Cacheの上限がページの総バイト数ではなく、ページ数であるためです。

`be.conf`の`JEMALLOC_CONF`内の`lg_tcache_max`を削減することを検討してください。`lg_tcache_max`は、キャッシュが許可されるページのバイトサイズの上限です。デフォルト値は15、つまり32 KB（2^15）です。このサイズを超えるページはThread Cacheにキャッシュされません。`lg_tcache_max`は、Jemalloc Profileの`Maximum thread-cached size class`に対応します。

> Doris 2.1以前では、`be.conf`の`JEMALLOC_CONF`内の`lg_tcache_max`のデフォルト値は20でした。これにより一部のシナリオでJemalloc Cacheが過度に大きくなる可能性がありました。Doris 2.1以降、Jemallocのデフォルト値である15に変更されています。

これは通常、BEプロセス内のクエリまたはロードが大量の大きなサイズクラスのメモリページを要求しているか、大きなメモリクエリまたはロードの実行後に、大量の大きなサイズクラスのメモリページがThread Cacheにキャッシュされているためです。Thread Cacheをクリーンアップするタイミングは2つあります。1つは、メモリの割り当てと解放が一定回数に達した際に長時間使用されていないメモリブロックを回収するとき、もう1つは、スレッドが終了する際にすべてのページを回収するときです。この時点でBad Caseが発生します。スレッドが将来新しいクエリやロードを実行しない場合、メモリを割り当てなくなり、いわゆる`idle`状態に陥ります。ユーザーはクエリ完了後にメモリが解放されることを期待しますが、実際には、このシナリオでは、スレッドが終了しない限り、Thread Cacheはクリーンアップされません。

ただし、通常Thread Cacheに注意を払う必要はありません。プロセスの利用可能メモリが不足した際、Thread Cacheのサイズが1Gを超えている場合、DorisはThread Cacheを手動でフラッシュします。

### Dirty Pageメモリが大きすぎる場合

```
extents:        size ind       ndirty        dirty       nmuzzy        muzzy    nretained     retained       ntotal        total
                4096   0            7        28672            1         4096           21        86016           29       118784
                8192   1           11        90112            2        16384           11        90112           24       196608
               12288   2            2        24576            4        49152           45       552960           51       626688
               16384   3            0            0            1        16384            6        98304            7       114688
               20480   4            0            0            1        20480            5       102400            6       122880
               24576   5            0            0           43      1056768            2        49152           45      1105920
               28672   6            0            0            0            0           13       372736           13       372736
               32768   7            0            0            1        32768           13       425984           14       458752
               40960   8            0            0           31      1150976           35      1302528           66      2453504
               49152   9            4       196608            2        98304            3       139264            9       434176
               57344  10            0            0            1        57344            9       512000           10       569344
               65536  11            3       184320            0            0            6       385024            9       569344
               81920  12            2       147456            3       241664           38      2809856           43      3198976
               98304  13            0            0            1        86016            6       557056            7       643072
              114688  14            1       102400            1       106496           15      1642496           17      185139
```
`be.conf`の`JEMALLOC_CONF`の`dirty_decay_ms`を2000 ms以下に削減してください。`be.conf`のデフォルトの`dirty_decay_ms`は5000 msです。Jemallocは`dirty_decay_ms`で指定された時間内に、滑らかな勾配曲線に従ってdirty pageを解放します。参考：[Jemalloc opt.dirty_decay_ms](https://jemalloc.net/jemalloc.3.html#opt.dirty_decay_ms)。BEプロセスで使用可能なメモリが不足してMinor GCまたはFull GCがトリガーされた場合、特定の戦略に従ってすべてのdirty pageを積極的に解放します。

> Doris 2.1以前では、`be.conf`の`JEMALLOC_CONF`の`dirty_decay_ms`のデフォルト値は15000で、一部のシナリオでJemalloc Cacheが大きくなりすぎる原因となっていました。Doris 2.1以降、デフォルト値は5000です。

Jemalloc Profileの`extents`には、すべてのJemalloc `arena`内の異なるページサイズのバケットの統計値が含まれており、`ndirty`はdirty pageの数、`dirty`はdirty pageの総メモリです。[Jemalloc](https://jemalloc.net/jemalloc.3.html)の`stats.arenas.<i>.extents.<j>.{extent_type}_bytes`を参照し、すべてのPage Sizesの`dirty`を合計することで、JemallocのDirty Pageのメモリバイトサイズを取得できます。

## Jemalloc Metadataメモリ解析

`Label=tc/jemalloc_metadata, Type=overview`のMemory Trakcer値が大きい場合、JemallocまたはTCMalloc Metadataが多くのメモリを使用していることを意味します。DorisはデフォルトのAllocatorとしてJemallocを使用するため、ここではJemalloc Metadataが多くのメモリを使用する状況のみを解析します。

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```
> `Label=tc/jemalloc_metadata` Memory Trackerは、Doris 2.1.6以降に追加されました。従来、Jemalloc Metadataは`Label=tc/jemalloc_cache` Memory Trackerに含まれていました。

### Jemalloc Metadataの確認方法

Doris BEのWebページ`http://{be_host}:{be_web_server_port}/memz`を表示することでJemalloc Profileを取得できます（webserver_portのデフォルトは8040）。Jemalloc Profileで以下のようにJemallocの全体メモリ統計を確認します。ここで`metadata`がJemalloc Metadataのメモリサイズです。

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`

- `Allocated` JemallocがBEプロセスに割り当てたメモリの総バイト数。

- `active` JemallocがBEプロセスに割り当てたすべてのページの総バイト数。Page Sizeの倍数であり、通常`Allocated`以上の値になります。

- `metadata` Jemallocメタデータの総バイト数。割り当ておよびキャッシュされたページ数、メモリフラグメンテーションなどの要因に関連します。ドキュメント[Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata)を参照してください

- `retained` Jemallocが保持している仮想メモリマッピングのサイズ。munmapや類似の方法でオペレーティングシステムに返されず、物理メモリと強い関連はありません。参考ドキュメント[Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained)

### Jemalloc Metadataメモリが大きすぎる場合

Jemalloc Metadataのサイズは、プロセスの仮想メモリサイズと正の相関があります。通常、Doris BEプロセスの仮想メモリが大きいのは、Jemallocが大量の仮想メモリマッピング（上記の`retained`）を保持しているためです。Jemallocに返された仮想メモリはデフォルトでRetainedにキャッシュされ、再利用を待機し、自動または手動で解放されることはありません。

Jemalloc Retainedサイズが大きくなる根本的な理由は、Dorisコードレベルでのメモリ再利用が不十分で、大量の仮想メモリを申請する必要があり、解放後にJemalloc Retainedに入るためです。通常、仮想メモリとJemalloc Metadataサイズの比率は300-500の間、つまり10Tの仮想メモリがある場合、Jemalloc Metadataは約20Gを占有する可能性があります。

Jemalloc MetadataとRetainedが継続的に増加し、プロセス仮想メモリが大きすぎるという問題が発生した場合は、定期的にDoris BEプロセスを再起動することを検討することをお勧めします。通常、これはDoris BEが長時間実行された後にのみ発生し、少数のDorisクラスターでのみ遭遇します。現在、パフォーマンスを失うことなくJemalloc Retainedが保持する仮想メモリマッピングを削減する方法はありません。Dorisは継続的にメモリ使用量を最適化しています。

上記の問題が頻繁に発生する場合は、以下の方法を参照してください。

1. 根本的な解決策は、Jemalloc Retainedキャッシュ仮想メモリマッピングをオフにすることです。`be.conf`の`JEMALLOC_CONF`の後に`retain:false`を追加し、BEを再起動します。ただし、クエリパフォーマンスが大幅に低下し、TPC-H Benchmarkテストのパフォーマンスは約3倍低下する可能性があります。

2. Doris 2.1では、`set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;`を実行してPipelinexとPipelineをオフにできます。pipelinexとpipelineはより多くの仮想メモリを申請するためです。これもクエリパフォーマンスの低下につながります。
