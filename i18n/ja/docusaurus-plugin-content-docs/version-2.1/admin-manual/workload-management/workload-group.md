---
{
  "title": "ワークロードグループ",
  "language": "ja",
  "description": "Workload Groupは、ワークロードを分離するためのインプロセス機構です。リソース（CPU、"
}
---
Workload Groupは、ワークロードを分離するためのインプロセス機能です。
BEプロセス内でリソース（CPU、IO、Memory）を細かく分割または制限することで、リソース分離を実現します。
その原理を以下の図に示します：

![workload_group](/images/workload_group_arch.png)

現在サポートされている分離機能には以下が含まれます：

* CPUリソースの管理、cpu hard limitとcpu soft limitの両方をサポート
* メモリリソースの管理、memory hard limitとmemory soft limitの両方をサポート
* IOリソースの管理、ローカルファイルとリモートファイルの読み取りによって生成されるIOを含む

:::tip
Workload Groupはインプロセスリソース分離機能を提供しますが、これはプロセス間リソース分離方式（Resource GroupやCompute Groupなど）と以下の点で異なります：

1. インプロセスリソース分離では完全な分離を実現できません。例えば、高負荷クエリと低負荷クエリが同一プロセス内で実行される場合、Workload Groupを使用して高負荷グループのCPU使用量を制限し、全体のCPU使用量を適切な範囲内に保ったとしても、低負荷グループの遅延に影響が出る可能性があります。ただし、CPU制御を全く行わない場合と比較すると、パフォーマンスは向上します。この制限は、共通キャッシュや共有RPCスレッドプールなど、プロセス内の特定の共有コンポーネントを完全に分離することが困難であるために生じます。
2. リソース分離戦略の選択は、分離とコストのトレードオフに依存します。ある程度の遅延を許容でき、低コストを優先する場合は、Workload Group分離アプローチが適している可能性があります。一方、完全な分離が必要で、高コストを受け入れられる場合は、プロセス間リソース分離アプローチ（つまり、分離されたワークロードを別々のプロセスに配置する）を検討すべきです。例えば、Resource GroupやCompute Groupを使用して高優先度ワークロードを独立したBEノードに割り当てることで、より徹底的な分離を実現できます。
   :::

## バージョンに関する注意事項

- Workload Group機能はDoris 2.0から利用可能です。Doris 2.0では、Workload Group機能はCGroupに依存しませんが、Doris 2.1以降ではCGroupが必要です。

- Doris 1.2から2.0へのアップグレード：クラスタ全体のアップグレードが完了した後にWorkload Group機能を有効にすることを推奨します。一部のfollower FEノードのみがアップグレードされた場合、アップグレードされていないFEノードにWorkload Groupメタデータが存在しないため、アップグレードされたfollower FEノードでのクエリが失敗する可能性があります。

- Doris 2.0から2.1へのアップグレード：Doris 2.1のWorkload Group機能はCGroupに依存するため、Doris 2.1にアップグレードする前にCGroup環境を設定する必要があります。

## Workload Groupの設定

### CGroup環境の設定
Workload GroupはCPU、メモリ、IOの管理をサポートします。CPU管理はCGroupコンポーネントに依存します。
Workload GroupでCPUリソース管理を使用するには、まずCGroup環境を設定する必要があります。

CGroup環境を設定する手順は以下のとおりです：

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
3. CGroupパスの下にdorisという名前のディレクトリを作成します。ディレクトリ名はユーザーがカスタマイズできます。

```shell
If using CGroup V1, create the directory under the cpu directory.
mkdir /sys/fs/cgroup/cpu/doris


If using CGroup V2, create the directory directly under the cgroup directory.
mkdir /sys/fs/cgroup/doris
```
4. Doris BEプロセスがこのディレクトリに対して読み取り、書き込み、実行の権限を持っていることを確認してください。

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
* ルートディレクトリのcgroup.procsファイルの権限を変更します。これは、CGroup v2がより厳格な権限制御を持っており、CGroupディレクトリ間でプロセスを移動するためにルートディレクトリのcgroup.procsファイルへの書き込み権限が必要であるためです。

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```
* CGroup v2では、cgroup.controllersファイルは現在のディレクトリで利用可能なcontrollerを一覧表示し、cgroup.subtree_controlファイルはサブディレクトリで利用可能なcontrollerを一覧表示します。
  したがって、dorisディレクトリでcpu controllerが有効になっているかどうかを確認する必要があります。dorisディレクトリのcgroup.controllersファイルにcpuが含まれていない場合、cpu controllerが有効になっていないことを意味します。dorisディレクトリで以下のコマンドを実行することで有効にできます。
  このコマンドは、親ディレクトリのcgroup.subtree_controlファイルを変更してdorisディレクトリがcpu controllerを使用できるようにすることで動作します。

```
// After running this command, you should be able to see the cpu.max file in the doris directory, 
// and the output of cgroup.controllers should include cpu.
// If the command fails, it means that the parent directory of doris also does not have the cpu controller enabled, 
// and you will need to enable the cpu controller for the parent directory.
echo +cpu > ../cgroup.subtree_control
```
6. cgroup のパスを指定するように BE 設定を変更します。

```shell
If using CGroup V1, the configuration path is as follows:
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

