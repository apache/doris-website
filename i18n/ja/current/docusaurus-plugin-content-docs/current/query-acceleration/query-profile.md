---
{
  "title": "クエリプロファイル分析",
  "language": "ja",
  "description": "Apache DorisはQuery Profileを提供してクエリ実行の詳細を公開します。この記事では、以下を含む全体的なアーキテクチャと実践的なガイダンスを扱います："
}
---
# 概要

Apache DorisはQuery Profileを提供してクエリ実行の詳細を公開します。この記事では、全体的なアーキテクチャと実用的なガイダンスを扱います：
- 収集ワークフロー：ProfileがBackendから収集されFrontendに格納される方法。
- 収集関連パラメータ：ノイズをフィルタリングし、重要なクエリ詳細に焦点を当てるための設定方法。
- 読み取り方法：パフォーマンスに影響を与えるオペレータを迅速に特定する方法。

# Query Profileアーキテクチャ
![alt text](/images/profile/profile-image-0.png)

コアはFEの`ProfileManager`とBEの`AsyncReportThreadPool`で構成されています。
1. クエリが開始されると、FEはProfile関連のデータ構造を`ProfileManager`に登録します。
2. BEクエリが終了した後、ProfileをFEへの非同期レポートスレッドプールにタスクとして登録します。
3. BE `AsyncReportThreadPool`はクエリごとにRPC経由でProfileデータをFEに送信します。
4. FEバックグラウンドスレッドは収集されたProfileを処理・管理し、保持と削除を決定し、適切なProfileを圧縮して永続化します。
5. ユーザーはWeb UIまたはcurl経由でProfileを表示します。
6. `ProfileManager`はメモリまたは外部ストレージからProfileを取得し、テキストとして返します。

非同期レポートと永続化がProfileの動作に最も大きな影響を与えます。

高負荷下では、非同期レポートがタイムアウトする可能性があります。FEでの過度なメモリ使用を避けるため、`ProfileManager`は少し待機した後、タイムアウトしたProfileを破棄します。`fe.conf`で`profile_async_collect_expire_time_secs`を調整できます。タイムアウトが頻繁な場合は、まずリソース使用量を確認してください。グローバルProfileをオフにする方が安全な場合があります。

Profileをディスクに永続化することで以下が保証されます：
1. ProfileがFEメモリを占有しなくなります。
2. FE再起動後もProfileがクエリ可能のままです。

これにより、FEは数千の完全なProfileを保持でき、アップグレード前後の比較を行ってパフォーマンス改善を検証することが容易になります。

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
デフォルト: 1. **4.0およびmasterブランチで有効です。4.0より前のバージョンでは、このパラメータを使用しないでください。以前のバージョンでは異なるセマンティクスを持ちます。**

デフォルトでは、BEは簡潔なProfile（FEがMergedProfileを構築するのに十分）を報告します。最小限の影響でより詳細な情報を得るには、`profile_level=2`を設定してください。最大値は3です。レベル3では、一部のカウンターの収集がパフォーマンスに影響を与える可能性があります。

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
`profile_level=2`では、より多くのカウンターが表示されます：

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

Profileをグローバルに有効にすると大量のエントリが生成され、FEのCPU/メモリ/ディスクを消費し、レイテンシに敏感な小さなクエリに影響を与える可能性があるため、FEは定期的にProfileをクリーンアップします。遅いクエリのProfileを失うことを避けるために、このパラメータを使用して、クエリ時間がしきい値を超えた場合にのみProfileを生成・保持します。`-1`はすべてのクエリに対してProfileを生成することを意味します。

例: グローバルなProfileが有効な場合、すべてのクエリがProfileを生成します。些細なクエリをスキップするためのしきい値を設定します:

