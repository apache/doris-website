---
{
  "title": "クエリメモリ解析",
  "language": "ja",
  "description": "通常、まずQuery Profileを使用してクエリのメモリ使用量を分析します。"
}
---
通常、まずQuery Profileを使用してクエリのメモリ使用量を分析します。Query Profileでカウントされた各オペレータのメモリの合計が、Query Memory Trackerでカウントされたメモリよりもはるかに小さい場合、Query Profileでカウントされたオペレータのメモリが実際に使用されたメモリと大きく異なることを意味します。その場合、さらなる分析のためにHeap Profileを使用する必要があることがよくあります。Queryがメモリ制限の超過によりキャンセルされ、完了できない場合、Query Profileは不完全で正確に分析できない可能性があります。通常、クエリのメモリ使用量を分析するために直接Heap Profileを使用します。

## Query Memory View

どこかで`Label=query, Type=overview`のMemory Trackerの値が大きい場合、クエリのメモリ使用量が高いことを意味します。

```
MemTrackerLimiter Label=query, Type=overview, Limit=-1.00 B(-1 B), Used=83.32 MB(87369024 B), Peak=88.33 MB(92616000 B)
```
分析対象のクエリが既に分かっている場合は、このセクションをスキップして以下の分析に進んでください。そうでない場合は、以下の方法を参照して大容量メモリクエリを特定してください。

まず大容量メモリクエリのQueryIDを特定します。BEのWebページ `http://{be_host}:{be_web_server_port}/mem_tracker?type=query` で、`Current Consumption`でソートしてリアルタイムの大容量メモリクエリを確認できます。`label`内でQueryIDを見つけることができます。

エラープロセスメモリが制限を超えるか利用可能メモリが不足した場合、`be.INFO`ログの`Memory Tracker Summary`の下部に、メモリ使用量が最も多い上位10タスク（query/load/compaction等）のMemory Trackerが含まれます。形式は`MemTrackerLimiter Label=Query#Id=xxx, Type=query`です。通常、大容量メモリクエリのQueryIDは上位10タスク内で特定できます。

履歴クエリのメモリ統計は、`fe/log/fe.audit.log`の各クエリの`peakMemoryBytes`で確認するか、`be/log/be.INFO`で`Deregister query/load memory tracker, queryId`を検索して単一BE上の各クエリのピークメモリを確認できます。

## Query Profileを使用してクエリメモリ使用量を分析する

QueryIDに基づいて`fe/log/fe.audit.log`でSQLを含むクエリ情報を見つけ、`explain SQL`でクエリプランを取得し、`set enable_profile=true`後にSQLを実行してQuery Profileを取得します。Query Profileの詳細な紹介については、ドキュメント[Query Profile](../../../../query-acceleration/performance-tuning-overview/analysis-tools#doris-profile)を参照してください。ここではQuery Profile内のメモリ関連コンテンツのみを紹介し、それに基づいて大量のメモリを使用するOperatorとデータ構造を特定します。

1. 大量のメモリを使用するOperatorまたはメモリデータ構造を特定する

Query Profileは2つの部分に分かれています：

- `MergedProfile`

MergedProfileはQueryの全Instance Profileの集約結果で、全Instance上の各Fragmentの各Pipeline内の各Operatorのメモリ使用量のsum、avg、max、minを表示します。これにはOperatorのピークメモリ`PeakMemoryUsage`と、`HashTable`や`Arena`などの主要なメモリデータ構造のピークメモリが含まれます。これに基づいて、大量のメモリを使用するOperatorとデータ構造を特定できます。

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
- `Execution Profile`

`Execution Profile`は、Queryの各特定のInstance Profileの結果です。通常、`MergedProfile`に基づいて多くのメモリを使用するOperatorとデータ構造を特定した後、`explain SQL`後のクエリプランに基づいてそれらのメモリ使用量の原因を分析できます。特定のシナリオで特定のBEノードまたは特定のInstanceのQueryのメモリ値を分析する必要がある場合は、`Execution Profile`に基づいてさらに特定できます。

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
2. `HASH_JOIN_SINK_OPERATOR`がメモリを過度に消費している

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
Hash Joinのビルドフェーズにおける`BuildBlocks`と`HashTable`は主にメモリを使用することがわかります。通常、Hash Joinのビルドフェーズは過度にメモリを使用します。まず、Join Reorderの順序が適切かどうかを確認してください。通常、正しい順序は小さなテーブルをHash Join Buildに使用し、大きなテーブルをHash Join Probeに使用することです。これによりHash Joinの全体的なメモリ使用量を最小化でき、通常はより良いパフォーマンスを得られます。

Join Reorderの順序が適切かどうかを確認するために、id=12の`HASH_JOIN_OPERATOR`のprofileを確認します。`ProbeRows`がわずか196240行しかないことがわかります。そのため、このHash Join Reorderの正しい順序は、左テーブルと右テーブルの位置を入れ替えることです。`set disable_join_reorder=true`を設定してJoin Reorderを無効にし、左テーブルと右テーブルの順序を手動で指定してからQueryの検証を実行できます。詳細については、クエリオプティマイザーのJoin Reorderに関する関連ドキュメントを参照してください。

```
HASH_JOIN_OPERATOR  (id=12  ,  nereids_id=1304):(ExecTime:  8sec223ms)
    -  BlocksProduced:  227
    -  MemoryUsage:  
        -  PeakMemoryUsage:  0.00  
        -  ProbeKeyArena:  0.00  
    -  ProbeRows:  196.24K  (196240)
    -  RowsProduced:  786.22K  (786220)
```
## Heap Profileを使用してクエリメモリ使用量を分析する

上記のクエリプロファイルでメモリ使用場所を正確に特定できない場合、クラスターを簡単に再起動でき、現象を再現できるなら、[Heap Profile Memory Analysis](./heap-profile-memory-analysis.md)を参照してクエリメモリを分析してください。

クエリ実行前にHeap Profileを一度dumpし、クエリ実行中に再度Heap Profileをdumpします。`jeprof --dot lib/doris_be --base=heap_dump_file_1 heap_dump_file_2`を使用して2つのHeap Profile間のメモリ変化を比較することで、クエリ実行中のコード内各関数のメモリ使用率を取得できます。コードと比較してメモリ使用場所を特定します。クエリ実行中はメモリがリアルタイムで変化するため、クエリ実行中に複数回Heap Profileをdumpし、比較分析する必要がある場合があります。