If using CGroup V2, the configuration path is as follows:
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```
7. BEを再起動し、ログ（be.INFO）で「add thread xxx to group」というフレーズが表示されれば、設定が成功したことを示します。

:::tip
1. 現在のWorkload Group機能は単一マシンでの複数のBEインスタンスのデプロイをサポートしていないため、マシンごとに1つのBEのみをデプロイすることを推奨します。
2. マシンの再起動後、CGroupパス下のすべての設定はクリアされます。
CGroup設定を永続化するには、systemdを使用してカスタムシステムサービスとして操作を設定し、
マシンの再起動のたびに作成および認可操作が自動的に実行されるようにすることができます。
3. コンテナ内でCGroupを使用する場合、コンテナはホストマシンを操作する権限を持つ必要があります。
   :::

#### コンテナでWorkload Groupを使用する際の考慮事項
WorkloadのCPU管理はCGroupをベースにしています。コンテナ内でWorkload Groupを使用したい場合、
コンテナ内のBEプロセスがホストマシンのCGroupファイルを読み書きする権限を持つように、コンテナを特権モードで起動する必要があります。

BEがコンテナ内で実行される場合、Workload GroupのCPUリソース使用量はコンテナの利用可能リソースに基づいて分割されます。
例えば、ホストマシンが64コアを持ち、コンテナに8コアが割り当てられ、
Workload Groupが50%のCPUハード制限で設定されている場合、Workload Groupで実際に利用可能なCPUコア数は4コア（8コア * 50%）になります。

Workload Groupのメモリおよび IO 管理機能はDoris内部で実装されており、外部コンポーネントに依存しないため、
コンテナと物理マシン間でのデプロイに違いはありません。

K8SでDorisを使用したい場合は、基盤の権限問題を隠蔽できるDoris Operatorを使用してデプロイすることを推奨します。

### Workload Groupの作成

```
mysql [information_schema]>create workload group if not exists g1
    -> properties (
    ->     "cpu_share"="1024"
    -> );
Query OK, 0 rows affected (0.03 sec)

