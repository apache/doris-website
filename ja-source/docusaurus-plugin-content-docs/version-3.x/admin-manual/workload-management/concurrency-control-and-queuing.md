---
{
  "title": "同期制御とキューイング",
  "language": "ja",
  "description": "同時実行制御とキューイングはリソース管理メカニズムです。"
}
---
同時実行制御とキューイングは、リソース管理メカニズムです。複数のクエリが同時にリソースを要求し、システムの同時実行制限に達した場合、Dorisは事前定義された戦略と制限に基づいてクエリを管理し、高負荷下でもシステムが円滑に動作し続け、OOM（Out of Memory）やシステムフリーズなどの問題を回避できるようにします。

Dorisの同時実行制御とキューイングメカニズムは、主にworkload groupを通じて実装されています。workload groupは、最大同時実行数、キュー長、タイムアウトパラメータなど、クエリのリソース使用制限を定義します。これらのパラメータを適切に設定することで、リソース管理の目標を達成できます。

## 基本的な使用方法

```
create workload group if not exists queue_group
properties (
    "max_concurrency" = "10",
    "max_queue_size" = "20",
    "queue_timeout" = "3000"
);
```
**パラメータ説明**


| プロパティ        | データ型 | デフォルト値 | 値の範囲        | 説明                                                                                                                                                                                                                                                                   |
|-----------------|-----------|---------------|-----------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| max_concurrency | Integer   | 2147483647    | [0, 2147483647] | オプション、同時実行クエリの最大数。デフォルト値は整数の最大値で、同時実行数に制限がないことを意味します。実行中のクエリ数が最大同時実行数に達すると、新しいクエリはキューイング処理に入ります。             |
| max_queue_size  | Integer   | 0             | [0, 2147483647] | オプション、クエリキューの長さ。キューが満杯になると、新しいクエリは拒否されます。デフォルト値は0で、キューイングしないことを意味します。                                                                                                                                |
| queue_timeout   | Integer   | 0             | [0, 2147483647] | オプション、キュー内でのクエリの最大待機時間（ミリ秒単位）。クエリがキュー内でこの時間を超えると、クライアントに例外が投げられます。デフォルト値は0で、キューイングしないことを意味し、クエリはキューに入るとすぐに失敗します。 |


現在クラスタに1つのFEがある場合、この設定の意味は次の通りです：クラスタ内の同時実行クエリの最大数は10に制限されます。最大同時実行数に達すると、新しいクエリはキューに入り、キューの長さは20に制限されます。キュー内でのクエリの最大待機時間は3秒で、キュー内で3秒を超えるクエリは直接クライアントに失敗を返します。

:::tip
現在のキューイング設計はFEの数を考慮していません。キューイングパラメータは単一FEレベルでのみ有効です。例えば：

Dorisクラスタにおいて、workload groupがmax_concurrency = 1で設定されている場合、
クラスタに1つのFEがある場合、workload groupはクラスタ内で一度に1つのSQLクエリのみの実行を許可します；
クラスタに3つのFEがある場合、クラスタ内のSQLクエリの最大数は3になる可能性があります。
:::

## キューステータスの確認

**構文**

```
show workload groups
```
**例**

```
mysql [(none)]>show workload groups\G;
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
```running_query_num```Represents the number of queries currently running, ```waiting_query_num```Represents the number of queries in the queue.

## Bypass the queuing

In some operational scenarios, the administrator account needs to bypass the queuing logic to execute SQL for system management tasks. This can be done by setting session variables to bypass the queuing:

```
set bypass_workload_group = true;

```
