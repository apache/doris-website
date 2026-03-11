---
{
  "title": "クエリプロファイル分析",
  "description": "Apache Dorisは、クエリ実行の詳細を公開するためにQuery Profileを提供します。この記事では、全体的なアーキテクチャと実践的なガイダンスについて説明します。これには以下が含まれます：",
  "language": "ja"
}
---
# 概要

Apache DorisはQuery Profileを提供してクエリ実行の詳細を公開します。本記事では、全体的なアーキテクチャと実践的なガイダンスについて説明します。以下の内容が含まれます：
- 収集ワークフロー：ProfileがBackendsから収集され、Frontendに格納される方法。
- 収集関連パラメータ：ノイズをフィルタリングし、重要なクエリ詳細に焦点を当てるための設定方法。
- 読み取り方法：パフォーマンスに影響を与えるオペレータを素早く特定する方法。

# Query Profileアーキテクチャ
![alt text](/images/profile/profile-image-0.png)

コア部分はFEの`ProfileManager`とBEの`AsyncReportThreadPool`で構成されています。
1. クエリが開始されると、FEはProfile関連のデータ構造を`ProfileManager`に登録します。
2. BEクエリが完了した後、そのProfileをFEへの非同期レポートスレッドプールにタスクとして登録します。
3. BE `AsyncReportThreadPool`は、クエリごとにRPC経由でProfileデータをFEに送信します。
4. FEのバックグラウンドスレッドが収集されたProfileを処理・管理し、保持と削除を決定し、適切なProfileを圧縮して永続化します。
5. ユーザーはWeb UIまたはcurl経由でProfileを表示します。
6. `ProfileManager`はメモリまたは外部ストレージからProfileを取得し、テキストとして返します。

非同期レポートと永続化は、Profileの動作に最も大きな影響を与えます。

高負荷状態では、非同期レポートがタイムアウトする場合があります。FEでの過度なメモリ使用を避けるため、`ProfileManager`はしばらく待機した後、タイムアウトしたProfileを破棄します。`fe.conf`の`profile_async_collect_expire_time_secs`で調整可能です。タイムアウトが頻繁に発生する場合は、まずリソース使用状況を確認し、グローバルProfileをオフにする方が安全かもしれません。

Profileをディスクに永続化することで以下が保証されます：
1. Profileが FEメモリを占有しなくなります。
2. FE再起動後もProfileがクエリ可能な状態を維持します。

これにより、FEは数千の完全なProfileを保持でき、アップグレード前後の比較を行ってパフォーマンス向上を検証することが容易になります。

# Profileの設定
## Profileの有効化
### enable_profile
falseの場合、Profileは生成されません。デフォルト：false。

```sql
mysql> select 1;
...
mysql> show query profile;
...
```
### profile_level
デフォルト: 1. **4.0およびmasterブランチで有効。4.0以前のバージョンではこのパラメータを使用しないでください。以前のバージョンでは異なるセマンティクスを持ちます。**

デフォルトでは、BEは簡潔なProfile（FEがMergedProfileを構築するのに十分）を報告します。最小限の影響でより詳細な情報を得るには、`profile_level=2`を設定してください。最大値は3です。レベル3では、一部のカウンターの収集がパフォーマンスに影響する可能性があります。

例: デフォルトの`EXCHANGE_OPERATOR`カウンター:

```
EXCHANGE_OPERATOR(id=1):
     - InstanceID: ef33b72e30b84b68-82ad027edbee5910
     - BlocksProduced: 1
     - CloseTime: 4.243us
     - ExecTime: 30.834us
     - InitTime: 20.902us
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.93us
     - ProjectionTime: 0ns
     - RowsProduced: 10
     - WaitForDependencyTime: 0ns
       - WaitForData0: 635.324us
```
`profile_level=2`では、より多くのカウンターが表示されます:

