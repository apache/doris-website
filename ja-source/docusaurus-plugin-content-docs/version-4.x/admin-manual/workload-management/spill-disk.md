---
{
  "title": "スピルディスク",
  "language": "ja",
  "description": "Dorisのコンピューティングレイヤーは、MPP（Massively Parallel Processing）アーキテクチャを採用している。"
}
---
## 概要
Dorisの計算レイヤーはMPP（Massively Parallel Processing）アーキテクチャを採用しており、すべての計算タスクはBE（Backend）のメモリ内で完了し、BE間のデータ交換もメモリを通じて行われます。そのため、メモリ管理はクエリの安定性を確保する上で重要な役割を果たします。オンラインクエリ統計によると、クエリエラーの大部分がメモリ関連の問題に起因しています。ETLデータ処理、マルチテーブル物理化ビュー処理、複雑なAdHocクエリなどのタスクをDorisに移行するユーザーが増加する中、各クエリまたは各ノードが処理できる容量を超えるメモリを必要とするクエリの実行を可能にするため、中間操作結果をディスクにオフロードする必要があります。具体的には、大容量データセットの処理や複雑なクエリの実行時に、メモリ消費が急激に増加し、単一ノードまたはクエリ処理プロセス全体のメモリ制限を超える可能性があります。Dorisは中間結果（集約の中間状態、ソート用の一時データなど）をディスクに書き込むことで、これらのデータの保存をメモリのみに依存せず、メモリ圧迫を緩和します。このアプローチには以下の利点があります：
- スケーラビリティ：Dorisが単一ノードのメモリ制限をはるかに超えるデータセットを処理できるようになります。
- 安定性：メモリ不足によるクエリ失敗やシステムクラッシュのリスクを軽減します。
- 柔軟性：ハードウェアリソースを増強することなく、ユーザーがより複雑なクエリを実行できるようになります。

メモリ要求時にOOM（Out of Memory）の発生を回避するため、Dorisはリザーブメモリメカニズムを導入しています。このメカニズムのワークフローは以下の通りです：
- 実行中、Dorisは各ブロックの処理に必要なメモリサイズを推定し、統合メモリマネージャーに要求します。
- グローバルメモリアロケーターは、現在のメモリ要求がクエリまたはプロセス全体のメモリ制限を超えるかどうかを判断します。超える場合、要求は失敗します。
- Dorisが失敗メッセージを受け取ると、現在のクエリを一時停止し、ディスクへのスピルのため最大のオペレーターを選択し、スピル完了後にクエリ実行を再開します。

現在、スピルをサポートするオペレーターには以下があります：
- Hash Joinオペレーター
- Aggregationオペレーター
- Sortオペレーター
- CTE

クエリがスピルを発生させる場合、追加のディスク読み書き操作によってクエリ時間が大幅に増加する可能性があります。FE Sessionの変数query_timeoutを増加させることを推奨します。また、スピルは大量のディスクI/Oを生成する可能性があるため、通常のデータ取り込みやクエリへのクエリスピルの影響を軽減するため、別個のディスクディレクトリを設定するか、SSDディスクを使用することをお勧めします。クエリスピル機能は現在デフォルトで無効になっています。

## メモリ管理メカニズム

### BEプロセスメモリ設定
BE プロセス全体のメモリは、be.conf の mem_limit パラメーターによって制御されます。Doris のメモリ使用量がこの閾値を超えると、Doris はメモリを要求している現在のクエリをキャンセルします。さらに、バックグラウンドタスクが非同期的にいくつかのクエリを強制終了してメモリやキャッシュを解放します。そのため、Doris の内部管理操作（ディスクへのスピル、memtableのフラッシュなど）は、この閾値に近づいた時点で実行して到達を回避する必要があります。閾値に到達すると、プロセス全体のOOMを防ぐため、Dorisは劇的な自己保護措置を講じます。
DorisのBEが他のプロセス（Doris FE、Kafka、HDFSなど）と同じ場所に配置されている場合、Doris BEで実際に利用可能なメモリは、ユーザーが設定したmem_limitよりも大幅に少なくなる可能性があり、内部メモリ解放メカニズムが機能せず、DorisプロセスがオペレーティングシステムのOOM Killerによって強制終了される可能性があります。
DorisプロセスがK8Sに配備されるかCgroupによって管理される場合、Dorisは自動的にコンテナのメモリ設定を感知します。

