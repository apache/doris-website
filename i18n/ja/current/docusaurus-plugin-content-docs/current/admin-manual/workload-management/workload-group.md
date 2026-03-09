---
{
  "title": "ワークロードグループ",
  "language": "ja",
  "description": "ワークロードグループは、ワークロードを分離するためのインプロセスメカニズムです。リソース（CPU、"
}
---
Workload Groupは、ワークロードを分離するためのプロセス内メカニズムです。
BEプロセス内でリソース（CPU、IO、メモリ）を細かく分割または制限することにより、リソース分離を実現します。
その原理を以下の図で示します：

![Workload Group Architecture](/images/workload_group_arch.png)

現在サポートされている分離機能は以下の通りです：

* CPUリソースの管理、cpu hard limitとcpu soft limitの両方をサポート；
* メモリリソースの管理、memory hard limitとmemory soft limitの両方をサポート；
* IOリソースの管理、ローカルファイルとリモートファイルの読み取りによって生成されるIOを含む。

:::tip
Workload Groupはプロセス内リソース分離機能を提供し、プロセス間リソース分離方式（Resource GroupやCompute Groupなど）とは以下の点で異なります：

1. プロセス内リソース分離は完全な分離を実現できません。たとえば、高負荷クエリと低負荷クエリが同じプロセス内で実行される場合、Workload Groupを使用して高負荷グループのCPU使用量を制限し、全体のCPU使用量を適切な範囲内に保ったとしても、低負荷グループの遅延は依然として影響を受ける可能性があります。ただし、CPUコントロールが全くない場合と比較すると、パフォーマンスは向上します。この制限は、共通キャッシュや共有RPCスレッドプールなど、プロセス内の特定の共有コンポーネントを完全に分離することが困難であることに起因します。
2. リソース分離戦略の選択は、分離とコストの間のトレードオフによって決まります。ある程度の遅延を許容でき、低コストを優先する場合、Workload Group分離アプローチが適している可能性があります。一方、完全な分離が必要で高コストを受け入れられる場合、プロセス間リソース分離アプローチ（すなわち、分離されたワークロードを別々のプロセスに配置する）を検討すべきです。たとえば、Resource GroupやCompute Groupを使用して高優先度ワークロードを独立したBEノードに割り当てることで、より徹底的な分離を実現できます。
:::

## バージョンノート

- Workload Group機能はDoris 2.0から利用可能です。Doris 2.0では、Workload Group機能はCGroupに依存しませんが、Doris 2.1以降では、CGroupが必要です。

- Doris 1.2から2.0へのアップグレード：クラスタ全体のアップグレード完了後にのみ、Workload Group機能を有効にすることをお勧めします。一部のfollower FEノードのみをアップグレードした場合、アップグレードされていないFEノードにWorkload Groupメタデータが存在しないため、アップグレードされたfollower FEノード上のクエリが失敗する可能性があります。

- Doris 2.0から2.1へのアップグレード：Doris 2.1のWorkload Group機能はCGroupに依存するため、Doris 2.1にアップグレードする前にCGroup環境を設定する必要があります。

- バージョンDoris 4.0では、元のCPU soft limitとhard limitの概念がmin_cpu_percentとmax_cpu_percentに変更され、memory soft limitとhard limitの概念がmin_memory_percentとmax_memory_percentに変更されました。

## 中核概念

**MIN_CPU_PERCENTとMAX_CPU_PERCENT**

値の範囲は[0%, 100%]です。これらの設定は、CPU競合がある場合にWorkload Group内のすべてのリクエストに対する最小および最大保証CPU帯域幅を定義します。

- MAX_CPU_PERCENT（最大CPU割合）は、グループのCPU帯域幅の上限です。現在のCPU使用量に関係なく、現在のWorkload GroupのCPU使用量はMAX_CPU_PERCENTを超えることはありません。

- MIN_CPU_PERCENT（最小CPU割合）は、Workload Groupに予約されたCPU帯域幅です。競合がある場合、他のグループはこの帯域幅部分を使用できません。ただし、リソースがアイドル状態の場合、MIN_CPU_PERCENTを超える帯域幅を使用できます。