```
EXCHANGE_OPERATOR(id=1):
     - InstanceID: 514023de1b7b41a3-9e59e43c591103a2
     - BlocksProduced: 1
     - CloseTime: 3.523us
     - CreateMergerTime: 0ns
     - DataArrivalWaitTime: 0ns
     - DecompressBytes: 0.00 
     - DecompressTime: 0ns
     - DeserializeRowBatchTimer: 0ns
     - ExecTime: 28.439us
     - FilterTime: 287ns
     - FirstBatchArrivalWaitTime: 0ns
     - GetDataFromRecvrTime: 3.482us
     - InitTime: 18.258us
     - LocalBytesReceived: 36.00 KB
     - MaxFindRecvrTime(NS): 0
     - MaxWaitForWorkerTime: 0
     - MaxWaitToProcessTime: 0
     - MemoryUsage: 0.00 
     - MemoryUsagePeak: 36.00 KB
     - OpenTime: 1.44us
     - ProjectionTime: 0ns
     - RemoteBytesReceived: 0.00 
     - RowsProduced: 10
     - SendersBlockedTotalTimer(*): 0ns
     - WaitForDependencyTime: 0ns
       - WaitForData0: 596.708us
```
### auto_profile_threshold_ms
デフォルト: -1。3.0から有効。

Profileをグローバルに有効にすると大量のエントリが生成され、FEのCPU/メモリ/ディスクを消費し、レイテンシに敏感な小さなクエリに影響を与える可能性があるため、FEは定期的にProfileをクリーンアップします。低速クエリのProfileを失うことを避けるために、このパラメータを使用して、クエリ時間がしきい値を超えた場合にのみProfileを生成および保持します。`-1`はすべてのクエリに対してProfileを生成することを意味します。

例: グローバルProfileがオンの場合、すべてのクエリでProfileが生成されます。しきい値を設定して重要でないものをスキップします:

```sql
mysql> clean all profile;
mysql> set global auto_profile_threshold_ms=1000;
...
mysql> show query profile;

Empty set (0.00 sec)
```
## Profile ストレージの設定
Doris は FE ローカルディスク上に Profile を永続化して、より多くのレコードを保持できます。`fe.conf` で設定します：
### max_query_profile_num
デフォルト：500。FE メモリに保持される最大 Profile 数。超過分は古いものから削除されます。
### max_spilled_profile_num
デフォルト：500。ディスクに保存される最大 Profile 数。超過分は古いものから削除されます。
### spilled_profile_storage_path
Profile のローカルディレクトリ。デフォルト：`log/profile`。
### spilled_profile_storage_limit_bytes
デフォルト：1 GB。Profile が占有する最大ディスク容量の合計。

## Profile の取得
### FE Web UI 経由
FE の `ip:http_port` にアクセスしてログインします。QueryProfile を開いて現在の FE 上のすべての Profile を表示し、Profile ID をクリックして詳細を確認します。
注意：
- Profile は SQL を実行した FE にのみ存在し、FE 間で同期されません。クエリで使用された FE に接続してください。
- Import ジョブは実行のために FE Master に転送されるため、それらの Profile は Master FE から取得する必要があります。

![alt text](/images/profile/profile-image-1.png)

### コマンドライン経由
FE Web UI が利用できない場合（例：セキュリティ制約）、CLI を使用します。まず、`show query profile` で最新の 20 個の Profile をリストします。

```sql
mysql> show query profile;
...
```
HTTP API経由で特定のProfileを取得します。例：ID `f7efdc4c092d4b14-95e0f7f7783974d3`：

```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```
結果はWeb UIと一致します：

```bash
> head f7efdc4c092d4b14-95e0f7f7783974d3.profile -n 10
要約:
   - Profile ID: f7efdc4c092d4b14-95e0f7f7783974d3
   - Task タイプ: QUERY
   - Start Time: 2025-02-26 19:31:27
   - End Time: 2025-02-26 19:32:41
   - Total: 1min14sec
   - Task State: OK
   - User: root
   - Default カタログ: internal
   - Default Db: tpch
```
### ディスクから直接
3.0以降、Profilesを永続化できます。デフォルトディレクトリ：`log/profile`。より高速な表示のため、対象ファイルを解凍してテキスト出力を取得してください。注意事項：
1. Doris FEは`log/profile`を保護します。解凍した出力をその中に保持しないでください。削除される可能性があります。
2. テキスト形式はWeb UIと若干異なります：`要約`はJSONメタとして保存され、残りはWeb UIと一致します。