```sql
mysql> clean all profile;
mysql> set global auto_profile_threshold_ms=1000;
...
mysql> show query profile;

Empty set (0.00 sec)
```
## Profile Storage の設定
Doris は FE ローカルディスク上に Profile を永続化して、より多くのレコードを保持できます。`fe.conf` で設定します：
### max_query_profile_num
デフォルト: 500。FE メモリに保持される最大 Profile 数。超過分は最も古いものから削除されます。
### max_spilled_profile_num
デフォルト: 500。ディスクに保存される最大 Profile 数。超過分は最も古いものから削除されます。
### spilled_profile_storage_path
Profile 用のローカルディレクトリ。デフォルト: `log/profile`。
### spilled_profile_storage_limit_bytes
デフォルト: 1 GB。Profile が占有する最大総ディスク容量。

## Profile の取得
### FE Web UI 経由
FE の `ip:http_port` にアクセスしてログインします。QueryProfile を開いて現在の FE 上のすべての Profile を表示し、Profile ID をクリックして詳細を確認します。
注意事項：
- Profile は SQL を実行した FE にのみ存在し、FE 間で同期されません。クエリで使用された FE に接続してください。
- Import ジョブは実行のために FE Master に転送されるため、それらの Profile は Master FE から取得する必要があります。

![alt text](/images/profile/profile-image-1.png)

### コマンドライン経由
FE Web UI が利用できない場合（例：セキュリティ制約）、CLI を使用します。まず、`show query profile` で最新の 20 個の profile を一覧表示します。

```sql
mysql> show query profile;
...
```
HTTP API を使用して特定の Profile を取得します。例えば、ID `f7efdc4c092d4b14-95e0f7f7783974d3` の場合：

```bash
curl -uroot: http://127.0.0.1:5937/api/profile/text?query_id=f7efdc4c092d4b14-95e0f7f7783974d3 > f7efdc4c092d4b14-95e0f7f7783974d3.profile
```
結果はWeb UIと一致します：

```bash
> head f7efdc4c092d4b14-95e0f7f7783974d3.profile -n 10
Summary:
   - Profile ID: f7efdc4c092d4b14-95e0f7f7783974d3
   - Task Type: QUERY
   - Start Time: 2025-02-26 19:31:27
   - End Time: 2025-02-26 19:32:41
   - Total: 1min14sec
   - Task State: OK
   - User: root
   - Default Catalog: internal
   - Default Db: tpch
```
### ディスクから直接
3.0以降、Profilesは永続化できます。デフォルトディレクトリ: `log/profile`。高速表示のために、対象ファイルを解凍してテキスト出力を取得してください。注意事項:
1. Doris FEが`log/profile`を保護します。解凍された出力をその中に保存しないでください。削除されます。
2. テキスト形式はWeb UIと若干異なります: `Summary`はJSONメタとして保存され、残りはWeb UIと一致します。

```bash
unzip profile/1740745121714_33bf38e988ea4945-b585d2f74d1da3fd.zip
head 33bf38e988ea4945-b585d2f74d1da3fd.profile -n 10
```
## プロファイル構造
プロファイルコンテンツは以下で構成されます：
1. Summary
`SummaryProfile`はメタデータであり、`Profile ID`、`Total`などの検索用の主要フィールドを記録します。

```text
-  Profile  ID:  d4d281168bf7490a-a133623295744f85
-  Task  Type:  QUERY
-  Start  Time:  2025-02-28  19:23:14
-  End  Time:  2025-02-28  19:23:16
-  Total:  2sec420ms
-  Task  State:  OK
```
2. ExecutionSummary
実行の要約。Plan関連のフィールドはPlannerの時間を記録します。
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

Dorisは計画においてQuery → Fragment → PlanNodeの階層を持っており、executorはPipelineによってスケジューリングし、各PipelineはOperatorから構成されています。MergedProfileはplanからPipelineへの変換を明確に示します。以下の例では、planとPipelineを再構築する方法を示しています。
- ボトルネックoperatorの迅速な特定。

MergedProfileの`DependencyWaitTime`を使用して最も時間のかかるoperatorを見つけ、その後DetailProfileでその詳細を調査します。
- データスキューの比較。