- すべてのWorkload GroupのMIN_CPU_PERCENTの合計は100%を超えてはならず、MIN_CPU_PERCENTはMAX_CPU_PERCENTより大きくてはなりません。

たとえば、企業の営業部門とマーケティング部門が同じDorisインスタンスを共有すると仮定します。営業部門にはCPU集約的なワークロードで高優先度のクエリがあり、マーケティング部門にもCPU集約的なワークロードがありますが、低優先度のクエリです。各部門に個別のWorkload Groupを作成することで、営業Workload Groupに最小CPU割合40%を割り当て、マーケティングWorkload Groupに最大CPU割合30%を割り当てることができます。この設定により、営業ワークロードが必要なCPUリソースを確保し、マーケティングワークロードが営業ワークロードのCPU需要に影響しないことが保証されます。

**MIN_MEMORY_PERCENTとMAX_MEMORY_PERCENT**

値の範囲は[0%, 100%]です。これらの設定は、Workload Groupが使用できる最小および最大メモリ量を表します。

- MAX_MEMORY_PERCENTは、グループでリクエストが実行されている場合、そのメモリ使用量が総メモリのこの割合を超えないことを意味します。超過した場合、クエリはディスクスピルをトリガーするか、killされます。

- MIN_MEMORY_PERCENTは、グループの最小メモリ値を設定します。リソースがアイドル状態の場合、MIN_MEMORY_PERCENTを超えるメモリを使用できます。ただし、メモリが不足した場合、システムはMIN_MEMORY_PERCENT（最小メモリ割合）に従ってメモリを割り当てます。一部のクエリを選択してkillし、Workload Groupのメモリ使用量をMIN_MEMORY_PERCENTまで削減して、他のWorkload Groupが十分なメモリを利用できるようにする場合があります。

- すべてのWorkload GroupのMIN_MEMORY_PERCENTの合計は100%を超えてはならず、MIN_MEMORY_PERCENTはMAX_MEMORY_PERCENTより大きくてはなりません。

**その他の設定**




| Property                     | Data type | Default value | Value range              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|------------------------------|-----------|---------------|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| max_concurrency              | Integer   | 2147483647    | [0, 2147483647]          | オプション。最大クエリ同時実行数を指定します。デフォルト値は整数の最大値で、同時実行数の制限がないことを意味します。実行中のクエリ数が最大同時実行数に達すると、新しいクエリはキューに入ります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| max_queue_size               | Integer   | 0             | [0, 2147483647]          | オプション。クエリ待機キューの長さを指定します。キューが満杯の場合、新しいクエリは拒否されます。デフォルト値は0で、キューなしを意味します。キューが満杯の場合、新しいクエリは直接失敗します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| queue_timeout                | Integer   | 0             | [0, 2147483647]          | オプション。待機キュー内のクエリの最大待機時間をミリ秒単位で指定します。キュー内でのクエリの待機時間がこの値を超えると、例外が直接クライアントにスローされます。デフォルト値は0で、キューなしを意味し、クエリはキューに入ると即座に失敗します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| scan_thread_num              | Integer   | -1            | [1, 2147483647]          | オプション。現在のWorkload Groupでスキャンに使用するスレッド数を指定します。このプロパティが-1に設定されている場合、アクティブでないことを意味し、BE上の実際のスキャンスレッド数はBEのdoris_scanner_thread_pool_thread_num設定にデフォルトで従います。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| max_remote_scan_thread_num   | Integer   | -1            | [1, 2147483647]          | オプション。外部データソースを読み取るためのスキャンスレッドプール内の最大スレッド数を指定します。このプロパティが-1に設定されている場合、実際のスレッド数はBEによって決定され、通常はCPUコア数に基づきます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| min_remote_scan_thread_num   | Integer   | -1            | [1, 2147483647]          | オプション。外部データソースを読み取るためのスキャンスレッドプール内の最小スレッド数を指定します。このプロパティが-1に設定されている場合、実際のスレッド数はBEによって決定され、通常はCPUコア数に基づきます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| read_bytes_per_second        | Integer   | -1            | [1, 9223372036854775807] | オプション。Dorisの内部テーブルを読み取る際の最大I/Oスループットを指定します。デフォルト値は-1で、I/O帯域幅制限が適用されないことを意味します。この値は個々のディスクではなくディレクトリに関連付けられていることに注意することが重要です。たとえば、Dorisが内部テーブルデータを格納するための2つのディレクトリで設定されている場合、各ディレクトリの最大読み取りI/Oはこの値を超えません。両方のディレクトリが同じディスク上にある場合、最大スループットは2倍になります（すなわち、2 × read_bytes_per_second）。spillディスク用のファイルディレクトリもこの制限の対象となります。                                                                                                                                                                                                                                                                      |
| remote_read_bytes_per_second | Integer   | -1            | [1, 9223372036854775807] | オプション。Dorisの外部テーブルを読み取る際の最大I/Oスループットを指定します。デフォルト値は-1で、I/O帯域幅制限が適用されないことを意味します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |



## Workload Groupの設定

### CGroup環境の設定
Workload GroupはCPU、メモリ、IOの管理をサポートしています。CPU管理はCGroupコンポーネントに依存しています。
CPUリソース管理にWorkload Groupを使用するには、まずCGroup環境を設定する必要があります。

CGroup環境を設定する手順は以下の通りです：

1. まず、BEがあるノードにCGroupがインストールされているかを確認します。
出力にcgroupが含まれている場合、現在の環境にCGroup V1がインストールされていることを示しています。
cgroup2が含まれている場合、CGroup V2がインストールされていることを示しています。次のステップでどのバージョンがアクティブかを判断できます。

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
3. CGroupパス配下にdorisという名前のディレクトリを作成します。ディレクトリ名はユーザーがカスタマイズできます。

```shell
If using CGroup V1, create the directory under the cpu directory.
mkdir /sys/fs/cgroup/cpu/doris


If using CGroup V2, create the directory directly under the cgroup directory.
mkdir /sys/fs/cgroup/doris
```
4. Doris BEプロセスがこのディレクトリに対して読み取り、書き込み、および実行権限を持っていることを確認してください。

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
* ルートディレクトリのcgroup.procsファイルの権限を変更します。これは、CGroup v2がより厳格な権限制御を行っており、CGroupディレクトリ間でプロセスを移動するためにルートディレクトリのcgroup.procsファイルへの書き込み権限が必要であるためです。

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```
* CGroup v2では、cgroup.controllersファイルが現在のディレクトリで利用可能なコントローラーをリストし、cgroup.subtree_controlファイルがサブディレクトリで利用可能なコントローラーをリストします。
  そのため、dorisディレクトリでcpuコントローラーが有効になっているかを確認する必要があります。dorisディレクトリのcgroup.controllersファイルにcpuが含まれていない場合、cpuコントローラーが有効になっていないことを意味します。dorisディレクトリで以下のコマンドを実行することで有効にできます。
  このコマンドは、親ディレクトリのcgroup.subtree_controlファイルを変更して、dorisディレクトリがcpuコントローラーを使用できるようにすることで動作します。

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
7. BEを再起動し、ログ（be.INFO）で「add thread xxx to group」という文言が表示されれば設定が成功したことを示します。

:::tip
1. 現在のWorkload Group機能は1台のマシンでの複数のBEインスタンスのデプロイをサポートしていないため、1台のマシンにつき1つのBEのみをデプロイすることを推奨します。
2. マシンの再起動後、CGroupパス下のすべての設定がクリアされます。
CGroup設定を永続化するには、systemdを使用して操作をカスタムシステムサービスとして設定し、
マシンが再起動するたびに作成と認証操作が自動的に実行されるようにできます。
3. コンテナ内でCGroupを使用する場合、コンテナはホストマシンを操作する権限を持つ必要があります。
   :::

#### コンテナでのWorkload Group使用時の考慮事項
WorkloadのCPU管理はCGroupに基づいています。コンテナ内でWorkload Groupを使用したい場合、
コンテナ内のBEプロセスがホストマシンのCGroupファイルを読み書きする権限を持つように、コンテナを特権モードで起動する必要があります。

BEがコンテナ内で実行される場合、Workload GroupのCPUリソース使用量はコンテナの利用可能リソースに基づいて分割されます。
例えば、ホストマシンが64コアを持ち、コンテナに8コアが割り当てられ、
Workload GroupにCPU上限50%が設定されている場合、Workload Groupの実際に利用可能なCPUコア数は4（8コア × 50%）になります。

Workload Groupのメモリ及びIO管理機能はDorisの内部で実装されており、外部コンポーネントに依存しないため、
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
[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP)を参照してください。

この時点で設定されるCPU制限はソフト制限です。バージョン2.1以降、Dorisは自動的にnormalという名前のグループを作成し、これは削除できません。

## ユーザーのWorkload Groupの設定
ユーザーを特定のWorkload Groupにバインドする前に、ユーザーがWorkload Groupに対して必要な権限を持っていることを確認する必要があります。
ユーザーを使用してinformation_schema.workload_groupsシステムテーブルをクエリでき、結果には現在のユーザーがアクセス権限を持つWorkload Groupが表示されます。
以下のクエリ結果は、現在のユーザーがg1およびnormalのWorkload Groupにアクセスできることを示しています。

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```
g1 Workload Groupが表示されない場合は、ADMINアカウントを使用してGRANT文を実行し、ユーザーを認可できます。例：

