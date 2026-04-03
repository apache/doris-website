---
{
  "title": "ロードメモリ解析",
  "language": "ja",
  "description": "Dorisのデータロードは、フラグメント読み取りとチャネル書き込みの2つの段階に分かれています。fragmentとquery fragmentの実行ロジックは同じです。"
}
---
Dorisのデータロードは、フラグメント読み取りとチャネル書き込みの2つのステージに分かれています。fragmentとquery fragmentの実行ロジックは同じですが、Stream Loadは通常Scan Operatorのみを持ちます。Channelは主に一時的なデータ構造であるMemtableにデータを書き込み、その後Delta Writerがデータを圧縮してファイルに書き込みます。

## ロードメモリビュー

どこかで`Label=load, Type=overview` Memory Trackerの値が大きい場合、ロードメモリが大量に使用されていることを意味します。

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```
Dorisによるメモリ負荷は2つの部分に分かれています。1つ目はfragment実行で使用されるメモリで、2つ目はMemTableの構築とフラッシュプロセスで使用されるメモリです。

BEウェブページ`http://{be_host}:{be_web_server_port}/mem_tracker?type=global`で見つかる`Label=AllMemTableMemory, Parent Label=DetailsTrackerSet`を持つMemory Trackerは、このBEノード上ですべてのロードタスクが`MemTable`を構築およびフラッシュするために使用するメモリです。エラープロセスメモリが制限を超過するか、利用可能なメモリが不足している場合、このMemory Trackerは`be.INFO`ログの`Memory Tracker Summary`でも見つけることができます。

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```
## Load Memory Analysis

`Label=AllMemTableMemory`の値が小さい場合、ロードタスクで使用されるメインメモリは実行フラグメントです。分析方法は[Query Memory Analysis](./query-memory-analysis.md)と同じなので、ここでは繰り返しません。

`Label=AllMemTableMemory`の値が大きい場合、MemTableが適時にフラッシュされていない可能性があります。`be.conf`の`load_process_max_memory_limit_percent`と`load_process_soft_mem_limit_percent`の値を小さくすることを検討できます。これによりMemTableをより頻繁にフラッシュできるため、メモリにキャッシュされるMemTableが少なくなりますが、書き込まれるファイル数は増加します。小さなファイルが多すぎる場合、compactionの負荷が増加します。compactionが適時でない場合、メタデータメモリが増加し、クエリが遅くなり、ファイル数が制限を超えた後にロードがエラーを報告することさえあります。

ロード実行プロセス中に、BEのWebページ`/mem_tracker?type=load`を確認してください。2つのメモリトラッカーグループ`Label=MemTableManualInsert`と`Label=MemTableHookFlush`の値に基づいて、`MemTable`メモリ使用量が大きい`LoadID`と`TabletID`を特定できます。