```bash
unzip profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
head 33bf38e988ea4945-b585d2f74d1da3fd.profile -n 10
```
## Profile Structure
Profileのコンテンツは以下で構成されます：
1. 要約
`SummaryProfile`はメタデータであり、`Profile ID`、`Total`などの検索用の主要フィールドを記録します。

```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  タイプ:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```
2. ExecutionSummary
実行の概要。Plan関連のフィールドはPlannerの時間を記録する。
3. ChangedSessionVariables
実行中に変更されたセッション変数。

```text
ChangedSessionVariables:
VarName                       | CurrentValue | DefaultValue
------------------------------|--------------|-------------
insert_visible_timeout_ms     | 10000        | 60000       
fetch_splits_max_wait_time_ms | 4000         | 1000        
exec_mem_limit                | 2147483648   | 100147483648
profile_level                 | 2            | 1           
auto_profile_threshold_ms     | 1            | -1          
```
4. MergedProfile
`DetailProfile`の集約。主な目的：
- クエリプランとPipeline構造の明確化。

Dorisは計画のためにQuery → Fragment → PlanNodeの階層構造を持っています。executorはPipelineによってスケジュールし、各PipelineはOperatorで構成されます。MergedProfileはplanからPipelineへの変換を明確に示します。以下の例では、planとPipelineの再構築方法を示しています。
- ボトルネックoperatorの迅速な特定。

MergedProfileの`DependencyWaitTime`を使用して最も時間のかかるoperatorを見つけ、その詳細をDetailProfileで調べます。
- データスキューの比較。

`InputRows`と`RowsProduced`を比較することで、Backend間でデータが不均等かどうかを判断できます。これはしばしば低速または失敗したクエリの原因となります。

5. DetailProfile

詳細な実行情報。DetailProfileは、各FragmentとPipelineについて、Backend全体での`PipelineTask`実行を記録します。MergedProfileでボトルネックを特定した後、詳細な分析にはDetailProfileを使用します。

## 例：Profileの読み方
TPCHデータセットでのAggregation、Join、Scanを含む典型的なクエリを考えてみましょう：`customer`と`orders`をjoinしてから集約します。

```sql
SELECT c.c_name,
       Count(o.o_orderkey) AS total_orders,
       Sum(o.o_totalprice) AS total_spent
FROM   customer c
       JOIN orders o
         ON c.c_custkey = o.o_custkey
GROUP  BY c.c_name
LIMIT  20 
```
Profileを簡潔に保つために、並列処理を制限します：

```sql
set parallel_pipeline_task_num=2;
```
WebUI経由でProfileを実行および取得した後、MergedProfileに注目してください。簡潔にするため、主要なフィールドのみを表示します：