```
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
```
この文は、user_1にg1という名前のWorkload Groupを使用する権限を付与することを意味します。
詳細については[grant](../../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。

**ユーザーをWorkload Groupにバインドする2つの方法**
1. ユーザープロパティを設定することで、ユーザーをデフォルトのWorkload Groupにバインドできます。デフォルトはnormalです。ここでの値は空にすることができないことに注意が重要です。空にした場合、文が失敗します。

```
set property 'default_workload_group' = 'g1';
```
このステートメントを実行した後、現在のユーザーのクエリはデフォルトで 'g1' Workload Group を使用します。


2. セッション変数を通じて Workload Group を指定する場合、デフォルトは空です：

```
set workload_group = 'g1';
```
両方の方法を使用してユーザーのWorkload Groupを指定した場合、セッション変数がユーザープロパティよりも優先されます。

## Workload Groupの表示
1. SHOW文を使用してWorkload Groupを表示できます：

```
show workload groups;
```
詳細は[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)で確認できます。

2. システムテーブルを通じてWorkload Groupを表示できます：

```
mysql [information_schema]>select * from information_schema.workload_groups where name='g1';
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| ID    | NAME | CPU_SHARE | MEMORY_LIMIT | ENABLE_MEMORY_OVERCOMMIT | MAX_CONCURRENCY | MAX_QUEUE_SIZE | QUEUE_TIMEOUT | CPU_HARD_LIMIT | SCAN_THREAD_NUM | MAX_REMOTE_SCAN_THREAD_NUM | MIN_REMOTE_SCAN_THREAD_NUM | MEMORY_LOW_WATERMARK | MEMORY_HIGH_WATERMARK | TAG  | READ_BYTES_PER_SECOND | REMOTE_READ_BYTES_PER_SECOND |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| 14009 | g1   |      1024 | -1           | true                     |      2147483647 |              0 |             0 | -1             |              -1 |                         -1 |                         -1 | 50%                  | 80%                   |      |                    -1 |                           -1 |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
1 row in set (0.05 sec)
```
## Workload Groupの変更

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
詳細は[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)を参照してください。

## Workload Groupの削除

```
mysql [information_schema]>drop workload group g1;
Query OK, 0 rows affected (0.01 sec)
```
詳細は[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)を参照してください


## Testing
### Memory hard limit
アドホック型クエリは通常、予測不可能なSQL入力と不確実なメモリ使用量を持ち、少数のクエリが大量のメモリを消費するリスクを伴います。
このようなワークロードは別のグループに割り当てることができ、Workload Groupのmemory hard limit機能を使用することで、突発的な大規模クエリがすべてのメモリを消費し、他のクエリが利用可能なメモリを使い果たしたり、OOM（Out of Memory）エラーを引き起こしたりすることを防ぐのに役立ちます。
このWorkload Groupのメモリ使用量が設定されたhard limitを超えた場合、システムはクエリを強制終了してメモリを解放し、プロセスがメモリ不足になることを防ぎます。

**テスト環境**

1 FE、1 BE、BEは96コアと375GBのメモリで構成されています。

テストデータセットはclickbenchで、テスト方法はJMeterを使用してクエリQ29を3つの同時実行で実行します。

**Workload GroupでMemory hard limitを有効にしないテスト**

1. プロセスのメモリ使用量を確認します。psコマンド出力の4番目の列は、プロセスの物理メモリ使用量をキロバイト（KB）単位で表しています。現在のテスト負荷下で、プロセスが約7.7GBのメモリを使用していることを示しています。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7896792
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7929692
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 8101232
    ```
2. Dorisシステムテーブルを使用してWorkload Groupの現在のメモリ使用量を確認します。Workload Groupのメモリ使用量は約5.8GBです。

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
ここでは、1つのWorkload Groupのみが実行されている場合でも、プロセスのメモリ使用量は通常、Workload Groupのメモリ使用量よりもはるかに大きいことがわかります。これは、Workload Groupがクエリとロードによって使用されるメモリのみを追跡するためです。メタデータや各種キャッシュなど、プロセス内の他のコンポーネントによって使用されるメモリは、Workload Groupのメモリ使用量の一部としてカウントされず、Workload Groupによって管理されることもありません。

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
3. psコマンドを使用してプロセスのメモリ使用量を確認します。メモリ使用量は約3.8Gです。

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
エラーメッセージから、Workload Groupが1.7Gのメモリを使用したが、Workload Groupの制限は1.69Gであることが確認できます。計算は以下の通りです：1.69G = 物理マシンメモリ (375G) * mem_limit (be.confの値、デフォルトは0.9) * 0.5% (Workload Groupの設定)。
これは、Workload Groupで設定されたメモリ割合が、BEプロセスで利用可能なメモリに基づいて計算されることを意味します。

**推奨事項**

上記のテストで実証されたように、メモリハード制限はWorkload Groupのメモリ使用量を制御できますが、メモリを解放するためにクエリを終了させることで制御を行います。このアプローチはユーザーエクスペリエンスの低下を招く可能性があり、極端な場合には全てのクエリが失敗する可能性があります。

したがって、本番環境では、メモリハード制限をクエリキューイング機能と組み合わせて使用することを推奨します。これにより、クエリの成功率を維持しながら、制御されたメモリ使用を保証します。



### CPUハード制限
Dorisワークロードは一般的に3つのタイプに分類できます：
1. コアレポートクエリ：これらは通常、会社の役員がレポートを閲覧するために使用されます。負荷はあまり高くないかもしれませんが、可用性要件は厳格です。これらのクエリは、より高い優先度のソフト制限を持つグループに割り当てることができ、リソースが不足している場合により多くのCPUリソースを受け取ることを保証します。
2. Adhocクエリは通常、探索的で分析的な性質を持ち、ランダムなSQLと予測不可能なリソース消費を伴います。その優先度は通常低いです。したがって、CPUハード制限を使用してこれらのクエリを管理し、過剰なCPUリソース使用を防ぎ、クラスタの可用性低下を防ぐためにより低い値を設定できます。
3. ETLクエリは通常、固定されたSQLと安定したリソース消費を持ちますが、上流データの増加によりリソース使用にスパイクが生じる場合があります。したがって、これらのクエリを管理するためにCPUハード制限を設定できます。

異なるワークロードは様々なCPU消費を持ち、ユーザーは異なるレイテンシ要件を持ちます。BE CPUが完全に使用されると、可用性が低下し、応答時間が増加します。例えば、Adhoc分析クエリがクラスタ全体のCPUを完全に使用する可能性があり、コアレポートクエリがより高いレイテンシを経験し、SLAに影響を与えます。したがって、異なるワークロードを分離し、クラスタの可用性とSLAを保証するためにCPU分離メカニズムが必要です。

Workload GroupはCPUソフト制限とハード制限の両方をサポートします。現在、本番環境ではハード制限を持つWorkload Groupsを設定することが推奨されています。これは、CPUソフト制限は通常、CPUが完全に使用されている場合にのみ優先度効果を示すためです。しかし、CPUが完全に使用されると、Doris内部コンポーネント（RPCコンポーネントなど）とオペレーティングシステムの利用可能CPUが削減され、クラスタ全体の可用性が大幅に低下します。したがって、本番環境では、CPUリソースの枯渇を避けることが不可欠であり、同じロジックがメモリなどの他のリソースにも適用されます。

**テスト環境**

1 FE、1 BE、96コアマシン。
データセットはclickbenchで、テストSQLはq29です。

**テスト**
1. JMeterを使用して3つの同時クエリを開始し、BEプロセスのCPU使用率を比較的高い使用率にプッシュします。テストマシンは96コアを持ち、topコマンドを使用すると、BEプロセスのCPU使用率が7600%であることが確認でき、これはプロセスが現在76コアを使用していることを意味します。

   ![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 現在使用されているWorkload GroupのCPUハード制限を10%に変更します。

    ```sql
    alter workload group g2 properties('max_cpu_percent'='10%');
    ```
3. クエリの負荷テストを再実行すると、現在のプロセスが9から10コアしか使用できないことがわかります。これは全コアの約10%です。

   ![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

このテストはクエリワークロードを使用して実施することが重要です。クエリワークロードの方が効果をより反映しやすいためです。負荷テストを行うとCompactionがトリガーされる可能性があり、実際の観測値がWorkload Groupで設定された値よりも高くなる場合があります。現在、CompactionワークロードはWorkload Groupで管理されていません。

4. Linuxシステムコマンドの使用に加えて、Dorisのシステムテーブルを通じてグループの現在のCPU使用率を観測することもできます。CPU使用率は約10%です。

    ```sql
    mysql [information_schema]>select CPU_USAGE_PERCENT from workload_group_resource_usage where WORKLOAD_GROUP_ID=11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```
**注意**

1. 設定時、すべてのグループの合計CPU割り当てを正確に100%に設定しないことを推奨します。これは主に低レイテンシシナリオの可用性を確保するためであり、他のコンポーネント用にいくつかのリソースを予約しておく必要があります。ただし、レイテンシにあまり敏感でなく、最大のリソース使用率を目指すシナリオでは、すべてのグループの合計CPU割り当てを100%に設定することを検討できます。
2. 現在、FEからBEへのWorkload Groupメタデータの同期間隔は30秒です。したがって、Workload Groupの設定変更が有効になるまで最大30秒かかる場合があります。


### ローカルIOの制限
OLAPシステムでは、ETL操作や大規模なAdhocクエリの実行中に、大量のデータを読み取る必要があります。データ分析プロセスを高速化するため、Dorisは複数のディスクファイルにわたってマルチスレッド並列スキャンを使用しますが、これにより大量のディスクIOが生成され、他のクエリ（レポート分析など）に影響を与える可能性があります。
Workload Groupsを使用することで、DorisはオフラインのETLデータ処理とオンラインのレポートクエリを別々にグループ化し、オフラインデータ処理のIO帯域幅を制限できます。これにより、オフラインデータ処理がオンラインレポート分析に与える影響を軽減できます。

**テスト環境**

1 FE、1 BE、96コアマシン。データセット：clickbench。テストクエリ：q29。

**IOハード制限を有効にしないテスト**
1. Cacheをクリアします。

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
3. Dorisのシステムテーブルを通じて、現在のGroupの最大スループットが毎秒3GBであることを確認します。

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
4. pidstatコマンドを使用してプロセスIOを確認します。最初の列はプロセスID、2番目の列は読み取りIOスループット（kb/s単位）です。IOが制限されていない場合、最大スループットは毎秒2GBであることがわかります。

   ![use workload group io](/images/workload-management/use_wg_io_1.png)


**IOハード制限を有効にした後のテスト**
1. キャッシュをクリアします。

    ```sql
    // Clear OS cache.
    sync; echo 3 > /proc/sys/vm/drop_caches

    // disable BE page cache
    disable_storage_page_cache = true
    ```
2. Workload Groupの設定を変更して、最大スループットを毎秒100Mに制限します。

    ```sql
    alter workload group g2 properties('read_bytes_per_second'='104857600');
    ```
3. Dorisのシステムテーブルを使用して、Workload Groupの最大IOスループットが毎秒98Mであることを確認します。

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
1. システムテーブルのLOCAL_SCAN_BYTES_PER_SECONDフィールドは、プロセスレベルでの現在のWorkload Groupの統計の集計値を表します。例えば、12個のファイルパスが設定されている場合、LOCAL_SCAN_BYTES_PER_SECONDはこれら12個のファイルパスの最大IO値です。各ファイルパスのIOスループットを個別に表示したい場合は、Grafanaで詳細値を確認できます。

2. オペレーティングシステムとDorisのPage Cacheの存在により、LinuxのIO監視スクリプトで観測されるIOは、通常システムテーブルで見られるIOよりも小さくなります。


### リモートIOの制限
BrokerLoadとS3Loadは大規模データロードで一般的に使用される方法です。ユーザーは最初にHDFSまたはS3にデータをアップロードし、その後BrokerLoadとS3Loadを使用してデータを並列でロードできます。ロードプロセスを高速化するため、DorisはマルチスレッドでHDFS/S3からデータを取得しますが、これによりHDFS/S3に大きな負荷が発生し、HDFS/S3で実行されている他のジョブを不安定にする可能性があります。

他のワークロードへの影響を軽減するため、Workload Groupのリモート IO制限機能を使用して、HDFS/S3からのロードプロセス中に使用される帯域幅を制限できます。これにより、他のビジネス運用への影響を軽減できます。


**テスト環境**

1つのFEと1つのBEが同じマシンにデプロイされており、16コアと64GBのメモリで構成されています。テストデータはclickbenchデータセットで、テスト前にデータセットをS3にアップロードする必要があります。アップロード時間を考慮して、1000万行のデータのみをアップロードし、その後TVF機能を使用してS3からデータをクエリします。

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
1. clickbenchテーブルでフルテーブルスキャンを実行するシングルスレッドテストを開始する。

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
2. システムテーブルを使用して現在のリモートIOスループットを確認します。このクエリのリモートIOスループットが1秒あたり837MBであることが表示されます。ここでの実際のIOスループットは環境に大きく依存することに注意してください。BEをホストしているマシンが外部ストレージへの帯域幅が制限されている場合、実際のスループットはより低くなる可能性があります。

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
3. sar コマンド（sar -n DEV 1 3600）を使用してマシンのネットワーク帯域幅を監視します。マシンレベルでの最大ネットワーク帯域幅は1秒あたり1033 MBであることを示しています。
   出力の最初の列は、マシン上の特定のネットワークインターフェースが1秒あたりに受信するバイト数を、KB/秒で表しています。

   ![use workload group rio](/images/workload-management/use_wg_rio_1.png)

**リモート読み取りIOの制限をテストする**
1. Workload Groupの設定を変更して、リモート読み取りIOスループットを1秒あたり100Mに制限します。

    ```sql
    alter workload group normal properties('remote_read_bytes_per_second'='104857600');
    ```
2. 単一の並行フルテーブルスキャンクエリを開始します。

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
3. システムテーブルを使用して現在のリモートリードIO スループットを確認します。この時点で、IO スループットは約100M で、いくつかの変動があります。これらの変動は現在のアルゴリズム設計の影響を受けており、通常は短時間でピークに達し、長期間持続することはないため、正常と考えられます。

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
4. sarコマンド（sar -n DEV 1 3600）を使用して、現在のネットワークカードの受信トラフィックを監視します。最初の列は1秒あたりに受信されるデータ量を表します。観測された最大値は現在207M毎秒であり、read IO制限が有効であることを示しています。しかし、sarコマンドはマシンレベルのトラフィックを反映するため、観測された値はDorisが報告する値より若干高くなります。

   ![use workload group rio](/images/workload-management/use_wg_rio_2.png)

## よくある質問
1. CPU hard limitの設定が効かないのはなぜですか？
* これは通常、以下の理由によって引き起こされます：
    * 環境の初期化が失敗しました。Doris CGrroupパス配下の2つの設定ファイルを確認する必要があります。
      ここでは、CGroup V1版を例に取ります。ユーザーがDoris CGrroupパスを```/sys/fs/cgroup/cpu/doris/```として指定している場合、
      まず```/sys/fs/cgroup/cpu/doris/query/1/tasks```の内容にWorkload Groupに対応するスレッドIDが含まれているかを確認する必要があります。
      パス内の「1」はWorkload Group IDを表し、```top -H -b -n 1 -p pid```コマンドを実行してWorkload GroupのスレッドIDを取得できます。
      確認後、Workload GroupのスレッドIDがtasksファイルに書き込まれていることを確認してください。
      次に、```/sys/fs/cgroup/cpu/doris/query/1/cpu.cfs_quota_us```の値が-1かどうかを確認します。-1の場合、CPU hard limitの設定が効いていないことを意味します。
    * Doris BEプロセスのCPU使用率がWorkload Groupに設定されたCPU hard limitより高い。
      これは予想される動作です。Workload Groupが管理するCPUは主にクエリスレッドとLoadのmemtable flushスレッド用だからです。
      しかし、BEプロセスは通常、Compactionなど他のコンポーネントもCPUを消費します。
      そのため、プロセスのCPU使用率は一般的にWorkload Groupに設定された制限より高くなります。
      クエリ負荷のみにストレスをかけるテスト用Workload Groupを作成し、
      システムテーブル```information_schema.workload_group_resource_usage```を通じてWorkload GroupのCPU使用率を確認できます。
      このテーブルはWorkload GroupのCPU使用率のみを記録し、バージョン2.1.6以降でサポートされています。
    * 一部のユーザーが```cpu_resource_limit```を設定しています。まず、```show property for jack like 'cpu_resource_limit'```を実行して
      ユーザーjackのプロパティにこのパラメータが設定されているかを確認します。
      次に、```show variables like 'cpu_resource_limit'```を実行して、セッション変数にこのパラメータが設定されているかを確認します。
      このパラメータのデフォルト値は-1で、設定されていないことを示します。
      このパラメータを設定すると、クエリはWorkload Groupで管理されない独立したスレッドプールで処理されます。このパラメータを直接変更すると本番環境の安定性に影響する可能性があります。
      このパラメータで設定されたクエリ負荷をWorkload Groupで管理するよう段階的に移行することを推奨します。
      現在このパラメータの代替はセッション変数```num_scanner_threads```です。主な手順は以下の通りです：
      まず、```cpu_resource_limit```を設定したユーザーを複数のバッチに分割します。最初のバッチのユーザーを移行する際、
      これらのユーザーのセッション変数```num_scanner_threads```を1に変更します。次に、これらのユーザーにWorkload Groupを割り当てます。その後、
      ```cpu_resource_limit```を-1に変更し、一定期間にわたってクラスターの安定性を観察します。クラスターが安定している場合、次のバッチのユーザーの移行を続けます。

2. デフォルトのWorkload Group数が15に制限されているのはなぜですか？
* Workload Groupは主に単一マシン上のリソース分割に使用されます。
  1つのマシン上にあまりにも多くのWorkload Groupを作成すると、各Workload Groupは非常に少ないリソースしか受け取れません。
  ユーザーが実際にこれほど多くのWorkload Groupを作成する必要がある場合、
  クラスターを複数のBEグループに分割し、各BEグループに異なるWorkload Groupを作成することを検討できます。
  FE設定```workload_group_max_num```を変更することで、一時的にこの制限を回避することもできます。

3. 多くのWorkload Groupを設定した後に「Resource temporarily unavailable」エラーが発生するのはなぜですか？
* 各Workload Groupは独立したスレッドプールに対応します。
  あまりにも多くのWorkload Groupを作成すると、BEプロセスが過度に多くのスレッドを開始しようとして、
  オペレーティングシステムがプロセスに許可する最大スレッド数を超える可能性があります。
  この問題を解決するには、システム環境設定を変更してBEプロセスがより多くのスレッドを作成できるようにします。
