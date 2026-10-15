---
{
    "title": "クエリの中間結果をディスクへスピルする",
    "sidebar_label": "中間結果のディスクへのスピル",
    "language": "ja",
    "description": "大規模なクエリや ETL タスクでメモリが不足した場合、Doris は中間結果をディスクへスピルし、OOM エラーを回避して実行を継続できます。この記事では、スピルの仕組み、設定方法、監視方法を説明します。",
    "keywords": ["スピル", "ディスクへのスピル", "大規模クエリのメモリ不足", "OOM", "メモリ管理", "ワークロードグループ", "クエリの安定性"]
}
---

<!-- Knowledge type: concept introduction + procedure -->

## スピルが必要な理由

Doris の計算レイヤーは MPP アーキテクチャに基づいています。すべての計算タスクは BE のメモリ上で実行され、ノード間のデータ交換にもメモリを使用するため、メモリ管理はクエリの安定性に直接影響します。**ETL データ処理、複数テーブルのマテリアライズドビュー処理、複雑なアドホッククエリ**を Doris に移行するユーザーが増えるにつれて、単一ノードのメモリではすべての中間状態を保持できないことが多くなっています。

**スピル**（ディスクへの退避）は、集約状態やソートの一時データなどの中間状態をディスクに書き込み、メモリが不足しているクエリの実行を継続できるようにします。主な利点は次の三つです。

| 利点 | 説明 |
|------|------|
| 拡張性 | 単一ノードのメモリ制限を超えるデータセットを処理できる |
| 安定性 | メモリ不足によるクエリエラーやプロセスのクラッシュを減らす |
| 柔軟性 | ハードウェアを追加せずに、より複雑なクエリを実行できる |

現在スピルをサポートしている演算子は、Hash Join、Aggregation、Sort、CTE です。

:::caution 注意
スピルによりディスク I/O が発生し、クエリのレイテンシーが大幅に増加する可能性があります。それに応じてセッション変数 `query_timeout` を増やし、通常のロード処理やクエリへの影響を減らすために、スピル用ディレクトリには専用ディスクをマウントするか SSD を使用してください。

**クエリのスピルはデフォルトで無効です。**
:::

## スピルが発生する仕組み

Doris は **メモリ予約**の仕組みによって、スピルの発生タイミングを制御します。流れは次のとおりです。

1. 実行中、Doris は各 Block の処理に必要なメモリを見積もり、統合メモリマネージャーに要求します。
2. グローバルメモリアロケーターは、この要求がクエリ、ワークロードグループ、またはプロセスのメモリ制限を超えるか確認します。
3. 制限を超えると要求は失敗します。Doris は実行中のクエリを一時停止し、そのクエリで最大の演算子のスピルを開始します。
4. スピルが完了すると、クエリの実行を再開します。

## メモリ管理の階層

Doris のメモリ管理には、**プロセスレベル -> ワークロードグループレベル -> クエリレベル**の三つの階層があります。スピルの動作は、これらすべての制約を受けます。

### プロセスレベルのメモリ（BE）

`mem_limit` パラメータは `be.conf` で BE プロセス全体のメモリ上限を制御します。メモリ使用量がこのしきい値を超えると、Doris はその時点でメモリを要求しているクエリをキャンセルし、非同期のバックグラウンドタスクが一部のクエリを終了するか、キャッシュを解放します。

**よくある問題の状況は次の二つです。**

- **混在配置**：BE が FE、Kafka、HDFS などのプロセスとホストを共有している場合、実際に使用できるメモリは `mem_limit` より大幅に少ない可能性があります。その場合、メモリ解放の仕組みが機能せず、OS の OOM Killer が作動します。
- **コンテナ配置**：K8s または Cgroup 環境では、Doris がコンテナのメモリ設定を自動的に検出するため、手動で調整する必要はありません。

### ワークロードグループのメモリ

<!-- Knowledge type: parameter reference -->

