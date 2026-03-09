---
{
  "title": "ワークロード解析診断",
  "language": "ja",
  "description": "クラスターのワークロード分析は主に2つの段階に分けられます："
}
---
クラスターのワークロード分析は主に2つの段階に分かれています：
- 第1段階はランタイムワークロード分析で、クラスターの可用性が低下した際に、モニタリングを通じてリソース消費の大きいクエリを特定し、それに応じてダウングレードを行います。
- 第2段階では、audit logsなどの履歴データを分析して、不適切なワークロードを特定し、最適化を行います。

## ランタイムワークロード分析
モニタリングによってクラスターの可用性が低下していることが検出された場合、以下のプロセスに従うことができます：
1. 最初に、モニタリングを使用して現在のクラスターのボトルネックを大まかに特定します。例えば、過度のメモリ使用量、高いCPU使用率、高いIOなどです。すべてが高い場合は、メモリ問題の対処を優先することが推奨されます。
2. クラスターのボトルネックが特定されたら、workload_group_resource_usageテーブルを参照して、現在のリソース使用量が最も高いGroupを見つけることができます。例えば、メモリボトルネックがある場合は、メモリ使用量が最も高い上位NのGroupを特定できます。
3. リソース使用量が最も高いGroupを特定した後、最初のステップはこのGroupのクエリ同時実行数を削減することです。この時点でクラスターリソースは既に逼迫しており、クラスターリソースを枯渇させることを防ぐために新しいクエリを避けるべきです。
4. 現在のGroupのクエリをダウングレードします。ボトルネックに応じて、異なるアプローチを取ることができます：
- CPUボトルネックの場合は、Groupのcpu_hard_limitを有効にし、cpu_hard_limitをより低い値に調整してCPUリソースを自発的に譲ることを検討してください。
- IOボトルネックの場合は、read_bytes_per_secondパラメータを通じてGroupの最大IOを制限してください。
- メモリボトルネックの場合は、Groupのmemory_limitをハード制限に設定し、memory_limit値を減らしてメモリを解放してください。これにより、現在のGroup内で多数のクエリ失敗が発生する可能性があることに注意してください。
5. 上記の手順を完了した後、通常クラスターの可用性はある程度回復します。この時点で、さらなる分析を行って、このGroupでリソース使用量が増加した主要な原因が、このGroup全体のクエリ同時実行数の増加によるものか、特定の大きなクエリによるものかを特定できます。特定の大きなクエリが原因の場合、これらのクエリを迅速にkillしてクラスター機能を復旧できます。
6. backend_active_tasksテーブルをactive_queriesと組み合わせて使用し、クラスター内で異常なリソース使用量を持つSQLクエリを特定し、killステートメントを使用してこれらのクエリをkillしてリソースを解放できます。

## 履歴データによるワークロード分析
現在、DorisのauditログはSQL実行に関する簡潔な情報を保持しており、これを使用して過去に実行された不適切なクエリを特定し、調整を行うことができます。具体的なプロセスは以下の通りです：
1. モニタリングを確認してクラスターの履歴リソース使用量を確認し、クラスターのボトルネックがCPU、メモリ、IOのいずれであるかを特定します。
2. クラスターのボトルネックが特定されたら、auditログを参照して、対応する期間中に異常なリソース使用量を持つSQLクエリを見つけることができます。異常なSQLを定義する方法は2つあります：
   1. ユーザーがクラスター内のSQLのリソース使用量について一定の期待値を持っている場合、例えば大部分の遅延が秒単位で、スキャン行数が数千万単位である場合、スキャン行数が数億または数十億のSQLクエリは異常と見なされ、手動での介入が必要です。
   2. ユーザーがクラスター内のSQLリソース使用量について期待値を持たない場合、パーセンタイル関数を使用してリソース使用量を計算し、異常なリソース使用量を持つSQLクエリを特定できます。CPUボトルネックを例に取ると、まず履歴期間におけるクエリCPU時間のtp50/tp75/tp99/tp999を計算し、これらの値を正常として使用します。これらを現在のクラスターの同じ期間におけるクエリCPU時間のパーセンタイル関数と比較します。例えば、履歴期間のtp999が1分だが、現在のクラスターの同じ期間のtp50が既に1分である場合、履歴データと比較してCPU時間が1分を超えるSQLクエリが多数存在することを示しています。したがって、CPU時間が1分を超えるSQLクエリを異常として定義できます。同じロジックが他の指標にも適用されます。
3. 異常なリソース使用量を持つSQLクエリを最適化します。例えば、SQLの書き直し、テーブル構造の最適化、並列度の調整により、SQLクエリあたりのリソース使用量を削減します。
4. auditログでSQLリソース使用量が正常であることが判明した場合、モニタリングとauditing を使用して、その時間に実行されたSQLクエリの数が履歴期間と比較して増加しているかどうかを確認できます。その場合は、対応する時間期間中に上流アクセストラフィックが増加したかどうかを上流ビジネスに確認し、クラスターをスケールするか、キューイングとレート制限を実装するかを決定してください。


## よく使用されるSQL
:::tip
active_queriesテーブルはFE上で実行されているクエリを記録し、backend_active_tasksテーブルはBE上で実行されているクエリを記録することに注意してください。実行中にすべてのクエリがFEに登録されるわけではありません。例えば、stream loadはFEに登録されません。したがって、backend_active_tasksとactive_queries間でLEFT JOINを実行する際に一致する結果が得られないのは正常です。

クエリがSELECTクエリの場合、active_queriesとbackend_active_tasksの両方に記録されるqueryIdは同じです。クエリがstream loadの場合、active_queriesテーブルのqueryIdは空で、backend_active_tasksのqueryIdはstream loadのIDです。
:::

1. 現在のすべてのWorkload Groupを表示し、メモリ/CPU/I/O使用量の降順で表示します。

```
select be_id,workload_group_id,memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second 
   from workload_group_resource_usage
order by  memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second desc
```
2. CPU使用率上位N件のSQL。

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
6. ワークロードグループのクエリキューの詳細を表示します。

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
