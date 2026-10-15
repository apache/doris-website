---
{
    "title": "ロードのメモリ分析",
    "language": "ja",
    "description": "Doris のデータロードは、フラグメントの読み取りとチャネルへの書き込みの二段階に分かれます。フラグメントとクエリフラグメントの実行ロジックは同じです。"
}
---

Doris のデータロードは、フラグメントの読み取りとチャネルへの書き込みの二段階に分かれます。フラグメントとクエリフラグメントの実行ロジックは同じですが、Stream Load では通常 Scan Operator しか使用しません。チャネルは主にデータを一時的なデータ構造である MemTable に書き込み、その後 Delta Writer がデータを圧縮してファイルに書き込みます。

## ロード時のメモリの確認

いずれかの場所で `Label=load, Type=overview` の Memory Tracker の値が大きい場合は、ロード処理で多くのメモリが使用されていることを示します。

```
MemTrackerLimiter Label=load, Type=overview, Limit=-1.00 B(-1 B), Used=0(0 B), Peak=0(0 B)
```

Doris のロード処理で使用するメモリは、二つに分けられます。一つはフラグメントの実行に使用するメモリで、もう一つは MemTable の構築とフラッシュに使用するメモリです。

`Label=AllMemTableMemory, Parent Label=DetailsTrackerSet` の Memory Tracker は、BE の Web ページ `http://{be_host}:{be_web_server_port}/mem_tracker?type=global` に表示され、その BE ノード上のすべてのロードタスクが `MemTable` を構築およびフラッシュするために使用するメモリを示します。プロセスメモリが上限を超えるエラーが発生した場合や、使用可能なメモリが不足した場合は、この Memory Tracker が `Memory Tracker Summary`（`be.INFO` ログ内）にも表示されます。

```
MemTracker Label=AllMemTableMemory, Parent Label=DetailsTrackerSet, Used=25.08 MB(26303456 B), Peak=25.08 MB(26303456 B)
```

## ロードのメモリ分析

`Label=AllMemTableMemory` の値が小さい場合、ロードタスクが使用するメモリの大部分は実行フラグメントによるものです。分析方法は [クエリのメモリ分析](./query-memory-analysis.md) と同じため、ここでは繰り返しません。

`Label=AllMemTableMemory` の値が大きい場合、MemTable が適時にフラッシュされていない可能性があります。`load_process_max_memory_limit_percent` と `load_process_soft_mem_limit_percent`（`be.conf` 内）の値を小さくすることを検討してください。これにより MemTable のフラッシュ頻度が上がり、メモリ内に保持される MemTable の数が減りますが、書き込まれるファイルの数は増えます。小さなファイルが大量に書き込まれると、コンパクションの負荷が高くなります。コンパクションが間に合わない場合、メタデータが使用するメモリが増え、クエリが遅くなり、ファイル数が上限を超えるとロードでエラーが報告されることもあります。

ロードの実行中に、BE の Web ページ `/mem_tracker?type=load` を確認してください。`Label=MemTableManualInsert` と `Label=MemTableHookFlush` の二つの Memory Tracker グループの値から、`LoadID` と `TabletID` のうち、`MemTable` のメモリ使用量が大きいものを特定できます。