```
[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP)を参照できます。

この時点で設定されるCPU制限はソフト制限です。バージョン2.1以降、DorisはnormalというグループBを自動的に作成し、これは削除できません。

### Workload Groupプロパティ


| Property                     | Data type | Default value | Value range              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
|------------------------------|-----------|---------------|--------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| cpu_share                    | Integer   | -1            | [1, 10000]               | オプション、CPUソフト制限モードで有効。値の有効範囲は使用されているCGroupのバージョンに依存し、詳細は後述します。cpu_shareはWorkload GroupがCPU時間を取得できる重みを表し、値が大きいほど多くのCPU時間を取得できます。例えば、ユーザーがg-a、g-b、g-cという3つのWorkload Groupを作成し、cpu_share値がそれぞれ10、30、40で、ある時点でg-aとg-bがタスクを実行中でg-cにタスクがない場合、g-aはCPUリソースの25%（10 / (10 + 30)）を受け取り、g-bはCPUリソースの75%を受け取ります。システムで1つのWorkload Groupのみが実行されている場合、cpu_share値に関係なく、全てのCPUリソースを取得できます。                                                                                                                                                                                                  |
| memory_limit                 | Float     | -1            | (0%, 100%]               | オプション。メモリハード制限を有効にすると、現在のWorkload Groupの最大利用可能メモリ割合を表します。デフォルト値はメモリ制限が適用されないことを意味します。全Workload Groupのmemory_limitの累積値は100%を超えることはできず、通常はenable_memory_overcommit属性と併用されます。例えば、マシンが64GBのメモリを持ち、Workload Groupのmemory_limitが50%に設定されている場合、そのグループで利用可能な実際の物理メモリは64GB * 90% * 50% = 28.8GBとなります。ここで90%はBEプロセスの利用可能メモリ設定のデフォルト値です。                                                                                                                                                                                                                                                                                                                              |
| enable_memory_overcommit     | Boolean   | true          | true, false              | オプション。現在のWorkload Groupのメモリ制限がハード制限かソフト制限かを制御するために使用され、デフォルトはtrueに設定されます。falseに設定した場合、Workload Groupはハードメモリ制限を持ち、システムがメモリ使用量が制限を超えたことを検出すると、グループ内で最もメモリ使用量の多いタスクを即座にキャンセルして余分なメモリを解放します。trueに設定した場合、Workload Groupはソフトメモリ制限を持ちます。空きメモリが利用可能な場合、Workload Groupはmemory_limitを超えてもシステムメモリを使用し続けることができます。システムの総メモリが圧迫状態にある場合、システムはグループ内で最もメモリ使用量の多いタスクをキャンセルし、システムメモリ圧迫を緩和するために余分なメモリの一部を解放します。BEプロセスの他のコンポーネント用にメモリを確保するため、全Workload Groupの総memory_limitを100%未満に保つことを推奨します。 |
| cpu_hard_limit               | Integer   | -1            | [1%, 100%]               | オプション。CPUハード制限モードで有効で、Workload Groupが使用できる最大CPU割合を表します。マシンのCPUリソースが完全に使用されているかに関係なく、Workload GroupのCPU使用量はcpu_hard_limitを超えることはできません。全Workload Groupのcpu_hard_limitの累積値は100%を超えることはできません。この属性はバージョン2.1で導入され、バージョン2.0ではサポートされていません。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| max_concurrency              | Integer   | 2147483647    | [0, 2147483647]          | オプション。最大クエリ同時実行数を指定します。デフォルト値は整数の最大値で、同時実行制限がないことを意味します。実行中のクエリ数が最大同時実行数に達すると、新しいクエリはキューに入ります。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| max_queue_size               | Integer   | 0             | [0, 2147483647]          | オプション。クエリ待機キューの長さを指定します。キューが満杯の場合、新しいクエリは拒否されます。デフォルト値は0で、キューイングなしを意味します。キューが満杯の場合、新しいクエリは直接失敗します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| queue_timeout                | Integer   | 0             | [0, 2147483647]          | オプション。待機キューでのクエリの最大待機時間をミリ秒で指定します。キューでのクエリ待機時間がこの値を超えると、クライアントに直接例外がスローされます。デフォルト値は0で、キューイングなしを意味し、クエリはキューに入ると即座に失敗します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| scan_thread_num              | Integer   | -1            | [1, 2147483647]          | オプション。現在のWorkload Groupでスキャンに使用されるスレッド数を指定します。このプロパティが-1に設定されている場合、アクティブでないことを意味し、BE上の実際のスキャンスレッド数はBEのdoris_scanner_thread_pool_thread_num設定にデフォルト設定されます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| max_remote_scan_thread_num   | Integer   | -1            | [1, 2147483647]          | オプション。外部データソースを読み取るためのスキャンスレッドプール内の最大スレッド数を指定します。このプロパティが-1に設定されている場合、実際のスレッド数はBEによって決定され、通常はCPUコア数に基づきます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| min_remote_scan_thread_num   | Integer   | -1            | [1, 2147483647]          | オプション。外部データソースを読み取るためのスキャンスレッドプール内の最小スレッド数を指定します。このプロパティが-1に設定されている場合、実際のスレッド数はBEによって決定され、通常はCPUコア数に基づきます。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| read_bytes_per_second        | Integer   | -1            | [1, 9223372036854775807] | オプション。Dorisの内部テーブルを読み取る際の最大I/Oスループットを指定します。デフォルト値は-1で、I/O帯域幅制限が適用されないことを意味します。この値は個別のディスクではなくディレクトリに関連付けられていることに注意することが重要です。例えば、Dorisが内部テーブルデータを格納するために2つのディレクトリで設定されている場合、各ディレクトリの最大読み取りI/Oはこの値を超えません。両方のディレクトリが同じディスクに配置されている場合、最大スループットは2倍になります（つまり、2 × read_bytes_per_second）。spillディスク用のファイルディレクトリもこの制限の対象となります。                                                                                                                                                                                                                                                                      |
| remote_read_bytes_per_second | Integer   | -1            | [1, 9223372036854775807] | オプション。Dorisの外部テーブルを読み取る際の最大I/Oスループットを指定します。デフォルト値は-1で、I/O帯域幅制限が適用されないことを意味します。                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

:::tip

1. 現在、CPUハード制限とCPUソフト制限の同時使用はサポートされていません。
任意の時点で、クラスターはソフト制限またはハード制限のいずれかのみを持つことができます。それらの切り替え方法については後述します。

2. 全てのプロパティはオプションですが、Workload Groupを作成する際には少なくとも1つのプロパティを指定する必要があります。

3. CPUソフト制限のデフォルト値はCGroup v1とCGroup v2で異なることに注意することが重要です。CGroup v1のデフォルトCPUソフト制限は1024で、有効範囲は2から262144であり、CGroup v2のデフォルトは100で、有効範囲は1から10000です。
   ソフト制限に範囲外の値を設定すると、BEでのCPUソフト制限変更が失敗する可能性があります。CGroup v2のデフォルト値100がCGroup v1環境で適用されると、このWorkload Groupがマシン上で最も低い優先度を持つ結果となる可能性があります。

4. CPUソフト制限は相対的な重み割り当てです：タスクが消費する絶対的なCPU時間を制限するものではありません。代わりに、CPUリソースが競合している場合（全体使用率≥100%）に、割り当てられた重みに比例してCPU時間スライスを配分します。CPUがアイドル状態の場合、タスクは制限なく利用可能な全てのCPUリソースを消費できます。そのため、実際の効果を評価することは非常に困難であり、本番環境ではCPUハード制限の使用を推奨します。
   :::

## ユーザーにWorkload Groupを設定する
ユーザーを特定のWorkload Groupにバインドする前に、ユーザーがWorkload Groupに対して必要な権限を持っていることを確認する必要があります。
ユーザーを使用してinformation_schema.workload_groupsシステムテーブルをクエリでき、結果は現在のユーザーがアクセス権限を持つWorkload Groupsを表示します。
以下のクエリ結果は、現在のユーザーがg1とnormal Workload Groupsにアクセス権限を持っていることを示しています：

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
このステートメントは、user_1にg1という名前のWorkload Groupを使用する権限を付与することを意味します。
詳細については[grant](../../sql-manual/sql-statements/account-management/GRANT-TO)を参照してください。

**ユーザーにWorkload Groupをバインドする2つの方法**
1. ユーザープロパティを設定することで、ユーザーをデフォルトのWorkload Groupにバインドできます。デフォルトはnormalです。ここで重要なのは、この値を空にすることはできないということです。空にした場合、ステートメントが失敗します。

```
set property 'default_workload_group' = 'g1';
```
このステートメントを実行した後、現在のユーザーのクエリはデフォルトで'g1' Workload Groupを使用します。


2. セッション変数を通じてWorkload Groupを指定する場合、デフォルトは空です：

```
set workload_group = 'g1';
```
両方の方法を使用してユーザーのWorkload Groupを指定する場合、セッション変数がユーザープロパティよりも優先されます。

## Workload Groupの表示
1. SHOW文を使用してWorkload Groupを表示できます：

```
show workload groups;
```
詳細は [SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS) で確認できます

2. システムテーブルを通じて Workload Group を表示できます：

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
より詳細は [ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP) を参照してください

## Workload Group の削除

```
mysql [information_schema]>drop workload group g1;
Query OK, 0 rows affected (0.01 sec)
```
詳細は[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)で確認できます

## CPUソフトリミットとハードリミットモード間の切り替えの説明
現在、DorisはCPUソフトリミットとハードリミットの同時実行をサポートしていません。任意の時点で、DorisクラスターはCPUソフトリミットモードまたはCPUハードリミットモードのいずれかでのみ動作できます。
ユーザーはこれら2つのモード間を切り替えることができ、切り替え方法は以下の通りです：

1 現在のクラスター設定がデフォルトのCPUソフトリミットに設定されており、CPUハードリミットに変更したい場合、Workload Groupのcpu_hard_limitパラメータを有効な値に変更する必要があります。

```
alter workload group test_group properties ( 'cpu_hard_limit'='20%' );
```
クラスター内のすべてのWorkload Groupを変更する必要があり、すべてのWorkload Groupのcpu_hard_limitの累積値は100%を超えることはできません。

CPUハード制限は自動的に有効な値を持つことができないため、プロパティを変更せずに単純にスイッチを有効にするだけでは、CPUハード制限が有効になりません。

2 すべてのFEノードでCPUハード制限を有効にする

```
1 Modify the configuration in the fe.conf file on the disk.
experimental_enable_cpu_hard_limit = true


