---
{
  "title": "キャッシュメモリ解析",
  "language": "ja",
  "description": "Dorisによって管理されるキャッシュは現在すべてLRU削除戦略です。"
}
---
Dorisによって管理されるキャッシュは、現在すべてLRU削除戦略を使用しており、すべてパラメータを通じて容量と削除時間を個別に制御することをサポートしています。

## Dorisキャッシュタイプ

1. Page Cache

データスキャンを高速化するために使用されます。

```
- DataPageCache: Cache data Page.
- IndexPageCache: Cache data Page index.
- PKIndexPageCache: Cache Page primary key index.
```
2. メタデータキャッシュ

メタデータの読み取りを高速化するために使用されます。

```
- SegmentCache: Cache open Segments, such as index information.
- SchemaCache: Cache Rowset Schema.
- TabletSchemaCache: Cache Tablet Schema.
- CreateTabletRRIdxCache: Cache Create Tabelt index.
- MowTabletVersionCache: Cache Mow Tablet Version.
- MowDeleteBitmapAggCache: Cache Mow DeleteBitmap.
```
3. Cloud Cache

クラウド上の専用キャッシュ。

```
- CloudTabletCache: Cache Tablet on the Cloud.
- CloudTxnDeleteBitmapCache: Cache DeleteBitmap on Cloud.
```
4. 転置インデックスキャッシュ

転置インデックスを高速化します。

```
- InvertedIndexSearcherCache
- InvertedIndexQueryCache
```
5. Point Query Cache

ポイントクエリの実行を高速化します。主にログ解析に使用されます。

```
- PointQueryRowCache
- PointQueryLookupConnectionCache
```
6. その他のキャッシュ

```
- FileCache: File cache used by external table queries and Cloud.
- CommonObjLRUCache
- LastSuccessChannelCache
```
## Doris Cache View Method

Doris Cacheに関連する指標を確認する方法は3つあります。

1. Doris BE Metrics

Webページ`http://{be_host}:{be_web_server_port}/metrics`では、BEプロセスのメモリ監視（Metrics）を確認でき、各cacheの容量、使用量、要素数、検索およびヒット回数などの指標が含まれます。

```
- `doris_be_cache_capacity{name="TabletSchemaCache"} 102400`: Cache capacity, two limiting methods: memory size or number of elements.
- `doris_be_cache_usage{name="TabletSchemaCache"} 40838`: Cache usage, memory size or number of elements, corresponding to the limit of cache capacity.
- `doris_be_cache_usage_ratio{name="TabletSchemaCache"} 0.398809`: Cache usage, equal to `(cache_usage / cache_capacity)`.
- `doris_be_cache_element_count{name="TabletSchemaCache"} 1628`: Number of cache elements, equal to Cache Usage when the cache capacity limits the number of elements.
- `doris_be_cache_lookup_count{name="TabletSchemaCache"} 63393`: Number of cache lookups.
- `doris_be_cache_hit_count{name="TabletSchemaCache"} 61765`: Number of hits when looking up the cache.
- `doris_be_cache_hit_ratio{name="TabletSchemaCache"} 0.974319`: Hit ratio, equal to `(hit_count / lookup_count)`
```
2. Doris BE Bvar

Webページ `http://{be_host}:{brpc_port}/vars/*cache*` では、一部のcacheの固有のメトリクスを確認できます。

> 将来的に、Doris BE Metricsの指標はDoris BE Bvarに移行される予定です。

3. Memory Trakcer

各cacheがリアルタイムで占有するメモリサイズを確認するには、[Global Memory Analysis](./global-memory-analysis.md)を参照してください。メモリエラーが発生した場合、`be/log/be.INFO`ログ内で`Memory Tracker Summary`を確認でき、そこにはその時点でのcacheメモリサイズが含まれています。

## Doris Cache Memory Analysis

Doris BEの実行時には様々なcacheが存在します。通常、cacheメモリに注意を払う必要はありません。なぜなら、BEプロセスで利用可能なメモリが不足した場合、memory GCが起動してまずcacheをクリーンアップするからです。

ただし、cacheが大きすぎる場合、memory GCの負荷が増加し、queryやload errorプロセスで利用可能なメモリが不足するリスクが高まり、BEプロセスのOOM Crashのリスクも増加します。そのため、メモリが常に逼迫している場合は、cacheの上限を下げる、cacheを無効にする、またはcache entryの生存時間を短縮することを検討できます。より小さなcacheは一部のシナリオでqueryパフォーマンスを低下させる可能性がありますが、通常、本番環境では許容範囲内です。調整後は、一定期間queryとloadのパフォーマンスを観察できます。

> Doris 2.1以前では、Memory GCが完璧ではありませんでした。メモリが不足した際、cacheがタイムリーに解放されない可能性がありました。メモリが常に逼迫している場合、手動でcache制限を下げることをしばしば検討する必要がありました。

Doris 2.1.6以降、BE実行中に手動ですべてのcacheをクリーンアップしたい場合は、`curl http://{be_host}:{be_web_server_port}/api/clear_cache/all`を実行すると、解放されたメモリサイズが返されます。

以下では、異なるcacheがより多くのメモリを使用する状況を分析します。

### DataPageCacheがより多くのメモリを使用する場合

- Doris 2.1.6以降、BE実行中に手動でクリーンアップするには`curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache`を実行します。

- `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true`を実行して、実行中のBEのDataPageCacheを無効にし、デフォルトで最大10分後にクリアします。ただし、これは一時的な方法です。DataPageCacheはBEの再起動後に再び有効になります。

- 長期間DataPageCacheのメモリ使用量を削減することが確実な場合は、[BE Configuration Items](../../../config/be-config)を参照し、`conf/be.conf`の`storage_page_cache_limit`を削減してDataPageCacheの容量を減らすか、`data_page_cache_stale_sweep_time_sec`を削減してDataPageCache cacheの有効時間を短縮するか、`disable_storage_page_cache=true`を追加してDataPageCacheを無効にし、その後BEプロセスを再起動します。

### SegmentCacheが大量のメモリを使用する場合

- Doris 2.1.6以降、BE実行中に手動でクリーンアップするには`curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache`を実行します。

- `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true`を実行して、実行中のBEのSegmentCacheを無効にし、デフォルトで最大10分後にクリアしますが、これは一時的な方法であり、SegmentCacheはBEの再起動後に再び有効になります。

- 長期間SegmentCacheのメモリ使用量を削減することが確実な場合は、[BE Configuration Items](../../../config/be-config)を参照し、`conf/be.conf`の`segment_cache_capacity`または`segment_cache_memory_percentage`を調整してSegmentCacheの容量を削減するか、`tablet_rowset_stale_sweep_time_sec`を削減してSegmentCache cacheの有効時間を短縮するか、`conf/be.conf`に`disable_segment_cache=true`を追加してSegmentCacheを無効にし、BEプロセスを再起動します。

### PKIndexPageCacheが大量のメモリを使用する場合

- Doris 2.1.6以降、BE実行中に手動でクリーンアップするには`curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache`を実行します。

- [BE Configuration Items](../../../config/be-config)を参照し、`conf/be.conf`の`pk_storage_page_cache_limit`を下げてPKIndexPageCacheの容量を削減するか、`pk_index_page_cache_stale_sweep_time_sec`を下げてPKIndexPageCacheの有効時間を短縮するか、`conf/be.conf`に`disable_pk_storage_page_cache=true`を追加してPKIndexPageCacheを無効にし、その後BEプロセスを再起動します。
