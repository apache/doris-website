---
{
  "title": "ワークロードグループ",
  "language": "ja",
  "description": "Workload Groupはワークロードを分離するためのインプロセスメカニズムです。リソース（CPU、"
}
---
Workload Groupは、ワークロードを分離するためのプロセス内メカニズムです。
BEプロセス内でリソース（CPU、IO、Memory）を細かく分割または制限することで、リソースの分離を実現します。
その原理は以下の図に示されています：

![Workload Group Architecture](/images/workload_group_arch.png)

現在サポートされている分離機能は以下の通りです：

* CPUリソースの管理、cpu hard limitとcpu soft limitの両方をサポート；
* メモリリソースの管理、memory hard limitとmemory soft limitの両方をサポート；
* IOリソースの管理、ローカルファイルとリモートファイルの読み取りで生成されるIOを含む。

:::tip
Workload Groupはプロセス内リソース分離機能を提供しますが、これはプロセス間リソース分離方式（Resource GroupやCompute Groupなど）とは以下の点で異なります：

1. プロセス内リソース分離では完全な分離を実現できません。例えば、高負荷クエリと低負荷クエリが同じプロセス内で実行される場合、Workload Groupを使用して高負荷グループのCPU使用率を制限し、全体的なCPU使用率を適切な範囲内に保ったとしても、低負荷グループのレイテンシには依然として影響を与える可能性があります。ただし、CPUコントロールが全くない場合と比較すると、より良いパフォーマンスを発揮します。この制限は、共通キャッシュや共有RPCスレッドプールなど、プロセス内の特定の共有コンポーネントを完全に分離することが困難であることに起因します。
2. リソース分離戦略の選択は、分離とコストのトレードオフに依存します。ある程度のレイテンシが許容でき、低コストを優先する場合は、Workload Group分離アプローチが適している可能性があります。一方、完全な分離が必要で、より高いコストが許容できる場合は、プロセス間リソース分離アプローチ（すなわち、分離されたワークロードを別々のプロセスに配置する）を検討すべきです。例えば、Resource GroupやCompute Groupを使用して高優先度ワークロードを独立したBEノードに割り当てることで、より徹底的な分離を実現できます。
:::

## バージョンノート

- Workload Group機能はDoris 2.0から利用可能です。Doris 2.0では、Workload Group機能はCGroupに依存しませんが、Doris 2.1以降ではCGroupが必要です。

- Doris 1.2から2.0へのアップグレード：クラスタ全体のアップグレード完了後にWorkload Group機能を有効にすることを推奨します。一部のfollower FEノードのみがアップグレードされた場合、アップグレードされていないFEノードにWorkload Groupメタデータが存在しないため、アップグレードされたfollower FEノードでのクエリが失敗する可能性があります。

- Doris 2.0から2.1へのアップグレード：Doris 2.1のWorkload Group機能はCGroupに依存するため、Doris 2.1にアップグレードする前にCGroup環境を設定する必要があります。

- バージョンDoris 4.0では、従来のCPU soft limitとhard limitの概念がmin_cpu_percentとmax_cpu_percentに変更され、memory soft limitとhard limitの概念がmin_memory_percentとmax_memory_percentに変更されました。

## コアコンセプト

**MIN_CPU_PERCENTとMAX_CPU_PERCENT**

値の範囲は[0%, 100%]です。これらの設定は、CPU競合が発生した際のWorkload Group内すべてのリクエストに対する最小および最大保証CPU帯域幅を定義します。

- MAX_CPU_PERCENT（最大CPU使用率）は、グループのCPU帯域幅の上限です。現在のCPU使用状況に関係なく、現在のWorkload GroupのCPU使用率がMAX_CPU_PERCENTを超えることはありません。

- MIN_CPU_PERCENT（最小CPU使用率）は、Workload Groupに予約されるCPU帯域幅です。競合が発生した場合、他のグループはこの部分の帯域幅を使用できません。ただし、リソースがアイドル状態の時は、MIN_CPU_PERCENTを超える帯域幅を使用できます。

- すべてのWorkload GroupのMIN_CPU_PERCENTの合計は100%を超えてはならず、MIN_CPU_PERCENTはMAX_CPU_PERCENTより大きくすることはできません。

例えば、企業の営業部門とマーケティング部門が同じDorisインスタンスを共有しているとします。営業部門にはCPU集約的なワークロードで高優先度のクエリがあり、マーケティング部門にもCPU集約的なワークロードがありますが低優先度のクエリです。各部門に個別のWorkload Groupを作成することで、営業Workload Groupに最小CPU使用率40%を割り当て、マーケティングWorkload Groupに最大CPU使用率30%を割り当てることができます。この構成により、営業ワークロードが必要なCPUリソースを取得できることを保証し、マーケティングワークロードが営業ワークロードのCPU要求に影響を与えないようにします。

