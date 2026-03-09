---
{
  "title": "リリース 1.1.3",
  "language": "ja",
  "description": "このリリースでは、DorisチームはDoris 1.1.2以降の80以上の問題やパフォーマンス改善を修正しました。このリリースは1のバグ修正リリースです。"
}
---
今回のリリースでは、Doris Teamは1.1.2以降80件以上の問題または性能改善を修正しました。このリリースは1.1のバグ修正版であり、すべてのユーザーにこのリリースへのアップグレードを推奨します。

# Features

- ODBCテーブルにおいて、sqlserverとpostgresqlのエスケープ識別子をサポート。

- 出力ファイル形式としてParquetを使用可能。

# Improvements

- 小さなセグメントを回避するためにflushポリシーを最適化。[#12706](https://github.com/apache/doris/pull/12706) [#12716](https://github.com/apache/doris/pull/12716)

- 準備時間を短縮するためにruntime filterをリファクタリング。[#13127](https://github.com/apache/doris/pull/13127)

- クエリまたはロードプロセス中のメモリ制御関連の多数の問題。[#12682](https://github.com/apache/doris/pull/12682) [#12688](https://github.com/apache/doris/pull/12688) [#12708](https://github.com/apache/doris/pull/12708) [#12776](https://github.com/apache/doris/pull/12776) [#12782](https://github.com/apache/doris/pull/12782) [#12791](https://github.com/apache/doris/pull/12791) [#12794](https://github.com/apache/doris/pull/12794) [#12820](https://github.com/apache/doris/pull/12820) [#12932](https://github.com/apache/doris/pull/12932) [#12954](https://github.com/apache/doris/pull/12954) [#12951](https://github.com/apache/doris/pull/12951)

# BugFix

- largeintを使用したcompactionでのコアダンプ。[#10094](https://github.com/apache/doris/pull/10094)

- Grouping setsがbeコアを引き起こすか、間違った結果を返す。[#12313](https://github.com/apache/doris/pull/12313)

- orthogonal_bitmap_union_count演算子のPREAGGREGATIONフラグが間違っている。[#12581](https://github.com/apache/doris/pull/12581)

- Level1Iteratorはheap内のイテレータを解放すべきで、メモリリークを引き起こす可能性がある。[#12592](https://github.com/apache/doris/pull/12592)

- 2つのBEと既存のcolocationテーブルでのdecommission失敗を修正。[#12644](https://github.com/apache/doris/pull/12644)

- TBrokerOpenReaderResponseが大きすぎる場合のstack-buffer-overflowによるBEのコアダンプの可能性。[#12658](https://github.com/apache/doris/pull/12658)

- エラーコード-238が発生した際のロード中のBEのOOMの可能性。[#12666](https://github.com/apache/doris/pull/12666)

- lead関数の子式が間違っているのを修正。[#12587](https://github.com/apache/doris/pull/12587)

- 行ストレージコードでのintersectクエリ失敗を修正。[#12712](https://github.com/apache/doris/pull/12712)

- curdate()/current_date()関数で生成される間違った結果を修正。[#12720](https://github.com/apache/doris/pull/12720)

- 一時テーブルでのlateral view explode_splitのバグを修正。[#13643](https://github.com/apache/doris/pull/13643)

- 同じテーブル2つでのBucket shuffle joinプランが間違っている。[#12930](https://github.com/apache/doris/pull/12930)

- alterとloadを実行する際にタブレットバージョンが間違う可能性があるバグを修正。[#13070](https://github.com/apache/doris/pull/13070)

- md5sum()/sm3sum()を使用してbrokerでデータをロードする際のBEコア。[#13009](https://github.com/apache/doris/pull/13009)

# Upgrade Notes

PageCacheとChunkAllocatorは、メモリ使用量を削減するためにデフォルトで無効になっており、設定項目`disable_storage_page_cache`と`chunk_reserved_bytes_limit`を変更することで再度有効にできます。

Storage Page CacheとChunk Allocatorは、それぞれユーザーデータチャンクのキャッシュとメモリ事前割り当てを行います。

これら2つの機能は一定の割合のメモリを占有し、解放されません。このメモリ部分は柔軟に割り当てることができないため、一部のシナリオで他のタスクのメモリが不足し、システムの安定性と可用性に影響を与える可能性があります。そのため、バージョン1.1.3ではこれら2つの機能をデフォルトで無効にしました。

ただし、一部のレイテンシーに敏感なレポートシナリオでは、この機能をオフにするとクエリレイテンシーが増加する可能性があります。アップグレード後にこの機能がビジネスに与える影響を懸念する場合は、be.confに以下のパラメータを追加することで、以前のバージョンと同じ動作を保つことができます。

```
disable_storage_page_cache=false
chunk_reserved_bytes_limit=10%
```
* ``disable_storage_page_cache``: Storage Page Cacheを無効にするかどうか。バージョン1.1.2（含む）では、デフォルトはfalse、つまりオンです。バージョン1.1.3では、デフォルトはtrue、つまりオフです。
* `chunk_reserved_bytes_limit`: Chunkアロケーターの予約メモリサイズ。1.1.2（およびそれ以前）では、デフォルトは全体メモリの10%です。1.1.3バージョンのデフォルトは209715200（200MB）です。