`InputRows`と`RowsProduced`を比較することで、Backend間でデータが不均等かどうかを判断できます。これはしばしば低速または失敗したクエリの原因となります。

5. DetailProfile

詳細な実行情報。DetailProfileは、各FragmentとPipelineについて、Backend全体での`PipelineTask`実行を記録します。MergedProfileでボトルネックを特定した後、深い分析にはDetailProfileを使用します。

## 例：Profileの読み方
TPCHデータセットでAggregation、Join、Scanを含む典型的なクエリを考えてみます：`customer`と`orders`をjoinしてからaggregateします。

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
プロファイルを簡潔に保つため、並列処理を制限してください：

```sql
set parallel_pipeline_task_num=2;
```
Web UIを通じてProfileを実行・取得した後、MergedProfileに注目してください。簡潔にするため、主要なフィールドのみを表示しています：

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
上記は整理されたMergedProfileです。Dorisのクエリプランニングには3つのレベル構造があります：Query → Fragment → PlanNodeで、一方BEの実行エンジンではPipeline → Operatorがさらに導入されています。

### Query & Fragment & PlanNode
![alt text](/images/profile/profile-image-2.png)

矢印はデータフローを示しています。全体のクエリプランは4つのFragment（左側のブロック）と複数のPlanNode（同じ水平線上のFragmentとそのPlanNode）に分割されています。PlanNodeには`customer`と`orders`を読み込む2つのSCAN_NODE、Fragment間のデータ転送のための複数のDATA_STREAM_SINKとEXCHANGEノード、スキャンされたデータを結合するHASH_JOIN、そして2段階の集約（AGGREGATIONとAGGREGATION(MERGE)）が含まれています。RESULT_SINKはFEに結果を返し、その前にTOP-Nが行数を制限します。

### Pipeline & Operator

QueryPlanはどのようにPipelineとOperatorに変換されるのでしょうか？Fragment 1と2（AGGREGATIONとHASH_JOINを含む）を例に取りましょう。

![alt text](/images/profile/profile-image-3.png)

実行時、DorisはあるPlanNodeを1つ以上のOperatorに分割します。

- DATA_STREAM_SINKはDATA_STREAM_SINK_OPERATORになり、Fragmentからデータを出力します。これにはOperatorIdがなく、宛先OperatorIdのみがあります；`dest_id=5`は`EXCHANGE_OPERATOR(id=5)`にデータを送信することを意味します。
- `PlanNodeId=3`を持つHASH_JOINは、HASH_JOIN_SINK_OPERATORとHASH_JOIN_OPERATORになり、両方ともOperator Id 3（PlanNodeIdと同じ）を持ちます。
- Phase-1のAGGREGATIONとPhase-2のAGGREGATION(MERGE)は、それぞれSINKとSOURCEオペレータのペアに分割されます。

OperatorはPipelineにリンクされます。Fragment 1と2はそれぞれ3つのPipelineを持ちます。Pipeline内のOperatorはブロッキングなしでデータをストリーミングしますが、Pipelineを接続するOperatorは論理的依存関係（例：ProbeはBuildがハッシュテーブル構築を完了するまで待機）やシステム制約（例：EXCHANGE_OPERATORがDATA_STREAM_SINK_OPERATORからのネットワークデータを待機）によりブロックします。

ノンブロッキングオペレータをPipelineでまとめてスケジューリングすることで、リソース使用率とキャッシュ局所性が向上します。

### CommonCounters & CustomCounters
CommonCountersはDorisのすべてのOperatorに必須です：

- ExecTime：現在のOperatorで費やされた時間（上流時間を除く）。
- RowsProduced（非Sink）：Operatorによって出力された行数。
- InputRows（Sink）：sinkによって消費された行数。
- MemoryUsage & MemoryUsagePeak：現在のメモリ使用量とピークメモリ使用量。
- WaitForDependency：依存関係を待機する時間。

CustomCountersはOperator固有です。各カウンタの詳細については、Operatorプロファイルのドキュメントを参照してください。

