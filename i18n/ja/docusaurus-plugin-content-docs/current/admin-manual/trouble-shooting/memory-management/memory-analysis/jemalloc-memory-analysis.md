---
{
    "title": "Jemalloc のメモリ分析",
    "language": "ja",
    "description": "Doris はデフォルトで Jemalloc を汎用メモリアロケータとして使用します。Jemalloc 自体が占有するメモリには、キャッシュとメタデータが含まれます。"
}
---

Doris はデフォルトで Jemalloc を汎用メモリアロケータとして使用します。Jemalloc 自体が占有するメモリには、キャッシュとメタデータが含まれます。キャッシュにはスレッドキャッシュとダーティページが含まれます。Doris BE の Process Profile Web ページの URL は http://{be_host}:{be_web_server_port}/profile. このページの **Memory Info** にある **Jemalloc Profiles** セクションで、メモリアロケータの元のプロファイルをリアルタイムに確認できます。

## Jemalloc キャッシュのメモリ分析

`Label=tc/jemalloc_cache, Type=overview` の Memory Tracker の値が大きい場合、Jemalloc または TCMalloc のキャッシュが多くのメモリを使用していることを意味します。Doris はデフォルトのアロケータとして Jemalloc を使用するため、ここでは Jemalloc のキャッシュが多くのメモリを使用している場合のみを分析します。

```
MemTrackerLimiter Label=tc/jemalloc_cache, Type=overview, Limit=-1.00 B(-1 B), Used=410.44 MB(430376896 B), Peak=-1.00 B(-1 B)
```

> Doris 2.1.6 より前では、`Label=tc/jemalloc_cache` に Jemalloc のメタデータも含まれます。Jemalloc のメタデータが多くのメモリを使用しているために `Label=tc/jemalloc_cache` の値が大きくなっている可能性があります。`Label=tc/jemalloc_metadata` の Memory Tracker に関する分析を参照してください。

BE プロセスの実行中、Jemalloc のキャッシュは次の二つの部分で構成されます。

