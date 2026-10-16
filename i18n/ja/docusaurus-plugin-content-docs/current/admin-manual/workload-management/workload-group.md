---
{
    "title": "Workload Group：Doris プロセス内のリソース分離ガイド",
    "sidebar_label": "Workload Group",
    "language": "ja",
    "description": "Workload Group を使用して Doris の BE プロセス内で CPU、メモリ、IO リソースを細かく分離し、高負荷のクエリがオンライン業務に影響するのを防ぐ方法を説明します。",
    "keywords": ["Workload Group", "リソース分離", "CPU 制限", "メモリ制限", "IO 制限", "CGroup", "クエリのキューイング", "ワークロード管理", "Workload Group の設定", "Doris のリソース管理"]
}
---

<!-- Knowledge type: Architecture decision -->

Workload Group は、Doris プロセス内でリソースを論理的に分離する仕組みです。BE プロセス内の CPU、メモリ、IO リソースを細かく分割し、異なる業務ワークロードが相互に干渉しないようにします。

![Workload Group の構成](/images/workload_group_arch.png)

現在、次の三種類のリソース分離をサポートしています。

- **CPU リソース**：CPU のソフトリミット（最低保証）とハードリミット（上限）をサポートします。
- **メモリリソース**：メモリのソフトリミットとハードリミットをサポートします。
- **IO リソース**：ローカルファイルとリモートファイルの読み取りによって生じる IO 帯域幅を制限できます。

:::tip プロセス内分離とプロセス間分離

Workload Group はプロセス内でリソースを分離します。これは Resource Group や Compute Group などのプロセス間分離とは根本的に異なります。

1. **プロセス内分離**では、共有キャッシュや RPC スレッドプールなど、分離できない共有コンポーネントがあります。制御がない場合に比べて影響は大幅に小さくなりますが、高負荷のタスクが低負荷のタスクのレイテンシーに影響する可能性は残ります。
2. **選択の目安**：ある程度のレイテンシーを許容でき、コストを抑えたい場合は Workload Group を選択します。完全な分離が必要で、追加コストを許容できる場合は Resource Group または Compute Group を選択し、優先度の高いワークロードを専用の BE ノードに割り当てます。

:::

## バージョンに関する注意事項

<!-- Knowledge type: Configuration parameters -->

| バージョン | 説明 |
|---------|-------------|
| Doris 2.0 | Workload Group 機能を導入。CGroup に依存しません。 |
| Doris 2.1 | Workload Group に CGroup が必要になりました。システムが削除できない `normal` グループを自動作成します。 |
| Doris 4.0 | CPU のソフトリミット／ハードリミットの概念を `min_cpu_percent`／`max_cpu_percent` に、メモリのソフトリミット／ハードリミットの概念を `min_memory_percent`／`max_memory_percent` に統一しました。 |

**アップグレード時の注意事項**：

- **1.2 → 2.0**：クラスター全体のアップグレードが完了してから Workload Group 機能を有効にすることを推奨します。一部の follower FE ノードだけをアップグレードすると、未アップグレードのノードにメタデータがなく、クエリが失敗する可能性があります。
- **2.0 → 2.1**：先に CGroup 環境を設定してから、バージョン 2.1 にアップグレードします。

## 主要なプロパティ

<!-- Knowledge type: Configuration parameters -->

### CPU リソースのパラメータ

| パラメータ | 値の範囲 | 説明 |
|-----------|-------------|-------------|
| `MIN_CPU_PERCENT` | [0%, 100%] | この Workload Group に確保する CPU 帯域幅の最小値です。CPU の競合時には他のグループがこの帯域幅を奪えません。リソースが空いているときは、この値を超えて使用できます。 |
| `MAX_CPU_PERCENT` | [0%, 100%] | この Workload Group の CPU 帯域幅の上限です。現在の CPU 使用率にかかわらず、このグループの CPU 使用率はこの値を超えません。 |

制約：すべての Workload Group の `MIN_CPU_PERCENT` の合計は 100% を超えられず、`MIN_CPU_PERCENT` は `MAX_CPU_PERCENT` を超えられません。