| パラメータ | 説明 |
|------|------|
| `max_memory_percent` | このワークロードグループが使用できるプロセスメモリの最大割合です。超過するとスピルが発生するか、クエリが終了します。 |
| `min_memory_percent` | このワークロードグループに保証されるメモリの最小割合です。メモリが逼迫すると、ほかのグループにも十分なメモリを確保できるよう、この値に基づいて割り当てます。 |
| `memory_low_watermark` | メモリ使用量の低ウォーターマークです。デフォルトは 50% です。 |
| `memory_high_watermark` | メモリ使用量の高ウォーターマークです。デフォルトは 80% です。この値を超えると、メモリ予約要求が失敗し、スピルが発生します。 |

制約：すべてのワークロードグループの `min_memory_percent` の合計は 100% 以下でなければならず、各グループの `min_memory_percent` はその `max_memory_percent` 以下でなければなりません。

### クエリレベルのメモリ

#### 静的メモリ割り当て

`exec_mem_limit` はクエリの実行前にセッション変数で設定します。実行中に動的に変更することはできません。

:::warning アップグレード時の注意
`exec_mem_limit` のデフォルト値は **バージョン 3.1** より前は 2 GB でしたが、バージョン 3.1 以降は 100 GB に変更され、BE 側で実際に適用されます。既存のクエリが制限超過によってキャンセルされたり、予期しないスピルが発生したりするのを防ぐため、バージョン 3.1 以降へアップグレードする前に、このパラメータを明示的に `100g` に設定してください。
:::

#### スロットに基づく動的メモリ割り当て

静的割り当てでは、ユーザーが単一のクエリに必要なメモリを正確に見積もるのは難しく、プロセスメモリの半分など、値を高く設定しがちです。その結果、細かな制御ができなくなります。ワークロードグループのスロット機構は、この問題を解決します。

**仕組み：**

- ワークロードグループに `max_memory_percent` と `max_concurrency` が設定されている場合、BE のメモリは論理的に `max_concurrency` 個のスロットに分割され、各スロットのメモリ量は `max_memory_percent x mem_limit / max_concurrency` になります。
- デフォルトでは、各クエリが 1 スロットを使用します。より多くのメモリを使用するには、セッション変数 `query_slot_count` を変更します。
- クエリがより多くのスロットを使用すると、そのワークロードグループで同時に実行できるクエリ数が自動的に減り、新しいクエリはキューに入ります。

**`slot_memory_policy` に指定できる値：**

| 値 | 説明 |
|----|------|
| `none` | デフォルトです。スロットに基づく割り当ては有効になりません。クエリは可能な限りメモリを使用し、ワークロードグループの上限に達するとスピルが発生します。 |
| `fixed` | クエリあたりのメモリ量 = `workload group mem_limit x query_slot_count / max_concurrency`。同時実行数に基づく固定割り当てです。 |
| `dynamic` | クエリあたりのメモリ量 = `workload group mem_limit x query_slot_count / sum(running query slots)`。空きスロットのメモリは、実行中の大規模なクエリに動的に再割り当てされます。 |

`fixed` と `dynamic` はどちらも厳格な上限です。上限を超えるとスピルが発生するかクエリが終了し、静的に割り当てた `exec_mem_limit` よりも優先されます。`slot_memory_policy` を設定するときは、`max_concurrency` を慎重に設定してください。適切に設定しないとメモリ不足が発生する可能性があります。

## クエリのスピルを有効にする

<!-- Knowledge type: procedure -->

### ステップ 1：BE のスピル先パスを設定する

次の設定を `be.conf` に追加します。設定を反映するには、**変更後に BE を再起動する必要があります**。

```properties
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```