### HashJoin
基本が確立されたので、MergedProfileを通じてJoin実行を再構築しましょう。

![alt text](/images/profile/profile-image-4.png)

並列度は2に設定されたため、図ではPipeline 1とPipeline 2の接続されたペアが1つ表示されていますが、実際には4つのPipelineTaskが実行されます（パイプラインごとに2つ）。

```
Pipeline 0(instance_num=2)
```
`instance_num`は全てのBE間でのPipelineTaskの総数と等しくなります。1つのBEで`parallel_pipeline_task_num=2`の場合、`instance_num=2`となります。

Pipeline 2では、2つのPipelineTaskが1500万行を処理してハッシュテーブルを構築し、平均構築時間は445.146ミリ秒でした。Pipeline 1はPipeline 2のハッシュ構築完了に依存しており、この待機は`WaitForDependency`として表示され、平均949.860ミリ秒でした。なぜ待機時間が構築時間より長いのでしょうか？この場合、FEがBROADCAST_JOINを計画し、2つのPipelineTaskのうち実際に構築を実行するのは1つだけです：

```
HASH_JOIN_SINK_OPERATOR(nereids_id=418)(id=3):
 CommonCounters:
    - ExecTime: avg 445.146ms, max 890.258ms, min 34.635us
    - InputRows: sum 15.0M (15000000), avg 7.5M (7500000), max 15.0M (15000000), min 0
    - WaitForDependency[HASH_JOIN_SINK_OPERATOR_DEPENDENCY]Time: avg 482.355ms, max 964.711ms, min 0ns
 CustomCounters:
    - MemoryUsageHashTable: sum 185.22 MB, avg 92.61 MB, max 185.22 MB, min 0.00 
```
MergedProfileから、parallelism=2にも関わらず、一つのPipelineTaskが890.258ミリ秒かかった一方で、もう一つは34.635マイクロ秒かかり0行を処理した—これは一つのタスクのみがハッシュを構築したことを示しており、以下を説明している：

```
WaitForDependency[HASH_JOIN_OPERATOR_DEPENDENCY]Time: avg 949.860ms, max 962.978ms, min 936.743ms
```
HASH_JOIN_OPERATORの続き: 約949.860msの待機後、Probeが開始されます。2つのOLAP_SCAN_OPERATOR(id=2)が1億5000万行を読み取り、すべての行がAGGREGATION_SINK_OPERATORに送られ、ハッシュテーブルを構築して集約を継続します。

### 集約

クエリは次の項目を集約します: Count(o.o_orderkey) AS total_orders、Sum(o.o_totalprice) AS total_spent、およびGROUP BY c.c_name。

![alt text](/images/profile/profile-image-5.png)

Dorisはここで2段階集約を使用します。

第1段階: `id=4`のAGGREGATIONペア。AGGREGATION_SINK_OPERATOR(id=4)が1億5000万行を処理し、GROUP BYキーでハッシュテーブルを構築し、AggregationDataを更新します。

第1段階の後、AggregationDataはEXCHANGE経由で第2段階に送信されます。異なるPipelineTaskが同じGROUP BYキーを処理する可能性があるため、EXCHANGEは`name`でパーティション分割し、同一のキーが同じ第2段階operatorに到達するようにします。

AGGREGATION_OPERATOR(id=4)は40行を出力します。これは第1段階のハッシュテーブルが40エントリを持つことを意味します。第2段階のAGGREGATION_SINK_OPERATOR(id=6)は第1段階の結果をAggregationDataに逆シリアル化してマージし、AGGREGATION_OPERATOR(id=6)がTOP-Nに送ります。LIMIT 20により、TOP-Nは20行を収集した後に早期停止します。

全体的に、最も遅いoperatorはHASH_JOIN_OPERATOR(id=3)です。これをMergedProfileで特定した後、詳細なカウンターについてはDetailProfileを確認してください。定義についてはoperatorのドキュメントを参照してください。