**利用シナリオの例**：同じ Doris インスタンスを、営業部門（CPU 使用量が多く優先度が高い）とマーケティング部門（CPU 使用量が多く優先度が低い）が共有しているとします。営業部門の Workload Group に `min_cpu_percent` を 40%、マーケティング部門の Workload Group に `max_cpu_percent` を 30% 設定すると、営業業務に安定した CPU リソースを確保できます。

### メモリリソースのパラメータ

| パラメータ | 値の範囲 | 説明 |
|-----------|-------------|-------------|
| `MIN_MEMORY_PERCENT` | [0%, 100%] | この Workload Group に確保するメモリの最小量です。メモリが不足すると、システムはこの値に従ってメモリを割り当てます。必要に応じて一部のクエリを強制終了してメモリを解放し、他のグループが十分なメモリを使用できるようにします。 |
| `MAX_MEMORY_PERCENT` | [0%, 100%] | この Workload Group のメモリ上限です。クエリが使用するメモリがこの値を超えると、ディスクへのスピルが発生するか、クエリが強制終了されます。 |

制約：すべての Workload Group の `MIN_MEMORY_PERCENT` の合計は 100% を超えられず、`MIN_MEMORY_PERCENT` は `MAX_MEMORY_PERCENT` を超えられません。

### その他のプロパティ

| プロパティ名 | データ型 | デフォルト値 | 値の範囲 | 説明 |
|---------------|-----------|---------------|-------------|-------------|
| `max_concurrency` | 整数 | 2147483647 | [0, 2147483647] | クエリの最大同時実行数です。デフォルトでは制限しません。実行中のクエリ数が上限に達すると、新しいクエリはキューイング処理に入ります。 |
| `max_queue_size` | 整数 | 0 | [0, 2147483647] | クエリキューの長さです。デフォルトの 0 はキューイングしないことを意味します。キューが満杯になると、新しいクエリは即座に失敗します。 |
| `queue_timeout` | 整数 | 0 | [0, 2147483647] | クエリがキュー内で待機できる最大時間（ミリ秒）です。デフォルトの 0 はキューイングしないことを意味し、クエリはキューに入った直後に失敗します。 |
| `scan_thread_num` | 整数 | -1 | [1, 2147483647] | 現在の Workload Group がスキャンに使用するスレッド数です。-1 に設定すると、BE 設定の `doris_scanner_thread_pool_thread_num` の値を使用します。 |
| `max_remote_scan_thread_num` | 整数 | -1 | [1, 2147483647] | 外部データソースを読み取るスキャンスレッドプールの最大スレッド数です。-1 に設定すると、BE が自動的に決定します（通常はコア数に関連します）。 |
| `min_remote_scan_thread_num` | 整数 | -1 | [1, 2147483647] | 外部データソースを読み取るスキャンスレッドプールの最小スレッド数です。-1 に設定すると、BE が自動的に決定します（通常はコア数に関連します）。 |
| `read_bytes_per_second` | 整数 | -1 | [1, 9223372036854775807] | Doris の内部テーブルを読み取る際の最大 IO スループット（バイト/秒）です。デフォルトの -1 は無制限を意味します。この値はディスクではなくフォルダーに適用され、スピルファイルのディレクトリにも適用されます。 |
| `remote_read_bytes_per_second` | 整数 | -1 | [1, 9223372036854775807] | Doris の外部テーブルを読み取る際の最大 IO スループット（バイト/秒）です。デフォルトの -1 は無制限を意味します。 |

## Workload Group の設定

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Pre-deployment check / Environment acceptance -->

### ステップ 1：CGroup 環境を設定する

Workload Group の CPU 管理は CGroup コンポーネントに依存します。メモリと IO のリソースのみを管理する場合は、この手順を省略できます。

**1. CGroup のバージョンを確認する**

```shell
cat /proc/filesystems | grep cgroup
nodev	cgroup
nodev	cgroup2
nodev	cgroupfs
```

