---
{
    "title": "同時実行制御とキューイング：高い同時実行数による OOM とシステムのハングを防ぐ",
    "sidebar_label": "同時実行制御とキューイング",
    "language": "ja",
    "description": "Doris のワークロードグループで同時実行数の上限とキューイングの方針を設定し、高い同時実行数による OOM やシステムのハングを防ぎます。",
    "keywords": ["同時実行制御", "キューイング", "ワークロードグループ", "max_concurrency", "max_queue_size", "queue_timeout", "高い同時実行数", "OOM", "リソース管理", "クエリの流量制御"]
}
---

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: High-concurrency query throttling / OOM prevention / System resource management -->

同時実行制御とキューイングは、Doris のワークロード管理における中核的な仕組みです。同時に実行中のクエリ数がシステムの上限を超えると、Doris は超過分のクエリをすぐに拒否したり、システムに過度な負荷をかけたりする代わりに、待機キューに入れます。これにより、OOM やシステムのハングなどの問題を防ぎます。

この仕組みは **ワークロードグループ** を通じて実装されます。各ワークロードグループは、同時実行数の上限、キューの長さ、キューでの待機タイムアウトを個別に設定できます。

## 同時実行制御とキューイングを設定する

<!-- Knowledge type: Procedure -->

**目的**：ワークロードグループを作成または変更し、同時実行するクエリ数を制限してキューイングを有効にします。

**コマンド**：

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS queue_group
PROPERTIES (
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```

**パラメータの説明**：

| パラメータ | 型 | デフォルト値 | 範囲 | 説明 |
|---|---|---|---|---|
| `max_concurrency` | 整数 | 2147483647 | [0, 2147483647] | クエリの同時実行数の上限。デフォルト値は整数の最大値で、同時実行数に制限がないことを意味します。実行中のクエリ数がこの上限に達すると、新しいクエリはキューイング処理に入ります。 |
| `max_queue_size` | 整数 | 0 | [0, 2147483647] | 待機キューの長さ。キューが満杯になると、新しいクエリは直ちに拒否されます。デフォルト値の 0 は、キューイングしないことを意味します。 |
| `queue_timeout` | 整数 | 0 | [0, 2147483647] | クエリがキューで待機できる最大時間（ミリ秒）。タイムアウトすると、クライアントに直接失敗が返されます。デフォルト値の 0 は、キューに入った直後に失敗が返されることを意味します。 |

**例の説明**：

上記の設定は、単一 FE 構成では次を意味します。

- クラスタで同時に実行されるクエリは最大 10 件です。
- 同時実行数が上限に達すると、新しいクエリは最大長 20 のキューに入ります。
- キュー内のクエリは最大 3 秒（3000 ミリ秒）待機し、タイムアウトすると失敗が返されます。

:::tip 複数 FE 構成での注意事項
キューイングのパラメータは **FE ごと** に適用され、クラスタ内の FE の総数は考慮されません。たとえば、次のようになります。

- `max_concurrency = 1` でクラスタ内の FE が 1 台の場合、同時に実行される SQL は最大 1 件です。
- `max_concurrency = 1` でクラスタ内の FE が 3 台の場合、同時に実行される SQL は最大 3 件です（FE ごとに 1 件）。

複数 FE のクラスタでは、クラスタ全体で目標とする同時実行数を FE の台数で割った値を `max_concurrency` に設定します。
:::

## 現在のキューイング状態を確認する

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Monitor queuing / Diagnose concurrency issues -->

**目的**：各ワークロードグループで現在実行中のクエリ数とキューで待機中のクエリ数を確認します。

**コマンド**：

```sql
SHOW WORKLOAD GROUPS;
```

**出力例**：

```text
mysql [(none)]> SHOW WORKLOAD GROUPS\G;
*************************** 1. row ***************************
                          Id: 1
                        Name: normal
                   cpu_share: 20
                memory_limit: 50%
    enable_memory_overcommit: true
             max_concurrency: 2147483647
              max_queue_size: 0
               queue_timeout: 0
              cpu_hard_limit: 1%
             scan_thread_num: 16
  max_remote_scan_thread_num: -1
  min_remote_scan_thread_num: -1
        memory_low_watermark: 50%
       memory_high_watermark: 80%
                         tag: 
       read_bytes_per_second: -1
remote_read_bytes_per_second: -1
           running_query_num: 0
           waiting_query_num: 0
```

主なフィールド：

- `running_query_num`：現在実行中のクエリ数。
- `waiting_query_num`：現在キューで待機中のクエリ数。

## キューイングの制限を回避する（管理者操作）

<!-- Knowledge type: Procedure -->
<!-- Applicable scenarios: Operations / Emergency administration -->

**目的**：運用時に管理者アカウントがキューイング処理を回避し、管理用 SQL を直接実行できるようにします。

**コマンド**：

```sql
SET bypass_workload_group = true;
```

**説明**：この設定はセッションレベルの変数であり、現在のセッションでのみ有効です。運用時に限って一時的に有効にし、作業が完了したら無効にするか、接続し直してください。

## よくある質問

<!-- Knowledge type: Troubleshooting -->

### Q：新しいクエリがキューに入らず、すぐに失敗する
`queue_timeout = 0` または `max_queue_size = 0` に設定されていると、クエリはキューに入りません。`max_queue_size` > 0 かつ `queue_timeout` > 0 に設定してください。

### Q：キューが満杯になるとクエリが拒否される
`max_queue_size` の設定値が小さすぎます。`max_queue_size` を増やすか、`max_concurrency` を引き上げてください。

### Q：複数 FE のクラスタで同時実行数の上限が想定と異なる
キューイングのパラメータは FE ごとに適用されます。`max_concurrency` には、目標値を FE の台数で割った値を設定してください。

### Q：管理者の操作もキューによってブロックされる
回避用の変数が有効になっていません。`SET bypass_workload_group = true` を実行してください。
