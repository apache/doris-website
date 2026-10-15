---
{
    "title": "ワークロードの分析と診断：実行時の監視と履歴監査",
    "sidebar_label": "ワークロード分析",
    "language": "ja",
    "description": "リアルタイム監視と監査ログの履歴分析によってクラスタのボトルネックを特定し、異常な SQL を調査して、クラスタの可用性を迅速に回復する方法を説明します。",
    "keywords": ["ワークロード管理", "ワークロードグループ", "クラスタ診断", "異常な SQL", "監査ログ", "リソースのボトルネック", "CPU メモリ IO", "クエリの KILL", "backend_active_tasks", "active_queries"]
}
---

<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

クラスタのワークロード分析には、**実行時分析**（クラスタの可用性が低下したときに迅速に影響を抑える）と、**履歴データ分析**（事後に監査ログから不適切なワークロードを見つける）の二つの段階があります。

## 適用場面

| 場面 | 実施する契機 | 主なツール |
|------|----------|----------|
| 実行時分析 | 監視で CPU / メモリ / IO の異常な増加が確認されたとき | `workload_group_resource_usage`、`backend_active_tasks`、KILL 文 |
| 履歴データ分析 | 障害の事後分析または定期点検 | 監査ログテーブル、パーセンタイル関数、SQL チューニング |

## 実行時のワークロード分析

<!-- Knowledge type: Procedure -->

監視でクラスタの可用性低下が確認された場合は、以下の手順に従います。

### ステップ 1：リソースのボトルネックの種類を特定する

監視データから、現在の主なボトルネックがメモリ、CPU、IO のどれかを特定します。三つとも使用率が高い場合は、まずメモリの問題に対処します。

### ステップ 2：リソース使用量が最も多いワークロードグループを見つける