出力の `cgroup` は CGroup V1 が、`cgroup2` は CGroup V2 がインストールされていることを示します。

**2. 現在有効なバージョンを確認する**

```shell
# If this path exists, the currently effective version is CGroup V1
/sys/fs/cgroup/cpu/

# If this path exists, the currently effective version is CGroup V2
/sys/fs/cgroup/cgroup.controllers
```

**3. CGroup パスの下に doris ディレクトリを作成する**

```shell
# CGroup V1: create under the cpu directory
mkdir /sys/fs/cgroup/cpu/doris

# CGroup V2: create under the cgroup directory
mkdir /sys/fs/cgroup/doris
```

**4. BE プロセスに読み取り、書き込み、実行の権限を付与する**

```shell
# CGroup V1
chmod 770 /sys/fs/cgroup/cpu/doris
chown -R doris:doris /sys/fs/cgroup/cpu/doris

# CGroup V2
chmod 770 /sys/fs/cgroup/doris
chown -R doris:doris /sys/fs/cgroup/doris
```

**5. CGroup V2 の追加操作（V1 では省略）**

CGroup ディレクトリ間でプロセスを移動できるように、ルートディレクトリの `cgroup.procs` ファイルの権限を変更します。

```shell
chmod a+w /sys/fs/cgroup/cgroup.procs
```

doris ディレクトリで cpu コントローラーが有効か確認します。`doris/cgroup.controllers` に `cpu` が含まれない場合は、次のコマンドを実行して有効にします。

```shell
# After successful execution, a cpu.max file appears under the doris directory, and the output of cgroup.controllers includes cpu
# If it fails, the parent directory has not enabled the cpu controller either; enable it for the parent directory first
echo +cpu > ../cgroup.subtree_control
```

**6. CGroup パスを指定するように BE 設定を変更する**

```shell
# CGroup V1
doris_cgroup_cpu_path = /sys/fs/cgroup/cpu/doris

# CGroup V2
doris_cgroup_cpu_path = /sys/fs/cgroup/doris
```

**7. BE を再起動する**

再起動後、`add thread xxx to group` が `be.INFO` ログに表示されれば、設定は成功です。

:::tip CGroup の使用上の注意

1. 各マシンには BE インスタンスを一つだけデプロイすることを推奨します。現在の Workload Group 機能は、同じマシンへの複数 BE のデプロイをサポートしていません。
2. マシンを再起動すると、CGroup パス下の設定は消去されます。設定を永続化するには、作成と権限付与の操作を systemd のシステムサービスに登録し、再起動時に自動実行します。
3. コンテナー内で CGroup を使用する場合、コンテナーにはホストを操作する権限が必要です。

:::

#### コンテナー内で Workload Group を使用する

<!-- Knowledge type: Operational steps -->

Workload Group の CPU 管理は CGroup に基づいて実装されています。コンテナー内で使用する場合は、Doris プロセスがホストの CGroup ファイルを読み書きできるよう、コンテナーを特権モードで起動します。

コンテナー内の CPU リソースは、コンテナーに割り当てられたリソースからさらに分割されます。たとえば、ホストに 64 コアがあり、コンテナーに 8 コアが割り当てられ、Workload Group の CPU ハードリミットを 50% に設定した場合、実際に使用できるのは 4 コア（8 コア × 50%）です。

Workload Group のメモリ管理と IO 管理は Doris 内部で実装されており、外部コンポーネントには依存しません。コンテナーで使用する場合と物理マシンで使用する場合に違いはありません。Kubernetes で Doris を使用する場合は、基盤となる権限の詳細を抽象化する Doris Operator によるデプロイを推奨します。

### ステップ 2：Workload Group を作成する

<!-- Knowledge type: Operational steps -->

```sql
CREATE WORKLOAD GROUP IF NOT EXISTS g1
PROPERTIES (
    "cpu_share" = "1024"
);
```

ここで設定する CPU 制限はソフトリミットです。バージョン 2.1 以降、システムは削除できない `normal` という名前のグループを自動作成します。

