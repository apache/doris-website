---
{
  "title": "ワークロード分析診断",
  "language": "ja",
  "description": "クラスターのワークロード分析は主に2つの段階に分かれています："
}
---
クラスターのワークロード分析は主に2つの段階に分かれています：
- 第1段階はランタイムワークロード分析で、クラスターの可用性が低下した際に、監視を通じて大幅なリソース消費を伴うクエリを特定し、適宜ダウングレードします。
- 第2段階は監査ログなどの履歴データを分析して、不適切なワークロードを特定し最適化します。

## ランタイムワークロード分析
監視を通じて検出されたクラスターの可用性低下時には、以下のプロセスに従うことができます：
1. まず、監視を使用して現在のクラスターのボトルネックを大まかに特定します。例えば、過度なメモリ使用量、高いCPU使用率、または高いIOなどです。すべてが高い場合は、メモリ問題の解決を優先することをお勧めします。
2. クラスターのボトルネックが特定されたら、workload_group_resource_usageテーブルを参照して、現在最もリソース使用量の高いGroupを見つけます。例えば、メモリボトルネックがある場合は、メモリ使用量が最も高い上位NのGroupsを特定できます。
3. 最もリソース使用量の高いGroupを特定した後、最初のステップとして、このGroupのクエリ同時実行数を削減することができます。この時点でクラスターリソースは既に逼迫しており、クラスターリソースを枯渇させないよう新しいクエリは避けるべきです。
4. 現在のGroupのクエリをダウングレードします。ボトルネックに応じて、異なるアプローチを取ることができます：
- CPUボトルネックの場合は、GroupのCPUをハード制限に設定し、cpu_hard_limitをより低い値に調整してCPUリソースを自発的に譲ることを検討します。
- IOボトルネックの場合は、read_bytes_per_secondパラメータを通じてGroupの最大IOを制限します。
- メモリボトルネックの場合は、Groupのメモリをハード制限に設定し、memory_limit値を下げて一部のメモリを解放します。これにより現在のGroup内で多数のクエリ失敗が発生する可能性があることに注意してください。
5. 上記の手順を完了した後、通常はクラスターの可用性がある程度回復します。この時点で、さらに分析を行い、このGroupでリソース使用量が増加した主な原因を特定できます。それがこのGroup全体のクエリ同時実行数の増加によるものか、特定の大きなクエリによるものかを判断します。特定の大きなクエリが原因の場合は、これらのクエリを迅速にkillしてクラスター機能を復元できます。
6. backend_active_tasksテーブルをactive_queriesと組み合わせて使用し、クラスター内で異常なリソース使用量を持つSQLクエリを特定し、kill文を使用してこれらのクエリをkillしてリソースを解放できます。

## 履歴データを通じたワークロード分析
現在、DorisのAudit Logには、SQL実行に関する簡潔な情報が保持されており、これを使用して過去に実行された不適切なクエリを特定し調整を行うことができます。具体的なプロセスは以下の通りです：
1. 監視を確認してクラスターの履歴リソース使用量を確認し、クラスターのボトルネックがCPU、メモリ、IOのいずれかを特定します。
2. クラスターのボトルネックが特定されたら、audit logsを参照して、対応する期間中に異常なリソース使用量を持つSQLクエリを見つけることができます。異常なSQLを定義する方法は2つあります：
   1. ユーザーがクラスター内のSQLのリソース使用量について特定の期待値を持っている場合、例えば大部分の遅延が秒単位で、スキャン行数が数千万行の場合、スキャン行数が数億行または数十億行のSQLクエリは異常と見なされ、手動介入が必要です。
   2. ユーザーがクラスター内のSQLリソース使用量について期待値を持たない場合は、パーセンタイル関数を使用してリソース使用量を計算し、異常なリソース使用量を持つSQLクエリを特定できます。CPUボトルネックを例に取ると、まず履歴期間のクエリCPU時間のtp50/tp75/tp99/tp999を計算し、これらの値を正常とします。これらを現在のクラスターの同じ期間のクエリCPU時間のパーセンタイル関数と比較します。例えば、履歴期間のtp999が1分だったが、現在のクラスターの同じ期間のtp50が既に1分の場合、履歴データと比較してCPU時間が1分を超えるSQLクエリが多数存在することを示します。そのため、CPU時間が1分より長いSQLクエリを異常と定義できます。同じロジックが他のメトリックにも適用されます。
