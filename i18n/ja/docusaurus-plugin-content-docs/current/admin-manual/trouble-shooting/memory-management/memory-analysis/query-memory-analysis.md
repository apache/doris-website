---
{
    "title": "クエリのメモリ分析",
    "language": "ja",
    "description": "通常、クエリのメモリ使用量はまず Query Profile を使用して分析します。"
}
---

通常、クエリのメモリ使用量はまず Query Profile を使用して分析します。Query Profile で集計された各 Operator のメモリ使用量の合計が Query Memory Tracker で集計されたメモリ使用量より大幅に小さい場合、Query Profile で集計された Operator のメモリ使用量と実際の使用量に大きな差があることを意味します。この場合は、Heap Profile を使用してさらに分析する必要があります。メモリ上限の超過によってクエリがキャンセルされ、完了できなかった場合、Query Profile は不完全なため、正確に分析できないことがあります。通常、このような場合は Heap Profile を直接使用してクエリのメモリ使用量を分析します。

## クエリのメモリ使用量の確認

`Label=query, Type=overview` の Memory Tracker が大きな値を示している場合は、クエリのメモリ使用量が多いことを意味します。

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```

分析対象のクエリがすでにわかっている場合は、このセクションを飛ばして、以下の分析に進んでください。そうでない場合は、次の方法でメモリ使用量の多いクエリを特定します。

まず、メモリ使用量の多いクエリの QueryID を特定します。BE の Web ページ `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` で `Current Consumption` の順に並べ替えると、メモリ使用量の多いクエリをリアルタイムで確認できます。QueryID は `label` に含まれています。

プロセスのメモリ使用量が上限を超えるエラーが発生した場合、または利用可能なメモリが不足した場合、`Memory Tracker Summary` の下部には、`be.INFO` ログに記録された、メモリ使用量が最も多い上位 10 件のタスク（query/load/compaction など）の Memory Tracker が表示されます。形式は `MemTrackerLimiter Label=Query#Id=xxx, Type=query` です。通常、メモリ使用量の多いクエリの QueryID は、この上位 10 件から特定できます。

過去のクエリのメモリ使用量は、各クエリの `peakMemoryBytes` を `fe/log/fe.audit.log` で確認できます。また、`Deregister query/load memory tracker, queryId` を `be/log/be.INFO` で検索すると、単一の BE における各クエリのピークメモリ使用量を確認できます。

## Query Profile を使用したクエリのメモリ使用量の分析

QueryID を基に `fe/log/fe.audit.log` から SQL を含むクエリ情報を探し、`explain SQL` でクエリプランを取得します。また、`set enable_profile=true` を設定してから SQL を実行し、Query Profile を取得します。Query Profile の詳細については、[Query Profile](../../../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile-analyzing-execution-layer-bottlenecks) を参照してください。ここでは、Query Profile のうちメモリに関連する内容のみを説明し、それを基にメモリを大量に使用している Operator とデータ構造を特定します。

1. メモリを大量に使用している Operator またはメモリ上のデータ構造を特定する

Query Profile は二つの部分に分かれています。

- `MergedProfile`

MergedProfile は、クエリのすべての Instance Profile を集約した結果です。すべての Instance における各 Fragment の各 Pipeline の各 Operator について、メモリ使用量の合計、平均、最大値、最小値が表示されます。これには、Operator のピークメモリ使用量 `PeakMemoryUsage` や、`HashTable`、`Arena` などの主要なメモリ上のデータ構造のピークメモリ使用量が含まれます。この情報を基に、メモリを大量に使用している Operator とデータ構造を特定できます。

```
MergedProfile  
          Fragments:
              Fragment  0:
                  Pipeline  :  0(instance_num=1):
                      RESULT_SINK_OPERATOR  (id=0):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                          EXCHANGE_OPERATOR  (id=20):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  1.16  KB,  avg  1.16  KB,  max  1.16  KB,  min  1.16  KB
              Fragment  1:
                  Pipeline  :  1(instance_num=12):
                      AGGREGATION_SINK_OPERATOR  (id=18  ,  nereids_id=1532):
                            -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                -  HashTable:  sum  96.00  B,  avg  8.00  B,  max  24.00  B,  min  0.00  
                                -  PeakMemoryUsage:  sum  1.58  MB,  avg  134.67  KB,  max  404.02  KB,  min  0.00  
                                -  SerializeKeyArena:  sum  1.58  MB,  avg  134.67  KB,  max  404.00  KB,  min  0.00  
                          EXCHANGE_OPERATOR  (id=17):
                                -  MemoryUsage:  sum  ,  avg  ,  max  ,  min  
                                    -  PeakMemoryUsage:  sum  2.25  KB,  avg  192.00  B,  max  768.00  B,  min  0.00
```