2 Modify the configuration in memory.
ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
```
ユーザーがCPU hard limitからCPU soft limitに戻したい場合は、すべてのFEノードでenable_cpu_hard_limitの値をfalseに設定する必要があります。
CPU soft limitプロパティであるcpu_shareは、（以前に指定されていない場合）有効な値である1024がデフォルトになります。ユーザーはグループの優先度に基づいてcpu_shareの値を調整できます。

## テスト
### Memory hard limit
Adhoc型のクエリは通常、予測不可能なSQL入力と不確実なメモリ使用量を持ち、少数のクエリが大量のメモリを消費するリスクがあります。
この種のワークロードは別のグループに割り当てることができ、Workload Groupのmemory hard limit機能を使用することで、突然の大きなクエリがすべてのメモリを消費し、他のクエリで利用可能なメモリが不足したり、OOM（Out of Memory）エラーが発生することを防ぐのに役立ちます。
このWorkload Groupのメモリ使用量が設定されたhard limitを超えた場合、システムはクエリを強制終了してメモリを解放し、プロセスのメモリ不足を防ぎます。

**テスト環境**

1 FE、1 BE、BEは96コアと375GBのメモリで構成されています。

テストデータセットはclickbenchで、テスト方法はJMeterを使用してクエリQ29を3つの並行実行で実行することです。

**Workload Groupのmemory hard limitを有効にしないテスト**

1. プロセスのメモリ使用量を確認します。psコマンド出力の4番目の列は、プロセスの物理メモリ使用量をキロバイト（KB）で表します。現在のテスト負荷下で、プロセスが約7.7GBのメモリを使用していることを示しています。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7896792
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 7929692
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         2.0 8101232
    ```