```
MergedProfile:
     Fragments:
       Fragment 0:
         Pipeline 0(instance_num=1):
           RESULT_SINK_OPERATOR(id=0):
             CommonCounters:
                - ExecTime: avg 176.545us, max 176.545us, min 176.545us
                - InputRows: sum 20, avg 20, max 20, min 20
                - WaitForDependency[RESULT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
             CustomCounters:
           EXCHANGE_OPERATOR(id=8):
             CommonCounters:
                - ExecTime: avg 84.559us, max 84.559us, min 84.559us
                - RowsProduced: sum 20, avg 20, max 20, min 20
             CustomCounters:
                - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
                  - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 1:
         Pipeline 0(instance_num=2):
           DATA_STREAM_SINK_OPERATOR(dest_id=8):
            CommonCounters:
              - ExecTime: avg 31.515us, max 33.405us, min 29.626us
              - InputRows: sum 20, avg 10, max 11, min 9
              - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
               - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
            CustomCounters:
             - BlocksProduced: sum 2, avg 1, max 1, min 1
          SORT_OPERATOR(nereids_id=443)(id=7):
           CommonCounters:
             - ExecTime: avg 980ns, max 1.199us, min 762ns
             - RowsProduced: sum 20, avg 10, max 11, min 9
             - WaitForDependency[SORT_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
           CustomCounters:
        Pipeline 1(instance_num=2):
          SORT_SINK_OPERATOR(nereids_id=443)(id=7):
           CommonCounters:
             - ExecTime: avg 49.414us, max 54.802us, min 44.27us
             - InputRows: sum 20, avg 10, max 11, min 9
             - WaitForDependency[SORT_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
           CustomCounters:
          AGGREGATION_OPERATOR(nereids_id=438)(id=6):
           CommonCounters:
             - ExecTime: avg 34.521us, max 36.402us, min 32.640us
             - RowsProduced: sum 20, avg 10, max 11, min 9
             - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec450ms, max 11sec450ms, min 11sec450ms
           CustomCounters:
        Pipeline 2(instance_num=2):
          AGGREGATION_SINK_OPERATOR(nereids_id=438)(id=6):
           CommonCounters:
             - ExecTime: avg 109.89us, max 118.582us, min 99.596us
             - InputRows: sum 40, avg 20, max 22, min 18
             - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
           CustomCounters:
          EXCHANGE_OPERATOR(id=5):
           CommonCounters:
             - ExecTime: avg 29.741us, max 34.521us, min 24.962us
             - RowsProduced: sum 40, avg 20, max 22, min 18
           CustomCounters:
             - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
              - WaitForData0: avg 11sec450ms, max 11sec450ms, min 11sec450ms
       Fragment 2:
        Pipeline 0(instance_num=2):
          DATA_STREAM_SINK_OPERATOR(dest_id=5):
           CommonCounters:
             - ExecTime: avg 71.148us, max 73.242us, min 69.54us
             - InputRows: sum 40, avg 20, max 20, min 20
             - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
              - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
           CustomCounters:
          AGGREGATION_OPERATOR(nereids_id=428)(id=4):
           CommonCounters:
             - ExecTime: avg 350.431us, max 393.100us, min 307.762us
             - RowsProduced: sum 40, avg 20, max 20, min 20
             - WaitForDependency[AGGREGATION_OPERATOR_DEPENDENCY]Time: avg 11sec30ms, max 11sec450ms, min 10sec610ms
           CustomCounters:
        Pipeline 1(instance_num=2):
          AGGREGATION_SINK_OPERATOR(nereids_id=428)(id=4):
           CommonCounters:
             - ExecTime: avg 442.308ms, max 449.109ms, min 435.506ms
             - InputRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
             - MemoryUsage: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
             - MemoryUsagePeak: sum 2.05 MB, avg 1.03 MB, max 1.03 MB, min 1.03 MB
             - WaitForDependency[AGGREGATION_SINK_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
           CustomCounters:
             - MemoryUsageHashTable: sum 1.03 MB, avg 526.28 KB, max 526.28 KB, min 526.28 KB
             - MemoryUsageSerializeKeyArena: sum 1.02 MB, avg 524.00 KB, max 524.00 KB, min 524.00 KB
          HASH_JOIN_OPERATOR(nereids_id=418)(id=3):
           CommonCounters:
             - ExecTime: avg 9sec169ms, max 9sec582ms, min 8sec756ms
             - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
             - WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
           CustomCounters:
             - ProbeRows: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
          OLAP_SCAN_OPERATOR(nereids_id=397. table_name=orders(orders))(id=2):
           CommonCounters:
             - ExecTime: avg 396.233ms, max 410.306ms, min 382.160ms
             - RowsProduced: sum 150.0M (150000000), avg 75.0M (75000000), max 75.000001M (75000001), min 74.999999M (74999999)
           CustomCounters:
             - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 0ns, max 0ns, min 0ns
        Pipeline 2(instance_num=2):
          HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
           CommonCounters:
             - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
             - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
             - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
           CustomCounters:
             - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
          EXCHANGE_OPERATOR(id=1):
           CommonCounters:
             - ExecTime: avg 10.131ms, max 20.243ms, min 19.26us
             - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
           CustomCounters:
             - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
              - WaitForData0: avg 47.582ms, max 47.582ms, min 47.582ms
       Fragment 3:
        Pipeline 0(instance_num=2):
          DATA_STREAM_SINK_OPERATOR(dest_id=1):
           CommonCounters:
             - ExecTime: avg 3.269ms, max 3.281ms, min 3.258ms
             - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
             - WaitForDependencyTime: avg 0ns, max 0ns, min 0ns
              - WaitForLocalExchangeBuffer0: avg 142.859ms, max 285.713ms, min 6.733us
              - WaitForRpcBufferQueue: avg 0ns, max 0ns, min 0ns
           CustomCounters:
          OLAP_SCAN_OPERATOR(nereids_id=403. table_name=customer(customer))(id=0):
           CommonCounters:
             - ExecTime: avg 77.435ms, max 78.752ms, min 76.118ms
             - RowsProduced: sum 15.0M (15000000), avg 7.5M (7500000), max 7.500001M (7500001), min 7.499999M (7499999)
           CustomCounters:
             - WaitForDependency[OLAP_SCAN_OPERATOR_DEPENDENCY]Time: avg 49.690ms, max 50.522ms, min 48.858ms

```
上記はトリム済みのMergedProfileです。Dorisクエリプランニングは3レベル構造を持ちます：Query → Fragment → PlanNode、一方BEエグゼキューションエンジンはさらにPipeline → Operatorを導入します。

