---
{
  "title": "リリース 1.1.3",
  "language": "ja",
  "description": "このリリースでは、Dorisチームはバージョン1.1.2以降、80以上の問題やパフォーマンス改善を修正しました。このリリースは1のバグフィックスリリースです。"
}
---
このリリースでは、Doris Teamは1.1.2以降80以上の問題の修正またはパフォーマンス改善を行いました。このリリースは1.1のバグフィックスリリースであり、すべてのユーザーはこのリリースへのアップグレードを推奨します。

# Features

- ODBCテーブルでsqlserverとpostgresqlのエスケープ識別子をサポート。

- Parquetを出力ファイル形式として使用可能。

# Improvements

- 小さなセグメントを避けるためのflushポリシーを最適化。[#12706](https://github.com/apache/doris/pull/12706) [#12716](https://github.com/apache/doris/pull/12716)

- 準備時間を短縮するためのruntime filterをリファクタリング。[#13127](https://github.com/apache/doris/pull/13127)

- クエリやロードプロセス中のメモリ制御関連の多数の問題。[#12682](https://github.com/apache/doris/pull/12682) [#12688](https://github.com/apache/doris/pull/12688) [#12708](https://github.com/apache/doris/pull/12708) [#12776](https://github.com/apache/doris/pull/12776) [#12782](https://github.com/apache/doris/pull/12782) [#12791](https://github.com/apache/doris/pull/12791) [#12794](https://github.com/apache/doris/pull/12794) [#12820](https://github.com/apache/doris/pull/12820) [#12932](https://github.com/apache/doris/pull/12932) [#12954](https://github.com/apache/doris/pull/12954) [#12951](https://github.com/apache/doris/pull/12951)

# BugFix

- largeintでのcompaction時のコアダンプ。[#10094](https://github.com/apache/doris/pull/10094)

- Grouping setsがbeコアを引き起こすまたは誤った結果を返す。[#12313](https://github.com/apache/doris/pull/12313)

- orthogonal_bitmap_union_countオペレーターのPREAGGREGATIONフラグが間違っている。[#12581](https://github.com/apache/doris/pull/12581)

- Level1Iteratorはheap内のiteratorを解放すべきであり、メモリリークを引き起こす可能性がある。[#12592](https://github.com/apache/doris/pull/12592)

- 2つのBEと既存のcolocationテーブルでのdecommission失敗を修正。[#12644](https://github.com/apache/doris/pull/12644)

- TBrokerOpenReaderResponseが大きすぎる場合のstack-buffer-overflowによるBEコアダンプの可能性。[#12658](https://github.com/apache/doris/pull/12658)

- エラーコード-238が発生したときのロード中のBE OOMの可能性。[#12666](https://github.com/apache/doris/pull/12666)

- lead関数の誤った子式を修正。[#12587](https://github.com/apache/doris/pull/12587)

- 行ストレージコードでのintersectクエリ失敗を修正。[#12712](https://github.com/apache/doris/pull/12712)

- curdate()/current_date()関数による誤った結果を修正。[#12720](https://github.com/apache/doris/pull/12720)

- 一時テーブルでのlateral view explode_splitバグを修正。[#13643](https://github.com/apache/doris/pull/13643)

- 同じテーブル2つでのBucket shuffle join計画が間違っている。[#12930](https://github.com/apache/doris/pull/12930)

- alterとload実行時にタブレットバージョンが間違う可能性があるバグを修正。[#13070](https://github.com/apache/doris/pull/13070)

- md5sum()/sm3sum()でbrokerを使用してデータをロードするときのBEコア。[#13009](https://github.com/apache/doris/pull/13009)

# Upgrade Notes

PageCacheとChunkAllocatorはメモリ使用量を削減するためデフォルトで無効になっており、設定項目`disable_storage_page_cache`と`chunk_reserved_bytes_limit`を変更することで再有効化できます。

Storage Page CacheとChunk Allocatorは、それぞれユーザーデータチャンクとメモリ事前割り当てをキャッシュします。

これら2つの機能は一定の割合のメモリを占有し、解放されません。このメモリ部分は柔軟に割り当てることができず、一部のシナリオで他のタスクのメモリ不足を引き起こし、システムの安定性と可用性に影響を与える可能性があります。そのため、バージョン1.1.3ではこれら2つの機能をデフォルトで無効にしました。

ただし、一部のレイテンシに敏感なレポートシナリオでは、この機能をオフにするとクエリレイテンシが増加する可能性があります。アップグレード後にこの機能がビジネスに与える影響を懸念する場合は、以下のパラメータをbe.confに追加することで、以前のバージョンと同じ動作を維持できます。

```
disable_storage_page_cache=false
chunk_reserved_bytes_limit=10%
```
* ``disable_storage_page_cache``: Storage Page Cacheを無効にするかどうか。バージョン1.1.2（含む）では、デフォルトはfalse、つまりオンです。バージョン1.1.3では、デフォルトはtrue、つまりオフです。
* `chunk_reserved_bytes_limit`: Chunkアロケータの予約メモリサイズ。1.1.2（以前）では、デフォルトは全体メモリの10%です。1.1.3バージョンのデフォルトは209715200（200MB）です。