2. Dorisのシステムテーブルを使用してWorkload Groupの現在のメモリ使用量を確認します。Workload Groupのメモリ使用量は約5.8GBです。

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
ここでは、1つのWorkload Groupのみが実行されている場合でも、プロセスメモリ使用量は通常Workload Groupのメモリ使用量よりもはるかに大きいことがわかります。これは、Workload Groupがクエリとロードによって使用されるメモリのみを追跡するためです。メタデータやさまざまなキャッシュなど、プロセス内の他のコンポーネントによって使用されるメモリは、Workload Groupのメモリ使用量の一部としてカウントされず、Workload Groupによって管理されることもありません。

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
エラーメッセージから、Workload Groupが1.7Gのメモリを使用していることが確認できますが、Workload Groupの制限は1.69Gです。計算は以下のとおりです：1.69G = 物理マシンメモリ（375G）* mem_limit（be.confの値、デフォルトは0.9）* 0.5%（Workload Groupの設定）。
これは、Workload Groupで設定されたメモリ割合が、BEプロセスで利用可能なメモリに基づいて計算されることを意味します。

**推奨事項**

上記のテストで実証されたように、メモリハード制限はWorkload Groupのメモリ使用量を制御できますが、メモリを解放するためにクエリを終了させることで制御を行います。このアプローチはユーザーエクスペリエンスの低下を招く可能性があり、極端な場合にはすべてのクエリが失敗する可能性があります。

そのため、本番環境では、メモリハード制限をクエリキューイング機能と併用することが推奨されます。これにより、クエリの成功率を維持しながら、制御されたメモリ使用量を確保できます。

### CPUハード制限
Dorisワークロードは一般的に3つのタイプに分類できます：
1. Core Report Queries：これらは通常、会社の役員がレポートを閲覧するために使用されます。負荷はそれほど高くない場合がありますが、可用性要件は厳格です。これらのクエリは、より高い優先度のソフト制限を持つグループに割り当てることができ、リソースが不十分な場合により多くのCPUリソースを確実に受け取ることができます。
2. Adhocクエリは通常、探索的で分析的な性質を持ち、ランダムなSQLで予測不可能なリソース消費を伴います。それらの優先度は通常低いです。そのため、CPUハード制限を使用してこれらのクエリを管理し、より低い値を設定して過度なCPUリソース使用によるクラスター可用性の低下を防ぐことができます。
3. ETLクエリは通常、固定されたSQLと安定したリソース消費を持ちますが、上流データの増加によりリソース使用量が時折急増する場合があります。そのため、CPUハード制限を設定してこれらのクエリを管理することができます。