3. 異常なリソース使用量を持つSQLクエリを最適化します。例えば、SQLの書き換え、テーブル構造の最適化、並列度の調整を行い、SQL クエリごとのリソース使用量を削減します。
4. audit logsでSQLリソース使用量が正常であることが判明した場合は、監視と監査を使用して、その時間に実行されたSQLクエリ数が履歴期間と比較して増加しているかを確認します。増加している場合は、対応する時間帯に上流のアクセストラフィックが増加したかどうかを上流のビジネスに確認し、クラスターをスケールするか、キューイングとレート制限を実装するかを決定します。


## よく使用されるSQL
:::tip
active_queriesテーブルはFEで実行されているクエリを記録し、backend_active_tasksテーブルはBEで実行されているクエリを記録することに注意してください。すべてのクエリが実行中にFEに登録されるわけではありません。例えば、stream loadはFEに登録されません。そのため、backend_active_tasksとactive_queries間でLEFT JOINを実行しても一致する結果が得られないのは正常です。

クエリがSELECTクエリの場合、active_queriesとbackend_active_tasksの両方に記録されるqueryIdは同じです。クエリがstream loadの場合、active_queriesテーブルのqueryIdは空で、backend_active_tasksのqueryIdはstream loadのIDになります。
:::

1. 現在のすべてのWorkload Groupを表示し、メモリ/CPU/I/O使用量の降順で表示します。

```
select be_id,workload_group_id,memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second 
   from workload_group_resource_usage
order by  memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second desc
```
2. CPU使用率TopN SQL。

    ```
    select 
            t1.query_id as be_query_id,
            t1.query_type,
            t2.query_id,
            t2.workload_group_id,
            t2.`database`,
            t1.cpu_time,
            t2.`sql`
    from
    (select query_id, query_type,sum(task_cpu_time_ms) as cpu_time from backend_active_tasks group by query_id, query_type) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id
    order by cpu_time desc limit 10;
    ```
3. メモリ使用量TopN Sql。

    ```
    select 
            t1.query_id as be_query_id,
            t1.query_type,
            t2.query_id,
            t2.workload_group_id,
            t1.mem_used
    from
    (select query_id, query_type, sum(current_used_memory_bytes) as mem_used from backend_active_tasks group by query_id, query_type) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by mem_used desc limit 10;
    ```
4. スキャンバイト/行数TopN Sql。

    ```
    select 
            t1.query_id as be_query_id,
            t1.query_type,
            t2.query_id,
            t2.workload_group_id,
            t1.scan_rows,
            t1.scan_bytes
    from
    (select query_id, query_type, sum(scan_rows) as scan_rows,sum(scan_bytes) as scan_bytes from backend_active_tasks group by query_id,query_type) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    order by scan_rows desc,scan_bytes desc limit 10;
    ```
5. ワークロードグループのスキャン行数/バイト数を表示する。

    ```
    select 
            t2.workload_group_id,
            sum(t1.scan_rows) as wg_scan_rows,
            sum(t1.scan_bytes) as wg_scan_bytes
    from
    (select query_id, sum(scan_rows) as scan_rows,sum(scan_bytes) as scan_bytes from backend_active_tasks group by query_id) 
            t1 left join active_queries t2
    on t1.query_id = t2.query_id 
    group by t2.workload_group_id
    order by wg_scan_rows desc,wg_scan_bytes desc
    ```
6. ワークロードグループのクエリキューの詳細を表示する。

    ```
    select 
             workload_group_id,
             query_id,
             query_status,
             now() - queue_start_time as queued_time
    from 
         active_queries
    where query_status='queued'
    order by workload_group_id
    ```