| パラメータ | 説明 |
|------|------|
| `spill_storage_root_path` | スピルファイルの保存先パスです。デフォルトでは `storage_root_path` と同じ値になります。専用ディスクのパスを推奨します。 |
| `spill_storage_limit` | スピルファイルが使用できるディスク容量の上限です。絶対値（`100G` や `1T` など）または割合（デフォルトは `20%`）を指定できます。専用ディスクを使用する場合は `100%` に設定できます。 |

### ステップ 2：FE のセッション変数を設定する

```sql
SET enable_spill = true;
SET exec_mem_limit = 10g;
SET query_timeout = 3600;
```

| 変数 | 説明 |
|------|------|
| `enable_spill` | スピルを有効にするかどうかを指定します。デフォルトは `false` です。有効にすると、メモリが逼迫したときに自動的にスピルが発生します。 |
| `exec_mem_limit` | 単一のクエリが使用できるメモリの上限です。 |
| `query_timeout` | スピルによってクエリのレイテンシーが増加するため、タイムアウトを適切に延長します（単位：秒）。 |

### ステップ 3：ワークロードグループを設定する（任意）

単一のワークロードグループがプロセスのメモリを使い切らないよう、`max_memory_percent` を調整します。

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('max_memory_percent'='90%');
```

大規模なクエリが先にスピルするように、スロットに基づく動的メモリ割り当てを有効にします。

```sql
ALTER WORKLOAD GROUP normal PROPERTIES ('slot_memory_policy'='dynamic');
```

## スピルの状態を監視する

<!-- Knowledge type: monitoring and operations -->

### 監査ログ

FE の監査ログには、スピル時の読み書き量を記録する次のフィールドが追加されます。

```
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```

| フィールド | 説明 |
|------|------|
| `SpillWriteBytesToLocalStorage` | スピル中にディスクへ書き込まれたデータの総量（バイト）。 |
| `SpillReadBytesFromLocalStorage` | スピル中にディスクから読み込まれたデータの総量（バイト）。 |

### クエリ Profile

クエリでスピルが発生すると、Profile に `Spill` で始まるカウンターが表示されます。以下は HashJoin Build HashTable の例です。

```
PARTITIONED_HASH_JOIN_SINK_OPERATOR  (id=4  ,  nereids_id=179):(ExecTime:  6sec351ms)
      -  Spilled:  true
      -  CloseTime:  528ns
      -  ExecTime:  6sec351ms
      -  InitTime:  5.751us
      -  InputRows:  6.001215M  (6001215)
      -  MemoryUsage:  0.00  
      -  MemoryUsagePeak:  554.42  MB
      -  MemoryUsageReserved:  1024.00  KB
      -  OpenTime:  2.267ms
      -  PendingFinishDependency:  0ns
      -  SpillBuildTime:  2sec437ms
      -  SpillInMemRow:  0
      -  SpillMaxRowsOfPartition:  68.569K  (68569)
      -  SpillMinRowsOfPartition:  67.455K  (67455)
      -  SpillPartitionShuffleTime:  836.302ms
      -  SpillPartitionTime:  131.839ms
      -  SpillTotalTime:  5sec563ms
      -  SpillWriteBlockBytes:  714.13  MB
      -  SpillWriteBlockCount:  1.344K  (1344)
      -  SpillWriteFileBytes:  244.40  MB
      -  SpillWriteFileTime:  350.754ms
      -  SpillWriteFileTotalCount:  32
      -  SpillWriteRows:  6.001215M  (6001215)
      -  SpillWriteSerializeBlockTime:  4sec378ms
      -  SpillWriteTaskCount:  417
      -  SpillWriteTaskWaitInQueueCount:  0
      -  SpillWriteTaskWaitInQueueTime:  8.731ms
      -  SpillWriteTime:  5sec549ms