異なるワークロードはCPU消費量が異なり、ユーザーは異なるレイテンシー要件を持ちます。BE CPUが完全に使用されると、可用性が低下し、応答時間が増加します。たとえば、Adhoc分析クエリがクラスター全体のCPUを完全に使用すると、Core Reportクエリがより高いレイテンシーを経験し、SLAに影響を与える可能性があります。そのため、異なるワークロードを分離し、クラスターの可用性とSLAを確保するためのCPU分離メカニズムが必要です。

Workload GroupはCPUソフト制限とハード制限の両方をサポートします。現在、本番環境ではハード制限でWorkload Groupを設定することが推奨されます。これは、CPUソフト制限が通常、CPUが完全に使用されている場合にのみ優先度効果を示すためです。ただし、CPUが完全に使用されると、Doris内部コンポーネント（RPCコンポーネントなど）とオペレーティングシステムの利用可能なCPUが削減され、全体的なクラスター可用性が大幅に低下します。そのため、本番環境では、CPUリソースの枯渇を回避することが不可欠であり、同じロジックがメモリなどの他のリソースにも適用されます。

**テスト環境**

1 FE、1 BE、96コアマシン。
データセットはclickbenchで、テストSQLはq29です。

**テスト**
1. JMeterを使用して3つの同時クエリを開始し、BEプロセスのCPU使用率を比較的高い使用率まで押し上げます。テストマシンは96コアで、topコマンドを使用すると、BEプロセスのCPU使用率が7600%であることがわかります。これは、プロセスが現在76コアを使用していることを意味します。

   ![use workload group cpu](/images/workload-management/use_wg_cpu_1.png)

2. 現在使用されているWorkload GroupのCPUハード制限を10%に変更します。

    ```sql
    alter workload group g2 properties('cpu_hard_limit'='10%');
    ```
3. CPU ハード制限モードに切り替えます。

    ```sql
    ADMIN SET FRONTEND CONFIG ("enable_cpu_hard_limit" = "true");
    ```
4. クエリの負荷テストを再実行すると、現在のプロセスが9〜10コアしか使用できないことが確認でき、これは総コア数の約10%です。

   ![use workload group cpu](/images/workload-management/use_wg_cpu_2.png)

この効果をより反映しやすいクエリワークロードを使用してテストを実施することが重要です。負荷テストを行う場合、Compactionがトリガーされ、実際の観測値がWorkload Groupで設定した値よりも高くなる可能性があります。現在、CompactionワークロードはWorkload Groupで管理されていません。

5. Linuxシステムコマンドの使用に加えて、Dorisのシステムテーブルを通じてグループの現在のCPU使用率を観測することもでき、CPU使用率は約10%です。

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

1. 設定時は、すべてのグループの総CPU割り当てをちょうど100%に設定しないほうが良いです。これは主に低レイテンシシナリオの可用性を確保するためで、他のコンポーネント用にリソースを予約する必要があるからです。ただし、レイテンシにそれほど敏感でなく、最大限のリソース使用率を目指すシナリオでは、すべてのグループの総CPU割り当てを100%に設定することを検討できます。
2. 現在、FEからBEへのWorkload Groupメタデータの同期間隔は30秒です。そのため、Workload Groupの設定変更が有効になるまでに最大30秒かかる場合があります。


### ローカルIOの制限
OLAPシステムでは、ETL操作や大規模なAdhocクエリの際に、大量のデータを読み取る必要があります。データ分析プロセスを高速化するため、Dorisは複数のディスクファイルにわたってマルチスレッド並列スキャンを使用し、これにより大量のディスクIOが発生し、他のクエリ（レポート分析など）に影響を与える可能性があります。
Workload Groupを使用することで、DorisはオフラインのETLデータ処理とオンラインのレポートクエリを個別にグループ化し、オフラインデータ処理のIO帯域幅を制限できます。これにより、オフラインデータ処理がオンラインレポート分析に与える影響を軽減できます。