- スレッドキャッシュ：指定された数のページをスレッドキャッシュに保持します。[Jemalloc opt.tcache](https://jemalloc.net/jemalloc.3.html#opt.tcache) を参照してください。

- ダーティページ：Arena 内で再利用できるすべてのメモリページです。

### Jemalloc キャッシュの確認方法

Doris BE の Process Profile Web ページ `http://{be_host}:{be_web_server_port}/profile` （webserver_port のデフォルトは 8040）の **Memory Info** にある **Jemalloc Profiles** セクションで Jemalloc Profile を取得し、いくつかの主要な情報を基に Jemalloc のキャッシュの使用状況を判断します。

- Jemalloc Profile の `tcache_bytes` は、Jemalloc のスレッドキャッシュの合計バイト数です。`tcache_bytes` の値が大きい場合、スレッドキャッシュが使用するメモリが多すぎることを意味します。

- Jemalloc Profile の `dirty` 列（`extents` テーブル）の値の合計が大きい場合、Jemalloc のダーティページが使用するメモリが多すぎることを示します。

### スレッドキャッシュのメモリ使用量が多すぎる場合

スレッドキャッシュが大きなページを多数保持している可能性があります。スレッドキャッシュの上限はページの合計バイト数ではなく、ページ数で決まるためです。

`lg_tcache_max` を `JEMALLOC_CONF`（`be.conf` 内）で小さくすることを検討してください。`lg_tcache_max` はキャッシュできるページのバイトサイズの上限です。デフォルト値は 15、つまり 32 KB（2^15）です。このサイズを超えるページはスレッドキャッシュに保持されません。`lg_tcache_max` は Jemalloc Profile の `Maximum thread-cached size class` に対応します。

> Doris 2.1 より前では、`lg_tcache_max` の `JEMALLOC_CONF`（`be.conf` 内）でのデフォルト値は 20 であり、状況によっては Jemalloc のキャッシュが大きくなりすぎます。Doris 2.1 以降は、Jemalloc のデフォルト値である 15 に戻されています。

通常、これは BE プロセスでのクエリやロードが、大きなサイズクラスのメモリページを多数要求するために発生します。または、大量のメモリを使用するクエリやロードの実行後に、大きなサイズクラスのメモリページがスレッドキャッシュに多数保持されるために発生します。スレッドキャッシュが解放される機会は二つあります。一つ目は、メモリの確保と解放が一定回数に達したときに、長期間使用されていないメモリブロックを回収する場合です。二つ目は、スレッドの終了時にすべてのページを回収する場合です。ただし、問題となるケースがあります。そのスレッドがその後新しいクエリやロードを実行しなければ、メモリを新たに確保せず、いわゆる `idle` 状態になります。クエリの完了後にメモリが解放されることを期待しても、この場合はスレッドが終了しない限り、スレッドキャッシュは解放されません。

ただし、通常はスレッドキャッシュを気にする必要はありません。プロセスで利用可能なメモリが不足したとき、スレッドキャッシュのサイズが 1G を超えていれば、Doris はスレッドキャッシュを手動でフラッシュします。

### ダーティページのメモリ使用量が多すぎる場合
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
              114688  14            1       102400            1       106496           15      1642496           17      1851392
```

`dirty_decay_ms` を `JEMALLOC_CONF`（`be.conf` 内）で 2000 ms 以下に下げてください。`dirty_decay_ms` のデフォルト値は `be.conf` で 5000 ms です。Jemalloc は、`dirty_decay_ms` で指定された時間内に、滑らかな勾配曲線に従ってダーティページを解放します。[Jemalloc opt.dirty_decay_ms](https://jemalloc.net/jemalloc.3.html#opt.dirty_decay_ms) を参照してください。BE プロセスで利用可能なメモリが不足し、Minor GC または Full GC がトリガーされた場合は、所定の方式に従ってすべてのダーティページを能動的に解放します。

> Doris 2.1 より前では、`dirty_decay_ms` の `JEMALLOC_CONF`（`be.conf` 内）でのデフォルト値は 15000 であり、状況によっては Jemalloc のキャッシュが大きくなりすぎます。Doris 2.1 以降、デフォルト値は 5000 です。

Jemalloc Profile の `extents` には、すべての Jemalloc `arena` におけるページサイズ別のバケットの統計値が含まれます。`ndirty` はダーティページの数、`dirty` はダーティページの合計メモリ量です。`stats.arenas.<i>.extents.<j>.{extent_type}_bytes` については、[Jemalloc](https://jemalloc.net/jemalloc.3.html) を参照してください。すべてのページサイズの `dirty` を合計すると、Jemalloc のダーティページのメモリサイズをバイト単位で求められます。

## Jemalloc メタデータのメモリ分析

`Label=tc/jemalloc_metadata, Type=overview` の Memory Tracker の値が大きい場合、Jemalloc または TCMalloc のメタデータが多くのメモリを使用していることを意味します。Doris はデフォルトのアロケータとして Jemalloc を使用するため、ここでは Jemalloc のメタデータが多くのメモリを使用している場合のみを分析します。

```
MemTrackerLimiter Label=tc/jemalloc_metadata, Type=overview, Limit=-1.00 B(-1 B), Used=144 MB(151759440 B), Peak=-1.00 B(-1 B)
```

> `Label=tc/jemalloc_metadata` の Memory Tracker は Doris 2.1.6 より後に追加されました。それ以前は、Jemalloc のメタデータは `Label=tc/jemalloc_cache` の Memory Tracker に含まれていました。

### Jemalloc メタデータの確認方法

Doris BE の Process Profile Web ページ `http://{be_host}:{be_web_server_port}/profile` （webserver_port のデフォルトは 8040）の **Memory Info** にある **Jemalloc Profiles** セクションで Jemalloc Profile を取得できます。Jemalloc Profile で以下のような Jemalloc 全体のメモリ統計を確認してください。このうち `metadata` が Jemalloc のメタデータのメモリサイズです。

`Allocated: 2401232080, active: 2526302208, metadata: 535979296 (n_thp 221), resident: 2995621888, mapped: 3221979136, retained: 131542581248`

- `Allocated`：Jemalloc が BE プロセスのために割り当てたメモリの合計バイト数です。

- `active`：Jemalloc が BE プロセスのために割り当てたすべてのページの合計バイト数です。ページサイズの倍数であり、通常は `Allocated` 以上になります。

- `metadata`：Jemalloc のメタデータの合計バイト数です。割り当て済みおよびキャッシュ済みのページ数、メモリの断片化などに関係します。[Jemalloc stats.metadata](https://jemalloc.net/jemalloc.3.html#stats.metadata) を参照してください。

- `retained`：Jemalloc が保持する仮想メモリマッピングのサイズです。munmap または同様の方法でオペレーティングシステムに返されていない領域であり、物理メモリ使用量との強い相関はありません。[Jemalloc stats.retained](https://jemalloc.net/jemalloc.3.html#stats.retained) を参照してください。

### Jemalloc メタデータのメモリ使用量が多すぎる場合

Jemalloc のメタデータのサイズは、プロセスの仮想メモリのサイズと正の相関があります。通常、Doris BE プロセスの仮想メモリが大きいのは、Jemalloc が多数の仮想メモリマッピングを保持しているためです。これは、上記の `retained` に相当します。Jemalloc に返された仮想メモリは、デフォルトでは再利用を待つために Retained にキャッシュされ、自動でも手動でも解放されません。

Jemalloc Retained が大きくなる根本的な原因は、Doris のコードレベルでのメモリ再利用が不十分なことです。その結果、大量の仮想メモリを確保する必要が生じ、解放後にその仮想メモリが Jemalloc Retained に入ります。通常、仮想メモリのサイズと Jemalloc のメタデータのサイズの比率は 300-500 です。つまり、仮想メモリが 10T の場合、Jemalloc のメタデータが 20G を占める可能性があります。

Jemalloc のメタデータと Retained が増え続け、プロセスの仮想メモリが大きくなりすぎる場合は、Doris BE プロセスの定期的な再起動を検討してください。通常、これは Doris BE を長期間実行した後にのみ発生し、遭遇するのは一部の Doris クラスターに限られます。現在、性能を損なわずに Jemalloc Retained が保持する仮想メモリマッピングを減らす方法はありません。Doris ではメモリ使用量の最適化を継続しています。

上記の問題が頻繁に発生する場合は、次の方法を参照してください。

1. 根本的な解決策は、Jemalloc Retained による仮想メモリマッピングのキャッシュを無効にすることです。`retain:false` を `JEMALLOC_CONF`（`be.conf` 内）の後に追加し、BE を再起動してください。ただし、クエリ性能が大幅に低下する可能性があり、TPC-H Benchmark テストの性能は約 3 分の一に低下します。

2. Doris 2.1 では、`set global experimental_enable_pipeline_engine=false; set global experimental_enable_pipeline_x_engine=false;` を実行して Pipelinex と Pipeline を無効にできます。これはクエリ性能の低下にもつながります。
