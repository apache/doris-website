---
{
    "title": "キャッシュメモリの分析",
    "language": "ja",
    "description": "Doris が管理するキャッシュは、現在すべて LRU 方式でエントリを削除します。"
}
---

Doris が管理するキャッシュは、現在すべて LRU 方式でエントリを削除します。また、それぞれのキャッシュで、パラメータを使って容量とエントリの削除までの時間を個別に制御できます。

## Doris のキャッシュの種類

1. ページキャッシュ

データのスキャンを高速化するために使用します。

```
- DataPageCache: Cache data Page.
- IndexPageCache: Cache data Page index.
- PKIndexPageCache: Cache Page primary key index.
```

2. メタデータキャッシュ

メタデータの読み取りを高速化するために使用します。

```
- SegmentCache: Cache open Segments, such as index information.
- SchemaCache: Cache Rowset Schema.
- TabletSchemaCache: Cache Tablet Schema.
- CreateTabletRRIdxCache: Cache Create Tabelt index.
- MowTabletVersionCache: Cache Mow Tablet Version.
- MowDeleteBitmapAggCache: Cache Mow DeleteBitmap.
```

3. クラウドキャッシュ

クラウド専用のキャッシュです。

```
- CloudTabletCache: Cache Tablet on the Cloud.
- CloudTxnDeleteBitmapCache: Cache DeleteBitmap on Cloud.
```

4. 転置インデックスキャッシュ

転置インデックスの処理を高速化します。

```
- InvertedIndexSearcherCache
- InvertedIndexQueryCache
```

5. ポイントクエリキャッシュ

主にログ分析で使用するポイントクエリの実行を高速化します。

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

## Doris のキャッシュを確認する方法

Doris のキャッシュに関する指標は、次の三つの方法で確認できます。

1. Doris BE Metrics

Web ページ `http://{be_host}:{be_web_server_port}/metrics` では、各キャッシュの容量、使用量、要素数、参照回数、ヒット回数など、BE プロセスのメモリに関する指標（Metrics）を確認できます。

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

Web ページ `http://{be_host}:{brpc_port}/vars/*cache*` では、一部のキャッシュに固有の指標を確認できます。

> 将来的には、Doris BE Metrics の指標を Doris BE Bvar に移す予定です。

3. メモリトラッカー

各キャッシュが使用しているメモリサイズをリアルタイムで確認する方法については、[グローバルメモリの分析](./global-memory-analysis.md)を参照してください。メモリエラーが発生した場合は、`Memory Tracker Summary` を `be/log/be.INFO` ログで探すと、その時点のキャッシュのメモリサイズを確認できます。

## Doris のキャッシュメモリの分析

Doris BE の実行中は、さまざまなキャッシュが使用されます。通常、キャッシュメモリを意識する必要はありません。BE プロセスで使用可能なメモリが不足すると、メモリ GC が実行され、まずキャッシュがクリーンアップされるためです。

ただし、キャッシュが大きすぎると、メモリ GC の負荷が高まり、クエリやロード処理で使用可能なメモリが不足してエラーになるリスクや、BE プロセスが OOM でクラッシュするリスクが高まります。メモリ不足が続く場合は、キャッシュ容量の上限を下げる、キャッシュを無効にする、またはキャッシュエントリの有効期間を短くすることを検討してください。キャッシュを小さくすると、状況によってはクエリ性能が低下することがありますが、通常は本番環境でも許容できる範囲です。調整後は、クエリとロードの性能を一定期間観察してください。

> Doris 2.1 より前は、メモリ GC が十分に機能していませんでした。メモリが不足してもキャッシュが適時に解放されないことがあり、メモリ不足が続く場合は、キャッシュの上限を手動で下げる必要がしばしばありました。

Doris 2.1.6 以降、BE の稼働中にすべてのキャッシュを手動でクリーンアップするには、`curl http://{be_host}:{be_web_server_port}/api/clear_cache/all` を実行します。解放されたメモリサイズが返されます。

以下では、各種キャッシュが多くのメモリを使用している場合の対処方法を説明します。

### DataPageCache が多くのメモリを使用している場合

- Doris 2.1.6 以降、BE の稼働中に `curl http://{be_host}:{be_web_server_port}/api/clear_cache/DataPageCache` を実行すると、手動でクリーンアップできます。

- `curl -X POST http://{be_host}:{be_web_server_port}/api/update_config?disable_storage_page_cache=true` を実行すると、稼働中の BE で DataPageCache を無効にでき、デフォルトでは最大 10 分後にクリーンアップされます。ただし、これは一時的な方法です。BE を再起動すると、DataPageCache は再び有効になります。

- DataPageCache のメモリ使用量を長期的に減らす場合は、[BE の設定項目](../../../config/be-config)を参照してください。`storage_page_cache_limit` を `conf/be.conf` で下げて DataPageCache の容量を減らすか、`data_page_cache_stale_sweep_time_sec` を下げてキャッシュの有効期間を短くするか、`disable_storage_page_cache=true` を設定して DataPageCache を無効にしてから、BE プロセスを再起動します。

### SegmentCache が多くのメモリを使用している場合

- Doris 2.1.6 以降、BE の稼働中に `curl http://{be_host}:{be_web_server_port}/api/clear_cache/SegmentCache` を実行すると、手動でクリーンアップできます。

- `curl -X POST http:/{be_host}:{be_web_server_port}/api/update_config?disable_segment_cache=true` を実行すると、稼働中の BE で SegmentCache を無効にでき、デフォルトでは最大 10 分後にクリーンアップされます。ただし、これは一時的な方法です。BE を再起動すると、SegmentCache は再び有効になります。

- SegmentCache のメモリ使用量を長期的に減らす場合は、[BE の設定項目](../../../config/be-config)を参照してください。`segment_cache_capacity` または `segment_cache_memory_percentage` を `conf/be.conf` で調整して SegmentCache の容量を減らすか、`tablet_rowset_stale_sweep_time_sec` を下げてキャッシュの有効期間を短くするか、`disable_segment_cache=true` を `conf/be.conf` に追加して SegmentCache を無効にし、BE プロセスを再起動します。

### PKIndexPageCache が多くのメモリを使用している場合

- Doris 2.1.6 以降、BE の稼働中に `curl http://{be_host}:{be_web_server_port}/api/clear_cache/PKIndexPageCache` を実行すると、手動でクリーンアップできます。

- [BE の設定項目](../../../config/be-config)を参照してください。`pk_storage_page_cache_limit` を `conf/be.conf` で下げて PKIndexPageCache の容量を減らすか、`pk_index_page_cache_stale_sweep_time_sec` を下げてキャッシュの有効期間を短くするか、`disable_pk_storage_page_cache=true` を `conf/be.conf` に追加して PKIndexPageCache を無効にしてから、BE プロセスを再起動します。