- `Execution  Profile`

`Execution Profile` は、クエリの個々の Instance Profile の結果です。通常、`MergedProfile` を基にメモリを大量に使用している Operator とデータ構造を特定した後、`explain SQL` で得たクエリプランを基に、そのメモリ使用量の原因を分析できます。特定の BE ノードや特定の Instance におけるクエリのメモリ使用量を分析する必要がある場合は、`Execution Profile` を使用してさらに対象を絞り込めます。

```
Execution  Profile  36ca4f8b97834449-acae910fbee8c670:(ExecTime:  48sec201ms)
    Fragments:
        Fragment  0:
            Fragment  Level  Profile:    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):(ExecTime:  48sec111ms)
            Pipeline  :1    (host=TNetworkAddress(hostname:10.16.10.8,  port:9013)):
                PipelineTask  (index=80):(ExecTime:  6sec267ms)
                DATA_STREAM_SINK_OPERATOR  (id=17,dst_id=17):(ExecTime:  1.634ms)
                -  MemoryUsage:  
                    -  PeakMemoryUsage:  1.50  KB
                STREAMING_AGGREGATION_OPERATOR  (id=16  ,  nereids_id=1526):(ExecTime:  41.269ms)
                    -  MemoryUsage:  
                        -  HashTable:  168.00  B
                        -  PeakMemoryUsage:  404.16  KB
                        -  SerializeKeyArena:  404.00  KB
                HASH_JOIN_OPERATOR  (id=15  ,  nereids_id=1520):(ExecTime:  6sec150ms)
                        -  MemoryUsage:  
                            -  PeakMemoryUsage:  3.22  KB
                            -  ProbeKeyArena:  3.22  KB
                    LOCAL_EXCHANGE_OPERATOR  (PASSTHROUGH)  (id=-12):(ExecTime:  67.950ms)
                            -  MemoryUsage:  
                                -  PeakMemoryUsage:  1.41  MB
```

2. `HASH_JOIN_SINK_OPERATOR` のメモリ使用量が多すぎる場合

```
HASH_JOIN_SINK_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  1min14sec)
    -  JoinType:  INNER_JOIN
    -  BroadcastJoin:  true
    -  BuildRows:  600.030257M  (600030257)
    -  InputRows:  600.030256M  (600030256)
    -  MemoryUsage:  
        -  BuildBlocks:  15.65  GB
        -  BuildKeyArena:  0.00  
        -  HashTable:  6.24  GB
        -  PeakMemoryUsage:  21.89 GB
```

この例では、Hash Join の Build フェーズで、主に `BuildBlocks` と `HashTable` がメモリを使用していることがわかります。Hash Join の Build フェーズでメモリを使いすぎる場合は、まず Join Reorder による順序が妥当かを確認します。通常、Hash Join の Build 側に小さいテーブル、Probe 側に大きいテーブルを使用するのが適切です。これにより、Hash Join 全体のメモリ使用量を最小限に抑えることができ、通常はパフォーマンスも向上します。

Join Reorder による順序が妥当かを確認するために、`HASH_JOIN_OPERATOR`（id=12）の Profile を調べます。`ProbeRows` が 196240 行しかないことがわかります。したがって、この Hash Join Reorder では左右のテーブルを入れ替えるのが正しい順序です。`set disable_join_reorder=true` で Join Reorder を無効にし、左右のテーブルの順序を手動で指定してから、クエリを実行して検証できます。詳細については、クエリオプティマイザの Join Reorder に関するドキュメントを参照してください。

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```

## Heap Profile を使用したクエリのメモリ使用量の分析

上記の Query Profile ではメモリ使用箇所を正確に特定できず、クラスタを容易に再起動できて問題を再現できる場合は、[Heap Profile によるメモリ分析](./heap-profile-memory-analysis.md)を参照してクエリのメモリ使用量を分析します。

クエリ実行前に Heap Profile を一度ダンプし、クエリ実行中にもう一度ダンプします。`jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2` を使用して二つの Heap Profile のメモリ使用量の変化を比較すると、クエリ実行中にコード内の各関数が占めるメモリ使用量の割合を確認できます。コードと照らし合わせてメモリ使用箇所を特定してください。クエリ実行中はメモリ使用量がリアルタイムで変化するため、実行中に Heap Profile を複数回ダンプし、比較して分析する必要がある場合があります。
