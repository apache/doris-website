---
{
  "title": "ワークロード解析診断",
  "language": "ja",
  "description": "Dorisにおけるワークロード分析と診断のガイド。リソースボトルネックのランタイム分析と、クラスタパフォーマンス最適化のための監査ログを通じた履歴データ分析について説明します。"
}
---
クラスターのワークロード分析は主に2つの段階に分かれます：
- 第1段階は実行時ワークロード分析で、クラスターの可用性が低下した際に、監視を通じて大量のリソースを消費しているクエリを特定し、適切にダウングレードすることができます。
- 第2段階では、audit logsなどの履歴データを分析して、不合理なワークロードを特定し最適化することが含まれます。

## 実行時ワークロード分析
監視によって検出されたクラスターの可用性低下時には、以下のプロセスに従うことができます：
1. まず、監視を使用して現在のクラスターのボトルネックを大まかに特定します。例えば、メモリ使用量の過多、CPU使用率の高さ、または高IOなどです。すべてが高い場合は、メモリ問題への対処を優先することが推奨されます。
2. クラスターのボトルネックが特定されたら、workload_group_resource_usageテーブルを確認して、現在最も高いリソース使用量を持つGroupを見つけることができます。例えば、メモリボトルネックがある場合、最も高いメモリ使用量を持つ上位NのGroupsを特定できます。
3. 最も高いリソース使用量を持つGroupが決定された後、最初のステップとしてこのGroupのクエリ並行性を削減できます。この時点でクラスターリソースは既に逼迫しており、クラスターリソースの枯渇を防ぐために新しいクエリは避けるべきです。
4. 現在のGroupのクエリをダウングレードします。ボトルネックに応じて、異なるアプローチを取ることができます：
- CPUボトルネックの場合、Groupのcpu_hard_limitを設定し、cpu_hard_limitをより低い値に調整してCPUリソースを自発的に譲ることを検討してください。
- IOボトルネックの場合、read_bytes_per_secondパラメータを通じてGroupの最大IOを制限します。
- メモリボトルネックの場合、Groupのメモリをハードリミットに設定し、memory_limit値を下げて一部のメモリを解放します。これにより、現在のGroup内で多数のクエリ失敗が発生する可能性があることに注意してください。
5. 上記のステップを完了した後、通常クラスターの可用性はある程度回復します。この時点で、さらなる分析を行い、このGroupでのリソース使用量増加の主な原因が、このGroupでのクエリ並行性の全体的な増加によるものか、特定の大きなクエリによるものかを判断できます。特定の大きなクエリが原因の場合、これらのクエリを迅速にkillしてクラスター機能を復旧できます。
6. backend_active_tasksテーブルをactive_queriesと組み合わせて使用することで、クラスター内で異常なリソース使用量を持つSQLクエリを特定し、その後killステートメントを使用してこれらのクエリをkillしてリソースを解放できます。

## 履歴データによるワークロード分析
現在、DorisのauditログはSQL実行に関する簡潔な情報を保持しており、これを使用して過去に実行された不合理なクエリを特定し調整することができます。具体的なプロセスは以下の通りです：
1. 監視を確認してクラスターの履歴リソース使用量を確認し、クラスターのボトルネックがCPU、メモリ、IOのいずれかを特定します。
2. クラスターのボトルネックが特定されたら、audit logsを確認して対応する期間中に異常なリソース使用量を持つSQLクエリを見つけることができます。異常なSQLを定義する方法は2つあります：
   1. ユーザーがクラスター内でのSQLのリソース使用量に関して一定の期待を持っている場合、例えばほとんどの遅延が秒単位で、スキャン行数が数千万行である場合、数億行または数十億行のスキャン行数を持つSQLクエリは異常と見なされ、手動介入が必要です。
   2. ユーザーがクラスター内でのSQLリソース使用量に関して期待を持たない場合、パーセンタイル関数を使用してリソース使用量を計算し、異常なリソース使用量を持つSQLクエリを特定できます。CPUボトルネックを例に取ると、まず履歴期間のクエリCPU時間のtp50/tp75/tp99/tp999を計算し、これらの値を正常として使用します。これらを現在のクラスターでの同期間のクエリCPU時間のパーセンタイル関数と比較します。例えば、履歴期間のtp999が1分であるが、現在のクラスターの同期間のtp50が既に1分である場合、履歴データと比較してCPU時間が1分を超えるSQLクエリが多数あることを示しています。したがって、CPU時間が1分を超えるSQLクエリを異常として定義できます。同じロジックが他のメトリクスにも適用されます。
3. 異常なリソース使用量を持つSQLクエリを最適化します。例えば、SQLの書き換え、テーブル構造の最適化、並列度の調整によりSQL クエリごとのリソース使用量を削減します。
4. audit logsでSQLリソース使用量が正常であることが判明した場合、監視とauditingを使用してその時間に実行されたSQLクエリ数が履歴期間と比較して増加しているかを確認できます。そうである場合、対応する時間帯に上流のアクセストラフィックの増加があったかを上流ビジネスに確認し、クラスターをスケールするか、キューイングとレート制限を実装するかを決定します。


## よく使用されるSQL
:::tip
active_queriesテーブルはFE上で実行されているクエリを記録し、backend_active_tasksテーブルはBE上で実行されているクエリを記録することに注意してください。すべてのクエリが実行中にFEに登録されるわけではありません。例えば、stream loadはFEに登録されません。したがって、backend_active_tasksとactive_queriesの間でLEFT JOINを実行する際に一致する結果が得られないのは正常です。

クエリがSELECTクエリの場合、active_queriesとbackend_active_tasksの両方に記録されるqueryIdは同じです。クエリがstream loadの場合、active_queriesテーブルのqueryIdは空で、backend_active_tasksのqueryIdはstream loadのIDです。
:::

1. 現在のすべてのWorkload Groupsを表示し、メモリ/CPU/I/O使用量の降順で表示します。

```
select be_id,workload_group_id,memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second 
   from workload_group_resource_usage
order by  memory_usage_bytes,cpu_usage_percent,local_scan_bytes_per_second desc
```
2. CPU使用率上位N位のSQL。

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
4. バイト/行をスキャンする TopN Sql。

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