**MIN_MEMORY_PERCENTとMAX_MEMORY_PERCENT**

値の範囲は[0%, 100%]です。これらの設定は、Workload Groupが使用できるメモリの最小量と最大量を表します。

- MAX_MEMORY_PERCENTは、グループでリクエストが実行される際、そのメモリ使用量が総メモリのこの割合を超えることがないことを意味します。超過すると、クエリはディスクスピリングをトリガーするか、強制終了されます。

- MIN_MEMORY_PERCENTは、グループの最小メモリ値を設定します。リソースがアイドル状態の時は、MIN_MEMORY_PERCENTを超えるメモリを使用できます。ただし、メモリが不足している場合、システムはMIN_MEMORY_PERCENT（最小メモリ使用率）に従ってメモリを割り当てます。一部のクエリを選択して強制終了し、Workload Groupのメモリ使用量をMIN_MEMORY_PERCENTまで削減して、他のWorkload Groupに十分なメモリが利用可能であることを保証する可能性があります。

- すべてのWorkload GroupのMIN_MEMORY_PERCENTの合計は100%を超えてはならず、MIN_MEMORY_PERCENTはMAX_MEMORY_PERCENTより大きくすることはできません。

**その他の設定**




| Property                     | Data type | デフォルト値 | Value range              | 詳細                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|------------------------------|-----------|---------------|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| max_concurrency              | Integer   | 2147483647    | [0, 2147483647]          | オプション。最大クエリ同時実行数を指定します。デフォルト値は整数の最大値で、同時実行制限がないことを意味します。実行中のクエリ数が最大同時実行数に達すると、新しいクエリはキューに入ります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| max_queue_size               | Integer   | 0             | [0, 2147483647]          | オプション。クエリ待機キューの長さを指定します。キューが満杯になると、新しいクエリは拒否されます。デフォルト値は0で、キューイングしないことを意味します。キューが満杯の場合、新しいクエリは直接失敗します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| queue_timeout                | Integer   | 0             | [0, 2147483647]          | オプション。待機キューでのクエリの最大待機時間をミリ秒で指定します。キューでのクエリの待機時間がこの値を超えると、例外が直接クライアントに投げられます。デフォルト値は0で、キューイングしないことを意味し、クエリはキューに入ると即座に失敗します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| scan_thread_num              | Integer   | -1            | [1, 2147483647]          | オプション。現在のWorkload Groupでスキャンに使用されるスレッド数を指定します。このプロパティが-1に設定されている場合、アクティブでないことを意味し、BE上の実際のスキャンスレッド数はBEのdoris_scanner_thread_pool_thread_num設定にデフォルト設定されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| max_remote_scan_thread_num   | Integer   | -1            | [1, 2147483647]          | オプション。外部データソースを読み取るためのスキャンスレッドプール内の最大スレッド数を指定します。このプロパティが-1に設定されている場合、実際のスレッド数はBEによって決定され、通常はCPUコア数に基づきます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| min_remote_scan_thread_num   | Integer   | -1            | [1, 2147483647]          | オプション。外部データソースを読み取るためのスキャンスレッドプール内の最小スレッド数を指定します。このプロパティが-1に設定されている場合、実際のスレッド数はBEによって決定され、通常はCPUコア数に基づきます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| read_bytes_per_second        | Integer   | -1            | [1, 9223372036854775807] | オプション。Doris内部テーブルを読み取る際の最大I/Oスループットを指定します。デフォルト値は-1で、I/O帯域幅制限が適用されないことを意味します。この値は個々のディスクではなく、ディレクトリに関連付けられていないことに注意することが重要です。例えば、Dorisが内部テーブルデータを格納するために2つのディレクトリで設定されている場合、各ディレクトリの最大読み取りI/Oはこの値を超えません。両方のディレクトリが同じディスクに配置されている場合、最大スループットは2倍になります（すなわち、2倍のread_bytes_per_second）。スピルディスク用のファイルディレクトリもこの制限の対象となります。                                                                                                                                                                                                                                                      |
| remote_read_bytes_per_second | Integer   | -1            | [1, 9223372036854775807] | オプション。Dorisで外部テーブルを読み取る際の最大I/Oスループットを指定します。デフォルト値は-1で、I/O帯域幅制限が適用されないことを意味します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |



## Workload Groupの設定

### CGroup環境のセットアップ
Workload GroupはCPU、メモリ、IOの管理をサポートします。CPU管理はCGroupコンポーネントに依存しています。
CPUリソース管理にWorkload Groupを使用するには、まずCGroup環境を設定する必要があります。

CGroup環境を設定する手順は以下の通りです：

1. まず、BEが配置されているノードにCGroupがインストールされているかを確認します。
出力にcgroupが含まれている場合、現在の環境にCGroup V1がインストールされていることを示します。
cgroup2が含まれている場合、CGroup V2がインストールされていることを示します。次のステップでどのバージョンがアクティブかを判断できます。