`workload_group_resource_usage` テーブルで該当するリソース指標を降順に並べ、使用量上位 N 件のグループを見つけます。詳細は[よく使う診断 SQL](#common-diagnostic-sql)を参照してください。

### ステップ 3：使用量の多いグループのクエリ同時実行数を制限する

クラスタのリソースがすでに逼迫している場合は、そのグループのクエリ最大同時実行数を引き下げ、新しいクエリによってリソースがさらに枯渇するのを防ぎます。

### ステップ 4：使用量の多いグループに負荷抑制を適用する

<!-- Knowledge type: Configuration parameters -->

ボトルネックの種類に応じて、負荷抑制の方法を選びます。

| ボトルネックの種類 | 負荷抑制の方法 | 注意点 |
|----------|----------|------|
| CPU | CPU をハードリミットに変更し、`cpu_hard_limit` を低い値に設定する | CPU を他のグループに譲り、影響を避ける |
| IO | `read_bytes_per_second` を設定する | グループのディスク読み取り速度の上限を設定する |
| メモリ | メモリをハードリミットに変更し、`memory_limit` を引き下げる | メモリの一部が解放されるが、そのグループの多くのクエリが失敗する可能性がある |

### ステップ 5：根本原因をさらに分析する

負荷抑制後は、通常、クラスタの可用性がある程度回復します。この時点で、リソース使用量の急増がクエリ全体の同時実行数の増加によるものか、特定の大規模クエリによるものかを分析します。大規模クエリが原因の場合は、KILL 文でそのクエリを速やかに終了させ、障害からの復旧を早めます。

### ステップ 6：異常な SQL を特定して終了させる

`backend_active_tasks` と `active_queries` を組み合わせてリソース使用量が異常な SQL を見つけ、KILL 文でリソースを解放します。詳細は[よく使う診断 SQL](#common-diagnostic-sql)を参照してください。

## 履歴データ分析

<!-- Knowledge type: Procedure -->

Doris の監査ログテーブルには SQL の実行に関する概要情報が記録され、事後に不適切なクエリを見つけるために利用できます。

### ステップ 1：監視データから過去のリソースのボトルネックを確認する

過去の監視データを確認して、クラスタのボトルネックの種類（CPU、メモリ、IO）を特定し、調査対象の時間範囲を絞ります。

### ステップ 2：監査ログから異常な SQL を特定する

異常な SQL は、次の二つの方法で判断できます。

- **業務上の想定に基づく方法**：ほとんどのクエリのレイテンシが秒単位で、スキャン行数が数千万行である場合、数億行または数十億行をスキャンする SQL は異常とみなし、手動での対応が必要です。

- **パーセンタイルの基準値に基づく方法**：業務側でリソース使用量の想定値がない場合は、パーセンタイル関数で基準値を作成できます。CPU がボトルネックの例では、まず過去の一定期間におけるクエリの CPU 時間の tp50/tp75/tp99/tp999 を通常時の基準値として算出し、現在の期間の同じ時間帯におけるパーセンタイル値と比較します。たとえば、過去の tp999 が 1 分で、現在の tp50 が 1 分に達している場合、現在の期間に CPU 時間が 1 分を超える SQL 文が大量に現れていることを示し、それらを異常な SQL と判断できます。他のリソース指標にも同じ方法を適用できます。

### ステップ 3：異常な SQL を最適化する

リソース使用量が異常な SQL を最適化します。一般的な方法には、SQL の書き換え、テーブルスキーマの最適化、並列度の調整があり、SQL 単位のリソース使用量を削減できます。

### ステップ 4：スケールアウトか流量制限かを判断する

監査ログで各 SQL のリソース使用量が正常である場合は、監視データと監査ログを使い、その時点の SQL 実行数が過去の水準より多かったかどうかを確認します。大幅に増えていた場合は、上流の業務システム側にアクセストラフィックが増加したかを確認し、クラスタのスケールアウト、またはキューイングと流量制限の有効化を判断します。

## よく使う診断 SQL {#common-diagnostic-sql}

<!-- Knowledge type: Procedure -->

:::tip 補足
`active_queries` は FE に登録されたクエリを記録し、`backend_active_tasks` は BE で実行中のタスクを記録します。すべてのクエリが FE に登録されるわけではありません（たとえば、Stream Load は FE に登録されません）。そのため、`backend_active_tasks` を `active_queries` に LEFT JOIN すると、一致しない行があるのは正常です。

- クエリの種類が SELECT の場合、両方のテーブルの `queryId` は同じです。
- クエリの種類が Stream Load の場合、`queryId`（`active_queries` 側）は空で、`queryId`（`backend_active_tasks` 側）は Stream Load の ID です。
:::

**1. ワークロードグループごとのリソース使用量を表示する（メモリ / CPU / IO の降順）**

```sql
SELECT be_id, workload_group_id, memory_usage_bytes, cpu_usage_percent, local_scan_bytes_per_second
FROM workload_group_resource_usage
ORDER BY memory_usage_bytes DESC, cpu_usage_percent DESC, local_scan_bytes_per_second DESC;
```

**2. CPU 使用量上位 N 件の SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t2.`database`,
    t1.cpu_time,
    t2.`sql`
FROM
    (SELECT query_id, query_type, sum(task_cpu_time_ms) AS cpu_time
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY cpu_time DESC
LIMIT 10;
```

**3. メモリ使用量上位 N 件の SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.mem_used
FROM
    (SELECT query_id, query_type, sum(current_used_memory_bytes) AS mem_used
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY mem_used DESC
LIMIT 10;
```

**4. スキャンしたデータ量の上位 N 件の SQL**

```sql
SELECT
    t1.query_id AS be_query_id,
    t1.query_type,
    t2.query_id,
    t2.workload_group_id,
    t1.scan_rows,
    t1.scan_bytes
FROM
    (SELECT query_id, query_type, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id, query_type) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
ORDER BY scan_rows DESC, scan_bytes DESC
LIMIT 10;
```

**5. ワークロードグループごとのスキャンデータ量の集計**

```sql
SELECT
    t2.workload_group_id,
    sum(t1.scan_rows) AS wg_scan_rows,
    sum(t1.scan_bytes) AS wg_scan_bytes
FROM
    (SELECT query_id, sum(scan_rows) AS scan_rows, sum(scan_bytes) AS scan_bytes
     FROM backend_active_tasks
     GROUP BY query_id) t1
LEFT JOIN active_queries t2 ON t1.query_id = t2.query_id
GROUP BY t2.workload_group_id
ORDER BY wg_scan_rows DESC, wg_scan_bytes DESC;
```

**6. ワークロードグループごとのキューイング中のクエリと待機時間を表示する**

```sql
SELECT
    workload_group_id,
    query_id,
    query_status,
    now() - queue_start_time AS queued_time
FROM active_queries
WHERE query_status = 'queued'
ORDER BY workload_group_id;
```