:::caution クラウドモードでは Compute Group の明示的な指定が必要
この文書にある CREATE / ALTER / DROP WORKLOAD GROUP の例では、すべて `FOR <compute_group>` 句を省略しています。そのまま実行できるのは、デフォルトのリソースグループに適用される **非クラウドモード（ストレージとコンピュートの結合モード）** のみです。

**クラウドモード（ストレージとコンピュートの分離モード）では、`FOR <compute_group>` 句を明示する必要があります**。指定しない場合、`Must specify compute group via 'FOR <compute_group>' in cloud mode.` というエラーで失敗します。詳細は [Workload Group と Compute Group の紐付け](./workload-group-bind-compute-group) を参照してください。
:::

完全な構文については、[CREATE-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/CREATE-WORKLOAD-GROUP) を参照してください。

### ステップ 3：ユーザーに権限を付与し、Workload Group を紐付ける

<!-- Knowledge type: Operational steps -->

**ユーザー権限を確認する**

`information_schema.workload_groups` システムテーブルを照会し、現在のユーザーが使用を許可されている Workload Group を表示します。

```sql
SELECT name FROM information_schema.workload_groups;
+--------+
| name   |
+--------+
| normal |
| g1     |
+--------+
```

**権限を付与する**

ユーザーに対象の Workload Group が表示されない場合は、管理者アカウントで GRANT ステートメントを実行します。

```sql
GRANT USAGE_PRIV ON WORKLOAD GROUP 'g1' TO 'user_1'@'%';
```

認可に関するその他の操作については、[GRANT-TO](../../sql-manual/sql-statements/account-management/GRANT-TO) を参照してください。

**紐付け方法**

紐付け方法は二つあります。セッション変数はユーザープロパティより優先されます。

| 紐付け方法 | コマンド | 説明 |
|----------------|---------|-------------|
| ユーザープロパティ（永続） | `SET PROPERTY 'default_workload_group' = 'g1';` | ユーザーが使用するデフォルトの Workload Group です。空にはできません。 |
| セッション変数（一時的） | `SET workload_group = 'g1';` | 現在のセッションでのみ有効です。デフォルトでは空です。 |

## Workload Group の管理

<!-- Knowledge type: Operational steps -->

### Workload Group を表示する

**方法 1：SHOW ステートメント**

```sql
SHOW WORKLOAD GROUPS;
```

参照：[SHOW-WORKLOAD-GROUPS](../../sql-manual/sql-statements/cluster-management/compute-management/SHOW-WORKLOAD-GROUPS)

**方法 2：システムテーブルを照会する**

```sql
SELECT * FROM information_schema.workload_groups WHERE name = 'g1';
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| ID    | NAME | CPU_SHARE | MEMORY_LIMIT | ENABLE_MEMORY_OVERCOMMIT | MAX_CONCURRENCY | MAX_QUEUE_SIZE | QUEUE_TIMEOUT | CPU_HARD_LIMIT | SCAN_THREAD_NUM | MAX_REMOTE_SCAN_THREAD_NUM | MIN_REMOTE_SCAN_THREAD_NUM | MEMORY_LOW_WATERMARK | MEMORY_HIGH_WATERMARK | TAG  | READ_BYTES_PER_SECOND | REMOTE_READ_BYTES_PER_SECOND |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
| 14009 | g1   |      1024 | -1           | true                     |      2147483647 |              0 |             0 | -1             |              -1 |                         -1 |                         -1 | 50%                  | 80%                   |      |                    -1 |                           -1 |
+-------+------+-----------+--------------+--------------------------+-----------------+----------------+---------------+----------------+-----------------+----------------------------+----------------------------+----------------------+-----------------------+------+-----------------------+------------------------------+
1 row in set (0.05 sec)
```

### Workload Group を変更する

```sql
ALTER WORKLOAD GROUP g1 PROPERTIES('min_cpu_percent' = '2048');

SELECT cpu_share FROM information_schema.workload_groups WHERE name = 'g1';
+-----------+
| cpu_share |
+-----------+
|      2048 |
+-----------+
1 row in set (0.02 sec)
```