```shell
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```
2. アクティブなCGroupバージョンはパス名に基づいて確認できます。

```shell
If this path exists, it indicates that CGroup V1 is currently active.
/sys/fs/cgroup/cpu/


If this path exists, it indicates that CGroup V2 is currently active.
/sys/fs/cgroup/cgroup.controllers
```
3. CGroupパス下にdorisという名前のディレクトリを作成します。ディレクトリ名はユーザーがカスタマイズできます。

```shell
If using CGroup V1, create the directory under the cpu directory.
mkdir /sys/fs/cgroup/cpu/doris


If using CGroup V2, create the directory directly under the cgroup directory.
mkdir /sys/fs/cgroup/doris
```
4. Doris BEプロセスがこのディレクトリに対して読み取り、書き込み、実行権限を持っていることを確認してください。

```shell
// If using CGroup V1, the command is as follows:
// 1. Modify the directory's permissions to be readable, writable, and executable.
chmod 770 /sys/fs/cgroup/cpu/doris
// 2. Change the ownership of this directory to the doris account.
chown -R doris:doris /sys/fs/cgroup/cpu/doris


// If using CGroup V2, the command is as follows:
// 1.Modify the directory's permissions to be readable, writable, and executable.
chmod 770 /sys/fs/cgroup/doris
// 2. Change the ownership of this directory to the doris account.
chown -R doris:doris /sys/fs/cgroup/doris
```
5. 現在の環境がCGroup v2を使用している場合、以下の手順が必要です。CGroup v1の場合、この手順はスキップできます。
* ルートディレクトリのcgroup.procsファイルの権限を変更します。これは、CGroup v2がより厳格な権限制御を持っており、CGroupディレクトリ間でプロセスを移動するためにルートディレクトリのcgroup.procsファイルへの書き込み権限が必要だからです。

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```
* CGroup v2では、cgroup.controllersファイルが現在のディレクトリで利用可能なコントローラーをリストし、cgroup.subtree_controlファイルがサブディレクトリで利用可能なコントローラーをリストします。
  そのため、dorisディレクトリでcpuコントローラーが有効になっているかを確認する必要があります。dorisディレクトリのcgroup.controllersファイルにcpuが含まれていない場合、cpuコントローラーが有効になっていないことを意味します。dorisディレクトリで以下のコマンドを実行することで有効にできます。
  このコマンドは、親ディレクトリのcgroup.subtree_controlファイルを変更してdorisディレクトリがcpuコントローラーを使用できるようにすることで動作します。

```
// After running this command, you should be able to see the cpu.max file in the doris directory, 
// and the output of cgroup.controllers should include cpu.
// If the command fails, it means that the parent directory of doris also does not have the cpu controller enabled, 
// and you will need to enable the cpu controller for the parent directory.
echo +cpu > ../cgroup.subtree_control
```
6. cgroupのパスを指定するためにBE設定を変更します。

```shell
If using CGroup V1, the configuration path is as follows:
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

If using CGroup V2, the configuration path is as follows:
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```
7. BEを再起動し、ログ(be.INFO)で「add thread xxx to group」という文言があることを確認します。これは設定が成功したことを示しています。

:::tip
1. 現在のWorkload Group機能は単一マシンでの複数BEインスタンスのデプロイをサポートしていないため、マシンごとに1つのBEのみをデプロイすることを推奨します。
2. マシンが再起動されると、CGoupパス下のすべての設定がクリアされます。
CGroupの設定を永続化するには、systemdを使用して操作をカスタムシステムサービスとして設定することで、
マシンが再起動するたびに作成と認証操作を自動的に実行できます。
3. コンテナ内でCGroupを使用する場合、コンテナはホストマシンを操作する権限が必要です。
   :::

#### コンテナでWorkload Groupを使用する際の考慮事項
WorkloadのCPU管理はCGroupに基づいています。コンテナ内でWorkload Groupを使用したい場合、
コンテナ内のBEプロセスがホストマシン上のCGroupファイルの読み書き権限を持つよう、コンテナを特権モードで起動する必要があります。

BEがコンテナ内で動作する場合、Workload GroupのCPUリソース使用量はコンテナの利用可能リソースに基づいて分割されます。
例えば、ホストマシンが64コアを持ち、コンテナに8コアが割り当てられ、
Workload GroupがCPUハード制限50%で設定されている場合、Workload Groupで実際に利用可能なCPUコア数は4コア(8コア * 50%)になります。

Workload Groupのメモリ・IO管理機能はDoris内部で実装されており、外部コンポーネントに依存しないため、
コンテナと物理マシン間でのデプロイに違いはありません。

K8S上でDorisを使用したい場合は、基盤の権限問題を隠蔽できるDoris Operatorを使用してデプロイすることを推奨します。

### Workload Groupの作成

```
mysql [information_schema]>create workload group if not exists g1
    -> properties (
    ->     "cpu_share"="1024"
    -> );