**テスト環境**

1 FE、1 BE、96コアマシン。データセット：clickbench。テストクエリ：q29。

**IOハード制限を有効にしないテスト**
1. Cacheをクリア。

    ```sql
    // clear OS cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    // disable BE page cache
    disable_storage_page_cache = true
    ```
2. clickbenchテーブルに対してフルテーブルスキャンを実行し、単一の並行クエリを実行します。

    ```sql
    set dry_run_query = true;
    select * from hits.hits;
    ```
3. Dorisのシステムテーブルを通じて、現在のGroupの最大スループットが3GB毎秒であることを確認します。

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
2. Workload Groupの設定を変更して、最大スループットを毎秒100Mに制限します。

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
1. システムテーブルのLOCAL_SCAN_BYTES_PER_SECONDフィールドは、プロセスレベルでの現在のWorkload Groupの統計の合計値を表します。例えば、12個のファイルパスが設定されている場合、LOCAL_SCAN_BYTES_PER_SECONDはこれら12個のファイルパスの最大IO値になります。各ファイルパスのIOスループットを個別に表示したい場合は、Grafanaで詳細な値を確認できます。

2. オペレーティングシステムとDorisのPage Cacheの存在により、LinuxのIO監視スクリプトで観測されるIOは通常、システムテーブルで表示されるIOより小さくなります。


### リモートIOの制限
BrokerLoadとS3Loadは、大規模なデータロードでよく使用される方法です。ユーザーは最初にデータをHDFSまたはS3にアップロードし、その後BrokerLoadとS3Loadを使用してデータを並列でロードできます。ロードプロセスを高速化するために、DorisはマルチスレッドでHDFS/S3からデータを取得しますが、これによりHDFS/S3に大きな負荷が生じ、HDFS/S3で実行されている他のジョブが不安定になる可能性があります。

他のワークロードへの影響を軽減するため、Workload Groupのリモート IO制限機能を使用して、HDFS/S3からのロードプロセス中に使用される帯域幅を制限できます。これにより、他のビジネス運用への影響を軽減できます。


**テスト環境**

1つのFEと1つのBEが同一マシン上にデプロイされ、16コアと64GBのメモリで構成されています。テストデータはclickbenchデータセットで、テスト前にデータセットをS3にアップロードする必要があります。アップロード時間を考慮して、1000万行のデータのみをアップロードし、その後TVF機能を使用してS3からデータをクエリします。

アップロードが成功した後、コマンドを使用してスキーマ情報を表示できます。

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
2. システムテーブルを使用して現在のリモートIOスループットを確認します。このクエリのリモートIOスループットが1秒あたり837MBであることが示されています。ここでの実際のIOスループットは環境に大きく依存することに注意してください。BEをホストしているマシンが外部ストレージへの帯域幅が制限されている場合、実際のスループットはより低くなる可能性があります。

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
3. sar コマンド（sar -n DEV 1 3600）を使用してマシンのネットワーク帯域幅を監視します。マシンレベルでの最大ネットワーク帯域幅が1秒あたり1033 MBであることが示されています。
   出力の最初の列は、マシン上の特定のネットワークインターフェースが1秒あたりに受信したバイト数を表し、単位はKB/秒です。

   ![use workload group rio](/images/workload-management/use_wg_rio_1.png)

**リモートread IOの制限をテスト**
1. Workload Groupの設定を変更して、リモートread IOのスループットを1秒あたり100Mに制限します。

    ```sql
    alter workload group normal properties('remote_read_bytes_per_second'='104857600');
    ```
2. 単一の並行フルテーブルスキャンクエリを開始する。

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
3. システムテーブルを使用して、現在のリモート読み取りIOスループットを確認します。この時点で、IOスループットは約100M程度で、いくらかの変動があります。これらの変動は現在のアルゴリズム設計の影響を受けており、通常は短時間でピークに達し、長時間持続することはないため、正常な動作と考えられます。

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
4. sar コマンド (sar -n DEV 1 3600) を使用して、現在のネットワークカードの受信トラフィックを監視します。最初の列は1秒あたりに受信されるデータ量を表します。観測される最大値は現在207M per secondであり、read IOの制限が有効であることを示しています。ただし、sarコマンドはマシンレベルのトラフィックを反映するため、観測される値はDorisが報告するものよりわずかに高くなります。

   ![use workload group rio](/images/workload-management/use_wg_rio_2.png)