### Query & Fragment & PlanNode
![alt text](/images/profile/profile-image-2.png)

矢印はデータフローを示します。クエリプラン全体は4つのFragment（左側のブロック）と複数のPlanNode（Fragmentとその同一水平線上のPlanNode）に分割されます。PlanNodeには`customer`と`orders`を読み取る2つのSCAN_NODE、Fragment間のデータ転送用の複数のDATA_STREAM_SINKとEXCHANGEノード、スキャンしたデータを結合するHASH_JOIN、2段階集約（AGGREGATIONとAGGREGATION(MERGE)）が含まれます。RESULT_SINKは結果をFEに返し、その前に行を制限するTOP-Nがあります。

### Pipeline & Operator

QueryPlanはどのようにPipelineとOperatorに変換されるのでしょうか？Fragment 1とFragment 2（AGGREGATIONとHASH_JOINを含む）を例に取ります。

![alt text](/images/profile/profile-image-3.png)

実行中、DorisはいくつかのPlanNodeを1つ以上のOperatorに分割します。

- DATA_STREAM_SINKはDATA_STREAM_SINK_OPERATORになり、Fragmentからデータを出力します。OperatorIdを持たず、送信先OperatorIdのみ持ちます；`dest_id=5`は`EXCHANGE_OPERATOR(id=5)`にデータを送信することを意味します。
- `PlanNodeId=3`のHASH_JOINはHASH_JOIN_SINK_OPERATORとHASH_JOIN_OPERATORになり、両方ともOperator Id 3を持ちます（PlanNodeIdと同じ）。
- フェーズ1のAGGREGATIONとフェーズ2のAGGREGATION(MERGE)は、それぞれSINKとSOURCEのoperatorペアに分割されます。

OperatorはPipelineに接続されます。Fragment 1とFragment 2はそれぞれ3つのPipelineを持ちます。Pipeline内のOperatorはブロックすることなくデータをストリーミングします；Pipelineを接続するoperatorは論理的依存関係（例：ProbeはBuildのハッシュTable構築完了を待機）またはシステム制約（例：EXCHANGE_OPERATORがDATA_STREAM_SINK_OPERATORからのネットワークデータを待機）によりブロックします。