Query OK, 0 rows affected (0.03 sec)

```
[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP) を参照してください。

この時点で設定されるCPU制限はソフトリミットです。バージョン2.1以降、Dorisは自動的にnormalという名前のグループを作成しますが、これは削除できません。

## ユーザーのWorkload Groupを設定する
ユーザーを特定のWorkload Groupにバインドする前に、そのユーザーがWorkload Groupに対して必要な権限を持っていることを確認する必要があります。
ユーザーを使用してinformation_schema.workload_groupsシステムテーブルをクエリすることができ、結果には現在のユーザーがアクセス権限を持つWorkload Groupが表示されます。
以下のクエリ結果は、現在のユーザーがg1とnormalのWorkload Groupにアクセス権限を持っていることを示しています：

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```
g1 Workload Groupが表示されない場合は、ADMINアカウントを使用してGRANT文を実行し、ユーザーを認証できます。例えば：

```
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
```
このステートメントは、user_1にg1という名前のWorkload Groupを使用する権限を付与することを意味します。
詳細については[grant](../../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。

**ユーザーをWorkload Groupにバインドする2つの方法**
1. ユーザープロパティを設定することで、ユーザーをデフォルトのWorkload Groupにバインドできます。デフォルトはnormalです。ここでの値は空にできないことに注意することが重要です。そうでなければ、ステートメントは失敗します。

```
set property 'default_workload_group' = 'g1';
```
この文を実行した後、現在のユーザーのクエリはデフォルトで 'g1' Workload Group を使用するようになります。


2. セッション変数を通じて Workload Group を指定する場合、デフォルトは空です：

```
set workload_group = 'g1';
```
両方の方法を使用してユーザーのWorkload Groupを指定する場合、セッション変数がユーザープロパティよりも優先されます。

## Workload Groupの表示
1. SHOW文を使用してWorkload Groupを表示できます：

```
show workload groups;
```
詳細については[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)を参照してください。

2. システムテーブルを通じてWorkload Groupを確認できます：

```
mysql [information_schema]>select * from information_schema.workload_groups where name='g1';
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| ID    | NAME | CPU_SHARE | MEMORY_LIMIT | ENABLE_MEMORY_OVERCOMMIT | MAX_CONCURRENCY | MAX_QUEUE_SIZE | QUEUE_TIMEOUT | CPU_HARD_LIMIT | SCAN_THREAD_NUM | MAX_REMOTE_SCAN_THREAD_NUM | MIN_REMOTE_SCAN_THREAD_NUM | MEMORY_LOW_WATERMARK | MEMORY_HIGH_WATERMARK | TAG  | READ_BYTES_PER_SECOND | REMOTE_READ_BYTES_PER_SECOND |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| 14009 | g1   |      1024 | -1           | true                     |      2147483647 |              0 |             0 | -1             |              -1 |                         -1 |                         -1 | 50%                  | 80%                   |      |                    -1 |                           -1 |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
1 row in set (0.05 sec)
```
## Workload Group の変更

```
mysql [information_schema]>alter workload group g1 properties('cpu_share'='2048');
Query OK, 0 rows affected (0.00 sec

mysql [information_schema]>select cpu_share from information_schema.workload_groups where name='g1';
+-----------+
| cpu_share |
+-----------+
|      2048 |
+-----------+
1 row in set (0.02 sec)

```
詳細については[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)を参照してください

## Drop Workload Group

```
mysql [information_schema]>drop workload group g1;
Query OK, 0 rows affected (0.01 sec)
```
より詳しい内容は[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)で確認できます。

## Testing
### Memory hard limit
Adhoc型クエリは通常、予測不可能なSQL入力と不確実なメモリ使用量を持ち、少数のクエリが大量のメモリを消費するリスクをもたらします。
このようなタイプのワークロードは別のグループに割り当てることができ、Workload Groupのmemory hard limit機能を使用することで、突然の大きなクエリがすべてのメモリを消費することを防止し、他のクエリが利用可能なメモリを使い果たしたり、OOM（Out of Memory）エラーが発生することを回避できます。
このWorkload Groupのメモリ使用量が設定されたhard limitを超えると、システムはメモリを解放するためにクエリを停止し、プロセスがメモリ不足になることを防ぎます。

**テスト環境**

1 FE、1 BE、BEは96コアと375GBのメモリで構成されています。

テストデータセットはclickbenchで、テスト方法はJMeterを使用してクエリQ29を3つの並行実行で実行することです。

**Workload GroupのMemory hard limitを有効にしないテスト**

1. プロセスのメモリ使用量を確認します。psコマンド出力の4番目の列は、プロセスの物理メモリ使用量をキロバイト（KB）で表しています。現在のテスト負荷下では、プロセスが約7.7GBのメモリを使用していることが示されています。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7896792
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7929692
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 8101232
    ```
2. Dorisのシステムテーブルを使用して、Workload Groupの現在のメモリ使用量を確認します。Workload Groupのメモリ使用量は約5.8GBです。

    ```sql
    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +-------------------+
    | wg_mem_used_mb    |
    +-------------------+
    | 5797.524360656738 |
    +-------------------+
    1 row in set (0.01 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +-------------------+
    | wg_mem_used_mb    |
    +-------------------+
    | 5840.246627807617 |
    +-------------------+
    1 row in set (0.02 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +-------------------+
    | wg_mem_used_mb    |
    +-------------------+
    | 5878.394917488098 |
    +-------------------+
    1 row in set (0.02 sec)
    ```
ここでは、単一のWorkload Groupのみが実行されている場合でも、プロセスメモリ使用量は通常、Workload Groupのメモリ使用量よりもはるかに大きいことがわかります。これは、Workload Groupがクエリとロードで使用されるメモリのみを追跡するためです。メタデータや各種キャッシュなど、プロセス内の他のコンポーネントで使用されるメモリは、Workload Groupのメモリ使用量の一部として計上されず、Workload Groupによって管理されることもありません。

**Workload Groupのメモリハード制限を有効にしたテスト**
1. SQLコマンドを実行してメモリ設定を変更します。

    ```sql
    alter workload group g2 properties('memory_limit'='0.5%');
    alter workload group g2 properties('enable_memory_overcommit'='false');
    ```
2. 同じテストを実行し、システムテーブルでメモリ使用量を確認します。メモリ使用量は約1.5Gです。

    ```sql
    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 1575.3877239227295 |
    +--------------------+
    1 row in set (0.02 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +------------------+
    | wg_mem_used_mb   |
    +------------------+
    | 1668.77405834198 |
    +------------------+
    1 row in set (0.01 sec)

    mysql [information_schema]>select MEMORY_USAGE_BYTES / 1024/ 1024 as wg_mem_used_mb from workload_group_resource_usage where workload_group_id=11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 499.96760272979736 |
    +--------------------+
    1 row in set (0.01 sec)
    ```
3. psコマンドを使用してプロセスのメモリ使用量を確認する。メモリ使用量は約3.8Gである。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4071364
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4059012
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4057068
    ```
4. 同時に、クライアントはメモリ不足によって引き起こされる大量のクエリ失敗を観測することになります。

    ```sql
    1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",并发 1-3,text,false,,444,0,3,3,null,0,0,0
    ```
エラーメッセージから、Workload Groupが1.7Gのメモリを使用しているが、Workload Groupの制限は1.69Gであることが確認できます。計算は以下の通りです：1.69G = 物理マシンメモリ (375G) * mem_limit (be.confの値、デフォルトは0.9) * 0.5% (Workload Groupの設定)。
これは、Workload Groupで設定されたメモリ割合が、BEプロセスで利用可能なメモリに基づいて計算されることを意味します。

**推奨事項**

上記のテストで実証された通り、メモリハードリミットはWorkload Groupのメモリ使用量を制御できますが、メモリを解放するためにクエリを終了することによって制御します。このアプローチはユーザーエクスペリエンスの低下につながり、極端な場合にはすべてのクエリが失敗する可能性があります。

そのため、本番環境では、メモリハードリミットをクエリキューイング機能と組み合わせて使用することが推奨されます。これにより、クエリ成功率を維持しながら、制御されたメモリ使用量を確保できます。



### CPUハードリミット
Dorisワークロードは一般的に3つのタイプに分類できます：
1. コアレポートクエリ：これらは通常、会社の幹部がレポートを閲覧するために使用されます。負荷はそれほど高くないかもしれませんが、可用性要件は厳格です。これらのクエリは、より高い優先度のソフトリミットを持つグループに割り当てることができ、リソースが不足している場合により多くのCPUリソースを確実に受け取れます。
2. Adhocクエリは通常、探索的で分析的な性質を持ち、ランダムなSQLと予測不可能なリソース消費を伴います。その優先度は通常低いです。そのため、CPUハードリミットを使用してこれらのクエリを管理し、クラスター可用性を低下させる可能性がある過剰なCPUリソース使用を防ぐためにより低い値を設定できます。
3. ETLクエリは通常、固定されたSQLと安定したリソース消費を持ちますが、上流データの増加によりリソース使用量が時々急増する場合があります。そのため、これらのクエリを管理するためにCPUハードリミットを設定できます。

異なるワークロードは様々なCPU消費を持ち、ユーザーは異なるレイテンシ要件を持ちます。BE CPUが完全に利用されると、可用性が低下し、応答時間が増加します。例えば、Adhoc分析クエリがクラスター全体のCPUを完全に利用すると、コアレポートクエリでより高いレイテンシが発生し、SLAに影響します。そのため、異なるワークロードを分離し、クラスター可用性とSLAを確保するためのCPU分離メカニズムが必要です。

Workload GroupはCPUソフトリミットとハードリミットの両方をサポートします。現在、本番環境ではハードリミットを持つWorkload Groupを設定することが推奨されています。これは、CPUソフトリミットは通常、CPUが完全に利用されている場合にのみ優先度効果を示すためです。しかし、CPUが完全に使用されると、Doris内部コンポーネント（RPCコンポーネントなど）とオペレーティングシステムの利用可能CPUが削減され、クラスター全体の可用性が大幅に低下します。そのため、本番環境では、CPUリソースの枯渇を避けることが不可欠であり、同じロジックがメモリなどの他のリソースにも適用されます。

**テスト環境**

1 FE、1 BE、96コアマシン。
データセットはclickbenchで、テストSQLはq29です。

**テスト**
1. JMeterを使用して3つの同時クエリを開始し、BEプロセスのCPU使用率を比較的高い使用率まで押し上げます。テストマシンは96コアで、topコマンドを使用すると、BEプロセスのCPU使用率が7600%であることがわかります。これはプロセスが現在76コアを使用していることを意味します。

   ![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 現在使用しているWorkload GroupのCPUハードリミットを10%に変更します。

    ```sql
    alter workload group g2 properties('max_cpu_percent'='10%');
    ```
3. クエリの負荷テストを再実行すると、現在のプロセスが9から10コアしか使用できず、これは総コア数の約10%であることがわかります。

   ![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

このテストはクエリワークロードを使用して実施することが重要です。これらの方が効果を反映しやすいためです。負荷テストを行うと、Compactionがトリガーされ、実際に観測される値がWorkload Groupで設定された値よりも高くなる可能性があります。現在、CompactionワークロードはWorkload Groupの管理下にありません。

4. Linuxシステムコマンドの使用に加えて、Dorisのシステムテーブルからグループの現在のCPU使用率を観測することもできます。CPU使用率は約10%です。

    ```sql
    mysql [information_schema]>select CPU_USAGE_PERCENT from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```
**note**

1. 設定時には、全グループのCPU総割り当てを正確に100%に設定しないことをお勧めします。これは主に低レイテンシシナリオの可用性を確保するためで、他のコンポーネント用にいくつかのリソースを予約する必要があるからです。ただし、レイテンシにそれほど敏感でなく、最大限のリソース利用を目指すシナリオでは、全グループのCPU総割り当てを100%に設定することを検討できます。
2. 現在、FEからBEへのWorkload Groupメタデータの同期間隔は30秒です。したがって、Workload Group設定の変更が有効になるまでに最大30秒かかる場合があります。


### ローカルIOの制限
OLAPシステムでは、ETL操作や大規模なAdhocクエリの際に、大量のデータを読み取る必要があります。データ分析プロセスを高速化するため、Dorisは複数のディスクファイルにわたってマルチスレッド並列スキャンを使用しますが、これにより大量のディスクIOが発生し、他のクエリ（レポート分析など）に影響を与える可能性があります。
Workload Groupsを使用することで、DorisはオフラインのETLデータ処理とオンラインのレポートクエリを別々にグループ化し、オフラインデータ処理のIO帯域幅を制限できます。これにより、オフラインデータ処理がオンラインレポート分析に与える影響を軽減できます。

**テスト環境**

1 FE、1 BE、96コアマシン。データセット：clickbench。テストクエリ：q29。

**IOハード制限を有効にしないテスト**
1. Clear Cache.

    ```sql
    // clear OS cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    // disable BE page cache
    disable_storage_page_cache = true
    ```
2. clickbenchテーブルでフルテーブルスキャンを実行し、単一の同時クエリを実行します。

    ```sql
    set dry_run_query = true;
    select * from hits.hits;
    ```
3. Dorisのシステムテーブルを通じて、現在のGroupの最大スループットが1秒あたり3GBであることを確認します。

    ```sql
    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 1146.6208400726318 |
    +--------------------+
    1 row in set (0.03 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 3496.2762966156006 |
    +--------------------+
    1 row in set (0.04 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 2192.7690029144287 |
    +--------------------+
    1 row in set (0.02 sec)
    ```
4. pidstatコマンドを使用してプロセスIOを確認します。最初の列はプロセスID、2番目の列は読み取りIOスループット（kb/s単位）です。IOが制限されていない場合、最大スループットは1秒あたり2GBであることがわかります。

   ![use workload group io](/images/workload-management/use_wg_io_1.png)


**IOハード制限を有効にした後のテスト**
1. キャッシュをクリアします。

    ```sql
    // Clear OS cache.
    sync; echo 3 > /proc/sys/vm/drop_caches

    // disable BE page cache
    disable_storage_page_cache = true
    ```
2. Workload Group設定を変更して、最大スループットを毎秒100Mに制限します。

    ```sql
    alter workload group g2 properties('read_bytes_per_second'='104857600');
    ```
3. Doris システムテーブルを使用して、Workload Group の最大 IO スループットが毎秒 98M であることを確認します。

    ```sql
    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 97.94296646118164  |
    +--------------------+
    1 row in set (0.03 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.37584781646729  |
    +--------------------+
    1 row in set (0.04 sec)

    mysql [information_schema]>select LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 as mb_per_sec from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.06641292572021  |
    +--------------------+
    1 row in set (0.02 sec)
    ```
4. pidツールを使用して、プロセスの最大IOスループットが毎秒131Mであることを確認します。

   ![use workload group io](/images/workload-management/use_wg_io_2.png)

**注意**
1. システムテーブルのLOCAL_SCAN_BYTES_PER_SECONDフィールドは、プロセスレベルでの現在のWorkload Groupの統計の要約値を表します。例えば、12個のファイルパスが設定されている場合、LOCAL_SCAN_BYTES_PER_SECONDはこれら12個のファイルパスの最大IO値です。各ファイルパスのIOスループットを個別に確認したい場合は、Grafanaで詳細な値を確認できます。

2. オペレーティングシステムとDorisのPage Cacheの存在により、LinuxのIO監視スクリプトを通じて観測されるIOは、通常システムテーブルで確認されるIOよりも小さくなります。


### リモートIOの制限
BrokerLoadとS3Loadは、大規模データ読み込みによく使用される方法です。ユーザーはまずデータをHDFSやS3にアップロードし、その後BrokerLoadとS3Loadを使用してデータを並列で読み込むことができます。読み込みプロセスを高速化するため、DorisはマルチスレッドでHDFS/S3からデータを取得しますが、これによりHDFS/S3に大きな負荷が発生し、HDFS/S3で実行されている他のジョブを不安定にする可能性があります。

他のワークロードへの影響を軽減するため、Workload GroupのリモートIO制限機能を使用して、HDFS/S3からの読み込みプロセス中に使用される帯域幅を制限できます。これにより、他の業務運用への影響を減らすことができます。


**テスト環境**

1つのFEと1つのBEが同じマシンにデプロイされ、16コアと64GBメモリで構成されています。テストデータはclickbenchデータセットで、テスト前にデータセットをS3にアップロードする必要があります。アップロード時間を考慮して、1000万行のデータのみをアップロードし、その後TVF関数を使用してS3からデータをクエリします。

アップロードが成功した後、コマンドを使用してスキーマ情報を確認できます。

    ```sql
    DESC FUNCTION s3 (
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key"= "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style"="true"
    );
    ```
**リモート読み取りIOを制限しないテスト**
1. clickbenchテーブルでフルテーブルスキャンを実行するシングルスレッドテストを開始します。

    ```sql
    // Set the operation to only scan the data without returning results.
    set dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key"= "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style"="true"
    );
    ```
2. システムテーブルを使用して現在のリモートIOスループットを確認します。このクエリのリモートIOスループットは毎秒837 MBであることが示されています。ここでの実際のIOスループットは環境に大きく依存することに注意してください。BEをホストしているマシンの外部ストレージへの帯域幅が制限されている場合、実際のスループットはより低くなる可能性があります。

    ```sql
    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     837 |
    +---------+
    1 row in set (0.104 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.070 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.186 sec)
    ```
3. sarコマンド（sar -n DEV 1 3600）を使用してマシンのネットワーク帯域幅を監視します。これにより、マシンレベルでの最大ネットワーク帯域幅が1秒あたり1033MBであることが示されます。
   出力の最初の列は、マシン上の特定のネットワークインターフェースが1秒あたりに受信したバイト数を、KB/秒で表します。

   ![use workload group rio](/images/workload-management/use_wg_rio_1.png)

**リモート読み取りIOの制限をテストする**
1. Workload Groupの設定を変更して、リモート読み取りIOスループットを1秒あたり100Mに制限します。

    ```sql
    alter workload group normal properties('remote_read_bytes_per_second'='104857600');
    ```
2. 単一の同時実行フルテーブルスキャンクエリを開始します。

    ```sql
    set dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key"= "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style"="true"
    );
    ```
3. システムテーブルを使用して、現在のリモート読み取りIOスループットを確認します。この時点で、IOスループットは約100M程度で、いくらかの変動があります。これらの変動は現在のアルゴリズム設計の影響を受けており、通常は短時間でピークに達し、長期間持続することはないため、正常と考えられます。

    ```sql
    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |      56 |
    +---------+
    1 row in set (0.010 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     131 |
    +---------+
    1 row in set (0.009 sec)

    MySQL [(none)]> select cast(REMOTE_SCAN_BYTES_PER_SECOND/1024/1024 as int) as read_mb from information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     111 |
    +---------+
    1 row in set (0.009 sec)
    ```
4. sarコマンド（sar -n DEV 1 3600）を使用して、現在のネットワークカードの受信トラフィックを監視します。最初の列は1秒あたりに受信されるデータ量を表します。観測された最大値は現在207M/秒であり、読み取りIO制限が有効であることを示しています。ただし、sarコマンドはマシンレベルのトラフィックを反映するため、観測された値はDorisが報告する値よりもわずかに高くなります。

   ![use workload group rio](/images/workload-management/use_wg_rio_2.png)

## よくある質問
1. CPU hard limit設定が有効にならないのはなぜですか？
* これは通常、以下の理由によって引き起こされます：
    * 環境の初期化に失敗しました。Doris CGrupのパス下の2つの設定ファイルを確認する必要があります。
      ここでは、CGroup V1バージョンを例に取ります。ユーザーがDoris CGroupパスを```/sys/fs/cgroup/cpu/doris/```として指定している場合、
      まず```/sys/fs/cgroup/cpu/doris/query/1/tasks```の内容にWorkload Groupに対応するスレッドIDが含まれているかを確認する必要があります。
      パス内の「1」はWorkload Group IDを表し、これは```top -H -b -n 1 -p pid```コマンドを実行してWorkload GroupのスレッドIDを見つけることで取得できます。
      確認後、Workload GroupのスレッドIDがtasksファイルに書き込まれていることを確認してください。
      その後、```/sys/fs/cgroup/cpu/doris/query/1/cpu.cfs_quota_us```の値が-1かどうかを確認します。-1の場合、CPU hard limit設定が有効になっていないことを意味します。
    * Doris BEプロセスのCPU使用率が、Workload Groupに設定されたCPU hard limitよりも高くなっています。
      これは、Workload Groupによって管理されるCPUが主にクエリスレッドとLoadのmemtable flushスレッド用であるため、予想されることです。
      ただし、BEプロセスには通常、Compactionなど、CPUを消費する他のコンポーネントもあります。
      したがって、プロセスのCPU使用率は通常、Workload Groupに設定された制限よりも高くなります。
      クエリ負荷のみにストレスをかけるテスト用Workload Groupを作成し、
      システムテーブル```information_schema.workload_group_resource_usage```を通じてWorkload GroupのCPU使用率を確認できます。
      このテーブルはWorkload GroupのCPU使用率のみを記録し、バージョン2.1.6以降でサポートされています。
    * 一部のユーザーが```cpu_resource_limit```を設定しています。まず、```show property for jack like 'cpu_resource_limit'```を実行して
      ユーザーjackのプロパティでこのパラメータが設定されているかを確認します。
      次に、```show variables like 'cpu_resource_limit'```を実行して、セッション変数でこのパラメータが設定されているかを確認します。
      このパラメータのデフォルト値は-1で、設定されていないことを示します。
      このパラメータを設定すると、クエリはWorkload Groupによって管理されない独立したスレッドプールで処理されます。このパラメータを直接変更すると、本番環境の安定性に影響を与える可能性があります。
      このパラメータで設定されたクエリ負荷をWorkload Groupによる管理に段階的に移行することをお勧めします。
      このパラメータの現在の代替案はセッション変数```num_scanner_threads```です。主なプロセスは以下の通りです：
      まず、```cpu_resource_limit```を設定したユーザーを複数のバッチに分けます。最初のバッチのユーザーを移行する際、
      これらのユーザーのセッション変数```num_scanner_threads```を1に変更します。次に、これらのユーザーにWorkload Groupを割り当てます。その後、
      ```cpu_resource_limit```を-1に変更し、一定期間にわたってクラスターの安定性を観察します。クラスターが安定している場合、次のバッチのユーザーの移行を続行します。

2. デフォルトのWorkload Group数が15に制限されているのはなぜですか？
* Workload Groupは主に単一マシン上のリソース分割に使用されます。
  1つのマシン上に多数のWorkload Groupが作成されると、各Workload Groupが受け取るリソースの割合が非常に小さくなります。
  ユーザーが実際にこれほど多くのWorkload Groupを作成する必要がある場合、
  クラスターを複数のBEグループに分割し、各BEグループに対して異なるWorkload Groupを作成することを検討できます。
  また、FE設定```workload_group_max_num```を変更することで、この制限を一時的に回避することもできます。

3. 多くのWorkload Groupを設定した後に「Resource temporarily unavailable」エラーが発生するのはなぜですか？
* 各Workload Groupは独立したスレッドプールに対応します。
  あまりに多くのWorkload Groupを作成すると、BEプロセスが多数のスレッドを開始しようとし、
  オペレーティングシステムがプロセスに許可する最大スレッド数を超える可能性があります。
  この問題を解決するには、BEプロセスがより多くのスレッドを作成できるようにシステム環境設定を変更できます。