## よくある質問
1. CPUハード制限の設定が有効にならないのはなぜですか？
* これは通常、以下の理由によって引き起こされます：
    * 環境の初期化に失敗しました。Doris CGroupパス配下の2つの設定ファイルを確認する必要があります。
      ここでは、CGroup V1バージョンを例に説明します。ユーザーがDoris CGroupパスを```/sys/fs/cgroup/cpu/doris/```として指定した場合、
      まず```/sys/fs/cgroup/cpu/doris/query/1/tasks```の内容にWorkload Groupに対応するスレッドIDが含まれているかを確認してください。
      パスの「1」はWorkload Group IDを表し、```top -H -b -n 1 -p pid```コマンドを実行してWorkload GroupのスレッドIDを確認できます。
      確認後、Workload GroupのスレッドIDがtasksファイルに書き込まれていることを確認してください。
      次に、```/sys/fs/cgroup/cpu/doris/query/1/cpu.cfs_quota_us```の値が-1かどうかを確認します。-1の場合、CPUハード制限の設定が有効になっていないことを意味します。
    * Doris BEプロセスのCPU使用量が、Workload Groupに設定されたCPUハード制限よりも高くなっています。
      これは期待される動作です。なぜなら、Workload Groupによって管理されるCPUは主にクエリスレッドとLoadのmemtable flushスレッド用だからです。
      しかし、BEプロセスには通常、Compactionなど他のCPUを消費するコンポーネントもあります。
      そのため、プロセスのCPU使用量は通常、Workload Groupに設定された制限よりも高くなります。
      クエリロードのみに負荷をかけるテスト用Workload Groupを作成し、システムテーブル```information_schema.workload_group_resource_usage```を通じて
      Workload GroupのCPU使用量を確認できます。
      このテーブルはWorkload GroupのCPU使用量のみを記録し、バージョン2.1.6以降でサポートされています。
    * 一部のユーザーが```cpu_resource_limit```を設定しています。まず、```show property for jack like 'cpu_resource_limit'```を実行して、
      ユーザーjackのプロパティでこのパラメータが設定されているかを確認します。
      次に、```show variables like 'cpu_resource_limit'```を実行して、このパラメータがセッション変数に設定されているかを確認します。
      このパラメータのデフォルト値は-1で、設定されていないことを示します。
      このパラメータを設定すると、クエリはWorkload Groupによって管理されない独立したスレッドプールによって処理されます。このパラメータを直接変更すると、本番環境の安定性に影響を与える可能性があります。
      このパラメータで設定されたクエリロードを、Workload Groupによって管理されるように段階的に移行することをお勧めします。
      現在、このパラメータの代替手段はセッション変数```num_scanner_threads```です。主なプロセスは以下の通りです：
      まず、```cpu_resource_limit```を設定したユーザーをいくつかのバッチに分けます。最初のバッチのユーザーを移行する際、
      これらのユーザーのセッション変数```num_scanner_threads```を1に変更します。次に、これらのユーザーにWorkload Groupを割り当てます。その後、
      ```cpu_resource_limit```を-1に変更し、一定期間クラスタの安定性を観察します。クラスタが安定している場合、次のバッチのユーザーの移行を続けます。

2. デフォルトのWorkload Group数が15に制限されているのはなぜですか？
* Workload Groupは主に単一マシン上でのリソース分割に使用されます。
  1台のマシンで多くのWorkload Groupを作成しすぎると、各Workload Groupが受け取るリソースが非常に少なくなります。
  ユーザーが本当にこれだけの数のWorkload Groupを作成する必要がある場合、
  クラスタを複数のBEグループに分割し、各BEグループに対して異なるWorkload Groupを作成することを検討できます。
  また、FE設定```workload_group_max_num```を変更することで、一時的にこの制限を回避することも可能です。

3. 多くのWorkload Groupを設定した後に「Resource temporarily unavailable」エラーが発生するのはなぜですか？
* 各Workload Groupは独立したスレッドプールに対応します。
  多くのWorkload Groupを作成しすぎると、BEプロセスが多すぎるスレッドの開始を試行し、
  オペレーティングシステムによってプロセスに許可される最大スレッド数を超える可能性があります。
  この問題を解決するには、BEプロセスがより多くのスレッドを作成できるようにシステム環境設定を変更してください。