ブロックしないoperatorをPipelineで一緒にスケジューリングすることで、リソース使用率とキャッシュローカリティが向上します。

### CommonCounters & CustomCounters
CommonCountersはDorisの全Operatorで必須です：

- ExecTime：現在のoperatorで消費された時間（上流時間を除く）。
- RowsProduced（非Sink）：operatorが出力した行数。
- InputRows（Sink）：sinkが消費した行数。
- MemoryUsage & MemoryUsagePeak：現在と最大メモリ使用量。
- WaitForDependency：依存関係の待機に費やした時間。

CustomCountersはoperator固有です。各カウンタの詳細については、operatorプロファイルドキュメントを参照してください。

### HashJoin
基本が確立されたので、MergedProfileを使用してJoin実行を再構築します。

![alt text](/images/profile/profile-image-4.png)

並列度は2に設定されたため、図ではPipeline 1とPipeline 2の1つの接続ペアを示していますが、実際には4つのPipelineTaskが実行されます（パイプラインあたり2つ）。

```
Pipeline 0(instance_num=2)
```
`instance_num` は、すべてのBE全体でのPipelineTaskの総数に等しくなります。1つのBEで `parallel_pipeline_task_num=2` の場合、`instance_num=2` となります。

Pipeline 2では、2つのPipelineTaskが1500万行を処理してハッシュTableを構築しました。平均構築時間は445.146ミリ秒でした。Pipeline 1はPipeline 2のハッシュ構築完了に依存しており、この待機は `WaitForDependency` として表示され、平均949.860ミリ秒となります。なぜ待機時間が構築時間より長いのでしょうか。このケースでは、FEが BROADCAST_JOIN を計画し、2つのPipelineTaskのうち実際に構築を実行するのは1つだけです：

```
HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
 CommonCounters:
    - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
    - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
    - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
 CustomCounters:
    - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
```
MergedProfileから、parallelism=2にも関わらず、一つのPipelineTaskは890.258 msかかったのに対し、もう一つは34.635 usかかってゼロ行を処理しました。これは一つのタスクのみがハッシュを構築したことを示しており、以下のことを説明しています：

```
WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
```
HASH_JOIN_OPERATORの続き：約949.860msの待機後、Probeが開始されます。2つのOLAP_SCAN_OPERATOR(id=2)が150M行を読み取り、すべての行がAGGREGATION_SINK_OPERATORに送られ、ハッシュTableを構築して集約を継続します。

### Aggregation

クエリは次の集約を行います：Count(o.o_orderkey) AS total_orders、Sum(o.o_totalprice) AS total_spent、およびGROUP BY c.c_name。

![alt text](/images/profile/profile-image-5.png)

Dorisはここで2段階集約を使用します。

フェーズ1：`id=4`のAGGREGATIONペア。AGGREGATION_SINK_OPERATOR(id=4)が150M行を消費し、GROUP BYキーでハッシュTableを構築し、AggregationDataを更新します。

フェーズ1の後、AggregationDataはEXCHANGE経由でフェーズ2に送信されます。異なるPipelineTaskが同じGROUP BYキーを処理する可能性があるため、EXCHANGEは`name`でパーティション化し、同一キーが同じフェーズ2オペレータに到達するようにします。

AGGREGATION_OPERATOR(id=4)は40行を出力します。これは、フェーズ1ハッシュTableが40エントリを持つことを意味します。フェーズ2のAGGREGATION_SINK_OPERATOR(id=6)はフェーズ1の結果をAggregationDataにデシリアライズしてマージし、AGGREGATION_OPERATOR(id=6)がTOP-Nに送ります。LIMIT 20により、TOP-Nは20行を収集した後に早期停止します。

全体的に、最も遅いオペレータはHASH_JOIN_OPERATOR(id=3)です。MergedProfile経由でこれを特定した後、DetailProfileで詳細なカウンタを確認してください。定義についてはオペレータドキュメントを参照してください。