参照：[ALTER-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/ALTER-WORKLOAD-GROUP)

### Workload Group を削除する

```sql
DROP WORKLOAD GROUP g1;
```

参照：[DROP-WORKLOAD-GROUP](../../sql-manual/sql-statements/cluster-management/compute-management/DROP-WORKLOAD-GROUP)

## 効果の検証

<!-- Knowledge type: Operational steps -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

以下のテストはすべて、ClickBench データセットを使用し、1 FE + 1 BE（96 コア、メモリ 375 GB）の環境で実施しました。

### メモリのハードリミットの効果を検証する

アドホッククエリは入力とメモリ使用量が不確定で、少数のクエリがメモリを使い切るおそれがあります。このようなワークロードを別のグループに割り当ててメモリのハードリミットを設定すると、突発的な大規模クエリによる OOM や、他のクエリで使用可能なメモリの枯渇を防げます。この Workload Group のメモリ使用量がハードリミットを超えると、クエリを強制終了してメモリを解放します。

**メモリのハードリミットを有効にしない場合**

jmeter を使用して q29 を同時実行数 3 で発行します。ps コマンドでは、プロセスのメモリ使用量は約 7.7 GB です。

```sql
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7896792
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 7929692
[ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
1407481 doris_be         2.0 8101232
```

システムテーブルを照会すると、Workload Group のメモリ使用量は約 5.8 GB です。（メタデータや Cache などは Workload Group の統計に含まれないため、プロセスのメモリ使用量は通常、単一の Workload Group の使用量よりかなり大きくなります。）

```sql
SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5797.524360656738 |
+-------------------+
1 row in set (0.01 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5840.246627807617 |
+-------------------+
1 row in set (0.02 sec)

SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
+-------------------+
| wg_mem_used_mb    |
+-------------------+
| 5878.394917488098 |
+-------------------+
1 row in set (0.02 sec)
```

**メモリのハードリミットを有効にした場合**