### Workload Groupメモリ設定

- MAX_MEMORY_PERCENTは、グループ内でリクエストが実行される際に、そのメモリ使用量が総メモリのこの割合を超えることがないことを意味します。超過した場合、クエリはディスクスピルを発生させるか、強制終了されます。
- MIN_MEMORY_PERCENTはグループの最小メモリ値を設定します。リソースがアイドル状態の場合、MIN_MEMORY_PERCENTを超えるメモリを使用できます。ただし、メモリが不足している場合、システムはMIN_MEMORY_PERCENT（最小メモリ割合）に従ってメモリを割り当てます。いくつかのクエリを強制終了することを選択し、Workload Groupのメモリ使用量をMIN_MEMORY_PERCENTまで減らして、他のWorkload Groupが十分なメモリを利用できるようにします。
- すべてのWorkload GroupのMIN_MEMORY_PERCENTの合計は100%を超えてはならず、MIN_MEMORY_PERCENTはMAX_MEMORY_PERCENTを超えることはできません。
- low watermark：デフォルトは75%です。
- high watermark：デフォルトは90%です。

## クエリメモリ管理
### 静的メモリ割り当て
クエリが使用するメモリは以下の2つのパラメーターによって制御されます：
- exec_mem_limit、クエリが使用できる最大メモリを表し、デフォルト値は2GBです。

### スロットベースメモリ割り当て
実際には、静的メモリ割り当てでは、ユーザーがクエリにどの程度のメモリを割り当てればよいかわからないことが多いことがわかりました。そのため、exec_mem_limitはBEプロセス全体のメモリの半分に設定されることが多く、これはBE内のすべてのクエリが使用するメモリがプロセスメモリの半分を超えることができないことを意味します。このシナリオでは、この機能は実質的にヒューズの一種になります。ディスクへのスピルなど、メモリサイズに基づいたより詳細なポリシー制御を実装する必要がある場合、この値は制御に依存するには大きすぎます。
そのため、workload groupに基づく新しいスロットベースのメモリ制限方法を実装しました。この戦略の原理は以下の通りです：
- 各workload groupは、ユーザーによってmemory_limitとmax_concurrencyの2つのパラメーターが設定されます。BE全体のメモリがmax_concurrencyスロットに分割され、各スロットがmemory_limit / max_concurrencyのメモリを占有すると仮定されます。
- デフォルトでは、各クエリは実行中に1つのスロットを占有します。ユーザーがクエリにより多くのメモリを使用させたい場合は、query_slot_count値を変更する必要があります。
- workload group内のスロットの総数は固定されているため、query_slot_countを増加させることは各クエリがより多くのスロットを占有することを意味し、workload group内で同時実行できるクエリ数を動的に減らし、新しいクエリを自動的にキューに入れます。

workload groupのslot_memory_policyには3つのオプション値があります：
- disabled、デフォルト値で、有効になっておらず静的メモリ割り当て方法が使用されることを示します。
- fixed、各クエリが使用できるメモリがworkload groupのmem_limit * query_slot_count / max_concurrencyとして計算されます。
- dynamic、各クエリが使用できるメモリがworkload groupのmem_limit * query_slot_count / sum(running query slots)として計算されます。これは主にfixedモードでの未使用スロットの問題を解決します。fixedとdynamicの両方がクエリにハード制限を設定します。超過した場合、ディスクへのスピルまたはクエリの強制終了が発生し、これらはユーザーが設定した静的メモリ割り当てパラメーターを上書きします。そのため、slot_memory_policyを設定する際は、メモリ不足の問題を回避するためworkload groupのmax_concurrencyを適切に設定することが重要です。

## スピル
### クエリ中間結果スピルの有効化
#### BE設定項目