```

`Spilled: true` は、その演算子でスピルが発生したことを示します。

### システムテーブル `backend_active_tasks`

実行中のクエリのスピル量をリアルタイムで確認できるよう、`information_schema.backend_active_tasks` に次の二つの列が追加されています。

| 列 | 説明 |
|------|------|
| `SPILL_WRITE_BYTES_TO_LOCAL_STORAGE` | 現在のクエリがすでにディスクへ書き込んだスピルデータの量（バイト）。 |
| `SPILL_READ_BYTES_FROM_LOCAL_STORAGE` | 現在のクエリがすでにディスクから読み込んだスピルデータの量（バイト）。 |

```sql
SELECT * FROM information_schema.backend_active_tasks;
```

出力例：

```
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
```

## パフォーマンスの参考値（TPC-DS 10TB）

<!-- Knowledge type: test data -->

以下は Alibaba Cloud のサーバーでクエリを一つずつ実行したテスト結果です。メモリとデータ量の比率が約 **1:52** という厳しい条件でも、スピルによって 99 件すべての TPC-DS クエリが完了することを確認しています。

**テスト環境：**

- 1 FE：16 vCPU コア、32 GiB メモリ（ecs.c6.4xlarge）
- 3 BE：16 vCPU コア、64 GiB メモリ（ecs.g6.4xlarge）
- テストデータ：TPC-DS 10TB。Alibaba Cloud DLF Catalog を介してマウント

**合計時間：28,102.386 秒**

| クエリ | 時間（ms） | クエリ | 時間（ms） | クエリ | 時間（ms） |
|-------|---------|-------|---------|-------|---------|
| query1 | 29092 | query34 | 84055 | query67 | 3939554 |
| query2 | 130003 | query35 | 69885 | query68 | 183648 |
| query3 | 96119 | query36 | 148662 | query69 | 11031 |
| query4 | 1199097 | query37 | 21598 | query70 | 137901 |
| query5 | 212719 | query38 | 164746 | query71 | 166454 |
| query6 | 62259 | query39 | 5874 | query72 | 2859001 |
| query7 | 209154 | query40 | 51602 | query73 | 92015 |
| query8 | 62433 | query41 | 563 | query74 | 336694 |
| query9 | 579371 | query42 | 93005 | query75 | 838989 |
| query10 | 54260 | query43 | 67769 | query76 | 174235 |
| query11 | 560169 | query44 | 79527 | query77 | 174525 |
| query12 | 26084 | query45 | 26575 | query78 | 1956786 |
| query13 | 228756 | query46 | 134991 | query79 | 162259 |
| query14 | 1137097 | query47 | 161873 | query80 | 602088 |
| query15 | 27509 | query48 | 153657 | query81 | 16184 |
| query16 | 84806 | query49 | 259387 | query82 | 56292 |
| query17 | 288164 | query50 | 141421 | query83 | 26211 |
| query18 | 94770 | query51 | 158056 | query84 | 11906 |
| query19 | 124955 | query52 | 91392 | query85 | 57739 |
| query20 | 30970 | query53 | 89497 | query86 | 34350 |
| query21 | 4333 | query54 | 124118 | query87 | 173631 |
| query22 | 9890 | query55 | 82584 | query88 | 449003 |
| query23 | 1757755 | query56 | 152110 | query89 | 113799 |
| query24 | 399553 | query57 | 83417 | query90 | 30825 |
| query25 | 291474 | query58 | 259580 | query91 | 12239 |
| query26 | 79832 | query59 | 177125 | query92 | 26695 |
| query27 | 175894 | query60 | 161729 | query93 | 275828 |
| query28 | 647497 | query61 | 258058 | query94 | 56464 |
| query29 | 1299597 | query62 | 39619 | query95 | 64932 |
| query30 | 11434 | query63 | 91258 | query96 | 48102 |
| query31 | 106665 | query64 | 234882 | query97 | 597371 |
| query32 | 33481 | query65 | 278610 | query98 | 112399 |
| query33 | 146101 | query66 | 90246 | query99 | 64472 |

今後は Window Function や Intersect など、より多くの演算子へスピルのサポートを拡大し、スピルの性能も継続的に最適化していく予定です。