1. メモリ制限を 1% に設定します。

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('memory_limit' = '1%');
    ```

2. 同じテストを実行します。システムテーブルでは、メモリ使用量が約 1.5 GB に減少しています。

    ```sql
    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 1575.3877239227295 |
    +--------------------+
    1 row in set (0.02 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +------------------+
    | wg_mem_used_mb   |
    +------------------+
    | 1668.77405834198 |
    +------------------+
    1 row in set (0.01 sec)

    SELECT MEMORY_USAGE_BYTES / 1024 / 1024 AS wg_mem_used_mb FROM workload_group_resource_usage WHERE workload_group_id = 11201;
    +--------------------+
    | wg_mem_used_mb     |
    +--------------------+
    | 499.96760272979736 |
    +--------------------+
    1 row in set (0.01 sec)
    ```

3. ps コマンドでは、プロセスのメモリ使用量が約 3.8 GB に減少しています。

    ```sql
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4071364
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4059012
    [ ~]$ ps -eo pid,comm,%mem,rss | grep 1407481
    1407481 doris_be         1.0 4057068
    ```

4. クライアント側では、メモリ不足によるクエリの失敗が確認できます。

    ```text
    1724074250162,14126,1c_sql,HY000 1105,"java.sql.SQLException: errCode = 2, detailMessage = (127.0.0.1)[MEM_LIMIT_EXCEEDED]GC wg for hard limit, wg id:11201, name:g2, used:1.71 GB, limit:1.69 GB, backend:10.16.10.8. cancel top memory used tracker <Query#Id=4a0689936c444ac8-a0d01a50b944f6e7> consumption 1.71 GB. details:process memory used 3.01 GB exceed soft limit 304.41 GB or sys available memory 101.16 GB less than warning water mark 12.80 GB., Execute again after enough memory, details see be.INFO.",concurrency 1-3,text,false,,444,0,3,3,null,0,0,0
    ```

:::tip 使用上の推奨事項

メモリのハードリミットはクエリを強制終了してメモリを解放するため、極端な場合はすべてのクエリが失敗する可能性があります。本番環境では、メモリのハードリミットとクエリのキューイング機能を併用し、メモリ使用量を制御しながらクエリの成功率も確保することを推奨します。

:::

### CPU のハードリミットの効果を検証する

Doris の代表的なワークロードは三種類に分かれます。それぞれの推奨設定は次のとおりです。

| ワークロードの種類 | 特徴 | 推奨設定 |
|---------------|-----------------|---------------------------|
| 主要なレポート用クエリ | CPU 使用量が多く、高い可用性が必要 | CPU のソフトリミットを設定し、優先度を高くする |
| アドホッククエリ | SQL が不定で、リソース使用量が不明 | CPU のハードリミットを低い値に設定する |
| ETL クエリ | SQL は固定されているが、リソース使用量が時折急増する | オンライン業務への影響を防ぐため、CPU のハードリミットを設定する |

BE の CPU が飽和すると、RPC コンポーネントなどの内部コンポーネントが使用できる CPU も減り、クラスター全体の可用性が明らかに低下します。そのため、本番環境ではソフトリミットよりも **CPU のハードリミットを推奨します**。

**テスト環境**：1 FE、1 BE、96 コアのマシン。データセットは ClickBench、テスト SQL は q29 です。

1. jmeter でクエリを 3 件同時に発行し、BE プロセスの CPU 使用率を高めます。（top コマンドには CPU 使用率が 7600%、つまり約 76 コアと表示されます。）

    ![Workload Group 使用時の CPU 使用率（制限前）](/images/workload-management/use_wg_cpu_1.png)

2. Workload Group の CPU ハードリミットを 10% に変更します。

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('max_cpu_percent' = '10%');
    ```

3. 負荷テストを再実行します。プロセスが使用できるのは約 9～10 コア、つまり総コア数の 10% です。

    ![Workload Group 使用時の CPU 使用率（制限後）](/images/workload-management/use_wg_cpu_2.png)

4. システムテーブルで CPU 使用率が約 10% に制御されていることを確認します。

    ```sql
    SELECT CPU_USAGE_PERCENT FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +-------------------+
    | CPU_USAGE_PERCENT |
    +-------------------+
    |              9.57 |
    +-------------------+
    1 row in set (0.02 sec)
    ```

:::tip 注意事項

1. レイテンシーを抑える必要がある場合に他のコンポーネントが使えるリソースを残すため、すべての Workload Group の CPU 設定値の合計をちょうど 100% にしないことを推奨します。レイテンシーが問題にならず、リソース使用率を最大化したい場合は、合計を 100% に設定できます。
2. FE が Workload Group のメタデータを BE に同期する間隔は 30 秒です。変更の反映には最大 30 秒かかる場合があります。

:::

:::tip 高スループットのデータ取り込みに関する注意

CPU のハードリミットをテストするには、クエリワークロードを使用する方が正確です。高スループットのデータ取り込みでは Compaction が発生し、観測値が Workload Group の設定値を超える場合があります。現在、Compaction ワークロードは Workload Group の管理対象ではないためです。

:::

### ローカル IO のハードリミットの効果を検証する

OLAP システムで ETL や大規模なアドホッククエリを実行すると、複数のスレッドで多くのディスクファイルを並列にスキャンするため、大量のディスク IO が発生し、他のオンラインクエリに影響します。オフライン ETL タスクに IO 帯域幅の上限を設定すると、オンラインのレポート作成や分析への影響を軽減できます。

**テスト環境**：1 FE、1 BE、96 コアのマシン。データセットは ClickBench です。

**IO のハードリミットを有効にしない場合**

1. キャッシュを無効にします。

    ```sql
    -- Clear the operating system cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- Disable the BE page cache
    disable_storage_page_cache = true
    ```

2. ClickBench テーブルを単独で全表スキャンします。

    ```sql
    SET dry_run_query = true;
    SELECT * FROM hits.hits;
    ```

3. システムテーブルを照会すると、最大スループットは約 3 GB/s です。

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 1146.6208400726318 |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 3496.2762966156006 |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 2192.7690029144287 |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. pidstat コマンドでプロセスの IO を確認します（最初の列はプロセス ID、次の列は読み取り IO スループットで、単位は KB/s）。制限がない場合、最大スループットは約 2 GB/s です。

    ![Workload Group 使用時の IO スループット（制限前）](/images/workload-management/use_wg_io_1.png)

**IO のハードリミットを有効にした場合**

1. キャッシュを無効にします。

    ```sql
    -- Clear the operating system cache
    sync; echo 3 > /proc/sys/vm/drop_caches

    -- Disable the BE page cache
    disable_storage_page_cache = true
    ```

2. 最大読み取りスループットを 100 MB/s に制限します。

    ```sql
    ALTER WORKLOAD GROUP g2 PROPERTIES('read_bytes_per_second' = '104857600');
    ```

3. システムテーブルでは、最大 IO スループットが約 98 MB/s に制御されています。

    ```sql
    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 97.94296646118164  |
    +--------------------+
    1 row in set (0.03 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.37584781646729  |
    +--------------------+
    1 row in set (0.04 sec)

    SELECT LOCAL_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS mb_per_sec FROM workload_group_resource_usage WHERE WORKLOAD_GROUP_ID = 11201;
    +--------------------+
    | mb_per_sec         |
    +--------------------+
    | 98.06641292572021  |
    +--------------------+
    1 row in set (0.02 sec)
    ```

4. pidstat ツールでプロセスの最大 IO スループットを確認すると、約 131 MB/s です。

    ![Workload Group 使用時の IO スループット（制限後）](/images/workload-management/use_wg_io_2.png)

:::tip 注意事項

1. システムテーブルの `LOCAL_SCAN_BYTES_PER_SECOND` はプロセスレベルの集計値です。ファイルパスが 12 個設定されている場合、この値は 12 個のパスそれぞれの IO の最大値です。各ファイルパスの IO スループットの詳細は、Grafana の監視画面で確認してください。
2. オペレーティングシステムと Doris の Page Cache があるため、Linux の IO 監視スクリプトで観測される IO は、通常、システムテーブルの値より小さくなります。

:::

### リモート IO のハードリミットの効果を検証する

BrokerLoad と S3Load は、大量データの取り込みによく使われる方法です。Doris が複数のスレッドで HDFS/S3 からデータを並列取得すると、外部ストレージに大きな負荷がかかり、他のジョブの安定性に影響します。リモート IO 帯域幅の上限を設定すると、取り込みが他の業務に及ぼす影響を軽減できます。

**テスト環境**：同じマシンに 1 FE + 1 BE をデプロイし、16 コア、メモリ 64 GB を使用します。テストデータは ClickBench データセットの 10 百万行で、S3 にアップロードされています。

スキーマ情報を表示します。

```sql
DESC FUNCTION s3 (
    "URI" = "https://bucketname/1kw.tsv",
    "s3.access_key" = "ak",
    "s3.secret_key" = "sk",
    "format" = "csv",
    "use_path_style" = "true"
);
```

**リモート読み取り IO を制限しない場合**

1. 単独で全表スキャンを実行します。

    ```sql
    -- Set to scan data only, do not return results
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

2. システムテーブルでは、リモート IO スループットは約 837 MB/s です。（実際のスループットは、BE と外部ストレージの間の帯域幅に左右されます。）

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     837 |
    +---------+
    1 row in set (0.104 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.070 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     867 |
    +---------+
    1 row in set (0.186 sec)
    ```

3. `sar -n DEV 1 3600` でマシンのネットワーク帯域幅を確認します（最初の列は毎秒の受信バイト数で、単位は KB/s）。マシンレベルの最大ネットワーク帯域幅は約 1033 MB/s です。

    ![Workload Group 使用時のリモート IO スループット（制限前）](/images/workload-management/use_wg_rio_1.png)

**リモート読み取り IO を制限した場合**

1. リモート読み取り IO スループットを 100 MB/s に制限します。

    ```sql
    ALTER WORKLOAD GROUP normal PROPERTIES('remote_read_bytes_per_second' = '104857600');
    ```

2. 単独で全表スキャンを実行します。

    ```sql
    SET dry_run_query = true;

    SELECT * FROM s3(
        "URI" = "https://bucketname/1kw.tsv",
        "s3.access_key" = "ak",
        "s3.secret_key" = "sk",
        "format" = "csv",
        "use_path_style" = "true"
    );
    ```

3. システムテーブルでは、リモート読み取り IO スループットが約 100 MB/s に制御されています。（アルゴリズムの設計上、値は変動し、短時間のピークは正常です。）

    ```sql
    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |      56 |
    +---------+
    1 row in set (0.010 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     131 |
    +---------+
    1 row in set (0.009 sec)

    SELECT CAST(REMOTE_SCAN_BYTES_PER_SECOND / 1024 / 1024 AS INT) AS read_mb FROM information_schema.workload_group_resource_usage;
    +---------+
    | read_mb |
    +---------+
    |     111 |
    +---------+
    1 row in set (0.009 sec)
    ```

4. `sar -n DEV 1 3600` で NIC の受信トラフィックを確認します（最初の列は毎秒の受信データ量です）。最大値は約 207 MB/s になり、IO 制限が有効になっています。（sar コマンドにはマシンレベルのトラフィックが表示されるため、通常は Doris の統計値より大きくなります。）

    ![Workload Group 使用時のリモート IO スループット（制限後）](/images/workload-management/use_wg_rio_2.png)

## よくある質問

<!-- Knowledge type: Configuration parameters -->
<!-- Applicable scenarios: Troubleshooting / Performance tuning -->

### Q：CPU のハードリミットを設定しても有効にならない
1. **環境の初期化に失敗している**：CGroup V1 パスの `/sys/fs/cgroup/cpu/doris/query/1/tasks` ファイルに、該当する Workload Group のスレッド ID が含まれているか確認します（ID は `top -H -b -n 1 -p pid` で取得します）。また、`cpu.cfs_quota_us` の値が -1 か確認します（-1 の場合、ハードリミットは有効ではありません）。
2. **BE プロセスの CPU 使用率が設定値を超える**：Workload Group は、クエリスレッドとデータ取り込み時の memtable フラッシュスレッドを管理します。BE 内の他のコンポーネント（Compaction など）も CPU を消費するため、プロセスの CPU 使用率は通常、Workload Group の設定値より高くなります。テスト用 Workload Group を作成し、`information_schema.workload_group_resource_usage` でそのグループ自体の CPU 使用率を確認できます（バージョン 2.1.6 以降でサポート）。
3. **`cpu_resource_limit` パラメータが設定されている**：`SHOW PROPERTY FOR jack LIKE 'cpu_resource_limit'` と `SHOW VARIABLES LIKE 'cpu_resource_limit'` を実行して、このパラメータが設定されているか確認します（デフォルト値の -1 は未設定を意味します）。このパラメータが設定されていると、クエリは独立したスレッドプールを使用し、Workload Group の管理対象になりません。移行するには、ユーザーの `num_scanner_threads` を 1 に設定して Workload Group を指定し、`cpu_resource_limit` を -1 に変更する手順を段階的に進めることを推奨します。動作が安定するまで観察してから、次の段階に進んでください。

### Q：デフォルトで Workload Group の数が 15 に制限される
Workload Group は単一マシンのリソースを分割します。グループが多すぎると、各グループに割り当てられるリソースが少なくなります。業務上どうしても多くのグループが必要な場合は、クラスターを複数の BE セットに分け、それぞれに異なる Workload Group を作成することを検討してください。FE 設定の `workload_group_max_num` を変更して、一時的にこの制限を回避することもできます。

### Q：多くの Workload Group を設定すると「Resource temporarily unavailable」エラーが発生する
各 Workload Group は独立したスレッドプールの集合です。作成数が多すぎると、BE プロセスが起動しようとするスレッド数が、オペレーティングシステムの許容上限を超える場合があります。対処するには、オペレーティングシステムの設定を変更し、BE プロセスがより多くのスレッドを作成できるようにします。