```
spill_storage_root_path=/mnt/disk1/spilltest/doris/be/storage;/mnt/disk2/doris-spill;/mnt/disk3/doris-spill
spill_storage_limit=100%
```
- spill_storage_root_path: クエリ中間結果のスピリングファイル用のストレージパス。デフォルトではstorage_root_pathと同じになります。
- spill_storage_limit: スピリングファイル用のディスク容量制限。特定の容量サイズ（例：100GB、1TB）またはパーセンテージで設定でき、デフォルトは20%です。spill_storage_root_pathが別のディスクで設定されている場合は、100%に設定できます。このパラメータは主に、スピリングが過度にディスク容量を占有して通常のデータストレージを妨げることを防ぎます。設定項目を変更した後、それらを有効にするにはBEを再起動する必要があります。

#### FE Session Variable

```
set enable_spill=true;
set exec_mem_limit = 10g
```
- enable_spill、クエリでスピリングが有効かどうかを示します。
- exec_mem_limit、クエリで使用される最大メモリサイズを表します。

#### Workload Group
workload groupのデフォルトのmax_memory_percentは100%で、実際のworkload groupの数に基づいて調整できます。workload groupが1つのみの場合、90%に調整できます。

```
alter workload group normal properties ( 'max_memory_percent'='90%' );
```
### Spillingの監視
#### 監査ログ
FE監査ログにSpillWriteBytesToLocalStorageとSpillReadBytesFromLocalStorageフィールドが追加されました。これらはそれぞれ、spilling中にローカルストレージに書き込まれたデータの総量と、ローカルストレージから読み込まれたデータの総量を表します。

```
SpillWriteBytesToLocalStorage=503412182|SpillReadBytesFromLocalStorage=503412182
```
#### Profile
クエリの実行中にスピリングがトリガーされると、いくつかのSpillプレフィックス付きカウンターがQuery Profileに追加され、スピリング関連のアクティビティをマークおよびカウントします。HashJoinのBuild Hash Tableを例に取ると、以下のカウンターを確認できます：

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
#### システムテーブル
##### backend_active_tasks
SPILL_WRITE_BYTES_TO_LOCAL_STORAGEとSPILL_READ_BYTES_FROM_LOCAL_STORAGEフィールドが追加されました。これらはクエリ実行中の中間結果に対してローカルストレージに書き込まれるデータと読み込まれるデータの現在の総量を表しています。

```
mysql [information_schema]>select * from backend_active_tasks;
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| BE_ID | FE_HOST    | WORKLOAD_GROUP_ID | QUERY_ID                          | TASK_TIME_MS | TASK_CPU_TIME_MS | SCAN_ROWS | SCAN_BYTES | BE_PEAK_MEMORY_BYTES | CURRENT_USED_MEMORY_BYTES | SHUFFLE_SEND_BYTES | SHUFFLE_SEND_ROWS | QUERY_TYPE | SPILL_WRITE_BYTES_TO_LOCAL_STORAGE | SPILL_READ_BYTES_FROM_LOCAL_STORAGE |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
| 10009 | 10.16.10.8 |                 1 | 6f08c74afbd44fff-9af951270933842d |        13612 |            11025 |  12002430 | 1960955904 |            733243057 |                  70113260 |                  0 |                 0 | SELECT     |                          508110119 |                            26383070 |
| 10009 | 10.16.10.8 |                 1 | 871d643b87bf447b-865eb799403bec96 |            0 |                0 |         0 |          0 |                    0 |                         0 |                  0 |                 0 | SELECT     |                                  0 |                                   0 |
+-------+------------+-------------------+-----------------------------------+--------------+------------------+-----------+------------+----------------------+---------------------------+--------------------+-------------------+------------+------------------------------------+-------------------------------------+
2 rows in set (0.00 sec)
```
## テスト
### テスト環境
#### マシン構成
テストでは以下の具体的な構成のAlibaba Cloudサーバーを使用しました：

1FE：

```
16 cores(vCPU) 32 GiB 200 Mbps ecs.c6.4xlarge
```
3BE:

```
16 cores(vCPU) 64 GiB 0 Mbps ecs.g6.4xlarge
```
#### データセット
テストデータは、Alibaba Cloud DLFから取得したTPC-DS 10TBを入力として使用し、Catalogメソッドを使用してDorisにマウントしました。SQLステートメントは以下の通りです：

```
CREATE CATALOG dlf PROPERTIES (
"type"="hms",
"hive.metastore.type" = "dlf",
"dlf.proxy.mode" = "DLF_ONLY",
"dlf.endpoint" = "dlf-vpc.cn-beijing.aliyuncs.com",
"dlf.region" = "cn-beijing",
"dlf.uid" = "217316283625971977",
"dlf.catalog.id" = "emr_dev"
);
```
参考サイト: https://doris.apache.org/zh-CN/docs/dev/benchmark/tpcds

### テスト結果
データセットサイズは10TBでした。メモリとデータセットサイズの比率は1:52でした。全体の実行時間は32,000秒で、99個のクエリすべてが正常に実行されました。今後、より多くのオペレータ（window関数、Intersectなど）にspilling機能を提供し、spilling条件下でのパフォーマンスの最適化を継続し、ディスク消費量を削減し、クエリの安定性を向上させる予定です。

| Query    | Doris |
| ---------- | ------- |
| query1   | 29092 |
| query2   | 130003 |
| query3   | 96119 |
| query4   | 1199097 |
| query5   | 212719 |
| query6   | 62259 |
| query7   | 209154 |
| query8   | 62433 |
| query9   | 579371 |
| query10  | 54260 |
| query11  | 560169 |
| query12  | 26084 |
| query13  | 228756 |
| query14  | 1137097 |
| query15  | 27509 |
| query16  | 84806 |
| query17  | 288164 |
| query18  | 94770 |
| query19  | 124955 |
| query20  | 30970 |
| query21  | 4333 |
| query22  | 9890 |
| query23  | 1757755 |
| query24  | 399553 |
| query25  | 291474 |
| query26  | 79832 |
| query27  | 175894 |
| query28  | 647497 |
| query29  | 1299597 |
| query30  | 11434 |
| query31  | 106665 |
| query32  | 33481 |
| query33  | 146101 |
| query34  | 84055 |
| query35  | 69885 |
| query36  | 148662 |
| query37  | 21598 |
| query38  | 164746 |
| query39  | 5874 |
| query40  | 51602 |
| query41  | 563 |
| query42  | 93005 |
| query43  | 67769 |
| query44  | 79527 |
| query45  | 26575 |
| query46  | 134991 |
| query47  | 161873 |
| query48  | 153657 |
| query49  | 259387 |
| query50  | 141421 |
| query51  | 158056 |
| query52  | 91392 |
| query53  | 89497 |
| query54  | 124118 |
| query55  | 82584 |
| query56  | 152110 |
| query57  | 83417 |
| query58  | 259580 |
| query59  | 177125 |
| query60  | 161729 |
| query61  | 258058 |
| query62  | 39619 |
| query63  | 91258 |
| query64  | 234882 |
| query65  | 278610 |
| query66  | 90246 |
| query67  | 3939554 |
| query68  | 183648 |
| query69  | 11031 |
| query70  | 137901 |
| query71  | 166454 |
| query72  | 2859001 |
| query73  | 92015 |
| query74  | 336694 |
| query75  | 838989 |
| query76  | 174235 |
| query77  | 174525 |
| query78  | 1956786 |
| query79  | 162259 |
| query80  | 602088 |
| query81  | 16184 |
| query82  | 56292 |
| query83  | 26211 |
| query84  | 11906 |
| query85  | 57739 |
| query86  | 34350 |
| query87  | 173631 |
| query88  | 449003 |
| query89  | 113799 |
| query90  | 30825 |
| query91  | 12239 |
| query92  | 26695 |
| query93  | 275828 |
| query94  | 56464 |
| query95  | 64932 |
| query96  | 48102 |
| query97  | 597371 |
| query98  | 112399 |
| query99  | 64472 |
| Sum      | 28102386 |
